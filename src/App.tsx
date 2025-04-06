import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@context/AppContext";
import { SettingsProvider } from "@context/SettingsContext";
import ErrorBoundary from "@components/ErrorBoundary";
import { Suspense, lazy } from "react";

// Lazy load the AppContent to ensure Router context is fully available first
const AppContent = lazy(() => import("./AppContent"));

// Get basename from environment variables
const getBasename = () => {
  // For local development, use root path
  if (process.env.NODE_ENV === "development") {
    return "/";
  }

  // For production, use PUBLIC_URL or VITE_ROUTER_BASE_URL if available
  return (
    import.meta.env.PUBLIC_URL ||
    import.meta.env.VITE_ROUTER_BASE_URL ||
    "/"
  );
};

function App() {
  const basename = getBasename();

  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <AppProvider>
          <SettingsProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/*" element={<AppContent />} />
              </Routes>
            </Suspense>
          </SettingsProvider>
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;