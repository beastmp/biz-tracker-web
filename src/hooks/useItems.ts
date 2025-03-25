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
    queryKey: [ITEMS_KEY, id],
    queryFn: () => get<Item>(`/api/items/${id}`),
    enabled: !!id, // Only run if id exists
  });
};

// Hook to create a new item
export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Item | FormData) => {
      // If FormData, don't stringify
      if (data instanceof FormData) {
        return post<Item>('/api/items', data, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      return post<Item>('/api/items', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
    }
  });
};

// Hook to update an item
export const useUpdateItem = (id: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData: FormData | Item) => {
      if (!id) throw new Error('Item ID is required');

      // Check if we're dealing with FormData
      if (itemData instanceof FormData) {
        // Fix the double slash in URL by ensuring baseURL doesn't end with slash
        const baseUrl = config.API_URL.endsWith('/')
          ? config.API_URL.slice(0, -1)
          : config.API_URL;

        // Log for debugging
        console.log(`Making PATCH request to: ${baseUrl}/api/items/${id}`);

        const response = await axios({
          method: 'patch',
          url: `${baseUrl}/api/items/${id}`,
          data: itemData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // Add detailed logging
          onUploadProgress: (progressEvent) => {
            console.log('Upload progress:', progressEvent);
          }
        });
        return response.data;
      } else {
        // Regular JSON data
        return await patch<Item>(`/api/items/${id}`, itemData);
      }
    },
    onSuccess: () => {
      // Invalidate both the list and the specific item
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ITEM_KEY, id] });
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
