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
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { ArrowBack, Edit, Delete, Print } from '@mui/icons-material';
import { salesApi, Sale } from '../../services/api';

export default function SaleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSale = async () => {
      if (!id) return;
      
      try {
        const data = await salesApi.getById(id);
        setSale(data);
      } catch (error) {
        console.error('Failed to fetch sale:', error);
        setError('Failed to load sale details. The sale may have been deleted.');
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this sale? This will restore inventory quantities.')) return;
    
    try {
      await salesApi.delete(id);
      navigate('/sales');
    } catch (error) {
      console.error('Failed to delete sale:', error);
      setError('Failed to delete sale. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
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
      case 'completed': return 'success';
      case 'refunded': return 'error';
      case 'partially_refunded': return 'warning';
      default: return 'default';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'credit': return 'Credit Card';
      case 'debit': return 'Debit Card';
      case 'check': return 'Check';
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
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="error">
            {error || "The requested sale could not be found."}
          </Typography>
        </Paper>
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
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
                  secondary={
                    <Chip 
                      label={sale.status.replace('_', ' ')} 
                      color={getStatusColor(sale.status) as any}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  }
                />
              </ListItem>
              <ListItem disablePadding sx={{ pb: 1 }}>
                <ListItemText 
                  primary="Payment Method" 
                  secondary={getPaymentMethodLabel(sale.paymentMethod)}
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
        </Grid>
        
        <Grid item xs={12} md={4}>
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
        </Grid>
        
        <Grid item xs={12} md={4}>
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
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sale Items
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
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
                        <TableCell>{itemName}</TableCell>
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
        </Grid>
      </Grid>
    </Box>
  );
}