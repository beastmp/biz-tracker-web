import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  TableFooter,
  Divider,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemText,
  List,
  ListItemAvatar,
  ListItemButton,
  Avatar,
  Chip,
  FormControlLabel,
  Switch,
  Slider,
  Checkbox
} from '@mui/material';
import { Save, ArrowBack, Add, Delete, Image as ImageIcon, Construction, DeleteOutline, Search, Category } from '@mui/icons-material';
import { useSale, useCreateSale, useUpdateSale } from '@hooks/useSales';
import { useItems, useCreateItem } from '@hooks/useItems';
import { Sale, SaleItem, Item, WeightUnit, LengthUnit, AreaUnit, VolumeUnit } from '@custTypes/models';
import { formatCurrency } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';

export default function SaleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Queries
  const { data: existingSale, isLoading: saleLoading } = useSale(id);
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const createSale = useCreateSale();
  const updateSale = useUpdateSale(id);
  const createItem = useCreateItem();

  // Form state
  const [formData, setFormData] = useState<Partial<Sale>>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    items: [],
    subtotal: 0,
    taxRate: 7.5, // Default tax rate
    taxAmount: 0,
    discountAmount: 0,
    total: 0,
    paymentMethod: 'cash',
    notes: '',
    status: 'completed'
  });

  // Item selection state
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<string>('1');
  const [selectedWeight, setSelectedWeight] = useState<string>('1');
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [useAutoMarkup, setUseAutoMarkup] = useState(true);
  const [markupPercentage, setMarkupPercentage] = useState(50); // Default 50% markup
  const [selectedItemPrice, setSelectedItemPrice] = useState<string>('');

  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<Array<{
    material: Item;
    quantity: number;
    totalCost: number;
  }>>([]);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [newProductMarkup, setNewProductMarkup] = useState(50); // Default 50% markup
  const [categories] = useState<string[]>(() =>
    Array.from(new Set(items.map(item => item.category).filter(Boolean)))
  );

  const [isManualPrice, setIsManualPrice] = useState<boolean>(false);
  const [finalPrice, setFinalPrice] = useState<number>(0);

  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [materialQuantities, setMaterialQuantities] = useState<Record<string, string>>({});

  const calculateMaterialsCost = useCallback(() => {
    return selectedMaterials.reduce((sum, { totalCost }) => sum + totalCost, 0);
  }, [selectedMaterials]);

  const calculateProductPrice = useCallback(() => {
    const materialsCost = calculateMaterialsCost();
    return isManualPrice ? finalPrice : materialsCost * (1 + newProductMarkup / 100);
  }, [calculateMaterialsCost, newProductMarkup, isManualPrice, finalPrice]);

  const generateProductSku = useCallback(() => {
    const prefix = 'PROD';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  }, []);

  useEffect(() => {
    if (createProductDialogOpen) {
      setNewProductSku(generateProductSku());
    }
  }, [createProductDialogOpen, generateProductSku]);

  const filteredMaterials = useMemo(() => {
    return items
      .filter(item => item.itemType === 'material' || item.itemType === 'both')
      .filter(item =>
        item.name.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(materialSearchQuery.toLowerCase())
      );
  }, [items, materialSearchQuery]);

  // Load existing sale data if in edit mode
  useEffect(() => {
    if (isEditMode && existingSale) {
      setFormData(existingSale);
    }
  }, [isEditMode, existingSale]);

  // Recalculate totals when items, tax rate, or discount change
  useEffect(() => {
    if (!formData.items || formData.items.length === 0) {
      setFormData(prev => ({
        ...prev,
        subtotal: 0,
        taxAmount: 0,
        total: 0
      }));
      return;
    }

    const subtotal = formData.items.reduce((sum, item) => {
      let itemTotal = 0;

      switch (item.soldBy) {
        case 'quantity':
          itemTotal = item.quantity * item.priceAtSale;
          break;
        case 'weight':
          itemTotal = item.weight * item.priceAtSale;
          break;
        case 'length':
          itemTotal = item.length * item.priceAtSale;
          break;
        case 'area':
          itemTotal = item.area * item.priceAtSale;
          break;
        case 'volume':
          itemTotal = item.volume * item.priceAtSale;
          break;
        default:
          itemTotal = item.quantity * item.priceAtSale;
      }

      return sum + itemTotal;
    }, 0);

    const taxAmount = subtotal * ((formData.taxRate || 0) / 100);
    const total = subtotal + taxAmount - (formData.discountAmount || 0);

    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total
    }));
  }, [formData.items, formData.taxRate, formData.discountAmount]);

  useEffect(() => {
    if (isManualPrice) {
      // Keep current price if already set
      return;
    }
    // Otherwise set default price based on materials cost and markup
    const materialsCost = calculateMaterialsCost();
    setFinalPrice(materialsCost * (1 + newProductMarkup / 100));
  }, [calculateMaterialsCost, newProductMarkup, selectedMaterials, isManualPrice]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'taxRate' || name === 'discountAmount') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const [selectedLength, setSelectedLength] = useState<string>('0');
  const [selectedArea, setSelectedArea] = useState<string>('0');
  const [selectedVolume, setSelectedVolume] = useState<string>('0');
  const [selectedWeightUnit, setSelectedWeightUnit] = useState<WeightUnit>('lb');
  const [selectedLengthUnit, setSelectedLengthUnit] = useState<LengthUnit>('in');
  const [selectedAreaUnit, setSelectedAreaUnit] = useState<AreaUnit>('sqft');
  const [selectedVolumeUnit, setSelectedVolumeUnit] = useState<VolumeUnit>('l');

  const handleAddItem = () => {
    if (!selectedItem) return;

    // Get the measurement type - default to the item's tracking type or use sellByMeasurement if specified
    const measurementType = selectedItem.sellByMeasurement || selectedItem.trackingType || 'quantity';

    try {
      let newItem: SaleItem;

      switch (measurementType) {
        case 'quantity': {
          // Check if quantity is valid
          const quantity = parseInt(selectedQuantity);
          if (isNaN(quantity) || quantity <= 0 || quantity > selectedItem.quantity) {
            setError(`Please enter a valid quantity between 1 and ${selectedItem.quantity}`);
            return;
          }

          newItem = {
            item: selectedItem._id || '',
            name: selectedItem.name,
            quantity,
            weight: 0,
            length: 0,
            area: 0,
            volume: 0,
            priceAtSale: calculateItemPrice(selectedItem, quantity, 0, 0, 0, 0),
            soldBy: 'quantity'
          };
          break;
        }

        case 'weight': {
          // Check if weight is valid
          const weight = parseFloat(selectedWeight);
          if (isNaN(weight) || weight <= 0 || weight > selectedItem.weight) {
            setError(`Please enter a valid weight between 0.1 and ${selectedItem.weight} ${selectedItem.weightUnit}`);
            return;
          }

          newItem = {
            item: selectedItem._id || '',
            name: selectedItem.name,
            quantity: 0,
            weight,
            weightUnit: selectedWeightUnit || selectedItem.weightUnit,
            length: 0,
            area: 0,
            volume: 0,
            priceAtSale: calculateItemPrice(selectedItem, 0, weight, 0, 0, 0),
            soldBy: 'weight'
          };
          break;
        }

        case 'length': {
          // Check if length is valid
          const length = parseFloat(selectedLength);
          if (isNaN(length) || length <= 0 || length > selectedItem.length) {
            setError(`Please enter a valid length between 0.1 and ${selectedItem.length} ${selectedItem.lengthUnit}`);
            return;
          }

          newItem = {
            item: selectedItem._id || '',
            name: selectedItem.name,
            quantity: 0,
            weight: 0,
            length,
            lengthUnit: selectedLengthUnit || selectedItem.lengthUnit,
            area: 0,
            volume: 0,
            priceAtSale: calculateItemPrice(selectedItem, 0, 0, length, 0, 0),
            soldBy: 'length'
          };
          break;
        }

        case 'area': {
          // Check if area is valid
          const area = parseFloat(selectedArea);
          if (isNaN(area) || area <= 0 || area > selectedItem.area) {
            setError(`Please enter a valid area between 0.1 and ${selectedItem.area} ${selectedItem.areaUnit}`);
            return;
          }

          newItem = {
            item: selectedItem._id || '',
            name: selectedItem.name,
            quantity: 0,
            weight: 0,
            length: 0,
            area,
            areaUnit: selectedAreaUnit || selectedItem.areaUnit,
            volume: 0,
            priceAtSale: calculateItemPrice(selectedItem, 0, 0, 0, area, 0),
            soldBy: 'area'
          };
          break;
        }

        case 'volume': {
          // Check if volume is valid
          const volume = parseFloat(selectedVolume);
          if (isNaN(volume) || volume <= 0 || volume > selectedItem.volume) {
            setError(`Please enter a valid volume between .1 and ${selectedItem.volume} ${selectedItem.volumeUnit}`);
            return;
          }

          newItem = {
            item: selectedItem._id || '',
            name: selectedItem.name,
            quantity: 0,
            weight: 0,
            length: 0,
            area: 0,
            volume,
            volumeUnit: selectedVolumeUnit || selectedItem.volumeUnit,
            priceAtSale: calculateItemPrice(selectedItem, 0, 0, 0, 0, volume),
            soldBy: 'volume'
          };
          break;
        }

        default:
          setError(`Unsupported measurement type: ${measurementType}`);
          return;
      }

      setFormData(prev => ({
        ...prev,
        items: [...(prev.items || []), newItem]
      }));

      // Reset selection state
      setSelectedItem(null);
      setSelectedQuantity('1');
      setSelectedWeight('0');
      setSelectedLength('0');
      setSelectedArea('0');
      setSelectedVolume('0');
      setError(null);
    } catch (error) {
      console.error('Error adding item:', error);
      setError('Failed to add item. Please try again.');
    }
  };

  // Helper function to calculate price based on measurement type
  const calculateItemPrice = (
    item: Item,
    quantity: number,
    weight: number,
    length: number,
    area: number,
    volume: number
  ): number => {
    if (!item) return 0;

    const basePrice = parseFloat(selectedItemPrice) || item.price || 0;

    switch (item.priceType) {
      case 'each':
        return quantity > 0 ? basePrice * quantity : basePrice;
      case 'per_weight_unit':
        return weight > 0 ? basePrice * weight : basePrice;
      case 'per_length_unit':
        return length > 0 ? basePrice * length : basePrice;
      case 'per_area_unit':
        return area > 0 ? basePrice * area : basePrice;
      case 'per_volume_unit':
        return volume > 0 ? basePrice * volume : basePrice;
      default:
        return basePrice;
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    if (item.trackingType === 'weight') {
      setSelectedWeight('1'); // Default weight
    } else {
      setSelectedQuantity('1'); // Default quantity
    }
  };

  useEffect(() => {
    if (selectedItem && useAutoMarkup) {
      const basePrice = selectedItem.price;
      const cost = selectedItem.cost || 0;

      if (cost > 0) {
        // Calculate price with markup
        const markupPrice = cost * (1 + markupPercentage / 100);

        // Only change if markup price is higher than existing price
        if (markupPrice > basePrice) {
          // Update the price shown in the dialog
          setSelectedItemPrice(markupPrice.toFixed(2));
        } else {
          setSelectedItemPrice(basePrice.toFixed(2));
        }
      }
    }
  }, [selectedItem, useAutoMarkup, markupPercentage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.items?.length) {
      setError('Please add at least one item to the sale');
      return;
    }

    setError(null);

    try {
      const saleData = formData as Sale;

      if (isEditMode) {
        await updateSale.mutateAsync(saleData);
      } else {
        await createSale.mutateAsync(saleData);
      }
      navigate('/sales');
    } catch (error) {
      console.error('Failed to save sale:', error);
      setError('Failed to save sale. Please try again.');
    }
  };

  if (saleLoading || itemsLoading) {
    return <LoadingScreen />;
  }

  // Remove a material from the new product
  const handleRemoveMaterial = (index: number) => {
    setSelectedMaterials(prev => prev.filter((_, i) => i !== index));
  };

  // Create the new product and add to sale
  const handleCreateProduct = async () => {
    if (!newProductName) {
      setError("Product name is required");
      return;
    }

    if (selectedMaterials.length === 0) {
      setError("At least one material is required");
      return;
    }

    try {
      // Create new product
      const materialsCost = calculateMaterialsCost();
      const productPrice = calculateProductPrice();

      const newProduct: Partial<Item> = {
        name: newProductName,
        sku: newProductSku,
        category: newProductCategory,
        description: newProductDescription,
        trackingType: 'quantity',
        sellByMeasurement: 'quantity', // Add this missing property
        quantity: 1, // Start with one item
        weight: 0,
        weightUnit: 'lb',
        price: productPrice, // This now handles both pricing modes
        priceType: 'each',
        itemType: 'product',
        cost: materialsCost,
        components: selectedMaterials.map(({ material, quantity }) => ({
          item: material._id || '',
          quantity
        }))
      };

      // Create the product via API
      const createdProduct = await createItem.mutateAsync(newProduct as Item);

      // Add the new product to the sale
      const newSaleItem: SaleItem = {
        item: createdProduct._id || '',
        name: createdProduct.name,  // Add name for display
        quantity: 1,
        weight: 0,
        length: 0,
        area: 0,
        volume: 0,
        priceAtSale: productPrice,
        soldBy: 'quantity'
      };

      setFormData(prev => ({
        ...prev,
        items: [...(prev.items || []), newSaleItem]
      }));

      // Reset and close dialog
      setNewProductName('');
      setNewProductSku('');
      setNewProductCategory('');
      setNewProductDescription('');
      setSelectedMaterials([]);
      setNewProductMarkup(50);
      setCreateProductDialogOpen(false);
      setError(null);
    } catch (err) {
      console.error('Failed to create product:', err);
      setError('Failed to create product. Please try again.');
    }
  };

  const handleAddMultipleMaterials = () => {
    const newMaterials = selectedMaterialIds.map(id => {
      const material = items.find(item => item._id === id);
      if (!material) return null;

      const quantity = parseInt(materialQuantities[id]) || 1;
      const unitCost = material.cost || material.price;
      const totalCost = unitCost * quantity;

      return { material, quantity, totalCost };
    }).filter(Boolean) as Array<{ material: Item; quantity: number; totalCost: number }>;

    setSelectedMaterials(prev => [...prev, ...newMaterials]);
    setSelectedMaterialIds([]);
    setMaterialQuantities({});
    setMaterialDialogOpen(false);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Sale' : 'New Sale'}
        </Typography>
        <Button
          startIcon={<ArrowBack />}
          component="a"
          href="/sales"
          onClick={(e) => {
            e.preventDefault();
            navigate('/sales');
          }}
        >
          Back to Sales
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Form content (identical to original) */}
      <Grid2 container spacing={3}>
        <Grid2 size= {{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid2 container spacing={2}>
              <Grid2 size= {{ xs: 12, sm: 12 }}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  name="customerName"
                  value={formData.customerName || ''}
                  onChange={handleInputChange}
                  disabled={createSale.isPending || updateSale.isPending}
                  placeholder="Optional"
                />
              </Grid2>
              <Grid2 size= {{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="customerEmail"
                  value={formData.customerEmail || ''}
                  onChange={handleInputChange}
                  disabled={createSale.isPending || updateSale.isPending}
                  placeholder="Optional"
                />
              </Grid2>
              <Grid2 size= {{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="customerPhone"
                  value={formData.customerPhone || ''}
                  onChange={handleInputChange}
                  disabled={createSale.isPending || updateSale.isPending}
                  placeholder="Optional"
                />
              </Grid2>
            </Grid2>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Sale Items
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={() => setItemDialogOpen(true)}
                disabled={createSale.isPending || updateSale.isPending || items.length === 0}
              >
                Add Item
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                color="primary"
                onClick={() => setItemDialogOpen(true)}
                disabled={createSale.isPending || updateSale.isPending}
                sx={{ mr: 1 }}
              >
                Add Item
              </Button>

              <Button
                variant="contained"
                startIcon={<Construction />}
                color="secondary"
                onClick={() => setCreateProductDialogOpen(true)}
                disabled={createSale.isPending || updateSale.isPending}
              >
                Create Product
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {formData.items && formData.items.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity/Amount</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{typeof item.item === 'string' ? item.name : item.item.name}</TableCell>
                        <TableCell align="right">
                          {item.soldBy === 'quantity' && `${item.quantity}`}
                          {item.soldBy === 'weight' && `${item.weight} ${item.weightUnit}`}
                          {item.soldBy === 'length' && `${item.length} ${item.lengthUnit}`}
                          {item.soldBy === 'area' && `${item.area} ${item.areaUnit}`}
                          {item.soldBy === 'volume' && `${item.volume} ${item.volumeUnit}`}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(item.priceAtSale)}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(
                            item.soldBy === 'quantity'
                              ? item.priceAtSale * item.quantity
                              : item.soldBy === 'weight'
                              ? item.priceAtSale * item.weight
                              : item.soldBy === 'length'
                              ? item.priceAtSale * item.length
                              : item.soldBy === 'area'
                              ? item.priceAtSale * item.area
                              : item.soldBy === 'volume'
                              ? item.priceAtSale * item.volume
                              : item.priceAtSale
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveItem(index)}
                            disabled={createSale.isPending || updateSale.isPending}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No items added yet. Click "Add Item" to add items to this sale.
                </Typography>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payment Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid2 container spacing={2}>
              <Grid2 size= {{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    name="paymentMethod"
                    value={formData.paymentMethod || 'cash'}
                    label="Payment Method"
                    onChange={handleSelectChange}
                    disabled={createSale.isPending || updateSale.isPending}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="credit">Credit Card</MenuItem>
                    <MenuItem value="debit">Debit Card</MenuItem>
                    <MenuItem value="check">Check</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid2>
              <Grid2 size= {{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status || 'completed'}
                    label="Status"
                    onChange={handleSelectChange}
                    disabled={createSale.isPending || updateSale.isPending}
                  >
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="refunded">Refunded</MenuItem>
                    <MenuItem value="partially_refunded">Partially Refunded</MenuItem>
                  </Select>
                </FormControl>
              </Grid2>
              <Grid2 size= {{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  disabled={createSale.isPending || updateSale.isPending}
                  placeholder="Optional notes about this sale"
                />
              </Grid2>
            </Grid2>
          </Paper>
        </Grid2>

        <Grid2 size= {{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Sale Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Grid2 container spacing={2}>
                <Grid2 size= {{ xs: 7 }}>
                  <Typography variant="body1">Subtotal:</Typography>
                </Grid2>
                <Grid2 size= {{ xs: 5 }}>
                  <Typography variant="body1" align="right">
                    {formatCurrency(formData.subtotal || 0)}
                  </Typography>
                </Grid2>

                <Grid2 size= {{ xs: 7 }} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ mr: 1 }}>Tax Rate:</Typography>
                  <TextField
                    size="small"
                    name="taxRate"
                    type="number"
                    value={formData.taxRate || 0}
                    onChange={handleInputChange}
                    disabled={createSale.isPending || updateSale.isPending}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      inputProps: { min: 0, max: 100, step: 0.1 }
                    }}
                    sx={{ width: 80 }}
                  />
                </Grid2>
                <Grid2 size= {{ xs: 5 }}>
                  <Typography variant="body1" align="right">
                    {formatCurrency(formData.taxAmount || 0)}
                  </Typography>
                </Grid2>

                <Grid2 size= {{ xs: 7 }} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ mr: 1 }}>Discount:</Typography>
                  <TextField
                    size="small"
                    name="discountAmount"
                    type="number"
                    value={formData.discountAmount || 0}
                    onChange={handleInputChange}
                    disabled={createSale.isPending || updateSale.isPending}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                    sx={{ width: 100 }}
                  />
                </Grid2>
                <Grid2 size= {{ xs: 5 }}>
                  <Typography variant="body1" align="right" color="error">
                    -{formatCurrency(formData.discountAmount || 0)}
                  </Typography>
                </Grid2>
              </Grid2>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Grid2 container spacing={1}>
                <Grid2 size= {{ xs: 6 }}>
                  <Typography variant="h6">Total:</Typography>
                </Grid2>
                <Grid2 size= {{ xs: 6 }}>
                  <Typography variant="h6" align="right" color="primary">
                    {formatCurrency(formData.total || 0)}
                  </Typography>
                </Grid2>
              </Grid2>
            </Box>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Save />}
              onClick={handleSubmit}
              disabled={(createSale.isPending || updateSale.isPending) || !formData.items?.length}
            >
              {createSale.isPending || updateSale.isPending ? 'Saving...' : isEditMode ? 'Update Sale' : 'Complete Sale'}
            </Button>
          </Paper>
        </Grid2>
      </Grid2>

      {/* Item Selection Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Item</DialogTitle>
        <DialogContent>
          {items.length === 0 ? (
            <Typography>No items available in inventory</Typography>
          ) : selectedItem ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>{selectedItem.name}</Typography>
              <Grid2 container spacing={2}>
                <Grid2 size= {{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">
                    SKU: {selectedItem.sku} | Category: {selectedItem.category}
                  </Typography>
                </Grid2>
                <Grid2 size= {{ xs: 12 }}>
                  <Typography variant="body1">
                    {selectedItem.trackingType === 'quantity'
                      ? `Available: ${selectedItem.quantity} in stock`
                      : `Available: ${selectedItem.weight} ${selectedItem.weightUnit} in stock`}
                  </Typography>
                </Grid2>
                <Grid2 size= {{ xs: 12 }}>
                  <Typography variant="body1">
                    Price: {formatCurrency(selectedItem.price)}
                    {selectedItem.priceType === 'per_weight_unit' && `/${selectedItem.weightUnit}`}
                  </Typography>
                </Grid2>
                <Grid2 size= {{ xs: 12 }}>
                  {selectedItem.trackingType === 'quantity' ? (
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(e.target.value)}
                      InputProps={{
                        inputProps: { min: 1, max: selectedItem.quantity }
                      }}
                      helperText={`Maximum available: ${selectedItem.quantity}`}
                    />
                  ) : (
                    <TextField
                      fullWidth
                      label={`Weight (${selectedItem.weightUnit})`}
                      type="number"
                      value={selectedWeight}
                      onChange={(e) => setSelectedWeight(e.target.value)}
                      InputProps={{
                        inputProps: { min: 0.01, max: selectedItem.weight, step: 0.01 }
                      }}
                      helperText={`Maximum available: ${selectedItem.weight} ${selectedItem.weightUnit}`}
                    />
                  )}
                </Grid2>
                {selectedItem.trackingType === 'length' && (
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 8 }}>
                      <TextField
                        fullWidth
                        label={`Length (${selectedItem.lengthUnit})`}
                        type="number"
                        value={selectedLength}
                        onChange={(e) => setSelectedLength(e.target.value)}
                        InputProps={{
                          inputProps: { min: 0.01, max: selectedItem.length, step: 0.01 }
                        }}
                        helperText={`Maximum available: ${selectedItem.length} ${selectedItem.lengthUnit}`}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={selectedLengthUnit}
                          onChange={(e) => setSelectedLengthUnit(e.target.value as LengthUnit)}
                          label="Unit"
                        >
                          <MenuItem value="mm">mm</MenuItem>
                          <MenuItem value="cm">cm</MenuItem>
                          <MenuItem value="m">m</MenuItem>
                          <MenuItem value="in">in</MenuItem>
                          <MenuItem value="ft">ft</MenuItem>
                          <MenuItem value="yd">yd</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid2>
                  </Grid2>
                )}

                {selectedItem.trackingType === 'area' && (
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 8 }}>
                      <TextField
                        fullWidth
                        label={`Area (${selectedItem.areaUnit})`}
                        type="number"
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        InputProps={{
                          inputProps: { min: 0.01, max: selectedItem.area, step: 0.01 }
                        }}
                        helperText={`Maximum available: ${selectedItem.area} ${selectedItem.areaUnit}`}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={selectedAreaUnit}
                          onChange={(e) => setSelectedAreaUnit(e.target.value as AreaUnit)}
                          label="Unit"
                        >
                          <MenuItem value="sqft">sq ft</MenuItem>
                          <MenuItem value="sqm">sq m</MenuItem>
                          <MenuItem value="sqyd">sq yd</MenuItem>
                          <MenuItem value="acre">acre</MenuItem>
                          <MenuItem value="ha">ha</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid2>
                  </Grid2>
                )}

                {selectedItem.trackingType === 'volume' && (
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 8 }}>
                      <TextField
                        fullWidth
                        label={`Volume (${selectedItem.volumeUnit})`}
                        type="number"
                        value={selectedVolume}
                        onChange={(e) => setSelectedVolume(e.target.value)}
                        InputProps={{
                          inputProps: { min: 0.01, max: selectedItem.volume, step: 0.01 }
                        }}
                        helperText={`Maximum available: ${selectedItem.volume} ${selectedItem.volumeUnit}`}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={selectedVolumeUnit}
                          onChange={(e) => setSelectedVolumeUnit(e.target.value as VolumeUnit)}
                          label="Unit"
                        >
                          <MenuItem value="ml">ml</MenuItem>
                          <MenuItem value="l">l</MenuItem>
                          <MenuItem value="gal">gal</MenuItem>
                          <MenuItem value="floz">fl oz</MenuItem>
                          <MenuItem value="cu_ft">cu ft</MenuItem>
                          <MenuItem value="cu_m">cu m</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid2>
                  </Grid2>
                )}
                {selectedItem.trackingType === 'weight' && (
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 8 }}>
                      <TextField
                        fullWidth
                        label={`Weight (${selectedItem.weightUnit})`}
                        type="number"
                        value={selectedWeight}
                        onChange={(e) => setSelectedWeight(e.target.value)}
                        InputProps={{
                          inputProps: { min: 0.01, max: selectedItem.weight, step: 0.01 }
                        }}
                        helperText={`Maximum available: ${selectedItem.weight} ${selectedItem.weightUnit}`}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={selectedWeightUnit}
                          onChange={(e) => setSelectedWeightUnit(e.target.value as WeightUnit)}
                          label="Unit"
                        >
                          <MenuItem value="oz">oz</MenuItem>
                          <MenuItem value="lb">lb</MenuItem>
                          <MenuItem value="g">g</MenuItem>
                          <MenuItem value="kg">kg</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid2>
                  </Grid2>
                )}
              </Grid2>
              <Grid2 container spacing={2} sx={{ mt: 2 }}>
                <Grid2 size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useAutoMarkup}
                        onChange={(e) => setUseAutoMarkup(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Apply automatic markup"
                  />
                </Grid2>

                {useAutoMarkup && (
                  <Grid2 size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                        Markup:
                      </Typography>
                      <Slider
                        value={markupPercentage}
                        onChange={(_, newValue) => setMarkupPercentage(newValue as number)}
                        step={5}
                        marks
                        min={0}
                        max={200}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}%`}
                        sx={{ flex: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2, width: 50 }}>
                        {markupPercentage}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Cost: {formatCurrency(selectedItem?.cost || 0)} → Price: {formatCurrency(parseFloat(selectedItemPrice))}
                    </Typography>
                  </Grid2>
                )}
              </Grid2>
            </Box>
          ) : (
            <List sx={{ pt: 0 }}>
              {items
                .filter(item => {
                  // Only show items that have stock available
                  switch (item.trackingType) {
                    case 'quantity':
                      return item.quantity > 0;
                    case 'weight':
                      return item.weight > 0;
                    case 'length':
                      return item.length > 0;
                    case 'area':
                      return item.area > 0;
                    case 'volume':
                      return item.volume > 0;
                    default:
                      return item.quantity > 0;
                  }
                })
                .map((item) => (
                  <ListItemButton
                    onClick={() => handleItemSelect(item)}
                    key={item._id}
                    divider
                  >
                    <ListItemAvatar>
                      {item.imageUrl ? (
                        <Avatar
                          src={item.imageUrl}
                          alt={item.name}
                          variant="rounded"
                        />
                      ) : (
                        <Avatar variant="rounded" sx={{ bgcolor: 'action.hover' }}>
                          <ImageIcon color="disabled" />
                        </Avatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography component="span" variant="body1">
                            {item.name}
                          </Typography>
                          {item.tags && item.tags.length > 0 && (
                            <Box sx={{ display: 'flex', ml: 1, gap: 0.5 }}>
                              {item.tags.slice(0, 2).map(tag => (
                                <Chip key={tag} label={tag} size="small" variant="outlined" />
                              ))}
                            </Box>
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            {item.trackingType === 'quantity'
                              ? `${item.quantity} in stock`
                              : `${item.weight} ${item.weightUnit} in stock`}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            {formatCurrency(item.price)}
                            {item.priceType === 'per_weight_unit' && `/${item.weightUnit}`}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                ))
              }
            </List>
          )}
        </DialogContent>
        <DialogActions>
          {selectedItem && (
            <Button onClick={() => setSelectedItem(null)}>
              Back to List
            </Button>
          )}
          <Button onClick={() => setItemDialogOpen(false)}>
            Cancel
          </Button>
          {selectedItem && (
            <Button onClick={handleAddItem} variant="contained" color="primary">
              Add to Sale
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Create Product Dialog */}
      <Dialog
        open={createProductDialogOpen}
        onClose={() => setCreateProductDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Create New Product</DialogTitle>
        <DialogContent dividers>
          <Grid2 container spacing={3}>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Product Name"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                margin="normal"
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="SKU"
                value={newProductSku}
                onChange={(e) => setNewProductSku(e.target.value)}
                margin="normal"
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Category</InputLabel>
                <Select
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">None</MenuItem>
                    {(categories as string[]).map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="subtitle2">Materials Cost</Typography>
                <Typography variant="h6" color="text.secondary">
                  {formatCurrency(calculateMaterialsCost())}
                </Typography>
              </Box>
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={newProductDescription}
                onChange={(e) => setNewProductDescription(e.target.value)}
                margin="normal"
              />
            </Grid2>
          </Grid2>

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Materials</Typography>

          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setMaterialDialogOpen(true)}
            >
              Add Material
            </Button>
          </Box>

          {selectedMaterials.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Material</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell align="center">Quantity</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedMaterials.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.material.name}</TableCell>
                      <TableCell align="right">{formatCurrency(item.material.cost || item.material.price)}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(item.totalCost)}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveMaterial(index)}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} align="right">
                      <Typography variant="subtitle2">Total Materials Cost:</Typography>
                    </TableCell>
                    <TableCell align="right" colSpan={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {formatCurrency(calculateMaterialsCost())}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              No materials added yet. Click "Add Material" to add materials to this product.
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>Pricing</Typography>
          <Grid2 container spacing={2} alignItems="center">
            <Grid2 size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!isManualPrice}
                    onChange={() => setIsManualPrice(!isManualPrice)}
                  />
                }
                label={isManualPrice ? "Set Final Price" : "Set Markup Percentage"}
              />
            </Grid2>

            {!isManualPrice ? (
              // Markup Percentage Mode
              <Grid2 size={{ xs: 12, md: 6 }}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Markup percentage: {newProductMarkup}%
                  </Typography>
                  <Slider
                    value={newProductMarkup}
                    onChange={(_, newValue) => setNewProductMarkup(newValue as number)}
                    step={5}
                    marks
                    min={0}
                    max={1000}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Box>
              </Grid2>
            ) : (
              // Final Price Mode
              <Grid2 size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Final Price"
                  type="number"
                  value={finalPrice}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0;
                    setFinalPrice(price);
                    // Calculate markup percentage based on materials cost
                    const materialsCost = calculateMaterialsCost();
                    if (materialsCost > 0) {
                      const calculatedMarkup = ((price / materialsCost) - 1) * 100;
                      setNewProductMarkup(Math.round(calculatedMarkup));
                    }
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    inputProps: { min: 0, step: 0.01 }
                  }}
                />
              </Grid2>
            )}

            <Grid2 size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary">
                  Materials Cost: {formatCurrency(calculateMaterialsCost())}
                </Typography>
                <Typography variant="body2" color="success.main">
                  Markup: {formatCurrency(calculateProductPrice() - calculateMaterialsCost())}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Final Price: {formatCurrency(calculateProductPrice())}
                </Typography>
              </Paper>
            </Grid2>
          </Grid2>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateProductDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateProduct}
            variant="contained"
            color="primary"
            disabled={!newProductName || selectedMaterials.length === 0}
          >
            Create & Add to Sale
          </Button>
        </DialogActions>
      </Dialog>

      {/* Material Selection Dialog */}
      <Dialog
        open={materialDialogOpen}
        onClose={() => setMaterialDialogOpen(false)}
        fullWidth
        maxWidth="md" // Changed from "sm" to "md" for more space
      >
        <DialogTitle>
          Select Materials
          <Typography variant="subtitle2" color="text.secondary">
            Select multiple materials to add at once
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Search Materials"
            value={materialSearchQuery}
            onChange={(e) => setMaterialSearchQuery(e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedMaterialIds.length > 0 && selectedMaterialIds.length < filteredMaterials.length}
                      checked={filteredMaterials.length > 0 && selectedMaterialIds.length === filteredMaterials.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Select all materials
                          setSelectedMaterialIds(filteredMaterials.map(m => m._id || ''));
                          // Initialize all quantities to 1
                          const newQuantities: Record<string, string> = {};
                          filteredMaterials.forEach(m => {
                            if (m._id) newQuantities[m._id] = '1';
                          });
                          setMaterialQuantities({...materialQuantities, ...newQuantities});
                        } else {
                          // Unselect all
                          setSelectedMaterialIds([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell align="center">In Stock</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMaterials.map(item => (
                  <TableRow
                    key={item._id}
                    selected={item._id ? selectedMaterialIds.includes(item._id) : false}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)'
                      }
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={item._id ? selectedMaterialIds.includes(item._id) : false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Add to selection
                            setSelectedMaterialIds(prev => [...prev, item._id || '']);
                            // Set default quantity
                            setMaterialQuantities(prev => ({
                              ...prev,
                              [item._id || '']: '1'
                            }));
                          } else {
                            // Remove from selection
                            setSelectedMaterialIds(prev => prev.filter(id => id !== item._id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={item.imageUrl || undefined}
                          variant="rounded"
                          sx={{ width: 40, height: 40, mr: 2 }}
                        >
                          <Category fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body1">{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">SKU: {item.sku}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(item.cost || item.price)}</TableCell>
                    <TableCell align="center">
                      {item.trackingType === 'quantity'
                        ? `${item.quantity} units`
                        : `${item.weight} ${item.weightUnit}`}
                    </TableCell>
                    <TableCell align="right">
                      {item._id && selectedMaterialIds.includes(item._id) && (
                        <TextField
                          type="number"
                          size="small"
                          value={materialQuantities[item._id] || '1'}
                          onChange={(e) => setMaterialQuantities(prev => ({
                            ...prev,
                            [item._id as string]: e.target.value  // Add "as string" here
                          }))}
                          InputProps={{ inputProps: { min: 1 } }}
                          sx={{ width: 70 }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaterialDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddMultipleMaterials}
            variant="contained"
            color="primary"
            disabled={selectedMaterialIds.length === 0}
          >
            Add Selected Materials
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}