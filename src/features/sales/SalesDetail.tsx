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
  Person,
  ReceiptLong,
  CalendarToday,
  LocalShipping,
  ShoppingBasket,
  AttachMoney,
  Email,
  Phone,
  LocationOn,
  Add
} from '@mui/icons-material';
import { useSale, useDeleteSale, useUpdateSaleStatus } from '@hooks/useSales';
import { formatCurrency, formatDate } from '@utils/formatters';
import StatusChip from '@components/ui/StatusChip';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import { Sale } from '@custTypes/models';

export default function SalesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: sale, isLoading, error } = useSale(id);
  const deleteSale = useDeleteSale();
  const updateStatus = useUpdateSaleStatus();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (isLoading) {
    return <LoadingScreen message="Loading sale details..." />;
  }

  if (error || !sale) {
    return <ErrorFallback error={error as Error} message="Failed to load sale details" />;
  }

  const handleDelete = async () => {
    try {
      await deleteSale.mutateAsync(id as string);
      navigate('/sales');
    } catch (error) {
      console.error('Failed to delete sale:', error);
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
            to="/sales"
            startIcon={<ArrowBack />}
            variant="outlined"
            size="small"
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" component="h1">
              Sale Details
            </Typography>
            <Typography color="text.secondary">
              Order #{sale.orderNumber}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Print Invoice">
            <IconButton onClick={handlePrint} sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
              <Print />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              setNewStatus(sale.status);
              setStatusDialogOpen(true);
            }}
          >
            Update Status
          </Button>
          <Button
            component={RouterLink}
            to={`/sales/${id}/edit`}
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
          {/* Sale Summary */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ReceiptLong color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Sale Summary</Typography>
                </Box>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Order Number</Typography>
                    <Typography variant="body1" fontWeight={500}>{sale.orderNumber || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Date</Typography>
                    <Typography variant="body1">{formatDate(sale.createdAt || new Date())}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                    <Typography variant="body1">{sale.paymentMethod || 'Cash'}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Box sx={{ mb: 2, textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <StatusChip status={sale.status} size="medium" />
                  </Box>
                  <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(sale.total)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Order Items */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ShoppingBasket color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Order Items</Typography>
            </Box>

            <TableContainer sx={{ mb: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sale.items && sale.items.length > 0 ? (
                    sale.items.map((item, index) => (
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
                        <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                        <TableCell align="right">
                          {item.quantity} {item.unit || 'units'}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center' }}>
                        <Typography color="text.secondary">No items in this order</Typography>
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
                  <Typography fontWeight={500}>{formatCurrency(sale.subtotal || sale.total)}</Typography>
                </Box>

                {sale.discount > 0 && (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: `1px dashed ${theme.palette.divider}`
                  }}>
                    <Typography>Discount:</Typography>
                    <Typography color="error">{formatCurrency(-sale.discount)}</Typography>
                  </Box>
                )}

                {sale.tax > 0 && (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: `1px dashed ${theme.palette.divider}`
                  }}>
                    <Typography>Tax:</Typography>
                    <Typography>{formatCurrency(sale.tax)}</Typography>
                  </Box>
                )}

                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1.5,
                  mt: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  px: 2,
                  borderRadius: 1
                }}>
                  <Typography fontWeight="bold">Total:</Typography>
                  <Typography fontWeight="bold" color="primary.main">
                    {formatCurrency(sale.total)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Notes */}
          {sale.notes && (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalShipping color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Notes</Typography>
              </Box>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{sale.notes}</Typography>
            </Paper>
          )}
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={4}>
          {/* Customer Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Customer Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {sale.customerName || 'Walk-in Customer'}
                  </Typography>
                </Box>

                {sale.customerEmail && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Email fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{sale.customerEmail}</Typography>
                    </Box>
                  </Box>
                )}

                {sale.customerPhone && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Phone fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">{sale.customerPhone}</Typography>
                    </Box>
                  </Box>
                )}

                {sale.customerAddress && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Address</Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {sale.customerAddress}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {!sale.customerName && !sale.customerEmail && !sale.customerPhone && !sale.customerAddress && (
                  <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
                    No customer information provided
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Payment Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {sale.paymentMethod || 'Cash'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">Payment Status</Typography>
                  <Chip
                    label={sale.paymentStatus || 'Paid'}
                    color={sale.paymentStatus === 'paid' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>

                {sale.paymentReference && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Reference</Typography>
                    <Typography variant="body1">{sale.paymentReference}</Typography>
                  </Box>
                )}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Box textAlign="center">
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                  {formatCurrency(sale.total)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Payment
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarToday color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Actions</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={handlePrint}
                >
                  Print Invoice
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  component={RouterLink}
                  to={`/sales/new?customer=${encodeURIComponent(sale.customerName || '')}`}
                >
                  New Sale for Customer
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Sale Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
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
            disabled={newStatus === sale.status}
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
        <DialogTitle>Delete Sale</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this sale? This action cannot be undone.
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
