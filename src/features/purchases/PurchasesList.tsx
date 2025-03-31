import { useState, useEffect, useMemo } from 'react';
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
  Card,
  CardContent,
  CardActions,
  Divider,
  Grid2,
  Stack,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  Select,
  SelectChangeEvent,
  Chip,
  ListItemText,
  TablePagination
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Search,
  Visibility,
  GridView as GridViewIcon,
  List as ListViewIcon,
  FilterList,
  Sort,
  GetApp,
  ClearAll,
  DateRange
} from '@mui/icons-material';
import { usePurchases, useDeletePurchase } from '@hooks/usePurchases';
import { formatCurrency, formatDate, formatPaymentMethod } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import StatusChip from '@components/ui/StatusChip';
import { useSettings } from '@hooks/useSettings';

// Function to format purchase items for display
const getPurchaseItemsDisplayText = (purchase: any) => {
  if (!purchase.items || purchase.items.length === 0) return "No items";

  // Calculate total items, accounting for all measurement types
  const totalItems = purchase.items.length;

  // Count total quantity across all measurement types
  const totalQuantity = purchase.items.reduce((total: number, item: any) => {
    if (item.purchasedBy === 'quantity') return total + (item.quantity || 0);
    return total + 1; // Count each non-quantity item as 1
  }, 0);

  return `${totalItems} ${totalItems === 1 ? 'item' : 'items'} (${totalQuantity} units total)`;
};

// Helper function to ensure dates display correctly
const adjustDateForDisplay = (dateString: string | undefined): string | undefined => {
  if (!dateString) return undefined;

  // Create a date object from the string
  const date = new Date(dateString);

  // Create a new date object using local year, month, and day to avoid timezone offset issues
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
};

export default function PurchasesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: purchases = [], isLoading, error } = usePurchases();
  const deletePurchase = useDeletePurchase();
  const { defaultViewMode } = useSettings();

  // Initialize view mode from settings
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode);

  // Add sorting, filtering, and pagination
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'total-desc' | 'total-asc'>('date-desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<{ start: string, end: string }>({
    start: '',
    end: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Menu state
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [dateMenuAnchor, setDateMenuAnchor] = useState<null | HTMLElement>(null);

  // Update view mode if settings change
  useEffect(() => {
    setViewMode(defaultViewMode);
  }, [defaultViewMode]);

  // Apply filters and sorting
  const filteredPurchases = useMemo(() => {
    // First apply text search
    let filtered = searchQuery
      ? purchases.filter(purchase =>
        (purchase.supplier?.name && purchase.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (purchase.invoiceNumber && purchase.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      : purchases;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(purchase => purchase.status === statusFilter);
    }

    // Apply payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(purchase => purchase.paymentMethod === paymentMethodFilter);
    }

    // Apply date filter
    if (dateFilter.start) {
      const startDate = new Date(dateFilter.start);
      filtered = filtered.filter(purchase =>
        purchase.purchaseDate ? new Date(purchase.purchaseDate) >= startDate : true
      );
    }
    if (dateFilter.end) {
      const endDate = new Date(dateFilter.end);
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(purchase =>
        purchase.purchaseDate ? new Date(purchase.purchaseDate) <= endDate : true
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'date-desc':
          return new Date(b.purchaseDate || 0).getTime() - new Date(a.purchaseDate || 0).getTime();
        case 'date-asc':
          return new Date(a.purchaseDate || 0).getTime() - new Date(b.purchaseDate || 0).getTime();
        case 'total-desc':
          return b.total - a.total;
        case 'total-asc':
          return a.total - b.total;
        default:
          return 0;
      }
    });

    return filtered;
  }, [purchases, searchQuery, statusFilter, paymentMethodFilter, dateFilter, sortOrder]);

  // Get paginated data
  const paginatedPurchases = useMemo(() => {
    return filteredPurchases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredPurchases, page, rowsPerPage]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase? This will update inventory quantities.')) {
      try {
        await deletePurchase.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete purchase:', error);
      }
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handlePaymentMethodFilterChange = (event: SelectChangeEvent) => {
    setPaymentMethodFilter(event.target.value);
    setPage(0);
  };

  const handleSortOrderChange = (newOrder: 'date-desc' | 'date-asc' | 'total-desc' | 'total-asc') => {
    setSortOrder(newOrder);
    setSortMenuAnchor(null);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentMethodFilter('all');
    setDateFilter({ start: '', end: '' });
    setFilterMenuAnchor(null);
  };

  const handleDateFilterChange = (field: 'start' | 'end', value: string) => {
    setDateFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExportCSV = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Date,Supplier,Invoice Number,Items,Total,Status,Payment Method\n";

    filteredPurchases.forEach(purchase => {
      csvContent += `${purchase._id || ''},`;
      csvContent += `${purchase.purchaseDate ? formatDate(purchase.purchaseDate) : ''},`;
      csvContent += `${(purchase.supplier?.name || 'Unknown Supplier').replace(',', ' ')},`;
      csvContent += `${purchase.invoiceNumber || ''},`;
      csvContent += `${purchase.items.length},`;
      csvContent += `${purchase.total},`;
      csvContent += `${purchase.status},`;
      csvContent += `${purchase.paymentMethod}\n`;
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `purchases_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateActiveFilters = (): number => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (paymentMethodFilter !== 'all') count++;
    if (dateFilter.start || dateFilter.end) count++;
    return count;
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorFallback error={error as Error} message="Failed to load purchases" />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Purchases
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* View Mode Toggles */}
          <Stack direction="row" spacing={1}>
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
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
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
          size="small"
        />

        <Tooltip title="Filter">
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
          >
            Filter
            {calculateActiveFilters() > 0 && (
              <Chip
                size="small"
                label={calculateActiveFilters()}
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Button>
        </Tooltip>

        <Tooltip title="Date Range">
          <Button
            variant="outlined"
            startIcon={<DateRange />}
            onClick={(e) => setDateMenuAnchor(e.currentTarget)}
            color={(dateFilter.start || dateFilter.end) ? "primary" : "inherit"}
          >
            Date
          </Button>
        </Tooltip>

        <Tooltip title="Sort">
          <Button
            variant="outlined"
            startIcon={<Sort />}
            onClick={(e) => setSortMenuAnchor(e.currentTarget)}
          >
            Sort
          </Button>
        </Tooltip>

        <Tooltip title="Export CSV">
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={handleExportCSV}
          >
            Export
          </Button>
        </Tooltip>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        sx={{ '& .MuiPaper-root': { width: 280, maxWidth: '100%', p: 1 } }}
      >
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Status
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="partially_received">Partially Received</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="subtitle2" gutterBottom>
            Payment Method
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={paymentMethodFilter}
              onChange={handlePaymentMethodFilterChange}
            >
              <MenuItem value="all">All Payment Methods</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="credit">Credit Card</MenuItem>
              <MenuItem value="debit">Debit Card</MenuItem>
              <MenuItem value="check">Check</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <Button
            fullWidth
            startIcon={<ClearAll />}
            onClick={handleClearFilters}
            disabled={statusFilter === 'all' && paymentMethodFilter === 'all' && !dateFilter.start && !dateFilter.end}
          >
            Clear All Filters
          </Button>
        </Box>
      </Menu>

      {/* Date Filter Menu */}
      <Menu
        anchorEl={dateMenuAnchor}
        open={Boolean(dateMenuAnchor)}
        onClose={() => setDateMenuAnchor(null)}
        sx={{ '& .MuiPaper-root': { width: 280, maxWidth: '100%', p: 1 } }}
      >
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Date Range
          </Typography>

          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={dateFilter.start}
            onChange={(e) => handleDateFilterChange('start', e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={dateFilter.end}
            onChange={(e) => handleDateFilterChange('end', e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ mb: 2 }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={() => setDateMenuAnchor(null)}
          >
            Apply
          </Button>

          <Button
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => {
              setDateFilter({ start: '', end: '' });
              setDateMenuAnchor(null);
            }}
            disabled={!dateFilter.start && !dateFilter.end}
          >
            Clear Dates
          </Button>
        </Box>
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        <MenuItem
          selected={sortOrder === 'date-desc'}
          onClick={() => handleSortOrderChange('date-desc')}
        >
          <ListItemText primary="Newest First" />
        </MenuItem>
        <MenuItem
          selected={sortOrder === 'date-asc'}
          onClick={() => handleSortOrderChange('date-asc')}
        >
          <ListItemText primary="Oldest First" />
        </MenuItem>
        <MenuItem
          selected={sortOrder === 'total-desc'}
          onClick={() => handleSortOrderChange('total-desc')}
        >
          <ListItemText primary="Highest Total" />
        </MenuItem>
        <MenuItem
          selected={sortOrder === 'total-asc'}
          onClick={() => handleSortOrderChange('total-asc')}
        >
          <ListItemText primary="Lowest Total" />
        </MenuItem>
      </Menu>

      {filteredPurchases.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No purchases found
          </Typography>
          <Typography color="textSecondary" sx={{ mt: 1 }}>
            {searchQuery || statusFilter !== 'all' || paymentMethodFilter !== 'all' || dateFilter.start || dateFilter.end
              ? 'Try adjusting your search or filters'
              : 'Click "New Purchase" to record your first purchase'}
          </Typography>
        </Paper>
      ) : viewMode === 'list' ? (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedPurchases.map((purchase) => {
                  // Get display text for items with all measurement types
                  const itemsDisplay = getPurchaseItemsDisplayText(purchase);

                  return (
                    <TableRow key={purchase._id} hover>
                      <TableCell>
                        {purchase.purchaseDate ? formatDate(adjustDateForDisplay(purchase.purchaseDate)) : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <RouterLink to={`/purchases/${purchase._id}`} style={{ textDecoration: 'none', color: '#0a7ea4' }}>
                          {purchase.supplier?.name || 'Unknown Supplier'}
                        </RouterLink>
                      </TableCell>
                      <TableCell>{purchase.invoiceNumber || '-'}</TableCell>
                      <TableCell>{itemsDisplay}</TableCell>
                      <TableCell align="right">{formatCurrency(purchase.total)}</TableCell>
                      <TableCell>
                        <StatusChip status={purchase.status} />
                      </TableCell>
                      <TableCell>{formatPaymentMethod(purchase.paymentMethod)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          component={RouterLink}
                          to={`/purchases/${purchase._id}`}
                          color="info"
                          size="small"
                          title="View details"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          component={RouterLink}
                          to={`/purchases/${purchase._id}/edit`}
                          color="primary"
                          size="small"
                          title="Edit purchase"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => purchase._id && handleDelete(purchase._id)}
                          title="Delete purchase"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredPurchases.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      ) : (
        <>
          <Grid2 container spacing={3}>
            {paginatedPurchases.map((purchase) => {
              // Format items display for grid view
              const itemsDisplay = getPurchaseItemsDisplayText(purchase);

              return (
                <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={purchase._id}>
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
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h2" noWrap>
                          {purchase.supplier?.name || 'Unknown Supplier'}
                        </Typography>
                        <StatusChip status={purchase.status} />
                      </Box>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {purchase.purchaseDate && formatDate(adjustDateForDisplay(purchase.purchaseDate))}
                      </Typography>

                      {purchase.invoiceNumber && (
                        <Typography variant="body2" color="text.secondary">
                          Invoice: {purchase.invoiceNumber}
                        </Typography>
                      )}

                      <Divider sx={{ my: 1.5 }} />

                      <Typography variant="body2">
                        {itemsDisplay}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Payment: {formatPaymentMethod(purchase.paymentMethod)}
                      </Typography>

                      <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
                        {formatCurrency(purchase.total)}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        component={RouterLink}
                        to={`/purchases/${purchase._id}`}
                        size="small"
                        startIcon={<Visibility />}
                      >
                        View
                      </Button>
                      <Button
                        component={RouterLink}
                        to={`/purchases/${purchase._id}/edit`}
                        size="small"
                        startIcon={<Edit />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => purchase._id && handleDelete(purchase._id)}
                        sx={{ marginLeft: 'auto' }}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid2>
              );
            })}
          </Grid2>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              rowsPerPageOptions={[8, 16, 24, 32]}
              component="div"
              count={filteredPurchases.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        </>
      )}
    </Box>
  );
}
