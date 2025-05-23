import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  Chip,
  Card,
  CardContent,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  NoPhotography,
  Inventory,
  AttachMoney,
  Category,
  LocalOffer,
  Scale,
  CalendarToday,
  Money,
  ShoppingCart,
  LocalShipping,
  Transform,
  StackedBarChart,
  ExpandMore,
  Receipt,
  Straighten, // Add new icon for length
  SquareFoot, // Add new icon for area
  ViewInAr // Add new icon for volume
} from '@mui/icons-material';
import { useItem, useDeleteItem, useDerivedItems, useRebuildItemInventory } from '@hooks/useItems';
import { useItemPurchases } from '@hooks/usePurchases';
import { useItemSales } from '@hooks/useSales';
import { formatCurrency } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import { useSettings } from '@hooks/useSettings';
import { isPopulatedItem, Item } from '@custTypes/models';
import { JSX, useMemo } from 'react';
import BreakdownItemsDialog from '@components/inventory/BreakdownItemsDialog';

export default function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item, isLoading, error } = useItem(id);
  const { data: derivedItems = [], isLoading: derivedItemsLoading } = useDerivedItems(id);
  const deleteItem = useDeleteItem();
  const { settings } = useSettings();

  // Add hooks for related purchases and sales
  const {
    data: relatedPurchases = [],
    isLoading: purchasesLoading
  } = useItemPurchases(id);

  const {
    data: relatedSales = [],
    isLoading: salesLoading
  } = useItemSales(id);

  // Add rebuild inventory hook
  const rebuildItemInventory = useRebuildItemInventory(id);

  // Add breakdown dialog state
  const [breakdownDialogOpen, setBreakdownDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const data = item;

  // Handle successful item breakdown
  const handleItemsCreated = (items: Item[]) => {
    // Log each created item for debugging
    console.log(`Created ${items.length} derived items:`, items.map(item => ({
      id: item._id,
      name: item.name,
      hasDerivedFrom: !!item.derivedFrom,
      derivedFromItem: item.derivedFrom?.item
    })));

    setSuccessMessage(`Successfully created ${items.length} items from ${data?.name}`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await deleteItem.mutateAsync(id);
      navigate('/inventory');
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  // Add handler for rebuilding inventory
  const handleRebuildInventory = async () => {
    if (!id) return;

    try {
      const result = await rebuildItemInventory.mutateAsync();
      if (result.updated) {
        setSuccessMessage(`Successfully rebuilt inventory for ${data?.name}`);
      } else {
        setSuccessMessage(`No changes needed for ${data?.name}`);
      }
    } catch (error) {
      console.error('Failed to rebuild inventory:', error);
      setSuccessMessage('Failed to rebuild inventory. Please try again.');
    }
  };

  // Update inventory value calculation to handle all tracking types
  const inventoryValue = useMemo(() => {
    if (!data) return 0;

    switch (data?.trackingType) {
      case 'quantity':
        return (data?.price || 0) * (data?.quantity || 0);
      case 'weight':
        return data?.priceType === 'each'
            ? (data?.price || 0) * (data?.quantity || 0)
            : (data?.price || 0) * (data?.weight || 0);
      case 'length':
        return data?.priceType === 'each'
            ? (data?.price || 0) * (data?.quantity || 0)
            : (data?.price || 0) * (data?.length || 0);
      case 'area':
        return data?.priceType === 'each'
            ? (data?.price || 0) * (data?.quantity || 0)
            : (data?.price || 0) * (data?.area || 0);
      case 'volume':
        return data?.priceType === 'each'
            ? (data?.price || 0) * (data?.quantity || 0)
            : (data?.price || 0) * (data?.volume || 0);
      default:
        return (data?.price || 0) * (data?.quantity || 0);
    }
  }, [data]);

  // Update the getStockStatusColor function to properly handle all tracking types
  const getStockStatusColor = (item: typeof data): 'success' | 'warning' | 'error' => {
    if (!item) return 'success';

    switch (item.trackingType) {
      case 'quantity':
        if ((item.quantity || 0) === 0) return 'error';
        if (!settings.lowStockAlertsEnabled) return 'success';
        if ((item.quantity || 0) < settings.quantityThreshold) return 'warning';
        return 'success';

      case 'weight': {
        if ((item.weight || 0) === 0) return 'error';
        if (!settings.lowStockAlertsEnabled) return 'success';

        // Different thresholds based on weight unit
        const weightLowThreshold =
          item.weightUnit === 'kg' ? settings.weightThresholds.kg :
            item.weightUnit === 'g' ? settings.weightThresholds.g :
              item.weightUnit === 'lb' ? settings.weightThresholds.lb :
                item.weightUnit === 'oz' ? settings.weightThresholds.oz : 5;

        if ((item.weight || 0) < weightLowThreshold) return 'warning';
        return 'success';
      }
      case 'length':
        if ((item.length || 0) === 0) return 'error';
        return 'success';

      case 'area':
        if ((item.area || 0) === 0) return 'error';
        return 'success';

      case 'volume':
        if ((item.volume || 0) === 0) return 'error';
        return 'success';

      default:
        return 'success';
    }
  };

  // Shared function to render related items (used for both materials and products)
  const renderRelatedItem = (
    item: string | Item | null | undefined,
    index: number,
    extraContent?: JSX.Element
  ) => {
    const isPopulated = isPopulatedItem(item);
    const itemId = isPopulated ? item._id : (typeof item === 'string' ? item : '');
    const itemName = isPopulated ? item.name : 'Unknown Item';
    const itemImage = isPopulated && item.imageUrl ? item.imageUrl : '/placeholder.png';

    return (
      <Box
        key={itemId?.toString() || index.toString()}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={itemImage}
            alt={itemName}
            style={{
              width: 40,
              height: 40,
              borderRadius: 4,
              marginRight: 16,
              objectFit: 'cover',
              background: '#f5f5f5'
            }}
          />
          <Box>
            {itemId ? (
              <RouterLink
                to={`/inventory/${itemId}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Typography variant="subtitle1">{itemName}</Typography>
              </RouterLink>
            ) : (
              <Typography variant="subtitle1">{itemName}</Typography>
            )}
            {extraContent}
          </Box>
        </Box>
      </Box>
    );
  };

  useEffect(() => {
    if (item) {
      console.log("Loaded item details:", {
        id: item._id,
        name: item.name,
        sku: item.sku,
        hasDerivedFrom: !!item.derivedFrom,
        derivedFromItem: item.derivedFrom?.item,
        derivedFromItemType: item.derivedFrom?.item ? typeof item.derivedFrom.item : null,
        derivedItemsCount: item.derivedItems?.length || 0
      });
    }
  }, [item]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !item) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Item Not Found
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            component={RouterLink}
            to="/inventory"
          >
            Back to Inventory
          </Button>
        </Box>
        <ErrorFallback error={error as Error} message="The requested item could not be found" />
      </Box>
    );
  }

  return (
    <Box>
      {/* Success message */}
      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Header with navigation and actions */}
      <Box sx={{ mb: 3 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid size="grow">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                component={RouterLink}
                to="/inventory"
                startIcon={<ArrowBack />}
                variant="outlined"
                size="small"
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Typography variant="h4" component="div">
                {data?.name}
              </Typography>
              {data?.category && (
                <Chip
                  label={data?.category}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
              {/* Add a chip to show if this item is derived */}
              {data?.derivedFrom && isPopulatedItem(data.derivedFrom.item) && (
                <Chip
                  label="Derived Item"
                  size="small"
                  color="secondary"
                  icon={<Transform fontSize="small" />}
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
              SKU: {data?.sku}
            </Typography>
          </Grid>
          <Grid>
            <Stack direction="row" spacing={1}>
              {/* Add rebuild button */}
              <Button
                variant="outlined"
                color="info"
                startIcon={<StackedBarChart />}
                onClick={handleRebuildInventory}
                disabled={rebuildItemInventory.isPending}
              >
                {rebuildItemInventory.isPending ? 'Rebuilding...' : 'Rebuild Inventory'}
              </Button>

              {/* Add breakdown button for generic materials */}
              {(data?.itemType === 'material' || data?.itemType === 'both') &&
                data?.quantity > 0 && !data.derivedFrom && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Transform />}
                    onClick={() => setBreakdownDialogOpen(true)}
                  >
                    Break Down
                  </Button>
                )}
              <Button
                component={RouterLink}
                to={`/inventory/${id}/edit`}
                startIcon={<Edit />}
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
              <Button
                onClick={handleDelete}
                startIcon={<Delete />}
                variant="outlined"
                color="error"
              >
                Delete
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={3}>
            {/* Item Image */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, height: '100%', overflow: 'hidden', borderRadius: 2 }}>
                {data?.imageUrl ? (
                  <Box
                    sx={{
                      height: 300,
                      backgroundImage: `url(${data?.imageUrl})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      borderRadius: 1
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 300,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5',
                      borderRadius: 1
                    }}
                  >
                    <NoPhotography sx={{ fontSize: 60, color: '#cccccc', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No image available
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Key Metrics */}
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AttachMoney sx={{ mr: 1 }} />
                    <Typography variant="h6">Pricing</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>Cost:</Typography>
                      <Typography variant="h6">{formatCurrency(data?.cost || 0)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>Sale:</Typography>
                      <Typography variant="h6">{formatCurrency(data?.price || 0)}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={{
                bgcolor:
                  getStockStatusColor(data) === 'success' ? 'success.light' :
                    getStockStatusColor(data) === 'warning' ? 'warning.light' : 'error.light',
                color:
                  getStockStatusColor(data) === 'success' ? 'success.contrastText' :
                    getStockStatusColor(data) === 'warning' ? 'warning.contrastText' : 'error.contrastText'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Inventory sx={{ mr: 1 }} />
                    <Typography variant="h6">Stock</Typography>
                  </Box>
                  <Typography variant="h4">
                    {data?.trackingType === 'quantity' && `${data?.quantity || 0}`}
                    {data?.trackingType === 'weight' && `${data?.weight || 0}${data?.weightUnit}`}
                    {data?.trackingType === 'length' && `${data?.length || 0}${data?.lengthUnit}`}
                    {data?.trackingType === 'area' && `${data?.area || 0}${data?.areaUnit}`}
                    {data?.trackingType === 'volume' && `${data?.volume || 0}${data?.volumeUnit}`}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                    {data?.trackingType === 'quantity'
                      ? 'units available'
                      : data?.priceType === 'each'
                        ? `${data?.quantity || 0} packages`
                        : `total ${data?.trackingType}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Money sx={{ mr: 1 }} />
                    <Typography variant="h6">Value</Typography>
                  </Box>
                  <Typography variant="h4">
                    {formatCurrency(inventoryValue)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                    total inventory value
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarToday sx={{ mr: 1 }} />
                    <Typography variant="h6">Last Updated</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {formatDate(data?.lastUpdated)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Item Description */}
            {data?.description && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Category sx={{ mr: 1, fontSize: 20 }} />
                    Description
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1">
                    {data?.description}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {/* Tags */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocalOffer sx={{ mr: 1, fontSize: 20 }} />
                  Tags
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {data?.tags && data?.tags.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {data?.tags.map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        color="primary"
                        variant="outlined"
                        sx={{ borderRadius: 1 }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tags added
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Item Details */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Item Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Tracking Type
                </Typography>
                <Typography variant="body1">
                  {(() => {
                    switch(data?.trackingType) {
                      case 'quantity':
                        return (
                          <Chip
                            icon={<Inventory fontSize="small" />}
                            label="Track by Quantity"
                            size="small"
                            variant="outlined"
                          />
                        );
                      case 'weight':
                        return (
                          <Chip
                            icon={<Scale fontSize="small" />}
                            label="Track by Weight"
                            size="small"
                            variant="outlined"
                          />
                        );
                      case 'length':
                        return (
                          <Chip
                            icon={<Straighten fontSize="small" />}
                            label="Track by Length"
                            size="small"
                            variant="outlined"
                          />
                        );
                      case 'area':
                        return (
                          <Chip
                            icon={<SquareFoot fontSize="small" />}
                            label="Track by Area"
                            size="small"
                            variant="outlined"
                          />
                        );
                      case 'volume':
                        return (
                          <Chip
                            icon={<ViewInAr fontSize="small" />}
                            label="Track by Volume"
                            size="small"
                            variant="outlined"
                          />
                        );
                      default:
                        return (
                          <Chip
                            icon={<Inventory fontSize="small" />}
                            label="Track by Quantity"
                            size="small"
                            variant="outlined"
                          />
                        );
                    }
                  })()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Price Type
                </Typography>
                <Typography variant="body1">
                  {(() => {
                    switch(data?.priceType) {
                      case 'each':
                        return <Chip
                          icon={<AttachMoney fontSize="small" />}
                          label="Price per Item/Package"
                          size="small"
                          variant="outlined"
                        />;
                      case 'per_weight_unit':
                        return <Chip
                          icon={<AttachMoney fontSize="small" />}
                          label={`Price per ${data?.weightUnit}`}
                          size="small"
                          variant="outlined"
                        />;
                      case 'per_length_unit':
                        return <Chip
                          icon={<AttachMoney fontSize="small" />}
                          label={`Price per ${data?.lengthUnit}`}
                          size="small"
                          variant="outlined"
                        />;
                      case 'per_area_unit':
                        return <Chip
                          icon={<AttachMoney fontSize="small" />}
                          label={`Price per ${data?.areaUnit}`}
                          size="small"
                          variant="outlined"
                        />;
                      case 'per_volume_unit':
                        return <Chip
                          icon={<AttachMoney fontSize="small" />}
                          label={`Price per ${data?.volumeUnit}`}
                          size="small"
                          variant="outlined"
                        />;
                      default:
                        return <Chip
                          icon={<AttachMoney fontSize="small" />}
                          label="Price per Item"
                          size="small"
                          variant="outlined"
                        />;
                    }
                  })()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Item Type
                </Typography>
                <Typography variant="body1">
                  {data?.itemType === 'material' ? (
                    <Chip
                      icon={<Category fontSize="small" />}
                      label="Raw Material"
                      size="small"
                      variant="outlined"
                    />
                  ) : data?.itemType === 'product' ? (
                    <Chip
                      icon={<Inventory fontSize="small" />}
                      label="Finished Product"
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      icon={<Category fontSize="small" />}
                      label="Material & Product"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Stock Details
                </Typography>
                {(() => {
                  switch(data?.trackingType) {
                    case 'quantity':
                      return (
                        <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                          <Inventory fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          {data?.quantity} units in stock
                        </Typography>
                      );
                    case 'weight':
                      return (
                        <Box>
                          {data?.priceType === 'each' && (
                            <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                              <Inventory fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              {data?.quantity || 0} packages in stock
                            </Typography>
                          )}
                          <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                            <Scale fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            {data?.weight || 0}{data?.weightUnit} in stock
                          </Typography>
                        </Box>
                      );
                    case 'length':
                      return (
                        <Box>
                          {data?.priceType === 'each' && (
                            <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                              <Inventory fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              {data?.quantity || 0} packages in stock
                            </Typography>
                          )}
                          <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                            <Straighten fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            {data?.length || 0}{data?.lengthUnit} in stock
                          </Typography>
                        </Box>
                      );
                    case 'area':
                      return (
                        <Box>
                          {data?.priceType === 'each' && (
                            <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                              <Inventory fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              {data?.quantity || 0} packages in stock
                            </Typography>
                          )}
                          <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                            <SquareFoot fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            {data?.area || 0}{data?.areaUnit} in stock
                          </Typography>
                        </Box>
                      );
                    case 'volume':
                      return (
                        <Box>
                          {data?.priceType === 'each' && (
                            <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                              <Inventory fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              {data?.quantity || 0} packages in stock
                            </Typography>
                          )}
                          <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                            <ViewInAr fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            {data?.volume || 0}{data?.volumeUnit} in stock
                          </Typography>
                        </Box>
                      );
                    default:
                      return (
                        <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                          <Inventory fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          {data?.quantity} units in stock
                        </Typography>
                      );
                  }
                })()}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Sale Price
                </Typography>
                <Typography variant="h5" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {formatCurrency(data?.price || 0)}
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    {(() => {
                      switch(data?.priceType) {
                        case 'each':
                          return data?.trackingType === 'quantity' ? 'per item' : 'per package';
                        case 'per_weight_unit':
                          return `per ${data?.weightUnit}`;
                        case 'per_length_unit':
                          return `per ${data?.lengthUnit}`;
                        case 'per_area_unit':
                          return `per ${data?.areaUnit}`;
                        case 'per_volume_unit':
                          return `per ${data?.volumeUnit}`;
                        default:
                          return 'per unit';
                      }
                    })()}
                  </Typography>
                </Typography>
              </Box>

              <Divider />

              {/* Cost Information */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Cost Information
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Purchase Cost:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(data?.cost || 0)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Markup:</Typography>
                    <Typography variant="body1" fontWeight="medium" color={data?.price || 0 > (data?.cost || 0) ? 'success.main' : 'error.main'}>
                      {data?.cost || 0 ? `${Math.round(((data?.price || 0) / (data?.cost || 0) - 1) * 100)}%` : 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Profit per Unit:</Typography>
                    <Typography variant="body1" fontWeight="medium" color={(data?.price || 0) > (data?.cost || 0) ? 'success.main' : 'error.main'}>
                      {formatCurrency((data?.price || 0) - (data?.cost || 0))}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Pack Information for Materials */}
              {(data?.itemType === 'material' || data?.itemType === 'both') && data?.packInfo?.isPack && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Pack Information
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Units per Pack:</Typography>
                        <Typography variant="body1">{data?.packInfo.unitsPerPack}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Cost per Unit:</Typography>
                        <Typography variant="body1">
                          {formatCurrency(data?.packInfo.costPerUnit || 0)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Pack Cost:</Typography>
                        <Typography variant="body1">
                          {formatCurrency((data?.packInfo.costPerUnit || 0) * (data?.packInfo.unitsPerPack || 1))}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </>
              )}
            </Stack>
          </Paper>

          {/* Actions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                startIcon={<ShoppingCart />}
                component={RouterLink}
                to={`/sales/new?item=${id}`}
              >
                Create Sale with Item
              </Button>

              <Button
                fullWidth
                variant="outlined"
                color="primary"
                startIcon={<LocalShipping />}
                component={RouterLink}
                to={`/purchases/new?item=${id}`}
              >
                Create Purchase for Item
              </Button>
            </Stack>
          </Paper>

          {/* Materials & Products Relationships */}
          {(data?.itemType === 'product' || data?.itemType === 'both') && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Materials Used
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {data?.components && data?.components.length > 0 ? (
                <Stack spacing={2}>
                  {data?.components.map((component, index) => {
                    const material = component.item || null;
                    const isPopulated = isPopulatedItem(material);
                    const materialCost = isPopulated && (material.cost || 0) ? (material.cost || 0) : 0;

                    return (
                      <Box
                        key={index}
                        sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
                      >
                        {renderRelatedItem(
                          material,
                          index,
                          <Typography variant="body2" color="text.secondary">
                            {component.quantity || 0} × {component.weight
                              ? `${component.weight} ${component.weightUnit || ''}`
                              : 'units'} used
                          </Typography>
                        )}
                        <Typography variant="subtitle1" color="primary">
                          {formatCurrency((component.quantity || 0) * materialCost)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No materials are linked to this product.
                </Typography>
              )}
            </Paper>
          )}

          {(data?.itemType === 'material' || data?.itemType === 'both') && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Used In Products
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {data?.usedInProducts && data?.usedInProducts.length > 0 ? (
                <Stack spacing={2}>
                  {data?.usedInProducts.map((product, index) =>
                    renderRelatedItem(product, index)
                  )}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  This material is not used in any products yet.
                </Typography>
              )}
            </Paper>
          )}

          {/* Add Derived Items Section - show if item has derived items */}
          {!derivedItemsLoading && derivedItems.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Derived Items
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                {derivedItems.map((derivedItem) => (
                  <Box
                    key={derivedItem._id}
                    sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
                  >
                    {renderRelatedItem(
                      derivedItem,
                      0,
                      <Typography variant="body2" color="text.secondary">
                        {derivedItem.derivedFrom?.quantity || 0} units allocated
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Enhance the Source Item Section - replace the existing source item section with this improved version */}
          {data?.derivedFrom && isPopulatedItem(data.derivedFrom.item) && (
            <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'secondary.main', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Transform sx={{ color: 'secondary.main', mr: 1 }} />
                <Typography variant="h6" color="secondary.main">
                  Derived From
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {data.derivedFrom.item.imageUrl ? (
                      <Box
                        component="img"
                        src={data.derivedFrom.item.imageUrl}
                        alt={data.derivedFrom.item.name}
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 1,
                          mr: 2,
                          objectFit: 'contain',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                          mr: 2,
                          bgcolor: 'action.hover',
                        }}
                      >
                        <NoPhotography />
                      </Box>
                    )}
                    <Box>
                      <Button
                        component={RouterLink}
                        to={`/inventory/${data.derivedFrom.item._id}`}
                        variant="text"
                        sx={{ fontWeight: 'bold', p: 0, textAlign: 'left' }}
                      >
                        {data.derivedFrom.item.name}
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        SKU: {data.derivedFrom.item.sku}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {data.derivedFrom.item.category}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Derivation Details
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Quantity Allocated:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {data.derivedFrom.quantity || 0} units
                    </Typography>
                  </Box>

                  {data.derivedFrom.weight && data.derivedFrom.weightUnit && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Weight Allocated:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {data.derivedFrom.weight} {data.derivedFrom.weightUnit}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Button
                component={RouterLink}
                to={`/inventory/${data.derivedFrom.item._id}`}
                startIcon={<ArrowBack />}
                color="secondary"
                variant="outlined"
                size="small"
              >
                Go To Source Item
              </Button>
            </Paper>
          )}

          {/* Purchase History */}
          <Accordion defaultExpanded={false} sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCart sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Purchase History</Typography>
                <Chip
                  label={relatedPurchases.length}
                  size="small"
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {purchasesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : relatedPurchases.length > 0 ? (
                <List disablePadding>
                  {relatedPurchases.slice(0, 5).map((purchase) => (
                    <ListItem
                      key={purchase._id}
                      component={RouterLink}
                      to={`/purchases/${purchase._id}`}
                      sx={{
                        px: 0,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        textDecoration: 'none',
                        color: 'text.primary',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body1">
                            {purchase.invoiceNumber || `Purchase #${purchase._id?.toString().slice(-6)}`}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span" color="text.secondary">
                              {formatDate(purchase.purchaseDate)} •
                            </Typography>
                            <Typography variant="body2" component="span" color="primary" sx={{ ml: 1 }}>
                              {formatCurrency(purchase.total)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                  {relatedPurchases.length > 5 && (
                    <ListItem
                      // component={Button}
                      to="/purchases"
                      component={RouterLink}
                      sx={{
                        justifyContent: 'center',
                        color: 'primary.main',
                        textDecoration: 'none'
                      }}
                    >
                      View all {relatedPurchases.length} purchases
                    </ListItem>
                  )}
                </List>
              ) : (
                <Typography color="text.secondary" align="center">
                  No purchase history found for this item
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Sales History */}
          <Accordion defaultExpanded={false} sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Receipt sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">Sales History</Typography>
                <Chip
                  label={relatedSales.length}
                  size="small"
                  color="secondary"
                  sx={{ ml: 1 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {salesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : relatedSales.length > 0 ? (
                <List disablePadding>
                  {relatedSales.slice(0, 5).map((sale) => (
                    <ListItem
                      key={sale._id}
                      component={RouterLink}
                      to={`/sales/${sale._id}`}
                      sx={{
                        px: 0,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        textDecoration: 'none',
                        color: 'text.primary',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body1">
                            {sale.customerName || `Sale #${sale._id?.toString().slice(-6)}`}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span" color="text.secondary">
                              {formatDate(sale.createdAt)} •
                            </Typography>
                            <Typography variant="body2" component="span" color="secondary" sx={{ ml: 1 }}>
                              {formatCurrency(sale.total)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                  {relatedSales.length > 5 && (
                    <ListItem
                      // component={Button}
                      to="/sales"
                      component={RouterLink}
                      sx={{
                        justifyContent: 'center',
                        color: 'secondary.main',
                        textDecoration: 'none'
                      }}
                    >
                      View all {relatedSales.length} sales
                    </ListItem>
                  )}
                </List>
              ) : (
                <Typography color="text.secondary" align="center">
                  No sales history found for this item
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Transaction Summary */}
          {(relatedPurchases.length > 0 || relatedSales.length > 0) && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Transaction Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Purchases:
                    </Typography>
                    <Typography variant="subtitle1">
                      {relatedPurchases.length} orders
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Spent:
                    </Typography>
                    <Typography variant="subtitle1" color="primary.main">
                      {formatCurrency(
                        relatedPurchases.reduce((sum, purchase) => {
                          // Find the specific item in this purchase
                          const purchaseItem = purchase.items.find(i =>
                            (typeof i.item === 'object' && i.item?._id === id) ||
                            (typeof i.item === 'string' && i.item === id)
                          );
                          return sum + (purchaseItem?.totalCost || 0);
                        }, 0)
                      )}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Sales:
                    </Typography>
                    <Typography variant="subtitle1">
                      {relatedSales.length} orders
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Revenue:
                    </Typography>
                    <Typography variant="subtitle1" color="secondary.main">
                      {formatCurrency(
                        relatedSales.reduce((sum, sale) => {
                          // Find the specific item in this sale
                          const saleItem = sale.items.find(i =>
                            (typeof i.item === 'object' && i.item?._id === id) ||
                            (typeof i.item === 'string' && i.item === id)
                          );
                          return sum + (saleItem ? saleItem.quantity * saleItem.priceAtSale : 0);
                        }, 0)
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Breakdown Dialog */}
      <BreakdownItemsDialog
        open={breakdownDialogOpen}
        onClose={() => setBreakdownDialogOpen(false)}
        sourceItem={data || null}
        onItemsCreated={handleItemsCreated}
      />
    </Box>
  );
}
