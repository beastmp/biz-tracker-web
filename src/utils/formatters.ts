/**
 * Format a number as currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
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
    case 'received':
      return 'success';
    case 'refunded':
    case 'cancelled':
      return 'error';
    case 'partially_refunded':
    case 'partially_received':
      return 'warning';
    case 'pending':
      return 'info';
    default:
      return 'default';
  }
};

/**
 * Format status string for display
 */
export const formatStatus = (status: string): string => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Format payment method for display
 */
export const formatPaymentMethod = (method: string): string => {
  switch (method) {
    case 'cash': return 'Cash';
    case 'credit': return 'Credit Card';
    case 'debit': return 'Debit Card';
    case 'check': return 'Check';
    case 'bank_transfer': return 'Bank Transfer';
    default: return 'Other';
  }
};
