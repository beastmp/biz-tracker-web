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
  Select,
  FormControl,
  InputLabel,
  alpha,
  useTheme
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Print,
  Business,
  ReceiptLong,
  CalendarToday,
  LocalShipping,
  Inventory,
  AttachMoney,
  Email,
  Phone,
  LocationOn,
  ShoppingBasket,
  Add,
  Payments
} from '@mui/icons-material';
import { usePurchase, useDeletePurchase, useUpdatePurchaseStatus } from '@hooks/usePurchases';
import { formatCurrency, formatDate } from '@utils/formatters';
import StatusChip from '@components/ui/StatusChip';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';

export default function PurchaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: purchase, isLoading, error } = usePurchase(id);
  const deletePurchase = useDeletePurchase();
  const updateStatus = useUpdatePurchaseStatus();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (isLoading) {
    return <LoadingScreen message="Loading purchase details..." />;
  }

  if (error || !purchase) {
    return <ErrorFallback error={error as Error} message="Failed to load purchase details" />;
  }

  const handleDelete = async () => {
    try {
      await deletePurchase.mutateAsync(id as string);
      navigate('/purchases');
    } catch (error) {
      console.error('Failed to delete purchase:', error);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) return;

    try {
      await updateStatus.mutateAsync({ id: id as string, status: newStatus });
      setStatusDialogOpen(false);
      setSuccessMessage(`Status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            component={RouterLink}
            to="/purchases"
            startIcon={<ArrowBack />}
            variant="outlined"
            size="small"
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" component="h1">
              Purchase Details
            </Typography>
            <Typography color="text.secondary">
              Reference #{purchase.referenceNumber}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Print Purchase Order">
            <IconButton onClick={handlePrint} sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
              <Print />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              setNewStatus(purchase.status);
              setStatusDialogOpen(true);
            }}
          >
            Update Status
          </Button>
          <Button
            component={RouterLink}
            to={`/purchases/${id}/edit`}
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
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: alpha(theme.palette.success.main, 0.1),
            borderLeft: `4px solid ${theme.palette.success.main}`,
            borderRadius: 1
          }}
        >
          <Typography color="success.main">{successMessage}</Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} md={8}>
          {/* Purchase Summary */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ReceiptLong color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Purchase Summary</Typography>
                </Box>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Reference Number</Typography>
                    <Typography variant="body1" fontWeight={500}>{purchase.referenceNumber || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Purchase Date</Typography>
                    <Typography variant="body1">{formatDate(purchase.purchaseDate || new Date())}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Expected Delivery</Typography>
                    <Typography variant="body1">
                      {purchase.expectedDeliveryDate ? formatDate(purchase.expectedDeliveryDate) : 'Not specified'}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Box sx={{ mb: 2, textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <StatusChip status={purchase.status} size="medium" />
                  </Box>
                  <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                    <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(purchase.total)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Order Items */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ShoppingBasket color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Order Items</Typography>
            </Box>

            <TableContainer sx={{ mb: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.info.main, 0.04) }}>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchase.items && purchase.items.length > 0 ? (
                    purchase.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box>
                            <Typography fontWeight={500}>{item.name}</Typography>
                            {item.sku && (
                              <Typography variant="caption" color="text.secondary">
                                SKU: {item.sku}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(item.cost)}</TableCell>
                        <TableCell align="right">
                          {item.quantity} {item.unit || 'units'}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center' }}>
                        <Typography color="text.secondary">No items in this purchase</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Order Summary */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ width: { xs: '100%', sm: '50%', md: '40%' } }}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: `1px dashed ${theme.palette.divider}`
                }}>
                  <Typography>Subtotal:</Typography>
                  <Typography fontWeight={500}>{formatCurrency(purchase.subtotal || purchase.total)}</Typography>
                </Box>

                {purchase.tax > 0 && (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: `1px dashed ${theme.palette.divider}`
                  }}>
                    <Typography>Tax:</Typography>
                    <Typography>{formatCurrency(purchase.tax)}</Typography>
                  </Box>
                )}

                {purchase.shipping > 0 && (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: `1px dashed ${theme.palette.divider}`
                  }}>
                    <Typography>Shipping:</Typography>
                    <Typography>{formatCurrency(purchase.shipping)}</Typography>
                  </Box>
                )}

                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1.5,
                  mt: 1,
                  bgcolor: alpha(theme.palette.info.main, 0.05),
                  px: 2,
                  borderRadius: 1
                }}>
                  <Typography fontWeight="bold">Total:</Typography>
                  <Typography fontWeight="bold" color="info.main">
                    {formatCurrency(purchase.total)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Notes */}
          {purchase.notes && (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalShipping color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Notes</Typography>
              </Box>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{purchase.notes}</Typography>
            </Paper>
          )}
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={4}>
          {/* Supplier Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Business color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Supplier Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {purchase.supplier?.name || 'Unknown Supplier'}
                  </Typography>
                </Box>

                {purchase.supplier?.email && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Email fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{purchase.supplier.email}</Typography>
                    </Box>
                  </Box>
                )}

                {purchase.supplier?.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Phone fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">{purchase.supplier.phone}</Typography>
                    </Box>
                  </Box>
                )}

                {purchase.supplier?.address && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Address</Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {purchase.supplier.address}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {!purchase.supplier?.name && !purchase.supplier?.email &&
                 !purchase.supplier?.phone && !purchase.supplier?.address && (
                  <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
                    No supplier information provided
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Payments color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Payment Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Payment Terms</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {purchase.paymentTerms || 'Not specified'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">Payment Status</Typography>
                  <Chip
                    label={purchase.paymentStatus || 'Unpaid'}
                    color={purchase.paymentStatus === 'paid' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>

                {purchase.paymentReference && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Payment Reference</Typography>
                    <Typography variant="body1">{purchase.paymentReference}</Typography>
                  </Box>
                )}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Box textAlign="center">
                <Typography variant="h5" fontWeight="bold" color="info.main">
                  {formatCurrency(purchase.total)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Amount
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Inventory color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Actions</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={handlePrint}
                  color="info"
                >
                  Print Purchase Order
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  component={RouterLink}
                  to={`/purchases/new?supplier=${encodeURIComponent(purchase.supplier?.name || '')}`}
                  color="info"
                >
                  New Purchase from Supplier
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Purchase Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="ordered">Ordered</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            color="primary"
            disabled={newStatus === purchase.status}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Purchase</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this purchase? This action cannot be undone.
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
