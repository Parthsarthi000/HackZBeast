/**
 * Backend API base URL. Production uses Railway (no env var) so Netlify won't flag "exposed secrets".
 * For local dev we use localhost.
 */
export const API_BASE = import.meta.env.PROD
  ? "https://hackzbeast-production.up.railway.app"
  : "http://localhost:8000";
