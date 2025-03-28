import { useContext } from 'react';
import { AppContext, AppContextProps } from '@context/AppContextDef';

// Extract the hook to its own file
export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }

  return context;
};

export default useAppContext;
