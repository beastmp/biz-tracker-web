import { Item } from '@custTypes/models';
import { useSettings } from '../hooks/useSettings';

/**
 * Hook for formatting values according to user settings
 */
export function useFormattedValues() {
  const { settings } = useSettings();

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // Use the user's preferred date format
    if (settings.dateFormat === 'DD/MM/YYYY') {
      return dateObj.toLocaleDateString('en-GB', mergedOptions);
    } else if (settings.dateFormat === 'YYYY-MM-DD') {
      // For ISO format, we'll handle it differently
      const iso = dateObj.toISOString().split('T')[0];
      if (Object.keys(options || {}).length === 0) {
        return iso;
      }
      // If custom options were provided, still use locale formatting
      return dateObj.toLocaleDateString('en-US', mergedOptions);
    }

    // Default to US format
    return dateObj.toLocaleDateString('en-US', mergedOptions);
  };

  const formatDateTime = (date: Date | string): string => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const dateStr = formatDate(dateObj);
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: settings.timeFormat === '12h'
    };

    const timeStr = dateObj.toLocaleTimeString(
      settings.timeFormat === '24h' ? 'en-GB' : 'en-US',
      timeOptions
    );

    return `${dateStr} ${timeStr}`;
  };

  // Your other formatting functions...

  return {
    formatCurrency,
    formatDate,
    formatDateTime,
    // Include other formatting functions
  };
}

// Keep your standard formatters for non-component use, but they won't use settings
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Format a date in a standardized way
 */
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return new Date(date).toLocaleDateString('en-US', mergedOptions);
};

/**
 * Format a date with time
 */
export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get color for status chip based on status string
 */
export const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'refunded':
      return 'error';
    case 'partially_refunded':
      return 'warning';
    case 'pending':
      return 'info';
    case 'received':
      return 'success';
    case 'partially_received':
      return 'warning';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Format status string for display
 */
export const formatStatus = (status: string | undefined | null): string => {
  // Handle undefined or null status
  if (status === undefined || status === null || status === "") {
    return "Unknown";
  }

  return status.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Format payment method for display
 */
export const formatPaymentMethod = (method: string): string => {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'credit':
      return 'Credit Card';
    case 'debit':
      return 'Debit Card';
    case 'check':
      return 'Check';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'other':
      return 'Other';
    default:
      return method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Unknown';
  }
};

/**
 * Format measurement unit codes into human-readable labels
 */
export const formatUnit = (unit: string): string => {
  const unitLabels: Record<string, string> = {
    // Weight units
    'oz': 'oz',
    'lb': 'lb',
    'g': 'g',
    'kg': 'kg',
    // Length units
    'mm': 'mm',
    'cm': 'cm',
    'm': 'm',
    'in': 'in',
    'ft': 'ft',
    'yd': 'yd',
    // Area units
    'sqft': 'sq ft',
    'sqm': 'sq m',
    'sqyd': 'sq yd',
    'acre': 'acre',
    'ha': 'ha',
    // Volume units
    'ml': 'ml',
    'l': 'l',
    'gal': 'gal',
    'floz': 'fl oz',
    'cu_ft': 'cu ft',
    'cu_m': 'cu m'
  };

  return unitLabels[unit] || unit;
};

/**
 * Format measurement type to human-readable label
 */
export const formatMeasurementType = (type: string): string => {
  switch (type) {
    case 'quantity':
      return 'Quantity';
    case 'weight':
      return 'Weight';
    case 'length':
      return 'Length';
    case 'area':
      return 'Area';
    case 'volume':
      return 'Volume';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

/**
 * Format price type to display format
 */
export const formatPriceType = (priceType: string, unit?: string): string => {
  switch (priceType) {
    case 'each':
      return 'Each';
    case 'per_weight_unit':
      return `Per ${unit || 'weight unit'}`;
    case 'per_length_unit':
      return `Per ${unit || 'length unit'}`;
    case 'per_area_unit':
      return `Per ${unit || 'area unit'}`;
    case 'per_volume_unit':
      return `Per ${unit || 'volume unit'}`;
    default:
      return priceType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
};

/**
 * Format a measurement value with its unit
 */
export const formatMeasurementWithUnit = (value: number, unit: string): string => {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${formatUnit(unit)}`;
};

/**
 * Format item stock based on tracking type and measurement
 */
export const formatItemStock = (item: Item | Record<string, unknown>): string => {
  if (!item) return 'Unknown';

  switch (item.trackingType as string) {
    case 'quantity':
      return `${item.quantity || 0} units`;
    case 'weight':
      return `${item.weight || 0} ${formatUnit((item.weightUnit as string) || 'lb')}`;
    case 'length':
      return `${item.length || 0} ${formatUnit((item.lengthUnit as string) || 'in')}`;
    case 'area':
      return `${item.area || 0} ${formatUnit((item.areaUnit as string) || 'sqft')}`;
    case 'volume':
      return `${item.volume || 0} ${formatUnit((item.volumeUnit as string) || 'l')}`;
    default:
      return `${item.quantity || 0} units`;
  }
};

/**
 * Get formatted item price with appropriate unit
 */
export const formatItemPrice = (item: Item | Record<string, unknown>): string => {
  if (!item || typeof (item.price as number) !== 'number') return formatCurrency(0);

  const price = (item.price as number);

  switch (item.priceType as string) {
    case 'each':
      return formatCurrency(price);
    case 'per_weight_unit':
      return `${formatCurrency(price)}/${formatUnit((item.weightUnit as string) || 'lb')}`;
    case 'per_length_unit':
      return `${formatCurrency(price)}/${formatUnit((item.lengthUnit as string) || 'in')}`;
    case 'per_area_unit':
      return `${formatCurrency(price)}/${formatUnit((item.areaUnit as string) || 'sqft')}`;
    case 'per_volume_unit':
      return `${formatCurrency(price)}/${formatUnit((item.volumeUnit as string) || 'l')}`;
    default:
      return formatCurrency(price);
  }
};

/**
 * Format a measurement value with its unit
 * @param item - Item with tracking type and measurement value
 * @returns Formatted measurement string
 */
export const formatMeasurement = (item: Item): string => {
  if (!item) return '';

  switch (item.trackingType) {
    case 'quantity':
      return `${item.quantity} units`;
    case 'weight':
      return `${item.weight} ${item.weightUnit}`;
    case 'length':
      return `${item.length} ${item.lengthUnit}`;
    case 'area':
      return `${item.area} ${item.areaUnit}`;
    case 'volume':
      return `${item.volume} ${item.volumeUnit}`;
    default:
      return `${item.quantity} units`;
  }
};
