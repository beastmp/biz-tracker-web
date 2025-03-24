/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  CircularProgress,
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
import { purchasesApi, Purchase } from '../../services/api';

export default function PurchaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchase = async () => {
      if (!id) return;

      try {
        const data = await purchasesApi.getById(id);
        setPurchase(data);
      } catch (error) {
        console.error('Failed to fetch purchase:', error);
        setError('Failed to load purchase details. The purchase may have been deleted.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchase();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this purchase? This will update inventory quantities.')) return;

    try {
      await purchasesApi.delete(id);
      navigate('/purchases');
    } catch (error) {
      console.error('Failed to delete purchase:', error);
      setError('Failed to delete purchase. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'success';
      case 'cancelled': return 'error';
      case 'partially_received': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'credit': return 'Credit Card';
      case 'debit': return 'Debit Card';
      case 'check': return 'Check';
      case 'bank_transfer': return 'Bank Transfer';
      default: return 'Other';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
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
        <Paper sx={{ p: 3, bgcolor: '#ffebee' }}>
          <Typography color="error">{error || 'The purchase you are looking for does not exist or has been deleted.'}</Typography>
        </Paper>
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
              <Chip
                label={purchase.status.replace('_', ' ')}
                color={getStatusColor(purchase.status) as any}
                size="small"
              />
            </Box>

            <Box sx={{ mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">Payment Method</Typography>
              <Typography variant="body1">{getPaymentMethodLabel(purchase.paymentMethod)}</Typography>
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
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
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
                <Typography>Tax ({purchase.taxRate}%):</Typography>
                <Typography>{formatCurrency(purchase.taxAmount ?? 0)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px', mb: 1 }}>
                <Typography>Shipping:</Typography>
                <Typography>{formatCurrency(purchase.shippingCost ?? 0)}</Typography>
              </Box>

              <Divider sx={{ width: '250px', my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">{formatCurrency(purchase.total)}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}