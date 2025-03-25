import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Avatar//,
  //Chip
} from '@mui/material';
import { Add, Delete, Edit, Search, Visibility, Image as ImageIcon } from '@mui/icons-material';
import { useSales, useDeleteSale } from '@hooks/useSales';
import { formatCurrency, formatDate } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import StatusChip from '@components/ui/StatusChip';

export default function SalesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: sales = [], isLoading, error } = useSales();
  const deleteSale = useDeleteSale();

  // Filter sales when search query changes
  const filteredSales = searchQuery
    ? sales.filter(sale =>
        (sale.customerName && sale.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sale._id && sale._id.includes(searchQuery))
      )
    : sales;

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sale? This will restore inventory quantities.')) {
      try {
        await deleteSale.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete sale:', error);
      }
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorFallback error={error as Error} message="Failed to load sales" />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Sales
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          component={RouterLink}
          to="/sales/new"
        >
          New Sale
        </Button>
      </Box>

      <TextField
        fullWidth
        margin="normal"
        variant="outlined"
        placeholder="Search by customer name or sale ID..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {filteredSales.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No sales found. Click "New Sale" to record your first sale.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSales.map((sale) => {
                // Calculate total items, accounting for both quantity and weight-based items
                const totalItems = sale.items.reduce((total, item) => {
                  // For quantity-based items, add the quantity
                  // For weight-based items, we count them as 1 item each
                  return total + item.quantity;
                }, 0);

                return (
                  <TableRow key={sale._id} hover>
                    <TableCell>
                      {sale.createdAt ? formatDate(sale.createdAt) : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <RouterLink to={`/sales/${sale._id}`} style={{ textDecoration: 'none', color: '#0a7ea4' }}>
                        {sale.customerName || 'Walk-in Customer'}
                      </RouterLink>
                    </TableCell>
                    <TableCell>
                      {sale.items.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {typeof sale.items[0].item === 'object' && sale.items[0].item.imageUrl ? (
                            <Avatar
                              src={sale.items[0].item.imageUrl}
                              alt="Item"
                              variant="rounded"
                              sx={{ width: 40, height: 40, mr: 1 }}
                            />
                          ) : (
                            <Avatar
                              variant="rounded"
                              sx={{ width: 40, height: 40, mr: 1, bgcolor: 'action.hover' }}
                            >
                              <ImageIcon color="disabled" fontSize="small" />
                            </Avatar>
                          )}
                          <span>{totalItems} item(s)</span>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(sale.total)}</TableCell>
                    <TableCell>
                      <StatusChip status={sale.status} />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        component={RouterLink}
                        to={`/sales/${sale._id}`}
                        color="info"
                        size="small"
                        title="View details"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        component={RouterLink}
                        to={`/sales/${sale._id}/edit`}
                        color="primary"
                        size="small"
                        title="Edit sale"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => sale._id && handleDelete(sale._id)}
                        title="Delete sale"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
