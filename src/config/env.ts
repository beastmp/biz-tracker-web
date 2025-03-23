export const config = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  SYNC_URL: import.meta.env.VITE_SYNC_URL || 'http://localhost:5000/db',
  OFFLINE_DB_NAME: 'biztracker_offline'
};