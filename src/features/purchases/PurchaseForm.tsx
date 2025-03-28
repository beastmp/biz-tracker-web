import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
  AlertTitle,
  InputLabel,
  Select,
  SelectChangeEvent,
  FormHelperText,
} from '@mui/material';
import { Save, ArrowBack, Add, Delete, Image as ImageIcon, AddCircle } from '@mui/icons-material';
import { usePurchase, useCreatePurchase, useUpdatePurchase } from '@hooks/usePurchases';
import { useItems, useCreateItem, useNextSku, useCategories } from '@hooks/useItems';
import { Purchase, PurchaseItem, Item, WeightUnit, TrackingType, ItemType, LengthUnit, AreaUnit, VolumeUnit } from '@custTypes/models';
import { formatCurrency } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';

export default function PurchaseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Queries
  const { data: existingPurchase, isLoading: purchaseLoading, error: purchaseError } = usePurchase(id);
  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useItems();
  const { data: nextSku } = useNextSku();
  const { data: categories = [] } = useCategories();
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase(id);
  const createItem = useCreateItem();

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
    taxRate: 0,
    taxAmount: 0,
    shippingCost: 0,
    total: 0,
    paymentMethod: 'cash',
    status: 'received'
  });

  // Item selection state
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(0);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [length, setLength] = useState(0);
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>('in');
  const [area, setArea] = useState(0);
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('sqft');
  const [volume, setVolume] = useState(0);
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>('l');
  const [costPerUnit, setCostPerUnit] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [itemSelectDialogOpen, setItemSelectDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [newItemTotalPrice, setNewItemTotalPrice] = useState<number>(0);
  const [newItemUnitCost, setNewItemUnitCost] = useState<number>(0);

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

  // Update total costs whenever items, tax, or shipping change
  useEffect(() => {
    const subtotal = purchase.items.reduce(
      (sum, item) => sum + item.totalCost,
      0
    );

    const taxAmount = subtotal * ((purchase.taxRate || 0) / 100);
    const shippingCost = purchase.shippingCost || 0;
    const total = subtotal + taxAmount + shippingCost;

    setPurchase(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total
    }));
  }, [purchase.items, purchase.taxRate, purchase.shippingCost]);

  // Update total cost when quantity, costPerUnit or weight changes
  useEffect(() => {
    if (selectedItem) {
      switch (selectedItem.trackingType) {
        case 'weight':
          setTotalCost(weight * costPerUnit);
          break;
        case 'length':
          setTotalCost(length * costPerUnit);
          break;
        case 'area':
          setTotalCost(area * costPerUnit);
          break;
        case 'volume':
          setTotalCost(volume * costPerUnit);
          break;
        default: // quantity
          setTotalCost(quantity * costPerUnit);
      }
    }
  }, [quantity, costPerUnit, weight, length, area, volume, selectedItem]);

  // Add new effect to calculate cost per unit when total cost or quantity changes
  useEffect(() => {
    if (selectedItem) {
      switch (selectedItem.trackingType) {
        case 'weight':
          if (weight > 0) setCostPerUnit(totalCost / weight);
          break;
        case 'length':
          if (length > 0) setCostPerUnit(totalCost / length);
          break;
        case 'area':
          if (area > 0) setCostPerUnit(totalCost / area);
          break;
        case 'volume':
          if (volume > 0) setCostPerUnit(totalCost / volume);
          break;
        default: // quantity
          if (quantity > 0) setCostPerUnit(totalCost / quantity);
      }
    }
  }, [totalCost, quantity, weight, length, area, volume, selectedItem]);

  // Add effect to calculate unit cost when total price or quantity changes
  useEffect(() => {
    if (newItem.trackingType === 'quantity' && newItem.quantity && newItem.quantity > 0) {
      setNewItemUnitCost(newItemTotalPrice / newItem.quantity);
    } else if (newItem.trackingType === 'weight' && newItem.weight && newItem.weight > 0) {
      setNewItemUnitCost(newItemTotalPrice / newItem.weight);
    } else {
      setNewItemUnitCost(0);
    }
  }, [newItemTotalPrice, newItem.quantity, newItem.weight, newItem.trackingType]);

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

  const handleAddItem = () => {
    if (!selectedItem) return;

    const newItem: PurchaseItem = {
      item: selectedItem._id || '',
      costPerUnit,
      totalCost,
      // Add required properties with defaults
      quantity: 0,
      weight: 0,
      length: 0,
      area: 0,
      volume: 0,
      purchasedBy: 'quantity' // Default tracking type
    };

    // Add appropriate measurement fields based on tracking type
    switch (selectedItem.trackingType) {
      case 'weight':
        newItem.weight = weight;
        newItem.weightUnit = weightUnit;
        newItem.purchasedBy = 'weight';
        break;
      case 'length':
        newItem.length = length;
        newItem.lengthUnit = lengthUnit;
        newItem.purchasedBy = 'length';
        break;
      case 'area':
        newItem.area = area;
        newItem.areaUnit = areaUnit;
        newItem.purchasedBy = 'area';
        break;
      case 'volume':
        newItem.volume = volume;
        newItem.volumeUnit = volumeUnit;
        newItem.purchasedBy = 'volume';
        break;
      default: // quantity
        newItem.quantity = quantity;
        newItem.purchasedBy = 'quantity';
    }

    setPurchase({
      ...purchase,
      items: [...purchase.items, newItem]
    });

    // Reset form values
    setSelectedItem(null);
    setQuantity(1);
    setWeight(0);
    setLength(0);
    setArea(0);
    setVolume(0);
    setCostPerUnit(0);
    setTotalCost(0);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...purchase.items];
    updatedItems.splice(index, 1);
    setPurchase({
      ...purchase,
      items: updatedItems
    });
  };

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    setCostPerUnit(item.price);
    setItemSelectDialogOpen(false);
  };

  // New item handlers
  const handleNewItemChange = (field: string, value: any) => {
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

    switch (newItem.trackingType) {
      case 'quantity':
        if (!newItem.quantity || newItem.quantity < 0) {
          errors.quantity = 'Valid quantity is required';
        }
        break;
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
      // Set price from costPerUnit for the new item
      const itemWithCost = {
        ...newItem,
        cost: newItemUnitCost || 0,
        price: newItem.price || 0 // Use the entered sale price
      };

      const createdItem = await createItem.mutateAsync(itemWithCost as Item);

      // Automatically select the new item
      setSelectedItem(createdItem);

      // Transfer the purchase values to the form
      setCostPerUnit(newItemUnitCost);
      setTotalCost(newItemTotalPrice);

      // Set quantity or weight based on tracking type
      if (createdItem.trackingType === 'weight') {
        setWeight(createdItem.weight || 0);
        setWeightUnit(createdItem.weightUnit || 'lb');
      } else {
        setQuantity(createdItem.quantity || 1);
      }

      // Close the create dialog
      setCreateItemDialogOpen(false);
      setItemSelectDialogOpen(false);

      // Reset new item form
      setNewItem({
        name: '',
        sku: nextSku || '',
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

      setNewItemTotalPrice(0);
      setNewItemUnitCost(0);

    } catch (error) {
      console.error('Failed to create item:', error);
      setError('Failed to create new item. Please try again.');
    }
  };

  const validateForm = (): string | null => {
    if (!purchase.supplier.name) return 'Supplier name is required';
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

    try {
      if (isEditMode) {
        await updatePurchase.mutateAsync(purchase);
      } else {
        await createPurchase.mutateAsync(purchase);
      }
      navigate('/purchases');
    } catch (error) {
      console.error('Failed to save purchase:', error);
      setError('Failed to save purchase. Please try again.');
    }
  };

  if (purchaseLoading || itemsLoading) {
    return <LoadingScreen />;
  }

  if (purchaseError || itemsError) {
    return <ErrorFallback error={(purchaseError || itemsError) as Error} message="Failed to load data" />;
  }

  // Create a lookup object for items for efficient access
  const itemLookup = Object.fromEntries((items || []).map(item => [item._id, item]));

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
          <Grid2 size= {{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Supplier Name"
              value={purchase.supplier.name || ''}
              onChange={(e) => handleTextChange('supplier.name', e.target.value)}
              margin="normal"
              required
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid2>
          <Grid2 size= {{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Contact Name"
              value={purchase.supplier.contactName || ''}
              onChange={(e) => handleTextChange('supplier.contactName', e.target.value)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid2>
          <Grid2 size= {{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={purchase.supplier.email || ''}
              onChange={(e) => handleTextChange('supplier.email', e.target.value)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid2>
          <Grid2 size= {{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Phone"
              value={purchase.supplier.phone || ''}
              onChange={(e) => handleTextChange('supplier.phone', e.target.value)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid2>
          <Grid2 size= {{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Invoice Number"
              value={purchase.invoiceNumber || ''}
              onChange={(e) => handleTextChange('invoiceNumber', e.target.value)}
              margin="normal"
              disabled={createPurchase.isPending || updatePurchase.isPending}
            />
          </Grid2>
          <Grid2 size= {{ xs: 12, md: 6 }}>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <Typography variant="h6">Purchase Items</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setItemSelectDialogOpen(true)}
            disabled={createPurchase.isPending || updatePurchase.isPending}
          >
            Add Item
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {selectedItem && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedItem.name} - {formatCurrency(selectedItem.price)}
            </Typography>

            <Grid2 container spacing={2} alignItems="center">
              {selectedItem.trackingType === 'quantity' && (
                <Grid2 size={{ xs: 4 }}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value) || 0;
                      setQuantity(newQuantity);
                    }}
                    disabled={createPurchase.isPending || updatePurchase.isPending}
                  />
                </Grid2>
              )}

              {selectedItem.trackingType === 'weight' && (
                <Grid2 size={{ xs: 4 }}>
                  <TextField
                    fullWidth
                    label="Weight"
                    type="number"
                    value={weight}
                    onChange={(e) => {
                      const newWeight = parseFloat(e.target.value) || 0;
                      setWeight(newWeight);
                    }}
                    disabled={createPurchase.isPending || updatePurchase.isPending}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Select
                            value={weightUnit}
                            onChange={(e) => setWeightUnit(e.target.value as WeightUnit)}
                            size="small"
                            disabled={createPurchase.isPending || updatePurchase.isPending}
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
              )}

              {selectedItem.trackingType === 'length' && (
                <Grid2 size={{ xs: 4 }}>
                  <TextField
                    fullWidth
                    label="Length"
                    type="number"
                    value={length}
                    onChange={(e) => {
                      const newLength = parseFloat(e.target.value) || 0;
                      setLength(newLength);
                    }}
                    disabled={createPurchase.isPending || updatePurchase.isPending}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Select
                            value={lengthUnit}
                            onChange={(e) => setLengthUnit(e.target.value as LengthUnit)}
                            size="small"
                            disabled={createPurchase.isPending || updatePurchase.isPending}
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
              )}

              {selectedItem.trackingType === 'area' && (
                <Grid2 size={{ xs: 4 }}>
                  <TextField
                    fullWidth
                    label="Area"
                    type="number"
                    value={area}
                    onChange={(e) => {
                      const newArea = parseFloat(e.target.value) || 0;
                      setArea(newArea);
                    }}
                    disabled={createPurchase.isPending || updatePurchase.isPending}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Select
                            value={areaUnit}
                            onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                            size="small"
                            disabled={createPurchase.isPending || updatePurchase.isPending}
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
              )}

              {selectedItem.trackingType === 'volume' && (
                <Grid2 size={{ xs: 4 }}>
                  <TextField
                    fullWidth
                    label="Volume"
                    type="number"
                    value={volume}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value) || 0;
                      setVolume(newVolume);
                    }}
                    disabled={createPurchase.isPending || updatePurchase.isPending}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Select
                            value={volumeUnit}
                            onChange={(e) => setVolumeUnit(e.target.value as VolumeUnit)}
                            size="small"
                            disabled={createPurchase.isPending || updatePurchase.isPending}
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
              )}

              <Grid2 size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  label="Total Cost"
                  type="number"
                  value={totalCost}
                  onChange={(e) => {
                    const newTotalCost = parseFloat(e.target.value) || 0;
                    setTotalCost(newTotalCost);
                  }}
                  disabled={createPurchase.isPending || updatePurchase.isPending}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid2>

              <Grid2 size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  label="Cost Per Unit"
                  type="number"
                  value={costPerUnit}
                  disabled={true}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    endAdornment: <InputAdornment position="end">
                      {selectedItem.trackingType === 'weight' ? `/${weightUnit}` :
                       selectedItem.trackingType === 'length' ? `/${lengthUnit}` :
                       selectedItem.trackingType === 'area' ? `/${areaUnit}` :
                       selectedItem.trackingType === 'volume' ? `/${volumeUnit}` : ''}
                    </InputAdornment>
                  }}
                />
              </Grid2>
            </Grid2>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleAddItem}
                disabled={createPurchase.isPending || updatePurchase.isPending}
              >
                Add to Purchase
              </Button>
            </Box>
          </Paper>
        )}

        {purchase.items.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Quantity/Weight</TableCell>
                  <TableCell>Cost Per Unit</TableCell>
                  <TableCell align="right">Total Cost</TableCell>
                  <TableCell width={80}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchase.items.map((item, index) => {
                  const itemDetails = typeof item.item === 'object' ? item.item : itemLookup[item.item as string];
                  return (
                    <TableRow key={index}>
                      <TableCell>{itemDetails ? itemDetails.name : 'Unknown Item'}</TableCell>
                      <TableCell>
                        {item.purchasedBy === 'weight' ? `${item.weight} ${item.weightUnit}` :
                         item.purchasedBy === 'length' ? `${item.length} ${item.lengthUnit}` :
                         item.purchasedBy === 'area' ? `${item.area} ${item.areaUnit}` :
                         item.purchasedBy === 'volume' ? `${item.volume} ${item.volumeUnit}` :
                         item.quantity}
                      </TableCell>
                      <TableCell>{formatCurrency(item.costPerUnit)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.totalCost)}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                          disabled={createPurchase.isPending || updatePurchase.isPending}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">No items added yet. Use the "Add Item" button to add inventory items to this purchase.</Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Payment Details</Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid2 container spacing={2}>
          <Grid2 size= {{ xs: 12, md: 6 }}>
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
          <Grid2 size= {{ xs: 12, md: 6 }}>
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
          <Grid2 size= {{ xs: 12 }}>
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
          <Grid2 size= {{ xs: 12, md: 6 }}>
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
          <Grid2 size= {{ xs: 12, md: 6 }}>
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
          <Grid2 size= {{ xs: 12, md: 6 }}>
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
          <Grid2 size= {{ xs: 12, md: 6 }}>
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
          <Grid2 size= {{ xs: 12, md: 6 }}>
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
            <Typography variant="h6">Select Item</Typography>
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
        </DialogTitle>
        <DialogContent>
          <List>
            {items.map((item) => (
              <ListItemButton
                key={item._id}
                onClick={() => handleItemSelect(item)}
                divider
              >
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
          {selectedItem && (selectedItem.itemType === 'material' || selectedItem.itemType === 'both') &&
            selectedItem.packInfo?.isPack && (
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              <AlertTitle>Pack Information</AlertTitle>
              <Typography variant="body2">
                This material is purchased in packs of <strong>{selectedItem.packInfo.unitsPerPack}</strong> units.
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Ordering <strong>{quantity}</strong> packs will add <strong>{quantity * selectedItem.packInfo.unitsPerPack}</strong> individual units to inventory.
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Pack cost: {formatCurrency(selectedItem.packInfo.costPerUnit * selectedItem.packInfo.unitsPerPack)} |
                  Cost per unit: {formatCurrency(selectedItem.packInfo.costPerUnit)}
                </Typography>
              </Box>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemSelectDialogOpen(false)} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create New Item Dialog */}
      <Dialog
        open={createItemDialogOpen}
        onClose={() => setCreateItemDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Item</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Creating a new item will add it to your inventory and automatically add it to this purchase.
            Enter the total purchase price and quantity to automatically calculate the price per unit.
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
              <FormControl fullWidth margin="normal" required error={!!newItemErrors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newItem.category}
                  label="Category"
                  onChange={(e) => handleNewItemChange('category', e.target.value)}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                  <MenuItem value="new">
                    <em>+ Add New Category</em>
                  </MenuItem>
                </Select>
                {newItemErrors.category && <FormHelperText>{newItemErrors.category}</FormHelperText>}
              </FormControl>
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

            {newItem.trackingType === 'quantity' ? (
              <Grid2 size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => handleNewItemChange('quantity', parseFloat(e.target.value) || 0)}
                  margin="normal"
                  required
                  error={!!newItemErrors.quantity}
                  helperText={newItemErrors.quantity}
                />
              </Grid2>
            ) : newItem.trackingType === 'weight' ? (
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
            ) : (
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
            )}

            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Total Purchase Price"
                type="number"
                value={newItemTotalPrice}
                onChange={(e) => setNewItemTotalPrice(parseFloat(e.target.value) || 0)}
                margin="normal"
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid2>

            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Price Per Unit"
                type="number"
                value={newItemUnitCost}
                disabled
                margin="normal"
                InputProps={{
                  readOnly: true,
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  endAdornment: <InputAdornment position="end">per unit</InputAdornment>
                }}
              />
            </Grid2>

            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Sale Price"
                type="number"
                value={newItem.price}
                onChange={(e) => handleNewItemChange('price', parseFloat(e.target.value) || 0)}
                margin="normal"
                helperText="Set the retail selling price for this item"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid2>

            <Grid2 size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Price Type</InputLabel>
                <Select
                  value={newItem.priceType}
                  label="Price Type"
                  onChange={(e) => handleNewItemChange('priceType', e.target.value)}
                >
                  <MenuItem value="each">Price per Item</MenuItem>
                  {newItem.trackingType === 'weight' && (
                    <MenuItem value="per_weight_unit">Price per {newItem.weightUnit}</MenuItem>
                  )}
                  {newItem.trackingType === 'length' && (
                    <MenuItem value="per_length_unit">Price per {newItem.lengthUnit}</MenuItem>
                  )}
                  {newItem.trackingType === 'area' && (
                    <MenuItem value="per_area_unit">Price per {newItem.areaUnit}</MenuItem>
                  )}
                  {newItem.trackingType === 'volume' && (
                    <MenuItem value="per_volume_unit">Price per {newItem.volumeUnit}</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid2>

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
            {createItem.isPending ? 'Creating...' : 'Create & Add to Purchase'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
