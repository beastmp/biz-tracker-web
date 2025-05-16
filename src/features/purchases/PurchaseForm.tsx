import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
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
} from '@mui/material';
import {
  Save,
  ArrowBack,
  Add,
  Image as ImageIcon,
  AddCircle,
  DeleteOutline,
  DragIndicator,
  BusinessCenter,
  Inventory
} from '@mui/icons-material';
import { usePurchase, useCreatePurchase, useUpdatePurchase } from '@hooks/usePurchases';
import { useItems, useCreateItem, useNextSku, useCategories } from '@hooks/useItems';
import { useAssets, useAssetCategories, useCreateAsset } from '@hooks/useAssets';
import { Purchase, PurchaseItem, Item, WeightUnit, TrackingType, ItemType, LengthUnit, AreaUnit, VolumeUnit, BusinessAsset, AssetStatus } from '@custTypes/models';
import { formatCurrency } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';

// Utility function to round to 5 decimal places
const roundToFiveDecimalPlaces = (num: number): number => {
  return Math.round(num * 100000) / 100000;
};

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
  const [purchase, setPurchase] = useState<Purchase>({
    supplier: {
      name: '',
      contactName: '',
      email: '',
      phone: ''
    },
    items: [],
    subtotal: 0,
    discountAmount: 0,
    taxRate: 0,
    taxAmount: 0,
    shippingCost: 0,
    total: 0,
    paymentMethod: 'debit',
    status: 'received'
  });

  // Item selection state
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [itemSelectDialogOpen, setItemSelectDialogOpen] = useState(false);
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
      setPurchase(existingPurchase);
    }
  }, [isEditMode, existingPurchase]);

  // Set next SKU when available
  useEffect(() => {
    if (nextSku) {
      setNewItem(prev => ({ ...prev, sku: nextSku }));
    }
  }, [nextSku]);

  // Update total costs whenever items, tax, discount, or shipping change
  useEffect(() => {
    const subtotal = purchase.items.reduce(
      (sum, item) => sum + item.totalCost,
      0
    );

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
  }, [purchase.items, purchase.taxRate, purchase.discountAmount, purchase.shippingCost]);

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
    if (field.startsWith('supplier.')) {
      const supplierField = field.split('.')[1];
      setPurchase({
        ...purchase,
        supplier: {
          ...purchase.supplier,
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

  const handleAddSelectedItems = () => {
    if (selectedItems.length === 0) return;

    const newItems: PurchaseItem[] = selectedItems.map(item => {
      const newItem: PurchaseItem = {
        item: item._id || '',
        costPerUnit: item.cost || item.price || 0,
        originalCost: item.cost || item.price || 0,
        totalCost: item.cost || item.price || 0,
        // Add required properties with defaults
        quantity: 1, // Default quantity to 1
        weight: 0,
        length: 0,
        area: 0,
        volume: 0,
        discountAmount: 0,
        discountPercentage: 0,
        purchasedBy: 'quantity' // Default tracking type
      };

      // Set appropriate measurement fields based on tracking type
      switch (item.trackingType) {
        case 'weight':
          newItem.weight = 1; // Default weight to 1
          newItem.weightUnit = item.weightUnit;
          newItem.purchasedBy = 'weight';
          break;
        case 'length':
          newItem.length = 1; // Default length to 1
          newItem.lengthUnit = item.lengthUnit;
          newItem.purchasedBy = 'length';
          break;
        case 'area':
          newItem.area = 1; // Default area to 1
          newItem.areaUnit = item.areaUnit;
          newItem.purchasedBy = 'area';
          break;
        case 'volume':
          newItem.volume = 1; // Default volume to 1
          newItem.volumeUnit = item.volumeUnit;
          newItem.purchasedBy = 'volume';
          break;
        default: // quantity
          newItem.quantity = 1;
          newItem.purchasedBy = 'quantity';
      }

      return newItem;
    });

    setPurchase({
      ...purchase,
      items: [...purchase.items, ...newItems]
    });

    // Reset selections and close dialog
    setSelectedItems([]);
    setItemSelectDialogOpen(false);
  };

  // Handle adding selected assets to the purchase
  const handleAddSelectedAssets = () => {
    if (selectedAssets.length === 0) return;

    const newItems: PurchaseItem[] = selectedAssets.map(asset => {
      const assetItem: PurchaseItem = {
        item: asset._id || '', // Use asset ID directly
        costPerUnit: asset.currentValue || 0,
        originalCost: asset.currentValue || 0,
        totalCost: asset.currentValue || 0,
        quantity: 1,
        weight: 0,
        length: 0,
        area: 0,
        volume: 0,
        discountAmount: 0,
        discountPercentage: 0,
        purchasedBy: 'quantity',
        isAsset: true, // Mark as an asset
        assetInfo: {
          name: asset.name,
          category: asset.category,
          location: asset.location,
          assignedTo: asset.assignedTo
        }
      };

      return assetItem;
    });

    setPurchase({
      ...purchase,
      items: [...purchase.items, ...newItems]
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

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...purchase.items];
    updatedItems.splice(index, 1);
    setPurchase({
      ...purchase,
      items: updatedItems
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

  // Enhance the validateForm function to check for whitespace-only strings
  const validateForm = (): string | null => {
    if (!purchase.supplier?.name || purchase.supplier.name.trim() === '') return 'Supplier name is required';
    if (purchase.items.length === 0) return 'At least one item is required';
    if (purchase.total <= 0) return 'Total must be greater than zero';

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

  const handleItemDiscountChange = (index: number, type: 'percentage' | 'amount', value: number) => {
    const updatedItems = [...purchase.items];
    const item = updatedItems[index];

    if (type === 'percentage') {
      // Update percentage discount
      item.discountPercentage = roundToFiveDecimalPlaces(value);

      // Calculate discount amount based on percentage
      const baseAmount = calculateItemBaseAmount(item);
      item.discountAmount = roundToFiveDecimalPlaces((value / 100) * baseAmount);
    } else {
      // Update amount discount
      item.discountAmount = roundToFiveDecimalPlaces(value);

      // Calculate percentage based on amount
      const baseAmount = calculateItemBaseAmount(item);
      item.discountPercentage = baseAmount > 0 ? roundToFiveDecimalPlaces((value / baseAmount) * 100) : 0;
    }

    // Recalculate total cost
    item.totalCost = roundToFiveDecimalPlaces(calculateItemTotalCost(item));

    setPurchase({
      ...purchase,
      items: updatedItems
    });
  };

  // Helper function to calculate item's base amount before discount
  const calculateItemBaseAmount = (item: PurchaseItem): number => {
    // Calculate using cost per unit which is now derived from original cost and quantity
    switch (item.purchasedBy) {
      case 'quantity':
        return roundToFiveDecimalPlaces(item.quantity * item.costPerUnit);
      case 'weight':
        return roundToFiveDecimalPlaces(item.weight * item.costPerUnit);
      case 'length':
        return roundToFiveDecimalPlaces(item.length * item.costPerUnit);
      case 'area':
        return roundToFiveDecimalPlaces(item.area * item.costPerUnit);
      case 'volume':
        return roundToFiveDecimalPlaces(item.volume * item.costPerUnit);
      default:
        return roundToFiveDecimalPlaces(item.quantity * item.costPerUnit);
    }
  };

  // Helper function to calculate item's total cost after discount
  const calculateItemTotalCost = (item: PurchaseItem): number => {
    const baseAmount = calculateItemBaseAmount(item);
    const discountAmount = item.discountAmount || 0;
    return roundToFiveDecimalPlaces(Math.max(0, baseAmount - discountAmount));
  };

  // Add this handler function to update quantity in the items list
  const handleItemQuantityChange = (index: number, value: number) => {
    const updatedItems = [...purchase.items];
    const item = updatedItems[index];

    // Update quantity
    if (item.purchasedBy === 'quantity') {
      item.quantity = value;
    } else if (item.purchasedBy === 'weight') {
      item.weight = value;
    } else if (item.purchasedBy === 'length') {
      item.length = value;
    } else if (item.purchasedBy === 'area') {
      item.area = value;
    } else if (item.purchasedBy === 'volume') {
      item.volume = value;
    }

    // Recalculate cost per unit (if original cost exists)
    if (item.originalCost) {
      if (value > 0) {
        item.costPerUnit = roundToFiveDecimalPlaces(item.originalCost / value);
      } else {
        item.costPerUnit = 0;
      }
    }

    // Recalculate total cost
    item.totalCost = roundToFiveDecimalPlaces(calculateItemTotalCost(item));

    setPurchase({
      ...purchase,
      items: updatedItems
    });
  };

  // Add this handler function to update original cost
  const handleItemOriginalCostChange = (index: number, value: number) => {
    const updatedItems = [...purchase.items];
    const item = updatedItems[index];

    // Update original cost
    item.originalCost = value;

    // Recalculate cost per unit
    const quantity = item.purchasedBy === 'quantity' ? item.quantity :
      item.purchasedBy === 'weight' ? item.weight :
        item.purchasedBy === 'length' ? item.length :
          item.purchasedBy === 'area' ? item.area :
            item.purchasedBy === 'volume' ? item.volume : 0;

    if (quantity > 0) {
      item.costPerUnit = roundToFiveDecimalPlaces(value / quantity);
    } else {
      item.costPerUnit = 0;
    }

    // Recalculate total cost
    item.totalCost = roundToFiveDecimalPlaces(calculateItemTotalCost(item));

    setPurchase({
      ...purchase,
      items: updatedItems
    });
  };

  // Handle drag end event for reordering
  const handleDragEnd = (result: DropResult) => {
    // If dropped outside the list or no destination, do nothing
    if (!result.destination) return;

    // If the item was dropped in the same position, do nothing
    if (result.destination.index === result.source.index) return;

    // Create a new array of purchase items
    const updatedItems = Array.from(purchase.items);

    // Remove the dragged item from the array
    const [movedItem] = updatedItems.splice(result.source.index, 1);

    // Insert it at the destination position
    updatedItems.splice(result.destination.index, 0, movedItem);

    // Update the state with the new order
    setPurchase({
      ...purchase,
      items: updatedItems
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

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Supplier Name"
              value={purchase.supplier.name || ''}
              onChange={(e) => handleTextChange('supplier.name', e.target.value)}
              margin="normal"
              required
              error={error?.includes('Supplier name')}
              helperText={error?.includes('Supplier name') ? 'Supplier name is required' : ''}
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Contact Name"
              value={purchase.supplier.contactName || ''}
              onChange={(e) => handleTextChange('supplier.contactName', e.target.value)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={purchase.supplier.email || ''}
              onChange={(e) => handleTextChange('supplier.email', e.target.value)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Phone"
              value={purchase.supplier.phone || ''}
              onChange={(e) => handleTextChange('supplier.phone', e.target.value)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Invoice Number"
              value={purchase.invoiceNumber || ''}
              onChange={(e) => handleTextChange('invoiceNumber', e.target.value)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <Typography variant="h6">Purchase Items</Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<BusinessCenter />}
              onClick={() => setAssetSelectDialogOpen(true)}
              disabled={createPurchase.isPending || updatePurchase.isPending}
            >
              Add Assets
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setItemSelectDialogOpen(true)}
              disabled={createPurchase.isPending || updatePurchase.isPending}
            >
              Add Items
            </Button>
          </Stack>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {purchase.items.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={50}></TableCell> {/* Drag handle column */}
                    <TableCell>Item</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Quantity/Weight</TableCell>
                    <TableCell>Original Cost</TableCell>
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
                      {purchase.items.map((item, index) => {
                        const isAssetItem = item.isAsset === true;
                        const itemDetails = !isAssetItem && typeof item.item === 'object' ? item.item : !isAssetItem && typeof item.item === 'string' ? itemLookup[item.item] : null;

                        return (
                          <Draggable
                            key={`item-${index}`}
                            draggableId={`item-${index}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                sx={{
                                  backgroundColor: isAssetItem
                                    ? (theme) => theme.palette.mode === 'dark'
                                      ? 'rgba(144, 202, 249, 0.1)'
                                      : 'rgba(33, 150, 243, 0.05)'
                                    : snapshot.isDragging
                                      ? 'rgba(63, 81, 181, 0.08)'
                                      : 'inherit',
                                  '&:hover .drag-handle': {
                                    opacity: 1,
                                  },
                                  // Add styling to ensure the dragged item remains visible
                                  ...(snapshot.isDragging && {
                                    borderRadius: '4px',
                                    outline: '1px solid #aaa',
                                  })
                                }}
                              >
                                <TableCell>
                                  <Box
                                    {...provided.dragHandleProps}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <DragIndicator
                                      className="drag-handle"
                                      sx={{
                                        cursor: 'grab',
                                        opacity: 0.3,
                                        transition: 'opacity 0.2s'
                                      }}
                                    />
                                  </Box>
                                </TableCell>

                                {/* ...existing table cell content... */}
                                <TableCell>
                                  {isAssetItem
                                    ? (item.assetInfo?.name || 'Unnamed Asset')
                                    : (itemDetails ? itemDetails.name : 'Unknown Item')
                                  }
                                </TableCell>

                                <TableCell>
                                  {isAssetItem
                                    ? <Chip size="small" icon={<BusinessCenter fontSize="small" />} label="Asset" variant="outlined" color="primary" />
                                    : <Chip size="small" icon={<Inventory fontSize="small" />} label="Inventory" variant="outlined" color="secondary" />
                                  }
                                </TableCell>

                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={
                                      item.purchasedBy === 'weight' ? item.weight :
                                        item.purchasedBy === 'length' ? item.length :
                                          item.purchasedBy === 'area' ? item.area :
                                            item.purchasedBy === 'volume' ? item.volume :
                                              item.quantity
                                    }
                                    onChange={(e) => handleItemQuantityChange(index, parseFloat(e.target.value) || 0)}
                                    InputProps={{
                                      endAdornment: <InputAdornment position="end">
                                        {item.purchasedBy === 'weight' ? item.weightUnit :
                                          item.purchasedBy === 'length' ? item.lengthUnit :
                                            item.purchasedBy === 'area' ? item.areaUnit :
                                              item.purchasedBy === 'volume' ? item.volumeUnit : ''}
                                      </InputAdornment>,
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={item.originalCost || 0}
                                    onChange={(e) => handleItemOriginalCostChange(index, parseFloat(e.target.value) || 0)}
                                    InputProps={{
                                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{formatCurrency(item.costPerUnit)}</TableCell>
                                <TableCell>
                                  <Grid container spacing={1} alignItems="center">
                                    <Grid size={{ xs: 6 }}>
                                      <TextField
                                        size="small"
                                        type="number"
                                        value={item.discountPercentage || 0}
                                        onChange={(e) => handleItemDiscountChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                                        InputProps={{
                                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        }}
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                      <TextField
                                        size="small"
                                        type="number"
                                        value={item.discountAmount || 0}
                                        onChange={(e) => handleItemDiscountChange(index, 'amount', parseFloat(e.target.value) || 0)}
                                        InputProps={{
                                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                        }}
                                      />
                                    </Grid>
                                  </Grid>
                                </TableCell>
                                <TableCell align="right">{formatCurrency(item.totalCost)}</TableCell>
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

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
          </Grid>
          <Grid size={{ xs: 12 }}>
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
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Purchase Summary</Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
          </Grid>
        </Grid>
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

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
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
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
            </Grid>

            {newItem.trackingType === 'weight' ? (
              <Grid size={{ xs: 12, md: 6 }}>
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
              </Grid>
            ) : newItem.trackingType === 'length' ? (
              <Grid size={{ xs: 12, md: 6 }}>
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
              </Grid>
            ) : newItem.trackingType === 'area' ? (
              <Grid size={{ xs: 12, md: 6 }}>
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
              </Grid>
            ) : newItem.trackingType === 'volume' ? (
              <Grid size={{ xs: 12, md: 6 }}>
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
              </Grid>
            ) : null}

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={newItem.description}
                onChange={(e) => handleNewItemChange('description', e.target.value)}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
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

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
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
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Location"
                value={newAsset.location || ''}
                onChange={(e) => handleNewAssetChange('location', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={newAsset.notes || ''}
                onChange={(e) => handleNewAssetChange('notes', e.target.value)}
                margin="normal"
              />
            </Grid>
          </Grid>
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

    </Box>
  );
}
