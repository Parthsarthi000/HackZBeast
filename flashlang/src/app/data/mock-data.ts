// Mock data for the Flash Lang application

export interface Flashcard {
  id: number;
  word: string;
  translation: string;
  example: string;
  partOfSpeech: string;
  status: "new" | "learning" | "mastered";
  language: string;
}

export interface Story {
  id: number;
  title: string;
  description: string;
  readingTime: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  vocabularyCount: number;
  image: string;
  tags: string[];
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  completed: boolean;
  score?: number;
  progress: number;
}

export const mockFlashcards: Flashcard[] = [
  {
    id: 1,
    word: "bonjour",
    translation: "hello",
    example: "Bonjour, comment allez-vous?",
    partOfSpeech: "interjection",
    status: "learning",
    language: "French",
  },
  {
    id: 2,
    word: "bibliothèque",
    translation: "library",
    example: "Je vais à la bibliothèque pour étudier.",
    partOfSpeech: "noun",
    status: "new",
    language: "French",
  },
  {
    id: 3,
    word: "merci",
    translation: "thank you",
    example: "Merci beaucoup pour votre aide!",
    partOfSpeech: "interjection",
    status: "mastered",
    language: "French",
  },
  {
    id: 4,
    word: "aventure",
    translation: "adventure",
    example: "C'était une grande aventure.",
    partOfSpeech: "noun",
    status: "learning",
    language: "French",
  },
  {
    id: 5,
    word: "délicieux",
    translation: "delicious",
    example: "Ce gâteau est délicieux!",
    partOfSpeech: "adjective",
    status: "new",
    language: "French",
  },
  {
    id: 6,
    word: "voyage",
    translation: "journey / trip",
    example: "Bon voyage!",
    partOfSpeech: "noun",
    status: "learning",
    language: "French",
  },
];

export const mockStories: Story[] = [
  {
    id: 1,
    title: "A Day at the Market",
    description: "Learn food and shopping vocabulary through a vibrant market scene",
    readingTime: "3 min",
    level: "Beginner",
    vocabularyCount: 12,
    image: "https://images.unsplash.com/photo-1768722688414-27b8220b18d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJrZXQlMjBzY2VuZSUyMHRyYXZlbHxlbnwxfHx8fDE3NzIyNTQwMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Food", "Shopping"],
  },
  {
    id: 2,
    title: "Morning Routine",
    description: "Practice daily activity vocabulary through a typical morning",
    readingTime: "4 min",
    level: "Beginner",
    vocabularyCount: 15,
    image: "https://images.unsplash.com/photo-1769398449496-2414ea88b441?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWZlJTIwY29mZmVlJTIwbW9ybmluZ3xlbnwxfHx8fDE3NzIyNTQwMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Daily Life", "Routine"],
  },
  {
    id: 3,
    title: "The Library Visit",
    description: "Explore education and learning vocabulary in a library setting",
    readingTime: "5 min",
    level: "Intermediate",
    vocabularyCount: 18,
    image: "https://images.unsplash.com/photo-1662582631700-676a217d511f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWJyYXJ5JTIwYm9va3MlMjBzaGVsdmVzfGVufDF8fHx8MTc3MjE1NTgzMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Education", "Reading"],
  },
  {
    id: 4,
    title: "Weekend Adventure",
    description: "Learn travel and outdoor vocabulary through an exciting weekend trip",
    readingTime: "6 min",
    level: "Intermediate",
    vocabularyCount: 20,
    image: "https://images.unsplash.com/photo-1686984096026-23d6e82f9749?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBzdHVkeWluZyUyMGxhcHRvcHxlbnwxfHx8fDE3NzIxODE2OTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Travel", "Adventure"],
  },
  {
    id: 5,
    title: "At the Restaurant",
    description: "Master dining vocabulary through a restaurant experience",
    readingTime: "4 min",
    level: "Beginner",
    vocabularyCount: 14,
    image: "https://images.unsplash.com/photo-1769398449496-2414ea88b441?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWZlJTIwY29mZmVlJTIwbW9ybmluZ3xlbnwxfHx8fDE3NzIyNTQwMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Food", "Dining"],
  },
  {
    id: 6,
    title: "City Exploration",
    description: "Navigate through city vocabulary and directions",
    readingTime: "5 min",
    level: "Intermediate",
    vocabularyCount: 16,
    image: "https://images.unsplash.com/photo-1768722688414-27b8220b18d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJrZXQlMjBzY2VuZSUyMHRyYXZlbHxlbnwxfHx8fDE3NzIyNTQwMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["City", "Navigation"],
  },
];

export const mockQuizzes: Quiz[] = [
  {
    id: 1,
    title: "Market Vocabulary",
    description: "Test your knowledge of market and shopping terms",
    questions: 10,
    difficulty: "Beginner",
    completed: true,
    score: 85,
    progress: 100,
  },
  {
    id: 2,
    title: "Daily Routines",
    description: "Practice common phrases for everyday activities",
    questions: 12,
    difficulty: "Beginner",
    completed: false,
    progress: 60,
  },
  {
    id: 3,
    title: "Travel Essentials",
    description: "Master essential travel vocabulary and phrases",
    questions: 15,
    difficulty: "Intermediate",
    completed: true,
    score: 92,
    progress: 100,
  },
  {
    id: 4,
    title: "Food & Dining",
    description: "Learn restaurant and food-related vocabulary",
    questions: 10,
    difficulty: "Beginner",
    completed: false,
    progress: 0,
  },
  {
    id: 5,
    title: "Advanced Grammar",
    description: "Challenge yourself with complex grammatical structures",
    questions: 20,
    difficulty: "Advanced",
    completed: false,
    progress: 0,
  },
  {
    id: 6,
    title: "City Navigation",
    description: "Practice giving and understanding directions",
    questions: 12,
    difficulty: "Intermediate",
    completed: true,
    score: 78,
    progress: 100,
  },
];
