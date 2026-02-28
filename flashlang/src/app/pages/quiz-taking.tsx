import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Check, X, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Input } from "../components/ui/input";
import { API_BASE } from "../config";

export interface QuizQuestionApiItem {
  id: number;
  type: "multiple-choice" | "fill-blank";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

/** Expected JSON from GET /api/quizzes/:id */
export interface QuizDetailApiResponse {
  questions: QuizQuestionApiItem[];
}

const DEFAULT_QUESTIONS: QuizQuestionApiItem[] = [
  {
    id: 1,
    type: "multiple-choice",
    question: 'What does "bonjour" mean in English?',
    options: ["Goodbye", "Hello", "Thank you", "Please"],
    correctAnswer: "Hello",
    explanation: '"Bonjour" is the standard French greeting meaning "hello" or "good day".',
  },
  {
    id: 2,
    type: "fill-blank",
    question: 'How do you say "thank you" in French?',
    correctAnswer: "merci",
    explanation: '"Merci" is the French word for "thank you".',
  },
];

export function QuizTaking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuizQuestionApiItem[]>(DEFAULT_QUESTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [fillAnswer, setFillAnswer] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const url = `${API_BASE}/api/quizzes/${id}`.replace(/([^:]\/)\/+/g, "$1");
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Quiz fetch failed: ${res.status}`);
        return res.json() as Promise<QuizDetailApiResponse>;
      })
      .then((data) => {
        if (!cancelled && data?.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load quiz");
          setQuestions(DEFAULT_QUESTIONS);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const currentQ = questions[currentQuestion];
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const handleSelectAnswer = (answer: string) => {
    if (!showFeedback) {
      setSelectedAnswer(answer);
    }
  };

  const handleSubmitAnswer = () => {
    const userAnswer =
      currentQ.type === "multiple-choice" ? selectedAnswer : fillAnswer;
    const isCorrect =
      userAnswer.toLowerCase().trim() === currentQ.correctAnswer.toLowerCase().trim();

    setAnswers([...answers, isCorrect]);
    if (isCorrect) {
      setScore(score + 1);
    }
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer("");
      setFillAnswer("");
      setShowFeedback(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const isCorrect = () => {
    if (!currentQ) return false;
    const userAnswer =
      currentQ.type === "multiple-choice" ? selectedAnswer : fillAnswer;
    return (
      userAnswer.toLowerCase().trim() === currentQ.correctAnswer.toLowerCase().trim()
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading quiz…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600 mb-4">
            Showing default questions. Set VITE_API_URL and ensure GET /api/quizzes/:id returns JSON with a <code className="bg-gray-100 px-1 rounded">questions</code> array.
          </p>
          <Button onClick={() => navigate("/quizzes")} variant="outline">
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No questions in this quiz.</p>
          <Button onClick={() => navigate("/quizzes")} variant="outline">
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3B82F6]/10 to-[#14B8A6]/10 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full"
        >
          <div className="text-center mb-8">
            <div
              className={`w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center ${
                percentage >= 80
                  ? "bg-green-100"
                  : percentage >= 60
                  ? "bg-blue-100"
                  : "bg-orange-100"
              }`}
            >
              <span
                className={`text-5xl ${
                  percentage >= 80
                    ? "text-green-600"
                    : percentage >= 60
                    ? "text-blue-600"
                    : "text-orange-600"
                }`}
              >
                {percentage}%
              </span>
            </div>
            <h2 className="text-3xl mb-3 text-gray-900">Quiz Complete!</h2>
            <p className="text-gray-600">
              You scored {score} out of {questions.length} questions
            </p>
          </div>

          {/* Results List */}
          <div className="mb-8 space-y-2">
            <h3 className="text-lg mb-3 text-gray-900">Your Answers:</h3>
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-700">Question {index + 1}</span>
                {answers[index] ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="size-4" />
                    <span className="text-sm">Correct</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <X className="size-4" />
                    <span className="text-sm">Incorrect</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/quizzes")}
            >
              Back to Quizzes
            </Button>
            <Button
              className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              onClick={() => {
                setCurrentQuestion(0);
                setScore(0);
                setAnswers([]);
                setQuizCompleted(false);
                setSelectedAnswer("");
                setFillAnswer("");
                setShowFeedback(false);
              }}
            >
              Retry Quiz
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => navigate("/flashcards")}
            >
              Review Flashcards
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/quizzes")}
              className="gap-1"
            >
              <ArrowLeft className="size-4" />
              Exit
            </Button>
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Question */}
            <h2 className="text-2xl mb-8 text-gray-900">{currentQ.question}</h2>

            {/* Multiple Choice Options */}
            {currentQ.type === "multiple-choice" && currentQ.options && (
              <div className="space-y-3 mb-8">
                {currentQ.options.map((option) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectOption = option === currentQ.correctAnswer;
                  const showCorrect = showFeedback && isCorrectOption;
                  const showIncorrect = showFeedback && isSelected && !isCorrectOption;

                  return (
                    <button
                      key={option}
                      onClick={() => handleSelectAnswer(option)}
                      disabled={showFeedback}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        showCorrect
                          ? "border-green-500 bg-green-50"
                          : showIncorrect
                          ? "border-red-500 bg-red-50"
                          : isSelected
                          ? "border-[#3B82F6] bg-[#3B82F6]/5"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      } ${showFeedback ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900">{option}</span>
                        {showCorrect && <Check className="size-5 text-green-600" />}
                        {showIncorrect && <X className="size-5 text-red-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fill in the Blank */}
            {currentQ.type === "fill-blank" && (
              <div className="mb-8">
                <Input
                  value={fillAnswer}
                  onChange={(e) => setFillAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  disabled={showFeedback}
                  className={`text-lg p-6 ${
                    showFeedback
                      ? isCorrect()
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                      : ""
                  }`}
                />
                {showFeedback && !isCorrect() && (
                  <p className="mt-2 text-sm text-green-600">
                    Correct answer: <span className="font-medium">{currentQ.correctAnswer}</span>
                  </p>
                )}
              </div>
            )}

            {/* Feedback */}
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl mb-8 ${
                  isCorrect() ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCorrect() ? (
                    <Check className="size-5 text-green-600 mt-0.5" />
                  ) : (
                    <X className="size-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`mb-1 ${isCorrect() ? "text-green-900" : "text-red-900"}`}>
                      {isCorrect() ? "Correct!" : "Incorrect"}
                    </p>
                    <p className="text-sm text-gray-700">{currentQ.explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!showFeedback ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={
                    currentQ.type === "multiple-choice"
                      ? !selectedAnswer
                      : !fillAnswer.trim()
                  }
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white gap-2"
                >
                  {currentQuestion < questions.length - 1 ? (
                    <>
                      Next Question
                      <ArrowRight className="size-4" />
                    </>
                  ) : (
                    "View Results"
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
