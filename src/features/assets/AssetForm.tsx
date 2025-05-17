import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Divider,
  Card,
  CardContent,
  InputAdornment,
  Alert,
  Autocomplete,
  Chip,
  styled
} from '@mui/material';
import {
  ArrowBack,
  Save,
  BusinessCenter,
  AttachMoney,
  Add,
  Category,
  Description,
  PhotoCamera,
  Close,
  AddPhotoAlternate
} from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useAsset, useCreateAsset, useUpdateAsset } from '@hooks/useAssets';
import { BusinessAsset } from '@custTypes/models';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import { useImageUpload } from "../../hooks/useImageUpload";

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

export default function AssetForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // React Query hooks
  const { data: existingAsset, isLoading: assetLoading, error: assetError } = useAsset(id);
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset(id);
  const uploadImage = useImageUpload("assets");

  // Form state
  const [formData, setFormData] = useState<Partial<BusinessAsset>>({
    name: '',
    category: '',
    status: 'active',
    initialCost: 0,
    currentValue: 0,
    isInventoryItem: false,
    tags: []
  });

  // Image handling state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Tags handling state
  const [tags, setTags] = useState<string[]>([]);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing asset data if in edit mode
  useEffect(() => {
    if (isEditMode && existingAsset) {
      setFormData(existingAsset);

      // Set tags if available
      if (existingAsset.tags) {
        setTags(existingAsset.tags);
      }

      // Set image preview if there's an imageUrl
      if (existingAsset.imageUrl) {
        setImagePreview(existingAsset.imageUrl);
      }
    }
  }, [isEditMode, existingAsset]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'initialCost' || name === 'currentValue'
        ? parseFloat(value) || 0
        : value
    });

    // If updating initialCost and we're creating a new asset,
    // also update currentValue to match
    if (name === 'initialCost' && !isEditMode) {
      setFormData(prev => ({
        ...prev,
        initialCost: parseFloat(value) || 0,
        currentValue: parseFloat(value) || 0
      }));
    }
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
        setError("Asset name is required");
        return;
      }

      if (!formData.category?.trim()) {
        setError("Category is required");
        return;
      }

      // Add tags to formData
      const assetData = {
        ...formData,
        tags
      };

      // Only handle image separately if we have a new image file
      if (imageFile) {
        try {
          // For new assets, first create the asset, then update with image
          if (!isEditMode) {
            // Create asset first without image
            const newAsset = await createAsset.mutateAsync(assetData);

            // Then upload image
            if (!newAsset._id) throw new Error("Asset ID is missing");
            const imageUrl = await uploadImage.mutateAsync({
              file: imageFile,
              id: newAsset._id
            });

            // We're done since the image endpoint already updates the asset
            console.log("New asset created with image:", imageUrl);
            navigate("/assets");
            return;
          } else if (id) {
            // For existing assets, upload the image first
            const imageUrl = await uploadImage.mutateAsync({
              file: imageFile,
              id
            });

            // The image is now updated on the server, no need to include it again
            console.log("Asset image updated:", imageUrl);
            navigate("/assets");
            return;
          }
        } catch (imgError) {
          console.error("Failed to upload image:", imgError);
          const errorMessage = imgError instanceof Error
            ? imgError.message
            : "Failed to upload image. Please try again.";
          setError(errorMessage);
          return;
        }
      } else {
        // No image to upload, just update the asset data
        if (isEditMode && id) {
          await updateAsset.mutateAsync(assetData);
        } else {
          await createAsset.mutateAsync(assetData);
        }
      }

      navigate("/assets");
    } catch (err) {
      console.error("Failed to save asset:", err);
      const errorMessage = err instanceof Error
        ? err.message
        : "Failed to save asset. Please try again.";
      setError(errorMessage);
    }
  };

  // Loading state
  const isLoading = assetLoading;
  const isSaving = createAsset.isPending || updateAsset.isPending;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (assetError && isEditMode) {
    return <ErrorFallback error={assetError as Error} message="Failed to load asset" />;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid size="grow">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                component={RouterLink}
                to="/assets"
                startIcon={<ArrowBack />}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Typography variant="h4" component="h1">
                {isEditMode ? 'Edit Asset' : 'Add New Asset'}
              </Typography>
            </Box>
          </Grid>
          <Grid>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={handleSubmit}
              disabled={isSaving}
              size="large"
            >
              {isSaving ? 'Saving...' : 'Save Asset'}
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
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <BusinessCenter sx={{ mr: 1, fontSize: 20 }} />
                Basic Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    required
                    fullWidth
                    label="Asset Name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Asset Tag"
                    name="assetTag"
                    value={formData.assetTag || ''}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    helperText="Unique identifier for this asset"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    fullWidth
                    label="Category"
                    name="category"
                    value={formData.category || ''}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    helperText="E.g. Equipment, Furniture, Computer, Vehicle"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status || 'active'}
                      label="Status"
                      onChange={handleSelectChange}
                      disabled={isSaving}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                      <MenuItem value="retired">Retired</MenuItem>
                      <MenuItem value="lost">Lost</MenuItem>
                    </Select>
                    <FormHelperText>
                      Current status of the asset
                    </FormHelperText>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Purchase Date"
                    name="purchaseDate"
                    value={formData.purchaseDate ? new Date(formData.purchaseDate).toISOString().split('T')[0] : ''}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ mr: 1, fontSize: 20 }} />
                Financial Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Initial Cost"
                    name="initialCost"
                    value={formData.initialCost || 0}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    InputProps={{
                      inputProps: { min: 0, step: 0.01 },
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText="Original purchase price"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Current Value"
                    name="currentValue"
                    value={formData.currentValue || 0}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    InputProps={{
                      inputProps: { min: 0, step: 0.01 },
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText="Present value of the asset"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Category sx={{ mr: 1, fontSize: 20 }} />
                Asset Details
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    helperText="Where the asset is stored/used"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Assigned To"
                    name="assignedTo"
                    value={formData.assignedTo || ''}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    helperText="Person responsible for this asset"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer || ''}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Model"
                    name="model"
                    value={formData.model || ''}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Serial Number"
                    name="serialNumber"
                    value={formData.serialNumber || ''}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    helperText="Unique manufacturer serial number"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Maintenance Schedule */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <BusinessCenter sx={{ mr: 1, fontSize: 20 }} />
                Maintenance Schedule
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Maintenance Frequency</InputLabel>
                    <Select
                      name="maintenanceSchedule.frequency"
                      value={formData.maintenanceSchedule?.frequency || 'monthly'}
                      label="Maintenance Frequency"
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          maintenanceSchedule: {
                            ...(formData.maintenanceSchedule || {}),
                            frequency: e.target.value as any
                          }
                        });
                      }}
                      disabled={isSaving}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                    <FormHelperText>
                      How often this asset requires maintenance
                    </FormHelperText>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Last Maintenance Date"
                    value={
                      formData.maintenanceSchedule?.lastMaintenance
                      ? new Date(formData.maintenanceSchedule.lastMaintenance).toISOString().split('T')[0]
                      : ''
                    }
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        maintenanceSchedule: {
                          ...(formData.maintenanceSchedule || { frequency: 'monthly' }),
                          lastMaintenance: new Date(e.target.value)
                        }
                      });
                    }}
                    disabled={isSaving}
                    InputLabelProps={{ shrink: true }}
                    helperText="When was maintenance last performed"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Description sx={{ mr: 1, fontSize: 20 }} />
                Notes
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                disabled={isSaving}
                placeholder="Enter any additional information about this asset..."
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Right column - Image upload and tags */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PhotoCamera sx={{ mr: 1, fontSize: 20 }} />
                Asset Image
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {imagePreview ? (
                  <Box sx={{ position: 'relative', width: '100%', mb: 2 }}>
                    <img
                      src={imagePreview}
                      alt="Asset preview"
                      style={{
                        width: '100%',
                        maxHeight: '250px',
                        objectFit: 'contain',
                        borderRadius: 8
                      }}
                    />
                    <Button
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
                    </Button>
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
                <Add sx={{ mr: 1, fontSize: 20 }} />
                Tags
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Autocomplete
                multiple
                freeSolo
                options={[]}
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
                    helperText="Enter tags to categorize your asset"
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
