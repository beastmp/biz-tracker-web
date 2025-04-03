export const config = {
  // Use environment variable without adding extra /api segment
  API_URL: import.meta.env.VITE_API_URL || ""
};