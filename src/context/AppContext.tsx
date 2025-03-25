import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface AppContextProps {
  mode: ThemeMode;
  toggleColorMode: () => void;
}

const AppContext = createContext<AppContextProps>({
  mode: 'light',
  toggleColorMode: () => {},
});

export const useAppContext = () => useContext(AppContext);

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Check local storage for saved theme preference
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as ThemeMode) || 'light';
  });

  // Create theme
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#0a7ea4',
          },
          secondary: {
            main: '#4caf50',
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  width: '0.4em',
                },
                '&::-webkit-scrollbar-track': {
                  background: mode === 'dark' ? '#424242' : '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: mode === 'dark' ? '#686868' : '#888',
                  borderRadius: 20,
                },
              },
            },
          },
        },
      }),
    [mode],
  );

  // Toggle color mode
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Save theme preference to local storage
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Context value
  const contextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
    }),
    [mode]
  );

  return (
    <AppContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppContext.Provider>
  );
}
