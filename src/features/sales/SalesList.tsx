import { useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
  Grid,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Stack,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  useTheme,
  alpha,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ShoppingCart,
  ViewList,
  ViewModule,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { useSales, useDeleteSale } from '@hooks/useSales';
import { formatCurrency, formatDate } from '@utils/formatters';
import StatusChip from '@components/ui/StatusChip';
import { useAppContext } from '@hooks/useAppContext';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import { Sale } from '@custTypes/models';

export default function SalesList() {
  const theme = useTheme();
  const { defaultViewMode } = useAppContext();
  const { data: sales = [], isLoading, error } = useSales();
  const deleteSale = useDeleteSale();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode);
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  // Menus
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<{ element: HTMLElement | null, id: string | null }>({
    element: null,
    id: null
  });

  // Filter and sort sales
  const filteredSales = useMemo(() => {
    return sales
      .filter(sale => {
        // Search query filter
        if (searchQuery && !(
          (sale.customerName && sale.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (sale.orderNumber && sale.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()))
        )) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'all' && sale.status !== statusFilter) {
          return false;
        }

        // Date filter
        if (dateFilter !== 'all') {
          const saleDate = new Date(sale.createdAt || 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          const thisWeekStart = new Date(today);
          thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());

          const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

          if (
            (dateFilter === 'today' && saleDate < today) ||
            (dateFilter === 'yesterday' && (saleDate < yesterday || saleDate >= today)) ||
            (dateFilter === 'this-week' && saleDate < thisWeekStart) ||
            (dateFilter === 'this-month' && saleDate < thisMonthStart)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date-desc':
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          case 'date-asc':
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          case 'total-desc':
            return b.total - a.total;
          case 'total-asc':
            return a.total - b.total;
          case 'customer':
            return (a.customerName || '').localeCompare(b.customerName || '');
          default:
            return 0;
        }
      });
  }, [sales, searchQuery, sortBy, statusFilter, dateFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sales.length };
    sales.forEach(sale => {
      counts[sale.status] = (counts[sale.status] || 0) + 1;
    });
    return counts;
  }, [sales]);

  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate paginated data for current view
  const paginatedSales = useMemo(() => {
    return filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredSales, page, rowsPerPage]);

  // Handle delete
  const handleDeleteClick = (id: string) => {
    setSaleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (saleToDelete) {
      try {
        await deleteSale.mutateAsync(saleToDelete);
        setSuccessMessage('Sale deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error('Failed to delete sale:', error);
      }
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading sales data..." />;
  }

  if (error) {
    return <ErrorFallback error={error as Error} message="Failed to load sales data" />;
  }

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Sales
          </Typography>
          <Typography color="text.secondary" variant="subtitle1">
            Manage sales orders and transactions
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/sales/new"
          startIcon={<AddIcon />}
          variant="contained"
          sx={{
            px: 4,
            boxShadow: theme.shadows[4],
            '&:hover': {
              boxShadow: theme.shadows[6],
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          New Sale
        </Button>
      </Box>

      {successMessage && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: alpha(theme.palette.success.main, 0.1),
            borderLeft: `4px solid ${theme.palette.success.main}`,
            borderRadius: 1
          }}
        >
          <Typography color="success.main">{successMessage}</Typography>
        </Paper>
      )}

      {/* Filters Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: 'center',
          boxShadow: theme.shadows[2],
          borderRadius: 2
        }}
      >
        <TextField
          placeholder="Search by customer or order number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            sx: {
              borderRadius: 2,
              bgcolor: alpha(theme.palette.common.black, 0.01),
              '&:hover': {
                bgcolor: alpha(theme.palette.common.black, 0.02),
              }
            }
          }}
          size="medium"
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<FilterIcon />}
            onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Filter
          </Button>

          <Button
            startIcon={<SortIcon />}
            onClick={(e) => setSortMenuAnchor(e.currentTarget)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Sort
          </Button>

          <Box sx={{
            display: 'flex',
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`
          }}>
            <Tooltip title="Grid view">
              <IconButton
                color={viewMode === 'grid' ? 'primary' : 'default'}
                onClick={() => setViewMode('grid')}
              >
                <ViewModule />
              </IconButton>
            </Tooltip>
            <Tooltip title="List view">
              <IconButton
                color={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => setViewMode('list')}
              >
                <ViewList />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Status filter chips for larger screens */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            display: { xs: 'none', lg: 'flex' },
            '& .MuiChip-root': {
              transition: 'all 0.2s ease'
            }
          }}
        >
          <Chip
            label={`All (${statusCounts.all || 0})`}
            onClick={() => setStatusFilter('all')}
            color={statusFilter === 'all' ? 'primary' : 'default'}
            variant={statusFilter === 'all' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Pending (${statusCounts.pending || 0})`}
            onClick={() => setStatusFilter('pending')}
            color={statusFilter === 'pending' ? 'warning' : 'default'}
            variant={statusFilter === 'pending' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Completed (${statusCounts.completed || 0})`}
            onClick={() => setStatusFilter('completed')}
            color={statusFilter === 'completed' ? 'success' : 'default'}
            variant={statusFilter === 'completed' ? 'filled' : 'outlined'}
          />
        </Stack>
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
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
          <ListItemText>All Sales</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setStatusFilter('pending');
            setFilterMenuAnchor(null);
          }}
          selected={statusFilter === 'pending'}
        >
          <ListItemIcon>
            <StatusChip status="pending" size="small" />
          </ListItemIcon>
          <ListItemText>Pending</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setStatusFilter('processing');
            setFilterMenuAnchor(null);
          }}
          selected={statusFilter === 'processing'}
        >
          <ListItemIcon>
            <StatusChip status="processing" size="small" />
          </ListItemIcon>
          <ListItemText>Processing</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setStatusFilter('completed');
            setFilterMenuAnchor(null);
          }}
          selected={statusFilter === 'completed'}
        >
          <ListItemIcon>
            <StatusChip status="completed" size="small" />
          </ListItemIcon>
          <ListItemText>Completed</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setStatusFilter('cancelled');
            setFilterMenuAnchor(null);
          }}
          selected={statusFilter === 'cancelled'}
        >
          <ListItemIcon>
            <StatusChip status="cancelled" size="small" />
          </ListItemIcon>
          <ListItemText>Cancelled</ListItemText>
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <MenuItem disabled>
          <Typography variant="subtitle2">Date Range</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDateFilter('all');
            setFilterMenuAnchor(null);
          }}
          selected={dateFilter === 'all'}
        >
          <ListItemText>All Time</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDateFilter('today');
            setFilterMenuAnchor(null);
          }}
          selected={dateFilter === 'today'}
        >
          <ListItemText>Today</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDateFilter('yesterday');
            setFilterMenuAnchor(null);
          }}
          selected={dateFilter === 'yesterday'}
        >
          <ListItemText>Yesterday</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDateFilter('this-week');
            setFilterMenuAnchor(null);
          }}
          selected={dateFilter === 'this-week'}
        >
          <ListItemText>This Week</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDateFilter('this-month');
            setFilterMenuAnchor(null);
          }}
          selected={dateFilter === 'this-month'}
        >
          <ListItemText>This Month</ListItemText>
        </MenuItem>
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => {
            setSortBy('date-desc');
            setSortMenuAnchor(null);
          }}
          selected={sortBy === 'date-desc'}
        >
          <ListItemText>Newest First</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSortBy('date-asc');
            setSortMenuAnchor(null);
          }}
          selected={sortBy === 'date-asc'}
        >
          <ListItemText>Oldest First</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSortBy('total-desc');
            setSortMenuAnchor(null);
          }}
          selected={sortBy === 'total-desc'}
        >
          <ListItemText>Highest Amount</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSortBy('total-asc');
            setSortMenuAnchor(null);
          }}
          selected={sortBy === 'total-asc'}
        >
          <ListItemText>Lowest Amount</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSortBy('customer');
            setSortMenuAnchor(null);
          }}
          selected={sortBy === 'customer'}
        >
          <ListItemText>Customer Name</ListItemText>
        </MenuItem>
      </Menu>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor.element}
        open={Boolean(actionMenuAnchor.element)}
        onClose={() => setActionMenuAnchor({element: null, id: null})}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          component={RouterLink}
          to={`/sales/${actionMenuAnchor.id}`}
        >
          <ListItemIcon>
            <ShoppingCart fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          component={RouterLink}
          to={`/sales/${actionMenuAnchor.id}/edit`}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Sale</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (actionMenuAnchor.id) handleDeleteClick(actionMenuAnchor.id);
          setActionMenuAnchor({element: null, id: null});
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <Box>
          <Grid container spacing={3}>
            {paginatedSales.length > 0 ? (
              paginatedSales.map((sale) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={sale._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'visible',
                      '&:hover': {
                        '& .sale-actions': {
                          opacity: 1,
                        }
                      }
                    }}
                  >
                    {/* Status indicator */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: 16,
                        zIndex: 1
                      }}
                    >
                      <StatusChip status={sale.status} />
                    </Box>

                    <CardContent sx={{ pb: 0, flexGrow: 1 }}>
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            width: 32,
                            height: 32
                          }}
                        >
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography
                            variant="h6"
                            component={RouterLink}
                            to={`/sales/${sale._id}`}
                            sx={{
                              textDecoration: 'none',
                              color: 'inherit',
                              '&:hover': { color: 'primary.main' }
                            }}
                          >
                            {sale.customerName || 'Walk-in Customer'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DateRangeIcon fontSize="small" color="action" sx={{ fontSize: '0.9rem' }} />
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(sale.createdAt || new Date())}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1.5 }} />

                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Order #</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {sale.orderNumber || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Items</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {sale.items?.length || 0} items
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Total</Typography>
                          <Typography variant="h6" color="primary.main" fontWeight={700}>
                            {formatCurrency(sale.total)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>

                    <CardActions>
                      <Button
                        component={RouterLink}
                        to={`/sales/${sale._id}`}
                        size="small"
                      >
                        View Details
                      </Button>
                      <Box sx={{ flexGrow: 1 }} />
                      <IconButton
                        size="small"
                        onClick={(e) => setActionMenuAnchor({
                          element: e.currentTarget,
                          id: sale._id || ''
                        })}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper
                  sx={{
                    py: 6,
                    px: 4,
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.info.main, 0.03),
                    borderRadius: 2
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Sales Found
                  </Typography>
                  <Typography color="text.secondary" paragraph>
                    {searchQuery || statusFilter !== 'all'
                      ? "Try adjusting your search or filters"
                      : "Get started by creating your first sale"}
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/sales/new"
                    variant="contained"
                    startIcon={<AddIcon />}
                  >
                    Create Sale
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: theme.shadows[2],
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Order #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSales.length > 0 ? (
                paginatedSales.map((sale) => (
                  <TableRow
                    key={sale._id}
                    sx={{
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      },
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      window.location.href = `/sales/${sale._id}`;
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            mr: 1,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                          }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Typography fontWeight={500}>
                          {sale.customerName || 'Walk-in Customer'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{sale.orderNumber}</TableCell>
                    <TableCell>{formatDate(sale.createdAt || new Date())}</TableCell>
                    <TableCell>
                      <StatusChip status={sale.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={500} color="primary.main">
                        {formatCurrency(sale.total)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton
                          component={RouterLink}
                          to={`/sales/${sale._id}/edit`}
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(sale._id || '');
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Sales Found
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                      {searchQuery || statusFilter !== 'all'
                        ? "Try adjusting your search or filters"
                        : "Get started by creating your first sale"}
                    </Typography>
                    <Button
                      component={RouterLink}
                      to="/sales/new"
                      variant="contained"
                      startIcon={<AddIcon />}
                    >
                      Create Sale
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {paginatedSales.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={filteredSales.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Sale</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this sale? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}