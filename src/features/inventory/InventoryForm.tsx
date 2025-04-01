import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
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
  Card,
  CardContent,
  Grid2,
  styled,
  Tooltip,
  Paper,
  Checkbox,
  FormControlLabel,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText
} from '@mui/material';
import {
  Save,
  ArrowBack,
  AddPhotoAlternate,
  Close,
  Category,
  Inventory,
  AttachMoney,
  Description,
  Help,
  Label,
  PhotoCamera,
  Add,
  DeleteOutline,
  Search,
  Scale
} from '@mui/icons-material';
import {
  useItem,
  useCreateItem,
  useUpdateItem,
  useNextSku,
  useCategories,
  useTags,
  useItems
} from '@hooks/useItems';
import { Item, TrackingType, PriceType } from '@custTypes/models';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import { get } from '@utils/apiClient';
import { formatCurrency } from '@utils/formatters';

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
    itemType: 'product',
    sellByMeasurement: 'quantity',
    quantity: 0,
    weight: 0,
    weightUnit: 'lb',
    length: 0,
    lengthUnit: 'in',
    area: 0,
    areaUnit: 'sqft',
    volume: 0,
    volumeUnit: 'l',
    price: 0,
    priceType: 'each',
    description: '',
    cost: 0,
    components: []
  });

  // Image handling state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Tags handling state
  const [tags, setTags] = useState<string[]>([]);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Component/Material management state
  const { data: materialsList = [] } = useItems();  // Get all items for materials selection
  const [componentDialogOpen, setComponentDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Item | null>(null);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState('1');
  const [materialWeight, setMaterialWeight] = useState('');
  const [componentsCache, setComponentsCache] = useState<Record<string, Item>>({});

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

  // Initialize components array if needed
  useEffect(() => {
    if (isEditMode && existingItem) {
      // If editing an item and it has components
      if (existingItem.components?.length) {
        // Create a cache of component items for display
        const loadComponents = async () => {
          const cache: Record<string, Item> = {};
          for (const comp of existingItem.components || []) {
            if (typeof comp.item === 'object' && comp.item._id) {
              cache[comp.item._id] = comp.item;
            } else if (typeof comp.item === 'string') {
              try {
                const material = await get<Item>(`/api/items/${comp.item}`);
                cache[comp.item] = material;
              } catch (err) {
                console.error(`Failed to load component ${comp.item}`, err);
              }
            }
          }
          setComponentsCache(cache);
        };
        loadComponents();
      }
    }
  }, [isEditMode, existingItem]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'weight' || name === 'length' ||
        name === 'area' || name === 'volume' || name === 'price' || name === 'cost'
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
    setFormData({ ...formData, imageUrl: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate required fields
      if (!formData.name?.trim()) {
        setError('Item name is required');
        return;
      }

      if (!formData.sku?.trim()) {
        setError('SKU is required');
        return;
      }

      // Only use FormData if we actually have an image file to upload
      if (imageFile) {
        // Use FormData when uploading a new image
        const formDataToSend = new FormData();

        // Add all form fields
        formDataToSend.append('name', formData.name || '');
        formDataToSend.append('sku', formData.sku || '');
        formDataToSend.append('category', formData.category || '');
        formDataToSend.append('trackingType', formData.trackingType || 'quantity');
        formDataToSend.append('itemType', formData.itemType || 'product');
        formDataToSend.append('quantity', String(formData.quantity || 0));
        formDataToSend.append('weight', String(formData.weight || 0));
        formDataToSend.append('weightUnit', formData.weightUnit || 'lb');
        formDataToSend.append('length', String(formData.length || 0));
        formDataToSend.append('lengthUnit', formData.lengthUnit || 'in');
        formDataToSend.append('area', String(formData.area || 0));
        formDataToSend.append('areaUnit', formData.areaUnit || 'sqft');
        formDataToSend.append('volume', String(formData.volume || 0));
        formDataToSend.append('volumeUnit', formData.volumeUnit || 'l');
        formDataToSend.append('price', String(formData.price || 0));
        formDataToSend.append('priceType', formData.priceType || 'each');

        if (formData.description) {
          formDataToSend.append('description', formData.description);
        }

        // Add tags as JSON string
        formDataToSend.append('tags', JSON.stringify(tags || []));

        // Check file size
        if (imageFile.size > 5 * 1024 * 1024) {
          setError('Image file size should be less than 5MB');
          return;
        }

        // Append image
        formDataToSend.append('image', imageFile, imageFile.name);

        // Log form data for debugging
        console.log('Form data contents:');
        for (const pair of formDataToSend.entries()) {
          if (pair[1] instanceof File) {
            console.log(`${pair[0]}: File: ${pair[1].name} (${pair[1].type}, ${pair[1].size} bytes)`);
          } else {
            console.log(`${pair[0]}: ${pair[1]}`);
          }
        }

        if (isEditMode && id) {
          await updateItem.mutateAsync(formDataToSend);
        } else {
          await createItem.mutateAsync(formDataToSend);
        }
      } else {
        // Without an image file, just send a regular JSON object
        const itemData = {
          ...formData,
          tags,
          // Include existing imageUrl if there is one
          ...(imagePreview && formData.imageUrl ? { imageUrl: formData.imageUrl } : {})
        };

        if (isEditMode && id) {
          await updateItem.mutateAsync(itemData);
        } else {
          await createItem.mutateAsync(itemData);
        }
      }

      navigate('/inventory');
    } catch (err) {
      console.error('Failed to save item:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save item. Please try again.';
      setError(errorMessage);
    }
  };

  // Handler for pack info changes
  const handlePackInfoChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      packInfo: {
        // Initialize with default values if packInfo doesn't exist yet
        isPack: false,
        unitsPerPack: 1,
        costPerUnit: 0,
        // Then spread the existing packInfo if it exists
        ...(prev.packInfo || {}),
        // Finally set the new value
        [field]: value
      }
    }));
  };

  // Add a material component to the product
  const handleAddComponent = () => {
    if (!selectedMaterial || !selectedMaterial._id) return;

    const quantity = parseInt(materialQuantity) || 1;
    const weight = materialWeight ? parseFloat(materialWeight) : undefined;

    const newComponent = {
      item: selectedMaterial._id,
      quantity,
      ...(weight ? { weight, weightUnit: selectedMaterial.weightUnit } : {})
    };

    setFormData(prev => ({
      ...prev,
      components: [...(prev.components || []), newComponent]
    }));

    // Update the component cache for easier display
    setComponentsCache(prev => ({
      ...prev,
      [selectedMaterial._id as string]: selectedMaterial
    }));

    // Reset and close dialog
    setSelectedMaterial(null);
    setMaterialQuantity('1');
    setMaterialWeight('');
    setComponentDialogOpen(false);
  };

  // Remove a component from the product
  const handleRemoveComponent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components?.filter((_, i) => i !== index)
    }));
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
        <Grid2 container alignItems="center" spacing={2}>
          <Grid2 size="grow">
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
          </Grid2>
          <Grid2>
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
          </Grid2>
        </Grid2>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid2 container spacing={3}>
        {/* Left column - Main details */}
        <Grid2 size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Category sx={{ mr: 1, fontSize: 20 }} />
                Basic Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid2 container spacing={3}>
                <Grid2 size={{ xs: 12 }}>
                  <TextField
                    required
                    fullWidth
                    label="Item Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                </Grid2>

                <Grid2 size={{ xs: 12, sm: 6 }}>
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
                </Grid2>

                <Grid2 size={{ xs: 12, sm: 6 }}>
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
                </Grid2>

                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Item Type</InputLabel>
                    <Select
                      name="itemType"
                      value={formData.itemType || 'product'}
                      label="Item Type"
                      onChange={handleSelectChange}
                      disabled={isSaving}
                    >
                      <MenuItem value="product">Finished Product</MenuItem>
                      <MenuItem value="material">Raw Material</MenuItem>
                      <MenuItem value="both">Both (Material & Product)</MenuItem>
                    </Select>
                    <FormHelperText>
                      Products are items you sell. Materials are used to create products.
                    </FormHelperText>
                  </FormControl>
                </Grid2>

                {/* Pack Information Section */}
                {(formData.itemType === 'material' || formData.itemType === 'both') && (
                  <Grid2 size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default', borderLeft: '4px solid', borderColor: 'primary.main' }}>
                      <Typography variant="subtitle2" gutterBottom>Pack Information</Typography>

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!formData.packInfo?.isPack}
                            onChange={(e) => handlePackInfoChange('isPack', e.target.checked)}
                            disabled={isSaving}
                          />
                        }
                        label="Purchased as Pack"
                      />

                      {formData.packInfo?.isPack && (
                        <Grid2 container spacing={2} sx={{ mt: 1 }}>
                          <Grid2 size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Units Per Pack"
                              value={formData.packInfo?.unitsPerPack || 1}
                              onChange={(e) => handlePackInfoChange('unitsPerPack', parseInt(e.target.value) || 1)}
                              disabled={isSaving}
                              InputProps={{ inputProps: { min: 1 } }}
                            />
                          </Grid2>
                          <Grid2 size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Cost Per Unit"
                              value={formData.packInfo?.costPerUnit || 0}
                              onChange={(e) => handlePackInfoChange('costPerUnit', parseFloat(e.target.value) || 0)}
                              disabled={isSaving}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                inputProps: { min: 0, step: 0.01 }
                              }}
                            />
                          </Grid2>
                        </Grid2>
                      )}
                    </Paper>
                  </Grid2>
                )}

                {/* Components Management - only show for products */}
                {(formData.itemType === 'product' || formData.itemType === 'both') && (
                  <Grid2 size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default', borderLeft: '4px solid', borderColor: 'secondary.main' }}>
                      <Typography variant="subtitle2" gutterBottom>Materials Used in This Product</Typography>

                      <Box sx={{ mb: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Add />}
                          onClick={() => setComponentDialogOpen(true)}
                        >
                          Add Material
                        </Button>
                      </Box>

                      {formData.components && formData.components.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Material</TableCell>
                                <TableCell align="center">Quantity</TableCell>
                                <TableCell align="right">Cost</TableCell>
                                <TableCell align="right">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {formData.components.map((component, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    {typeof component.item === 'string'
                                      ? componentsCache[component.item]?.name || component.item
                                      : component.item.name || 'Unknown Material'}
                                  </TableCell>
                                  <TableCell align="center">
                                    {component.quantity} {component.weight && `× ${component.weight}${component.weightUnit || 'lb'}`}
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(
                                      typeof component.item === 'string'
                                        ? (componentsCache[component.item]?.cost || 0) * component.quantity
                                        : (component.item.cost || 0) * component.quantity
                                    )}
                                  </TableCell>
                                  <TableCell align="right">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleRemoveComponent(index)}
                                    >
                                      <DeleteOutline fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                            <TableFooter>
                              <TableRow>
                                <TableCell colSpan={2} align="right">
                                  <Typography variant="subtitle2">Total Material Cost:</Typography>
                                </TableCell>
                                <TableCell align="right" colSpan={2}>
                                  <Typography variant="subtitle2" color="primary">
                                    {formatCurrency(
                                      (formData.components || []).reduce(
                                        (sum, comp) => {
                                          const cost = typeof comp.item === 'string'
                                            ? (componentsCache[comp.item]?.cost || 0)
                                            : (comp.item.cost || 0);
                                          return sum + (cost * comp.quantity);
                                        },
                                        0
                                      )
                                    )}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            </TableFooter>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          No materials added to this product yet.
                        </Typography>
                      )}
                    </Paper>
                  </Grid2>
                )}
              </Grid2>
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

              <Grid2 container spacing={3}>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Tracking Type</InputLabel>
                    <Select
                      name="trackingType"
                      value={formData.trackingType}
                      label="Tracking Type"
                      onChange={(e) => {
                        const newTrackingType = e.target.value as TrackingType;
                        handleSelectChange(e);
                        // Adjust price type based on tracking type
                        if (newTrackingType !== 'quantity' && formData.priceType === 'each') {
                          setFormData(prev => ({
                            ...prev,
                            trackingType: newTrackingType,
                            priceType: `per_${newTrackingType}_unit` as PriceType
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            trackingType: newTrackingType
                          }));
                        }
                      }}
                      disabled={isSaving}
                    >
                      <MenuItem value="quantity">Track by Quantity</MenuItem>
                      <MenuItem value="weight">Track by Weight</MenuItem>
                      <MenuItem value="length">Track by Length</MenuItem>
                      <MenuItem value="area">Track by Area</MenuItem>
                      <MenuItem value="volume">Track by Volume</MenuItem>
                    </Select>
                    <FormHelperText>
                      {formData.trackingType === 'quantity'
                        ? 'Track individual units in your inventory'
                        : formData.trackingType === 'weight'
                          ? 'Track the weight of your inventory'
                          : formData.trackingType === 'length'
                            ? 'Track the length of your inventory'
                            : formData.trackingType === 'area'
                              ? 'Track the area of your inventory'
                              : 'Track the volume of your inventory'}
                    </FormHelperText>
                  </FormControl>
                </Grid2>

                {/* Quantity tracking */}
                {formData.trackingType === 'quantity' && (
                  <Grid2 size={{ xs: 12, sm: 6 }}>
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
                  </Grid2>
                )}

                {/* Weight tracking */}
                {formData.trackingType === 'weight' && (
                  <>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
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
                    </Grid2>

                    {/* Add quantity field when price type is "each" */}
                    {formData.priceType === 'each' && (
                      <Grid2 size={{ xs: 12, sm: 6 }}>
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
                      </Grid2>
                    )}
                  </>
                )}

                {/* Length tracking */}
                {formData.trackingType === 'length' && (
                  <>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Length"
                        name="length"
                        value={formData.length}
                        onChange={handleInputChange}
                        disabled={isSaving}
                        InputProps={{
                          inputProps: { min: 0, step: 0.01 },
                          endAdornment: (
                            <InputAdornment position="end">
                              <Select
                                name="lengthUnit"
                                value={formData.lengthUnit}
                                onChange={handleSelectChange}
                                disabled={isSaving}
                                sx={{ mr: -1 }}
                              >
                                <MenuItem value="mm">mm</MenuItem>
                                <MenuItem value="cm">cm</MenuItem>
                                <MenuItem value="m">m</MenuItem>
                                <MenuItem value="in">in</MenuItem>
                                <MenuItem value="ft">ft</MenuItem>
                                <MenuItem value="yd">yd</MenuItem>
                              </Select>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid2>

                    {/* Add quantity field when price type is "each" */}
                    {formData.priceType === 'each' && (
                      <Grid2 size={{ xs: 12, sm: 6 }}>
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
                          helperText="Number of items at specified length"
                        />
                      </Grid2>
                    )}
                  </>
                )}

                {/* Area tracking */}
                {formData.trackingType === 'area' && (
                  <>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Area"
                        name="area"
                        value={formData.area}
                        onChange={handleInputChange}
                        disabled={isSaving}
                        InputProps={{
                          inputProps: { min: 0, step: 0.01 },
                          endAdornment: (
                            <InputAdornment position="end">
                              <Select
                                name="areaUnit"
                                value={formData.areaUnit}
                                onChange={handleSelectChange}
                                disabled={isSaving}
                                sx={{ mr: -1 }}
                              >
                                <MenuItem value="sqft">sq ft</MenuItem>
                                <MenuItem value="sqm">sq m</MenuItem>
                                <MenuItem value="sqyd">sq yd</MenuItem>
                                <MenuItem value="acre">acre</MenuItem>
                                <MenuItem value="ha">ha</MenuItem>
                              </Select>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid2>

                    {/* Add quantity field when price type is "each" */}
                    {formData.priceType === 'each' && (
                      <Grid2 size={{ xs: 12, sm: 6 }}>
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
                          helperText="Number of items at specified area"
                        />
                      </Grid2>
                    )}
                  </>
                )}

                {/* Volume tracking */}
                {formData.trackingType === 'volume' && (
                  <>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Volume"
                        name="volume"
                        value={formData.volume}
                        onChange={handleInputChange}
                        disabled={isSaving}
                        InputProps={{
                          inputProps: { min: 0, step: 0.01 },
                          endAdornment: (
                            <InputAdornment position="end">
                              <Select
                                name="volumeUnit"
                                value={formData.volumeUnit}
                                onChange={handleSelectChange}
                                disabled={isSaving}
                                sx={{ mr: -1 }}
                              >
                                <MenuItem value="ml">ml</MenuItem>
                                <MenuItem value="l">l</MenuItem>
                                <MenuItem value="gal">gal</MenuItem>
                                <MenuItem value="floz">fl oz</MenuItem>
                                <MenuItem value="cu_ft">cu ft</MenuItem>
                                <MenuItem value="cu_m">cu m</MenuItem>
                              </Select>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid2>

                    {/* Add quantity field when price type is "each" */}
                    {formData.priceType === 'each' && (
                      <Grid2 size={{ xs: 12, sm: 6 }}>
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
                          helperText="Number of items at specified volume"
                        />
                      </Grid2>
                    )}
                  </>
                )}
              </Grid2>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ mr: 1, fontSize: 20 }} />
                Pricing Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid2 container spacing={3}>
                <Grid2 size={{ xs: 12, sm: 6 }}>
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
                    helperText="Sale price for customers"
                  />
                </Grid2>

                {/* Add this new Cost field */}
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cost"
                    name="cost"
                    value={formData.cost || 0}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    InputProps={{
                      inputProps: { min: 0, step: 0.01 },
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText="Your purchase cost/wholesale price"
                  />
                </Grid2>

                <Grid2 size={{ xs: 12, sm: 6 }}>
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
                          setFormData(prev => ({ ...prev, quantity: 1 }));
                        }
                      }}
                      disabled={isSaving}
                    >
                      <MenuItem value="each">Price per Item</MenuItem>
                      {formData.trackingType === 'weight' && (
                        <MenuItem value="per_weight_unit">Price per {formData.weightUnit}</MenuItem>
                      )}
                      {formData.trackingType === 'length' && (
                        <MenuItem value="per_length_unit">Price per {formData.lengthUnit}</MenuItem>
                      )}
                      {formData.trackingType === 'area' && (
                        <MenuItem value="per_area_unit">Price per {formData.areaUnit}</MenuItem>
                      )}
                      {formData.trackingType === 'volume' && (
                        <MenuItem value="per_volume_unit">Price per {formData.volumeUnit}</MenuItem>
                      )}
                    </Select>
                    <FormHelperText>
                      {formData.trackingType === 'quantity'
                        ? 'Price for each individual unit'
                        : formData.priceType === 'each'
                          ? 'Price for each package/unit of this measurement'
                          : formData.trackingType === 'weight'
                            ? `Price per ${formData.weightUnit} of this item`
                            : formData.trackingType === 'length'
                              ? `Price per ${formData.lengthUnit} of this item`
                              : formData.trackingType === 'area'
                                ? `Price per ${formData.areaUnit} of this item`
                                : `Price per ${formData.volumeUnit} of this item`}
                    </FormHelperText>
                  </FormControl>
                </Grid2>

                <Grid2 size={{ xs: 12 }}>
                  <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" gutterBottom>Markup Information</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2">Markup:</Typography>
                      <Typography variant="body1" fontWeight="medium" color={
                        formData.price > (formData.cost || 0) ? 'success.main' : 'error.main'
                      }>
                        {formData.cost ? `${Math.round((formData.price / formData.cost - 1) * 100)}%` : 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="body2">Profit per Unit:</Typography>
                      <Typography variant="body1" fontWeight="medium" color={
                        formData.price > (formData.cost || 0) ? 'success.main' : 'error.main'
                      }>
                        {formatCurrency(formData.price - (formData.cost || 0))}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid2>
              </Grid2>
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
        </Grid2>

        {/* Right column - Image upload and tags */}
        <Grid2 size={{ xs: 12, md: 4 }}>
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
                  Max file size: 5MB<br />Supported formats: JPG, PNG, GIF
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
        </Grid2>
      </Grid2>

      {/* Material Component Selection Dialog */}
      <Dialog
        open={componentDialogOpen}
        onClose={() => setComponentDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Add Material to Product
        </DialogTitle>
        <DialogContent dividers>
          {!selectedMaterial ? (
            <>
              <TextField
                fullWidth
                label="Search Materials"
                value={materialSearchQuery}
                onChange={(e) => setMaterialSearchQuery(e.target.value)}
                margin="normal"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />

              <List sx={{ mt: 2 }}>
                {materialsList
                  .filter(mat => mat.itemType === 'material' || mat.itemType === 'both')
                  .filter(mat =>
                    mat.name.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
                    mat.sku.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
                    (mat.tags && mat.tags.some(tag => tag.toLowerCase().includes(materialSearchQuery.toLowerCase())))
                  )
                  .map(material => (
                    <ListItem
                      key={material._id}
                      onClick={() => {
                        setSelectedMaterial(material);
                        setMaterialQuantity('1');
                        setMaterialWeight('');
                      }}
                      sx={{ cursor: 'pointer' }}
                    >
                      <ListItemAvatar>
                        <Avatar src={material.imageUrl || undefined}>
                          <Category />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={material.name}
                        secondary={`SKU: ${material.sku} | Cost: ${formatCurrency(material.cost || 0)}`}
                      />
                    </ListItem>
                  ))
                }
              </List>
            </>
          ) : (
            <Box>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => setSelectedMaterial(null)}
                sx={{ mb: 2 }}
              >
                Back to Materials List
              </Button>

              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid2 container spacing={2} alignItems="center">
                  <Grid2 size={{ xs: 2 }}>
                    {selectedMaterial.imageUrl ? (
                      <Avatar
                        src={selectedMaterial.imageUrl}
                        variant="rounded"
                        sx={{ width: 60, height: 60 }}
                      />
                    ) : (
                      <Avatar
                        variant="rounded"
                        sx={{ width: 60, height: 60 }}
                      >
                        <Category />
                      </Avatar>
                    )}
                  </Grid2>
                  <Grid2 size={{ xs: 10 }}>
                    <Typography variant="h6">{selectedMaterial.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      SKU: {selectedMaterial.sku} | Cost: {formatCurrency(selectedMaterial.cost || 0)}
                    </Typography>
                  </Grid2>
                </Grid2>
              </Paper>

              <Typography variant="subtitle2" gutterBottom>
                Specify Amount:
              </Typography>

              <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={materialQuantity}
                    onChange={(e) => setMaterialQuantity(e.target.value)}
                    InputProps={{
                      inputProps: { min: 1 },
                      startAdornment: (
                        <InputAdornment position="start">
                          <Inventory fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid2>

                {selectedMaterial.trackingType === 'weight' && (
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={`Weight per Unit (${selectedMaterial.weightUnit})`}
                      type="number"
                      value={materialWeight}
                      onChange={(e) => setMaterialWeight(e.target.value)}
                      InputProps={{
                        inputProps: { min: 0, step: 0.1 },
                        startAdornment: (
                          <InputAdornment position="start">
                            <Scale fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            {selectedMaterial.weightUnit}
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid2>
                )}
              </Grid2>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Total Cost: <strong>{formatCurrency((selectedMaterial.cost || 0) * parseInt(materialQuantity || '0'))}</strong>
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComponentDialogOpen(false)}>Cancel</Button>
          {selectedMaterial && (
            <Button
              variant="contained"
              onClick={handleAddComponent}
              color="primary"
            >
              Add to Product
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
