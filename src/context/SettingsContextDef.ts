import { createContext } from 'react';

// Define context type
export interface SettingsContextType {
  // Low stock alert settings
  lowStockAlertsEnabled: boolean;
  setLowStockAlertsEnabled: (enabled: boolean) => void;
  quantityThreshold: number;
  setQuantityThreshold: (threshold: number) => void;
  weightThresholds: Record<string, number>;
  updateWeightThreshold: (unit: string, value: number) => void;

  // Display settings
  defaultViewMode: 'grid' | 'list';
  setDefaultViewMode: (mode: 'grid' | 'list') => void;
  defaultGroupBy: 'none' | 'category' | 'itemType';
  setDefaultGroupBy: (groupBy: 'none' | 'category' | 'itemType') => void;
}

// Create context with default values
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
