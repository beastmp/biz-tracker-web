import { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Divider,
  Chip,
  Tooltip,
  IconButton,
  Stack,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Select,
  alpha,
  useTheme,
  LinearProgress,
  Badge,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Construction,
  Inventory,
  LocalOffer,
  Category,
  Description,
  QrCode,
  Error,
  PriceChange,
  Link as LinkIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
  TrendingUp,
  TrendingDown,
  Print as PrintIcon
} from '@mui/icons-material';
import { useItem, useDeleteItem, useUpdateItem } from '@hooks/useItems';
import { formatCurrency } from '@utils/formatters';
import StatusChip from '@components/ui/StatusChip';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import { useSettings } from '@hooks/useSettings';
import QRCode from 'qrcode.react';

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: item, isLoading, error } = useItem(id);
  const deleteItem = useDeleteItem();
  const updateItem = useUpdateItem(id);

  const { lowStockAlertsEnabled, quantityThreshold, weightThresholds } = useSettings();

  // State for dialogs and actions
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for editing stock levels
  const [isEditing, setIsEditing] = useState(false);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [newWeight, setNewWeight] = useState<number>(0);
  const [newLength, setNewLength] = useState<number>(0);
  const [newArea, setNewArea] = useState<number>(0);
  const [newVolume, setNewVolume] = useState<number>(0);

  if (isLoading) {
    return <LoadingScreen message="Loading item details..." />;
  }

  if (error || !item) {
    return <ErrorFallback error={error as Error} message="Failed to load item details" />;
  }

  // When starting to edit, set initial values
  const startEditing = () => {
    setNewQuantity(item.quantity);
    setNewWeight(item.weight);
    setNewLength(item.length);
    setNewArea(item.area);
    setNewVolume(item.volume);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  // Save updated stock values
  const saveStockUpdate = async () => {
    try {
      const updateData = {
        ...item,
        lastUpdated: new Date()
      };

      // Update the appropriate fields based on tracking type
      switch (item.trackingType) {
        case 'quantity':
          updateData.quantity = newQuantity;
          break;
        case 'weight':
          updateData.weight = newWeight;
          break;
        case 'length':
          updateData.length = newLength;
          break;
        case 'area':
          updateData.area = newArea;
          break;
        case 'volume':
          updateData.volume = newVolume;
          break;
      }

      await updateItem.mutateAsync(updateData);
      setIsEditing(false);
      setSuccessMessage('Stock updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update stock:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteItem.mutateAsync(id as string);
      navigate('/inventory');
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate if stock is low
  const isLowStock = (): boolean => {
    if (!lowStockAlertsEnabled) return false;

    switch (item.trackingType) {
      case 'quantity':
        return item.quantity <= quantityThreshold;
      case 'weight':
        if (item.priceType === 'each' && (item.quantity || 0) <= 3) return true;
        const threshold =
          item.weightUnit === 'kg' ? weightThresholds.kg :
          item.weightUnit === 'g' ? weightThresholds.g :
          item.weightUnit === 'lb' ? weightThresholds.lb :
          item.weightUnit === 'oz' ? weightThresholds.oz : 5;
        return item.weight <= threshold;
      default:
        return false;
    }
  };

  // Calculate stock level percentage for progress bar
  const getStockLevelPercentage = (): number => {
    switch (item.trackingType) {
      case 'quantity':
        const maxQuantity = quantityThreshold * 3; // 3x threshold as "full"
        return Math.min(100, (item.quantity / maxQuantity) * 100);
      case 'weight':
        const threshold =
          item.weightUnit === 'kg' ? weightThresholds.kg * 3 :
          item.weightUnit === 'g' ? weightThresholds.g * 3 :
          item.weightUnit === 'lb' ? weightThresholds.lb * 3 :
          item.weightUnit === 'oz' ? weightThresholds.oz * 3 : 15;
        return Math.min(100, (item.weight / threshold) * 100);
      default:
        return 50; // Default value
    }
  };

  // Get progress bar color based on stock level
  const getProgressColor = (): 'success' | 'warning' | 'error' => {
    const percentage = getStockLevelPercentage();
    if (percentage <= 33) return 'error';
    if (percentage <= 66) return 'warning';
    return 'success';
  };

  // Calculate additional metrics
  const calculateTotalValue = (): number => {
    switch (item.trackingType) {
      case 'quantity':
        return item.price * item.quantity;
      case 'weight':
        return item.priceType === 'each'
          ? item.price * (item.quantity || 0)
          : item.price * item.weight;
      case 'length':
        return item.priceType === 'each'
          ? item.price * (item.quantity || 0)
          : item.price * item.length;
      case 'area':
        return item.priceType === 'each'
          ? item.price * (item.quantity || 0)
          : item.price * item.area;
      case 'volume':
        return item.priceType === 'each'
          ? item.price * (item.quantity || 0)
          : item.price * item.volume;
      default:
        return item.price * item.quantity;
    }
  };

  // Calculate profit margin if cost is available
  const calculateProfitMargin = (): number | null => {
    if (!item.cost || item.cost <= 0) return null;
    return (item.price - item.cost) / item.price * 100;
  };

  // Format stock display
  const formatStockDisplay = (): string => {
    switch (item.trackingType) {
      case 'quantity':
        return `${item.quantity} ${item.quantity === 1 ? 'unit' : 'units'}`;
      case 'weight':
        return `${item.weight} ${item.weightUnit}`;
      case 'length':
        return `${item.length} ${item.lengthUnit}`;
      case 'area':
        return `${item.area} ${item.areaUnit}`;
      case 'volume':
        return `${item.volume} ${item.volumeUnit}`;
      default:
        return `${item.quantity} in stock`;
    }
  };

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            component={RouterLink}
            to="/inventory"
            startIcon={<ArrowBack />}
            variant="outlined"
            size="small"
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              {item.name}
            </Typography>
            <Typography color="text.secondary">
              SKU: {item.sku}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Generate QR Code">
            <IconButton onClick={() => setQrDialogOpen(true)} sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
              <QrCode />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Item Details">
            <IconButton onClick={handlePrint} sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Button
            component={RouterLink}
            to={`/inventory/${id}/edit`}
            startIcon={<Edit />}
            variant="contained"
          >
            Edit
          </Button>
          <Button
            onClick={() => setDeleteDialogOpen(true)}
            startIcon={<Delete />}
            variant="outlined"
            color="error"
          >
            Delete
          </Button>
        </Stack>
      </Box>

      {successMessage && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderLeft: `4px solid ${theme.palette.success.main}`,
            animation: 'fadeIn 0.5s ease-in',
            boxShadow: theme.shadows[2],
            borderRadius: 1
          }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} md={8}>
          {/* Item Overview */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={5}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 240,
                    backgroundColor: 'action.hover',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none',
                  }}
                >
                  {!item.imageUrl && (
                    <Inventory sx={{ fontSize: 60, color: 'action.active' }} />
                  )}
                </CardMedia>
              </Grid>

              <Grid item xs={12} sm={6} md={7}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {/* Basic Info */}
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      {item.itemType && (
                        <Chip
                          label={
                            item.itemType === 'product' ? 'Product' :
                            item.itemType === 'material' ? 'Material' :
                            item.itemType === 'both' ? 'Product & Material' :
                            'Other'
                          }
                          size="small"
                          color={
                            item.itemType === 'product' ? 'primary' :
                            item.itemType === 'material' ? 'info' :
                            'secondary'
                          }
                        />
                      )}
                      {item.category && (
                        <Chip
                          icon={<Category fontSize="small" />}
                          label={item.category}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                      <Typography variant="h5" color="primary.main" fontWeight="bold">
                        {formatCurrency(item.price)}
                      </Typography>
                      {item.priceType === 'per-unit' && (
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          / {item.weightUnit || item.lengthUnit || item.areaUnit || item.volumeUnit || 'unit'}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Value
                      </Typography>
                      <Typography variant="h6" fontWeight="medium">
                        {formatCurrency(calculateTotalValue())}
                      </Typography>
                    </Box>

                    {/* Profit margin */}
                    {calculateProfitMargin() !== null && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Profit Margin
                        </Typography>
                        <Chip
                          icon={calculateProfitMargin()! > 20 ? <TrendingUp /> : <TrendingDown />}
                          label={`${calculateProfitMargin()!.toFixed(1)}%`}
                          color={calculateProfitMargin()! > 20 ? 'success' : calculateProfitMargin()! > 0 ? 'warning' : 'error'}
                        />
                      </Box>
                    )}
                  </Box>

                  {/* Stock Level */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current Stock Level
                      </Typography>
                      {isLowStock() && (
                        <Chip
                          icon={<WarningIcon fontSize="small" />}
                          label="Low Stock"
                          color="warning"
                          size="small"
                        />
                      )}
                    </Box>

                    {isEditing ? (
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          label={`New ${item.trackingType === 'quantity' ? 'Quantity' :
                                    item.trackingType === 'weight' ? 'Weight' :
                                    item.trackingType === 'length' ? 'Length' :
                                    item.trackingType === 'area' ? 'Area' :
                                    'Volume'}`}
                          type="number"
                          value={
                            item.trackingType === 'quantity' ? newQuantity :
                            item.trackingType === 'weight' ? newWeight :
                            item.trackingType === 'length' ? newLength :
                            item.trackingType === 'area' ? newArea :
                            newVolume
                          }
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            switch (item.trackingType) {
                              case 'quantity':
                                setNewQuantity(value);
                                break;
                              case 'weight':
                                setNewWeight(value);
                                break;
                              case 'length':
                                setNewLength(value);
                                break;
                              case 'area':
                                setNewArea(value);
                                break;
                              case 'volume':
                                setNewVolume(value);
                                break;
                            }
                          }}
                          InputProps={{
                            endAdornment: item.trackingType !== 'quantity' ? (
                              <InputAdornment position="end">
                                {item.trackingType === 'weight' ? item.weightUnit :
                                 item.trackingType === 'length' ? item.lengthUnit :
                                 item.trackingType === 'area' ? item.areaUnit :
                                 item.volumeUnit}
                              </InputAdornment>
                            ) : null
                          }}
                          size="small"
                          autoFocus
                          sx={{ flex: 1 }}
                        />
                        <IconButton color="primary" onClick={saveStockUpdate}>
                          <SaveIcon />
                        </IconButton>
                        <IconButton color="error" onClick={cancelEditing}>
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="h6" fontWeight="medium">
                            {formatStockDisplay()}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<Edit />}
                            onClick={startEditing}
                            variant="outlined"
                          >
                            Update
                          </Button>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={getStockLevelPercentage()}
                          color={getProgressColor()}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocalOffer fontSize="small" sx={{ mr: 1 }} /> Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {item.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>

          {/* Description */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Description sx={{ mr: 1 }} /> Description
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {item.description ? (
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                {item.description}
              </Typography>
            ) : (
              <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No description available for this item.
              </Typography>
            )}
          </Paper>

          {/* Components (if product with components) */}
          {item.components && item.components.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Construction sx={{ mr: 1 }} /> Components
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {item.components.map((component, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography component={RouterLink} to={`/inventory/${component.materialId}`} sx={{
                            textDecoration: 'none',
                            color: 'primary.main',
                            '&:hover': { textDecoration: 'underline' }
                          }}>
                            {component.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {component.quantity} {component.unit || 'units'}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(component.cost * component.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                mt: 2,
                p: 1.5,
                bgcolor: alpha(theme.palette.warning.main, 0.05),
                borderRadius: 1
              }}>
                <Typography sx={{ mr: 2 }}>Total Component Cost:</Typography>
                <Typography fontWeight="bold">
                  {formatCurrency(item.components.reduce(
                    (sum, component) => sum + component.cost * component.quantity, 0
                  ))}
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Related Products (if material used in products) */}
          {item.usedInProducts && item.usedInProducts.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LinkIcon sx={{ mr: 1 }} /> Used in Products
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                {item.usedInProducts.map((product, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="subtitle1" noWrap>
                          <RouterLink to={`/inventory/${product.productId}`} style={{
                            textDecoration: 'none',
                            color: theme.palette.primary.main
                          }}>
                            {product.name}
                          </RouterLink>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Uses {product.quantity} {product.unit || 'units'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={4}>
          {/* Price Information */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PriceChange color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Price Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Sale Price</Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    {formatCurrency(item.price)}
                    {item.priceType === 'per-unit' &&
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        / {item.weightUnit || item.lengthUnit || item.areaUnit || item.volumeUnit || 'unit'}
                      </Typography>
                    }
                  </Typography>
                </Box>

                {item.cost !== undefined && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Cost Price</Typography>
                    <Typography variant="body1" color="text.primary">
                      {formatCurrency(item.cost)}
                    </Typography>
                  </Box>
                )}

                {item.price > 0 && item.cost > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Profit</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight={500}>
                        {formatCurrency(item.price - item.cost)}
                      </Typography>
                      <Chip
                        label={`${((item.price - item.cost) / item.price * 100).toFixed(1)}%`}
                        color={((item.price - item.cost) / item.price) > 0.2 ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </Box>
                )}

                <Divider />

                <Box>
                  <Typography variant="body2" color="text.secondary">Total Inventory Value</Typography>
                  <Typography variant="h6" color="info.main" fontWeight={600}>
                    {formatCurrency(calculateTotalValue())}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Item Details */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Inventory color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Item Details</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">SKU</Typography>
                  <Typography variant="body1">{item.sku}</Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">Category</Typography>
                  <Typography variant="body1">{item.category || 'Uncategorized'}</Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">Item Type</Typography>
                  <Chip
                    label={
                      item.itemType === 'product' ? 'Product' :
                      item.itemType === 'material' ? 'Material' :
                      item.itemType === 'both' ? 'Product & Material' :
                      'Other'
                    }
                    color={
                      item.itemType === 'product' ? 'primary' :
                      item.itemType === 'material' ? 'info' :
                      'secondary'
                    }
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">Tracking Type</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {item.trackingType}
                  </Typography>
                </Box>

                {item.barcode && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Barcode</Typography>
                    <Typography variant="body1">{item.barcode}</Typography>
                  </Box>
                )}

                {item.location && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Location</Typography>
                    <Typography variant="body1">{item.location}</Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Purchase & Sales History */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HistoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Transaction History</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {/* This would be populated with actual transaction history data */}
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2, textAlign: 'center' }}>
                Transaction history will appear here once available
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<HistoryIcon />}
                  component={RouterLink}
                  to={`/inventory/history?itemId=${item._id}`}
                >
                  View Full History
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)}>
        <DialogTitle>QR Code for {item.name}</DialogTitle>
        <DialogContent>
          <Box sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'common.white',
            borderRadius: 1,
          }}>
            <QRCode
              value={`${window.location.origin}/inventory/${item._id}`}
              size={200}
              level="H"
              includeMargin
            />
            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
              Scan to view item details
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>Close</Button>
          <Button
            color="primary"
            variant="contained"
            onClick={() => {
              const canvas = document.querySelector('canvas');
              if (canvas) {
                const pngUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = pngUrl;
                downloadLink.download = `${item.sku}-qrcode.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
              }
            }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{item.name}"? This action cannot be undone.
            {item.usedInProducts && item.usedInProducts.length > 0 && (
              <Box sx={{ mt: 2, color: 'error.main' }}>
                <Typography fontWeight="bold" color="error">
                  Warning: This item is used in {item.usedInProducts.length} products!
                </Typography>
                <Typography variant="body2" color="error">
                  Deleting it may cause issues with product composition data.
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
