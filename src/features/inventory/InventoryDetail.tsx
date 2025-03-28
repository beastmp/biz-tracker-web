import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid2,
  Divider,
  Chip,
  Card,
  CardContent,
  Stack
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
  LocalShipping
} from '@mui/icons-material';
import { useItem, useDeleteItem } from '@hooks/useItems';
import { formatCurrency } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import { useSettings } from '@hooks/useSettings';
import { isPopulatedItem, Item } from '@custTypes/models';
import { JSX, useMemo } from 'react';

export default function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item, isLoading, error } = useItem(id);
  const deleteItem = useDeleteItem();
  const { lowStockAlertsEnabled, quantityThreshold, weightThresholds } = useSettings();

  const data = item;

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

  // Update inventory value calculation to handle all tracking types
  const inventoryValue = useMemo(() => {
    if (!data) return 0;

    switch (data?.trackingType) {
      case 'quantity':
        return (data?.price || 0) * (data?.quantity || 0);
      case 'weight':
        return data?.priceType === 'each' ? (data?.price || 0) * (data?.quantity || 0) : (data?.price || 0) * (data?.weight || 0);
      case 'length':
        return data?.priceType === 'each' ? (data?.price || 0) * (data?.quantity || 0) : (data?.price || 0) * (data?.length || 0);
      case 'area':
        return data?.priceType === 'each' ? (data?.price || 0) * (data?.quantity || 0) : (data?.price || 0) * (data?.area || 0);
      case 'volume':
        return data?.priceType === 'each' ? (data?.price || 0) * (data?.quantity || 0) : (data?.price || 0) * (data?.volume || 0);
      default:
        return (data?.price || 0) * (data?.quantity || 0);
    }
  }, [data]);

  // Update the getStockStatusColor function to properly handle all tracking types
  const getStockStatusColor = (item: typeof data): 'success' | 'warning' | 'error' => {
    if (!item) return 'success';

    switch (item.trackingType) {
      case 'quantity':
        if (item.quantity === 0) return 'error';
        if (!lowStockAlertsEnabled) return 'success';
        if (item.quantity < quantityThreshold) return 'warning';
        return 'success';

      case 'weight':
        { if (item.weight === 0) return 'error';
        if (!lowStockAlertsEnabled) return 'success';

        // Different thresholds based on weight unit
        const lowThreshold =
          item.weightUnit === 'kg' ? weightThresholds.kg :
          item.weightUnit === 'g' ? weightThresholds.g :
          item.weightUnit === 'lb' ? weightThresholds.lb :
          item.weightUnit === 'oz' ? weightThresholds.oz : 5;

        if (item.weight < lowThreshold) return 'warning';
        return 'success'; }

      case 'length':
        if (item.length === 0) return 'error';
        return 'success';

      case 'area':
        if (item.area === 0) return 'error';
        return 'success';

      case 'volume':
        if (item.volume === 0) return 'error';
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
      {/* Header with navigation and actions */}
      <Box sx={{ mb: 3 }}>
        <Grid2 container alignItems="center" spacing={2}>
          <Grid2 size="grow">
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
            </Box>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
              SKU: {data?.sku}
            </Typography>
          </Grid2>
          <Grid2>
            <Stack direction="row" spacing={1}>
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
          </Grid2>
        </Grid2>
      </Box>

      <Grid2 container spacing={3}>
        {/* Left column */}
        <Grid2 size= {{ xs: 12, md: 8 }}>
          <Grid2 container spacing={3}>
            {/* Item Image */}
            <Grid2 size= {{ xs: 12 }}>
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
            </Grid2>

            {/* Key Metrics */}
            <Grid2 size= {{ xs: 12, sm: 6, lg: 3 }}>
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
            </Grid2>

            <Grid2 size= {{ xs: 12, sm: 6, lg: 3 }}>
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
                    {data?.trackingType === 'quantity' && data?.quantity}
                    {data?.trackingType === 'weight' && `${data?.weight}${data?.weightUnit}`}
                    {data?.trackingType === 'length' && `${data?.length}${data?.lengthUnit}`}
                    {data?.trackingType === 'area' && `${data?.area}${data?.areaUnit}`}
                    {data?.trackingType === 'volume' && `${data?.volume}${data?.volumeUnit}`}
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
            </Grid2>

            <Grid2 size= {{ xs: 12, sm: 6, lg: 3 }}>
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
            </Grid2>

            <Grid2 size= {{ xs: 12, sm: 6, lg: 3 }}>
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
            </Grid2>

            {/* Item Description */}
            {data?.description && (
              <Grid2 size= {{ xs: 12 }}>
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
              </Grid2>
            )}

            {/* Tags */}
            <Grid2 size= {{ xs: 12 }}>
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
            </Grid2>
          </Grid2>
        </Grid2>

        {/* Right Column */}
        <Grid2 size= {{ xs: 12, md: 4 }}>
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
                  {data?.trackingType === 'quantity' ? (
                    <Chip
                      icon={<Inventory fontSize="small" />}
                      label="Track by Quantity"
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      icon={<Scale fontSize="small" />}
                      label="Track by Weight"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Price Type
                </Typography>
                <Typography variant="body1">
                  {data?.trackingType === 'quantity' ? (
                    <Chip
                      icon={<AttachMoney fontSize="small" />}
                      label="Price per Item"
                      size="small"
                      variant="outlined"
                    />
                  ) : data?.priceType === 'each' ? (
                    <Chip
                      icon={<AttachMoney fontSize="small" />}
                      label="Price per Package"
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      icon={<AttachMoney fontSize="small" />}
                      label={`Price per ${data?.weightUnit}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
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
                {data?.trackingType === 'quantity' ? (
                  <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <Inventory fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    {data?.quantity} units in stock
                  </Typography>
                ) : data?.priceType === 'each' ? (
                  <Box>
                    <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Inventory fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      {data?.quantity || 0} packages in stock
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Scale fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      Each package: {data?.weight}{data?.weightUnit}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <Scale fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    {data?.weight}{data?.weightUnit} in stock
                  </Typography>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Sale Price
                </Typography>
                <Typography variant="h5" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {formatCurrency(data?.price || 0)}
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    {data?.trackingType === 'quantity'
                      ? 'per item'
                      : data?.priceType === 'each'
                        ? 'per package'
                        : `per ${data?.weightUnit}`}
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
        </Grid2>
      </Grid2>
    </Box>
  );
}
