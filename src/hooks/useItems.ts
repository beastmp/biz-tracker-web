import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch, del, postFormData, RELATIONSHIP_TYPES, ENTITY_TYPES } from "@utils/apiClient";
import { Item, Relationship } from "@custTypes/models";
import { config } from "@config/env";

// Query keys
const ITEMS_KEY = "items";
const ITEM_KEY = "item";
const CATEGORIES_KEY = "categories";
const TAGS_KEY = "tags";
const SKU_KEY = "nextSku";
const RELATIONSHIPS_KEY = "relationships";

// Hook to fetch all items
/**
 * Hook to fetch all items without pagination limits
 * 
 * @returns {Object} Query result with items data always as an array
 */
export const useItems = () => {
  return useQuery({
    queryKey: [ITEMS_KEY],
    queryFn: async () => {
      try {
        // Request all items by setting a very high limit
        const response = await get<{ status: string; results: number; data: Item[] }>("/items?page=1&limit=10000");
        // Ensure we always return an array from the data property
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error("Error fetching items:", error);
        return []; // Return empty array on error
      }
    }
  });
};

// Hook to fetch a single item
export const useItem = (id: string | undefined) => {
  return useQuery({
    queryKey: [ITEM_KEY, id], // Make sure we're using ITEM_KEY for consistency
    queryFn: async () => {
      try {
        // Always request populated version for relationship data
        const response = await get<{ status: string; data: Item }>(`/items/${id}?populate=true`);
        return response.data;
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
            return await post<Item>('/items', jsonData);
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

          // Use the postFormData utility instead of direct axios
          return await postFormData<Item>('/items', itemData);
        } else {
          // Regular JSON data
          return await post<Item>('/items', itemData);
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
/**
 * Hook to update an item, letting the backend handle tag array conversion
 * 
 * @param {string} [initialId] - Optional initial ID of the item to update
 * @returns {Object} Mutation object for updating an item
 */
export const useUpdateItem = (initialId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData: FormData | Item, id?: string) => {
      // Use the provided ID, or the initial ID, or try to get it from the item data
      const effectiveId = id || initialId || (
        itemData instanceof FormData ? undefined : itemData.id
      );

      if (!effectiveId) {
        throw new Error("Item ID is required for updates");
      }

      // Check if we're dealing with FormData with an actual image file
      if (itemData instanceof FormData) {
        // Check if there's an actual new image file being uploaded
        let hasImageFile = false;
        for (const pair of itemData.entries()) {
          if (pair[0] === "image" && pair[1] instanceof File) {
            hasImageFile = true;
            break;
          }
        }

        // If no actual file is being uploaded, convert to regular JSON
        if (!hasImageFile) {
          const jsonData: Record<string, unknown> = {};
          
          // Pre-process FormData without special tag handling
          for (const [key, value] of itemData.entries()) {
            if ([
              "quantity", "weight", "length", "area", "volume", "price", "cost"
            ].includes(key)) {
              // Parse all numeric measurement fields
              jsonData[key] = parseFloat(value as string);
            } else if (key === "tags" && typeof value === "string") {
              // Simple parsing of tags as JSON without special handling for empty arrays
              try {
                jsonData[key] = JSON.parse(value);
              } catch (e) {
                jsonData[key] = value;
              }
            } else {
              jsonData[key] = value;
            }
          }
          
          console.log(`Sending JSON data update to: /items/${effectiveId}`);
          
          return await patch<Item>(`/items/${effectiveId}`, jsonData);
        }

        try {
          console.log(`Making PATCH request to: /items/${effectiveId}`);
          console.log("FormData entries:");
          
          for (const pair of itemData.entries()) {
            const value = pair[1];
            const valueDisplay = value instanceof File
              ? `File: ${value.name} (${value.type}, ${value.size} bytes)`
              : value;
            console.log(`- ${pair[0]}: ${valueDisplay}`);
          }

          // Use the patch utility without special tag handling
          return await patch<Item>(`/items/${effectiveId}`, itemData);
        } catch (error: unknown) {
          // Type narrowing for different error types
          if (error && typeof error === "object" && "response" in error) {
            const axiosError = error as { response?: { data?: unknown }; message?: string };
            console.error("Upload error details:", axiosError.response?.data || axiosError.message);
          } else {
            console.error("Upload error:", error);
          }
          throw error;
        }
      } else {
        // Regular JSON data - send directly without tag handling
        console.log(`Sending direct JSON update to: /items/${effectiveId}`);
        
        return await patch<Item>(`/items/${effectiveId}`, itemData);
      }
    },
    onSuccess: (_, variables) => {
      const id = variables instanceof FormData ? undefined : variables.id;
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ITEM_KEY, id || initialId] });
    },
  });
};

// Hook to delete an item
export const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => del<void>(`/items/${id}`),
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
        const response = await get<{ nextSku: string }>('/items/nextsku');
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
        return await get<string[]>('/items/categories?page=1&limit=10000');
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
        return await get<string[]>('/items/tags?page=1&limit=10000');
      } catch (error) {
        console.error('Error in getTags:', error);
        return []; // Default fallback
      }
    }
  });
};

/**
 * Hook to rebuild item relationships using the new relationship system
 */
export const useRebuildRelationships = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => post("/relationships/rebuild-relationships"),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [RELATIONSHIPS_KEY] });
    }
  });
};

/**
 * Hook to convert all item relationships to the new model
 * This hook uses the appropriate endpoints based on the backend implementation
 */
export const useConvertItemRelationships = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId?: string) => {
      if (itemId) {
        // Convert relationships for a specific item
        return await post(`/relationships/convert/item/${itemId}`);
      } else {
        // Convert all items' relationships
        return await post("/relationships/convert-all");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [RELATIONSHIPS_KEY] });
    }
  });
};

// Hook to get item relationships
/**
 * Hook to get item relationships without pagination limits
 * 
 * @param {string | undefined} itemId - ID of the item
 * @returns {Object} Query result with relationships data always as an array
 */
export const useItemRelationships = (itemId: string | undefined) => {
  return useQuery({
    queryKey: [RELATIONSHIPS_KEY, "item", itemId],
    queryFn: async () => {
      try {
        const response = await get<{ status: string; results: number; data: Relationship[] }>(
          `/relationships/primary/${itemId}/Item?page=1&limit=10000`
        );
        // Ensure we always return an array from the data property
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error(`Error fetching relationships for item ${itemId}:`, error);
        return []; // Return empty array on error
      }
    },
    enabled: !!itemId,
  });
};

// Hook to get product components (materials)
/**
 * Hook to get product components (materials) without pagination limits
 * 
 * @param {string | undefined} productId - ID of the product
 * @returns {Object} Query result with relationships data always as an array
 */
export const useProductComponents = (productId: string | undefined) => {
  return useQuery({
    queryKey: [RELATIONSHIPS_KEY, "product", productId, "components"],
    queryFn: async () => {
      try {
        const response = await get<{ status: string; results: number; data: Relationship[] }>(
          `/relationships/primary/${productId}/Item?relationshipType=${RELATIONSHIP_TYPES.PRODUCT_MATERIAL}&page=1&limit=10000`
        );
        // Ensure we always return an array from the data property
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error(`Error fetching components for product ${productId}:`, error);
        return []; // Return empty array on error
      }
    },
    enabled: !!productId,
  });
};

// Hook to get products using a material
/**
 * Hook to get products using a material without pagination limits
 * 
 * @param {string | undefined} materialId - ID of the material
 * @returns {Object} Query result with relationships data always as an array
 */
export const useProductsUsingMaterial = (materialId: string | undefined) => {
  return useQuery({
    queryKey: [RELATIONSHIPS_KEY, "material", materialId, "products"],
    queryFn: async () => {
      try {
        const response = await get<{ status: string; results: number; data: Relationship[] }>(
          `/relationships/secondary/${materialId}/Item?relationshipType=${RELATIONSHIP_TYPES.PRODUCT_MATERIAL}&page=1&limit=10000`
        );
        // Ensure we always return an array from the data property
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error(`Error fetching products using material ${materialId}:`, error);
        return []; // Return empty array on error
      }
    },
    enabled: !!materialId,
  });
};

// Hook to create breakdown items using the new relationship system
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
        }>(`/items/${breakdownData.sourceItemId}/breakdown`, breakdownData);
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
      queryClient.invalidateQueries({ queryKey: [RELATIONSHIPS_KEY] });

      if (data.sourceItem.id) {
        queryClient.invalidateQueries({ queryKey: [ITEM_KEY, data.sourceItem.id] });
      }
      // Also invalidate any derived/allocated items
      data.derivedItems.forEach(item => {
        if (item.id) {
          queryClient.invalidateQueries({ queryKey: [ITEM_KEY, item.id] });
        }
      });
    },
  });
};

// Hook to get derived items using the new relationship system
/**
 * Hook to get derived items using the new relationship system
 * 
 * @param {string | undefined} itemId - ID of the source item
 * @returns {Object} Query result with relationships data always as an array
 */
export const useDerivedItems = (itemId: string | undefined) => {
  return useQuery({
    queryKey: [RELATIONSHIPS_KEY, "source", itemId, "derived"],
    queryFn: async () => {
      try {
        const response = await get<Relationship[]>(
          `/relationships/secondary/${itemId}/Item?relationshipType=${RELATIONSHIP_TYPES.DERIVED}&page=1&limit=10000`
        );
        // Ensure we always return an array
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error(`Error fetching derived items for item ${itemId}:`, error);
        return []; // Return empty array on error
      }
    },
    enabled: !!itemId,
  });
};

// Hook to get parent item using the new relationship system
/**
 * Hook to get parent item using the new relationship system
 * 
 * @param {string | undefined} itemId - ID of the derived item
 * @returns {Object} Query result with relationships data always as an array
 */
export const useParentItem = (itemId: string | undefined) => {
  return useQuery({
    queryKey: [RELATIONSHIPS_KEY, "derived", itemId, "source"],
    queryFn: async () => {
      try {
        const response = await get<Relationship[]>(
          `/relationships/primary/${itemId}/Item?relationshipType=${RELATIONSHIP_TYPES.DERIVED}&page=1&limit=10000`
        );
        // Ensure we always return an array
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error(`Error fetching parent item for derived item ${itemId}:`, error);
        return []; // Return empty array on error
      }
    },
    enabled: !!itemId,
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
        '/items/utility/rebuild-inventory'
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
        `/items/utility/rebuild-inventory/${itemId}`
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
