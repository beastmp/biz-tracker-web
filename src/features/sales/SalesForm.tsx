import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
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
  Stack,
  Card,
  CardContent,
  Badge,
  Grid2
} from '@mui/material';
import {
  Save,
  ArrowBack,
  Add,
  Delete,
  Image as ImageIcon,
  Construction,
  ShoppingCart,
  ReceiptLong,
  CalendarToday,
  AttachMoney,
  Payment,
  NoteAdd
} from '@mui/icons-material';
import { useSale, useCreateSale, useUpdateSale } from '@hooks/useSales';
import { useItems } from '@hooks/useItems';
import { Sale, SaleItem, Item, WeightUnit, LengthUnit, AreaUnit, VolumeUnit } from '@custTypes/models';
import { formatCurrency } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import CreateProductDialog from '@components/inventory/CreateProductDialog';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default function SaleForm() {
  // Keep all the existing state and hooks
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
    saleDate: new Date(),
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
  const [selectedLength, setSelectedLength] = useState<string>('0');
  const [selectedArea, setSelectedArea] = useState<string>('0');
  const [selectedVolume, setSelectedVolume] = useState<string>('0');
  const [selectedWeightUnit, setSelectedWeightUnit] = useState<WeightUnit>('lb');
  const [selectedLengthUnit, setSelectedLengthUnit] = useState<LengthUnit>('in');
  const [selectedAreaUnit, setSelectedAreaUnit] = useState<AreaUnit>('sqft');
  const [selectedVolumeUnit, setSelectedVolumeUnit] = useState<VolumeUnit>('l');
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

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      saleDate: date || new Date()
    }));
  };

  // Calculate price based on measurement type
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

  // Add item to sale
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

  if (saleLoading || itemsLoading) {
    return <LoadingScreen />;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Grid2 container alignItems="center" spacing={2}>
          <Grid2 size="auto">
            <Button
              component={RouterLink}
              to="/sales"
              startIcon={<ArrowBack />}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
          </Grid2>
          <Grid2 size="grow">
            <Typography variant="h4" component="h1">
              {isEditMode ? 'Edit Sale' : 'New Sale'}
            </Typography>
          </Grid2>
          <Grid2 size="auto">
            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={handleSubmit}
              disabled={(createSale.isPending || updateSale.isPending) || !formData.items?.length}
            >
              {createSale.isPending || updateSale.isPending ? 'Saving...' : isEditMode ? 'Update Sale' : 'Complete Sale'}
            </Button>
          </Grid2>
        </Grid2>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid2 container spacing={3}>
        {/* Left column - Sale details */}
        <Grid2 size={{ xs: 12, md: 8 }}>
          {/* Basic Information Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReceiptLong sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Basic Information</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid2 container spacing={3}>
                <Grid2 size={{ xs: 12 }}>
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
                <Grid2 size={{ xs: 12, sm: 6 }}>
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
                <Grid2 size={{ xs: 12, sm: 6 }}>
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
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Sale Date"
                      value={formData.saleDate}
                      onChange={handleDateChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          InputProps: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarToday fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid2>
              </Grid2>
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ShoppingCart sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="h6">Sale Items</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    color="primary"
                    onClick={() => setItemDialogOpen(true)}
                    disabled={createSale.isPending || updateSale.isPending}
                  >
                    Add Item
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Construction />}
                    onClick={() => setCreateProductDialogOpen(true)}
                    disabled={createSale.isPending || updateSale.isPending}
                  >
                    Create Product
                  </Button>
                </Stack>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {formData.items && formData.items.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
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
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} align="right">
                          <Typography variant="subtitle2">Subtotal:</Typography>
                        </TableCell>
                        <TableCell align="right" colSpan={2}>
                          <Typography variant="subtitle2">{formatCurrency(formData.subtotal || 0)}</Typography>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Badge
                    badgeContent="0"
                    color="error"
                    sx={{ '& .MuiBadge-badge': { fontSize: 18, height: 30, width: 30, borderRadius: '50%' } }}
                  >
                    <ShoppingCart sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  </Badge>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No items added yet
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setItemDialogOpen(true)}
                    sx={{ mt: 1 }}
                  >
                    Add Items to Sale
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Payment Information Card */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Payment sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Payment Information</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid2 container spacing={3}>
                <Grid2 size={{ xs: 12, sm: 6 }}>
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
                <Grid2 size={{ xs: 12, sm: 6 }}>
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
                <Grid2 size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <NoteAdd sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">Notes</Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    disabled={createSale.isPending || updateSale.isPending}
                    placeholder="Optional notes about this sale"
                  />
                </Grid2>
              </Grid2>
            </CardContent>
          </Card>
        </Grid2>

        {/* Right column - Sale Summary */}
        <Grid2 size={{ xs: 12, md: 4 }}>
          <Card sx={{ position: 'sticky', top: 16 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Sale Summary</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid2 container spacing={2} sx={{ mb: 2 }}>
                <Grid2 size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                </Grid2>
                <Grid2 size={{ xs: 6 }}>
                  <Typography variant="body1" align="right">{formatCurrency(formData.subtotal || 0)}</Typography>
                </Grid2>

                <Grid2 size={{ xs: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>Tax Rate</Typography>
                </Grid2>
                <Grid2 size={{ xs: 6 }}>
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
                    sx={{ width: '100%' }}
                  />
                </Grid2>

                <Grid2 size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Tax Amount</Typography>
                </Grid2>
                <Grid2 size={{ xs: 6 }}>
                  <Typography variant="body1" align="right">{formatCurrency(formData.taxAmount || 0)}</Typography>
                </Grid2>

                <Grid2 size={{ xs: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>Discount</Typography>
                </Grid2>
                <Grid2 size={{ xs: 6 }}>
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
                    sx={{ width: '100%' }}
                  />
                </Grid2>
              </Grid2>

              <Divider sx={{ my: 2 }} />

              <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 size={{ xs: 6 }}>
                  <Typography variant="h6">Total</Typography>
                </Grid2>
                <Grid2 size={{ xs: 6 }}>
                  <Typography variant="h6" align="right" color="primary">{formatCurrency(formData.total || 0)}</Typography>
                </Grid2>
              </Grid2>

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
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Item Selection Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Item Details' : 'Select Item'}
        </DialogTitle>
        <DialogContent>
          {items.length === 0 ? (
            <Typography>No items available in inventory</Typography>
          ) : selectedItem ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>{selectedItem.name}</Typography>
              <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">
                    SKU: {selectedItem.sku} | Category: {selectedItem.category}
                  </Typography>
                </Grid2>
                <Grid2 size={{ xs: 12 }}>
                  <Typography variant="body1">
                    {selectedItem.trackingType === 'quantity'
                      ? `Available: ${selectedItem.quantity} in stock`
                      : selectedItem.trackingType === 'weight'
                      ? `Available: ${selectedItem.weight} ${selectedItem.weightUnit} in stock`
                      : selectedItem.trackingType === 'length'
                      ? `Available: ${selectedItem.length} ${selectedItem.lengthUnit} in stock`
                      : selectedItem.trackingType === 'area'
                      ? `Available: ${selectedItem.area} ${selectedItem.areaUnit} in stock`
                      : `Available: ${selectedItem.volume} ${selectedItem.volumeUnit} in stock`}
                  </Typography>
                </Grid2>
                <Grid2 size={{ xs: 12 }}>
                  <Typography variant="body1">
                    Price: {formatCurrency(selectedItem.price)}
                    {selectedItem.priceType !== 'each' &&
                      `/${selectedItem.priceType === 'per_weight_unit'
                        ? selectedItem.weightUnit
                        : selectedItem.priceType === 'per_length_unit'
                        ? selectedItem.lengthUnit
                        : selectedItem.priceType === 'per_area_unit'
                        ? selectedItem.areaUnit
                        : selectedItem.volumeUnit}`}
                  </Typography>
                </Grid2>

                {/* Display appropriate input fields based on tracking type */}
                {selectedItem.trackingType === 'quantity' && (
                  <Grid2 size={{ xs: 12 }}>
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

                {/* Markup controls */}
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
                              : item.trackingType === 'weight'
                              ? `${item.weight} ${item.weightUnit} in stock`
                              : item.trackingType === 'length'
                              ? `${item.length} ${item.lengthUnit} in stock`
                              : item.trackingType === 'area'
                              ? `${item.area} ${item.areaUnit} in stock`
                              : `${item.volume} ${item.volumeUnit} in stock`}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            {formatCurrency(item.price)}
                            {item.priceType !== 'each' &&
                              `/${item.priceType === 'per_weight_unit'
                                ? item.weightUnit
                                : item.priceType === 'per_length_unit'
                                ? item.lengthUnit
                                : item.priceType === 'per_area_unit'
                                ? item.areaUnit
                                : item.volumeUnit}`}
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
      <CreateProductDialog
        open={createProductDialogOpen}
        onClose={() => setCreateProductDialogOpen(false)}
        onProductCreated={handleProductCreated}
      />

    </Box>
  );
}