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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  InputAdornment
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { itemsApi, Item } from '../../services/api';

export default function InventoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState<Item>({
    name: '',
    sku: '',
    category: '',
    trackingType: 'quantity',
    quantity: 0,
    weight: 0,
    weightUnit: 'lb',
    price: 0,
    priceType: 'each',
    description: ''
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      try {
        const item = await itemsApi.getById(id);
        setFormData(item);
      } catch (error) {
        console.error('Failed to fetch item:', error);
        setError('Failed to load item. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      fetchItem();
    }
  }, [id, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'weight' || name === 'price' 
        ? parseFloat(value) || 0 
        : value
    });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      if (isEditMode && id) {
        await itemsApi.update(id, formData);
      } else {
        await itemsApi.create(formData);
      }
      navigate('/inventory');
    } catch (error) {
      console.error('Failed to save item:', error);
      setError('Failed to save item. Please try again.');
    } finally {
      setSaving(false);
    }
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
          {isEditMode ? 'Edit Item' : 'Add New Item'}
        </Typography>
        <Button 
          startIcon={<ArrowBack />}
          component={RouterLink}
          to="/inventory"
        >
          Back to Inventory
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Item Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                disabled={saving}
                helperText="Stock Keeping Unit - must be unique"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tracking Type</InputLabel>
                <Select
                  name="trackingType"
                  value={formData.trackingType}
                  label="Tracking Type"
                  onChange={handleSelectChange}
                  disabled={saving}
                >
                  <MenuItem value="quantity">Track by Quantity</MenuItem>
                  <MenuItem value="weight">Track by Weight</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.trackingType === 'quantity' ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  disabled={saving}
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
            ) : (
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    disabled={saving}
                    InputProps={{
                      inputProps: { min: 0, step: 0.01 }
                    }}
                  />
                  <FormControl sx={{ minWidth: 80 }}>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      name="weightUnit"
                      value={formData.weightUnit}
                      label="Unit"
                      onChange={handleSelectChange}
                      disabled={saving}
                    >
                      <MenuItem value="oz">oz</MenuItem>
                      <MenuItem value="lb">lb</MenuItem>
                      <MenuItem value="g">g</MenuItem>
                      <MenuItem value="kg">kg</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                disabled={saving}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Price Type</InputLabel>
                <Select
                  name="priceType"
                  value={formData.priceType}
                  label="Price Type"
                  onChange={handleSelectChange}
                  disabled={saving}
                >
                  <MenuItem value="each">Price per Item</MenuItem>
                  <MenuItem value="per_weight_unit">Price per {formData.weightUnit}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Item'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}