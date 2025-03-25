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
  IconButton,
  Tooltip,
  Avatar
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

export default function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item, isLoading, error } = useItem(id);
  const deleteItem = useDeleteItem();

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

  const getStockStatusColor = (item: typeof data): 'success' | 'warning' | 'error' => {
    if (item.trackingType === 'quantity') {
      if (item.quantity === 0) return 'error';
      if (item.quantity < 5) return 'warning';
      return 'success';
    } else {
      // For weight-tracked items
      if (item.priceType === 'each') {
        // Base status on quantity when pricing is per item
        if (!item.quantity || item.quantity === 0) return 'error';
        if (item.quantity < 3) return 'warning';
        return 'success';
      } else {
        // Base status on weight when pricing is per weight
        if (!item.weight || item.weight === 0) return 'error';

        // Different thresholds based on weight unit
        const lowThreshold =
          item.weightUnit === 'kg' ? 1 :
          item.weightUnit === 'g' ? 500 :
          item.weightUnit === 'lb' ? 2 :
          item.weightUnit === 'oz' ? 16 : 5;

        if (item.weight < lowThreshold) return 'warning';
        return 'success';
      }
    }
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

  const data = item;

  // Calculate inventory value
  const inventoryValue = data.trackingType === 'quantity'
    ? data.price * data.quantity
    : data.priceType === 'each'
      ? data.price * (data.quantity || 0)
      : data.price * data.weight;

  return (
    <Box>
      {/* Header with navigation and actions */}
      <Box sx={{ mb: 3 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs>
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
              <Typography variant="h4" component="h1">
                {data.name}
              </Typography>
              {data.category && (
                <Chip
                  label={data.category}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
              SKU: {data.sku}
            </Typography>
          </Grid>
          <Grid item>
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
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Item Image */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, height: '100%', overflow: 'hidden', borderRadius: 2 }}>
                {data.imageUrl ? (
                  <Box
                    sx={{
                      height: 300,
                      backgroundImage: `url(${data.imageUrl})`,
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
            <Grid item xs={12} sm={6} lg={3}>
              <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AttachMoney sx={{ mr: 1 }} />
                    <Typography variant="h6">Price</Typography>
                  </Box>
                  <Typography variant="h4">
                    {formatCurrency(data.price)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                    {data.trackingType === 'quantity'
                      ? 'per item'
                      : data.priceType === 'each'
                        ? 'per package'
                        : `per ${data.weightUnit}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
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
                    {data.trackingType === 'quantity'
                      ? data.quantity
                      : `${data.weight}${data.weightUnit}`}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                    {data.trackingType === 'quantity'
                      ? 'units available'
                      : data.priceType === 'each'
                        ? `${data.quantity || 0} packages`
                        : 'total weight'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
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

            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarToday sx={{ mr: 1 }} />
                    <Typography variant="h6">Last Updated</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {formatDate(data.lastUpdated)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Item Description */}
            {data.description && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Category sx={{ mr: 1, fontSize: 20 }} />
                    Description
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1">
                    {data.description}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {/* Tags */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocalOffer sx={{ mr: 1, fontSize: 20 }} />
                  Tags
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {data.tags && data.tags.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {data.tags.map(tag => (
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
        <Grid item xs={12} md={4}>
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
                  {data.trackingType === 'quantity' ? (
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
                  {data.trackingType === 'quantity' ? (
                    <Chip
                      icon={<AttachMoney fontSize="small" />}
                      label="Price per Item"
                      size="small"
                      variant="outlined"
                    />
                  ) : data.priceType === 'each' ? (
                    <Chip
                      icon={<AttachMoney fontSize="small" />}
                      label="Price per Package"
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      icon={<AttachMoney fontSize="small" />}
                      label={`Price per ${data.weightUnit}`}
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
                {data.trackingType === 'quantity' ? (
                  <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <Inventory fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    {data.quantity} units in stock
                  </Typography>
                ) : data.priceType === 'each' ? (
                  <Box>
                    <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Inventory fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      {data.quantity || 0} packages in stock
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Scale fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      Each package: {data.weight}{data.weightUnit}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <Scale fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    {data.weight}{data.weightUnit} in stock
                  </Typography>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Price Details
                </Typography>
                <Typography variant="h5" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {formatCurrency(data.price)}
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    {data.trackingType === 'quantity'
                      ? 'per item'
                      : data.priceType === 'each'
                        ? 'per package'
                        : `per ${data.weightUnit}`}
                  </Typography>
                </Typography>
              </Box>
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
        </Grid>
      </Grid>
    </Box>
  );
}
