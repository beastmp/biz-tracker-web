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
import { itemsApi, Item } from '../../services/api';

export default function InventoryList() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await itemsApi.getAll();
        setItems(data);
        setFilteredItems(data);
      } catch (error) {
        console.error('Failed to fetch inventory items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(lowerCaseQuery) || 
        item.sku.toLowerCase().includes(lowerCaseQuery) ||
        item.category.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [searchQuery, items]);

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemsApi.delete(id);
        setItems(prevItems => prevItems.filter(item => item._id !== id));
        setFilteredItems(prevItems => prevItems.filter(item => item._id !== id));
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStockStatus = (item: Item) => {
    if (item.trackingType === 'quantity') {
      if (item.quantity === 0) return { label: 'Out of Stock', color: 'error' };
      if (item.quantity < 5) return { label: 'Low Stock', color: 'warning' };
      return { label: 'In Stock', color: 'success' };
    } else {
      // Weight-based tracking
      if (item.weight === 0) return { label: 'Out of Stock', color: 'error' };
      if (item.weight < 5) return { label: 'Low Stock', color: 'warning' };
      return { label: 'In Stock', color: 'success' };
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
          Inventory
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          component={RouterLink}
          to="/inventory/new"
        >
          Add Item
        </Button>
      </Box>

      <TextField
        fullWidth
        margin="normal"
        variant="outlined"
        placeholder="Search by name, SKU, or category..."
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

      {filteredItems.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No inventory items found. Click "Add Item" to create your first inventory item.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => {
                const status = getStockStatus(item);
                return (
                  <TableRow key={item._id}>
                    <TableCell component="th" scope="row">
                      <RouterLink to={`/inventory/${item._id}`} style={{ textDecoration: 'none', color: '#0a7ea4' }}>
                        {item.name}
                      </RouterLink>
                    </TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <Chip 
                        label={
                          item.trackingType === 'quantity' 
                            ? `${item.quantity} in stock` 
                            : `${item.weight} ${item.weightUnit} in stock`
                        } 
                        color={status.color as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(item.price)}
                      {item.priceType === 'per_weight_unit' && `/${item.weightUnit}`}
                    </TableCell>
                    <TableCell align="right">
                      {item.trackingType === 'quantity' 
                        ? formatCurrency(item.price * item.quantity)
                        : formatCurrency(item.price * item.weight)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        component={RouterLink} 
                        to={`/inventory/${item._id}`}
                        size="small"
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton 
                        component={RouterLink} 
                        to={`/inventory/${item._id}/edit`}
                        size="small"
                        color="secondary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        onClick={() => item._id && handleDeleteItem(item._id)} 
                        size="small"
                        color="error"
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