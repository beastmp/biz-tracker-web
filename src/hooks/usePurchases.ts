import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import apiClientInstance from '@utils/apiClient';
import { get, post, patch, del } from '@utils/apiClient';
import { Purchase, PurchasesReport, Item, PurchaseItem, PurchaseTrendItem } from '@custTypes/models';

// Query keys
const PURCHASES_KEY = 'purchases';
const PURCHASES_REPORT_KEY = 'purchases-report';

// Helper function to create a purchase item with the appropriate measurement values
export const createPurchaseItem = (
  item: Item,
  quantity: number = 0,
  weight: number = 0,
  length: number = 0,
  area: number = 0,
  volume: number = 0,
  costPerUnit: number = item.cost || 0
): PurchaseItem => {
  const measurementType = item.trackingType || 'quantity';

  const purchaseItem: PurchaseItem = {
    item: item._id || '',
    quantity: 0,
    weight: 0,
    weightUnit: item.weightUnit,
    length: 0,
    lengthUnit: item.lengthUnit,
    area: 0,
    areaUnit: item.areaUnit,
    volume: 0,
    volumeUnit: item.volumeUnit,
    costPerUnit: costPerUnit,
    totalCost: 0,
    purchasedBy: measurementType
  };

  // Set the appropriate measurement value based on tracking type
  switch (measurementType) {
    case 'quantity':
      purchaseItem.quantity = quantity;
      purchaseItem.totalCost = quantity * costPerUnit;
      break;
    case 'weight':
      purchaseItem.weight = weight;
      purchaseItem.totalCost = weight * costPerUnit;
      break;
    case 'length':
      purchaseItem.length = length;
      purchaseItem.totalCost = length * costPerUnit;
      break;
    case 'area':
      purchaseItem.area = area;
      purchaseItem.totalCost = area * costPerUnit;
      break;
    case 'volume':
      purchaseItem.volume = volume;
      purchaseItem.totalCost = volume * costPerUnit;
      break;
  }

  return purchaseItem;
};

// Helper function to validate purchase items
export const validatePurchaseItem = (purchaseItem: PurchaseItem): string | null => {
  switch (purchaseItem.purchasedBy) {
    case 'quantity':
      if (purchaseItem.quantity <= 0) {
        return 'Quantity must be greater than zero';
      }
      break;
    case 'weight':
      if (purchaseItem.weight <= 0) {
        return 'Weight must be greater than zero';
      }
      break;
    case 'length':
      if (purchaseItem.length <= 0) {
        return 'Length must be greater than zero';
      }
      break;
    case 'area':
      if (purchaseItem.area <= 0) {
        return 'Area must be greater than zero';
      }
      break;
    case 'volume':
      if (purchaseItem.volume <= 0) {
        return 'Volume must be greater than zero';
      }
      break;
  }
  return null;
};

// Helper function to calculate the total cost for a purchase item
export const calculatePurchaseItemTotal = (purchaseItem: PurchaseItem): number => {
  switch (purchaseItem.purchasedBy) {
    case 'quantity':
      return purchaseItem.quantity * purchaseItem.costPerUnit;
    case 'weight':
      return purchaseItem.weight * purchaseItem.costPerUnit;
    case 'length':
      return purchaseItem.length * purchaseItem.costPerUnit;
    case 'area':
      return purchaseItem.area * purchaseItem.costPerUnit;
    case 'volume':
      return purchaseItem.volume * purchaseItem.costPerUnit;
    default:
      return purchaseItem.quantity * purchaseItem.costPerUnit;
  }
};

// Helper function to format the purchase item measurement display
export const formatPurchaseItemMeasurement = (purchaseItem: PurchaseItem): string => {
  switch (purchaseItem.purchasedBy) {
    case 'quantity':
      return `${purchaseItem.quantity} units`;
    case 'weight':
      return `${purchaseItem.weight} ${purchaseItem.weightUnit || 'lb'}`;
    case 'length':
      return `${purchaseItem.length} ${purchaseItem.lengthUnit || 'in'}`;
    case 'area':
      return `${purchaseItem.area} ${purchaseItem.areaUnit || 'sqft'}`;
    case 'volume':
      return `${purchaseItem.volume} ${purchaseItem.volumeUnit || 'l'}`;
    default:
      return `${purchaseItem.quantity} units`;
  }
};

// Hook to fetch all purchases
export const usePurchases = () => {
  return useQuery({
    queryKey: [PURCHASES_KEY],
    queryFn: () => get<Purchase[]>('/api/purchases')
  });
};

// Hook to fetch a single purchase
export const usePurchase = (id: string | undefined) => {
  return useQuery({
    queryKey: [PURCHASES_KEY, id],
    queryFn: () => get<Purchase>(`/api/purchases/${id}`),
    enabled: !!id, // Only run if id exists
  });
};

// Hook to create a new purchase
export const useCreatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (purchase: Purchase) => post<Purchase>('/api/purchases', purchase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [PURCHASES_REPORT_KEY] });
      // Also invalidate items as inventory quantities change
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  });
};

// Hook to update a purchase
export const useUpdatePurchase = (id: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (purchase: Partial<Purchase>) => {
      if (!id) throw new Error("Purchase ID is required for updates");
      return patch<Purchase>(`/api/purchases/${id}`, purchase);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [PURCHASES_REPORT_KEY] });
      // Also invalidate items as inventory quantities may change
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  });
};

// Hook to delete a purchase
export const useDeletePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => del<void>(`/api/purchases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [PURCHASES_REPORT_KEY] });
      // Also invalidate items as inventory quantities change on delete
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  });
};

// Hook to get purchases report
export const usePurchasesReport = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: [PURCHASES_REPORT_KEY, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      return get<PurchasesReport>(`/api/purchases/reports/by-date?${params.toString()}`);
    },
    enabled: !!(startDate && endDate)
  });


};export function usePurchasesTrend(startDate?: string, endDate?: string) {
  const [data, setData] = useState<PurchaseTrendItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!startDate || !endDate) {
      return;
    }

    const fetchTrends = async () => {
      setIsLoading(true);
      try {
        // Define proper type for API response
        interface PurchaseTrendResponse {
          data: PurchaseTrendItem[];
        }

        const response = await apiClientInstance.get<PurchaseTrendResponse>(
          `/api/purchases/trends?startDate=${startDate}&endDate=${endDate}`
        );

        // Process data to include measurement type information
        const processedData = (response.data.data || []).map((item: PurchaseTrendItem) => ({
          ...item,
          // Include breakdowns by measurement type if available
          quantityTotal: item.measurementBreakdown?.quantity?.total || 0,
          weightTotal: item.measurementBreakdown?.weight?.total || 0,
          lengthTotal: item.measurementBreakdown?.length?.total || 0,
          areaTotal: item.measurementBreakdown?.area?.total || 0,
          volumeTotal: item.measurementBreakdown?.volume?.total || 0
        }));

        setData(processedData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch purchase trends data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrends();
  }, [startDate, endDate]);

  return { data, isLoading, error };
}
