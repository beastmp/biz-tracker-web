import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@utils/apiClient';
import { BusinessAsset } from '@custTypes/models';

const ASSETS_KEY = 'assets';

// Hook to fetch all assets
export const useAssets = () => {
  return useQuery({
    queryKey: [ASSETS_KEY],
    queryFn: () => get<BusinessAsset[]>('/api/assets')
  });
};

// Hook to fetch a single asset
export const useAsset = (id: string | undefined) => {
  return useQuery({
    queryKey: [ASSETS_KEY, id],
    queryFn: () => get<BusinessAsset>(`/api/assets/${id}`),
    enabled: !!id, // Only run if id exists
  });
};

// Hook to create a new asset
export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (asset: Partial<BusinessAsset> | FormData) => post<BusinessAsset>('/api/assets', asset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_KEY] });
    }
  });
};

// Hook to update an asset
export const useUpdateAsset = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (asset: Partial<BusinessAsset> | FormData) => put<BusinessAsset>(`/api/assets/${id || (asset as BusinessAsset)._id}`, asset),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_KEY] });
      if (id || (variables as BusinessAsset)._id) {
        queryClient.invalidateQueries({ queryKey: [ASSETS_KEY, id || (variables as BusinessAsset)._id] });
      }
    }
  });
};

// Hook to delete an asset
export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => del<void>(`/api/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_KEY] });
    }
  });
};

// Hook to create an asset from a purchase
export const useCreateAssetFromPurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { purchaseId: string; itemIndex: number; assetData: Partial<BusinessAsset> }) =>
      post<BusinessAsset>('/api/assets/from-purchase', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_KEY] });
    }
  });
};

// Hook to add maintenance record to an asset
export const useAddMaintenanceRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      assetId: string;
      date: string;
      description: string;
      cost: number;
      performedBy: string;
      frequency?: string;
    }) => post<BusinessAsset>(`/api/assets/${data.assetId}/maintenance`, {
      date: data.date,
      description: data.description,
      cost: data.cost,
      performedBy: data.performedBy,
      frequency: data.frequency
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ASSETS_KEY, variables.assetId] });
    }
  });
};

// Hook to get assets categories
export const useAssetCategories = () => {
  return useQuery({
    queryKey: [ASSETS_KEY, 'categories'],
    queryFn: () => get<string[]>('/api/assets/categories')
  });
};

// Hook to get assets for a specific purchase
export const useAssetsByPurchase = (purchaseId: string | undefined) => {
  return useQuery({
    queryKey: [ASSETS_KEY, 'purchase', purchaseId],
    queryFn: () => get<BusinessAsset[]>(`/api/assets/purchase/${purchaseId}`),
    enabled: !!purchaseId
  });
};