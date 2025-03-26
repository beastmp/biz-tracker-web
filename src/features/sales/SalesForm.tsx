import { useState, useEffect } from 'react';
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
  Chip
} from '@mui/material';
import { Save, ArrowBack, Add, Delete, Image as ImageIcon } from '@mui/icons-material';
import { useSale, useCreateSale, useUpdateSale } from '@hooks/useSales';
import { useItems } from '@hooks/useItems';
import { Sale, SaleItem, Item } from '@custTypes/models';
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

  // Create a lookup object for items for efficient access
  const itemLookup = Object.fromEntries((items || []).map(item => [item._id, item]));

  if (saleLoading || itemsLoading) {
    return <LoadingScreen />;
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
            </Box>
            <Divider sx={{ mb: 2 }} />

            {formData.items && formData.items.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items?.map((item, index) => {
                      const itemDetails = typeof item.item === 'object' ? item.item : itemLookup[item.item as string];
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {itemDetails?.imageUrl ? (
                                <Avatar
                                  src={itemDetails.imageUrl}
                                  alt={itemDetails.name}
                                  variant="rounded"
                                  sx={{ width: 40, height: 40, mr: 1 }}
                                />
                              ) : (
                                <Avatar
                                  variant="rounded"
                                  sx={{ width: 40, height: 40, mr: 1, bgcolor: 'action.hover' }}
                                >
                                  <ImageIcon color="disabled" fontSize="small" />
                                </Avatar>
                              )}
                              <Box>
                                {itemDetails?.name || 'Unknown Item'}
                                {itemDetails?.tags && itemDetails.tags.length > 0 && (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                    {itemDetails.tags.slice(0, 1).map((tag: string) => (
                                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                                    ))}
                                    {itemDetails.tags.length > 1 && (
                                      <Chip label={`+${itemDetails.tags.length - 1}`} size="small" variant="outlined" color="primary" />
                                    )}
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{formatCurrency(item.priceAtSale)}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.priceAtSale * item.quantity)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveItem(index)}
                              disabled={createSale.isPending || updateSale.isPending}
                            >
                              <Delete fontSize="small" />
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
              </Grid2>
            </Box>
          ) : (
            <List sx={{ pt: 0 }}>
              {items
                .filter(item => {
                  // Only show items that have stock available
                  if (item.trackingType === 'quantity') return item.quantity > 0;
                  return item.weight > 0;
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
    </Box>
  );
}
