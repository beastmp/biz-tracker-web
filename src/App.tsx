import { BrowserRouter, useRoutes, Routes, Route } from "react-router-dom";
import { AppProvider } from "@context/AppContext";
import { SettingsProvider } from "@context/SettingsContext";
import ErrorBoundary from "@components/ErrorBoundary";

// Import route objects
import appRoutes from "./routes";

// Component that uses the route objects - moved inside a wrapper component
function AppContent() {
  // This ensures useRoutes is only called when inside a Router context
  const routes = useRoutes(appRoutes);
  return routes;
}

// Get basename from environment variables
const getBasename = () => {
  console.log("Environment:", {
    NODE_ENV: process.env.NODE_ENV,
    VITE_ROUTER_BASE_URL: import.meta.env.VITE_ROUTER_BASE_URL,
    PUBLIC_URL: import.meta.env.PUBLIC_URL || process.env.PUBLIC_URL
  });

  // For local development, use root path
  if (process.env.NODE_ENV === "development") {
    return "/";
  }

  // For production, use PUBLIC_URL or VITE_ROUTER_BASE_URL if available
  const basename =
    process.env.PUBLIC_URL ||
    import.meta.env.VITE_ROUTER_BASE_URL ||
    import.meta.env.PUBLIC_URL ||
    "/";

  console.log("Using basename:", basename);
  return basename;
};

function App() {
  // Calculate basename once
  const basename = getBasename();

  return (
    <ErrorBoundary>
      {/* BrowserRouter with explicit basename */}
      <BrowserRouter basename={basename}>
        <AppProvider>
          <SettingsProvider>
            <Routes>
              <Route path="/*" element={<AppContent />} />
            </Routes>
          </SettingsProvider>
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;