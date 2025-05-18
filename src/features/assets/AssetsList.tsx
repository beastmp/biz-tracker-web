import { useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Add,
  Search,
  Sort,
  FilterList,
  Delete,
  ContentPaste,
  Build,
  CalendarToday,
  Place,
  Person,
  BusinessCenter
} from '@mui/icons-material';
import { useAssets, useDeleteAsset } from '@hooks/useAssets';
import { useFormattedValues } from '@utils/formatters'; // Import the custom hook for formatting
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';

export default function AssetsList() {
  const { data: assets = [], isLoading, error } = useAssets();
  const deleteAsset = useDeleteAsset();

  const { formatCurrency, formatDate } = useFormattedValues();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    return assets
      .filter(asset => {
        // Search query filter
        if (searchQuery && !(
          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.assetTag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
        )) {
          return false;
        }

        // Category filter
        if (categoryFilter !== 'all' && asset.category !== categoryFilter) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'all' && asset.status !== statusFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'cost-asc':
            return a.initialCost - b.initialCost;
          case 'cost-desc':
            return b.initialCost - a.initialCost;
          case 'date-asc':
            return new Date(a.purchaseDate || 0).getTime() - new Date(b.purchaseDate || 0).getTime();
          case 'date-desc':
            return new Date(b.purchaseDate || 0).getTime() - new Date(a.purchaseDate || 0).getTime();
          default:
            return 0;
        }
      });
  }, [assets, searchQuery, sortBy, categoryFilter, statusFilter]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    return Array.from(new Set(assets.map(asset => asset.category))).sort();
  }, [assets]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset.mutateAsync(id);
        setUpdateSuccess('Asset deleted successfully');
        setTimeout(() => setUpdateSuccess(null), 3000);
      } catch (err) {
        console.error('Error deleting asset:', err);
      }
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'active':
        return <Chip size="small" label="Active" color="success" />;
      case 'maintenance':
        return <Chip size="small" label="Maintenance" color="warning" />;
      case 'retired':
        return <Chip size="small" label="Retired" color="error" />;
      case 'lost':
        return <Chip size="small" label="Lost" color="error" variant="outlined" />;
      default:
        return <Chip size="small" label={status} />;
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorFallback error={error as Error} />;
  }

  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Business Assets
        </Typography>
        <Button
          component={RouterLink}
          to="/assets/new"
          variant="contained"
          startIcon={<Add />}
        >
          Add Asset
        </Button>
      </Box>

      {updateSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {updateSuccess}
        </Alert>
      )}

      {/* Search and filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder="Search assets..."
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
          </Grid>
          <Grid size={{ xs: 6, md:3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
            >
              Filter
            </Button>
            <Menu
              anchorEl={filterMenuAnchor}
              open={Boolean(filterMenuAnchor)}
              onClose={() => setFilterMenuAnchor(null)}
            >
              <MenuItem disabled>
                <Typography variant="subtitle2">Category</Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setCategoryFilter('all');
                  setFilterMenuAnchor(null);
                }}
                selected={categoryFilter === 'all'}
              >
                All Categories
              </MenuItem>
              {categories.map(category => (
                <MenuItem
                  key={category}
                  onClick={() => {
                    setCategoryFilter(category);
                    setFilterMenuAnchor(null);
                  }}
                  selected={categoryFilter === category}
                >
                  {category}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem disabled>
                <Typography variant="subtitle2">Status</Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setStatusFilter('all');
                  setFilterMenuAnchor(null);
                }}
                selected={statusFilter === 'all'}
              >
                All Statuses
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setStatusFilter('active');
                  setFilterMenuAnchor(null);
                }}
                selected={statusFilter === 'active'}
              >
                Active
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setStatusFilter('maintenance');
                  setFilterMenuAnchor(null);
                }}
                selected={statusFilter === 'maintenance'}
              >
                Maintenance
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setStatusFilter('retired');
                  setFilterMenuAnchor(null);
                }}
                selected={statusFilter === 'retired'}
              >
                Retired
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setStatusFilter('lost');
                  setFilterMenuAnchor(null);
                }}
                selected={statusFilter === 'lost'}
              >
                Lost
              </MenuItem>
            </Menu>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Sort />}
              onClick={(e) => setSortMenuAnchor(e.currentTarget)}
            >
              Sort
            </Button>
            <Menu
              anchorEl={sortMenuAnchor}
              open={Boolean(sortMenuAnchor)}
              onClose={() => setSortMenuAnchor(null)}
            >
              <MenuItem
                onClick={() => {
                  setSortBy('name');
                  setSortMenuAnchor(null);
                }}
                selected={sortBy === 'name'}
              >
                Name
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSortBy('cost-desc');
                  setSortMenuAnchor(null);
                }}
                selected={sortBy === 'cost-desc'}
              >
                Cost (High to Low)
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSortBy('cost-asc');
                  setSortMenuAnchor(null);
                }}
                selected={sortBy === 'cost-asc'}
              >
                Cost (Low to High)
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSortBy('date-desc');
                  setSortMenuAnchor(null);
                }}
                selected={sortBy === 'date-desc'}
              >
                Purchase Date (Newest First)
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSortBy('date-asc');
                  setSortMenuAnchor(null);
                }}
                selected={sortBy === 'date-asc'}
              >
                Purchase Date (Oldest First)
              </MenuItem>
            </Menu>
          </Grid>
        </Grid>
      </Paper>

      {/* Assets grid */}
      <Grid container spacing={3}>
        {filteredAssets.length > 0 ? (
          filteredAssets.map(asset => (
            <Grid size={{ xs:12, sm:6, md:4 }} key={asset.id}>
              <Card>
                <CardContent>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div" noWrap sx={{ maxWidth: '80%' }}>
                      {asset.name}
                    </Typography>
                    {getStatusChip(asset.status)}
                  </Box>

                  {asset.assetTag && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ContentPaste fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Asset Tag: {asset.assetTag}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BusinessCenter fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Category: {asset.category}
                    </Typography>
                  </Box>

                  {asset.manufacturer && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Build fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {asset.manufacturer} {asset.model ? `- ${asset.model}` : ''}
                      </Typography>
                    </Box>
                  )}

                  {asset.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Place fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        Location: {asset.location}
                      </Typography>
                    </Box>
                  )}

                  {asset.assignedTo && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Person fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        Assigned to: {asset.assignedTo}
                      </Typography>
                    </Box>
                  )}

                  {asset.purchaseDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarToday fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Purchased: {formatDate(asset.purchaseDate)}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" color="primary">
                      {formatCurrency(asset.initialCost)}
                    </Typography>

                    {asset.currentValue !== asset.initialCost && (
                      <Typography variant="body2" color="text.secondary">
                        Current value: {formatCurrency(asset.currentValue)}
                      </Typography>
                    )}
                  </Box>

                  {asset.tags && asset.tags.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {asset.tags.map(tag => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    component={RouterLink}
                    to={`/assets/${asset.id}`}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    component={RouterLink}
                    to={`/assets/${asset.id}/edit`}
                  >
                    Edit
                  </Button>
                  <Box sx={{ flexGrow: 1 }} />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(asset.id || '')}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No assets found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your search or filters, or add a new asset.
              </Typography>
              <Button
                variant="contained"
                component={RouterLink}
                to="/assets/new"
                startIcon={<Add />}
                sx={{ mt: 2 }}
              >
                Add Asset
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}