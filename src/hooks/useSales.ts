import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '@utils/apiClient';
import { Sale, SalesReport } from '@custTypes/models';

// Query keys
const SALES_KEY = 'sales';
const SALES_REPORT_KEY = 'sales-report';

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
