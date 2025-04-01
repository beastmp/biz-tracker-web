import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App.tsx'
import GlobalLoadingIndicator from '@components/ui/GlobalLoadingIndicator'
import AppProvider from '@context/AppContext'
import SettingsProvider from '@context/SettingsContext'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <SettingsProvider>
          <GlobalLoadingIndicator />
          <App />
          <ReactQueryDevtools initialIsOpen={false} />
        </SettingsProvider>
      </AppProvider>
    </QueryClientProvider>
  </StrictMode>,
)
