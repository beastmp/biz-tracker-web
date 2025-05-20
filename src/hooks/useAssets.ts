import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del, patch, RELATIONSHIP_TYPES, ENTITY_TYPES } from "@utils/apiClient";
import { BusinessAsset, Relationship } from "@custTypes/models";

const ASSETS_KEY = "assets";
const RELATIONSHIPS_KEY = "relationships";

// Hook to fetch all assets
export const useAssets = () => {
  return useQuery({
    queryKey: [ASSETS_KEY],
    queryFn: async () => {
      try {
        const response = await get<{ status: string; results: number; data: BusinessAsset[] }>("/assets");
        // Ensure we always return an array from the data property
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error("Error fetching assets:", error);
        return []; // Return empty array on error
      }
    }
  });
};

/**
 * Hook to fetch a single asset
 * 
 * @param {string | undefined} id - ID of the asset to fetch
 * @returns {Object} Query result with asset data
 */
export const useAsset = (id: string | undefined) => {
  return useQuery({
    queryKey: [ASSETS_KEY, id],
    queryFn: async () => {
      const response = await get<{ status: string; data: BusinessAsset }>(`/assets/${id}`);
      return response.data;
    },
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
      patch<BusinessAsset>(`/assets/${id || (asset as BusinessAsset).id}`, asset),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_KEY] });
      if (id || (variables as BusinessAsset).id) {
        queryClient.invalidateQueries({ queryKey: [ASSETS_KEY, id || (variables as BusinessAsset).id] });
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

/**
 * Hook to get assets categories
 * 
 * @returns {Object} Query result with categories data always as an array
 */
export const useAssetCategories = () => {
  return useQuery({
    queryKey: [ASSETS_KEY, "categories"],
    queryFn: async () => {
      try {
        const response = await get<{ status: string; data: string[] }>("/assets/categories");
        // Ensure we always return an array from the data property
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error("Error fetching asset categories:", error);
        return []; // Return empty array on error
      }
    }
  });
};

/**
 * Hook to get assets for a specific purchase using relationships
 * 
 * @param {string | undefined} purchaseId - ID of the purchase to get assets for
 * @returns {Object} Query result with relationships data always as an array
 */
export const useAssetsByPurchase = (purchaseId: string | undefined) => {
  return useQuery({
    queryKey: [RELATIONSHIPS_KEY, "purchase", purchaseId, "assets"],
    queryFn: async () => {
      try {
        const response = await get<{ status: string; results: number; data: Relationship[] }>(
          `/relationships/primary/${purchaseId}/Purchase?relationshipType=${RELATIONSHIP_TYPES.PURCHASE_ASSET}`
        );
        // Ensure we always return an array from the data property
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error(`Error fetching assets for purchase ${purchaseId}:`, error);
        return []; // Return empty array on error
      }
    },
    enabled: !!purchaseId
  });
};

/**
 * Hook to get purchase history for an asset
 * 
 * @param {string | undefined} assetId - ID of the asset to get purchase history for
 * @returns {Object} Query result with relationships data always as an array
 */
export const useAssetPurchases = (assetId: string | undefined) => {
  return useQuery({
    queryKey: [RELATIONSHIPS_KEY, "asset", assetId, "purchases"],
    queryFn: async () => {
      try {
        const response = await get<{ status: string; results: number; data: Relationship[] }>(
          `/relationships/secondary/${assetId}/Asset?relationshipType=${RELATIONSHIP_TYPES.PURCHASE_ASSET}`
        );
        // Ensure we always return an array from the data property
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error(`Error fetching purchase history for asset ${assetId}:`, error);
        return []; // Return empty array on error
      }
    },
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