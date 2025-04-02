import { useContext } from 'react';
import { SettingsContext, SettingsContextType } from '../context/SettingsContextDef';

/**
 * Hook for accessing and manipulating application settings
 * @returns Settings context object with current settings and methods
 */
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
}

export type { SettingsContextType };