"""Generate stories from latest context + flashcards via MiniMax and save to Neon."""

import json
import os
import re

import httpx

from save_new_context import MINIMAX_BASE, MINIMAX_MODEL, _extract_first_json

# Placeholder image for generated stories (stories.image is NOT NULL)
DEFAULT_STORY_IMAGE = "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400"


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


def _build_story_prompt(context_row: dict, vocab_list: list[dict]) -> str:
    original = context_row.get("original_text") or ""
    grammar = context_row.get("grammar_rules") or ""
    vocab_str = "\n".join(
        f"- {v.get('word', '')} ({v.get('translation', '')})" for v in vocab_list[:25]
    )
    return f'''Generate a short language-learning story (3-5 paragraphs) that:
1. Uses the following grammar rules in natural ways: {grammar}
2. Is inspired by or related to this theme/source text: {original[:300]}
3. Weaves in these vocabulary words naturally (mark each occurrence in the story with **word** around the word, e.g. **marché**).

Vocabulary to use:
{vocab_str}

Respond with ONLY one JSON object (no markdown). Use exactly these keys:
- "title": string (short story title)
- "description": string (1-2 sentence summary)
- "content": string (full story body; wrap every vocabulary word in **word**)
- "level": exactly one of "Beginner", "Intermediate", "Advanced"
- "reading_time": string e.g. "3 min read"
- "tags": array of 2-4 short strings e.g. ["market", "daily life"]
- "vocabulary": array of objects, each with "word", "translation", "count" (how many times that word appears in content)
Output only the JSON object.'''


async def _generate_one_story(context_row: dict, vocab_list: list[dict]) -> dict:
    prompt = _build_story_prompt(context_row, vocab_list)
    content = await _call_minimax(prompt)
    content = re.sub(r"^```(?:json)?\s*", "", content.strip())
    content = re.sub(r"\s*```\s*$", "", content)
    out = _extract_first_json(content)
    title = str(out.get("title") or "Untitled Story").strip()
    description = str(out.get("description") or "").strip()
    body = str(out.get("content") or "").strip()
    level = str(out.get("level") or "Beginner").strip()
    if level not in ("Beginner", "Intermediate", "Advanced"):
        level = "Beginner"
    reading_time = str(out.get("reading_time") or "— min read").strip()
    raw_tags = out.get("tags")
    tags = [str(t).strip() for t in raw_tags] if isinstance(raw_tags, list) else []
    raw_vocab = out.get("vocabulary") or []
    vocabulary = []
    for v in raw_vocab if isinstance(raw_vocab, list) else []:
        if not isinstance(v, dict):
            continue
        vocabulary.append({
            "word": str(v.get("word") or "").strip(),
            "translation": str(v.get("translation") or "").strip(),
            "count": int(v.get("count", 1)) if v.get("count") is not None else 1,
        })
    return {
        "title": title or "Untitled Story",
        "description": description or "A generated story.",
        "content": body or "",
        "level": level,
        "reading_time": reading_time,
        "tags": tags,
        "vocabulary": vocabulary,
    }


async def generate_stories(pool, max_stories: int = 2) -> list[dict]:
    """
    Fetch latest context rows and flashcards from DB, generate up to max_stories
    stories via MiniMax (one per context), save to stories + story_vocabulary, return created stories.
    """
    async with pool.acquire() as conn:
        contexts = await conn.fetch(
            """
            SELECT id, original_text, grammar_rules
            FROM context
            ORDER BY created_at DESC
            LIMIT $1
            """,
            max_stories,
        )
        flashcards = await conn.fetch(
            """
            SELECT word, translation FROM (
                SELECT DISTINCT ON (word) word, translation, created_at
                FROM flashcards
                ORDER BY word, created_at DESC
            ) sub
            ORDER BY sub.created_at DESC
            LIMIT 30
            """
        )
    if not contexts:
        return []

    vocab_list = [{"word": r["word"], "translation": r["translation"]} for r in flashcards]
    created = []
    for ctx in contexts:
        try:
            story_data = await _generate_one_story(dict(ctx), vocab_list)
        except (httpx.HTTPError, json.JSONDecodeError, ValueError) as e:
            continue
        if not story_data.get("title") or not story_data.get("content"):
            continue
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO stories (title, description, reading_time, level, vocabulary_count, image, tags, content)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, title, description, reading_time, level, vocabulary_count, image, tags, content
                """,
                story_data["title"],
                story_data["description"],
                story_data["reading_time"],
                story_data["level"],
                len(story_data["vocabulary"]),
                DEFAULT_STORY_IMAGE,
                story_data["tags"],
                story_data["content"],
            )
            story_id = row["id"]
            for v in story_data["vocabulary"]:
                if not v.get("word"):
                    continue
                await conn.execute(
                    """
                    INSERT INTO story_vocabulary (story_id, word, translation, count)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (story_id, word) DO UPDATE SET translation = EXCLUDED.translation, count = EXCLUDED.count
                    """,
                    story_id,
                    v["word"],
                    v["translation"],
                    v.get("count", 1),
                )
            created.append({
                "id": story_id,
                "title": row["title"],
                "description": row["description"],
                "readingTime": row["reading_time"],
                "level": row["level"],
                "vocabularyCount": row["vocabulary_count"],
                "image": row["image"],
                "tags": row["tags"] or [],
                "content": row["content"],
                "vocabularyWords": story_data["vocabulary"],
            })
    return created
