import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Search, Filter, BookmarkPlus } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Flashcard } from "../components/flashcard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { API_BASE } from "../config";

/** Expected JSON from GET /api/flashcards: array of flashcard items */
export interface FlashcardApiItem {
  id: number;
  word: string;
  translation: string;
  example: string;
  partOfSpeech: string;
  status: "new" | "learning" | "mastered";
}

export function Flashcards() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [flashcards, setFlashcards] = useState<FlashcardApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `${API_BASE}/api/flashcards`.replace(/([^:]\/)\/+/g, "$1");
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Flashcards fetch failed: ${res.status}`);
        return res.json() as Promise<FlashcardApiItem[]>;
      })
      .then((data) => {
        if (!cancelled) setFlashcards(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load flashcards");
          setFlashcards([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCards = flashcards.filter((card) => {
    const matchesSearch =
      card.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.translation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || card.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleKnown = (_id: number) => {
    toast.success("Flashcard marked as known! 🎉");
  };

  const handleNeedPractice = (_id: number) => {
    toast.info("Flashcard added to practice queue");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading flashcards…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error} — showing empty list. Set VITE_API_URL and ensure GET /api/flashcards returns a JSON array.
        </div>
      )}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl mb-2 text-gray-900">My Flashcards</h1>
        <p className="text-gray-600">
          Review and practice your vocabulary words
        </p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 mb-8"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <Input
            placeholder="Search flashcards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <Filter className="size-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="learning">Learning</SelectItem>
              <SelectItem value="mastered">Mastered</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <BookmarkPlus className="size-4" />
            Add Word
          </Button>
        </div>
      </motion.div>

      {/* Flashcards Grid */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Flashcard
                word={card.word}
                translation={card.translation}
                example={card.example}
                partOfSpeech={card.partOfSpeech}
                onKnown={() => handleKnown(card.id)}
                onNeedPractice={() => handleNeedPractice(card.id)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookmarkPlus className="size-12 text-gray-400" />
          </div>
          <h3 className="text-xl mb-2 text-gray-900">No flashcards found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search or filter criteria
          </p>
        </motion.div>
      )}
    </div>
  );
}
