import { useState } from "react";
import { motion } from "motion/react";
import { Volume2, Check, X } from "lucide-react";
import { Button } from "./ui/button";

interface FlashcardProps {
  word: string;
  translation: string;
  example: string;
  partOfSpeech: string;
  onKnown: () => void;
  onNeedPractice: () => void;
}

export function Flashcard({
  word,
  translation,
  example,
  partOfSpeech,
  onKnown,
  onNeedPractice,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Mock audio play
    console.log(`Playing audio for: ${word}`);
  };

  return (
    <div className="perspective-1000 h-64">
      <motion.div
        className="relative w-full h-full cursor-pointer"
        onClick={handleFlip}
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div className="text-4xl mb-3 text-gray-900">{word}</div>
          <div className="text-lg text-gray-600">{translation}</div>
          <div className="mt-4 text-sm text-gray-400">Click to flip</div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#3B82F6] to-[#14B8A6] rounded-xl shadow-lg p-6 flex flex-col justify-between text-white"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                {partOfSpeech}
              </span>
              <button
                onClick={handleAudio}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Volume2 className="size-5" />
              </button>
            </div>
            <div className="text-2xl mb-4">{word}</div>
            <div className="text-sm opacity-90 italic">"{example}"</div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-none"
              onClick={(e) => {
                e.stopPropagation();
                onNeedPractice();
              }}
            >
              <X className="size-4 mr-1" />
              Need Practice
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-none"
              onClick={(e) => {
                e.stopPropagation();
                onKnown();
              }}
            >
              <Check className="size-4 mr-1" />
              I Know This
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
