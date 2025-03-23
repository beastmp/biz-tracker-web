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
  SelectChangeEvent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemText,
  List,
  ListItem
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
    taxRate: 7.5, // Default tax rate
    taxAmount: 0,
    discountAmount: 0,
    total: 0,
    paymentMethod: 'cash',
    notes: '',
    status: 'completed'
  });
  
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<string>('1');
  const [selectedWeight, setSelectedWeight] = useState<string>('1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First fetch items
        const items = await itemsApi.getAll();
        setAvailableItems(items);
        
        // If edit mode, fetch the sale data
        if (isEditMode && id) {
          const sale = await salesApi.getById(id);
          setFormData(sale);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load required data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

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

  const handleAddItem = () => {
    if (!selectedItem) return;
    
    if (selectedItem.trackingType === 'quantity') {
      // Check if quantity is valid
      const quantity = parseInt(selectedQuantity);
      if (isNaN(quantity) || quantity <= 0 || quantity > selectedItem.quantity) {
        setError(`Please enter a valid quantity between 1 and ${selectedItem.quantity}`);
        return;
      }
      
      const newItem: SaleItem = {
        item: selectedItem._id || '',
        quantity,
        weight: 0,
        priceAtSale: selectedItem.price
      };
      
      setFormData(prev => ({
        ...prev,
        items: [...(prev.items || []), newItem]
      }));
    } else {
      // Weight-based item
      const weight = parseFloat(selectedWeight);
      if (isNaN(weight) || weight <= 0 || weight > selectedItem.weight) {
        setError(`Please enter a valid weight between 0.1 and ${selectedItem.weight}`);
        return;
      }
      
      const newItem: SaleItem = {
        item: selectedItem._id || '',
        quantity: 1, // We still set quantity to 1 for database consistency
        weight,
        weightUnit: selectedItem.weightUnit,
        priceAtSale: selectedItem.price * weight // Calculate total price based on weight
      };
      
      setFormData(prev => ({
        ...prev,
        items: [...(prev.items || []), newItem]
      }));
    }
    
    // Reset selected item and quantities
    setSelectedItem(null);
    setSelectedQuantity('1');
    setSelectedWeight('1');
    setItemDialogOpen(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.items?.length) {
      setError('Please add at least one item to the sale');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      if (isEditMode && id) {
        await salesApi.update(id, formData);
      } else {
        await salesApi.create(formData);
      }
      navigate('/sales');
    } catch (error) {
      console.error('Failed to save sale:', error);
      setError('Failed to save sale. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Find item by ID in the available items array
  const getItemById = (itemId: string): Item | undefined => {
    return availableItems.find(item => item._id === itemId);
  };

  // Get item name for display
  const getItemName = (itemId: string): string => {
    const item = getItemById(itemId);
    return item ? item.name : 'Unknown Item';
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  disabled={saving}
                  placeholder="Optional"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  disabled={saving}
                  placeholder="Optional"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  disabled={saving}
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
                color="primary" 
                startIcon={<Add />}
                onClick={() => setItemDialogOpen(true)}
                disabled={saving || availableItems.length === 0}
              >
                Add Item
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {formData.items && formData.items.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity/Weight</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items.map((item, index) => {
                      const itemId = typeof item.item === 'string' ? item.item : item.item._id;
                      const itemDetails = getItemById(itemId || '');
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            {typeof item.item === 'object' && item.item.name 
                              ? item.item.name 
                              : getItemName(itemId || '')}
                          </TableCell>
                          <TableCell align="right">
                            {itemDetails?.trackingType === 'weight' 
                              ? `${item.weight} ${item.weightUnit}`
                              : item.quantity}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.priceAtSale)}
                            {itemDetails?.priceType === 'per_weight_unit' && `/${itemDetails.weightUnit}`}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.priceAtSale * item.quantity)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton 
                              size="small" 
                              color="error"
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    label="Payment Method"
                    onChange={handleSelectChange}
                    disabled={saving}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="credit">Credit Card</MenuItem>
                    <MenuItem value="debit">Debit Card</MenuItem>
                    <MenuItem value="check">Check</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleSelectChange}
                    disabled={saving}
                  >
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="refunded">Refunded</MenuItem>
                    <MenuItem value="partially_refunded">Partially Refunded</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  disabled={saving}
                  placeholder="Optional notes about this sale"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Sale Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={7}>
                  <Typography variant="body1">Subtotal:</Typography>
                </Grid>
                <Grid item xs={5}>
                  <Typography variant="body1" align="right">
                    {formatCurrency(formData.subtotal || 0)}
                  </Typography>
                </Grid>
                
                <Grid item xs={7} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ mr: 1 }}>Tax Rate:</Typography>
                  <TextField
                    size="small"
                    name="taxRate"
                    type="number"
                    value={formData.taxRate || 0}
                    onChange={handleInputChange}
                    disabled={saving}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      inputProps: { min: 0, max: 100, step: 0.1 }
                    }}
                    sx={{ width: 80 }}
                  />
                </Grid>
                <Grid item xs={5}>
                  <Typography variant="body1" align="right">
                    {formatCurrency(formData.taxAmount || 0)}
                  </Typography>
                </Grid>
                
                <Grid item xs={7} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ mr: 1 }}>Discount:</Typography>
                  <TextField
                    size="small"
                    name="discountAmount"
                    type="number"
                    value={formData.discountAmount || 0}
                    onChange={handleInputChange}
                    disabled={saving}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                    sx={{ width: 100 }}
                  />
                </Grid>
                <Grid item xs={5}>
                  <Typography variant="body1" align="right" color="error">
                    -{formatCurrency(formData.discountAmount || 0)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="h6">Total:</Typography>
                </Grid>
                <Grid item xs={6}>
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
              disabled={saving || !formData.items?.length}
            >
              {saving ? 'Saving...' : isEditMode ? 'Update Sale' : 'Complete Sale'}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Item Selection Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Item</DialogTitle>
        <DialogContent>
          {availableItems.length === 0 ? (
            <Typography>No items available in inventory</Typography>
          ) : selectedItem ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>{selectedItem.name}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    SKU: {selectedItem.sku} | Category: {selectedItem.category}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    {selectedItem.trackingType === 'quantity' 
                      ? `Available: ${selectedItem.quantity} in stock` 
                      : `Available: ${selectedItem.weight} ${selectedItem.weightUnit} in stock`}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    Price: {formatCurrency(selectedItem.price)}
                    {selectedItem.priceType === 'per_weight_unit' && `/${selectedItem.weightUnit}`}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
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
              </Grid>
            </Box>
          ) : (
            <List sx={{ pt: 0 }}>
              {availableItems
                .filter(item => {
                  // Only show items that have stock available
                  if (item.trackingType === 'quantity') return item.quantity > 0;
                  return item.weight > 0;
                })
                .map((item) => (
                  <ListItem 
                    button 
                    onClick={() => handleItemSelect(item)} 
                    key={item._id}
                    divider
                  >
                    <ListItemText 
                      primary={item.name} 
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
                  </ListItem>
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
    </Box>
  );
}