import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from database import create_pool, get_database_url
from quiz_generator import generate_quiz
from story_generator import generate_stories
from save_new_context import (
    ProcessSelectionBody,
    SaveWordBody,
    TranslateBody,
    handle_process_selection,
    handle_save_word,
    handle_translate,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await create_pool(get_database_url())
    yield
    await app.state.pool.close()


app = FastAPI(lifespan=lifespan)

# CORS: allow any localhost port (dev 5173, preview/build 4173, etc.) and CORS_ORIGINS for production.
_cors_origins = os.getenv("CORS_ORIGINS", "")
_cors_list = [o.strip() for o in _cors_origins.split(",") if o.strip()]
# Regex: allow http://localhost:<port> and http://127.0.0.1:<port> so build on 4173 and dev on 5173 both work
_origin_regex = r"http://(localhost|127\.0\.0\.1)(:\d+)?"
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_list,
    allow_origin_regex=_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/translate")
async def translate(body: TranslateBody):
    """Receive text + optional url from extension; return translation data."""
    return handle_translate(body)


@app.post("/save-word")
async def save_word(request: Request, body: SaveWordBody):
    """Receive word payload from extension; translate via MiniMax, save to Neon, return success."""
    return await handle_save_word(body, request.app.state.pool)


@app.post("/process-selection")
async def process_selection(request: Request, body: ProcessSelectionBody):
    """
    For highlighted sentence/phrase: MiniMax extracts translation, vocabulary, grammar.
    Saves vocab to flashcards, original_text + grammar_rules to context. Returns translation + confirmation.
    """
    return await handle_process_selection(body, request.app.state.pool)


@app.get("/api/stories")
async def list_stories(request: Request):
    """List all stories (latest first) for the stories grid."""
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, title, description, reading_time, level, vocabulary_count, image, tags
            FROM stories
            ORDER BY id DESC
            """
        )
    return [
        {
            "id": r["id"],
            "title": (r["title"] or ""),
            "description": (r["description"] or ""),
            "readingTime": str(r["reading_time"]) if r["reading_time"] is not None else "0",
            "level": (r["level"] or "Beginner"),
            "vocabularyCount": int(r["vocabulary_count"]) if r["vocabulary_count"] is not None else 0,
            "image": (r["image"] or ""),
            "tags": r["tags"] if isinstance(r["tags"], list) else ([] if r["tags"] is None else [r["tags"]]),
        }
        for r in rows
    ]


@app.get("/api/stories/{story_id:int}")
async def get_story(request: Request, story_id: int):
    """Get one story by id with vocabulary for the detail page."""
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, title, description, reading_time, level, vocabulary_count, image, tags, content FROM stories WHERE id = $1",
            story_id,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Story not found")
        vocab = await conn.fetch(
            "SELECT word, translation, count FROM story_vocabulary WHERE story_id = $1 ORDER BY word",
            story_id,
        )
    return {
        "id": row["id"],
        "title": row["title"],
        "content": row["content"] or "",
        "vocabularyWords": [{"word": r["word"], "translation": r["translation"], "count": r["count"]} for r in vocab],
        "readingTime": row["reading_time"],
        "level": row["level"],
    }


@app.post("/api/stories/generate")
async def generate_stories_endpoint(request: Request):
    """
    Use latest context rows + flashcards from DB, call MiniMax to generate up to 2 stories,
    save to Neon, return the created stories.
    """
    pool = request.app.state.pool
    try:
        created = await generate_stories(pool, max_stories=2)
        return {"success": True, "stories": created, "count": len(created)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/quizzes/generate")
async def generate_quiz_endpoint(request: Request):
    """Generate one quiz from latest flashcards via MiniMax and save to Neon."""
    pool = request.app.state.pool
    try:
        quiz = await generate_quiz(pool)
        if quiz is None:
            return {"success": False, "quiz": None, "message": "No flashcards in DB or generation failed."}
        return {"success": True, "quiz": quiz}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/quizzes")
async def list_quizzes(request: Request):
    """List all quizzes for the quizzes grid."""
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, title, description, questions, difficulty, completed, score, progress
            FROM quizzes
            ORDER BY id
            """
        )
    return [
        {
            "id": r["id"],
            "title": (r["title"] or ""),
            "description": (r["description"] or ""),
            "questions": int(r["questions"]) if r["questions"] is not None else 0,
            "difficulty": (r["difficulty"] or "Beginner"),
            "completed": bool(r["completed"]) if r["completed"] is not None else False,
            "score": int(r["score"]) if r["score"] is not None else None,
            "progress": int(r["progress"]) if r["progress"] is not None else 0,
        }
        for r in rows
    ]


@app.get("/api/quizzes/{quiz_id:int}")
async def get_quiz(request: Request, quiz_id: int):
    """Get one quiz by id with questions for the quiz-taking page."""
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        quiz = await conn.fetchrow(
            "SELECT id, title FROM quizzes WHERE id = $1",
            quiz_id,
        )
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        rows = await conn.fetch(
            """
            SELECT id, type, question, options, correct_answer, explanation
            FROM quiz_questions
            WHERE quiz_id = $1
            ORDER BY id
            """,
            quiz_id,
        )
    return {
        "questions": [
            {
                "id": r["id"],
                "type": r["type"],
                "question": r["question"],
                "options": r["options"] if r["options"] is not None else None,
                "correctAnswer": r["correct_answer"],
                "explanation": r["explanation"],
            }
            for r in rows
        ],
    }


@app.get("/api/flashcards")
async def get_flashcards(request: Request):
    """Fetch unique flashcards (one per word, latest row wins) from Neon, latest first."""
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT sub.id, sub.word, sub.translation, sub.example, sub.part_of_speech, sub.status
            FROM (
                SELECT DISTINCT ON (word) id, word, translation, example, part_of_speech, status, created_at
                FROM flashcards
                ORDER BY word, created_at DESC
            ) sub
            ORDER BY sub.created_at DESC
            """
        )
    return [
        {
            "id": r["id"],
            "word": r["word"] or "",
            "translation": r["translation"] or "",
            "example": r["example"] or "",
            "partOfSpeech": r["part_of_speech"] or "noun",
            "status": (r["status"] or "new") if (r["status"] in ("new", "learning", "mastered")) else "new",
        }
        for r in rows
    ]


@app.get("/api/dashboard")
async def get_dashboard(request: Request):
    """Aggregate user, stats, daily goal, recent words, and recommendations for the dashboard."""
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        user_row = await conn.fetchrow(
            "SELECT name, current_streak, total_words, daily_goal, target_language FROM users ORDER BY created_at ASC LIMIT 1"
        )
        n_flashcards = await conn.fetchval(
            "SELECT COUNT(*) FROM (SELECT 1 FROM (SELECT DISTINCT ON (word) id FROM flashcards) sub) x"
        )
        n_stories = await conn.fetchval("SELECT COUNT(*) FROM stories")
        n_quizzes_done = await conn.fetchval("SELECT COUNT(*) FROM quizzes WHERE completed = true")
        recent = await conn.fetch(
            """
            SELECT word, translation FROM (
                SELECT DISTINCT ON (word) word, translation, created_at FROM flashcards ORDER BY word, created_at DESC
            ) sub
            ORDER BY sub.created_at DESC
            LIMIT 8
            """
        )
        latest_story = await conn.fetchrow(
            "SELECT id, title, description, level FROM stories ORDER BY id DESC LIMIT 1"
        )
        latest_quiz = await conn.fetchrow(
            "SELECT id, title, description, difficulty FROM quizzes ORDER BY id DESC LIMIT 1"
        )
    language = (user_row["target_language"] if user_row else None) or "Japanese"
    user_name = (user_row["name"] if user_row else None) or "Guest"
    streak = int(user_row["current_streak"]) if user_row and user_row.get("current_streak") is not None else 0
    words_this_week = int(user_row["total_words"]) if user_row and user_row.get("total_words") is not None else 0
    daily_target = int(user_row["daily_goal"]) if user_row and user_row.get("daily_goal") is not None else 10
    recent_words = [
        {"word": r["word"], "translation": r["translation"], "language": language.title()}
        for r in recent
    ]
    recommendations = []
    if latest_story:
        recommendations.append({
            "id": latest_story["id"],
            "title": latest_story["title"],
            "type": "Story",
            "description": latest_story["description"] or "Practice with this story",
            "tag": (latest_story["level"] or "Beginner"),
        })
    if latest_quiz:
        recommendations.append({
            "id": latest_quiz["id"],
            "title": latest_quiz["title"],
            "type": "Quiz",
            "description": latest_quiz["description"] or "Test your knowledge",
            "tag": (latest_quiz["difficulty"] or "Beginner"),
        })
    return {
        "user": {"name": user_name, "streak": streak, "wordsThisWeek": words_this_week},
        "stats": {
            "totalFlashcards": n_flashcards or 0,
            "storiesAvailable": n_stories or 0,
            "quizzesCompleted": n_quizzes_done or 0,
        },
        "dailyGoal": {"current": 0, "target": daily_target},
        "recentWords": recent_words,
        "recommendations": recommendations,
    }


@app.get("/api/profile")
async def get_profile(request: Request):
    """Fetch user profile from Neon DB (read-only in UI)."""
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT name, email, target_language, daily_goal,
                   total_words, stories_read, quizzes_passed, current_streak,
                   extension_connected
            FROM users
            ORDER BY created_at ASC
            LIMIT 1
            """
        )
    if not row:
        return {
            "name": "Guest",
            "email": "",
            "targetLanguage": "Japanese",
            "dailyGoal": "10",
            "extensionConnected": False,
            "totalWords": 0,
            "storiesRead": 0,
            "quizzesPassed": 0,
            "currentStreak": 0,
        }
    return {
        "name": row["name"],
        "email": row["email"] or "",
        "targetLanguage": row["target_language"] or "Japanese",
        "dailyGoal": str(row["daily_goal"]) if row["daily_goal"] is not None else "10",
        "extensionConnected": bool(row["extension_connected"]),
        "totalWords": int(row["total_words"]) if row["total_words"] is not None else 0,
        "storiesRead": int(row["stories_read"]) if row["stories_read"] is not None else 0,
        "quizzesPassed": int(row["quizzes_passed"]) if row["quizzes_passed"] is not None else 0,
        "currentStreak": int(row["current_streak"]) if row["current_streak"] is not None else 0,
    }
