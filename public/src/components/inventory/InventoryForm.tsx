 
import { useState, useEffect, useRef } from 'react';
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
  InputAdornment,
  IconButton,
  Chip,
  Autocomplete,
  FormHelperText
} from '@mui/material';
import { Save, ArrowBack, AddPhotoAlternate, Close } from '@mui/icons-material';
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

  // New state for image handling
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // New state for tag handling
  const [tags, setTags] = useState<string[]>([]);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New states for categories and tags
  const [categories, setCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;

      try {
        const item = await itemsApi.getById(id);
        setFormData(item);

        // Set tags if available
        if (item.tags) {
          setTags(item.tags);
        }

        // Set image preview if there's an imageUrl
        if (item.imageUrl) {
          setImagePreview(item.imageUrl);
        }
      } catch (error) {
        console.error('Failed to fetch item:', error);
        setError('Failed to load item. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        let categoriesData: string[] = [];
        let tagsData: string[] = [];

        // Fetch categories and tags separately with error handling
        try {
          categoriesData = await itemsApi.getCategories();
        } catch (err) {
          console.error('Error fetching categories:', err);
          // Continue with empty categories
        }

        try {
          tagsData = await itemsApi.getTags();
        } catch (err) {
          console.error('Error fetching tags:', err);
          // Continue with empty tags
        }

        setCategories(categoriesData);
        setAllTags(tagsData);

        if (!isEditMode) {
          try {
            // Get next available SKU for new items
            const nextSku = await itemsApi.getNextSku();
            setFormData(prev => ({ ...prev, sku: nextSku }));
          } catch (err) {
            console.error('Error fetching next SKU:', err);
            // Set a default SKU
            setFormData(prev => ({ ...prev, sku: "0000000001" }));
          }
        } else if (id) {
          // Fetch existing item data for edit
          try {
            const itemData = await itemsApi.getById(id);
            setFormData(itemData);
          } catch (err) {
            console.error('Error fetching item data:', err);
            setError('Failed to load item data. Please try again.');
          }
        }
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError('Failed to load form data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      fetchItem();
    }
    fetchData();
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

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({...formData, imageUrl: undefined});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Use FormData to handle file uploads
      const formDataToSend = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'tags') {
          formDataToSend.append(key, String(value));
        }
      });

      // Add tags as JSON string
      formDataToSend.append('tags', JSON.stringify(tags));

      // Add image file if selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (isEditMode && id) {
        await itemsApi.update(id, formDataToSend);
      } else {
        await itemsApi.create(formDataToSend);
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
            {/* Existing form fields */}
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
              <Autocomplete
                freeSolo
                options={categories}
                value={formData.category || ''}
                onChange={(_, newValue) => {
                  setFormData(prev => ({ ...prev, category: newValue || '' }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    name="category"
                    onChange={handleInputChange}
                  />
                )}
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
              // Weight tracking section
              <>
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

                {/* Add quantity field when price type is "each" */}
                {formData.priceType === 'each' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantity (# of items)"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      disabled={saving}
                      InputProps={{
                        inputProps: { min: 0 }
                      }}
                      helperText="Number of items at specified weight"
                    />
                  </Grid>
                )}
              </>
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
                  onChange={(e) => {
                    handleSelectChange(e);
                    // Reset quantity to 1 when switching price types for weight-tracked items
                    if (formData.trackingType === 'weight' && e.target.value === 'each' && (!formData.quantity || formData.quantity === 0)) {
                      setFormData(prev => ({...prev, quantity: 1}));
                    }
                  }}
                  disabled={saving}
                >
                  <MenuItem value="each">Price per Item</MenuItem>
                  <MenuItem value="per_weight_unit">Price per {formData.weightUnit}</MenuItem>
                </Select>
                <FormHelperText>
                  {formData.trackingType === 'weight' && formData.priceType === 'each'
                    ? 'Price for each package/unit of this weight'
                    : formData.trackingType === 'weight'
                      ? `Price per ${formData.weightUnit} of this item`
                      : 'Price for each individual unit'}
                </FormHelperText>
              </FormControl>
            </Grid>

            {/* Image Upload Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Item Image
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {imagePreview ? (
                  <Box sx={{ position: 'relative', width: 150, height: 150, mr: 2 }}>
                    <img
                      src={imagePreview}
                      alt="Item preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                    />
                    <IconButton
                      size="small"
                      sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}
                      onClick={handleRemoveImage}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 150,
                      height: 150,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed #ccc',
                      borderRadius: 1,
                      mr: 2
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" align="center">
                      No image<br />selected
                    </Typography>
                  </Box>
                )}

                <Box>
                  <input
                    ref={fileInputRef}
                    accept="image/*"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                    disabled={saving}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<AddPhotoAlternate />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </Button>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Max file size: 5MB. Supported formats: JPG, PNG, GIF
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Tags Input Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Tags
              </Typography>
              <Autocomplete
                multiple
                freeSolo
                options={allTags}
                value={tags}
                onChange={(_, newValue) => {
                  setTags(newValue);
                }}
                renderTags={(value, getTagProps) =>
                  value.map((tag, index) => (
                    <Chip
                      label={tag}
                      {...getTagProps({ index })}
                      key={index}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags"
                  />
                )}
                disabled={saving}
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