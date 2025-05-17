import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import { Save, ArrowBack, Add, Delete, Image as ImageIcon, Construction } from '@mui/icons-material';
import { useSale, useCreateSale, useUpdateSale } from '@hooks/useSales';
import { useItems } from '@hooks/useItems';
import { Sale, SaleItem, Item, WeightUnit, LengthUnit, AreaUnit, VolumeUnit } from '@custTypes/models';
import { formatCurrency } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import CreateProductDialog from '@components/inventory/CreateProductDialog';

export default function SaleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Queries
  const { data: existingSale, isLoading: saleLoading } = useSale(id);
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const createSale = useCreateSale();
  const updateSale = useUpdateSale(id);

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

  // Handle product created from dialog
  const handleProductCreated = (product: Item) => {
    const productPrice = product.price;

    // Add the new product to the sale
    const newSaleItem: SaleItem = {
      item: product._id || '',
      name: product.name,
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

    setError(null);
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
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 12 }}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  name="customerName"
                  value={formData.customerName || ''}
                  onChange={handleInputChange}
                  disabled={createSale.isPending || updateSale.isPending}
                  placeholder="Optional"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="customerEmail"
                  value={formData.customerEmail || ''}
                  onChange={handleInputChange}
                  disabled={createSale.isPending || updateSale.isPending}
                  placeholder="Optional"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="customerPhone"
                  value={formData.customerPhone || ''}
                  onChange={handleInputChange}
                  disabled={createSale.isPending || updateSale.isPending}
                  placeholder="Optional"
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Sale Items
              </Typography>
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

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
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
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
              </Grid>
              <Grid size={{ xs: 12 }}>
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
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Sale Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 7 }}>
                  <Typography variant="body1">Subtotal:</Typography>
                </Grid>
                <Grid size={{ xs: 5 }}>
                  <Typography variant="body1" align="right">
                    {formatCurrency(formData.subtotal || 0)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 7 }} sx={{ display: 'flex', alignItems: 'center' }}>
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
                </Grid>
                <Grid size={{ xs: 5 }}>
                  <Typography variant="body1" align="right">
                    {formatCurrency(formData.taxAmount || 0)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 7 }} sx={{ display: 'flex', alignItems: 'center' }}>
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
                </Grid>
                <Grid size={{ xs: 5 }}>
                  <Typography variant="body1" align="right" color="error">
                    -{formatCurrency(formData.discountAmount || 0)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="h6">Total:</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="h6" align="right" color="primary">
                    {formatCurrency(formData.total || 0)}
                  </Typography>
                </Grid>
              </Grid>
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
        </Grid>
      </Grid>

      {/* Item Selection Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Item</DialogTitle>
        <DialogContent>
          {items.length === 0 ? (
            <Typography>No items available in inventory</Typography>
          ) : selectedItem ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>{selectedItem.name}</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">
                    SKU: {selectedItem.sku} | Category: {selectedItem.category}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body1">
                    {selectedItem.trackingType === 'quantity'
                      ? `Available: ${selectedItem.quantity} in stock`
                      : `Available: ${selectedItem.weight} ${selectedItem.weightUnit} in stock`}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body1">
                    Price: {formatCurrency(selectedItem.price)}
                    {selectedItem.priceType === 'per_weight_unit' && `/${selectedItem.weightUnit}`}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
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
                </Grid>
                {selectedItem.trackingType === 'length' && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 8 }}>
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
                    </Grid>
                    <Grid size={{ xs: 4 }}>
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
                    </Grid>
                  </Grid>
                )}

                {selectedItem.trackingType === 'area' && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 8 }}>
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
                    </Grid>
                    <Grid size={{ xs: 4 }}>
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
                    </Grid>
                  </Grid>
                )}

                {selectedItem.trackingType === 'volume' && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 8 }}>
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
                    </Grid>
                    <Grid size={{ xs: 4 }}>
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
                    </Grid>
                  </Grid>
                )}
                {selectedItem.trackingType === 'weight' && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 8 }}>
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
                    </Grid>
                    <Grid size={{ xs: 4 }}>
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
                    </Grid>
                  </Grid>
                )}
              </Grid>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12 }}>
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
                </Grid>

                {useAutoMarkup && (
                  <Grid size={{ xs: 12 }}>
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
                  </Grid>
                )}
              </Grid>
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

      {/* Use the new CreateProductDialog component */}
      <CreateProductDialog
        open={createProductDialogOpen}
        onClose={() => setCreateProductDialogOpen(false)}
        onProductCreated={handleProductCreated}
      />

    </Box>
  );
}