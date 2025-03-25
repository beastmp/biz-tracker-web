import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Paper,
  Divider,
  Menu,
  MenuItem,
  //ListItemIcon,
  ListItemText,
  Tooltip,
  Stack,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  //FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Sort as SortIcon,
  //FilterAlt as FilterAltIcon,
  GridView as GridViewIcon,
  List as ListViewIcon,
  TrendingDown as LowStockIcon,
  TrendingUp as HighStockIcon
} from '@mui/icons-material';
import { useItems, useDeleteItem, useCategories } from '@hooks/useItems';
import { Item } from '@custTypes/models';
import { formatCurrency } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';

export default function InventoryList() {
  const { data: items = [], isLoading, error } = useItems();
  const { data: categories = [] } = useCategories();
  const deleteItem = useDeleteItem();

  // View state (grid vs list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  //const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  // Filter and sort items
  const filteredItems = items.filter(item => {
    // Search query filter
    if (searchQuery && !(
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    )) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'stock-asc':
        if (a.trackingType === 'quantity' && b.trackingType === 'quantity') {
          return a.quantity - b.quantity;
        }
        return 0;
      case 'stock-desc':
        if (a.trackingType === 'quantity' && b.trackingType === 'quantity') {
          return b.quantity - a.quantity;
        }
        return 0;
      default:
        return 0;
    }
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem.mutateAsync(id);
      } catch (err) {
        console.error('Error deleting item:', err);
      }
    }
  };

  // Determine stock status color based on item tracking type and quantity/weight
  const getStockStatusColor = (item: Item): 'success' | 'warning' | 'error' => {
    if (item.trackingType === 'quantity') {
      if (item.quantity <= 0) return 'error';
      if (item.quantity <= 5) return 'warning';
      return 'success';
    } else {
      // Weight tracking
      if (item.priceType === 'each') {
        if (item.quantity <= 0) return 'error';
        if (item.quantity <= 3) return 'warning';
        return 'success';
      } else {
        // Price per weight unit
        if (item.weight <= 0) return 'error';
        const threshold =
          item.weightUnit === 'kg' ? 1 :
          item.weightUnit === 'g' ? 500 :
          item.weightUnit === 'lb' ? 2 :
          item.weightUnit === 'oz' ? 16 : 5;

        if (item.weight <= threshold) return 'warning';
        return 'success';
      }
    }
  };

  // Get stock status label
  const getStockStatusLabel = (item: Item): string => {
    if (item.trackingType === 'quantity') {
      if (item.quantity <= 0) return 'Out of stock';
      if (item.quantity <= 5) return `Low stock: ${item.quantity} left`;
      return `${item.quantity} in stock`;
    } else {
      if (item.priceType === 'each') {
        if (item.quantity <= 0) return 'Out of stock';
        return `${item.quantity} × ${item.weight}${item.weightUnit}`;
      } else {
        return `${item.weight}${item.weightUnit} in stock`;
      }
    }
  };

  // Calculate total inventory value for an item
  const calculateTotalValue = (item: Item): number => {
    if (item.trackingType === 'quantity') {
      return item.price * item.quantity;
    } else {
      // Weight tracking
      if (item.priceType === 'each') {
        return item.price * (item.quantity || 0);
      } else {
        return item.price * item.weight;
      }
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorFallback error={error as Error} message="Failed to load inventory items" />;
  }

  return (
    <Box>
      {/* Header with title and actions */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h4" component="h1">
              Inventory
            </Typography>
            <Typography color="text.secondary" variant="subtitle1">
              {filteredItems.length} items • Total value: {formatCurrency(
                filteredItems.reduce((total, item) => total + calculateTotalValue(item), 0)
              )}
            </Typography>
          </Grid>
          <Grid item>
            <Button
              component={RouterLink}
              to="/inventory/new"
              variant="contained"
              startIcon={<AddIcon />}
              size="large"
            >
              Add Item
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Search and Filters Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search items..."
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
                    <IconButton size="small" onClick={() => setSearchQuery('')} edge="end">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              size="small"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                input={<OutlinedInput label="Category" />}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={(e) => setSortMenuAnchor(e.currentTarget)}
              sx={{ height: '40px' }}
            >
              {sortBy === 'name' && 'Sort by Name'}
              {sortBy === 'price-asc' && 'Price: Low to High'}
              {sortBy === 'price-desc' && 'Price: High to Low'}
              {sortBy === 'stock-asc' && 'Stock: Low to High'}
              {sortBy === 'stock-desc' && 'Stock: High to Low'}
            </Button>
            <Menu
              anchorEl={sortMenuAnchor}
              open={Boolean(sortMenuAnchor)}
              onClose={() => setSortMenuAnchor(null)}
            >
              <MenuItem onClick={() => { setSortBy('name'); setSortMenuAnchor(null); }}>
                <ListItemText>Sort by Name</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setSortBy('price-asc'); setSortMenuAnchor(null); }}>
                <ListItemText>Price: Low to High</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setSortBy('price-desc'); setSortMenuAnchor(null); }}>
                <ListItemText>Price: High to Low</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setSortBy('stock-asc'); setSortMenuAnchor(null); }}>
                <ListItemText>Stock: Low to High</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setSortBy('stock-desc'); setSortMenuAnchor(null); }}>
                <ListItemText>Stock: High to Low</ListItemText>
              </MenuItem>
            </Menu>
          </Grid>

          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Tooltip title="Grid View">
                <IconButton
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                  onClick={() => setViewMode('grid')}
                >
                  <GridViewIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="List View">
                <IconButton
                  color={viewMode === 'list' ? 'primary' : 'default'}
                  onClick={() => setViewMode('list')}
                >
                  <ListViewIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Count and Active Filters */}
      {(searchQuery || selectedCategory !== 'all') && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredItems.length} results found
            {selectedCategory !== 'all' && (
              <Chip
                label={`Category: ${selectedCategory}`}
                size="small"
                onDelete={() => setSelectedCategory('all')}
                sx={{ ml: 1 }}
              />
            )}
            {searchQuery && (
              <Chip
                label={`Search: ${searchQuery}`}
                size="small"
                onDelete={() => setSearchQuery('')}
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
      )}

      {/* No Results Found */}
      {filteredItems.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No items found
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            {items.length > 0
              ? 'Try adjusting your search or filter criteria'
              : 'Add your first inventory item to get started'}
          </Typography>
          <Button
            component={RouterLink}
            to="/inventory/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Item
          </Button>
        </Paper>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredItems.length > 0 && (
        <Grid container spacing={3}>
          {filteredItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
              <Card sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}>
                {/* Card Header - Image */}
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="div"
                    sx={{
                      height: 140,
                      backgroundColor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    image={item.imageUrl}
                  >
                    {!item.imageUrl && (
                      <Typography variant="body2" color="text.secondary">
                        No image
                      </Typography>
                    )}
                  </CardMedia>

                  {/* Stock Status Badge */}
                  <Chip
                    label={getStockStatusLabel(item)}
                    color={getStockStatusColor(item)}
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>

                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  {/* Category */}
                  {item.category && (
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      {item.category}
                    </Typography>
                  )}

                  {/* Item Name */}
                  <Typography variant="h6" component="h2" gutterBottom noWrap title={item.name}>
                    {item.name}
                  </Typography>

                  {/* SKU */}
                  <Typography variant="caption" color="text.secondary" display="block">
                    SKU: {item.sku}
                  </Typography>

                  {/* Price */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(item.price)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'flex-end' }}>
                      {formatCurrency(calculateTotalValue(item))} total
                    </Typography>
                  </Box>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {item.tags.slice(0, 3).map(tag => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                      {item.tags.length > 3 && (
                        <Chip
                          label={`+${item.tags.length - 3}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  )}
                </CardContent>

                <Divider />

                {/* Actions */}
                <CardActions>
                  <Button
                    component={RouterLink}
                    to={`/inventory/${item._id}`}
                    size="small"
                    startIcon={<ViewIcon />}
                  >
                    View
                  </Button>
                  <Button
                    component={RouterLink}
                    to={`/inventory/${item._id}/edit`}
                    size="small"
                    startIcon={<EditIcon />}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => item._id && handleDelete(item._id)}
                    sx={{ marginLeft: 'auto' }}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* List View */}
      {viewMode === 'list' && filteredItems.length > 0 && (
        <Paper>
          {filteredItems.map((item, index) => (
            <Box key={item._id}>
              {index > 0 && <Divider />}
              <Box sx={{
                p: 2,
                '&:hover': { bgcolor: 'action.hover' }
              }}>
                <Grid container spacing={2} alignItems="center">
                  {/* Image */}
                  <Grid item xs={12} sm={2} md={1}>
                    <Box
                      sx={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: 'action.hover',
                        backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {!item.imageUrl && (
                        <Typography variant="caption" color="text.secondary">
                          No image
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Item Details */}
                  <Grid item xs={12} sm={5} md={6}>
                    <Box>
                      <Typography variant="h6">{item.name}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          SKU: {item.sku}
                        </Typography>
                        {item.category && (
                          <Chip
                            label={item.category}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                        {item.tags && item.tags.slice(0, 2).map(tag => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Grid>

                  {/* Stock */}
                  <Grid item xs={6} sm={2}>
                    <Chip
                      icon={getStockStatusColor(item) === 'error' || getStockStatusColor(item) === 'warning' ?
                        <LowStockIcon fontSize="small" /> : <HighStockIcon fontSize="small" />}
                      label={getStockStatusLabel(item)}
                      color={getStockStatusColor(item)}
                      size="small"
                    />
                  </Grid>

                  {/* Price */}
                  <Grid item xs={6} sm={2} md={1.5}>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(item.price)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total: {formatCurrency(calculateTotalValue(item))}
                    </Typography>
                  </Grid>

                  {/* Actions */}
                  <Grid item xs={12} sm={3} md={1.5}>
                    <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          component={RouterLink}
                          to={`/inventory/${item._id}`}
                          size="small"
                          color="info"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Item">
                        <IconButton
                          component={RouterLink}
                          to={`/inventory/${item._id}/edit`}
                          size="small"
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Item">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => item._id && handleDelete(item._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}
