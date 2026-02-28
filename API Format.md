# API Format

The frontend expects the backend to serve JSON at the following endpoints. The base URL is set via **`VITE_API_URL`** (e.g. `https://api.example.com`). All endpoints use **GET** and must return **`Content-Type: application/json`**.

**Unicode (e.g. Japanese) and ASCII (English)** in the same JSON are fine. JSON is UTF-8; mix script types in strings as needed. Ensure the backend sends responses in UTF-8 (e.g. `Content-Type: application/json; charset=utf-8`) and that DB/API layers use UTF-8 so nothing is corrupted.

---

## 1. Dashboard

**GET** `{baseUrl}/api/dashboard`

Returns the overview data for the dashboard (welcome section, stats, daily goal, recent words, recommendations). Every top-level field is **optional**; missing fields are replaced with defaults (zeros, empty arrays, "Guest").

### Response body (object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user` | object | No | Welcome section |
| `user.name` | string | — | Display name (e.g. "Alex") |
| `user.streak` | number | — | Current streak in days |
| `user.wordsThisWeek` | number | — | Words learned this week |
| `stats` | object | No | Stat cards |
| `stats.totalFlashcards` | number | — | Total flashcard count |
| `stats.storiesAvailable` | number | — | Number of stories |
| `stats.quizzesCompleted` | number | — | Quizzes completed |
| `dailyGoal` | object | No | Daily goal progress |
| `dailyGoal.current` | number | — | Flashcards reviewed today |
| `dailyGoal.target` | number | — | Daily target (e.g. 10) |
| `recentWords` | array | No | Recent activity list |
| `recentWords[].word` | string | — | Word (e.g. "自由") |
| `recentWords[].translation` | string | — | Translation (e.g. "Freedom") |
| `recentWords[].language` | string | — | Language label (e.g. "Japanese") |
| `recommendations` | array | No | Recommended stories/quizzes |
| `recommendations[].id` | number | — | Unique id |
| `recommendations[].title` | string | — | Title |
| `recommendations[].type` | string | — | **"Story"** or **"Quiz"** |
| `recommendations[].description` | string | — | Short description |
| `recommendations[].tag` | string | — | Level/tag (e.g. "Beginner", "Intermediate") |

### Example

```json
{
  "user": {
    "name": "Alex",
    "streak": 7,
    "wordsThisWeek": 25
  },
  "stats": {
    "totalFlashcards": 47,
    "storiesAvailable": 12,
    "quizzesCompleted": 8
  },
  "dailyGoal": {
    "current": 8,
    "target": 10
  },
  "recentWords": [
    { "word": "こんにちは", "translation": "hello", "language": "Japanese" }
  ],
  "recommendations": [
    {
      "id": 1,
      "title": "A Day at the Market",
      "type": "Story",
      "description": "Practice your food vocabulary",
      "tag": "Beginner"
    }
  ]
}
```

---

## 2. Flashcards

**GET** `{baseUrl}/api/flashcards`

Returns the list of flashcards. Response must be a **JSON array**. Each item must include all fields below.

### Response body (array of objects)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique id |
| `word` | string | Yes | Word (e.g. "こんにちは") |
| `translation` | string | Yes | Translation (e.g. "hello") |
| `example` | string | Yes | Example sentence |
| `partOfSpeech` | string | Yes | e.g. "noun", "verb", "adjective", "interjection" |
| `status` | string | Yes | **"new"** \| **"learning"** \| **"mastered"** |

### Example

```json
[
  {
    "id": 1,
    "word": "こんにちは",
    "translation": "hello",
    "example": "こんにちは、元気ですか？",
    "partOfSpeech": "interjection",
    "status": "learning"
  },
  {
    "id": 2,
    "word": "自由",
    "translation": "freedom",
    "example": "俺は自由だ",
    "partOfSpeech": "noun",
    "status": "new"
  }
]
```

---

## 3. Stories

**GET** `{baseUrl}/api/stories`

Returns the list of stories. Response must be a **JSON array**. Each item must include all fields below.

### Response body (array of objects)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique id (used in route `/stories/:id`) |
| `title` | string | Yes | Story title |
| `description` | string | Yes | Short description |
| `readingTime` | string | Yes | e.g. "3 min", "5 min" |
| `level` | string | Yes | **"Beginner"** \| **"Intermediate"** \| **"Advanced"** |
| `vocabularyCount` | number | Yes | Number of vocabulary words |
| `image` | string | Yes | Full image URL |
| `tags` | string[] | Yes | Array of tag strings (e.g. ["Food", "Shopping"]) |

### Example

```json
[
  {
    "id": 1,
    "title": "A Day at the Market",
    "description": "Learn food and shopping vocabulary through a vibrant market scene",
    "readingTime": "3 min",
    "level": "Beginner",
    "vocabularyCount": 12,
    "image": "https://example.com/image.jpg",
    "tags": ["Food", "Shopping"]
  }
]
```

---

## 4. Quizzes

**GET** `{baseUrl}/api/quizzes`

Returns the list of quizzes. Response must be a **JSON array**. Each item must include the fields below. `score` is optional and typically present when `completed` is true.

### Response body (array of objects)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique id (used in route `/quizzes/:id`) |
| `title` | string | Yes | Quiz title |
| `description` | string | Yes | Short description |
| `questions` | number | Yes | Number of questions |
| `difficulty` | string | Yes | **"Beginner"** \| **"Intermediate"** \| **"Advanced"** |
| `completed` | boolean | Yes | Whether the user has completed the quiz |
| `score` | number | No | Score (e.g. 0–100), usually when `completed` is true |
| `progress` | number | Yes | Progress percentage (0–100) |

### Example

```json
[
  {
    "id": 1,
    "title": "Market Vocabulary",
    "description": "Test your knowledge of market and shopping terms",
    "questions": 10,
    "difficulty": "Beginner",
    "completed": true,
    "score": 85,
    "progress": 100
  },
  {
    "id": 2,
    "title": "Daily Routines",
    "description": "Practice common phrases for everyday activities",
    "questions": 12,
    "difficulty": "Beginner",
    "completed": false,
    "progress": 60
  }
]
```

---

## 5. Quiz detail (for quiz-taking page)

**GET** `{baseUrl}/api/quizzes/:id`

Returns a single quiz’s questions for the quiz-taking page. `:id` is the quiz id (e.g. from the list).

### Response body (object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `questions` | array | Yes | List of question objects |
| `questions[].id` | number | Yes | Unique id |
| `questions[].type` | string | Yes | **"multiple-choice"** \| **"fill-blank"** |
| `questions[].question` | string | Yes | Question text |
| `questions[].options` | string[] | No | Required when `type` is `"multiple-choice"` |
| `questions[].correctAnswer` | string | Yes | Exact correct answer (case-insensitive comparison) |
| `questions[].explanation` | string | Yes | Shown after the user submits |

### Example

```json
{
  "questions": [
    {
      "id": 1,
      "type": "multiple-choice",
      "question": "What does \"bonjour\" mean in English?",
      "options": ["Goodbye", "Hello", "Thank you", "Please"],
      "correctAnswer": "Hello",
      "explanation": "\"Bonjour\" is the standard French greeting."
    },
    {
      "id": 2,
      "type": "fill-blank",
      "question": "How do you say \"thank you\" in French?",
      "correctAnswer": "merci",
      "explanation": "\"Merci\" is the French word for \"thank you\"."
    }
  ]
}
```

---

## 6. Story detail (for story-detail page)

**GET** `{baseUrl}/api/stories/:id`

Returns a single story’s full content and vocabulary for the story-detail page. `:id` is the story id.

### Response body (object)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Story id |
| `title` | string | Yes | Story title |
| `content` | string | Yes | Story body. Wrap vocabulary in `**word**` for tooltips (e.g. `**自由**`) |
| `vocabularyWords` | array | Yes | Words that appear in the content and their translations |
| `vocabularyWords[].word` | string | Yes | Word (must match the text inside `**...**` in content) |
| `vocabularyWords[].translation` | string | Yes | Translation |
| `vocabularyWords[].count` | number | Yes | Occurrence count (optional for display) |
| `readingTime` | string | No | e.g. `"3 min read"` (shown in header) |
| `level` | string | No | e.g. `"Beginner"` (shown in header) |

### Example

```json
{
  "id": 1,
  "title": "A Day at the Market",
  "content": "**俺**は**マーケット**に**行き**ました。",
  "vocabularyWords": [
    { "word": "俺", "translation": "I", "count": 1 },
    { "word": "マーケット", "translation": "market", "count": 1 },
    { "word": "行き", "translation": "to go", "count": 1 }
  ],
  "readingTime": "3 min read",
  "level": "Beginner"
}
```

---

## Summary

| Endpoint | Method | Response |
|----------|--------|----------|
| `/api/dashboard` | GET | Object (all fields optional) |
| `/api/flashcards` | GET | Array of flashcard objects |
| `/api/stories` | GET | Array of story objects |
| `/api/quizzes` | GET | Array of quiz objects |
| `/api/quizzes/:id` | GET | Object with `questions` array |
| `/api/stories/:id` | GET | Object with `title`, `content`, `vocabularyWords` |

Ensure the backend returns **valid JSON** and a **2xx** status. On non-2xx or parse errors, the frontend shows an error message and falls back to empty/default data.
