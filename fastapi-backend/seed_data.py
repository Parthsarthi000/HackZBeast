"""
Seed the Neon DB with one user and a few flashcards so the dashboard and
flashcards pages show data. Run from fastapi-backend with:
  python -m seed_data
Requires DATABASE_URL in .env.local (or .env).
"""
import asyncio
import os

from dotenv import load_dotenv

load_dotenv(".env.local")
load_dotenv()


async def main() -> None:
    try:
        import asyncpg
    except ImportError:
        print("Install asyncpg: pip install asyncpg")
        raise SystemExit(1)

    url = os.getenv("DATABASE_URL")
    if not url:
        print("Set DATABASE_URL in .env.local (or .env) and run again.")
        raise SystemExit(1)

    conn = await asyncpg.connect(url)

    try:
        # Insert one user if none exist (avoid duplicate key issues)
        n_users = await conn.fetchval("SELECT COUNT(*) FROM users")
        if n_users == 0:
            await conn.execute(
                """
                INSERT INTO users (name, email, target_language, daily_goal, total_words, stories_read, quizzes_passed, current_streak, extension_connected)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """,
                "Demo User",
                "demo@example.com",
                "Japanese",
                10,
                0,
                0,
                0,
                0,
                False,
            )
            print("Inserted 1 user (Demo User).")
        else:
            print("Users already exist, skipping user insert.")

        # Insert a few sample flashcards if none exist
        n_cards = await conn.fetchval("SELECT COUNT(*) FROM flashcards")
        if n_cards == 0:
            sample_cards = [
                ("こんにちは", "Hello", "こんにちは、元気ですか。", "expression"),
                ("ありがとう", "Thank you", "ありがとうございます。", "expression"),
                ("本", "Book", "この本は面白いです。", "noun"),
            ]
            for word, translation, example, pos in sample_cards:
                await conn.execute(
                    """
                    INSERT INTO flashcards (word, translation, example, part_of_speech)
                    VALUES ($1, $2, $3, $4)
                    """,
                    word,
                    translation,
                    example,
                    pos,
                )
            print(f"Inserted {len(sample_cards)} sample flashcards.")
        else:
            print(f"Flashcards already exist ({n_cards} rows), skipping flashcard insert.")

    finally:
        await conn.close()

    print("Seed done. Restart the backend and refresh the app to see data.")


if __name__ == "__main__":
    asyncio.run(main())
