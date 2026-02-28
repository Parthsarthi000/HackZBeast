import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Clock, BookOpen, Tag, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

/** Expected JSON from GET /api/stories: array of story items */
export interface StoryApiItem {
  id: number;
  title: string;
  description: string;
  readingTime: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  vocabularyCount: number;
  image: string;
  tags: string[];
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function Stories() {
  const [stories, setStories] = useState<StoryApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchStories = useCallback(() => {
    const url = `${API_BASE}/api/stories`.replace(/([^:]\/)\/+/g, "$1");
    setLoading(true);
    setError(null);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Stories fetch failed: ${res.status}`);
        return res.json() as Promise<StoryApiItem[]>;
      })
      .then((data) => setStories(Array.isArray(data) ? data : []))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load stories");
        setStories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const url = `${API_BASE}/api/stories`.replace(/([^:]\/)\/+/g, "$1");
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Stories fetch failed: ${res.status}`);
        return res.json() as Promise<StoryApiItem[]>;
      })
      .then((data) => {
        if (!cancelled) setStories(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load stories");
          setStories([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerateStories = () => {
    setGenerating(true);
    const url = `${API_BASE}/api/stories/generate`.replace(/([^:]\/)\/+/g, "$1");
    fetch(url, { method: "POST" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.detail ?? "Failed to generate");
        const count = data?.count ?? 0;
        if (count > 0) {
          toast.success(`${count} new story${count !== 1 ? "ies" : ""} generated!`);
        } else {
          toast.info("No new stories. Add context (highlight text) and try again.");
        }
        fetchStories();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to generate stories"))
      .finally(() => setGenerating(false));
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-700";
      case "Intermediate":
        return "bg-blue-100 text-blue-700";
      case "Advanced":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading stories…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error} — showing empty list. Set VITE_API_URL and ensure GET /api/stories returns a JSON array.
        </div>
      )}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl mb-2 text-gray-900">Stories for You</h1>
          <p className="text-gray-600">
            Learn vocabulary in context through engaging stories
          </p>
        </div>
        <Button
          onClick={handleGenerateStories}
          disabled={generating}
          className="gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white shrink-0"
        >
          <Sparkles className="size-4" />
          {generating ? "Generating…" : "Generate stories"}
        </Button>
      </motion.div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story, index) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
          >
            {/* Story Image */}
            <div className="relative h-48 overflow-hidden bg-gray-200">
              <img
                src={story.image}
                alt={story.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3">
                <Badge className={getLevelColor(story.level)}>
                  {story.level}
                </Badge>
              </div>
            </div>

            {/* Story Content */}
            <div className="p-5">
              <h3 className="text-xl mb-2 text-gray-900 group-hover:text-[#3B82F6] transition-colors">
                {story.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {story.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {story.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1"
                  >
                    <Tag className="size-3" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Meta Info */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="size-4" />
                  <span>{story.readingTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="size-4" />
                  <span>{story.vocabularyCount} words</span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                asChild
              >
                <Link to={`/stories/${story.id}`}>Read Story</Link>
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
