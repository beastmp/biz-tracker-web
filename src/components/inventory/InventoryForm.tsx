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
  InputAdornment
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { itemsApi, Item } from '../../services/api';

export default function InventoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState<Omit<Item, '_id'>>({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    price: 0,
    description: ''
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (id) {
        try {
          const data = await itemsApi.getById(id);
          setFormData({
            name: data.name,
            sku: data.sku,
            category: data.category,
            quantity: data.quantity,
            price: data.price,
            description: data.description || ''
          });
        } catch (error) {
          console.error('Failed to fetch item:', error);
          setError('Failed to load item details. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    if (isEditMode) {
      fetchItem();
    }
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' 
        ? parseFloat(value) || 0
        : value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.sku.trim()) return 'SKU is required';
    if (!formData.category.trim()) return 'Category is required';
    if (formData.quantity < 0) return 'Quantity cannot be negative';
    if (formData.price < 0) return 'Price cannot be negative';
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
        await itemsApi.update(id, formData);
      } else {
        await itemsApi.create(formData);
      }
      navigate('/inventory');
    } catch (error) {
      console.error('Failed to save item:', error);
      setError('Failed to save item. Please try again.');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Item' : 'Add New Item'}
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={() => navigate('/inventory')}
        >
          Back to List
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                disabled={saving || isEditMode}
                helperText={isEditMode ? "SKU cannot be changed after creation" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                required
                type="number"
                label="Quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                inputProps={{ min: 0, step: 1 }}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                required
                type="number"
                label="Price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01 }}
                disabled={saving}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  type="submit"
                  startIcon={<Save />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Item'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}