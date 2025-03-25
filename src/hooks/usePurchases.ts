import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '@utils/apiClient';
import { Purchase, PurchasesReport } from '@custTypes/models';

// Query keys
const PURCHASES_KEY = 'purchases';
const PURCHASES_REPORT_KEY = 'purchases-report';

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
};
