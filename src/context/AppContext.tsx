import { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppContext, AppContextProps } from '@context/AppContextDef';

// Define props for the provider component
export interface AppProviderProps {
  children: React.ReactNode;
}

// App provider component
export function AppProvider({ children }: AppProviderProps) {
  // Theme state
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode === 'dark' || savedMode === 'light') ? savedMode : 'light';
  });

  const [defaultViewMode, setDefaultViewMode] = useState<'grid' | 'list'>(() => {
    const savedMode = localStorage.getItem('defaultViewMode');
    return (savedMode === 'grid' || savedMode === 'list') ? savedMode : 'list';
  });

  // Effect to save theme mode to localStorage
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Effect to save default view mode to localStorage
  useEffect(() => {
    localStorage.setItem('defaultViewMode', defaultViewMode);
  }, [defaultViewMode]);

  // Toggle between light and dark modes
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Create MUI theme based on current mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode]
  );

  // Context value
  const contextValue: AppContextProps = {
    theme: mode,
    toggleColorMode,
    defaultViewMode,
    setDefaultViewMode
  };

  return (
    <AppContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppContext.Provider>
  );
}

export default AppProvider;
