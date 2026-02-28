"""Generate quizzes from latest flashcards via MiniMax and save to Neon."""

import json
import os
import re

import httpx

from save_new_context import MINIMAX_BASE, MINIMAX_MODEL, _extract_first_json


async def _call_minimax(prompt: str, max_tokens: int = 2048) -> str:
    api_key = os.getenv("MINI_MAX_API_KEY")
    if not api_key:
        raise ValueError("MINI_MAX_API_KEY is not set")
    payload = {
        "model": MINIMAX_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_completion_tokens": max_tokens,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            f"{MINIMAX_BASE}/v1/text/chatcompletion_v2",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
        )
    r.raise_for_status()
    data = r.json()
    return (data.get("choices") or [{}])[0].get("message", {}).get("content") or ""


def _build_quiz_prompt(vocab_list: list[dict]) -> str:
    vocab_str = "\n".join(
        f"- {v.get('word', '')} ({v.get('translation', '')})" for v in vocab_list[:20]
    )
    return f'''Create a short vocabulary quiz for language learners. Use the following words and their translations:

{vocab_str}

Respond with ONLY one JSON object (no markdown). Use exactly these keys:
- "title": string (short quiz title, e.g. "Vocabulary Check")
- "description": string (1 sentence describing the quiz)
- "difficulty": exactly one of "Beginner", "Intermediate", "Advanced"
- "questions": array of 5-8 question objects. Each question has:
  - "type": exactly "multiple-choice" or "fill-blank"
  - "question": string (e.g. "What does X mean?" or "How do you say Y in [language]?")
  - "options": for multiple-choice only: array of 4 strings (one is the correct answer). Omit for fill-blank.
  - "correct_answer": string (the correct answer)
  - "explanation": string (one sentence explaining the answer)
Use a mix of multiple-choice and fill-blank. Base questions only on the vocabulary above.
Output only the JSON object.'''


def _normalize_question(raw: dict) -> dict | None:
    qtype = str(raw.get("type") or "multiple-choice").strip().lower()
    if qtype not in ("multiple-choice", "fill-blank"):
        qtype = "multiple-choice"
    question = str(raw.get("question") or "").strip()
    correct = str(raw.get("correct_answer") or raw.get("correctAnswer") or "").strip()
    explanation = str(raw.get("explanation") or "").strip()
    if not question or not correct:
        return None
    options = None
    if qtype == "multiple-choice":
        opts = raw.get("options")
        if isinstance(opts, list) and len(opts) >= 2:
            options = [str(o).strip() for o in opts if o]
        if not options or correct not in options:
            return None
    return {
        "type": qtype,
        "question": question,
        "options": options,
        "correct_answer": correct,
        "explanation": explanation or "Correct.",
    }


async def generate_quiz(pool, max_questions: int = 8) -> dict | None:
    """
    Fetch latest flashcards from DB, call MiniMax to generate one quiz,
    insert into quizzes + quiz_questions, return the created quiz summary.
    """
    async with pool.acquire() as conn:
        flashcards = await conn.fetch(
            """
            SELECT word, translation FROM (
                SELECT DISTINCT ON (word) word, translation, created_at
                FROM flashcards
                ORDER BY word, created_at DESC
            ) sub
            ORDER BY sub.created_at DESC
            LIMIT 20
            """
        )
    if not flashcards:
        return None

    vocab_list = [{"word": r["word"], "translation": r["translation"]} for r in flashcards]
    prompt = _build_quiz_prompt(vocab_list)
    try:
        content = await _call_minimax(prompt)
    except (httpx.HTTPError, json.JSONDecodeError, ValueError):
        return None
    content = re.sub(r"^```(?:json)?\s*", "", content.strip())
    content = re.sub(r"\s*```\s*$", "", content)
    try:
        out = _extract_first_json(content)
    except json.JSONDecodeError:
        return None
    title = str(out.get("title") or "Vocabulary Quiz").strip()
    description = str(out.get("description") or "Test your vocabulary.").strip()
    difficulty = str(out.get("difficulty") or "Beginner").strip()
    if difficulty not in ("Beginner", "Intermediate", "Advanced"):
        difficulty = "Beginner"
    raw_questions = out.get("questions") or []
    questions = []
    for q in raw_questions if isinstance(raw_questions, list) else []:
        if not isinstance(q, dict):
            continue
        nq = _normalize_question(q)
        if nq and len(questions) < max_questions:
            questions.append(nq)
    if not questions:
        return None

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO quizzes (title, description, questions, difficulty, completed, score, progress)
            VALUES ($1, $2, $3, $4, false, NULL, 0)
            RETURNING id, title, description, questions, difficulty, completed, score, progress
            """,
            title,
            description,
            len(questions),
            difficulty,
        )
        quiz_id = row["id"]
        for q in questions:
            await conn.execute(
                """
                INSERT INTO quiz_questions (quiz_id, type, question, options, correct_answer, explanation)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                quiz_id,
                q["type"],
                q["question"],
                q["options"],
                q["correct_answer"],
                q["explanation"],
            )
        return {
            "id": quiz_id,
            "title": row["title"],
            "description": row["description"],
            "questions": row["questions"],
            "difficulty": row["difficulty"],
            "completed": row["completed"],
            "score": row["score"],
            "progress": row["progress"],
        }
