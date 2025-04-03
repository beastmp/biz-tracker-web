import React, { useState, useEffect, useCallback } from 'react';
import { Settings, SettingsContext, defaultSettings } from './SettingsContextDef';

const STORAGE_KEY = 'biz-tracker-settings';

interface SettingsProviderProps {
  children: React.ReactNode;
}

// Only export the Provider component from this file
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const loadSettings = useCallback(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Failed to load settings from storage:', error);
    }
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = useCallback((settingsToSave: Settings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
      return true;
    } catch (error) {
      console.error('Failed to save settings to storage:', error);
      return false;
    }
  }, []);

  const updateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [saveSettings]);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  }, [saveSettings]);

  return (
    <SettingsContext.Provider value={{
      settings,
      defaultSettings,
      updateSettings,
      resetSettings,
      loadSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Export only the component as default
export default SettingsProvider;
