import axios, { AxiosRequestConfig } from 'axios';
import { config } from '@config/env';
import { Item, TrackingType } from '@custTypes/models';

// Create a normalized base URL without duplicate /api segments
const normalizeBaseUrl = (url: string) => {
  // Remove trailing slashes
  const baseUrl = url.replace(/\/+$/, '');

  // Check if baseUrl already ends with /api
  if (baseUrl.endsWith('/api')) {
    return baseUrl;
  }
  return baseUrl;
};

// Create an API client with baseURL
const apiClient = axios.create({
  baseURL: normalizeBaseUrl(config.API_URL),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor
apiClient.interceptors.request.use(
  config => {
    // Special handling for FormData
    if (config.data instanceof FormData) {
      // Let the browser set the correct Content-Type with boundary
      delete config.headers['Content-Type'];
    }

    // Debug logging
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      endpoint: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// HTTP methods
export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.get<T>(url, config);
  return response.data;
};

export const post = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

export const put = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

export const patch = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
};

export const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
};

// Special case for form data (file uploads)
export const postFormData = async <T>(url: string, formData: FormData): Promise<T> => {
  const response = await apiClient.post<T>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: false
  });
  return response.data;
};

// Special case for form data updates (for file uploads in PATCH requests)
export const patchFormData = async <T>(url: string, formData: FormData): Promise<T> => {
  const response = await apiClient.patch<T>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: false
  });
  return response.data;
};

// Helper function for unit conversion between different measurement types
export const convertUnits = (value: number, fromUnit: string, toUnit: string): number => {
  // Skip conversion if units are the same
  if (fromUnit === toUnit) return value;

  // Weight conversions
  const weightConversions: Record<string, number> = {
    'oz': 1,
    'lb': 16,      // 1 lb = 16 oz
    'g': 0.035274, // 1 g = 0.035274 oz
    'kg': 35.274   // 1 kg = 35.274 oz
  };

  // Length conversions
  const lengthConversions: Record<string, number> = {
    'mm': 0.03937,  // 1 mm = 0.03937 in
    'cm': 0.3937,   // 1 cm = 0.3937 in
    'm': 39.37,     // 1 m = 39.37 in
    'in': 1,
    'ft': 12,       // 1 ft = 12 in
    'yd': 36        // 1 yd = 36 in
  };

  // Area conversions
  const areaConversions: Record<string, number> = {
    'sqft': 1,
    'sqm': 10.7639,  // 1 sq m = 10.7639 sq ft
    'sqyd': 9,       // 1 sq yd = 9 sq ft
    'acre': 43560,   // 1 acre = 43560 sq ft
    'ha': 107639     // 1 ha = 107639 sq ft
  };

  // Volume conversions
  const volumeConversions: Record<string, number> = {
    'ml': 0.0338,    // 1 ml = 0.0338 fl oz
    'l': 33.814,     // 1 l = 33.814 fl oz
    'gal': 128,      // 1 gal = 128 fl oz
    'floz': 1,
    'cu_ft': 957.506,// 1 cu ft = 957.506 fl oz
    'cu_m': 33814    // 1 cu m = 33814 fl oz
  };

  // Determine which conversion table to use
  let conversionTable: Record<string, number> | null = null;
  if (fromUnit in weightConversions && toUnit in weightConversions) {
    conversionTable = weightConversions;
  } else if (fromUnit in lengthConversions && toUnit in lengthConversions) {
    conversionTable = lengthConversions;
  } else if (fromUnit in areaConversions && toUnit in areaConversions) {
    conversionTable = areaConversions;
  } else if (fromUnit in volumeConversions && toUnit in volumeConversions) {
    conversionTable = volumeConversions;
  }

  if (!conversionTable) {
    console.error(`Conversion from ${fromUnit} to ${toUnit} not supported`);
    return value;
  }

  // Convert to base unit then to target unit
  const valueInBaseUnit = value * conversionTable[fromUnit];
  return valueInBaseUnit / conversionTable[toUnit];
};

// Helper function to format measurements based on tracking type
export const formatMeasurement = (item: Item | Record<string, unknown>): string => {
  if (!item) return 'Unknown';

  const trackingType = item.trackingType as TrackingType;

  switch (trackingType) {
    case 'quantity':
      return `${item.quantity} units`;
    case 'weight':
      return `${item.weight} ${formatUnit((item.weightUnit as string) || 'lb')}`;
    case 'length':
      return `${item.length} ${formatUnit((item.lengthUnit as string) || 'in')}`;
    case 'area':
      return `${item.area} ${formatUnit((item.areaUnit as string) || 'sqft')}`;
    case 'volume':
      return `${item.volume} ${formatUnit((item.volumeUnit as string) || 'l')}`;
    default:
      return `${item.quantity} units`;
  }
};

// Helper function to format unit codes into human-readable strings
const formatUnit = (unit: string): string => {
  const unitMap: Record<string, string> = {
    'oz': 'oz', 'lb': 'lb', 'g': 'g', 'kg': 'kg',
    'mm': 'mm', 'cm': 'cm', 'm': 'm', 'in': 'in', 'ft': 'ft', 'yd': 'yd',
    'sqft': 'sq ft', 'sqm': 'sq m', 'sqyd': 'sq yd', 'acre': 'acre', 'ha': 'ha',
    'ml': 'ml', 'l': 'l', 'gal': 'gal', 'floz': 'fl oz', 'cu_ft': 'cu ft', 'cu_m': 'cu m'
  };

  return unitMap[unit] || unit;
};

export default apiClient;
