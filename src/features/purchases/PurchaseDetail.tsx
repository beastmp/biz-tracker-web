import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Grid2,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Print,
  Inventory,
  Scale,
  Straighten,
  SquareFoot,
  LocalDrink,
  Image as ImageIcon
} from '@mui/icons-material';
import { usePurchase, useDeletePurchase } from '@hooks/usePurchases';
import { formatCurrency, formatDate, formatPaymentMethod } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import StatusChip from '@components/ui/StatusChip';

export default function PurchaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: purchase, isLoading, error } = usePurchase(id);
  const deletePurchase = useDeletePurchase();

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this purchase? This will update inventory quantities.')) return;

    try {
      await deletePurchase.mutateAsync(id);
      navigate('/purchases');
    } catch (error) {
      console.error('Failed to delete purchase:', error);
    }
  };

  const getMeasurementIcon = (trackingType: string) => {
    switch (trackingType) {
      case 'weight': return <Scale fontSize="small" />;
      case 'length': return <Straighten fontSize="small" />;
      case 'area': return <SquareFoot fontSize="small" />;
      case 'volume': return <LocalDrink fontSize="small" />;
      default: return <Inventory fontSize="small" />;
    }
  };

  const formatMeasurement = (item: any) => {
    if (!item) return '';

    // For items with tracking types
    if (typeof item.item === 'object' && item.item?.trackingType) {
      const trackingType = item.item.trackingType;

      switch (trackingType) {
        case 'quantity':
          return `${item.quantity} units`;
        case 'weight':
          return `${item.weight} ${item.weightUnit || item.item.weightUnit}`;
        case 'length':
          return `${item.length} ${item.lengthUnit || item.item.lengthUnit}`;
        case 'area':
          return `${item.area} ${item.areaUnit || item.item.areaUnit}`;
        case 'volume':
          return `${item.volume} ${item.volumeUnit || item.item.volumeUnit}`;
      }
    }

    // Fallback to simple quantity
    return item.quantity ? `${item.quantity} units` : (item.weight ? `${item.weight} ${item.weightUnit}` : '');
  };

  const getTrackingType = (item: any) => {
    return typeof item.item === 'object' && item.item?.trackingType
      ? item.item.trackingType
      : (item.weight ? 'weight' : 'quantity');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !purchase) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Purchase Not Found
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            component={RouterLink}
            to="/purchases"
          >
            Back to Purchases
          </Button>
        </Box>
        <ErrorFallback error={error as Error} message="The requested purchase could not be found." />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1">
            Purchase Details
          </Typography>
          {purchase._id && (
            <Typography variant="subtitle1" color="text.secondary">
              {purchase._id}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            component={RouterLink}
            to="/purchases"
          >
            Back to Purchases
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            component={RouterLink}
            to={`/purchases/${id}/edit`}
            color="primary"
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            startIcon={<Delete />}
            color="error"
            onClick={handleDelete}
          >
            Delete
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Stack>
      </Box>

      <Grid2 container spacing={3}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Purchase Information</Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">Date</Typography>
              <Typography variant="body1">
                {purchase.purchaseDate && formatDate(purchase.purchaseDate)}
              </Typography>
            </Box>

            <Box sx={{ mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <StatusChip status={purchase.status} sx={{ mt: 0.5 }} />
            </Box>

            <Box sx={{ mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">Payment Method</Typography>
              <Typography variant="body1">{formatPaymentMethod(purchase.paymentMethod)}</Typography>
            </Box>

            {purchase.invoiceNumber && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Invoice Number</Typography>
                <Typography variant="body1">{purchase.invoiceNumber}</Typography>
              </Box>
            )}

            {purchase.notes && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Notes</Typography>
                <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>{purchase.notes}</Typography>
              </Box>
            )}
          </Paper>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Supplier Information</Typography>
            <Divider sx={{ mb: 2 }} />

            {purchase.supplier && purchase.supplier.name ? (
              <>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{purchase.supplier.name}</Typography>
                </Box>

                {purchase.supplier.contactName && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Contact Person</Typography>
                    <Typography variant="body1">{purchase.supplier.contactName}</Typography>
                  </Box>
                )}

                {purchase.supplier.email && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{purchase.supplier.email}</Typography>
                  </Box>
                )}

                {purchase.supplier.phone && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{purchase.supplier.phone}</Typography>
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No supplier information provided
              </Typography>
            )}
          </Paper>
        </Grid2>

        <Grid2 size={{ xs: 12 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Items Purchased</Typography>
            <Divider sx={{ mb: 2 }} />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={60}>Image</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell>Measurement</TableCell>
                    <TableCell align="right">Unit Cost</TableCell>
                    <TableCell align="right">Total Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchase.items.map((item, index) => {
                    const itemDetails = typeof item.item === 'object' ? item.item : null;
                    const itemName = itemDetails ? itemDetails.name : 'Unknown Item';
                    const trackingType = getTrackingType(item);

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {itemDetails?.imageUrl ? (
                            <Avatar
                              src={itemDetails.imageUrl}
                              alt={itemName}
                              variant="rounded"
                              sx={{ width: 50, height: 50 }}
                            />
                          ) : (
                            <Avatar
                              variant="rounded"
                              sx={{ width: 50, height: 50, bgcolor: 'action.hover' }}
                            >
                              <ImageIcon color="disabled" />
                            </Avatar>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1">{itemName}</Typography>
                          {itemDetails?.sku && (
                            <Typography variant="caption" color="text.secondary">
                              SKU: {itemDetails.sku}
                            </Typography>
                          )}
                          {itemDetails?.tags && itemDetails.tags.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {itemDetails.tags.slice(0, 2).map(tag => (
                                <Chip key={tag} label={tag} size="small" variant="outlined" />
                              ))}
                              {itemDetails.tags.length > 2 && (
                                <Chip label={`+${itemDetails.tags.length - 2}`} size="small" variant="outlined" color="primary" />
                              )}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getMeasurementIcon(trackingType)}
                            <Typography variant="body1" sx={{ ml: 1 }}>
                              {formatMeasurement(item)}
                            </Typography>
                          </Box>
                          {itemDetails?.packInfo?.isPack && (
                            <Typography variant="caption" color="info.main">
                              Pack of {itemDetails.packInfo.unitsPerPack} units
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(item.costPerUnit)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.totalCost)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid2>

        <Grid2 size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Purchase Summary</Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>{formatCurrency(purchase.subtotal)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px', mb: 1 }}>
                <Typography>Tax ({purchase.taxRate || 0}%):</Typography>
                <Typography>{formatCurrency(purchase.taxAmount || 0)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px', mb: 1 }}>
                <Typography>Shipping:</Typography>
                <Typography>{formatCurrency(purchase.shippingCost || 0)}</Typography>
              </Box>

              <Divider sx={{ width: '250px', my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary">{formatCurrency(purchase.total)}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid2>
      </Grid2>
    </Box>
  );
}
