import { BrowserRouter, useRoutes } from 'react-router-dom';
import { AppProvider } from '@context/AppContext';
import { SettingsProvider } from '@context/SettingsContext';
import ErrorBoundary from '@components/ErrorBoundary';

// Import route objects
import appRoutes from './routes';

// Component that uses the route objects
function AppRoutes() {
  return useRoutes(appRoutes);
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={process.env.PUBLIC_URL || '/'}>
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