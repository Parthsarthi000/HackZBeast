import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { CreditCard, BookOpen, FileText, Target, TrendingUp, Flame, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";

/** Expected JSON shape from GET /api/dashboard (or VITE_API_URL/api/dashboard) */
export interface DashboardApiResponse {
  user?: { name: string; streak: number; wordsThisWeek: number };
  stats?: { totalFlashcards: number; storiesAvailable: number; quizzesCompleted: number };
  dailyGoal?: { current: number; target: number };
  recentWords?: { word: string; translation: string; language: string }[];
  recommendations?: {
    id: number;
    title: string;
    type: "Story" | "Quiz";
    description: string;
    tag: string;
  }[];
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function mapDashboardResponse(data: DashboardApiResponse) {
  const statsConfig: {
    label: string;
    key: keyof NonNullable<DashboardApiResponse["stats"]>;
    icon: typeof CreditCard;
    color: string;
  }[] = [
    { label: "Total Flashcards", key: "totalFlashcards", icon: CreditCard, color: "bg-[#3B82F6]" },
    { label: "Stories Available", key: "storiesAvailable", icon: BookOpen, color: "bg-[#14B8A6]" },
    { label: "Quizzes Completed", key: "quizzesCompleted", icon: FileText, color: "bg-[#F97316]" },
  ];
  const s = data.stats;
  const stats = statsConfig.map(({ label, key, icon, color }) => ({
    label,
    value: s ? Number(s[key]) ?? 0 : 0,
    icon,
    color,
  }));

  const recentWords = data.recentWords ?? [];
  const recommendations = data.recommendations ?? [];
  const user = data.user ?? { name: "Guest", streak: 0, wordsThisWeek: 0 };
  const dailyGoal = data.dailyGoal ?? { current: 0, target: 10 };
  const goalPercent = dailyGoal.target > 0
    ? Math.round((dailyGoal.current / dailyGoal.target) * 100)
    : 0;
  const remaining = Math.max(0, dailyGoal.target - dailyGoal.current);

  return { stats, recentWords, recommendations, user, dailyGoal, goalPercent, remaining };
}

const DEFAULT_DASHBOARD: ReturnType<typeof mapDashboardResponse> = mapDashboardResponse({});

export function Dashboard() {
  const [data, setData] = useState<ReturnType<typeof mapDashboardResponse>>(DEFAULT_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `${API_BASE}/api/dashboard`.replace(/([^:]\/)\/+/g, "$1");
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`);
        return res.json() as Promise<DashboardApiResponse>;
      })
      .then((json) => {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.log("[Dashboard] API:", `${API_BASE}/api/dashboard`, "Response:", {
              user: (json as DashboardApiResponse).user,
              stats: (json as DashboardApiResponse).stats,
              recentWordsCount: ((json as DashboardApiResponse).recentWords ?? []).length,
              recommendationsCount: ((json as DashboardApiResponse).recommendations ?? []).length,
            });
          }
          setData(mapDashboardResponse(json as DashboardApiResponse));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
          setData(DEFAULT_DASHBOARD);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { stats, recentWords, recommendations, user, dailyGoal, goalPercent, remaining } = data;
  const recentWordsToShow = recentWords.slice(0, 4);
  const isEmpty =
    !error &&
    stats.every((s) => s.value === 0) &&
    recentWords.length === 0 &&
    recommendations.length === 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error} — showing default data. Set VITE_API_URL and ensure GET /api/dashboard returns JSON.
        </div>
      )}
      {isEmpty && !error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          No data yet. Run the backend seed (<code className="bg-amber-100 px-1 rounded">python -m seed_data</code> in{" "}
          <code className="bg-amber-100 px-1 rounded">fastapi-backend</code>) or add flashcards / generate stories in the app.
        </div>
      )}
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl text-gray-900">Welcome back, {user.name}!</h1>
          <Sparkles className="size-6 text-[#FBBF24]" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#F97316]">
            <Flame className="size-5" />
            <span>{user.streak} day streak</span>
          </div>
          <div className="text-gray-600">
            You've learned <span className="text-[#3B82F6]">{user.wordsThisWeek} words</span> this week
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="size-6 text-white" />
                </div>
                <TrendingUp className="size-5 text-green-500" />
              </div>
              <div className="text-3xl mb-1 text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Daily Goal Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#FBBF24]/10 p-3 rounded-lg">
              <Target className="size-6 text-[#FBBF24]" />
            </div>
            <div>
              <h3 className="text-gray-900">Daily Goal Progress</h3>
              <p className="text-sm text-gray-600">{dailyGoal.current} / {dailyGoal.target} flashcards reviewed</p>
            </div>
          </div>
          <span className="text-2xl text-gray-900">{goalPercent}%</span>
        </div>
        <Progress value={goalPercent} className="h-3" />
        <p className="text-sm text-gray-600 mt-2">
          {remaining === 0 ? "Goal reached! Great job." : `Keep it up! Just ${remaining} more to reach your goal today.`}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl text-gray-900">Recent Activity</h2>
            <Link to="/flashcards" className="text-[#3B82F6] text-sm hover:underline">
              View all
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {recentWordsToShow.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl mb-1 text-gray-900">{item.word}</div>
                    <div className="text-sm text-gray-600">{item.translation}</div>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {item.language}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recommended for You */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xl mb-4 text-gray-900">Recommended for You</h2>
          <div className="space-y-4">
            {recommendations.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="mb-1 text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <span className="text-xs bg-[#3B82F6]/10 text-[#3B82F6] px-3 py-1 rounded-full whitespace-nowrap">
                    {item.tag}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-500">{item.type}</span>
                  <Button
                    size="sm"
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                    asChild
                  >
                    <Link to={item.type === "Story" ? "/stories" : "/quizzes"}>
                      Start
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-8 text-center"
      >
        <Button
          size="lg"
          className="bg-gradient-to-r from-[#3B82F6] to-[#14B8A6] hover:opacity-90 text-white px-8"
          asChild
        >
          <Link to="/flashcards">Review 5 Flashcards Now</Link>
        </Button>
      </motion.div>
    </div>
  );
}
