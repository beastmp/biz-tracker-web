import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios'; // Add this import
import { get, post, patch, del } from '@utils/apiClient';
import { Item } from '@custTypes/models';
import { config } from '@config/env';

// Query keys
const ITEMS_KEY = 'items';
const ITEM_KEY = 'item';
const CATEGORIES_KEY = 'categories';
const TAGS_KEY = 'tags';
const SKU_KEY = 'nextSku';

// Hook to fetch all items
export const useItems = () => {
  return useQuery({
    queryKey: [ITEMS_KEY],
    queryFn: () => get<Item[]>('/api/items')
  });
};

// Hook to fetch a single item
export const useItem = (id: string | undefined) => {
  return useQuery({
    queryKey: [ITEM_KEY, id], // Make sure we're using ITEM_KEY for consistency
    queryFn: async () => {
      try {
        // Always request populated version for relationship data
        return await get<Item>(`/api/items/${id}?populate=true`);
      } catch (error) {
        console.error(`Error fetching item ${id}:`, error);
        throw error;
      }
    },
    enabled: !!id, // Only run if id exists
  });
};

// Hook to create a new item
export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData: FormData | Item) => {
      try {
        // Check if we're dealing with FormData with an actual image file
        if (itemData instanceof FormData) {
          // Check if there's an actual new image file being uploaded
          let hasImageFile = false;
          for (const pair of itemData.entries()) {
            if (pair[0] === 'image' && pair[1] instanceof File && (pair[1] as File).size > 0) {
              hasImageFile = true;
              break;
            }
          }

          // If no actual file is being uploaded, convert to regular JSON
          if (!hasImageFile) {
            const jsonData: Record<string, unknown> = {};
            for (const [key, value] of itemData.entries()) {
              // Parse special fields as needed
              if (key === 'tags' && typeof value === 'string') {
                try {
                  jsonData[key] = JSON.parse(value);
                } catch {
                  // If not valid JSON, use as-is
                  jsonData[key] = value;
                }
              } else if ([
                'quantity', 'weight', 'length', 'area', 'volume', 'price', 'cost'
              ].includes(key) && typeof value === 'string') {
                // Parse all numeric fields
                jsonData[key] = parseFloat(value) || 0;
              } else {
                jsonData[key] = value;
              }
            }
            return await post<Item>('/api/items', jsonData);
          }

          // Using FormData for file upload
          console.log('Form data contents:');
          for (const pair of itemData.entries()) {
            const value = pair[1];
            const valueDisplay = value instanceof File
              ? `File: ${value.name} (${value.type}, ${value.size} bytes)`
              : value;
            console.log(`${pair[0]}: ${valueDisplay}`);
          }

          const response = await axios({
            method: 'post',
            url: `${config.API_URL.replace(/\/+$/, '')}/api/items`,
            data: itemData,
            // Let browser set the content type with boundary
            headers: {},
            timeout: 60000,
            maxContentLength: 10 * 1024 * 1024,
            maxBodyLength: 10 * 1024 * 1024,
          });
          return response.data;
        } else {
          // Regular JSON data
          return await post<Item>('/api/items', itemData);
        }
      } catch (error: unknown) {
        // Type narrowing for different error types
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: unknown }; message?: string };
          console.error('Failed to create item:', axiosError.response?.data || axiosError.message);
        } else {
          console.error('Failed to create item:', error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
    },
  });
};

// Hook to update an item
export const useUpdateItem = (initialId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData: FormData | Item, id?: string) => {
      // Use the provided ID, or the initial ID, or try to get it from the item data
      const effectiveId = id || initialId || (
        itemData instanceof FormData ? undefined : itemData._id
      );

      if (!effectiveId) {
        throw new Error('Item ID is required for updates');
      }

      // Check if we're dealing with FormData with an actual image file
      if (itemData instanceof FormData) {
        // Check if there's an actual new image file being uploaded
        let hasImageFile = false;
        for (const pair of itemData.entries()) {
          if (pair[0] === 'image' && pair[1] instanceof File) {
            hasImageFile = true;
            break;
          }
        }

        // If no actual file is being uploaded, convert to regular JSON
        if (!hasImageFile) {
          const jsonData: Record<string, unknown> = {};
          for (const [key, value] of itemData.entries()) {
            // Parse special fields as needed
            if (key === 'tags') {
              jsonData[key] = JSON.parse(value as string);
            } else if ([
              'quantity', 'weight', 'length', 'area', 'volume', 'price', 'cost'
            ].includes(key)) {
              // Parse all numeric measurement fields
              jsonData[key] = parseFloat(value as string);
            } else {
              jsonData[key] = value;
            }
          }
          return await patch<Item>(`/api/items/${id}`, jsonData);
        }

        try {
          // Fix the URL - remove duplicate /api/ segment
          const baseUrl = config.API_URL.replace(/\/+$/, '');
          let apiPath = `/api/items/${id}`;

          // Parse URL to ensure no duplicate path segments
          const url = new URL(baseUrl);
          // Make sure there's only one /api in the path
          if (url.pathname.endsWith('/api')) {
            apiPath = apiPath.replace(/^\/api/, '');
          }

          const requestUrl = url.toString() + apiPath;

          console.log(`Making PATCH request to: ${requestUrl}`);
          console.log('FormData entries:');
          for (const pair of itemData.entries()) {
            const value = pair[1];
            const valueDisplay = value instanceof File
              ? `File: ${value.name} (${value.type}, ${value.size} bytes)`
              : value;
            console.log(`- ${pair[0]}: ${valueDisplay}`);
          }

          const response = await axios({
            method: 'patch',
            url: requestUrl,
            data: itemData,
            // Let browser set the correct content-type with boundary
            headers: {},
            timeout: 60000,
            maxContentLength: 10 * 1024 * 1024,
            maxBodyLength: 10 * 1024 * 1024,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
              console.log(`Upload progress: ${percentCompleted}%`);
            }
          });
          return response.data;
        } catch (error: unknown) {
          // Type narrowing for different error types
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { data?: unknown }; message?: string };
            console.error('Upload error details:', axiosError.response?.data || axiosError.message);
          } else {
            console.error('Upload error:', error);
          }
          throw error;
        }
      } else {
        // Regular JSON data
        return await patch<Item>(`/api/items/${effectiveId}`, itemData);
      }
    },
    onSuccess: (_, __, id) => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ITEM_KEY, id || initialId] });
    },
  });
};

// Hook to delete an item
export const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => del<void>(`/api/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
    }
  });
};

// Hook to get the next SKU
export const useNextSku = () => {
  return useQuery({
    queryKey: [SKU_KEY],
    queryFn: async () => {
      try {
        const response = await get<{ nextSku: string }>('/api/items/nextsku');
        return response.nextSku;
      } catch (error) {
        console.error('Error in getNextSku:', error);
        return "0000000001"; // Default fallback
      }
    },
    staleTime: Infinity, // This rarely changes during a session
  });
};

// Hook to get all categories
export const useCategories = () => {
  return useQuery({
    queryKey: [CATEGORIES_KEY],
    queryFn: async () => {
      try {
        return await get<string[]>('/api/items/categories');
      } catch (error) {
        console.error('Error in getCategories:', error);
        return []; // Default fallback
      }
    }
  });
};

// Hook to get all tags
export const useTags = () => {
  return useQuery({
    queryKey: [TAGS_KEY],
    queryFn: async () => {
      try {
        return await get<string[]>('/api/items/tags');
      } catch (error) {
        console.error('Error in getTags:', error);
        return []; // Default fallback
      }
    }
  });
};

// Hook to rebuild item relationships
export const useRebuildRelationships = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => post('/api/items/rebuild-relationships'),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
    }
  });
};

// Hook to create breakdown items from a generic item
export const useCreateBreakdownItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (breakdownData: {
      sourceItemId: string;
      derivedItems: Array<{
        // Common ID field - if specified, use existing item
        itemId?: string;

        // Fields for new items (only used when itemId is not provided)
        name?: string;
        sku?: string;
        description?: string;
        category?: string;
        price?: number;
        cost?: number;
        tags?: string[];
        imageUrl?: string;

        // Measurement fields - all supported types
        quantity: number;
        weight?: number;
        length?: number;
        area?: number;
        volume?: number;
      }>;
    }) => {
      try {
        return await post<{
          sourceItem: Item;
          derivedItems: Item[];
        }>(`/api/items/${breakdownData.sourceItemId}/breakdown`, breakdownData);
      } catch (error: unknown) {
        // Type narrowing for different error types
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: unknown }; message?: string };
          console.error('Failed to create breakdown items:', axiosError.response?.data || axiosError.message);
        } else {
          console.error('Failed to create breakdown items:', error);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
      if (data.sourceItem._id) {
        queryClient.invalidateQueries({ queryKey: [ITEM_KEY, data.sourceItem._id] });
      }
      // Also invalidate any derived/allocated items
      data.derivedItems.forEach(item => {
        if (item._id) {
          queryClient.invalidateQueries({ queryKey: [ITEM_KEY, item._id] });
        }
      });
    },
  });
};

// Hook to get derived items for a specific item
export const useDerivedItems = (itemId: string | undefined) => {
  return useQuery({
    queryKey: [ITEMS_KEY, itemId, 'derived'],
    queryFn: () => get<Item[]>(`/api/items/${itemId}/derived`),
    enabled: !!itemId, // Only run if id exists
  });
};

// Hook to get parent item (if this item is derived from another)
export const useParentItem = (itemId: string | undefined) => {
  return useQuery({
    queryKey: [ITEMS_KEY, itemId, 'parent'],
    queryFn: () => get<Item>(`/api/items/${itemId}/parent`),
    enabled: !!itemId, // Only run if id exists
  });
};

/**
 * Hook to rebuild inventory based on purchase and sales history
 */
export const useRebuildInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Add back the 'utility/' segment in the URL
      const response = await post<{ processed: number; updated: number; errors: number; details: any[] }>(
        '/api/items/utility/rebuild-inventory'
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate items cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

/**
 * Hook to rebuild a specific item's inventory
 */
export const useRebuildItemInventory = (itemId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!itemId) {
        throw new Error('Item ID is required');
      }
      // Add back the 'utility/' segment in the URL
      const response = await post<{ updated: boolean; changes: any }>(
        `/api/items/utility/rebuild-inventory/${itemId}`
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate specific item cache
      if (itemId) {
        queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      }
      // Also invalidate the general items list
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};
