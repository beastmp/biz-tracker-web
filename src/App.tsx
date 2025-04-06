import { BrowserRouter, useRoutes } from "react-router-dom";
import { AppProvider } from "@context/AppContext";
import { SettingsProvider } from "@context/SettingsContext";
import ErrorBoundary from "@components/ErrorBoundary";

// Import route objects
import appRoutes from "./routes";

// Component that uses the route objects
function AppRoutes() {
  return useRoutes(appRoutes);
}

// Get basename from environment variables
const getBasename = () => {
  // For local development, use root path
  if (process.env.NODE_ENV === "development") {
    return "/";
  }

  // For production, use PUBLIC_URL or VITE_ROUTER_BASE_URL if available
  return (
    process.env.PUBLIC_URL ||
    import.meta.env.VITE_ROUTER_BASE_URL ||
    "/"
  );
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={getBasename()}>
        <AppProvider>
          <SettingsProvider>
            <AppRoutes />
          </SettingsProvider>
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;