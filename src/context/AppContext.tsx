import { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppContext, AppContextProps } from '@context/AppContextDef';

// Define a full set of shadows
const generateShadows = () => {
  // Start with the default shadows array
  const baseArray = Array(25).fill('none');

  // Override only the shadows you want to customize
  baseArray[1] = '0px 2px 1px -1px rgba(0,0,0,0.08),0px 1px 1px 0px rgba(0,0,0,0.04),0px 1px 3px 0px rgba(0,0,0,0.02)';
  baseArray[2] = '0px 3px 1px -2px rgba(0,0,0,0.08),0px 2px 2px 0px rgba(0,0,0,0.04),0px 1px 5px 0px rgba(0,0,0,0.02)';
  baseArray[3] = '0px 3px 3px -2px rgba(0,0,0,0.12),0px 3px 4px 0px rgba(0,0,0,0.08),0px 1px 8px 0px rgba(0,0,0,0.05)';
  baseArray[4] = '0px 4px 5px -2px rgba(0,0,0,0.12),0px 5px 8px 0px rgba(0,0,0,0.08),0px 1px 14px 0px rgba(0,0,0,0.05)';
  baseArray[5] = '0px 6px 10px -3px rgba(0,0,0,0.15),0px 8px 10px 1px rgba(0,0,0,0.10),0px 3px 14px 2px rgba(0,0,0,0.08)';
  baseArray[8] = '0px 9px 12px -6px rgba(0,0,0,0.20),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)';
  baseArray[12] = '0px 12px 17px -6px rgba(0,0,0,0.25),0px 18px 24px 2px rgba(0,0,0,0.18),0px 6px 30px 5px rgba(0,0,0,0.14)';
  baseArray[16] = '0px 16px 24px -8px rgba(0,0,0,0.30),0px 24px 32px 3px rgba(0,0,0,0.22),0px 8px 40px 7px rgba(0,0,0,0.18)';
  baseArray[24] = '0px 24px 38px -12px rgba(0,0,0,0.38),0px 34px 46px 4px rgba(0,0,0,0.28),0px 12px 56px 10px rgba(0,0,0,0.25)';

  return baseArray;
};

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

  // Create MUI theme based on current mode with enhanced styling
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#1976d2' : '#90caf9',
            light: mode === 'light' ? '#42a5f5' : '#bbdefb',
            dark: mode === 'light' ? '#1565c0' : '#64b5f6',
            contrastText: '#fff'
          },
          secondary: {
            main: mode === 'light' ? '#9c27b0' : '#ce93d8',
            light: mode === 'light' ? '#ba68c8' : '#e1bee7',
            dark: mode === 'light' ? '#7b1fa2' : '#ab47bc',
            contrastText: '#fff'
          },
          error: {
            main: mode === 'light' ? '#d32f2f' : '#f44336',
            light: mode === 'light' ? '#ef5350' : '#e57373',
            dark: mode === 'light' ? '#c62828' : '#d32f2f',
          },
          warning: {
            main: mode === 'light' ? '#ed6c02' : '#ffa726',
            light: mode === 'light' ? '#ff9800' : '#ffb74d',
            dark: mode === 'light' ? '#e65100' : '#f57c00',
          },
          info: {
            main: mode === 'light' ? '#0288d1' : '#29b6f6',
            light: mode === 'light' ? '#03a9f4' : '#4fc3f7',
            dark: mode === 'light' ? '#01579b' : '#0288d1',
          },
          success: {
            main: mode === 'light' ? '#2e7d32' : '#66bb6a',
            light: mode === 'light' ? '#4caf50' : '#81c784',
            dark: mode === 'light' ? '#1b5e20' : '#388e3c',
          },
          background: {
            default: mode === 'light' ? '#f8f9fa' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          }
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 700,
          },
          h2: {
            fontWeight: 700,
          },
          h3: {
            fontWeight: 700,
          },
          h4: {
            fontWeight: 600,
          },
          h5: {
            fontWeight: 600,
          },
          h6: {
            fontWeight: 600,
          },
          subtitle1: {
            fontWeight: 500,
          },
          button: {
            fontWeight: 600,
            textTransform: 'none',
          },
        },
        shape: {
          borderRadius: 10,
        },
        shadows: generateShadows(),
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                padding: '8px 16px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                },
              },
              contained: {
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === 'light'
                  ? '0 2px 8px rgba(0,0,0,0.08)'
                  : '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: mode === 'light'
                    ? '0 6px 12px rgba(0,0,0,0.1)'
                    : '0 6px 12px rgba(0,0,0,0.3)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                transition: 'box-shadow 0.2s ease',
              },
              elevation1: {
                boxShadow: mode === 'light'
                  ? '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)'
                  : '0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: mode === 'light'
                  ? '0 1px 3px rgba(0,0,0,0.1)'
                  : '0 1px 3px rgba(0,0,0,0.2)',
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                fontWeight: 500,
              },
            },
          },
          MuiListItem: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
          MuiTableContainer: {
            styleOverrides: {
              root: {
                borderRadius: 12,
              },
            },
          },
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
