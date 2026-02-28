import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Play, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import { API_BASE } from "../config";

/** Expected JSON from GET /api/quizzes: array of quiz items */
export interface QuizApiItem {
  id: number;
  title: string;
  description: string;
  questions: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  completed: boolean;
  score?: number;
  progress: number;
}

export function Quizzes() {
  const [quizzes, setQuizzes] = useState<QuizApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchQuizzes = useCallback(() => {
    const url = `${API_BASE}/api/quizzes`.replace(/([^:]\/)\/+/g, "$1");
    setLoading(true);
    setError(null);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Quizzes fetch failed: ${res.status}`);
        return res.json() as Promise<QuizApiItem[]>;
      })
      .then((data) => setQuizzes(Array.isArray(data) ? data : []))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load quizzes");
        setQuizzes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const url = `${API_BASE}/api/quizzes`.replace(/([^:]\/)\/+/g, "$1");
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Quizzes fetch failed: ${res.status}`);
        return res.json() as Promise<QuizApiItem[]>;
      })
      .then((data) => {
        if (!cancelled) setQuizzes(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load quizzes");
          setQuizzes([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleGenerateQuiz = () => {
    setGenerating(true);
    const url = `${API_BASE}/api/quizzes/generate`.replace(/([^:]\/)\/+/g, "$1");
    fetch(url, { method: "POST" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.detail ?? "Failed to generate");
        if (data?.success && data?.quiz) {
          toast.success("Quiz generated! Start it below.");
          fetchQuizzes();
        } else {
          toast.info(data?.message ?? "Add flashcards first, then try again.");
          fetchQuizzes();
        }
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to generate quiz"))
      .finally(() => setGenerating(false));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "text-green-700 bg-green-100";
      case "Intermediate":
        return "text-blue-700 bg-blue-100";
      case "Advanced":
        return "text-purple-700 bg-purple-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading quizzes…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error} — showing empty list. Set VITE_API_URL and ensure GET /api/quizzes returns a JSON array.
        </div>
      )}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl mb-2 text-gray-900">Quizzes</h1>
          <p className="text-gray-600">
            Test your knowledge and track your progress
          </p>
        </div>
        <Button
          onClick={handleGenerateQuiz}
          disabled={generating}
          className="gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white shrink-0"
        >
          <Sparkles className="size-4" />
          {generating ? "Generating…" : "Generate quiz"}
        </Button>
      </motion.div>

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz, index) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
              <span
                className={`text-xs px-3 py-1 rounded-full ${getDifficultyColor(
                  quiz.difficulty
                )}`}
              >
                {quiz.difficulty}
              </span>
              {quiz.completed ? (
                <CheckCircle2 className="size-5 text-green-600" />
              ) : quiz.progress > 0 ? (
                <Circle className="size-5 text-[#3B82F6]" />
              ) : (
                <Circle className="size-5 text-gray-300" />
              )}
            </div>

            {/* Quiz Info */}
            <h3 className="text-xl mb-2 text-gray-900">{quiz.title}</h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {quiz.description}
            </p>

            {/* Questions Count */}
            <div className="text-sm text-gray-500 mb-4">
              {quiz.questions} questions
            </div>

            {/* Progress */}
            {quiz.progress > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-gray-900">
                    {quiz.completed && quiz.score ? `${quiz.score}%` : `${quiz.progress}%`}
                  </span>
                </div>
                <Progress value={quiz.progress} className="h-2" />
              </div>
            )}

            {/* Action Button */}
            <Button
              className={`w-full gap-2 ${
                quiz.completed
                  ? "bg-gray-600 hover:bg-gray-700"
                  : "bg-[#3B82F6] hover:bg-[#2563EB]"
              } text-white`}
              asChild
            >
              <Link to={`/quizzes/${quiz.id}`}>
                <Play className="size-4" />
                {quiz.completed ? "Retry Quiz" : quiz.progress > 0 ? "Continue" : "Start Quiz"}
              </Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
