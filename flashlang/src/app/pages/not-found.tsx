import { Link } from "react-router";
import { motion } from "motion/react";
import { Home, BookOpen } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B82F6]/10 via-[#14B8A6]/10 to-[#F97316]/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <div className="text-9xl mb-4">🗺️</div>
          <h1 className="text-6xl mb-4 text-gray-900">404</h1>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl mb-3 text-gray-900">Page Not Found</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Oops! It looks like this page doesn't exist. Let's get you back on track
            with your language learning journey.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-4 justify-center"
        >
          <Button
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white gap-2"
            asChild
          >
            <Link to="/">
              <Home className="size-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/stories">
              <BookOpen className="size-4" />
              Browse Stories
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
