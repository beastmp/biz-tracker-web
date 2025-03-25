import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
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
  FormHelperText,
  Divider,
  Stack,
  Card,
  CardContent,
  styled,
  Tooltip
} from '@mui/material';
import {
  Save,
  ArrowBack,
  AddPhotoAlternate,
  Close,
  Category,
  Inventory,
  AttachMoney,
  LocalOffer,
  Description,
  Help,
  Label,
  PhotoCamera
} from '@mui/icons-material';
import {
  useItem,
  useCreateItem,
  useUpdateItem,
  useNextSku,
  useCategories,
  useTags
} from '@hooks/useItems';
import { Item } from '@custTypes/models';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';

// Styled components
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function InventoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // React Query hooks
  const { data: existingItem, isLoading: itemLoading, error: itemError } = useItem(id);
  const { data: nextSkuData, isLoading: skuLoading } = useNextSku();
  const { data: categoriesData = [], isLoading: categoriesLoading } = useCategories();
  const { data: tagsData = [], isLoading: tagsLoading } = useTags();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem(id);

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

  // Image handling state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Tags handling state
  const [tags, setTags] = useState<string[]>([]);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing item data if in edit mode or set next SKU for new items
  useEffect(() => {
    if (isEditMode && existingItem) {
      setFormData(existingItem);

      // Set tags if available
      if (existingItem.tags) {
        setTags(existingItem.tags);
      }

      // Set image preview if there's an imageUrl
      if (existingItem.imageUrl) {
        setImagePreview(existingItem.imageUrl);
      }
    } else if (!isEditMode && nextSkuData) {
      setFormData(prev => ({ ...prev, sku: nextSkuData }));
    }
  }, [isEditMode, existingItem, nextSkuData]);

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
    setError(null);

    try {
      // Use FormData to handle file uploads
      const formDataToSend = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'tags' && key !== '_id' && key !== 'lastUpdated' && key !== 'imageUrl') {
          if (typeof value === 'number') {
            formDataToSend.append(key, String(value));
          } else {
            formDataToSend.append(key, String(value));
          }
        }
      });

      // Add tags as JSON string
      formDataToSend.append('tags', JSON.stringify(tags));

      // Add image file if selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      } else if (imagePreview && imagePreview === formData.imageUrl) {
        // If using existing image, send the URL
        formDataToSend.append('imageUrl', formData.imageUrl || '');
      }

      // Debug what's in the form data
      console.log('Form data contents:');
      for (const [key, value] of formDataToSend.entries()) {
        console.log(`${key}: ${value instanceof File ? 'File: ' + value.name : value}`);
      }

      console.log('Submitting form data');

      if (isEditMode && id) {
        await updateItem.mutateAsync(formDataToSend);
      } else {
        await createItem.mutateAsync(formDataToSend);
      }
      navigate('/inventory');
    } catch (err) {
      console.error('Failed to save item:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save item. Please try again.';
      setError(errorMessage);
    }
  };

  // Loading state
  const isLoading = itemLoading || skuLoading || categoriesLoading || tagsLoading;
  const isSaving = createItem.isPending || updateItem.isPending;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (itemError && isEditMode) {
    return <ErrorFallback error={itemError as Error} message="Failed to load item" />;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                component={RouterLink}
                to="/inventory"
                startIcon={<ArrowBack />}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Typography variant="h4" component="h1">
                {isEditMode ? 'Edit Item' : 'Create New Item'}
              </Typography>
            </Box>
          </Grid>
          <Grid item>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={handleSubmit}
              disabled={isSaving}
              size="large"
            >
              {isSaving ? 'Saving...' : 'Save Item'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left column - Main details */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Category sx={{ mr: 1, fontSize: 20 }} />
                Basic Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Item Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isSaving}
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
                    disabled={isSaving}
                    helperText="Stock Keeping Unit - must be unique"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    freeSolo
                    options={categoriesData}
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
                    disabled={isSaving}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Inventory sx={{ mr: 1, fontSize: 20 }} />
                Stock Information
                <Tooltip title="Choose how this item is tracked in your inventory">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <Help fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tracking Type</InputLabel>
                    <Select
                      name="trackingType"
                      value={formData.trackingType}
                      label="Tracking Type"
                      onChange={handleSelectChange}
                      disabled={isSaving}
                    >
                      <MenuItem value="quantity">Track by Quantity</MenuItem>
                      <MenuItem value="weight">Track by Weight</MenuItem>
                    </Select>
                    <FormHelperText>
                      {formData.trackingType === 'quantity'
                        ? 'Track individual units in your inventory'
                        : 'Track the weight of your inventory'}
                    </FormHelperText>
                  </FormControl>
                </Grid>

                {/* Quantity or Weight based fields */}
                {formData.trackingType === 'quantity' ? (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      disabled={isSaving}
                      InputProps={{
                        inputProps: { min: 0 },
                        startAdornment: (
                          <InputAdornment position="start">
                            <Inventory fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                ) : (
                  // Weight tracking section
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Weight"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        disabled={isSaving}
                        InputProps={{
                          inputProps: { min: 0, step: 0.01 },
                          endAdornment: (
                            <InputAdornment position="end">
                              <Select
                                name="weightUnit"
                                value={formData.weightUnit}
                                onChange={handleSelectChange}
                                disabled={isSaving}
                                sx={{ mr: -1 }}
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
                          disabled={isSaving}
                          InputProps={{
                            inputProps: { min: 0 },
                            startAdornment: (
                              <InputAdornment position="start">
                                <Inventory fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                          helperText="Number of items at specified weight"
                        />
                      </Grid>
                    )}
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ mr: 1, fontSize: 20 }} />
                Pricing Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    disabled={isSaving}
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
                      disabled={isSaving}
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
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Description sx={{ mr: 1, fontSize: 20 }} />
                Additional Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={isSaving}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Right column - Image upload and tags */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PhotoCamera sx={{ mr: 1, fontSize: 20 }} />
                Item Image
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {imagePreview ? (
                  <Box sx={{ position: 'relative', width: '100%', mb: 2 }}>
                    <img
                      src={imagePreview}
                      alt="Item preview"
                      style={{
                        width: '100%',
                        maxHeight: '250px',
                        objectFit: 'contain',
                        borderRadius: 8
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255,255,255,0.8)',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.9)',
                        }
                      }}
                      onClick={handleRemoveImage}
                      disabled={isSaving}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #ccc',
                      borderRadius: 2,
                      mb: 2,
                      backgroundColor: theme => theme.palette.grey[50],
                      '&:hover': {
                        backgroundColor: theme => theme.palette.grey[100],
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <AddPhotoAlternate sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Click to upload an image
                    </Typography>
                  </Box>
                )}

                <VisuallyHiddenInput
                  ref={fileInputRef}
                  accept="image/*"
                  type="file"
                  onChange={handleImageChange}
                  disabled={isSaving}
                />

                <Button
                  variant="outlined"
                  component="span"
                  startIcon={imagePreview ? <AddPhotoAlternate /> : <AddPhotoAlternate />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  fullWidth
                >
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </Button>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center', display: 'block' }}>
                  Max file size: 5MB<br/>Supported formats: JPG, PNG, GIF
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Label sx={{ mr: 1, fontSize: 20 }} />
                Tags
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Autocomplete
                multiple
                freeSolo
                options={tagsData}
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
                    helperText="Enter tags to categorize your item"
                  />
                )}
                disabled={isSaving}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
