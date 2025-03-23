import { useState, useEffect } from 'react';
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
  CircularProgress,
  Chip
} from '@mui/material';
import { Add, Delete, Edit, Search, Visibility } from '@mui/icons-material';
import { salesApi, Sale } from '../../services/api';

export default function SalesList() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const data = await salesApi.getAll();
        setSales(data);
        setFilteredSales(data);
      } catch (error) {
        console.error('Failed to fetch sales:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = sales.filter(sale => 
        (sale.customerName && sale.customerName.toLowerCase().includes(lowerCaseQuery)) || 
        (sale._id && sale._id.includes(lowerCaseQuery))
      );
      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales);
    }
  }, [searchQuery, sales]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sale? This will restore inventory quantities.')) {
      try {
        await salesApi.delete(id);
        setSales(sales.filter(sale => sale._id !== id));
      } catch (error) {
        console.error('Failed to delete sale:', error);
      }
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
      month: 'short',
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
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
              {filteredSales.map((sale) => (
                <TableRow key={sale._id}>
                  <TableCell>
                    {sale.createdAt && formatDate(sale.createdAt)}
                  </TableCell>
                  <TableCell>
                    <RouterLink to={`/sales/${sale._id}`} style={{ textDecoration: 'none', color: '#0a7ea4' }}>
                      {sale.customerName || 'Guest Customer'}
                    </RouterLink>
                  </TableCell>
                  <TableCell>{sale.items.length} item(s)</TableCell>
                  <TableCell align="right">{formatCurrency(sale.total)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={sale.status.replace('_', ' ')} 
                      color={getStatusColor(sale.status) as any}
                      size="small"
                    />
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}