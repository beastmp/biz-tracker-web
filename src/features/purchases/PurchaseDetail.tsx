import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { ArrowBack, Edit, Delete, Print } from '@mui/icons-material';
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
        <Typography variant="h4" component="h1">
          Purchase Details
        </Typography>
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
        <Grid item xs={12} md={6}>
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
                <Typography variant="body1">{purchase.notes}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Supplier Information</Typography>
            <Divider sx={{ mb: 2 }} />

            {purchase.supplier.name ? (
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

        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Items Purchased</Typography>
            <Divider sx={{ mb: 2 }} />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Cost</TableCell>
                    <TableCell align="right">Total Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchase.items.map((item, index) => {
                    const itemName =
                      typeof item.item === 'object' && item.item.name
                        ? item.item.name
                        : 'Unknown Item';

                    return (
                      <TableRow key={index}>
                        <TableCell>{itemName}</TableCell>
                        <TableCell align="right">
                          {item.quantity}
                          {item.weight && item.weightUnit && ` (${item.weight} ${item.weightUnit})`}
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
        </Grid>

        <Grid item xs={12}>
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
        </Grid>
      </Grid>
    </Box>
  );
}
