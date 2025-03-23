import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid,
  CircularProgress,
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
  Stack,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { Save, ArrowBack, Add, Delete } from '@mui/icons-material';
import { itemsApi, salesApi, Item, Sale, SaleItem } from '../../services/api';

export default function SaleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState<Partial<Sale>>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    items: [],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    discountAmount: 0,
    total: 0,
    paymentMethod: 'cash',
    notes: '',
    status: 'completed'
  });
  
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available items and sale details if in edit mode
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const items = await itemsApi.getAll();
        setAvailableItems(items.filter(item => item.quantity > 0));
        
        if (isEditMode && id) {
          const saleData = await salesApi.getById(id);
          setFormData(saleData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load required data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [id, isEditMode]);

  // Recalculate totals when items, tax rate, or discount change
  useEffect(() => {
    if (!formData.items) return;
    
    const subtotal = formData.items.reduce(
      (sum, item) => sum + (item.quantity * item.priceAtSale), 
      0
    );
    
    const taxAmount = subtotal * ((formData.taxRate || 0) / 100);
    const total = subtotal + taxAmount - (formData.discountAmount || 0);
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total
    }));
  }, [formData.items, formData.taxRate, formData.discountAmount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'taxRate' || name === 'discountAmount'
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAddItem = () => {
    if (!selectedItemId) return;

    const item = availableItems.find(item => item._id === selectedItemId);
    if (!item) return;
    
    if (selectedQuantity <= 0 || selectedQuantity > item.quantity) {
      setError(`Invalid quantity. Available: ${item.quantity}`);
      return;
    }
    
    const newSaleItem: SaleItem = {
      item: selectedItemId,
      quantity: selectedQuantity,
      priceAtSale: item.price
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newSaleItem]
    }));
    
    setSelectedItemId('');
    setSelectedQuantity(1);
    setError(null);
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.items || formData.items.length === 0) {
      return 'At least one item is required';
    }
    if (formData.total <= 0) {
      return 'Sale total must be greater than zero';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      if (isEditMode && id) {
        await salesApi.update(id, formData);
      } else {
        await salesApi.create(formData as Sale);
      }
      navigate('/sales');
    } catch (error: any) {
      console.error('Failed to save sale:', error);
      setError(error.response?.data?.message || 'Failed to save sale. Please try again.');
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Sale' : 'New Sale'}
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={() => navigate('/sales')}
        >
          Back to Sales
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>Customer Information</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Customer Name"
                name="customerName"
                value={formData.customerName || ''}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Customer Email"
                name="customerEmail"
                type="email"
                value={formData.customerEmail || ''}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Customer Phone"
                name="customerPhone"
                value={formData.customerPhone || ''}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Sale Items</Typography>
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={5}>
              <FormControl fullWidth>
                <InputLabel id="item-select-label">Select Item</InputLabel>
                <Select
                  labelId="item-select-label"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  label="Select Item"
                  disabled={saving || availableItems.length === 0}
                >
                  {availableItems.map((item) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.name} - {formatCurrency(item.price)} ({item.quantity} in stock)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 0)}
                inputProps={{ min: 1 }}
                disabled={saving || !selectedItemId}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                startIcon={<Add />}
                onClick={handleAddItem}
                disabled={saving || !selectedItemId || selectedQuantity <= 0}
                sx={{ height: '56px' }}
              >
                Add Item
              </Button>
            </Grid>
          </Grid>

          {(!formData.items || formData.items.length === 0) ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              No items added yet. Please add at least one item.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((saleItem, index) => {
                    const itemDetails = availableItems.find(i => 
                      i._id === (typeof saleItem.item === 'string' ? saleItem.item : saleItem.item._id)
                    );
                    const itemName = typeof saleItem.item === 'object' && saleItem.item.name 
                      ? saleItem.item.name
                      : itemDetails ? itemDetails.name : 'Unknown Item';
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>{itemName}</TableCell>
                        <TableCell align="right">{formatCurrency(saleItem.priceAtSale)}</TableCell>
                        <TableCell align="right">{saleItem.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(saleItem.quantity * saleItem.priceAtSale)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleRemoveItem(index)}
                            disabled={saving}
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
          )}

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom>Payment Details</Typography>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel id="payment-method-label">Payment Method</InputLabel>
                  <Select
                    labelId="payment-method-label"
                    name="paymentMethod"
                    value={formData.paymentMethod || 'cash'}
                    onChange={handleSelectChange}
                    label="Payment Method"
                    disabled={saving}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="credit">Credit Card</MenuItem>
                    <MenuItem value="debit">Debit Card</MenuItem>
                    <MenuItem value="check">Check</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>

                {isEditMode && (
                  <FormControl fullWidth>
                    <InputLabel id="status-label">Sale Status</InputLabel>
                    <Select
                      labelId="status-label"
                      name="status"
                      value={formData.status || 'completed'}
                      onChange={handleSelectChange}
                      label="Sale Status"
                      disabled={saving}
                    >
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="refunded">Refunded</MenuItem>
                      <MenuItem value="partially_refunded">Partially Refunded</MenuItem>
                    </Select>
                  </FormControl>
                )}

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  disabled={saving}
                />
              </Stack>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom>Sale Summary</Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={7}>
                    <Typography>Subtotal</Typography>
                  </Grid>
                  <Grid item xs={5}>
                    <Typography align="right">
                      {formatCurrency(formData.subtotal || 0)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={7}>
                    <TextField
                      fullWidth
                      label="Tax Rate (%)"
                      name="taxRate"
                      type="number"
                      value={formData.taxRate || 0}
                      onChange={handleChange}
                      InputProps={{ 
                        endAdornment: <InputAdornment position="end">%</InputAdornment> 
                      }}
                      disabled={saving}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <Typography align="right">
                      {formatCurrency(formData.taxAmount || 0)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={7}>
                    <TextField
                      fullWidth
                      label="Discount"
                      name="discountAmount"
                      type="number"
                      value={formData.discountAmount || 0}
                      onChange={handleChange}
                      InputProps={{ 
                        startAdornment: <InputAdornment position="start">$</InputAdornment> 
                      }}
                      disabled={saving}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <Typography align="right">
                      -{formatCurrency(formData.discountAmount || 0)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="h6">Total</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h6" align="right">
                      {formatCurrency(formData.total || 0)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              type="submit"
              startIcon={<Save />}
              disabled={saving}
              size="large"
            >
              {saving ? 'Saving...' : isEditMode ? 'Update Sale' : 'Complete Sale'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}