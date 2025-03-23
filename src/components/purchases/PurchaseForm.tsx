import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { Save, ArrowBack, Add, Delete, Image as ImageIcon } from '@mui/icons-material';
import { itemsApi, purchasesApi, Item, Purchase, PurchaseItem } from '../../services/api';

export default function PurchaseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

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

  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(0);
  const [weightUnit, setWeightUnit] = useState<'oz' | 'lb' | 'g' | 'kg'>('lb');
  const [costPerUnit, setCostPerUnit] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemSelectDialogOpen, setItemSelectDialogOpen] = useState(false);

  // Fetch available items and purchase data if in edit mode
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const items = await itemsApi.getAll();
        setAvailableItems(items);
      } catch (error) {
        console.error('Failed to fetch items:', error);
        setError('Failed to load inventory items. Please check your connection.');
      }
    };

    const fetchPurchase = async () => {
      if (!id) return;
      
      try {
        const data = await purchasesApi.getById(id);
        setPurchase(data);
      } catch (error) {
        console.error('Failed to fetch purchase:', error);
        setError('Failed to load purchase details. The purchase may have been deleted.');
      }
    };

    const loadData = async () => {
      await fetchItems();
      if (isEditMode) {
        await fetchPurchase();
      }
      setLoading(false);
    };

    loadData();
  }, [id, isEditMode]);

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
    if (selectedItem?.trackingType === 'weight') {
      setTotalCost(weight * costPerUnit);
    } else {
      setTotalCost(quantity * costPerUnit);
    }
  }, [quantity, costPerUnit, weight, selectedItem]);

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

  const handleAddItem = () => {
    if (!selectedItem) return;

    const newItem: PurchaseItem = {
      item: selectedItem._id || '',
      quantity: selectedItem.trackingType === 'weight' ? 1 : quantity,
      costPerUnit,
      totalCost,
      paymentMethod: purchase.paymentMethod,
      status: purchase.status
    };

    if (selectedItem.trackingType === 'weight') {
      newItem.weight = weight;
      newItem.weightUnit = weightUnit;
    }

    setPurchase({
      ...purchase,
      items: [...purchase.items, newItem]
    });

    // Reset form values
    setSelectedItem(null);
    setQuantity(1);
    setWeight(0);
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

  const handleOpenItemDialog = () => {
    setItemSelectDialogOpen(true);
  };

  const handleCloseItemDialog = () => {
    setItemSelectDialogOpen(false);
  };

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setCostPerUnit(item.price);
    setItemSelectDialogOpen(false);
  };

  const validateForm = (): string | null => {
    if (!purchase.supplier.name) return 'Supplier name is required';
    if (purchase.items.length === 0) return 'At least one item is required';
    if (purchase.total <= 0) return 'Total must be greater than zero';
    
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      if (isEditMode && id) {
        await purchasesApi.update(id, purchase);
      } else {
        await purchasesApi.create(purchase);
      }
      navigate('/purchases');
    } catch (error) {
      console.error('Failed to save purchase:', error);
      setError('Failed to save purchase. Please try again.');
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
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Supplier Name"
              value={purchase.supplier.name || ''}
              onChange={(e) => handleTextChange('supplier.name', e.target.value)}
              margin="normal"
              required
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Contact Name"
              value={purchase.supplier.contactName || ''}
              onChange={(e) => handleTextChange('supplier.contactName', e.target.value)}
              margin="normal"
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={purchase.supplier.email || ''}
              onChange={(e) => handleTextChange('supplier.email', e.target.value)}
              margin="normal"
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              value={purchase.supplier.phone || ''}
              onChange={(e) => handleTextChange('supplier.phone', e.target.value)}
              margin="normal"
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Invoice Number"
              value={purchase.invoiceNumber || ''}
              onChange={(e) => handleTextChange('invoiceNumber', e.target.value)}
              margin="normal"
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Purchase Date"
              type="date"
              value={purchase.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleTextChange('purchaseDate', e.target.value)}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              disabled={saving}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <Typography variant="h6">Purchase Items</Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={handleOpenItemDialog}
            disabled={saving}
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
            
            <Grid container spacing={2} alignItems="center">
              {selectedItem.trackingType === 'weight' ? (
                <>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Weight"
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                      disabled={saving}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Select
                              value={weightUnit}
                              onChange={(e) => setWeightUnit(e.target.value as any)}
                              size="small"
                              disabled={saving}
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
                </>
              ) : (
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    disabled={saving}
                  />
                </Grid>
              )}
              
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Cost Per Unit"
                  type="number"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || 0)}
                  disabled={saving}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Total Cost"
                  type="number"
                  value={totalCost}
                  onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}
                  disabled={saving}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleAddItem}
                disabled={saving}
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
                  const itemDetails = typeof item.item === 'object' ? item.item : availableItems.find(i => i._id === item.item);
                  return (
                    <TableRow key={index}>
                      <TableCell>{itemDetails ? itemDetails.name : 'Unknown Item'}</TableCell>
                      <TableCell>
                        {item.weight ? `${item.weight} ${item.weightUnit}` : item.quantity}
                      </TableCell>
                      <TableCell>{formatCurrency(item.costPerUnit)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.totalCost)}</TableCell>
                      <TableCell>
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
          <Alert severity="info">No items added yet. Use the "Add Item" button to add inventory items to this purchase.</Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Payment Details</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={purchase.paymentMethod}
                label="Payment Method"
                onChange={(e: SelectChangeEvent) => handleTextChange('paymentMethod', e.target.value)}
                disabled={saving}
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
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={purchase.status}
                label="Status"
                onChange={(e: SelectChangeEvent) => handleTextChange('status', e.target.value)}
                disabled={saving}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="received">Received</MenuItem>
                <MenuItem value="partially_received">Partially Received</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              value={purchase.notes || ''}
              onChange={(e) => handleTextChange('notes', e.target.value)}
              margin="normal"
              multiline
              rows={3}
              disabled={saving}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Purchase Summary</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tax Rate (%)"
              type="number"
              value={purchase.taxRate || 0}
              onChange={(e) => handleTextChange('taxRate', parseFloat(e.target.value) || 0)}
              margin="normal"
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Shipping Cost"
              type="number"
              value={purchase.shippingCost || 0}
              onChange={(e) => handleTextChange('shippingCost', parseFloat(e.target.value) || 0)}
              margin="normal"
              disabled={saving}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
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
          disabled={saving}
          size="large"
        >
          {saving ? 'Saving...' : 'Save Purchase'}
        </Button>
      </Box>

      {/* Item Selection Dialog */}
      <Dialog open={itemSelectDialogOpen} onClose={handleCloseItemDialog} maxWidth="md" fullWidth>
        <DialogTitle>Select Item</DialogTitle>
        <DialogContent>
          <List>
            {availableItems.map((item) => (
              <ListItem 
                button 
                key={item._id} 
                onClick={() => handleSelectItem(item)}
                divider
              >
                <ListItemAvatar>
                  <Avatar>
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
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseItemDialog} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}