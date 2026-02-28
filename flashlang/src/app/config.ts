/** Backend API base URL. Never use relative URL so production always hits Railway. */
const envUrl = import.meta.env.VITE_API_URL;
const isProd = import.meta.env.PROD;
export const API_BASE =
  typeof envUrl === "string" && envUrl.trim() !== ""
    ? envUrl.trim().replace(/\/$/, "")
    : isProd
      ? "https://hackzbeast-production.up.railway.app"
      : "http://localhost:8000";
