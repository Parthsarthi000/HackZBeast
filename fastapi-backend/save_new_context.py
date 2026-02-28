"""Request models and handlers for extension actions: translate, save-word."""

import json
import os
import re

import httpx


def _extract_first_json(s: str) -> dict:
    """Extract and parse the first complete JSON object from the string (handles trailing text)."""
    s = s.strip()
    start = s.find("{")
    if start == -1:
        raise json.JSONDecodeError("No JSON object found", s, 0)
    depth = 0
    in_string = False
    escape = False
    quote = None
    for i in range(start, len(s)):
        c = s[i]
        if escape:
            escape = False
            continue
        if c == "\\" and in_string:
            escape = True
            continue
        if not in_string:
            if c in ('"', "'"):
                in_string = True
                quote = c
                continue
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return json.loads(s[start : i + 1])
        else:
            if c == quote:
                in_string = False
    raise json.JSONDecodeError("Unterminated JSON object", s, start)
from pydantic import BaseModel, ConfigDict

MINIMAX_BASE = "https://api.minimax.io"
MINIMAX_MODEL = "M2-her"
ALLOWED_POS = ("noun", "verb", "adjective", "adverb", "interjection", "particle", "expression")


class TranslateBody(BaseModel):
    text: str
    url: str | None = None


class SaveWordBody(BaseModel):
    model_config = ConfigDict(extra="allow")
    word: str | None = None
    meaning: str | None = None
    url: str | None = None
    sentence: str | None = None


class ProcessSelectionBody(BaseModel):
    """Selected/highlighted text from frontend (sentence or phrase)."""
    text: str
    url: str | None = None


def handle_translate(body: TranslateBody) -> dict:
    """Process translate request; returns response data for extension."""
    # Stub: echo back (TODO: call translation API)
    return {
        "success": True,
        "data": {
            "original": body.text,
            "translation": body.text,
        },
    }


async def _get_flashcard_from_minimax(word: str) -> dict:
    """Call MiniMax to get translation, example, part_of_speech for the word."""
    api_key = os.getenv("MINI_MAX_API_KEY")
    if not api_key:
        raise ValueError("MINI_MAX_API_KEY is not set")
    prompt = f"""For the word "{word}", respond with ONLY a single JSON object (no markdown, no code block). Keys must be exactly: word, translation, example, part_of_speech.
- word: the original word "{word}"
- translation: English translation (or target language translation if the word is English)
- example: one short example sentence using the word
- part_of_speech: exactly one of: noun, verb, adjective, adverb, interjection, particle, expression"""
    payload = {
        "model": MINIMAX_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_completion_tokens": 512,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{MINIMAX_BASE}/v1/text/chatcompletion_v2",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
        )
    r.raise_for_status()
    data = r.json()
    content = (data.get("choices") or [{}])[0].get("message", {}).get("content") or ""
    # Strip markdown code block if present
    content = re.sub(r"^```(?:json)?\s*", "", content.strip())
    content = re.sub(r"\s*```\s*$", "", content)
    out = _extract_first_json(content)
    word_val = str(out.get("word") or word).strip()
    translation = str(out.get("translation") or "").strip()
    example = str(out.get("example") or "").strip()
    pos = str(out.get("part_of_speech") or "noun").strip().lower()
    if pos not in ALLOWED_POS:
        pos = "noun"
    return {
        "word": word_val or word,
        "translation": translation or word,
        "example": example or word,
        "part_of_speech": pos,
    }


async def _get_translation_vocab_grammar_from_minimax(selected_text: str) -> dict:
    """Call MiniMax to get translation, vocabulary list, and grammar rules for the selected text."""
    api_key = os.getenv("MINI_MAX_API_KEY")
    if not api_key:
        raise ValueError("MINI_MAX_API_KEY is not set")
    prompt = f'''Given this highlighted text (sentence or phrase), respond with ONLY a single JSON object. No markdown, no code block. Use exactly these keys:
- "translation": full translation of the text into English (or target language if already English).
- "vocabulary": array of objects for each important word/phrase to save as a flashcard. Each object: "word", "translation", "example" (short sentence using the word), "part_of_speech" (exactly one of: noun, verb, adjective, adverb, interjection, particle, expression).
- "grammar_rules": a clear explanation of the grammar patterns or rules used in this text (1-3 short rules).

Text: "{selected_text}"

Output only the JSON object.'''
    payload = {
        "model": MINIMAX_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_completion_tokens": 1024,
    }
    async with httpx.AsyncClient(timeout=45.0) as client:
        r = await client.post(
            f"{MINIMAX_BASE}/v1/text/chatcompletion_v2",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
        )
    r.raise_for_status()
    data = r.json()
    content = (data.get("choices") or [{}])[0].get("message", {}).get("content") or ""
    content = re.sub(r"^```(?:json)?\s*", "", content.strip())
    content = re.sub(r"\s*```\s*$", "", content)
    out = _extract_first_json(content)
    translation = str(out.get("translation") or "").strip()
    grammar_rules = str(out.get("grammar_rules") or "").strip()
    raw_vocab = out.get("vocabulary") or []
    vocabulary = []
    for v in raw_vocab if isinstance(raw_vocab, list) else []:
        if not isinstance(v, dict):
            continue
        pos = str(v.get("part_of_speech") or "noun").strip().lower()
        if pos not in ALLOWED_POS:
            pos = "noun"
        vocabulary.append({
            "word": str(v.get("word") or "").strip(),
            "translation": str(v.get("translation") or "").strip(),
            "example": str(v.get("example") or "").strip(),
            "part_of_speech": pos,
        })
    return {
        "translation": translation or selected_text,
        "grammar_rules": grammar_rules or "No grammar rules extracted.",
        "vocabulary": vocabulary,
    }


async def handle_save_word(body: SaveWordBody, pool) -> dict:
    """Get translation from MiniMax, save to flashcards table, return success."""
    word = (body.word or body.meaning or "").strip()
    if not word:
        return {"success": False, "error": "Missing word"}
    try:
        row = await _get_flashcard_from_minimax(word)
    except (httpx.HTTPError, json.JSONDecodeError, ValueError) as e:
        return {"success": False, "error": str(e)}
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO flashcards (word, translation, example, part_of_speech)
            VALUES ($1, $2, $3, $4)
            """,
            row["word"],
            row["translation"],
            row["example"],
            row["part_of_speech"],
        )
    return {"success": True}


async def handle_process_selection(body: ProcessSelectionBody, pool) -> dict:
    """
    For highlighted sentence/phrase: call MiniMax to get translation, vocabulary, and grammar.
    Save vocabulary to flashcards, save original_text + grammar_rules to context table.
    Return translation and success confirmation to frontend.
    """
    text = (body.text or "").strip()
    if not text:
        return {"success": False, "error": "Missing text", "translation": None}
    try:
        result = await _get_translation_vocab_grammar_from_minimax(text)
    except (httpx.HTTPError, json.JSONDecodeError, ValueError) as e:
        return {"success": False, "error": str(e), "translation": None}
    translation = result["translation"]
    grammar_rules = result["grammar_rules"]
    vocabulary = result["vocabulary"]
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO context (original_text, grammar_rules)
            VALUES ($1, $2)
            """,
            text,
            grammar_rules,
        )
        for v in vocabulary:
            if not (v.get("word") and v.get("translation")):
                continue
            await conn.execute(
                """
                INSERT INTO flashcards (word, translation, example, part_of_speech)
                VALUES ($1, $2, $3, $4)
                """,
                v["word"],
                v["translation"],
                v.get("example") or v["word"],
                v.get("part_of_speech") or "noun",
            )
    return {
        "success": True,
        "translation": translation,
    }
