import React, { useState, useEffect } from 'react';
import { SettingsContext, SettingsContextType } from './SettingsContextDef';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Low stock alert settings
  const [lowStockAlertsEnabled, setLowStockAlertsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('lowStockAlertsEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [quantityThreshold, setQuantityThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('quantityThreshold');
    return saved !== null ? parseInt(saved, 10) : 5;
  });

  const [weightThresholds, setWeightThresholds] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('weightThresholds');
    return saved !== null
      ? JSON.parse(saved)
      : {
          kg: 1,
          g: 500,
          lb: 2,
          oz: 32
        };
  });

  // Display settings
  const [defaultViewMode, setDefaultViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('defaultViewMode');
    return (saved === 'grid' || saved === 'list') ? saved : 'list';
  });

  const [defaultGroupBy, setDefaultGroupBy] = useState<'none' | 'category' | 'itemType'>(() => {
    const saved = localStorage.getItem('defaultGroupBy');
    return (saved === 'none' || saved === 'category' || saved === 'itemType')
      ? saved
      : 'none';
  });

  // Update a specific weight threshold
  const updateWeightThreshold = (unit: string, value: number) => {
    setWeightThresholds(prev => ({
      ...prev,
      [unit]: value
    }));
  };

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('lowStockAlertsEnabled', JSON.stringify(lowStockAlertsEnabled));
  }, [lowStockAlertsEnabled]);

  useEffect(() => {
    localStorage.setItem('quantityThreshold', quantityThreshold.toString());
  }, [quantityThreshold]);

  useEffect(() => {
    localStorage.setItem('weightThresholds', JSON.stringify(weightThresholds));
  }, [weightThresholds]);

  useEffect(() => {
    localStorage.setItem('defaultViewMode', defaultViewMode);
  }, [defaultViewMode]);

  useEffect(() => {
    localStorage.setItem('defaultGroupBy', defaultGroupBy);
  }, [defaultGroupBy]);

  const contextValue: SettingsContextType = {
    lowStockAlertsEnabled,
    setLowStockAlertsEnabled,
    quantityThreshold,
    setQuantityThreshold,
    weightThresholds,
    updateWeightThreshold,
    defaultViewMode,
    setDefaultViewMode,
    defaultGroupBy,
    setDefaultGroupBy
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
