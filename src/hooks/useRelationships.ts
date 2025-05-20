import { useState, useCallback } from "react";
import apiClientInstance, {
  get,
  post,
  patch,
  del,
  RELATIONSHIP_TYPES,
  ENTITY_TYPES
} from "../utils/apiClient";
import {
  Relationship,
  RelationshipType,
  EntityType,
  RelationshipMeasurement,
  PurchaseItemAttributes,
  SaleItemAttributes
} from "../types/models";

// Define job status interface
export interface ConversionJobStatus {
  status: "running" | "completed" | "failed";
  startTime: string;
  lastUpdated: string;
  endTime?: string;
  progress: {
    items: { converted: number; errors: number };
    purchases: { converted: number; errors: number };
    sales: { converted: number; errors: number };
    assets: { converted: number; errors: number };
    totalConverted: number;
    totalErrors: number;
    currentPhase: string;
    percentComplete: number;
  };
  error?: string;
}

/**
 * Interface for the useRelationships hook result
 */
interface UseRelationshipsResult {
  relationships: Relationship[];
  loading: boolean;
  error: string | null;
  createRelationship: (relationship: Partial<Relationship>) => Promise<Relationship>;
  updateRelationship: (id: string, data: Partial<Relationship>) => Promise<Relationship>;
  deleteRelationship: (id: string) => Promise<boolean>;
  getRelationshipById: (id: string) => Promise<Relationship>;
  getRelationshipsByPrimary: (
    primaryId: string,
    primaryType: EntityType,
    relationshipType?: RelationshipType
  ) => Promise<Relationship[]>;
  getRelationshipsBySecondary: (
    secondaryId: string,
    secondaryType: EntityType,
    relationshipType?: RelationshipType
  ) => Promise<Relationship[]>;
  convertLegacyRelationships: (
    entityId: string,
    entityType: EntityType
  ) => Promise<{
    success: boolean;
    message: string;
    result: any;
  }>;
  convertAllRelationships: () => Promise<{
    success: boolean;
    message: string;
    jobId: string;
  }>;
  getConversionJobStatus: (jobId: string) => Promise<ConversionJobStatus>;
  refreshRelationships: () => Promise<void>;

  // Helper functions for specific relationship types
  createProductMaterialRelationship: (
    productId: string,
    materialId: string,
    measurements: RelationshipMeasurement
  ) => Promise<Relationship>;

  createDerivedItemRelationship: (
    derivedItemId: string,
    sourceItemId: string,
    measurements: RelationshipMeasurement
  ) => Promise<Relationship>;

  createPurchaseItemRelationship: (
    purchaseId: string,
    itemId: string,
    measurements: RelationshipMeasurement,
    attributes: Partial<PurchaseItemAttributes>
  ) => Promise<Relationship>;

  createSaleItemRelationship: (
    saleId: string,
    itemId: string,
    measurements: RelationshipMeasurement,
    attributes: Partial<SaleItemAttributes>
  ) => Promise<Relationship>;

  getProductComponents: (productId: string) => Promise<Relationship[]>;
  getProductsUsingMaterial: (materialId: string) => Promise<Relationship[]>;
  getDerivedItems: (sourceItemId: string) => Promise<Relationship[]>;
  getSourceForDerivedItem: (derivedItemId: string) => Promise<Relationship | null>;
  getPurchaseItems: (purchaseId: string) => Promise<Relationship[]>;
  getItemPurchases: (itemId: string) => Promise<Relationship[]>;
  getSaleItems: (saleId: string) => Promise<Relationship[]>;
  getItemSales: (itemId: string) => Promise<Relationship[]>;
}

/**
 * Interface for API errors
 */
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

/**
 * Hook for managing relationships between entities
 * 
 * @returns {UseRelationshipsResult} Object containing relationships state and operations
 */
const useRelationships = (): UseRelationshipsResult => {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiError = useCallback((error: ApiError) => {
    console.error("Relationship API error:", error);
    const errorMessage = error.response?.data?.message || error.message || "Unknown error";
    setError(errorMessage);
    return Promise.reject(errorMessage);
  }, []);

  const refreshRelationships = useCallback(async (): Promise<void> => {
    // This function would typically re-fetch whatever relationships
    // are currently being viewed in the app
    // For now, we'll just clear the cache as an example
    setRelationships([]);
  }, []);

  /**
   * Creates a new relationship
   * 
   * @param {Partial<Relationship>} relationshipData - The relationship data to create
   * @returns {Promise<Relationship>} The created relationship
   */
  const createRelationship = useCallback(
    async (relationshipData: Partial<Relationship>): Promise<Relationship> => {
      setLoading(true);
      setError(null);

      try {
        const response = await post<Relationship>(
          "/relationships",
          relationshipData
        );

        // Add new relationship to state
        setRelationships(prev => [...prev, response]);
        setLoading(false);
        return response;
      } catch (error) {
        setLoading(false);
        return handleApiError(error as ApiError);
      }
    },
    [handleApiError]
  );

  /**
   * Updates an existing relationship
   * 
   * @param {string} id - The ID of the relationship to update
   * @param {Partial<Relationship>} data - The data to update
   * @returns {Promise<Relationship>} The updated relationship
   */
  const updateRelationship = useCallback(
    async (id: string, data: Partial<Relationship>): Promise<Relationship> => {
      setLoading(true);
      setError(null);

      try {
        const response = await patch<Relationship>(
          `/relationships/${id}`,
          data
        );

        // Update relationship in state using the standard id field
        setRelationships(prev =>
          prev.map(rel => rel.id === id ? response : rel)
        );

        setLoading(false);
        return response;
      } catch (error) {
        setLoading(false);
        return handleApiError(error as ApiError);
      }
    },
    [handleApiError]
  );

  /**
   * Deletes a relationship
   * 
   * @param {string} id - The ID of the relationship to delete
   * @returns {Promise<boolean>} True if deletion was successful
   */
  const deleteRelationship = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await del<void>(`/relationships/${id}`);

        // Remove relationship from state using standard id field
        setRelationships(prev => prev.filter(rel => rel.id !== id));

        setLoading(false);
        return true;
      } catch (error) {
        setLoading(false);
        return handleApiError(error as ApiError);
      }
    },
    [handleApiError]
  );

  /**
   * Gets a relationship by its ID
   * 
   * @param {string} id - The ID of the relationship to fetch
   * @returns {Promise<Relationship>} The fetched relationship
   */
  const getRelationshipById = useCallback(
    async (id: string): Promise<Relationship> => {
      setLoading(true);
      setError(null);

      try {
        const response = await get<{ status: string; data: Relationship }>(`/relationships/${id}`);
        setLoading(false);
        return response.data;
      } catch (error) {
        setLoading(false);
        return handleApiError(error as ApiError);
      }
    },
    [handleApiError]
  );

  const getRelationshipsByPrimary = useCallback(
    async (
      primaryId: string,
      primaryType: EntityType,
      relationshipType?: RelationshipType
    ): Promise<Relationship[]> => {
      setLoading(true);
      setError(null);

      try {
        console.log(
          `Getting relationships with primaryId=${primaryId}, ` +
          `primaryType=${primaryType}, relationshipType=${relationshipType}`
        );

        // Build the URL based on the updated endpoint structure
        let url = `/relationships/primary/${primaryId}/${primaryType}`;
        
        // Add relationship type as a query parameter if provided
        if (relationshipType) {
          url += `?relationshipType=${relationshipType}`;
        }

        console.log(`Making API request to: ${url}`);

        const response = await get<{ status: string; results: number; data: Relationship[] }>(url);
        console.log(`Got ${response?.data ? response.data.length : 0} relationships from API`);

        // Ensure we have a valid array response
        if (!response?.data || !Array.isArray(response.data)) {
          console.warn("API returned invalid data structure for relationships query:", response);
          setLoading(false);
          return [];
        }

        // Clean up Mongoose/MongoDB document properties if they exist
        const cleanRelationships = response.data.map(rel => {
          // Return a clean object without MongoDB internals
          return {
            id: rel.id,
            primaryId: rel.primaryId,
            primaryType: rel.primaryType,
            secondaryId: rel.secondaryId,
            secondaryType: rel.secondaryType,
            relationshipType: rel.relationshipType,
            measurements: rel.measurements || {},
            purchaseItemAttributes: rel.purchaseItemAttributes || {},
            purchaseAssetAttributes: rel.purchaseAssetAttributes || {},
            saleItemAttributes: rel.saleItemAttributes || {},
            createdAt: rel.createdAt,
            updatedAt: rel.updatedAt,
            notes: rel.notes,
            isLegacy: rel.isLegacy || false,
            metadata: rel.metadata || {}
          };
        });

        setRelationships(cleanRelationships);
        setLoading(false);
        return cleanRelationships;
      } catch (error) {
        console.error("Error in getRelationshipsByPrimary:", error);
        setLoading(false);
        return []; // Return empty array on error instead of rejecting
      }
    },
    [handleApiError]
  );

  const getRelationshipsBySecondary = useCallback(
    async (
      secondaryId: string,
      secondaryType: EntityType,
      relationshipType?: RelationshipType
    ): Promise<Relationship[]> => {
      setLoading(true);
      setError(null);

      try {
        console.log(
          `Getting relationships with secondaryId=${secondaryId}, ` +
          `secondaryType=${secondaryType}, relationshipType=${relationshipType}`
        );

        // Build the URL based on the updated endpoint structure
        let url = `/relationships/secondary/${secondaryId}/${secondaryType}`;
        
        // Add relationship type as a query parameter if provided
        if (relationshipType) {
          url += `?relationshipType=${relationshipType}`;
        }

        console.log(`Making API request to: ${url}`);

        const response = await get<{ status: string; results: number; data: Relationship[] }>(url);
        console.log(`Got ${response?.data ? response.data.length : 0} relationships from API`);

        // Ensure we have a valid array response
        if (!response?.data || !Array.isArray(response.data)) {
          console.warn("API returned invalid data structure for relationships query:", response);
          setLoading(false);
          return [];
        }

        // Clean up Mongoose/MongoDB document properties if they exist
        const cleanRelationships = response.data.map(rel => {
          // Return a clean object without MongoDB internals
          return {
            id: rel.id,
            primaryId: rel.primaryId,
            primaryType: rel.primaryType,
            secondaryId: rel.secondaryId,
            secondaryType: rel.secondaryType,
            relationshipType: rel.relationshipType,
            measurements: rel.measurements || {},
            purchaseItemAttributes: rel.purchaseItemAttributes || {},
            purchaseAssetAttributes: rel.purchaseAssetAttributes || {},
            saleItemAttributes: rel.saleItemAttributes || {},
            createdAt: rel.createdAt,
            updatedAt: rel.updatedAt,
            notes: rel.notes,
            isLegacy: rel.isLegacy || false,
            metadata: rel.metadata || {}
          };
        });

        setRelationships(cleanRelationships);
        setLoading(false);
        return cleanRelationships;
      } catch (error) {
        console.error("Error in getRelationshipsBySecondary:", error);
        setLoading(false);
        return []; // Return empty array on error instead of rejecting
      }
    },
    [handleApiError]
  );

  const convertLegacyRelationships = useCallback(
    async (
      entityId: string,
      entityType: EntityType
    ): Promise<{ success: boolean; message: string; result: any }> => {
      setLoading(true);
      setError(null);

      try {
        const response = await post<{
          success: boolean;
          message: string;
          result: any;
        }>(`/relationships/convert/${entityType}/${entityId}`);

        // Refresh relationships after conversion
        await refreshRelationships();

        setLoading(false);
        return response;
      } catch (error) {
        setLoading(false);
        return handleApiError(error as ApiError);
      }
    },
    [refreshRelationships, handleApiError]
  );

  const convertAllRelationships = useCallback(
    async (): Promise<{
      success: boolean;
      message: string;
      jobId: string;
    }> => {
      setLoading(true);
      setError(null);

      try {
        const response = await post<{
          success: boolean;
          message: string;
          jobId: string;
        }>("/relationships/convert-all");

        setLoading(false);
        return response;
      } catch (error) {
        setLoading(false);
        return handleApiError(error as ApiError);
      }
    },
    []
  );

  const getConversionJobStatus = useCallback(
    async (jobId: string): Promise<ConversionJobStatus> => {
      try {
        const response = await get<ConversionJobStatus>(
          `/relationships/jobs/${jobId}`
        );
        return response;
      } catch (error) {
        return handleApiError(error as ApiError);
      }
    },
    []
  );

  // Helper functions for creating specific relationship types
  const createProductMaterialRelationship = useCallback(
    async (
      productId: string,
      materialId: string,
      measurements: RelationshipMeasurement
    ): Promise<Relationship> => {
      try {
        // Use the new specialized endpoint
        return await post<Relationship>(
          `/relationships/product-material/${productId}/${materialId}`,
          { measurements }
        );
      } catch (error) {
        return handleApiError(error as ApiError);
      }
    },
    [handleApiError]
  );

  const createDerivedItemRelationship = useCallback(
    async (
      derivedItemId: string,
      sourceItemId: string,
      measurements: RelationshipMeasurement
    ): Promise<Relationship> => {
      // For this specific relationship, we'll fall back to the generic endpoint
      return createRelationship({
        primaryId: derivedItemId,
        primaryType: ENTITY_TYPES.ITEM,
        secondaryId: sourceItemId,
        secondaryType: ENTITY_TYPES.ITEM,
        relationshipType: RELATIONSHIP_TYPES.DERIVED,
        measurements
      });
    },
    [createRelationship]
  );

  const createPurchaseItemRelationship = useCallback(
    async (
      purchaseId: string,
      itemId: string,
      measurements: RelationshipMeasurement,
      attributes: Partial<PurchaseItemAttributes>
    ): Promise<Relationship> => {
      try {
        // Use the new specialized endpoint
        return await post<Relationship>(
          `/relationships/purchase-item/${purchaseId}/${itemId}`,
          { 
            measurements,
            purchaseItemAttributes: attributes 
          }
        );
      } catch (error) {
        return handleApiError(error as ApiError);
      }
    },
    [handleApiError]
  );

  const createSaleItemRelationship = useCallback(
    async (
      saleId: string,
      itemId: string,
      measurements: RelationshipMeasurement,
      attributes: Partial<SaleItemAttributes>
    ): Promise<Relationship> => {
      try {
        // Use the new specialized endpoint
        return await post<Relationship>(
          `/relationships/sale-item/${saleId}/${itemId}`,
          { 
            measurements,
            saleItemAttributes: attributes 
          }
        );
      } catch (error) {
        return handleApiError(error as ApiError);
      }
    },
    [handleApiError]
  );

  // Helper functions for retrieving specific relationship types
  const getProductComponents = useCallback(
    (productId: string): Promise<Relationship[]> => {
      return getRelationshipsByPrimary(
        productId,
        ENTITY_TYPES.ITEM,
        RELATIONSHIP_TYPES.PRODUCT_MATERIAL
      );
    },
    [getRelationshipsByPrimary]
  );

  const getProductsUsingMaterial = useCallback(
    (materialId: string): Promise<Relationship[]> => {
      return getRelationshipsBySecondary(
        materialId,
        ENTITY_TYPES.ITEM,
        RELATIONSHIP_TYPES.PRODUCT_MATERIAL
      );
    },
    [getRelationshipsBySecondary]
  );

  const getDerivedItems = useCallback(
    (sourceItemId: string): Promise<Relationship[]> => {
      return getRelationshipsBySecondary(
        sourceItemId,
        ENTITY_TYPES.ITEM,
        RELATIONSHIP_TYPES.DERIVED
      );
    },
    [getRelationshipsBySecondary]
  );

  const getSourceForDerivedItem = useCallback(
    async (derivedItemId: string): Promise<Relationship | null> => {
      try {
        const relationships = await getRelationshipsByPrimary(
          derivedItemId,
          ENTITY_TYPES.ITEM,
          RELATIONSHIP_TYPES.DERIVED
        );
        return relationships.length > 0 ? relationships[0] : null;
      } catch (error) {
        handleApiError(error as ApiError);
        return null;
      }
    },
    [getRelationshipsByPrimary, handleApiError]
  );

  const getPurchaseItems = useCallback(
    (purchaseId: string): Promise<Relationship[]> => {
      return getRelationshipsByPrimary(
        purchaseId,
        ENTITY_TYPES.PURCHASE,
        RELATIONSHIP_TYPES.PURCHASE_ITEM
      );
    },
    [getRelationshipsByPrimary]
  );

  const getItemPurchases = useCallback(
    (itemId: string): Promise<Relationship[]> => {
      return getRelationshipsBySecondary(
        itemId,
        ENTITY_TYPES.ITEM,
        RELATIONSHIP_TYPES.PURCHASE_ITEM
      );
    },
    [getRelationshipsBySecondary]
  );

  const getSaleItems = useCallback(
    (saleId: string): Promise<Relationship[]> => {
      return getRelationshipsByPrimary(
        saleId,
        ENTITY_TYPES.SALE,
        RELATIONSHIP_TYPES.SALE_ITEM
      );
    },
    [getRelationshipsByPrimary]
  );

  const getItemSales = useCallback(
    (itemId: string): Promise<Relationship[]> => {
      return getRelationshipsBySecondary(
        itemId,
        ENTITY_TYPES.ITEM,
        RELATIONSHIP_TYPES.SALE_ITEM
      );
    },
    [getRelationshipsBySecondary]
  );

  return {
    relationships,
    loading,
    error,
    createRelationship,
    updateRelationship,
    deleteRelationship,
    getRelationshipById,
    getRelationshipsByPrimary,
    getRelationshipsBySecondary,
    convertLegacyRelationships,
    convertAllRelationships,
    getConversionJobStatus,
    refreshRelationships,

    // Expose the helper functions
    createProductMaterialRelationship,
    createDerivedItemRelationship,
    createPurchaseItemRelationship,
    createSaleItemRelationship,
    getProductComponents,
    getProductsUsingMaterial,
    getDerivedItems,
    getSourceForDerivedItem,
    getPurchaseItems,
    getItemPurchases,
    getSaleItems,
    getItemSales
  };
};

export default useRelationships;