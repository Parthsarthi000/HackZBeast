# HackZBeast

**HackZBeast** presents **Flash Lang** — a language-learning web app built around the principle of continuous immersion. Users can manage spaced-repetition flashcards, read AI-generated stories tailored to their current vocabulary level, take adaptive quizzes, and track their progress over time.

What sets Flash Lang apart is its complementary browser extension — a seamless tool that translates sentences as you browse the web, and automatically feeds that real-world context back into your learning pipeline. Encountered a word on a Japanese news article? It becomes a flashcard. That flashcard gets reinforced in a personalized AI story. That story gets tested in a quiz. The loop never breaks.

Most language apps teach you in isolation. Flash Lang puts you in the world. By combining structured SRS learning with organic, real-world immersion, Flash Lang aims to 10x your language acquisition — not by making you study more, but by making everything you do online count as study.

**→ [Try Flash Lang](https://flash-lang.netlify.app)** (live on Netlify)

---

## What’s in this repo

| Folder | Description |
|--------|--------------|
| **`flashlang/`** | Frontend: React 19 + Vite 7 + TypeScript. Dashboard, Flashcards, Stories, Quizzes, Profile, Login. |
| **`fastapi-backend/`** | Backend: FastAPI + Neon (Postgres) + MiniMax (translations, stories, quizzes). |

- **Frontend** talks to the backend via REST (e.g. `GET /api/dashboard`, `GET /api/flashcards`). In production it uses the Railway backend URL; locally it uses `http://localhost:8000`.
- **Backend** stores users, flashcards, context, stories, and quizzes in Neon. It uses MiniMax for word translation, story generation, and quiz generation.

---

## Quick start

### 1. Backend (FastAPI)

```bash
cd fastapi-backend
# Create .env.local with: DATABASE_URL, MINI_MAX_API_KEY, and optionally CORS_ORIGINS
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- **DATABASE_URL**: Neon Postgres connection string.  
- **MINI_MAX_API_KEY**: For `/save-word`, `/process-selection`, story/quiz generation.  
- **CORS_ORIGINS**: Allowed frontend origin(s), e.g. `https://flash-lang.netlify.app` (default includes this).

Optional: seed DB with a user and sample flashcards:

```bash
cd fastapi-backend
python -m seed_data
```

### 2. Frontend (React)

```bash
cd flashlang
npm install
npm run dev
```

- App: **http://localhost:5173**  
- In dev it calls **http://localhost:8000** for the API.

Build and preview:

```bash
cd flashlang
npm run build
npm run preview   # serves on http://localhost:4173
```

---

## Project layout

### `flashlang/`

- **`src/app/`** – App code  
  - **`config.ts`** – API base URL (production → Railway; dev → localhost).  
  - **`layouts/root-layout.tsx`** – Header (“Flash Lang”), nav (Dashboard, Flashcards, Stories, Quizzes, Profile).  
  - **`pages/`** – Dashboard, Flashcards, Stories, Story detail, Quizzes, Quiz-taking, Profile, Login, Not-found.  
  - **`components/`** – UI (buttons, cards, etc.) and shared pieces (e.g. `flashcard`, `empty-state-illustration`).  
- **`src/routes.tsx`** – React Router routes.  
- **`API Format.md`** – Expected backend JSON shapes for dashboard, flashcards, stories, quizzes, profile.

### `fastapi-backend/`

- **`main.py`** – FastAPI app, CORS, and all HTTP endpoints.  
- **`database.py`** – Neon connection pool (`DATABASE_URL`).  
- **`save_new_context.py`** – MiniMax integration for translate, save-word, process-selection; writes to `flashcards` and `context`.  
- **`story_generator.py`** – Story generation (MiniMax), writes to `stories` and `story_vocabulary`.  
- **`quiz_generator.py`** – Quiz generation (MiniMax), writes to `quizzes` and `quiz_questions`.  
- **`seed_data.py`** – Seeds one user and sample flashcards (no MiniMax).

---

## Main endpoints (backend)

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/dashboard` | Dashboard data (user, stats, recent words, recommendations). |
| GET | `/api/profile` | User profile (or default Guest if none). |
| GET | `/api/flashcards` | List of flashcards (distinct by word). |
| GET | `/api/stories` | List of stories. |
| GET | `/api/stories/:id` | Single story + vocabulary. |
| GET | `/api/quizzes` | List of quizzes. |
| GET | `/api/quizzes/:id` | Single quiz + questions. |
| POST | `/api/stories/generate` | Generate stories (MiniMax + DB). |
| POST | `/api/quizzes/generate` | Generate a quiz (MiniMax + DB). |
| POST | `/save-word` | Save one word (MiniMax + DB). |
| POST | `/process-selection` | Process selected text: translation, vocab, grammar; save to flashcards + context. |

---

## Deploy

- **Frontend**: Netlify (build from `flashlang/`, build command `npm run build`). Production API URL is hardcoded in `flashlang/src/app/config.ts` (Railway).  
- **Backend**: Railway (or any host). Set `DATABASE_URL`, `MINI_MAX_API_KEY`, and `CORS_ORIGINS` (e.g. `https://flash-lang.netlify.app`).

---


