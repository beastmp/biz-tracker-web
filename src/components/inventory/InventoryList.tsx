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
  Chip,
  Avatar
} from '@mui/material';
import { Add, Delete, Edit, Search, Visibility, Image as ImageIcon } from '@mui/icons-material';
import { itemsApi, Item } from '../../services/api';

export default function InventoryList() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await itemsApi.getAll();
        setItems(data);
        setFilteredItems(data);
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query) {
      const filtered = items.filter(
        item => 
          item.name.toLowerCase().includes(query) || 
          item.sku.toLowerCase().includes(query) || 
          item.category.toLowerCase().includes(query) ||
          // Also search in tags
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  };

  const handleDelete = async (id: string) => {
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
        placeholder="Search by name, SKU, category, or tag..."
        value={searchQuery}
        onChange={handleSearch}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Quantity/Weight</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item._id}>
                  {/* Image cell */}
                  <TableCell>
                    {item.imageUrl ? (
                      <Avatar
                        src={item.imageUrl}
                        alt={item.name}
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
                  
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>
                    <Chip size="small" label={item.category} />
                  </TableCell>
                  <TableCell align="right">
                    {item.trackingType === 'quantity' 
                      ? `${item.quantity} units` 
                      : `${item.weight} ${item.weightUnit}`}
                  </TableCell>
                  <TableCell align="right">
                    ${item.price.toFixed(2)}
                    {item.priceType === 'per_weight_unit' && `/${item.weightUnit}`}
                  </TableCell>
                  
                  {/* Tags cell */}
                  <TableCell>
                    {item.tags && item.tags.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 200 }}>
                        {item.tags.slice(0, 2).map(tag => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small" 
                            variant="outlined" 
                          />
                        ))}
                        {item.tags.length > 2 && (
                          <Chip 
                            label={`+${item.tags.length - 2}`} 
                            size="small" 
                            variant="outlined" 
                            color="primary" 
                          />
                        )}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  
                  <TableCell align="center">
                    <IconButton 
                      component={RouterLink} 
                      to={`/inventory/${item._id}`}
                      color="info"
                      size="small"
                      title="View details"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton 
                      component={RouterLink} 
                      to={`/inventory/${item._id}/edit`}
                      color="primary"
                      size="small"
                      title="Edit item"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      color="error"
                      size="small"
                      onClick={() => item._id && handleDelete(item._id)}
                      title="Delete item"
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