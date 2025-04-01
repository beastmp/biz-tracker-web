import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '@utils/apiClient';
import { Sale, SalesReport, Item, SaleItem, SalesTrendItem } from '@custTypes/models';
import { useState, useEffect } from 'react';
import apiClientInstance from '@utils/apiClient';

// Query keys
const SALES_KEY = 'sales';
const SALES_REPORT_KEY = 'sales-report';

// Helper function to create a sale item with the appropriate measurement values
export const createSaleItem = (
  item: Item,
  quantity: number = 0,
  weight: number = 0,
  length: number = 0,
  area: number = 0,
  volume: number = 0,
  customPrice?: number
): SaleItem => {
  const measurementType = item.sellByMeasurement || item.trackingType || 'quantity';
  const price = customPrice !== undefined ? customPrice : item.price || 0;

  const saleItem: SaleItem = {
    item: item._id || '',
    name: item.name, // Add name field which is needed in several components
    quantity: 0,
    weight: 0,
    weightUnit: item.weightUnit,
    length: 0,
    lengthUnit: item.lengthUnit,
    area: 0,
    areaUnit: item.areaUnit,
    volume: 0,
    volumeUnit: item.volumeUnit,
    priceAtSale: price,
    soldBy: measurementType
  };

  // Set the appropriate measurement value based on tracking type
  switch (measurementType) {
    case 'quantity':
      saleItem.quantity = quantity;
      break;
    case 'weight':
      saleItem.weight = weight;
      break;
    case 'length':
      saleItem.length = length;
      break;
    case 'area':
      saleItem.area = area;
      break;
    case 'volume':
      saleItem.volume = volume;
      break;
  }

  return saleItem;
};

// Helper function to validate sale item quantities against inventory
export const validateSaleItem = (item: Item, saleItem: SaleItem): string | null => {
  switch (saleItem.soldBy) {
    case 'quantity':
      if (saleItem.quantity <= 0) {
        return 'Quantity must be greater than zero';
      }
      if (saleItem.quantity > (item.quantity || 0)) {
        return `Only ${item.quantity} units available in stock`;
      }
      break;
    case 'weight':
      if (saleItem.weight <= 0) {
        return 'Weight must be greater than zero';
      }
      if (saleItem.weight > (item.weight || 0)) {
        return `Only ${item.weight} ${item.weightUnit} available in stock`;
      }
      break;
    case 'length':
      if (saleItem.length <= 0) {
        return 'Length must be greater than zero';
      }
      if (saleItem.length > (item.length || 0)) {
        return `Only ${item.length} ${item.lengthUnit} available in stock`;
      }
      break;
    case 'area':
      if (saleItem.area <= 0) {
        return 'Area must be greater than zero';
      }
      if (saleItem.area > (item.area || 0)) {
        return `Only ${item.area} ${item.areaUnit} available in stock`;
      }
      break;
    case 'volume':
      if (saleItem.volume <= 0) {
        return 'Volume must be greater than zero';
      }
      if (saleItem.volume > (item.volume || 0)) {
        return `Only ${item.volume} ${item.volumeUnit} available in stock`;
      }
      break;
  }
  return null;
};

// Helper function to calculate the total price for a sale item
export const calculateSaleItemTotal = (saleItem: SaleItem): number => {
  switch (saleItem.soldBy) {
    case 'quantity':
      return saleItem.quantity * saleItem.priceAtSale;
    case 'weight':
      return saleItem.weight * saleItem.priceAtSale;
    case 'length':
      return saleItem.length * saleItem.priceAtSale;
    case 'area':
      return saleItem.area * saleItem.priceAtSale;
    case 'volume':
      return saleItem.volume * saleItem.priceAtSale;
    default:
      return saleItem.quantity * saleItem.priceAtSale;
  }
};

// Hook to fetch all sales
export const useSales = () => {
  return useQuery({
    queryKey: [SALES_KEY],
    queryFn: () => get<Sale[]>('/api/sales')
  });
};

// Hook to fetch a single sale
export const useSale = (id: string | undefined) => {
  return useQuery({
    queryKey: [SALES_KEY, id],
    queryFn: () => get<Sale>(`/api/sales/${id}`),
    enabled: !!id, // Only run if id exists
  });
};

// Hook to create a new sale
export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sale: Sale) => {
      // Fix any potential URL duplication issues
      const endpoint = '/api/sales';
      console.log('Creating sale with data:', sale);
      return post<Sale>(endpoint, sale);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_KEY] });
      queryClient.invalidateQueries({ queryKey: [SALES_REPORT_KEY] });
      // Also invalidate items as inventory quantities change
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  });
};

// Hook to update a sale
export const useUpdateSale = (id: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sale: Partial<Sale>) => {
      if (!id) throw new Error("Sale ID is required for updates");
      return patch<Sale>(`/api/sales/${id}`, sale);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_KEY] });
      queryClient.invalidateQueries({ queryKey: [SALES_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [SALES_REPORT_KEY] });
      // Also invalidate items as inventory quantities may change
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  });
};

// Hook to delete a sale
export const useDeleteSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => del<void>(`/api/sales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_KEY] });
      queryClient.invalidateQueries({ queryKey: [SALES_REPORT_KEY] });
      // Also invalidate items as inventory quantities change on delete
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  });
};

// Hook to get sales report
export const useSalesReport = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: [SALES_REPORT_KEY, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      return get<SalesReport>(`/api/sales/reports/by-date?${params.toString()}`);
    },
    enabled: !!(startDate && endDate)
  });
};

// Hook to get sales containing a specific item
export const useItemSales = (itemId: string | undefined) => {
  return useQuery({
    queryKey: [SALES_KEY, 'item', itemId],
    queryFn: () => get<Sale[]>(`/api/sales/item/${itemId}`),
    enabled: !!itemId // Only run if itemId exists
  });
};

export function useSalesTrend(startDate?: string, endDate?: string) {
  const [data, setData] = useState<SalesTrendItem[]>([]);
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
        interface SalesTrendResponse {
          data: SalesTrendItem[];
        }

        const response = await apiClientInstance.get<SalesTrendResponse>(`/api/sales/trends?startDate=${startDate}&endDate=${endDate}`);

        // Process data to include measurement type information
        const processedData = (response.data.data || []).map((item: SalesTrendItem) => ({
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
        setError(err instanceof Error ? err : new Error('Failed to fetch trends data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrends();
  }, [startDate, endDate]);

  return { data, isLoading, error };
}