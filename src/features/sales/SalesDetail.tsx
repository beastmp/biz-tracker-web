import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid2,
  Divider,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar
} from '@mui/material';
import { ArrowBack, Edit, Delete, Print, Image as ImageIcon } from '@mui/icons-material';
import { useSale, useDeleteSale } from '@hooks/useSales';
import { formatCurrency, formatDate, formatPaymentMethod } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import StatusChip from '@components/ui/StatusChip';

export default function SaleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: sale, isLoading, error } = useSale(id);
  const deleteSale = useDeleteSale();

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this sale? This will restore inventory quantities.')) return;

    try {
      await deleteSale.mutateAsync(id);
      navigate('/sales');
    } catch (error) {
      console.error('Failed to delete sale:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !sale) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Sale Not Found
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            component={RouterLink}
            to="/sales"
          >
            Back to Sales
          </Button>
        </Box>
        <ErrorFallback error={error as Error} message="The requested sale could not be found." />
      </Box>
    );
  }

  return (
    <Box className="sale-detail-page">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1">
            Sale Details
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {sale._id}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            component={RouterLink}
            to="/sales"
          >
            Back to Sales
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Edit />}
            component={RouterLink}
            to={`/sales/${id}/edit`}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Delete />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      <Grid2 container spacing={3}>
        <Grid2 size= {{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Sale Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List disablePadding>
              <ListItem disablePadding sx={{ pb: 1 }}>
                <ListItemText
                  primary="Date"
                  secondary={sale.createdAt ? formatDate(sale.createdAt) : 'Unknown'}
                />
              </ListItem>
              <ListItem disablePadding sx={{ pb: 1 }}>
                <ListItemText
                  primary="Status"
                  secondary={<StatusChip status={sale.status} sx={{ mt: 0.5 }} />}
                />
              </ListItem>
              <ListItem disablePadding sx={{ pb: 1 }}>
                <ListItemText
                  primary="Payment Method"
                  secondary={formatPaymentMethod(sale.paymentMethod)}
                />
              </ListItem>
              {sale.notes && (
                <ListItem disablePadding sx={{ pb: 1 }}>
                  <ListItemText
                    primary="Notes"
                    secondary={sale.notes}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid2>

        <Grid2 size= {{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {!sale.customerName && !sale.customerEmail && !sale.customerPhone ? (
              <Typography variant="body2" color="text.secondary">
                No customer information provided
              </Typography>
            ) : (
              <List disablePadding>
                {sale.customerName && (
                  <ListItem disablePadding sx={{ pb: 1 }}>
                    <ListItemText primary="Name" secondary={sale.customerName} />
                  </ListItem>
                )}
                {sale.customerEmail && (
                  <ListItem disablePadding sx={{ pb: 1 }}>
                    <ListItemText primary="Email" secondary={sale.customerEmail} />
                  </ListItem>
                )}
                {sale.customerPhone && (
                  <ListItem disablePadding sx={{ pb: 1 }}>
                    <ListItemText primary="Phone" secondary={sale.customerPhone} />
                  </ListItem>
                )}
              </List>
            )}
          </Paper>
        </Grid2>

        <Grid2 size= {{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Sale Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List disablePadding>
              <ListItem disablePadding sx={{ pb: 1 }}>
                <ListItemText primary="Subtotal" secondary={formatCurrency(sale.subtotal)} />
              </ListItem>
              <ListItem disablePadding sx={{ pb: 1 }}>
                <ListItemText
                  primary="Tax"
                  secondary={`${formatCurrency(sale.taxAmount)} (${sale.taxRate}%)`}
                />
              </ListItem>
              {sale.discountAmount > 0 && (
                <ListItem disablePadding sx={{ pb: 1 }}>
                  <ListItemText
                    primary="Discount"
                    secondary={formatCurrency(sale.discountAmount)}
                  />
                </ListItem>
              )}
            </List>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h5" color="primary">
                {formatCurrency(sale.total)}
              </Typography>
            </Box>
          </Paper>
        </Grid2>

        <Grid2 size= {{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sale Items
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={70}>Image</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Quantity/Weight</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sale.items.map((item, index) => {
                    const itemDetails = typeof item.item === 'object' ? item.item : null;
                    const itemName = itemDetails?.name || 'Unknown Item';
                    const isWeightBased = itemDetails?.trackingType === 'weight';

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
                          {itemName}
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
                        <TableCell align="right">
                          {formatCurrency(item.priceAtSale)}
                          {isWeightBased && itemDetails?.priceType === 'per_weight_unit' &&
                            `/${item.weightUnit || itemDetails.weightUnit}`
                          }
                        </TableCell>
                        <TableCell align="right">
                          {isWeightBased
                            ? `${item.weight} ${item.weightUnit || itemDetails?.weightUnit || 'lb'}`
                            : item.quantity
                          }
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(isWeightBased
                            ? item.priceAtSale * (item.weight || 0)
                            : item.priceAtSale * item.quantity
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid2>
      </Grid2>
    </Box>
  );
}
