import { createContext } from 'react';

// Define context type
export interface WeightThresholds {
  kg: number;
  g: number;
  lb: number;
  oz: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postal: string;
  country: string;
}

export interface Settings {
  // Inventory Settings
  lowStockAlertsEnabled: boolean;
  quantityThreshold: number;
  weightThresholds: WeightThresholds;
  defaultViewMode: 'grid' | 'list';
  defaultGroupBy: 'none' | 'category' | 'itemType';
  autoUpdateStock: boolean;
  autoUpdateFromPurchases: boolean;

  // Company Settings
  companyName: string;
  companyLogo: string;
  contactEmail: string;
  contactPhone: string;
  address: Address;

  // Sales & Taxes
  currency: string;
  includeTaxInPrice: boolean;
  sendReceiptEmail: boolean;
  taxRate: number;
  enableTaxExemptions: boolean;
  taxId: string;

  // Display Settings
  enableDarkMode: boolean;
  primaryColor: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  defaultReportPeriod: string;
  csvDelimiter: string;

  // Notifications
  enableNotifications: boolean;
  notifyLowStock: boolean;
  notifyNewSales: boolean;
  notifyNewPurchases: boolean;
  notifySystem: boolean;
  enableEmailNotifications: boolean;
  notificationEmail: string;
  emailFrequency: string;

  // Data & Storage
  autoSave: boolean;
  backupFrequency: string;
  backupLocation: string;

  // Advanced
  cacheDuration: number;
  enablePerformanceMode: boolean;
  debugMode: boolean;
  enableDevtools: boolean;
  enableExperimentalFeatures: boolean;
  enableBarcodeScanner: boolean;
  enableAIRecommendations: boolean;
}

export interface SettingsContextType {
  settings: Settings;
  defaultSettings: Settings;
  updateSettings: (settings: Settings) => void;
  resetSettings: () => void;
  loadSettings: () => void;
}

// Define default settings
export const defaultSettings: Settings = {
  // Inventory Settings
  lowStockAlertsEnabled: true,
  quantityThreshold: 10,
  weightThresholds: {
    kg: 5,
    g: 500,
    lb: 10,
    oz: 160
  },
  defaultViewMode: 'grid',
  defaultGroupBy: 'category',
  autoUpdateStock: true,
  autoUpdateFromPurchases: true,

  // Company Settings
  companyName: 'My Business',
  companyLogo: '',
  contactEmail: '',
  contactPhone: '',
  address: {
    street: '',
    city: '',
    state: '',
    postal: '',
    country: ''
  },

  // Sales & Taxes
  currency: 'USD',
  includeTaxInPrice: false,
  sendReceiptEmail: false,
  taxRate: 0,
  enableTaxExemptions: false,
  taxId: '',

  // Display Settings
  enableDarkMode: false,
  primaryColor: '#1976d2',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  language: 'en-US',
  defaultReportPeriod: 'month',
  csvDelimiter: ',',

  // Notifications
  enableNotifications: true,
  notifyLowStock: true,
  notifyNewSales: true,
  notifyNewPurchases: true,
  notifySystem: true,
  enableEmailNotifications: false,
  notificationEmail: '',
  emailFrequency: 'daily',

  // Data & Storage
  autoSave: true,
  backupFrequency: 'weekly',
  backupLocation: '',

  // Advanced
  cacheDuration: 5,
  enablePerformanceMode: false,
  debugMode: false,
  enableDevtools: false,
  enableExperimentalFeatures: false,
  enableBarcodeScanner: false,
  enableAIRecommendations: false
};

// Create context with default values
export const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  defaultSettings,
  updateSettings: () => {},
  resetSettings: () => {},
  loadSettings: () => {}
});