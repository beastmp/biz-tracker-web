import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
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
  ListItemText,
  Tooltip,
  Stack,
  Select,
  FormControl,
  InputLabel,
  Grid2,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Sort as SortIcon,
  GridView as GridViewIcon,
  List as ListViewIcon,
  TrendingDown as LowStockIcon,
  TrendingUp as HighStockIcon,
  Construction,
  Link as LinkIcon,
  BarChart as BarChartIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack
} from '@mui/icons-material';
import { useItems, useDeleteItem, useUpdateItem } from '@hooks/useItems';
import { Item, ItemType } from '@custTypes/models';
import { formatCurrency } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import { useSettings } from '@context/SettingsContext';

export default function InventoryList() {
  const { data: items = [], isLoading, error } = useItems();
  const deleteItem = useDeleteItem();
  const { lowStockAlertsEnabled, quantityThreshold, weightThresholds, defaultViewMode, defaultGroupBy } = useSettings();

  // Initialize view mode from settings
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode);

  // Initialize groupBy from settings default
  const [groupBy, setGroupBy] = useState<'none' | 'itemType' | 'category'>(defaultGroupBy);

  // Add state for the selected group
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Update view mode if settings change
  useEffect(() => {
    setViewMode(defaultViewMode);
  }, [defaultViewMode]);

  // Update groupBy if default setting changes
  useEffect(() => {
    setGroupBy(defaultGroupBy);
  }, [defaultGroupBy]);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  // Remove the selectedCategory and selectedType state variables since we're now using grouping
  // We're keeping the filter logic in filteredItems though for backward compatibility

  // Add new state variables and hooks
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newQuantity, setNewQuantity] = useState<string>('');
  const [newWeight, setNewWeight] = useState<string>('');
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const updateItem = useUpdateItem(editingItem || undefined);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        // Search query filter
        if (searchQuery && !(
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
        )) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
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
  }, [items, searchQuery, sortBy]);

  const groupedItems = useMemo(() => {
    if (groupBy === 'none') {
      return { ungrouped: filteredItems };
    }

    // Group items by the selected property
    return filteredItems.reduce((groups, item) => {
      let key;

      if (groupBy === 'itemType') {
        // Get a nice display name for item types
        switch (item.itemType) {
          case 'material': key = 'Materials'; break;
          case 'product': key = 'Products'; break;
          case 'both': key = 'Materials & Products'; break;
          default: key = 'Other Items';
        }
      } else {
        key = item.category || 'Uncategorized';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, Item[]>);
  }, [filteredItems, groupBy]);

  // Add secondary grouping logic for the detail view
  const secondaryGroupedItems = useMemo(() => {
    // Only apply secondary grouping when viewing a specific group
    if (!selectedGroup) return {};

    // Get items for the selected group
    const itemsToGroup = groupedItems[selectedGroup] || [];

    // Determine secondary grouping criteria based on primary grouping
    const secondaryGroupBy = groupBy === 'category' ? 'itemType' : 'category';

    // Group the items by the secondary criteria
    return itemsToGroup.reduce((groups, item) => {
      let key;

      if (secondaryGroupBy === 'itemType') {
        // Get display name for item types
        switch (item.itemType) {
          case 'material': key = 'Materials'; break;
          case 'product': key = 'Products'; break;
          case 'both': key = 'Materials & Products'; break;
          default: key = 'Other Items';
        }
      } else {
        // Group by category
        key = item.category || 'Uncategorized';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, Item[]>);
  }, [selectedGroup, groupedItems, groupBy]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem.mutateAsync(id);
      } catch (err) {
        console.error('Error deleting item:', err);
      }
    }
  };

  // Add handler for updating inventory
  const handleUpdateInventory = async (itemId: string) => {
    if (!itemId || itemId.trim() === '') {
      console.error('Invalid item ID');
      return;
    }

    const item = items.find(i => i._id === itemId);
    if (!item) return;

    try {
      // Set editingItem first (which will cause the updateItem hook to reinitialize)
      setEditingItem(itemId);

      // Create update data without the spread of the entire item
      // Just include the specific fields we want to update
      const updateData: Partial<Item> = {
        _id: itemId, // Make sure this is included
        lastUpdated: new Date(),
        ...(item.trackingType === 'quantity'
            ? { quantity: parseFloat(newQuantity) || 0 }
            : { weight: parseFloat(newWeight) || 0 })
      };

      // Use the hook after it has the correct ID
      await updateItem.mutateAsync(updateData as Item);

      // Show success message and reset state
      setUpdateSuccess(`Updated ${item.name}`);
      setTimeout(() => setUpdateSuccess(null), 3000);

      setEditingItem(null);
      setNewQuantity('');
      setNewWeight('');
    } catch (err) {
      console.error('Failed to update inventory:', err);
    }
  };

  // Add function to begin editing an item
  const startEditing = (item: Item) => {
    setEditingItem(item._id || null);
    if (item.trackingType === 'quantity') {
      setNewQuantity(item.quantity.toString());
    } else {
      setNewWeight(item.weight.toString());
    }
  };

  // Add cancel editing function
  const cancelEditing = () => {
    setEditingItem(null);
    setNewQuantity('');
    setNewWeight('');
  };

  // Memoize helper functions
  const getStockStatusColor = useCallback((item: Item): 'success' | 'warning' | 'error' => {
    if (item.trackingType === 'quantity') {
      if (item.quantity <= 0) return 'error';
      if (!lowStockAlertsEnabled) return 'success';
      if (item.quantity <= quantityThreshold) return 'warning';
      return 'success';
    } else {
      // Weight tracking
      if (item.priceType === 'each') {
        if (item.quantity <= 0) return 'error';
        if (!lowStockAlertsEnabled) return 'success';
        if (item.quantity <= 3) return 'warning'; // Consider adding a separate threshold for packages
        return 'success';
      } else {
        // Price per weight unit
        if (item.weight <= 0) return 'error';
        if (!lowStockAlertsEnabled) return 'success';

        // Use configured thresholds based on weight unit
        const threshold =
          item.weightUnit === 'kg' ? weightThresholds.kg :
          item.weightUnit === 'g' ? weightThresholds.g :
          item.weightUnit === 'lb' ? weightThresholds.lb :
          item.weightUnit === 'oz' ? weightThresholds.oz : 5;

        if (item.weight <= threshold) return 'warning';
        return 'success';
      }
    }
  }, [lowStockAlertsEnabled, quantityThreshold, weightThresholds]);

  // Get stock status label
  const getStockStatusLabel = (item: Item): string => {
    if (item.trackingType === 'quantity') {
      if (item.quantity <= 0) return 'Out of stock';
      if (lowStockAlertsEnabled && item.quantity <= quantityThreshold) return `Low stock: ${item.quantity} left`;
      return `${item.quantity} in stock`;
    } else {
      if (item.priceType === 'each') {
        if (item.quantity <= 0) return 'Out of stock';
        return `${item.quantity} × ${item.weight}${item.weightUnit}`;
      } else {
        const threshold =
          item.weightUnit === 'kg' ? weightThresholds.kg :
          item.weightUnit === 'g' ? weightThresholds.g :
          item.weightUnit === 'lb' ? weightThresholds.lb :
          item.weightUnit === 'oz' ? weightThresholds.oz : 5;

        if (item.weight <= 0) return 'Out of stock';
        if (lowStockAlertsEnabled && item.weight <= threshold) return `Low: ${item.weight}${item.weightUnit}`;
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

  // Add item type chip to your table row or card view
  const getItemTypeChip = (itemType: ItemType) => {
    switch(itemType) {
      case 'material':
        return <Chip size="small" label="Material" color="primary" variant="outlined" />;
      case 'product':
        return <Chip size="small" label="Product" color="success" variant="outlined" />;
      case 'both':
        return <Chip size="small" label="Material & Product" color="secondary" variant="outlined" />;
      default:
        return <Chip size="small" label="Product" color="success" variant="outlined" />;
    }
  };

  // Add a helper function to calculate total value of items in a group
  const calculateGroupValue = (groupItems: Item[]): number => {
    return groupItems.reduce((total, item) => total + calculateTotalValue(item), 0);
  };

  // Add a helper function to get group description
  const getGroupDescription = (groupKey: string, groupItems: Item[]): string => {
    return `${groupItems.length} items • Total value: ${formatCurrency(calculateGroupValue(groupItems))}`;
  };

  // Add component for rendering group cards
  const renderGroupCards = () => {
    return (
      <Grid2 container spacing={3}>
        {Object.entries(groupedItems).map(([group, groupItems]) => (
          <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={group}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => setSelectedGroup(group)}
            >
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  {group === 'ungrouped' ? 'All Items' : group}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getGroupDescription(group, groupItems)}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => setSelectedGroup(group)}>
                  View {groupItems.length} Items
                </Button>
              </CardActions>
            </Card>
          </Grid2>
        ))}
      </Grid2>
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorFallback error={error as Error} message="Failed to load inventory items" />;
  }

  return (
    <Box>
      {updateSuccess && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setUpdateSuccess(null)}
        >
          {updateSuccess}
        </Alert>
      )}
      {/* Header with title and actions */}
      <Box sx={{ mb: 3 }}>
        <Grid2 container spacing={2} alignItems="center">
          <Grid2 size="grow">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h4" component="h1">
                {selectedGroup ?
                  (selectedGroup === 'ungrouped' ? 'All Items' : selectedGroup) :
                  'Inventory'}
              </Typography>
              {selectedGroup && (
                <Button
                  startIcon={<ArrowBack />}
                  onClick={() => setSelectedGroup(null)}
                  sx={{ ml: 2 }}
                >
                  Back to Groups
                </Button>
              )}
            </Box>
            <Typography color="text.secondary" variant="subtitle1">
              {selectedGroup ?
                getGroupDescription(
                  selectedGroup,
                  groupedItems[selectedGroup] || []
                ) :
                `${filteredItems.length} items • Total value: ${formatCurrency(
                  filteredItems.reduce((total, item) => total + calculateTotalValue(item), 0)
                )}`
              }
            </Typography>
          </Grid2>
          <Grid2>
            <Stack direction="row" spacing={1}>
              <Button
                component={RouterLink}
                to="/inventory/profit-analysis"
                variant="outlined"
                startIcon={<BarChartIcon />}
                sx={{ mr: 1 }}
              >
                Profit Analysis
              </Button>
              <Button
                component={RouterLink}
                to="/inventory/new"
                variant="contained"
                startIcon={<AddIcon />}
                size="large"
              >
                Add Item
              </Button>
            </Stack>
          </Grid2>
        </Grid2>
      </Box>

      {/* Search and Filters Bar - Context-aware based on view */}
      <Paper sx={{ p: 2, mb: 3 }}>
        {/* Groups view filters - simplified when showing groups */}
        {!selectedGroup ? (
          <Grid2 container spacing={2} alignItems="center">
            <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
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
            </Grid2>

            <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Group By</InputLabel>
                <Select
                  value={groupBy}
                  onChange={(e) => {
                    setGroupBy(e.target.value as 'none' | 'itemType' | 'category');
                    setSelectedGroup(null);
                  }}
                  label="Group By"
                >
                  <MenuItem value="none">No Grouping</MenuItem>
                  <MenuItem value="itemType">Item Type</MenuItem>
                  <MenuItem value="category">Category</MenuItem>
                </Select>
              </FormControl>
            </Grid2>

            {/* Remove the Item Type filter from the group view */}
            <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
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
            </Grid2>
          </Grid2>
        ) : (
          // Items view filters - simplified to just search and sort
          <>
            <Grid2 container spacing={2} alignItems="center">
              {/* Search Field */}
              <Grid2 size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  placeholder="Search in this group..."
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
              </Grid2>

              {/* Sorting Options */}
              <Grid2 size={{ xs: 12, md: 4 }}>
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
              </Grid2>

              {/* View Mode Toggles */}
              <Grid2 size={{ xs: 12, md: 2 }}>
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
              </Grid2>
            </Grid2>

            {/* Remove the additional filters row since we're using contextual grouping */}
          </>
        )}
      </Paper>

      {/* Results Count and Active Filters */}
      {searchQuery && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredItems.length} results found
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

      {/* Show either group cards or items in the selected group */}
      {filteredItems.length > 0 && (
        <>
          {/* Show group cards when no group is selected and grouping is active */}
          {groupBy !== 'none' && !selectedGroup && renderGroupCards()}

          {/* Show all items when no grouping, or show items in selected group with secondary grouping */}
          {(groupBy === 'none' || selectedGroup) && (
            <>
              {/* When viewing a specific group, apply secondary grouping */}
              {selectedGroup && Object.keys(secondaryGroupedItems).length > 0 ? (
                // Render with secondary grouping
                <>
                  {Object.entries(secondaryGroupedItems).map(([subgroup, subgroupItems]) => (
                    <Box key={subgroup} sx={{ mb: 4 }}>
                      {/* Subgroup Header */}
                      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                        {subgroup}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {getGroupDescription(subgroup, subgroupItems)}
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      {/* Grid View for this subgroup */}
                      {viewMode === 'grid' && (
                        <Grid2 container spacing={3}>
                          {subgroupItems.map((item) => (
                            <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3}} key={item._id}>
                              {/* Existing card component */}
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
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    {item._id === editingItem ? (
                                      // Editing mode
                                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <TextField
                                          size="small"
                                          type="number"
                                          value={item.trackingType === 'quantity' ? newQuantity : newWeight}
                                          onChange={(e) => item.trackingType === 'quantity'
                                            ? setNewQuantity(e.target.value)
                                            : setNewWeight(e.target.value)
                                          }
                                          InputProps={{
                                            endAdornment: item.trackingType === 'weight' && (
                                              <InputAdornment position="end">{item.weightUnit}</InputAdornment>
                                            ),
                                          }}
                                          sx={{ width: '100px' }}
                                          autoFocus
                                        />
                                        <IconButton
                                          color="primary"
                                          size="small"
                                          onClick={() => handleUpdateInventory(item._id || '')}
                                          sx={{ ml: 1 }}
                                        >
                                          <SaveIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          color="error"
                                          size="small"
                                          onClick={cancelEditing}
                                          sx={{ ml: 0.5 }}
                                        >
                                          <CancelIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    ) : (
                                      // Display mode
                                      <>
                                        <Chip
                                          label={getStockStatusLabel(item)}
                                          color={getStockStatusColor(item)}
                                          size="small"
                                        />
                                        <IconButton
                                          size="small"
                                          onClick={() => startEditing(item)}
                                          sx={{ ml: 1 }}
                                          title="Edit Quantity"
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </>
                                    )}
                                  </Box>
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
                                  <Box sx={{ display: 'flex', mb: 1 }}>
                                    {getItemTypeChip(item.itemType)}
                                  </Box>
                                  {/* Component relationship badges */}
                                  {item.components && item.components.length > 0 && (
                                    <Tooltip title={`Contains ${item.components.length} materials`}>
                                      <Chip
                                        size="small"
                                        icon={<Construction fontSize="small" />}
                                        label={`${item.components.length}`}
                                        color="secondary"
                                        variant="outlined"
                                        sx={{ ml: 1 }}
                                      />
                                    </Tooltip>
                                  )}

                                  {item.usedInProducts && item.usedInProducts.length > 0 && (
                                    <Tooltip title={`Used in ${item.usedInProducts.length} products`}>
                                      <Chip
                                        size="small"
                                        icon={<LinkIcon fontSize="small" />}
                                        label={`${item.usedInProducts.length}`}
                                        color="info"
                                        variant="outlined"
                                        sx={{ ml: 1 }}
                                      />
                                    </Tooltip>
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
                            </Grid2>
                          ))}
                        </Grid2>
                      )}

                      {/* List View for this subgroup */}
                      {viewMode === 'list' && (
                        <Paper sx={{ mb: 3 }}>
                          {subgroupItems.map((item, index) => (
                            <Box key={item._id}>
                              {index > 0 && <Divider />}
                              <Box sx={{
                                p: 2,
                                '&:hover': { bgcolor: 'action.hover' }
                              }}>
                                <Grid2 container spacing={2} alignItems="center">
                                  {/* Image */}
                                  <Grid2 size={{ xs: 12, sm: 2, md: 1 }}>
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
                                  </Grid2>

                                  {/* Item Details */}
                                  <Grid2 size={{ xs: 12, sm: 5, md: 6 }}>
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
                                  </Grid2>

                                  {/* Stock */}
                                  <Grid2 size={{ xs: 6, sm: 2 }}>
                                    {item._id === editingItem ? (
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <TextField
                                          size="small"
                                          type="number"
                                          value={item.trackingType === 'quantity' ? newQuantity : newWeight}
                                          onChange={(e) => item.trackingType === 'quantity'
                                            ? setNewQuantity(e.target.value)
                                            : setNewWeight(e.target.value)
                                          }
                                          InputProps={{
                                            endAdornment: item.trackingType === 'weight' && (
                                              <InputAdornment position="end">{item.weightUnit}</InputAdornment>
                                            ),
                                          }}
                                          sx={{ width: '100px' }}
                                          autoFocus
                                        />
                                        <IconButton
                                          color="primary"
                                          size="small"
                                          onClick={() => handleUpdateInventory(item._id || '')}
                                        >
                                          <SaveIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          color="error"
                                          size="small"
                                          onClick={cancelEditing}
                                        >
                                          <CancelIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    ) : (
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Chip
                                          icon={getStockStatusColor(item) === 'error' || getStockStatusColor(item) === 'warning' ?
                                            <LowStockIcon fontSize="small" /> : <HighStockIcon fontSize="small" />}
                                          label={getStockStatusLabel(item)}
                                          color={getStockStatusColor(item)}
                                          size="small"
                                        />
                                        <IconButton
                                          size="small"
                                          onClick={() => startEditing(item)}
                                          sx={{ ml: 1 }}
                                          title="Edit Quantity"
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    )}
                                  </Grid2>

                                  {/* Price */}
                                  <Grid2 size={{ xs: 6, sm: 2, md: 1.5 }}>
                                    <Typography variant="h6" color="primary">
                                      {formatCurrency(item.price)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Total: {formatCurrency(calculateTotalValue(item))}
                                    </Typography>
                                  </Grid2>

                                  {/* Actions */}
                                  <Grid2 size={{ xs: 12, sm: 3, md: 1.5 }}>
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
                                  </Grid2>
                                </Grid2>
                              </Box>
                            </Box>
                          ))}
                        </Paper>
                      )}
                    </Box>
                  ))}
                </>
              ) : (
                // Regular view without secondary grouping (for "All Items" or "No Grouping")
                <>
                  {/* Grid View */}
                  {viewMode === 'grid' && (
                    <>
                      <Grid2 container spacing={3}>
                        {(selectedGroup ?
                          groupedItems[selectedGroup] || [] :
                          filteredItems
                        ).map((item) => (
                          // Existing item card code
                          <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3}} key={item._id}>
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
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                  {item._id === editingItem ? (
                                    // Editing mode
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                      <TextField
                                        size="small"
                                        type="number"
                                        value={item.trackingType === 'quantity' ? newQuantity : newWeight}
                                        onChange={(e) => item.trackingType === 'quantity'
                                          ? setNewQuantity(e.target.value)
                                          : setNewWeight(e.target.value)
                                        }
                                        InputProps={{
                                          endAdornment: item.trackingType === 'weight' && (
                                            <InputAdornment position="end">{item.weightUnit}</InputAdornment>
                                          ),
                                        }}
                                        sx={{ width: '100px' }}
                                        autoFocus
                                      />
                                      <IconButton
                                        color="primary"
                                        size="small"
                                        onClick={() => handleUpdateInventory(item._id || '')}
                                        sx={{ ml: 1 }}
                                      >
                                        <SaveIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        color="error"
                                        size="small"
                                        onClick={cancelEditing}
                                        sx={{ ml: 0.5 }}
                                      >
                                        <CancelIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  ) : (
                                    // Display mode
                                    <>
                                      <Chip
                                        label={getStockStatusLabel(item)}
                                        color={getStockStatusColor(item)}
                                        size="small"
                                      />
                                      <IconButton
                                        size="small"
                                        onClick={() => startEditing(item)}
                                        sx={{ ml: 1 }}
                                        title="Edit Quantity"
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </>
                                  )}
                                </Box>
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
                                <Box sx={{ display: 'flex', mb: 1 }}>
                                  {getItemTypeChip(item.itemType)}
                                </Box>
                                {/* Component relationship badges */}
                                {item.components && item.components.length > 0 && (
                                  <Tooltip title={`Contains ${item.components.length} materials`}>
                                    <Chip
                                      size="small"
                                      icon={<Construction fontSize="small" />}
                                      label={`${item.components.length}`}
                                      color="secondary"
                                      variant="outlined"
                                      sx={{ ml: 1 }}
                                    />
                                  </Tooltip>
                                )}

                                {item.usedInProducts && item.usedInProducts.length > 0 && (
                                  <Tooltip title={`Used in ${item.usedInProducts.length} products`}>
                                    <Chip
                                      size="small"
                                      icon={<LinkIcon fontSize="small" />}
                                      label={`${item.usedInProducts.length}`}
                                      color="info"
                                      variant="outlined"
                                      sx={{ ml: 1 }}
                                    />
                                  </Tooltip>
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
                          </Grid2>
                        ))}
                      </Grid2>
                    </>
                  )}

                  {/* List View */}
                  {viewMode === 'list' && (
                    <Paper>
                      {(selectedGroup ?
                        groupedItems[selectedGroup] || [] :
                        filteredItems
                      ).map((item, index) => (
                        <Box key={item._id}>
                          {index > 0 && <Divider />}
                          <Box sx={{
                            p: 2,
                            '&:hover': { bgcolor: 'action.hover' }
                          }}>
                            <Grid2 container spacing={2} alignItems="center">
                              {/* Image */}
                              <Grid2 size={{ xs: 12, sm: 2, md: 1 }}>
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
                              </Grid2>

                              {/* Item Details */}
                              <Grid2 size={{ xs: 12, sm: 5, md: 6 }}>
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
                              </Grid2>

                              {/* Stock */}
                              <Grid2 size={{ xs: 6, sm: 2 }}>
                                {item._id === editingItem ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={item.trackingType === 'quantity' ? newQuantity : newWeight}
                                      onChange={(e) => item.trackingType === 'quantity'
                                        ? setNewQuantity(e.target.value)
                                        : setNewWeight(e.target.value)
                                      }
                                      InputProps={{
                                        endAdornment: item.trackingType === 'weight' && (
                                          <InputAdornment position="end">{item.weightUnit}</InputAdornment>
                                        ),
                                      }}
                                      sx={{ width: '100px' }}
                                      autoFocus
                                    />
                                    <IconButton
                                      color="primary"
                                      size="small"
                                      onClick={() => handleUpdateInventory(item._id || '')}
                                    >
                                      <SaveIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      color="error"
                                      size="small"
                                      onClick={cancelEditing}
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                ) : (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Chip
                                      icon={getStockStatusColor(item) === 'error' || getStockStatusColor(item) === 'warning' ?
                                        <LowStockIcon fontSize="small" /> : <HighStockIcon fontSize="small" />}
                                      label={getStockStatusLabel(item)}
                                      color={getStockStatusColor(item)}
                                      size="small"
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={() => startEditing(item)}
                                      sx={{ ml: 1 }}
                                      title="Edit Quantity"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                )}
                              </Grid2>

                              {/* Price */}
                              <Grid2 size={{ xs: 6, sm: 2, md: 1.5 }}>
                                <Typography variant="h6" color="primary">
                                  {formatCurrency(item.price)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Total: {formatCurrency(calculateTotalValue(item))}
                                </Typography>
                              </Grid2>

                              {/* Actions */}
                              <Grid2 size={{ xs: 12, sm: 3, md: 1.5 }}>
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
                              </Grid2>
                            </Grid2>
                          </Box>
                        </Box>
                      ))}
                    </Paper>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
}
