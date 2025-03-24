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
import { purchasesApi, Purchase } from '../../services/api';

export default function PurchasesList() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch purchases data
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const data = await purchasesApi.getAll();
        setPurchases(data);
        setFilteredPurchases(data);
      } catch (error) {
        console.error('Failed to fetch purchases:', error);
        setError('Failed to load purchases. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  // Filter purchases when search query changes
  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = purchases.filter(purchase => 
        (purchase.supplier.name && purchase.supplier.name.toLowerCase().includes(lowerCaseQuery)) || 
        (purchase.invoiceNumber && purchase.invoiceNumber.toLowerCase().includes(lowerCaseQuery))
      );
      setFilteredPurchases(filtered);
    } else {
      setFilteredPurchases(purchases);
    }
  }, [searchQuery, purchases]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase? This will update inventory quantities.')) {
      return;
    }
    try {
      await purchasesApi.delete(id);
      setPurchases(prevPurchases => prevPurchases.filter(purchase => purchase._id !== id));
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
      month: 'short', 
      day: 'numeric'
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
          Purchases
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          component={RouterLink}
          to="/purchases/new"
        >
          New Purchase
        </Button>
      </Box>

      <TextField
        fullWidth
        margin="normal"
        variant="outlined"
        placeholder="Search by supplier name or invoice number..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {filteredPurchases.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No purchases found
          </Typography>
          <Typography color="textSecondary" sx={{ mt: 1 }}>
            Click "New Purchase" to record your first purchase
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Date</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Invoice #</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPurchases.map((purchase) => {
                return (
                  <TableRow key={purchase._id} hover>
                    <TableCell>
                      {purchase.purchaseDate && formatDate(purchase.purchaseDate)}
                    </TableCell>
                    <TableCell>{purchase.supplier.name}</TableCell>
                    <TableCell>{purchase.invoiceNumber || '-'}</TableCell>
                    <TableCell>{purchase.items.length}</TableCell>
                    <TableCell>{formatCurrency(purchase.total)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={purchase.status.replace('_', ' ')} 
                        color={getStatusColor(purchase.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        component={RouterLink} 
                        to={`/purchases/${purchase._id}`}
                        color="info"
                        size="small"
                        title="View details"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton 
                        component={RouterLink} 
                        to={`/purchases/${purchase._id}/edit`}
                        color="primary"
                        size="small"
                        title="Edit purchase"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        color="error"
                        size="small"
                        onClick={() => purchase._id && handleDelete(purchase._id)}
                        title="Delete purchase"
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