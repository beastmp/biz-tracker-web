import { createContext } from 'react';

// Define context type
export interface AppContextProps {
  theme: 'light' | 'dark';
  toggleColorMode: () => void;
  defaultViewMode: 'grid' | 'list';
  setDefaultViewMode: (mode: 'grid' | 'list') => void;
}

// Create context with default values and export it
export const AppContext = createContext<AppContextProps>({
  theme: 'light',
  toggleColorMode: () => {},
  defaultViewMode: 'list',
  setDefaultViewMode: () => {}
});
