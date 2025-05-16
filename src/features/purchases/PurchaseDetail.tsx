import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Grid,
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
import { useItems } from '@hooks/useItems';
import { formatCurrency, formatDate, formatPaymentMethod } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import StatusChip from '@components/ui/StatusChip';
import { PurchaseItem } from '@custTypes/models';
// import { useState } from 'react';

export default function PurchaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: purchase, isLoading, error } = usePurchase(id);
  const { data: items = [] } = useItems();
  const deletePurchase = useDeletePurchase();

  const itemLookup = Object.fromEntries((items || []).map(item => [item._id, item]));

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

  const getTrackingType = (item: PurchaseItem) => {
    if (typeof item.item === 'object' && item.item?.trackingType) {
      return item.item.trackingType;
    }

    if (typeof item.item === 'string' && itemLookup[item.item]?.trackingType) {
      return itemLookup[item.item].trackingType;
    }

    return (item.weight ? 'weight' : item.length ? 'length' :
      item.area ? 'area' : item.volume ? 'volume' : 'quantity');
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

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
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
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
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
        </Grid>

        <Grid size={{ xs: 12 }}>
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
                    <TableCell>Original Cost</TableCell>
                    <TableCell>Cost Per Unit</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell align="right">Total Cost</TableCell>
                    {/* <TableCell>Asset Status</TableCell>
                    <TableCell align="center">Actions</TableCell> */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchase.items.map((item, index) => {
                    let itemDetails = null;

                    if (typeof item.item === 'object' && item.item !== null) {
                      itemDetails = item.item;
                    } else if (typeof item.item === 'string' && itemLookup[item.item]) {
                      itemDetails = itemLookup[item.item];
                    }

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
                              {itemDetails.tags.slice(0, 2).map((tag: string) => (
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
                            <Box sx={{ ml: 1 }}>
                              {item.purchasedBy === 'weight' && `${item.weight} ${item.weightUnit}`}
                              {item.purchasedBy === 'length' && `${item.length} ${item.lengthUnit}`}
                              {item.purchasedBy === 'area' && `${item.area} ${item.areaUnit}`}
                              {item.purchasedBy === 'volume' && `${item.volume} ${item.volumeUnit}`}
                              {(item.purchasedBy === 'quantity' || !item.purchasedBy) && `${item.quantity} units`}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {item.originalCost ? formatCurrency(item.originalCost) : '-'}
                        </TableCell>
                        <TableCell>{formatCurrency(item.costPerUnit)}</TableCell>
                        <TableCell>
                          {((item.discountAmount || 0) > 0 || (item.discountPercentage && item.discountPercentage > 0)) ? (
                            <Box>
                              {formatCurrency(item.discountAmount || 0)}
                              {(item.discountPercentage || 0) > 0 && ` (${(item.discountPercentage || 0).toFixed(2)}%)`}
                            </Box>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(item.totalCost)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
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

              {purchase.items.some(item => (item.discountAmount || 0) > 0) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px', mb: 1 }}>
                  <Typography>Item Discounts:</Typography>
                  <Typography>
                    -{formatCurrency(purchase.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0))}
                  </Typography>
                </Box>
              )}

              {(purchase.discountAmount || 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px', mb: 1 }}>
                  <Typography>Additional Discount:</Typography>
                  <Typography>{formatCurrency((purchase.discountAmount || 0))}</Typography>
                </Box>
              )}

              <Divider sx={{ width: '250px', my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary">{formatCurrency(purchase.total)}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
