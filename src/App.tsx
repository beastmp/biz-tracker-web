import { BrowserRouter, useRoutes } from 'react-router-dom';
import { AppProvider } from '@context/AppContext';
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
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;