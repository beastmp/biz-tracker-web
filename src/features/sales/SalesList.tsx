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
  Avatar,
  Card,
  CardContent,
  CardActions,
  Grid,
  Stack,
  Tooltip,
  Divider,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  Menu,
  ListItemText,
  TablePagination
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Search,
  Visibility,
  Image as ImageIcon,
  GridView as GridViewIcon,
  List as ListViewIcon,
  FilterList,
  Sort,
  GetApp,
  ClearAll
} from '@mui/icons-material';
import { useSales, useDeleteSale } from '@hooks/useSales';
import { formatCurrency, formatDate, formatPaymentMethod } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import StatusChip from '@components/ui/StatusChip';
import { useSettings } from '@hooks/useSettings';
import { Sale } from '@custTypes/models';

// Function to convert sale items to display format, handling all measurement types
const getSaleItemsDisplayText = (sale: Sale): string => {
  if (!sale.items || sale.items.length === 0) return "No items";

  // Calculate total items, accounting for all measurement types
  const totalItems = sale.items.length;

  // Count total quantity across all measurement types
  const totalQuantity = sale.items.reduce((total: number, item) => {
    if (item.soldBy === 'quantity') return total + (item.quantity || 0);
    if (item.soldBy === 'weight') return total + 1; // Count each weight-based item as 1
    if (item.soldBy === 'length') return total + 1; // Count each length-based item as 1
    if (item.soldBy === 'area') return total + 1; // Count each area-based item as 1
    if (item.soldBy === 'volume') return total + 1; // Count each volume-based item as 1
    return total + (item.quantity || 0);
  }, 0);

  return `${totalItems} ${totalItems === 1 ? 'item' : 'items'} (${totalQuantity} units total)`;
};

// Function to get first item image
const getFirstItemImage = (sale: Sale): string | undefined => {
  if (!sale.items || sale.items.length === 0) return undefined;

  const firstItem = sale.items[0];
  return typeof firstItem.item === 'object' ? firstItem.item.imageUrl : undefined;
};

export default function SalesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: sales = [], isLoading, error } = useSales();
  const deleteSale = useDeleteSale();
  const { settings } = useSettings();

  // Initialize view mode from settings
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(settings.defaultViewMode);

  // Add sorting, filtering, and pagination
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'total-desc' | 'total-asc'>('date-desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Menu state
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  // Update view mode if settings change
  useEffect(() => {
    setViewMode(settings.defaultViewMode);
  }, [settings.defaultViewMode]);

  // Apply filters and sorting
  const filteredSales = useMemo(() => {
    // First apply text search
    let filtered = searchQuery
      ? sales.filter(sale =>
          (sale.customerName && sale.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (sale.id && sale.id.includes(searchQuery))
        )
      : sales;

    // Then apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.status === statusFilter);
    }

    // Then apply payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(sale => sale.paymentMethod === paymentMethodFilter);
    }

    // Apply sorting (create a new array to avoid modifying the filtered array)
    return [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case 'date-desc':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'date-asc':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'total-desc':
          return (b.total || 0) - (a.total || 0);
        case 'total-asc':
          return (a.total || 0) - (b.total || 0);
        default:
          return 0;
      }
    });
  }, [sales, searchQuery, statusFilter, paymentMethodFilter, sortOrder]);

  // Get paginated data
  const paginatedSales = useMemo(() => {
    return filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredSales, page, rowsPerPage]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sale? This will restore inventory quantities.')) {
      try {
        await deleteSale.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete sale:', error);
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
    setFilterMenuAnchor(null);
  };

  const handleExportCSV = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Date,Customer,Items,Total,Status,Payment Method\n";

    filteredSales.forEach(sale => {
      csvContent += `${sale.id || ''},`;
      csvContent += `${sale.createdAt ? formatDate(sale.createdAt) : ''},`;
      csvContent += `${(sale.customerName || 'Walk-in Customer').replace(',', ' ')},`;
      csvContent += `${sale.items.length},`;
      csvContent += `${sale.total},`;
      csvContent += `${sale.status},`;
      csvContent += `${sale.paymentMethod}\n`;
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            to="/sales/new"
          >
            New Sale
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
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
          size="small"
        />

        <Tooltip title="Filter">
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
          >
            Filter
            {(statusFilter !== 'all' || paymentMethodFilter !== 'all') && (
              <Chip
                size="small"
                label={+(statusFilter !== 'all') + +(paymentMethodFilter !== 'all')}
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
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
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
              <MenuItem value="partially_refunded">Partially Refunded</MenuItem>
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
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <Button
            fullWidth
            startIcon={<ClearAll />}
            onClick={handleClearFilters}
            disabled={statusFilter === 'all' && paymentMethodFilter === 'all'}
          >
            Clear Filters
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

      {filteredSales.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No sales found
          </Typography>
          <Typography color="textSecondary" sx={{ mt: 1 }}>
            {searchQuery || statusFilter !== 'all' || paymentMethodFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Click "New Sale" to record your first sale'}
          </Typography>
        </Paper>
      ) : viewMode === 'list' ? (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSales.map((sale) => {
                  // Get display text for items with all measurement types
                  const itemsDisplay = getSaleItemsDisplayText(sale);

                  return (
                    <TableRow key={sale.id} hover>
                      <TableCell>
                        {sale.createdAt ? formatDate(sale.createdAt) : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <RouterLink to={`/sales/${sale.id}`} style={{ textDecoration: 'none', color: '#0a7ea4' }}>
                          {sale.customerName || 'Walk-in Customer'}
                        </RouterLink>
                      </TableCell>
                      <TableCell>
                        {sale.items.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getFirstItemImage(sale) ? (
                              <Avatar
                                src={getFirstItemImage(sale) || undefined}
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
                            <span>{itemsDisplay}</span>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(sale.total)}</TableCell>
                      <TableCell>
                        <StatusChip status={sale.status} />
                      </TableCell>
                      <TableCell>{formatPaymentMethod(sale.paymentMethod)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          component={RouterLink}
                          to={`/sales/${sale.id}`}
                          color="info"
                          size="small"
                          title="View details"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          component={RouterLink}
                          to={`/sales/${sale.id}/edit`}
                          color="primary"
                          size="small"
                          title="Edit sale"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => sale.id && handleDelete(sale.id)}
                          title="Delete sale"
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
            count={filteredSales.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedSales.map((sale) => {
              // Calculate total items with all measurement types support
              const itemsDisplay = getSaleItemsDisplayText(sale);

              return (
                <Grid size= {{ xs: 12, sm: 6, md: 4, lg: 3 }} key={sale.id}>
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
                          {sale.customerName || 'Walk-in Customer'}
                        </Typography>
                        <StatusChip status={sale.status} />
                      </Box>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {sale.createdAt ? formatDate(sale.createdAt) : 'Unknown date'}
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      <Typography variant="body2">
                        {itemsDisplay}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Payment: {formatPaymentMethod(sale.paymentMethod)}
                      </Typography>

                      <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
                        {formatCurrency(sale.total)}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        component={RouterLink}
                        to={`/sales/${sale.id}`}
                        size="small"
                        startIcon={<Visibility />}
                      >
                        View
                      </Button>
                      <Button
                        component={RouterLink}
                        to={`/sales/${sale.id}/edit`}
                        size="small"
                        startIcon={<Edit />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => sale.id && handleDelete(sale.id)}
                        sx={{ marginLeft: 'auto' }}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              rowsPerPageOptions={[8, 16, 24, 32]}
              component="div"
              count={filteredSales.length}
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