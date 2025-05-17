import { useState, useEffect } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid2,
  Alert,
  InputAdornment,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  FormHelperText,
  Checkbox,
  ListItemIcon,
  Autocomplete,
  Stack,
  Chip
} from "@mui/material";
import {
  Save,
  ArrowBack,
  Add,
  Image as ImageIcon,
  AddCircle,
  DeleteOutline,
  DragIndicator,
  BusinessCenter,
  Inventory,
  AttachMoney,
  Handyman,
  RemoveCircleOutline
} from "@mui/icons-material";
import {
  usePurchase,
  useCreatePurchase,
  useUpdatePurchase,
  RelationshipPurchase,
  createPurchaseMeasurement,
  createPurchaseItemAttributes,
  calculateTotalCost,
  formatPurchaseMeasurement
} from "@hooks/usePurchases";
import { useItems, useCreateItem, useNextSku, useCategories } from "@hooks/useItems";
import { useAssets, useAssetCategories, useCreateAsset } from "@hooks/useAssets";
import {
  Item,
  WeightUnit,
  TrackingType,
  ItemType,
  LengthUnit,
  AreaUnit,
  VolumeUnit,
  BusinessAsset,
  AssetStatus,
  Relationship,
  RelationshipMeasurement,
  PurchaseItemAttributes,
  PurchaseType
} from "@custTypes/models";
import { formatCurrency } from "@utils/formatters";
import LoadingScreen from "@components/ui/LoadingScreen";
import ErrorFallback from "@components/ui/ErrorFallback";
import useRelationships from "@hooks/useRelationships";
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from "@utils/apiClient";

// Utility function to round to 5 decimal places
const roundToFiveDecimalPlaces = (num: number): number => {
  return Math.round(num * 100000) / 100000;
};

// Helper function to extract MongoDB document data
const extractMongoData = <T,>(document: T | { _doc: T }): T => {
  return (document as { _doc: T })._doc || document as T;
};

// Debug helper to inspect object structure and properties
const debugObject = (obj: any, label = "Object"): void => {
  console.log(`DEBUG ${label}:`, obj);
  if (obj) {
    console.log(`Keys:`, Object.keys(obj));

    if (obj._doc) {
      console.log(`_doc Keys:`, Object.keys(obj._doc));
    }

    if (Array.isArray(obj)) {
      console.log(`Is Array with length:`, obj.length);
      if (obj.length > 0) {
        console.log(`First item:`, obj[0]);
        console.log(`First item keys:`, Object.keys(obj[0]));
      }
    }
  }
};

// Define RelationshipItem interface to track items in the form before saving
interface RelationshipItem {
  _id?: string;
  itemId: string;
  itemName: string;
  purchaseType?: PurchaseType;
  trackingType: TrackingType;
  measurements: RelationshipMeasurement;
  purchaseItemAttributes: PurchaseItemAttributes;
}

export default function PurchaseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Queries
  const { data: existingPurchase, isLoading: purchaseLoading, error: purchaseError } = usePurchase(id);
  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useItems();
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const { data: nextSku, refetch: refetchNextSku } = useNextSku();
  const { data: categories = [] } = useCategories();
  const { data: assetCategories = [] } = useAssetCategories();
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase(id);
  const createItem = useCreateItem();
  const createAsset = useCreateAsset();

  // Form state
  const [purchase, setPurchase] = useState<RelationshipPurchase>({
    supplier: {
      name: "",
      contactName: "",
      email: "",
      phone: ""
    },
    invoiceNumber: "",
    purchaseDate: new Date().toISOString(),
    subtotal: 0,
    discountAmount: 0,
    taxRate: 0,
    taxAmount: 0,
    shippingCost: 0,
    total: 0,
    paymentMethod: "debit",
    status: "received",
    notes: "",
    relationshipItems: []
  });

  // Add useRelationships hook
  const { createPurchaseItemRelationship } = useRelationships();

  // Item and Asset selection states
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [itemSelectDialogOpen, setItemSelectDialogOpen] = useState(false);
  const [itemTypeSelectDialogOpen, setItemTypeSelectDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Asset selection state
  const [selectedAssets, setSelectedAssets] = useState<BusinessAsset[]>([]);
  const [assetSelectDialogOpen, setAssetSelectDialogOpen] = useState(false);

  // New item form state
  const [createItemDialogOpen, setCreateItemDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<Item>>({
    name: '',
    sku: '',
    category: '',
    trackingType: 'quantity' as TrackingType,
    itemType: 'material' as ItemType,
    quantity: 0,
    weight: 0,
    weightUnit: 'lb' as WeightUnit,
    length: 0,
    lengthUnit: 'in' as LengthUnit,
    area: 0,
    areaUnit: 'sqft' as AreaUnit,
    volume: 0,
    volumeUnit: 'l' as VolumeUnit,
    price: 0,
    priceType: 'each',
    description: '',
    cost: 0
  });
  const [newItemErrors, setNewItemErrors] = useState<Record<string, string>>({});
  const [newItemTotalPrice] = useState<number>(0);
  const [newItemUnitCost, setNewItemUnitCost] = useState<number>(0);

  // Add a state to track manual vs. automatic updates
  const [isManuallyEditing, setIsManuallyEditing] = useState<string | null>(null);

  // New asset form state
  const [createAssetDialogOpen, setCreateAssetDialogOpen] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<BusinessAsset>>({
    name: '',
    category: 'Equipment',
    status: 'active' as AssetStatus,
    initialCost: 0,
    currentValue: 0,
    isInventoryItem: false,
    tags: []
  });

  const [newAssetErrors, setNewAssetErrors] = useState<Record<string, string>>({});

  // Load existing purchase data if in edit mode
  useEffect(() => {
    if (isEditMode && existingPurchase) {
      console.log("Raw purchase data from API:", existingPurchase);

      // Extract the document from MongoDB wrapper if it exists
      const cleanedPurchase = extractMongoData(existingPurchase);
      console.log("Extracted purchase document:", cleanedPurchase);

      // Check if we have relationshipItems from the usePurchase hook
      if (existingPurchase.relationshipItems &&
          Array.isArray(existingPurchase.relationshipItems)) {
        console.log("Found relationshipItems array:",
          existingPurchase.relationshipItems);

        // Clean each relationship and initialize its properties
        cleanedPurchase.relationshipItems = existingPurchase.relationshipItems.map(
          (rel) => {
            const cleanRel = extractMongoData(rel);
            // Initialize nested objects to prevent undefined errors
            return {
              ...cleanRel,
              measurements: cleanRel.measurements || {},
              purchaseItemAttributes: cleanRel.purchaseItemAttributes || {},
              metadata: cleanRel.metadata || {}
            };
          }
        );
      }
      // Check for legacy structure from _doc.relationships
      else if (existingPurchase._doc?.relationships?.items &&
               Array.isArray(existingPurchase._doc.relationships.items)) {
        console.log("Found legacy relationships.items array:",
          existingPurchase._doc.relationships.items);

        // Map legacy relationships to relationshipItems format
        cleanedPurchase.relationshipItems =
          existingPurchase._doc.relationships.items.map((rel) => {
            const cleanRel = extractMongoData(rel);
            return {
              ...cleanRel,
              measurements: cleanRel.measurements || {},
              purchaseItemAttributes: cleanRel.purchaseItemAttributes || {},
              metadata: cleanRel.metadata || {}
            };
          });
      }
      // Check for nested relationships property
      else if (existingPurchase.relationships?.items &&
               Array.isArray(existingPurchase.relationships.items)) {
        console.log("Found relationships.items array:",
          existingPurchase.relationships.items);

        // Map relationships to relationshipItems format
        cleanedPurchase.relationshipItems = existingPurchase.relationships.items.map(
          (rel) => {
            const cleanRel = extractMongoData(rel);
            return {
              ...cleanRel,
              measurements: cleanRel.measurements || {},
              purchaseItemAttributes: cleanRel.purchaseItemAttributes || {},
              metadata: cleanRel.metadata || {}
            };
          }
        );
      }
      // If we still don't have relationship items, initialize to empty array
      if (!cleanedPurchase.relationshipItems) {
        console.warn("No relationship items found, initializing empty array");
        cleanedPurchase.relationshipItems = [];
      }

      console.log("Final cleaned purchase with relationships:", cleanedPurchase);

      setPurchase(cleanedPurchase);
    }
  }, [isEditMode, existingPurchase]);

  // Set next SKU when available
  useEffect(() => {
    if (nextSku) {
      setNewItem(prev => ({ ...prev, sku: nextSku }));
    }
  }, [nextSku]);

  // Update total costs whenever relationshipItems change
  useEffect(() => {
    // Calculate subtotal from relationship items
    const subtotal = purchase.relationshipItems
      ? purchase.relationshipItems.reduce(
          (sum, item) => sum + (item.purchaseItemAttributes?.totalCost || 0),
          0
        )
      : 0;

    const discountAmount = purchase.discountAmount || 0;
    const taxAmount = roundToFiveDecimalPlaces(subtotal * ((purchase.taxRate || 0) / 100));
    const shippingCost = purchase.shippingCost || 0;
    const total = roundToFiveDecimalPlaces(subtotal - discountAmount + taxAmount + shippingCost);

    setPurchase(prev => ({
      ...prev,
      subtotal: roundToFiveDecimalPlaces(subtotal),
      taxAmount,
      total
    }));
  }, [purchase.relationshipItems, purchase.taxRate, purchase.discountAmount, purchase.shippingCost]);

  // First effect - update total cost when inputs change
  useEffect(() => {
    if (selectedItems && isManuallyEditing !== 'totalCost') {
      selectedItems.forEach(selectedItem => {
        switch (selectedItem.trackingType) {
          case 'weight':
            setIsManuallyEditing('totalCost');
            setTimeout(() => setIsManuallyEditing(null), 0);
            break;
          case 'length':
            setIsManuallyEditing('totalCost');
            setTimeout(() => setIsManuallyEditing(null), 0);
            break;
          case 'area':
            setIsManuallyEditing('totalCost');
            setTimeout(() => setIsManuallyEditing(null), 0);
            break;
          case 'volume':
            setIsManuallyEditing('totalCost');
            setTimeout(() => setIsManuallyEditing(null), 0);
            break;
          default: // quantity
            setIsManuallyEditing('totalCost');
            setTimeout(() => setIsManuallyEditing(null), 0);
        }
      });
    }
  }, [selectedItems, isManuallyEditing]);

  // Second effect - update cost per unit when total cost changes
  useEffect(() => {
    if (selectedItems && isManuallyEditing !== 'costPerUnit') {
      selectedItems.forEach(selectedItem => {
        switch (selectedItem.trackingType) {
          case 'weight':
            break;
          case 'length':
            break;
          case 'area':
            break;
          case 'volume':
            break;
          default: // quantity
        }
      });
    }
  }, [selectedItems, isManuallyEditing]);

  // Add effect to calculate unit cost when total price or quantity changes
  useEffect(() => {
    if (newItem.trackingType === 'quantity' && newItem.quantity && newItem.quantity > 0) {
      setNewItemUnitCost(roundToFiveDecimalPlaces(newItemTotalPrice / newItem.quantity));
    } else if (newItem.trackingType === 'weight' && newItem.weight && newItem.weight > 0) {
      setNewItemUnitCost(roundToFiveDecimalPlaces(newItemTotalPrice / newItem.weight));
    } else {
      setNewItemUnitCost(0);
    }
  }, [newItemTotalPrice, newItem.quantity, newItem.weight, newItem.trackingType]);

  useEffect(() => {
    // Set price to 50% markup of cost
    const markupPrice = roundToFiveDecimalPlaces(newItemUnitCost * 1.5);
    setNewItem(prev => ({ ...prev, price: markupPrice }));
  }, [newItemUnitCost]);

  const handleTextChange = (field: string, value: string | number) => {
    if (field.startsWith("supplier.")) {
      const supplierField = field.split(".")[1];
      setPurchase({
        ...purchase,
        supplier: {
          ...(purchase.supplier || {}),
          [supplierField]: value
        }
      });
    } else {
      setPurchase({
        ...purchase,
        [field]: value
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setPurchase({
      ...purchase,
      [name]: value
    });
  };

  const handleItemSelectionToggle = (item: Item) => {
    const isSelected = selectedItems.some(selectedItem => selectedItem._id === item._id);
    if (isSelected) {
      setSelectedItems(selectedItems.filter(selectedItem => selectedItem._id !== item._id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  // Handle asset selection toggle
  const handleAssetSelectionToggle = (asset: BusinessAsset) => {
    const isSelected = selectedAssets.some(selectedAsset => selectedAsset._id === asset._id);
    if (isSelected) {
      setSelectedAssets(selectedAssets.filter(selectedAsset => selectedAsset._id !== asset._id));
    } else {
      setSelectedAssets([...selectedAssets, asset]);
    }
  };

  // Handle adding selected items as relationships
  const handleAddSelectedItems = () => {
    if (selectedItems.length === 0) return;

    const newRelationships: Relationship[] = selectedItems.map(item => {
      // Default measurement based on tracking type
      const measurements: RelationshipMeasurement = {};
      const purchaseItemAttributes: PurchaseItemAttributes = {
        costPerUnit: item.cost || item.price || 0,
        totalCost: item.cost || item.price || 0,
        originalCost: item.cost || item.price || 0,
        purchasedBy: item.trackingType,
        purchaseType: "inventory" // Set default purchase type to inventory
      };

      // Set appropriate measurement fields based on tracking type
      switch (item.trackingType) {
        case "weight":
          measurements.weight = 1;
          measurements.weightUnit = item.weightUnit;
          break;
        case "length":
          measurements.length = 1;
          measurements.lengthUnit = item.lengthUnit;
          break;
        case "area":
          measurements.area = 1;
          measurements.areaUnit = item.areaUnit;
          break;
        case "volume":
          measurements.volume = 1;
          measurements.volumeUnit = item.volumeUnit;
          break;
        default: // quantity
          measurements.quantity = 1;
      }

      // Create relationship
      return {
        _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Temporary ID for UI manipulation
        primaryId: "",  // Will be set when purchase is created
        primaryType: ENTITY_TYPES.PURCHASE,
        secondaryId: item._id || "",
        secondaryType: ENTITY_TYPES.ITEM,
        relationshipType: RELATIONSHIP_TYPES.PURCHASE_ITEM,
        measurements,
        purchaseItemAttributes,
        metadata: { name: item.name }  // Store item name for UI display
      } as Relationship;
    });

    setPurchase({
      ...purchase,
      relationshipItems: [...(purchase.relationshipItems || []), ...newRelationships]
    });

    // Reset selections and close dialog
    setSelectedItems([]);
    setItemSelectDialogOpen(false);
  };

  // Handle adding selected assets as relationships
  const handleAddSelectedAssets = () => {
    if (selectedAssets.length === 0) return;

    const newRelationships: Relationship[] = selectedAssets.map(asset => {
      // Create measurement and attributes for asset
      const measurements: RelationshipMeasurement = {
        quantity: 1
      };

      const purchaseItemAttributes: PurchaseItemAttributes = {
        costPerUnit: asset.currentValue || 0,
        totalCost: asset.currentValue || 0,
        originalCost: asset.currentValue || 0,
        purchasedBy: "quantity"
      };

      // Create relationship
      return {
        _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Temporary ID for UI
        primaryId: "",  // Will be set when purchase is created
        primaryType: ENTITY_TYPES.PURCHASE,
        secondaryId: asset._id || "",
        secondaryType: ENTITY_TYPES.ASSET,
        relationshipType: RELATIONSHIP_TYPES.PURCHASE_ASSET,
        measurements,
        purchaseItemAttributes,
        metadata: {
          name: asset.name,
          category: asset.category,
          location: asset.location,
          assignedTo: asset.assignedTo
        }
      } as Relationship;
    });

    setPurchase({
      ...purchase,
      relationshipItems: [...(purchase.relationshipItems || []), ...newRelationships]
    });

    // Reset selections and close dialog
    setSelectedAssets([]);
    setAssetSelectDialogOpen(false);
  };

  const isItemSelected = (item: Item): boolean => {
    return selectedItems.some(selectedItem => selectedItem._id === item._id);
  };

  const isAssetSelected = (asset: BusinessAsset): boolean => {
    return selectedAssets.some(selectedAsset => selectedAsset._id === asset._id);
  };

  // Handle removing a relationship item
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...(purchase.relationshipItems || [])];
    updatedItems.splice(index, 1);
    setPurchase({
      ...purchase,
      relationshipItems: updatedItems
    });
  };

  type ItemFieldValue = string | number | boolean | TrackingType | ItemType | WeightUnit | LengthUnit | AreaUnit | VolumeUnit;

  const handleNewItemChange = (field: string, value: ItemFieldValue) => {
    setNewItem(prev => ({ ...prev, [field]: value }));

    // Clear validation error when field is changed
    if (newItemErrors[field]) {
      setNewItemErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateNewItem = () => {
    const errors: Record<string, string> = {};

    if (!newItem.name) errors.name = 'Name is required';
    if (!newItem.sku) errors.sku = 'SKU is required';
    if (!newItem.category) errors.category = 'Category is required';

    // Only validate tracking type specific fields
    switch (newItem.trackingType) {
      case 'weight':
        if (!newItem.weight || newItem.weight < 0) {
          errors.weight = 'Valid weight is required';
        }
        break;
      case 'length':
        if (!newItem.length || newItem.length < 0) {
          errors.length = 'Valid length is required';
        }
        break;
      case 'area':
        if (!newItem.area || newItem.area < 0) {
          errors.area = 'Valid area is required';
        }
        break;
      case 'volume':
        if (!newItem.volume || newItem.volume < 0) {
          errors.volume = 'Valid volume is required';
        }
        break;
    }

    setNewItemErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateNewItem = async () => {
    if (!validateNewItem()) return;

    try {
      // Set defaults for the removed fields
      const itemWithDefaults = {
        ...newItem,
        quantity: 0, // Set inventory quantity to 0
        cost: 0,     // Default cost to 0
        price: 0,    // Default price to 0
        priceType: 'each' // Default price type
      };

      const createdItem = await createItem.mutateAsync(itemWithDefaults as Item);

      // Close create dialog and go back to selection dialog
      setCreateItemDialogOpen(false);

      // Add the newly created item to selected items without removing already selected ones
      setSelectedItems(prev => [...prev, createdItem]);

      // Reset new item form with empty SKU temporarily
      setNewItem({
        name: '',
        sku: '', // Set to empty initially
        category: '',
        trackingType: 'quantity' as TrackingType,
        itemType: 'material' as ItemType,
        quantity: 0,
        weight: 0,
        weightUnit: 'lb' as WeightUnit,
        length: 0,
        lengthUnit: 'in' as LengthUnit,
        area: 0,
        areaUnit: 'sqft' as AreaUnit,
        volume: 0,
        volumeUnit: 'l' as VolumeUnit,
        price: 0,
        priceType: 'each',
        description: '',
        cost: 0
      });

      // Refetch the next SKU
      refetchNextSku();

    } catch (error) {
      console.error('Failed to create item:', error);
      setError('Failed to create new item. Please try again.');
    }
  };

  // Validate new asset
  const validateNewAsset = () => {
    const errors: Record<string, string> = {};

    if (!newAsset.name) errors.name = 'Name is required';
    if (!newAsset.category) errors.category = 'Category is required';

    setNewAssetErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create new asset handler
  const handleCreateNewAsset = async () => {
    if (!validateNewAsset()) return;

    try {
      const createdAsset = await createAsset.mutateAsync(newAsset as BusinessAsset);

      // Close create dialog and go back to selection dialog
      setCreateAssetDialogOpen(false);

      // Add the newly created asset to selected assets
      setSelectedAssets(prev => [...prev, createdAsset]);

      // Reset new asset form
      setNewAsset({
        name: '',
        category: 'Equipment',
        status: 'active' as AssetStatus,
        initialCost: 0,
        currentValue: 0,
        isInventoryItem: false,
        tags: []
      });
    } catch (error) {
      console.error('Failed to create asset:', error);
      setError('Failed to create new asset. Please try again.');
    }
  };

  // Handle new asset field changes
  const handleNewAssetChange = (field: string, value: any) => {
    setNewAsset(prev => ({ ...prev, [field]: value }));

    // Clear validation error when field is changed
    if (newAssetErrors[field]) {
      setNewAssetErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Updated validation function to check for relationshipItems
  const validateForm = (): string | null => {
    if (!purchase.supplier?.name || purchase.supplier.name.trim() === "")
      return "Supplier name is required";
    if (!purchase.relationshipItems || purchase.relationshipItems.length === 0)
      return "At least one item is required";
    if (purchase.total <= 0)
      return "Total must be greater than zero";

    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    // Sanitize data before submission - trim all string fields
    const sanitizedPurchase = {
      ...purchase,
      supplier: {
        ...purchase.supplier,
        name: purchase.supplier.name?.trim() || '',
        contactName: purchase.supplier.contactName?.trim(),
        email: purchase.supplier.email?.trim(),
        phone: purchase.supplier.phone?.trim()
      },
      notes: purchase.notes?.trim()
    };

    try {
      if (isEditMode) {
        await updatePurchase.mutateAsync(sanitizedPurchase);
      } else {
        await createPurchase.mutateAsync(sanitizedPurchase);
      }
      navigate('/purchases');
    } catch (error: any) {
      console.error('Failed to save purchase:', error);
      // Extract and display the specific error message from the server if available
      const serverErrorMessage = error.response?.data?.message || 'Failed to save purchase. Please try again.';
      setError(serverErrorMessage);
    }
  };

  if (purchaseLoading || itemsLoading || assetsLoading) {
    return <LoadingScreen />;
  }

  if (purchaseError || itemsError) {
    return <ErrorFallback error={(purchaseError || itemsError) as Error} message="Failed to load data" />;
  }

  // Create a lookup object for items for efficient access
  const itemLookup = Object.fromEntries((items || []).map(item => [item._id, item]));

  // Handle relationship item quantity/measurement change
  const handleRelationshipItemMeasurementChange = (index: number, value: number) => {
    const updatedItems = [...(purchase.relationshipItems || [])];
    const relationship = updatedItems[index];

    if (!relationship) return;

    const purchasedBy = relationship.purchaseItemAttributes?.purchasedBy || "quantity";
    const costPerUnit = relationship.purchaseItemAttributes?.costPerUnit || 0;

    // Update the appropriate measurement based on tracking type
    switch (purchasedBy) {
      case "weight":
        relationship.measurements = {
          ...relationship.measurements,
          weight: value
        };
        break;
      case "length":
        relationship.measurements = {
          ...relationship.measurements,
          length: value
        };
        break;
      case "area":
        relationship.measurements = {
          ...relationship.measurements,
          area: value
        };
        break;
      case "volume":
        relationship.measurements = {
          ...relationship.measurements,
          volume: value
        };
        break;
      default: // quantity
        relationship.measurements = {
          ...relationship.measurements,
          quantity: value
        };
    }

    // Calculate total cost based on measurement and cost per unit
    const totalCost = calculateTotalCost(
      relationship.measurements,
      purchasedBy,
      costPerUnit
    );

    // Update purchase item attributes
    relationship.purchaseItemAttributes = {
      ...relationship.purchaseItemAttributes,
      totalCost: roundToFiveDecimalPlaces(totalCost)
    };

    setPurchase({
      ...purchase,
      relationshipItems: updatedItems
    });
  };

  // Handle relationship item cost per unit change
  const handleRelationshipCostPerUnitChange = (index: number, value: number) => {
    const updatedItems = [...(purchase.relationshipItems || [])];
    const relationship = updatedItems[index];

    if (!relationship) return;

    const purchasedBy = relationship.purchaseItemAttributes?.purchasedBy || "quantity";

    // Update cost per unit
    relationship.purchaseItemAttributes = {
      ...relationship.purchaseItemAttributes,
      costPerUnit: value,
      originalCost: value
    };

    // Calculate total cost based on measurement and new cost per unit
    const totalCost = calculateTotalCost(
      relationship.measurements || {},
      purchasedBy,
      value
    );

    // Update total cost
    relationship.purchaseItemAttributes = {
      ...relationship.purchaseItemAttributes,
      totalCost: roundToFiveDecimalPlaces(totalCost)
    };

    setPurchase({
      ...purchase,
      relationshipItems: updatedItems
    });
  };

  // Handle relationship item discount change
  const handleRelationshipDiscountChange = (
    index: number,
    type: "percentage" | "amount",
    value: number
  ) => {
    const updatedItems = [...(purchase.relationshipItems || [])];
    const relationship = updatedItems[index];

    if (!relationship) return;

    const purchasedBy = relationship.purchaseItemAttributes?.purchasedBy || "quantity";
    const costPerUnit = relationship.purchaseItemAttributes?.costPerUnit || 0;

    // Calculate base amount before discount
    const baseAmount = calculateTotalCost(
      relationship.measurements || {},
      purchasedBy,
      costPerUnit
    );

    if (type === "percentage") {
      // Calculate discount amount from percentage
      const discountAmount = roundToFiveDecimalPlaces((value / 100) * baseAmount);

      // Update attributes
      relationship.purchaseItemAttributes = {
        ...relationship.purchaseItemAttributes,
        discountPercentage: value,
        discountAmount: discountAmount,
        totalCost: roundToFiveDecimalPlaces(Math.max(0, baseAmount - discountAmount))
      };
    } else {
      // Calculate percentage from amount
      const discountPercentage = baseAmount > 0
        ? roundToFiveDecimalPlaces((value / baseAmount) * 100)
        : 0;

      // Update attributes
      relationship.purchaseItemAttributes = {
        ...relationship.purchaseItemAttributes,
        discountAmount: value,
        discountPercentage: discountPercentage,
        totalCost: roundToFiveDecimalPlaces(Math.max(0, baseAmount - value))
      };
    }

    setPurchase({
      ...purchase,
      relationshipItems: updatedItems
    });
  };

  // Handle drag end event for reordering relationships
  const handleDragEnd = (result: DropResult) => {
    // If dropped outside the list or no destination, do nothing
    if (!result.destination) return;

    // If the item was dropped in the same position, do nothing
    if (result.destination.index === result.source.index) return;

    // Create a new array of relationship items
    const updatedItems = Array.from(purchase.relationshipItems || []);

    // Remove the dragged item from the array
    const [movedItem] = updatedItems.splice(result.source.index, 1);

    // Insert it at the destination position
    updatedItems.splice(result.destination.index, 0, movedItem);

    // Update the state with the new order
    setPurchase({
      ...purchase,
      relationshipItems: updatedItems
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Purchase' : 'New Purchase'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          component={RouterLink}
          to="/purchases"
        >
          Back to Purchases
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Supplier Information</Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Supplier Name"
              value={purchase.supplier?.name || ''}
              onChange={(e) => handleTextChange('supplier.name', e.target.value)}
              margin="normal"
              required
              error={error?.includes('Supplier name')}
              helperText={error?.includes('Supplier name') ? 'Supplier name is required' : ''}
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Contact Name"
              value={purchase.supplier?.contactName || ''}
              onChange={(e) => handleTextChange('supplier.contactName', e.target.value)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={purchase.supplier?.email || ''}
              onChange={(e) => handleTextChange('supplier.email', e.target.value)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Phone"
              value={purchase.supplier?.phone || ''}
              onChange={(e) => handleTextChange('supplier.phone', e.target.value)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Invoice Number"
              value={purchase.invoiceNumber || ''}
              onChange={(e) => handleTextChange('invoiceNumber', e.target.value)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Purchase Date"
              type="date"
              value={purchase.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleTextChange('purchaseDate', e.target.value)}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid2>
        </Grid2>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
          <Typography variant="h6">Purchase Items</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setItemTypeSelectDialogOpen(true)}
            disabled={createPurchase.isPending || updatePurchase.isPending}
          >
            Add Items
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {purchase.relationshipItems && purchase.relationshipItems.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={50}></TableCell> {/* Drag handle column */}
                    <TableCell>Item</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Quantity/Measurement</TableCell>
                    <TableCell>Cost Per Unit</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell align="right">Total Cost</TableCell>
                    <TableCell width={80}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <Droppable droppableId="purchase-items" direction="vertical">
                  {(provided) => (
                    <TableBody
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {purchase.relationshipItems.map((relationship, index) => {
                        const isAssetItem = relationship.secondaryType === ENTITY_TYPES.ASSET;
                        const itemDetails = !isAssetItem && relationship.secondaryId
                          ? itemLookup[relationship.secondaryId]
                          : null;

                        // Get item name from various sources
                        const itemName = itemDetails?.name ||
                                        relationship.metadata?.name ||
                                        (isAssetItem ? "Asset" : "Unknown Item");

                        // Get purchase attributes
                        const purchaseItemAttributes = relationship.purchaseItemAttributes || {};
                        const purchasedBy = purchaseItemAttributes.purchasedBy || "quantity";
                        const costPerUnit = purchaseItemAttributes.costPerUnit || 0;
                        const totalCost = purchaseItemAttributes.totalCost || 0;
                        const discountAmount = purchaseItemAttributes.discountAmount || 0;
                        const discountPercentage = purchaseItemAttributes.discountPercentage || 0;

                        // Get measurements
                        const measurements = relationship.measurements || {};
                        const measurementValue =
                          purchasedBy === "weight" ? measurements.weight || 0 :
                          purchasedBy === "length" ? measurements.length || 0 :
                          purchasedBy === "area" ? measurements.area || 0 :
                          purchasedBy === "volume" ? measurements.volume || 0 :
                          measurements.quantity || 0;

                        // Get measurement unit
                        const measurementUnit =
                          purchasedBy === "weight" ? measurements.weightUnit || "kg" :
                          purchasedBy === "length" ? measurements.lengthUnit || "m" :
                          purchasedBy === "area" ? measurements.areaUnit || "sqm" :
                          purchasedBy === "volume" ? measurements.volumeUnit || "l" :
                          "";

                        return (
                          <Draggable
                            key={relationship._id || `relationship-${index}`}
                            draggableId={relationship._id || `relationship-${index}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                sx={{
                                  backgroundColor: isAssetItem
                                    ? (theme) => theme.palette.mode === "dark"
                                      ? "rgba(144, 202, 249, 0.1)"
                                      : "rgba(33, 150, 243, 0.05)"
                                    : snapshot.isDragging
                                      ? "rgba(63, 81, 181, 0.08)"
                                      : "inherit",
                                  "&:hover .drag-handle": {
                                    opacity: 1,
                                  },
                                  // Add styling to ensure the dragged item remains visible
                                  ...(snapshot.isDragging && {
                                    borderRadius: "4px",
                                    outline: "1px solid #aaa",
                                  })
                                }}
                              >
                                <TableCell>
                                  <Box
                                    {...provided.dragHandleProps}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center"
                                    }}
                                  >
                                    <DragIndicator
                                      className="drag-handle"
                                      sx={{
                                        cursor: "grab",
                                        opacity: 0.3,
                                        transition: "opacity 0.2s"
                                      }}
                                    />
                                  </Box>
                                </TableCell>

                                <TableCell>
                                  {itemName}
                                </TableCell>

                                <TableCell>
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={purchaseItemAttributes.purchaseType || "inventory"}
                                      onChange={(e) => {
                                        // Update purchase type
                                        const updatedItems = [...(purchase.relationshipItems || [])];
                                        const relationship = updatedItems[index];
                                        if (relationship) {
                                          relationship.purchaseItemAttributes = {
                                            ...relationship.purchaseItemAttributes,
                                            purchaseType: e.target.value as PurchaseType
                                          };
                                          setPurchase({
                                            ...purchase,
                                            relationshipItems: updatedItems
                                          });
                                        }
                                      }}
                                    >
                                      <MenuItem value="inventory">
                                        <Chip size="small" icon={<Inventory fontSize="small" />}
                                          label="Inventory" variant="outlined" color="secondary" />
                                      </MenuItem>
                                      <MenuItem value="asset">
                                        <Chip size="small" icon={<BusinessCenter fontSize="small" />}
                                          label="Asset" variant="outlined" color="primary" />
                                      </MenuItem>
                                      <MenuItem value="expense">
                                        <Chip size="small" icon={<AttachMoney fontSize="small" />}
                                          label="Expense" variant="outlined" color="warning" />
                                      </MenuItem>
                                      <MenuItem value="service">
                                        <Chip size="small" icon={<Handyman fontSize="small" />}
                                          label="Service" variant="outlined" color="info" />
                                      </MenuItem>
                                      <MenuItem value="untracked">
                                        <Chip
                                          size="small"
                                          icon={<RemoveCircleOutline fontSize="small" />}
                                          label="Untracked"
                                          variant="outlined"
                                          color="default"
                                        />
                                      </MenuItem>
                                    </Select>
                                  </FormControl>
                                </TableCell>

                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={measurementValue}
                                    onChange={(e) => handleRelationshipItemMeasurementChange(
                                      index,
                                      parseFloat(e.target.value) || 0
                                    )}
                                    InputProps={{
                                      endAdornment: measurementUnit ? (
                                        <InputAdornment position="end">
                                          {measurementUnit}
                                        </InputAdornment>
                                      ) : null,
                                    }}
                                  />
                                </TableCell>

                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={costPerUnit || 0}
                                    onChange={(e) => handleRelationshipCostPerUnitChange(
                                      index,
                                      parseFloat(e.target.value) || 0
                                    )}
                                    InputProps={{
                                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                  />
                                </TableCell>

                                <TableCell>
                                  <Grid2 container spacing={1} alignItems="center">
                                    <Grid2 size={{ xs: 6 }}>
                                      <TextField
                                        size="small"
                                        type="number"
                                        value={discountPercentage}
                                        onChange={(e) => handleRelationshipDiscountChange(
                                          index,
                                          "percentage",
                                          parseFloat(e.target.value) || 0
                                        )}
                                        InputProps={{
                                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        }}
                                      />
                                    </Grid2>
                                    <Grid2 size={{ xs: 6 }}>
                                      <TextField
                                        size="small"
                                        type="number"
                                        value={discountAmount}
                                        onChange={(e) => handleRelationshipDiscountChange(
                                          index,
                                          "amount",
                                          parseFloat(e.target.value) || 0
                                        )}
                                        InputProps={{
                                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                        }}
                                      />
                                    </Grid2>
                                  </Grid2>
                                </TableCell>

                                <TableCell align="right">{formatCurrency(totalCost)}</TableCell>

                                <TableCell>
                                  <IconButton size="small" onClick={() => handleRemoveItem(index)}>
                                    <DeleteOutline fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </TableBody>
                  )}
                </Droppable>
              </Table>
            </TableContainer>
          </DragDropContext>
        ) : (
          <Alert severity="info">No items added yet. Use the "Add Items" button to add inventory items to this purchase.</Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Payment Details</Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Payment Method</InputLabel>
              <Select
                name="paymentMethod"
                value={purchase.paymentMethod}
                label="Payment Method"
                onChange={handleSelectChange}
                disabled={createPurchase.isPending || updatePurchase.isPending}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="credit">Credit Card</MenuItem>
                <MenuItem value="debit">Debit Card</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={purchase.status}
                label="Status"
                onChange={handleSelectChange}
                disabled={createPurchase.isPending || updatePurchase.isPending}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="received">Received</MenuItem>
                <MenuItem value="partially_received">Partially Received</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={purchase.notes || ''}
              onChange={(e) => handleTextChange('notes', e.target.value)}
              margin="normal"
              multiline
              rows={3}
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid2>
        </Grid2>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Purchase Summary</Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Subtotal"
              value={purchase.subtotal}
              disabled
              margin="normal"
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Discount Amount"
              type="number"
              name="discountAmount"
              value={purchase.discountAmount || 0}
              onChange={(e) => handleTextChange('discountAmount', parseFloat(e.target.value) || 0)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Tax Rate (%)"
              type="number"
              name="taxRate"
              value={purchase.taxRate || 0}
              onChange={(e) => handleTextChange('taxRate', parseFloat(e.target.value) || 0)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Tax Amount"
              value={purchase.taxAmount || 0}
              disabled
              margin="normal"
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Shipping Cost"
              type="number"
              name="shippingCost"
              value={purchase.shippingCost || 0}
              onChange={(e) => handleTextChange('shippingCost', parseFloat(e.target.value) || 0)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Total"
              value={purchase.total}
              disabled
              margin="normal"
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid2>
        </Grid2>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={createPurchase.isPending || updatePurchase.isPending}
          size="large"
        >
          {createPurchase.isPending || updatePurchase.isPending ? 'Saving...' : isEditMode ? 'Update Purchase' : 'Save Purchase'}
        </Button>
      </Box>

      {/* Item Selection Dialog */}
      <Dialog open={itemSelectDialogOpen} onClose={() => setItemSelectDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Select Items</Typography>
            <Box>
              <Button
                startIcon={<AddCircle />}
                color="primary"
                onClick={() => {
                  setCreateItemDialogOpen(true);
                }}
              >
                Create New Item
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select one or more items to add to your purchase. Click the add button when done.
          </Typography>
          <List>
            {items.map((item) => (
              <ListItemButton
                key={item._id}
                onClick={() => handleItemSelectionToggle(item)}
                divider
                selected={isItemSelected(item)}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={isItemSelected(item)}
                    tabIndex={-1}
                    disableRipple
                    onClick={(e) => e.stopPropagation()}
                  />
                </ListItemIcon>
                <ListItemAvatar>
                  <Avatar variant="rounded">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon />
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={item.name}
                  secondary={`SKU: ${item.sku} | Price: ${formatCurrency(item.price)} | ${item.trackingType === 'quantity' ? `${item.quantity} in stock` : `${item.weight} ${item.weightUnit} in stock`}`}
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Typography variant="body2" sx={{ flexGrow: 1, ml: 2 }}>
            {selectedItems.length} item(s) selected
          </Typography>
          <Button onClick={() => setItemSelectDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleAddSelectedItems}
            color="primary"
            variant="contained"
            disabled={selectedItems.length === 0}
          >
            Add Selected Items
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create New Item Dialog - updated */}
      <Dialog
        open={createItemDialogOpen}
        onClose={() => setCreateItemDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Item</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Creating a new item will add it to your inventory.
            You'll be able to add it to your purchase after creation.
          </Alert>

          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Item Name"
                value={newItem.name}
                onChange={(e) => handleNewItemChange('name', e.target.value)}
                margin="normal"
                required
                error={!!newItemErrors.name}
                helperText={newItemErrors.name}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="SKU"
                value={newItem.sku}
                onChange={(e) => handleNewItemChange('sku', e.target.value)}
                margin="normal"
                required
                error={!!newItemErrors.sku}
                helperText={newItemErrors.sku}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <Autocomplete
                freeSolo
                options={categories}
                value={newItem.category || ''}
                onChange={(_, newValue) => {
                  handleNewItemChange('category', newValue || '');
                }}
                onInputChange={(_, newInputValue) => {
                  // This ensures text input is captured even when not selecting from options
                  handleNewItemChange('category', newInputValue || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    margin="normal"
                    required
                    error={!!newItemErrors.category}
                    helperText={newItemErrors.category}
                  />
                )}
                disabled={createItem.isPending}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Item Type</InputLabel>
                <Select
                  value={newItem.itemType}
                  label="Item Type"
                  onChange={(e) => handleNewItemChange('itemType', e.target.value)}
                >
                  <MenuItem value="material">Material</MenuItem>
                  <MenuItem value="product">Product</MenuItem>
                  <MenuItem value="both">Both</MenuItem>
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Tracking Type</InputLabel>
                <Select
                  value={newItem.trackingType}
                  label="Tracking Type"
                  onChange={(e) => handleNewItemChange('trackingType', e.target.value)}
                >
                  <MenuItem value="quantity">Track by Quantity</MenuItem>
                  <MenuItem value="weight">Track by Weight</MenuItem>
                  <MenuItem value="length">Track by Length</MenuItem>
                  <MenuItem value="area">Track by Area</MenuItem>
                  <MenuItem value="volume">Track by Volume</MenuItem>
                </Select>
                <FormHelperText>
                  {newItem.trackingType === 'quantity'
                    ? 'Track individual units in your inventory'
                    : newItem.trackingType === 'weight'
                      ? 'Track the weight of your inventory'
                      : newItem.trackingType === 'length'
                        ? 'Track the length of your inventory'
                        : newItem.trackingType === 'area'
                          ? 'Track the area of your inventory'
                          : 'Track the volume of your inventory'}
                </FormHelperText>
              </FormControl>
            </Grid2>

            {newItem.trackingType === 'weight' ? (
              <Grid2 size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Weight"
                  type="number"
                  value={newItem.weight}
                  onChange={(e) => handleNewItemChange('weight', parseFloat(e.target.value) || 0)}
                  margin="normal"
                  required
                  error={!!newItemErrors.weight}
                  helperText={newItemErrors.weight}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Select
                          value={newItem.weightUnit}
                          onChange={(e) => handleNewItemChange('weightUnit', e.target.value)}
                          size="small"
                        >
                          <MenuItem value="oz">oz</MenuItem>
                          <MenuItem value="lb">lb</MenuItem>
                          <MenuItem value="g">g</MenuItem>
                          <MenuItem value="kg">kg</MenuItem>
                        </Select>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid2>
            ) : newItem.trackingType === 'length' ? (
              <Grid2 size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Length"
                  type="number"
                  value={newItem.length}
                  onChange={(e) => handleNewItemChange('length', parseFloat(e.target.value) || 0)}
                  margin="normal"
                  required
                  error={!!newItemErrors.length}
                  helperText={newItemErrors.length}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Select
                          value={newItem.lengthUnit}
                          onChange={(e) => handleNewItemChange('lengthUnit', e.target.value)}
                          size="small"
                        >
                          <MenuItem value="mm">mm</MenuItem>
                          <MenuItem value="cm">cm</MenuItem>
                          <MenuItem value="m">m</MenuItem>
                          <MenuItem value="in">in</MenuItem>
                          <MenuItem value="ft">ft</MenuItem>
                          <MenuItem value="yd">yd</MenuItem>
                        </Select>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid2>
            ) : newItem.trackingType === 'area' ? (
              <Grid2 size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Area"
                  type="number"
                  value={newItem.area}
                  onChange={(e) => handleNewItemChange('area', parseFloat(e.target.value) || 0)}
                  margin="normal"
                  required
                  error={!!newItemErrors.area}
                  helperText={newItemErrors.area}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Select
                          value={newItem.areaUnit}
                          onChange={(e) => handleNewItemChange('areaUnit', e.target.value)}
                          size="small"
                        >
                          <MenuItem value="sqft">sq ft</MenuItem>
                          <MenuItem value="sqm">sq m</MenuItem>
                          <MenuItem value="sqyd">sq yd</MenuItem>
                          <MenuItem value="acre">acre</MenuItem>
                          <MenuItem value="ha">ha</MenuItem>
                        </Select>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid2>
            ) : newItem.trackingType === 'volume' ? (
              <Grid2 size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Volume"
                  type="number"
                  value={newItem.volume}
                  onChange={(e) => handleNewItemChange('volume', parseFloat(e.target.value) || 0)}
                  margin="normal"
                  required
                  error={!!newItemErrors.volume}
                  helperText={newItemErrors.volume}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Select
                          value={newItem.volumeUnit}
                          onChange={(e) => handleNewItemChange('volumeUnit', e.target.value)}
                          size="small"
                        >
                          <MenuItem value="ml">ml</MenuItem>
                          <MenuItem value="l">l</MenuItem>
                          <MenuItem value="gal">gal</MenuItem>
                          <MenuItem value="floz">fl oz</MenuItem>
                          <MenuItem value="cu_ft">cu ft</MenuItem>
                          <MenuItem value="cu_m">cu m</MenuItem>
                        </Select>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid2>
            ) : null}

            <Grid2 size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={newItem.description}
                onChange={(e) => handleNewItemChange('description', e.target.value)}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid2>
          </Grid2>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateItemDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateNewItem}
            variant="contained"
            color="primary"
            disabled={createItem.isPending}
          >
            {createItem.isPending ? 'Creating...' : 'Create Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Asset Selection Dialog */}
      <Dialog open={assetSelectDialogOpen} onClose={() => setAssetSelectDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Select Assets</Typography>
            <Box>
              <Button
                startIcon={<AddCircle />}
                color="primary"
                onClick={() => {
                  setCreateAssetDialogOpen(true);
                }}
              >
                Create New Asset
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select one or more business assets to add to your purchase.
          </Typography>
          {assets.length > 0 ? (
            <List>
              {assets.map((asset) => (
                <ListItemButton
                  key={asset._id}
                  onClick={() => handleAssetSelectionToggle(asset)}
                  divider
                  selected={isAssetSelected(asset)}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={isAssetSelected(asset)}
                      tabIndex={-1}
                      disableRipple
                      onClick={(e) => e.stopPropagation()}
                    />
                  </ListItemIcon>
                  <ListItemAvatar>
                    <Avatar variant="rounded">
                      {asset.imageUrl ? (
                        <img src={asset.imageUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <BusinessCenter />
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={asset.name}
                    secondary={`Category: ${asset.category} | Value: ${formatCurrency(asset.currentValue)}`}
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              No assets found. Create some assets first or click "Create New Asset" to add one now.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Typography variant="body2" sx={{ flexGrow: 1, ml: 2 }}>
            {selectedAssets.length} asset(s) selected
          </Typography>
          <Button onClick={() => setAssetSelectDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleAddSelectedAssets}
            color="primary"
            variant="contained"
            disabled={selectedAssets.length === 0}
          >
            Add Selected Assets
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create New Asset Dialog */}
      <Dialog
        open={createAssetDialogOpen}
        onClose={() => setCreateAssetDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Asset</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Create a new business asset to add to your purchase.
          </Alert>

          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Asset Name"
                value={newAsset.name}
                onChange={(e) => handleNewAssetChange('name', e.target.value)}
                margin="normal"
                required
                error={!!newAssetErrors.name}
                helperText={newAssetErrors.name}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <Autocomplete
                freeSolo
                options={assetCategories || []}
                value={newAsset.category || ''}
                onChange={(_, newValue) => {
                  handleNewAssetChange('category', newValue || 'Equipment');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    margin="normal"
                    required
                    error={!!newAssetErrors.category}
                    helperText={newAssetErrors.category}
                  />
                )}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newAsset.status || 'active'}
                  label="Status"
                  onChange={(e) => handleNewAssetChange('status', e.target.value)}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                  <MenuItem value="lost">Lost</MenuItem>
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Location"
                value={newAsset.location || ''}
                onChange={(e) => handleNewAssetChange('location', e.target.value)}
                margin="normal"
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Initial Cost"
                type="number"
                value={newAsset.initialCost || 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  handleNewAssetChange('initialCost', value);
                  handleNewAssetChange('currentValue', value);
                }}
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Current Value"
                type="number"
                value={newAsset.currentValue || 0}
                onChange={(e) => handleNewAssetChange('currentValue', parseFloat(e.target.value) || 0)}
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={newAsset.notes || ''}
                onChange={(e) => handleNewAssetChange('notes', e.target.value)}
                margin="normal"
              />
            </Grid2>
          </Grid2>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAssetDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateNewAsset}
            variant="contained"
            color="primary"
            disabled={createAsset.isPending}
          >
            {createAsset.isPending ? 'Creating...' : 'Create Asset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Item Type Selection Dialog */}
      <Dialog
        open={itemTypeSelectDialogOpen}
        onClose={() => setItemTypeSelectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">What type of item do you want to add?</Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Inventory />}
              size="large"
              onClick={() => {
                setItemTypeSelectDialogOpen(false);
                setItemSelectDialogOpen(true);
              }}
              sx={{ py: 2, justifyContent: "flex-start" }}
            >
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="subtitle1">Inventory Item</Typography>
                <Typography variant="body2" color="text.secondary">
                  Add an item that will be tracked in your inventory system
                </Typography>
              </Box>
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<BusinessCenter />}
              size="large"
              onClick={() => {
                setItemTypeSelectDialogOpen(false);
                setAssetSelectDialogOpen(true);
              }}
              sx={{ py: 2, justifyContent: "flex-start" }}
            >
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="subtitle1">Business Asset</Typography>
                <Typography variant="body2" color="text.secondary">
                  Add a tracked asset for your business (equipment, vehicles, etc.)
                </Typography>
              </Box>
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemTypeSelectDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
