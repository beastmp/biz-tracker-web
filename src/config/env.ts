export const config = {
  API_URL: import.meta.env.MODE === 'production'
    ? '/api' // Use relative path with the proxy rewrite in production
    : import.meta.env.VITE_API_URL
};