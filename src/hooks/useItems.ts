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
    mutationFn: async (itemData: FormData | Item) => {
      try {
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
            const jsonData: Record<string, any> = {};
            for (const [key, value] of itemData.entries()) {
              // Parse special fields as needed
              if (key === 'tags') {
                try {
                  jsonData[key] = JSON.parse(value as string);
                } catch {
                  // If not valid JSON, use as-is
                  jsonData[key] = value;
                }
              } else if (['quantity', 'weight', 'price'].includes(key)) {
                jsonData[key] = parseFloat(value as string) || 0;
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
      } catch (error: any) {
        console.error('Failed to create item:', error.response?.data || error.message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
    },
  });
};

// Hook to update an item
export const useUpdateItem = (id: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData: FormData | Item) => {
      if (!id) throw new Error('Item ID is required');

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
          const jsonData: Record<string, any> = {};
          for (const [key, value] of itemData.entries()) {
            // Parse special fields as needed
            if (key === 'tags') {
              jsonData[key] = JSON.parse(value as string);
            } else if (['quantity', 'weight', 'price'].includes(key)) {
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
          const apiPath = `/api/items/${id}`;

          // Parse URL to ensure no duplicate path segments
          const url = new URL(baseUrl);
          // Make sure there's only one /api in the path
          if (url.pathname.endsWith('/api')) {
            url.pathname = url.pathname;
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
        } catch (error: any) {
          console.error('Upload error details:', error.response?.data || error.message);
          throw error;
        }
      } else {
        // Regular JSON data
        return await patch<Item>(`/api/items/${id}`, itemData);
      }
    },
    onSuccess: () => {
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
