import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del, patch, RELATIONSHIP_TYPES, ENTITY_TYPES } from "@utils/apiClient";
import { BusinessAsset, Relationship } from "@custTypes/models";

const ASSETS_KEY = "assets";
const RELATIONSHIPS_KEY = "relationships";

// Hook to fetch all assets
export const useAssets = () => {
  return useQuery({
    queryKey: [ASSETS_KEY],
    queryFn: () => get<BusinessAsset[]>("/assets")
  });
};

// Hook to fetch a single asset
export const useAsset = (id: string | undefined) => {
  return useQuery({
    queryKey: [ASSETS_KEY, id],
    queryFn: () => get<BusinessAsset>(`/assets/${id}`),
    enabled: !!id, // Only run if id exists
  });
};

// Hook to create a new asset
export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (asset: Partial<BusinessAsset> | FormData) => post<BusinessAsset>("/assets", asset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_KEY] });
    }
  });
};

// Hook to update an asset
export const useUpdateAsset = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (asset: Partial<BusinessAsset> | FormData) => 
      // Use PATCH instead of PUT for updates to match our backend convention
      patch<BusinessAsset>(`/assets/${id || (asset as BusinessAsset)._id}`, asset),
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
    mutationFn: (id: string) => del<void>(`/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_KEY] });
    }
  });
};

// Hook to create an asset from a purchase
export const useCreateAssetFromPurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { 
      purchaseId: string; 
      relationshipId?: string; 
      assetData: Partial<BusinessAsset> 
    }) =>
      post<BusinessAsset>("/assets/from-purchase", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_KEY] });
      queryClient.invalidateQueries({ queryKey: [RELATIONSHIPS_KEY] });
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
    }) => post<BusinessAsset>(`/assets/${data.assetId}/maintenance`, {
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
    queryKey: [ASSETS_KEY, "categories"],
    queryFn: () => get<string[]>("/assets/categories")
  });
};

// Hook to get assets for a specific purchase using relationships
export const useAssetsByPurchase = (purchaseId: string | undefined) => {
  return useQuery({
    queryKey: [RELATIONSHIPS_KEY, "purchase", purchaseId, "assets"],
    queryFn: () => get<Relationship[]>(
      `/relationships/primary/${purchaseId}/Purchase?relationshipType=${RELATIONSHIP_TYPES.PURCHASE_ASSET}`
    ),
    enabled: !!purchaseId
  });
};

// Hook to get purchase history for an asset
export const useAssetPurchases = (assetId: string | undefined) => {
  return useQuery({
    queryKey: [RELATIONSHIPS_KEY, "asset", assetId, "purchases"],
    queryFn: () => get<Relationship[]>(
      `/relationships/secondary/${assetId}/Asset?relationshipType=${RELATIONSHIP_TYPES.PURCHASE_ASSET}`
    ),
    enabled: !!assetId
  });
};

// Hook for asset status updates
export const useUpdateAssetStatus = (assetId: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { 
      status: string; 
      notes?: string;
      condition?: "excellent" | "good" | "fair" | "poor" | "damaged" | "unusable";
    }) => {
      if (!assetId) throw new Error("Asset ID is required");
      return patch<BusinessAsset>(`/assets/${assetId}/status`, data);
    },
    onSuccess: () => {
      if (assetId) {
        queryClient.invalidateQueries({ queryKey: [ASSETS_KEY, assetId] });
      }
      queryClient.invalidateQueries({ queryKey: [ASSETS_KEY] });
    }
  });
};