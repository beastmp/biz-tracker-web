import { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Button, TextField,
  Menu, Chip, InputAdornment, CircularProgress
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { itemsApi, Item } from '../../services/api';

export default function InventoryList() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // States for column filtering
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Load items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await itemsApi.getAll();
        setItems(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error('Failed to fetch inventory items:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Filter items when search query or filter values change
  useEffect(() => {
    let result = [...items];

    // Apply column filters
    Object.entries(filterValues).forEach(([column, value]) => {
      if (value) {
        result = result.filter(item => {
          const itemValue = item[column as keyof Item];
          // Handle different types of values
          if (typeof itemValue === 'string') {
            return itemValue.toLowerCase().includes(value.toLowerCase());
          } else if (typeof itemValue === 'number') {
            return itemValue.toString().includes(value);
          } else if (Array.isArray(itemValue)) {
            return itemValue.some(v =>
              v.toLowerCase().includes(value.toLowerCase())
            );
          }
          return false;
        });
      }
    });

    // Apply general search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    setFilteredItems(result);
  }, [items, searchQuery, filterValues]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemsApi.delete(id);
        setItems(items.filter(item => item._id !== id));
      } catch (err) {
        console.error('Error deleting item:', err);
        setError('Failed to delete item.');
      }
    }
  };

  // Column filter handlers
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>, column: string) => {
    setFilterAnchorEl(event.currentTarget);
    setActiveColumn(column);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
    setActiveColumn(null);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeColumn) return;

    setFilterValues({
      ...filterValues,
      [activeColumn]: e.target.value
    });
  };

  const clearFilter = (column: string) => {
    const newFilterValues = { ...filterValues };
    delete newFilterValues[column];
    setFilterValues(newFilterValues);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Inventory Items ({filteredItems.length})
        </Typography>

        <Box display="flex" gap={2}>
          <TextField
            size="small"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />

          <Button
            component={RouterLink}
            to="/inventory/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Display active filters */}
      {Object.keys(filterValues).length > 0 && (
        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          <Typography variant="body2" sx={{ alignSelf: 'center' }}>
            Active filters:
          </Typography>
          {Object.entries(filterValues).map(([column, value]) => (
            <Chip
              key={column}
              label={`${column}: ${value}`}
              onDelete={() => clearFilter(column)}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
          <Button
            size="small"
            onClick={() => setFilterValues({})}
            variant="outlined"
          >
            Clear All
          </Button>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Box display="flex" alignItems="center">
                  Name
                  <IconButton size="small" onClick={(e) => handleFilterClick(e, 'name')}>
                    <FilterIcon fontSize="small" color={filterValues.name ? 'primary' : 'inherit'} />
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center">
                  SKU
                  <IconButton size="small" onClick={(e) => handleFilterClick(e, 'sku')}>
                    <FilterIcon fontSize="small" color={filterValues.sku ? 'primary' : 'inherit'} />
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center">
                  Category
                  <IconButton size="small" onClick={(e) => handleFilterClick(e, 'category')}>
                    <FilterIcon fontSize="small" color={filterValues.category ? 'primary' : 'inherit'} />
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>
                <Box display="flex" alignItems="center">
                  Price
                  <IconButton size="small" onClick={(e) => handleFilterClick(e, 'price')}>
                    <FilterIcon fontSize="small" color={filterValues.price ? 'primary' : 'inherit'} />
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center">
                  Quantity
                  <IconButton size="small" onClick={(e) => handleFilterClick(e, 'quantity')}>
                    <FilterIcon fontSize="small" color={filterValues.quantity ? 'primary' : 'inherit'} />
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map(item => (
                <TableRow key={item._id}>
                  <TableCell component="th" scope="row">
                    {item.name}
                  </TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.category || '-'}</TableCell>
                  <TableCell>
                    {item.tags && item.tags.length > 0 ? (
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {item.tags.map(tag => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{formatPrice(item.price)}</TableCell>
                  <TableCell>
                    {item.trackingType === 'quantity' ? (
                      // Regular quantity tracking
                      <>
                        {item.quantity}
                        {item.quantity <= 5 && (
                          <Chip
                            label="Low Stock"
                            size="small"
                            color="error"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </>
                    ) : (
                      // Weight tracking
                      <>
                        {item.priceType === 'each' ? (
                          // Display both weight per item and quantity for "price per item"
                          <>
                            {item.quantity > 0 ? (
                              <>
                                {item.quantity} {item.quantity === 1 ? 'item' : 'items'} × {item.weight}{item.weightUnit}
                                {item.quantity <= 3 && (
                                  <Chip
                                    label="Low Stock"
                                    size="small"
                                    color="error"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </>
                            ) : (
                              <Chip
                                label="Out of Stock"
                                size="small"
                                color="error"
                              />
                            )}
                          </>
                        ) : (
                          // Display total weight for "price per weight unit"
                          <>
                            {item.weight}{item.weightUnit}
                            {item.weight <= (
                              item.weightUnit === 'kg' ? 1 :
                              item.weightUnit === 'g' ? 500 :
                              item.weightUnit === 'lb' ? 2 :
                              item.weightUnit === 'oz' ? 16 : 5
                            ) && (
                              <Chip
                                label="Low Stock"
                                size="small"
                                color="error"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      component={RouterLink}
                      to={`/inventory/${item._id}`}
                      color="primary"
                      size="small"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      component={RouterLink}
                      to={`/inventory/${item._id}/edit`}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(item._id as string)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <Box sx={{ p: 2, width: 250 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filter by {activeColumn}
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={activeColumn ? filterValues[activeColumn] || '' : ''}
            onChange={handleFilterChange}
            autoFocus
            placeholder={`Enter ${activeColumn} filter...`}
          />
          <Box display="flex" justifyContent="flex-end" mt={1}>
            <Button size="small" onClick={handleFilterClose}>
              Apply
            </Button>
          </Box>
        </Box>
      </Menu>
    </Box>
  );
}