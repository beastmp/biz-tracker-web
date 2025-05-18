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

const useRelationships = (): UseRelationshipsResult => {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  interface ApiError {
    response?: {
      data?: {
        message?: string;
      };
    };
    message?: string;
  }

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
    []
  );

  const updateRelationship = useCallback(
    async (id: string, data: Partial<Relationship>): Promise<Relationship> => {
      setLoading(true);
      setError(null);

      try {
        const response = await patch<Relationship>(
          `/relationships/${id}`,
          data
        );

        // Update relationship in state
        setRelationships(prev =>
          prev.map(rel => rel._id === id ? response : rel)
        );

        setLoading(false);
        return response;
      } catch (error) {
        setLoading(false);
        return handleApiError(error as ApiError);
      }
    },
    []
  );

  const deleteRelationship = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await del<void>(`/relationships/${id}`);

        // Remove relationship from state
        setRelationships(prev => prev.filter(rel => rel._id !== id));

        setLoading(false);
        return true;
      } catch (error) {
        setLoading(false);
        return handleApiError(error as ApiError);
      }
    },
    []
  );

  const getRelationshipById = useCallback(
    async (id: string): Promise<Relationship> => {
      setLoading(true);
      setError(null);

      try {
        const response = await get<Relationship>(`/relationships/${id}`);
        setLoading(false);
        return response;
      } catch (error) {
        setLoading(false);
        return handleApiError(error as ApiError);
      }
    },
    []
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

        const response = await get<Relationship[]>(url);
        console.log(`Got ${response.length} relationships from API`);

        // Clean up Mongoose/MongoDB document properties if they exist
        const cleanRelationships = response.map(rel => {
          // If this is a MongoDB document with _doc property
          const relationshipData = rel._doc || rel;

          // Return a clean object without MongoDB internals
          return {
            _id: relationshipData._id,
            primaryId: relationshipData.primaryId,
            primaryType: relationshipData.primaryType,
            secondaryId: relationshipData.secondaryId,
            secondaryType: relationshipData.secondaryType,
            relationshipType: relationshipData.relationshipType,
            measurements: relationshipData.measurements || {},
            purchaseItemAttributes: relationshipData.purchaseItemAttributes || {},
            purchaseAssetAttributes: relationshipData.purchaseAssetAttributes || {},
            saleItemAttributes: relationshipData.saleItemAttributes || {},
            createdAt: relationshipData.createdAt,
            updatedAt: relationshipData.updatedAt,
            notes: relationshipData.notes,
            isLegacy: relationshipData.isLegacy || false,
            metadata: relationshipData.metadata || {}
          };
        });

        setRelationships(cleanRelationships);
        setLoading(false);
        return cleanRelationships;
      } catch (error) {
        console.error("Error in getRelationshipsByPrimary:", error);
        setLoading(false);
        return handleApiError(error as ApiError);
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

        const response = await get<Relationship[]>(url);
        console.log(`Got ${response.length} relationships from API`);

        // Clean up Mongoose/MongoDB document properties if they exist
        const cleanRelationships = response.map(rel => {
          // If this is a MongoDB document with _doc property
          const relationshipData = rel._doc || rel;

          // Return a clean object without MongoDB internals
          return {
            _id: relationshipData._id,
            primaryId: relationshipData.primaryId,
            primaryType: relationshipData.primaryType,
            secondaryId: relationshipData.secondaryId,
            secondaryType: relationshipData.secondaryType,
            relationshipType: relationshipData.relationshipType,
            measurements: relationshipData.measurements || {},
            purchaseItemAttributes: relationshipData.purchaseItemAttributes || {},
            purchaseAssetAttributes: relationshipData.purchaseAssetAttributes || {},
            saleItemAttributes: relationshipData.saleItemAttributes || {},
            createdAt: relationshipData.createdAt,
            updatedAt: relationshipData.updatedAt,
            notes: relationshipData.notes,
            isLegacy: relationshipData.isLegacy || false,
            metadata: relationshipData.metadata || {}
          };
        });

        setRelationships(cleanRelationships);
        setLoading(false);
        return cleanRelationships;
      } catch (error) {
        console.error("Error in getRelationshipsBySecondary:", error);
        setLoading(false);
        return handleApiError(error as ApiError);
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