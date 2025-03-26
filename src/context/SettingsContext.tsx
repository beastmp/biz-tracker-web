import React, { createContext, useState, useContext, useEffect } from 'react';

type WeightThresholds = {
  kg: number;
  g: number;
  lb: number;
  oz: number;
};

type ViewMode = 'grid' | 'list';

interface SettingsContextType {
  lowStockAlertsEnabled: boolean;
  quantityThreshold: number;
  weightThresholds: WeightThresholds;
  setLowStockAlertsEnabled: (value: boolean) => void;
  setQuantityThreshold: (value: number) => void;
  setWeightThresholds: (thresholds: WeightThresholds) => void;
  updateWeightThreshold: (unit: keyof WeightThresholds, value: number) => void;
  defaultViewMode: ViewMode;
  setDefaultViewMode: (mode: ViewMode) => void;
}

const defaultWeightThresholds = {
  kg: 1,
  g: 500,
  lb: 2,
  oz: 16
};

const defaultSettings: SettingsContextType = {
  lowStockAlertsEnabled: true,
  quantityThreshold: 5,
  weightThresholds: defaultWeightThresholds,
  setLowStockAlertsEnabled: () => {},
  setQuantityThreshold: () => {},
  setWeightThresholds: () => {},
  updateWeightThreshold: () => {},
  defaultViewMode: 'grid',
  setDefaultViewMode: () => {}
};

const SettingsContext = createContext<SettingsContextType>(defaultSettings);

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lowStockAlertsEnabled, setLowStockAlertsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('lowStockAlertsEnabled');
    return saved !== null ? JSON.parse(saved) : defaultSettings.lowStockAlertsEnabled;
  });

  const [quantityThreshold, setQuantityThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('quantityThreshold');
    return saved !== null ? JSON.parse(saved) : defaultSettings.quantityThreshold;
  });

  const [weightThresholds, setWeightThresholds] = useState<WeightThresholds>(() => {
    const saved = localStorage.getItem('weightThresholds');
    return saved !== null ? JSON.parse(saved) : defaultSettings.weightThresholds;
  });

  const [defaultViewMode, setDefaultViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('defaultViewMode');
    return (saved as ViewMode) || defaultSettings.defaultViewMode;
  });

  const updateWeightThreshold = (unit: keyof WeightThresholds, value: number) => {
    setWeightThresholds(prev => ({
      ...prev,
      [unit]: value
    }));
  };

  useEffect(() => {
    localStorage.setItem('lowStockAlertsEnabled', JSON.stringify(lowStockAlertsEnabled));
  }, [lowStockAlertsEnabled]);

  useEffect(() => {
    localStorage.setItem('quantityThreshold', JSON.stringify(quantityThreshold));
  }, [quantityThreshold]);

  useEffect(() => {
    localStorage.setItem('weightThresholds', JSON.stringify(weightThresholds));
  }, [weightThresholds]);

  useEffect(() => {
    localStorage.setItem('defaultViewMode', defaultViewMode);
  }, [defaultViewMode]);

  return (
    <SettingsContext.Provider value={{
      lowStockAlertsEnabled,
      quantityThreshold,
      weightThresholds,
      setLowStockAlertsEnabled,
      setQuantityThreshold,
      setWeightThresholds,
      updateWeightThreshold,
      defaultViewMode,
      setDefaultViewMode
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
