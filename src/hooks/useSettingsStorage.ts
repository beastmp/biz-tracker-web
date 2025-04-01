import { Settings } from '../context/SettingsContextDef';

const STORAGE_KEY = 'biz-tracker-settings';

/**
 * Helper functions to manage settings storage
 */
export const settingsStorage = {
  /**
   * Save settings to localStorage
   * @param settings The settings object to save
   */
  saveSettings: (settings: Settings): boolean => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to save settings to storage:', error);
      return false;
    }
  },

  /**
   * Load settings from localStorage
   * @returns The settings object or null if not found or error
   */
  loadSettings: (): Settings | null => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      if (!storedSettings) return null;
      return JSON.parse(storedSettings);
    } catch (error) {
      console.error('Failed to load settings from storage:', error);
      return null;
    }
  },

  /**
   * Clear settings from localStorage
   */
  clearSettings: (): boolean => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear settings from storage:', error);
      return false;
    }
  }
};

/**
 * Hook for accessing settings storage functions
 * @deprecated Use the SettingsContext methods directly instead
 */
export function useSettingsStorage() {
  return settingsStorage;
}

export default useSettingsStorage;
