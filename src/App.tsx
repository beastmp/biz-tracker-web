import { BrowserRouter, useRoutes } from 'react-router-dom';
import { AppProvider } from '@context/AppContext';
import { SettingsProvider } from '@context/SettingsContext';
import ErrorBoundary from '@components/ErrorBoundary';

// Import route objects
import appRoutes from './routes';

/**
 * Component that uses the route objects
 *
 * @returns {JSX.Element} The routes for the application
 */
function AppRoutes() {
  return useRoutes(appRoutes);
}

/**
 * Main application component
 *
 * @returns {JSX.Element} The main application structure
 */
function App() {
  return (
    <AppProvider>
      <SettingsProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </BrowserRouter>
      </SettingsProvider>
    </AppProvider>
  );
}

export default App;