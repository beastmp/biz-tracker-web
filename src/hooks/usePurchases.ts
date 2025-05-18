import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import apiClientInstance, {
  RELATIONSHIP_TYPES,
  ENTITY_TYPES,
  get, post, patch, del
} from "@utils/apiClient";
import {
  Purchase,
  PurchasesReport,
  Item,
  PurchaseTrendItem,
  Relationship,
  RelationshipMeasurement,
  PurchaseItemAttributes
} from "@custTypes/models";
import useRelationships from "./useRelationships";

// Query keys
const PURCHASES_KEY = "purchases";
const PURCHASES_REPORT_KEY = "purchases-report";
const RELATIONSHIPS_KEY = "relationships";

// Define relationship-based purchase interface - this replaces the old Purchase interface
export interface RelationshipPurchase {
  _id?: string;
  supplier: {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
  };
  invoiceNumber?: string;
  purchaseDate?: Date | string;
  subtotal: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  shippingCost?: number;
  total: number;
  notes?: string;
  paymentMethod: string;
  status: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // Field to hold relationships
  relationshipItems?: Relationship[];
}

// Hook to fetch all purchases with their relationships
export const usePurchases = () => {
  return useQuery({
    queryKey: [PURCHASES_KEY],
    queryFn: async () => {
      try {
        // Get purchases from API - these should include relationships
        const response = await get<any[]>("/purchases");

        // If no purchases are returned, return empty array
        if (!response || response.length === 0) {
          return [];
        }

        // Convert API response to RelationshipPurchase format
        const purchasesWithRelationships: RelationshipPurchase[] = response.map(
          purchase => {
            const purchaseData = purchase._doc || purchase;
            const purchaseId = purchaseData._id || "unknown";

            // Extract relationships from the API response
            const items = purchase.relationships?.items || [];

            // Create a clean RelationshipPurchase object
            return {
              _id: purchaseId,
              supplier: purchaseData.supplier || {},
              invoiceNumber: purchaseData.invoiceNumber,
              purchaseDate: purchaseData.purchaseDate,
              subtotal: purchaseData.subtotal || 0,
              discountAmount: purchaseData.discountAmount || 0,
              taxRate: purchaseData.taxRate || 0,
              taxAmount: purchaseData.taxAmount || 0,
              shippingCost: purchaseData.shippingCost || 0,
              total: purchaseData.total || 0,
              notes: purchaseData.notes,
              paymentMethod: purchaseData.paymentMethod || "cash",
              status: purchaseData.status || "pending",
              createdAt: purchaseData.createdAt,
              updatedAt: purchaseData.updatedAt,
              relationshipItems: items
            };
          }
        );

        return purchasesWithRelationships;
      } catch (error) {
        console.error("Error fetching purchases:", error);
        throw error;
      }
    }
  });
};

// Hook to fetch a single purchase with its relationships
export const usePurchase = (id: string | undefined) => {
  const { getRelationshipsByPrimary } = useRelationships();

  return useQuery({
    queryKey: [PURCHASES_KEY, id],
    queryFn: async () => {
      if (!id) {
        throw new Error("Purchase ID is required");
      }

      console.log("Fetching purchase with ID:", id);

      try {
        // Get the purchase document
        const purchaseData = await get<RelationshipPurchase>(`/purchases/${id}`);
        console.log("Received purchase data:", purchaseData);

        // Get relationships for this purchase
        const relationships = await getRelationshipsByPrimary(
          id,
          ENTITY_TYPES.PURCHASE,
          RELATIONSHIP_TYPES.PURCHASE_ITEM
        );
        console.log("Received relationships:", relationships);

        // Return the combined data
        const combinedData = {
          ...purchaseData,
          relationshipItems: relationships || []
        } as RelationshipPurchase;

        console.log("Returning combined purchase data:", combinedData);
        return combinedData;
      } catch (error) {
        console.error("Error fetching purchase:", error);
        throw error;
      }
    },
    enabled: !!id, // Only run if id exists
  });
};

// Helper function to create a relationship measurement from purchase data
export const createPurchaseMeasurement = (
  trackingType: string,
  quantity: number = 0,
  weight: number = 0,
  weightUnit: string = "kg",
  length: number = 0,
  lengthUnit: string = "m",
  area: number = 0,
  areaUnit: string = "sqm",
  volume: number = 0,
  volumeUnit: string = "l"
): RelationshipMeasurement => {
  const measurement: RelationshipMeasurement = {};

  // Always set quantity as it's used for display purposes
  measurement.quantity = quantity;

  // Set other measurements based on tracking type
  switch (trackingType) {
    case "weight":
      measurement.weight = weight;
      measurement.weightUnit = weightUnit;
      break;
    case "length":
      measurement.length = length;
      measurement.lengthUnit = lengthUnit;
      break;
    case "area":
      measurement.area = area;
      measurement.areaUnit = areaUnit;
      break;
    case "volume":
      measurement.volume = volume;
      measurement.volumeUnit = volumeUnit;
      break;
  }

  return measurement;
};

// Helper function to create purchase item attributes
export const createPurchaseItemAttributes = (
  costPerUnit: number,
  totalCost: number,
  purchasedBy: string,
  originalCost?: number,
  discountAmount?: number,
  discountPercentage?: number
): PurchaseItemAttributes => {
  return {
    costPerUnit,
    totalCost,
    purchasedBy,
    originalCost: originalCost || costPerUnit,
    discountAmount: discountAmount || 0,
    discountPercentage: discountPercentage || 0
  };
};

// Helper function to calculate total cost from measurements and costPerUnit
export const calculateTotalCost = (
  measurements: RelationshipMeasurement,
  purchasedBy: string,
  costPerUnit: number
): number => {
  switch (purchasedBy) {
    case "quantity":
      return (measurements.quantity || 0) * costPerUnit;
    case "weight":
      return (measurements.weight || 0) * costPerUnit;
    case "length":
      return (measurements.length || 0) * costPerUnit;
    case "area":
      return (measurements.area || 0) * costPerUnit;
    case "volume":
      return (measurements.volume || 0) * costPerUnit;
    default:
      return (measurements.quantity || 0) * costPerUnit;
  }
};

// Helper function to format the relationship measurement display
export const formatPurchaseMeasurement = (
  relationship: Relationship
): string => {
  const measurements = relationship.measurements || {};
  const attributes = relationship.purchaseItemAttributes || {};
  const purchasedBy = attributes.purchasedBy || "quantity";

  switch (purchasedBy) {
    case "quantity":
      return `${measurements.quantity || 0} units`;
    case "weight":
      return `${measurements.weight || 0} ${measurements.weightUnit || "kg"}`;
    case "length":
      return `${measurements.length || 0} ${measurements.lengthUnit || "m"}`;
    case "area":
      return `${measurements.area || 0} ${measurements.areaUnit || "sqm"}`;
    case "volume":
      return `${measurements.volume || 0} ${measurements.volumeUnit || "l"}`;
    default:
      return `${measurements.quantity || 0} units`;
  }
};

// Hook to create a new purchase with relationships
export const useCreatePurchase = () => {
  const queryClient = useQueryClient();
  const { createPurchaseItemRelationship } = useRelationships();

  return useMutation({
    mutationFn: async (purchase: RelationshipPurchase) => {
      // First create the base purchase without relationships
      const purchaseData = {
        supplier: purchase.supplier,
        invoiceNumber: purchase.invoiceNumber,
        purchaseDate: purchase.purchaseDate,
        subtotal: purchase.subtotal,
        discountAmount: purchase.discountAmount,
        taxRate: purchase.taxRate,
        taxAmount: purchase.taxAmount,
        shippingCost: purchase.shippingCost,
        total: purchase.total,
        notes: purchase.notes,
        paymentMethod: purchase.paymentMethod,
        status: purchase.status
      };

      // Create the purchase first
      const newPurchase = await post<RelationshipPurchase>("/purchases", purchaseData);

      // Then create relationship for each item if we have any relationships
      if (purchase.relationshipItems && purchase.relationshipItems.length > 0) {
        // We need to transform from UI relationships to backend format
        const createRelationshipPromises = purchase.relationshipItems.map(rel => {
          return createPurchaseItemRelationship(
            newPurchase._id || "",
            rel.secondaryId,
            rel.measurements || {},
            rel.purchaseItemAttributes || {}
          );
        });

        await Promise.all(createRelationshipPromises);
      }

      return newPurchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [PURCHASES_REPORT_KEY] });
      queryClient.invalidateQueries({ queryKey: [RELATIONSHIPS_KEY] });
      // Also invalidate items as inventory quantities change
      queryClient.invalidateQueries({ queryKey: ["items"] });
    }
  });
};

// Hook to update a purchase
export const useUpdatePurchase = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const {
    createPurchaseItemRelationship,
    updateRelationship,
    deleteRelationship,
    getPurchaseItems
  } = useRelationships();

  return useMutation({
    mutationFn: async (purchase: RelationshipPurchase) => {
      if (!id) throw new Error("Purchase ID is required for updates");

      // First update the base purchase
      const purchaseData = {
        supplier: purchase.supplier,
        invoiceNumber: purchase.invoiceNumber,
        purchaseDate: purchase.purchaseDate,
        subtotal: purchase.subtotal,
        discountAmount: purchase.discountAmount,
        taxRate: purchase.taxRate,
        taxAmount: purchase.taxAmount,
        shippingCost: purchase.shippingCost,
        total: purchase.total,
        notes: purchase.notes,
        paymentMethod: purchase.paymentMethod,
        status: purchase.status
      };

      // Update the purchase
      const updatedPurchase = await patch<RelationshipPurchase>(`/purchases/${id}`, purchaseData);

      // Handle relationships if provided
      if (purchase.relationshipItems) {
        // Get existing relationships
        const existingRelationships = await getPurchaseItems(id);

        // Create a map of existing relationships by secondaryId for quick lookup
        const existingRelMap = new Map(
          existingRelationships.map(rel => [rel.secondaryId, rel])
        );

        // Create a map of new relationships by secondaryId
        const newRelMap = new Map(
          purchase.relationshipItems.map(rel => [rel.secondaryId, rel])
        );

        // Process each new relationship
        for (const rel of purchase.relationshipItems) {
          const existingRel = existingRelMap.get(rel.secondaryId);

          if (existingRel) {
            // Update existing relationship
            await updateRelationship(existingRel._id || "", {
              measurements: rel.measurements,
              purchaseItemAttributes: rel.purchaseItemAttributes
            });

            // Remove from map to track what's been processed
            existingRelMap.delete(rel.secondaryId);
          } else {
            // Create new relationship
            await createPurchaseItemRelationship(
              id,
              rel.secondaryId,
              rel.measurements || {},
              rel.purchaseItemAttributes || {}
            );
          }
        }

        // Delete any relationships that weren't in the new set
        for (const [_, rel] of existingRelMap) {
          if (rel._id) {
            await deleteRelationship(rel._id);
          }
        }
      }

      return updatedPurchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [PURCHASES_REPORT_KEY] });
      queryClient.invalidateQueries({ queryKey: [RELATIONSHIPS_KEY] });
      // Also invalidate items as inventory quantities may change
      queryClient.invalidateQueries({ queryKey: ["items"] });
    }
  });
};

// Hook to delete a purchase
export const useDeletePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => del<void>(`/purchases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY] });
      queryClient.invalidateQueries({ queryKey: [PURCHASES_REPORT_KEY] });
      queryClient.invalidateQueries({ queryKey: [RELATIONSHIPS_KEY] });
      // Also invalidate items as inventory quantities change on delete
      queryClient.invalidateQueries({ queryKey: ["items"] });
    }
  });
};

// Hook to get purchases report
export const usePurchasesReport = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: [PURCHASES_REPORT_KEY, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      return get<PurchasesReport>(
        `/purchases/stats?${params.toString()}`
      );
    },
    enabled: !!(startDate && endDate)
  });
};

// Hook to get purchases containing a specific item
export const useItemPurchases = (itemId: string | undefined) => {
  const { getItemPurchases } = useRelationships();

  return useQuery({
    queryKey: [RELATIONSHIPS_KEY, "item", itemId, "purchases"],
    queryFn: async () => {
      if (!itemId) {
        throw new Error("Item ID is required");
      }

      // Get all purchase relationships for this item
      const relationships = await getItemPurchases(itemId);

      // Get unique purchase IDs
      const purchaseIds = [...new Set(relationships.map(rel => rel.primaryId))];

      // Fetch each purchase
      const purchasesPromises = purchaseIds.map(id =>
        get<RelationshipPurchase>(`/purchases/${id}`)
      );

      const purchases = await Promise.all(purchasesPromises);

      // Add relationships to each purchase
      return purchases.map(purchase => {
        const purchaseRelationships = relationships.filter(
          rel => rel.primaryId === purchase._id
        );

        return {
          ...purchase,
          relationshipItems: purchaseRelationships
        };
      });
    },
    enabled: !!itemId
  });
};

export function usePurchasesTrend(startDate?: string, endDate?: string) {
  const [data, setData] = useState<PurchaseTrendItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!startDate || !endDate) {
      return;
    }

    const fetchTrends = async () => {
      setIsLoading(true);
      try {
        // Define proper type for API response
        interface PurchaseTrendResponse {
          data: PurchaseTrendItem[];
        }

        const response = await apiClientInstance.get<PurchaseTrendResponse>(
          `/purchases/stats?startDate=${startDate}&endDate=${endDate}&includeBreakdown=true`
        );

        // Process data to include measurement type information
        const processedData = (response.data.data || []).map(
          (item: PurchaseTrendItem) => ({
            ...item,
            // Include breakdowns by measurement type if available
            quantityTotal: item.measurementBreakdown?.quantity?.total || 0,
            weightTotal: item.measurementBreakdown?.weight?.total || 0,
            lengthTotal: item.measurementBreakdown?.length?.total || 0,
            areaTotal: item.measurementBreakdown?.area?.total || 0,
            volumeTotal: item.measurementBreakdown?.volume?.total || 0
          })
        );

        setData(processedData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to fetch purchase trends data")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrends();
  }, [startDate, endDate]);

  return { data, isLoading, error };
}

// Hook for workflow operations on purchases
export const useConfirmPurchase = (purchaseId: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { paymentAmount?: number }) => {
      if (!purchaseId) throw new Error("Purchase ID is required");
      return patch<Purchase>(`/purchases/${purchaseId}/confirm`, data);
    },
    onSuccess: () => {
      if (purchaseId) {
        queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY, purchaseId] });
      }
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY] });
    }
  });
};

export const useReceivePurchase = (purchaseId: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { trackingNumber?: string; shippingProvider?: string }) => {
      if (!purchaseId) throw new Error("Purchase ID is required");
      return patch<Purchase>(`/purchases/${purchaseId}/receive`, data);
    },
    onSuccess: () => {
      if (purchaseId) {
        queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY, purchaseId] });
      }
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY] });
      // Also invalidate items as inventory quantities will change
      queryClient.invalidateQueries({ queryKey: ["items"] });
    }
  });
};

export const useCompletePurchase = (purchaseId: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => {
      if (!purchaseId) throw new Error("Purchase ID is required");
      return patch<Purchase>(`/purchases/${purchaseId}/complete`, {});
    },
    onSuccess: () => {
      if (purchaseId) {
        queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY, purchaseId] });
      }
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY] });
    }
  });
};

export const useCancelPurchase = (purchaseId: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { reason?: string }) => {
      if (!purchaseId) throw new Error("Purchase ID is required");
      return patch<Purchase>(`/purchases/${purchaseId}/cancel`, data);
    },
    onSuccess: () => {
      if (purchaseId) {
        queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY, purchaseId] });
      }
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY] });
      // Also invalidate items as inventory quantities will change when a purchase is canceled
      queryClient.invalidateQueries({ queryKey: ["items"] });
    }
  });
};
