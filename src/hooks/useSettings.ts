import { useContext } from 'react';
import { SettingsContext, SettingsContextType } from '@context/SettingsContextDef';

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);

  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
};

export default useSettings;
