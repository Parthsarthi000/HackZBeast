import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Dev-only: serve public/api/*.json at GET /api/flashcards and GET /api/dashboard
// so you can edit those JSON files to test custom payloads without a backend.
function apiMockPlugin() {
  const apiRoutes: Record<string, string> = {
    "/api/flashcards": "public/api/flashcards.json",
    "/api/dashboard": "public/api/dashboard.json",
    "/api/stories": "public/api/stories.json",
    "/api/quizzes": "public/api/quizzes.json",
  };
  return {
    name: "api-mock",
    configureServer(server: ViteDevServer) {
      const apiMock = (req: { url?: string; method?: string }, res: { setHeader: (a: string, b: string) => void; end: (s: string) => void }, next: () => void) => {
        const path = req.url?.split("?")[0];
        if (req.method !== "GET" || !path) {
          next();
          return;
        }
        // Exact list routes
        if (apiRoutes[path]) {
          try {
            const file = readFileSync(resolve(process.cwd(), apiRoutes[path]), "utf-8");
            res.setHeader("Content-Type", "application/json");
            res.end(file);
            return;
          } catch {
            // fall through
          }
        }
        // Detail routes: /api/quizzes/:id, /api/stories/:id
        const quizzesMatch = path.match(/^\/api\/quizzes\/(\d+)$/);
        const storiesMatch = path.match(/^\/api\/stories\/(\d+)$/);
        const detailPath = quizzesMatch
          ? `public/api/quizzes/${quizzesMatch[1]}.json`
          : storiesMatch
            ? `public/api/stories/${storiesMatch[1]}.json`
            : null;
        if (detailPath) {
          try {
            const file = readFileSync(resolve(process.cwd(), detailPath), "utf-8");
            res.setHeader("Content-Type", "application/json");
            res.end(file);
            return;
          } catch {
            // 404 fall through
          }
        }
        next();
      };
      // Run before Vite's SPA fallback so /api/* returns JSON, not index.html
      const stack = (server.middlewares as { stack: { route: string; handle: (req: any, res: any, next: () => void) => void }[] }).stack;
      stack.unshift({ route: "", handle: apiMock });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiMockPlugin()],
});
