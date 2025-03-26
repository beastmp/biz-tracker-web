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
  Avatar,
  Card,
  CardContent,
  CardActions,
  Grid2,
  Stack,
  Tooltip,
  Divider
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
} from '@mui/icons-material';
import { useSales, useDeleteSale } from '@hooks/useSales';
import { formatCurrency, formatDate } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import StatusChip from '@components/ui/StatusChip';
import { useSettings } from '@context/SettingsContext';

export default function SalesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: sales = [], isLoading, error } = useSales();
  const deleteSale = useDeleteSale();
  const { defaultViewMode } = useSettings();

  // Initialize view mode from settings
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode);

  // Update view mode if settings change
  useEffect(() => {
    setViewMode(defaultViewMode);
  }, [defaultViewMode]);

  // Filter sales when search query changes
  const filteredSales = searchQuery
    ? sales.filter(sale =>
        (sale.customerName && sale.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sale._id && sale._id.includes(searchQuery))
      )
    : sales;

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sale? This will restore inventory quantities.')) {
      try {
        await deleteSale.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete sale:', error);
      }
    }
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

      <TextField
        fullWidth
        margin="normal"
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
        sx={{ mb: 3 }}
      />

      {filteredSales.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No sales found. Click "New Sale" to record your first sale.
          </Typography>
        </Paper>
      ) : viewMode === 'list' ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSales.map((sale) => {
                // Calculate total items, accounting for both quantity and weight-based items
                const totalItems = sale.items.reduce((total, item) => {
                  return total + item.quantity;
                }, 0);

                return (
                  <TableRow key={sale._id} hover>
                    <TableCell>
                      {sale.createdAt ? formatDate(sale.createdAt) : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <RouterLink to={`/sales/${sale._id}`} style={{ textDecoration: 'none', color: '#0a7ea4' }}>
                        {sale.customerName || 'Walk-in Customer'}
                      </RouterLink>
                    </TableCell>
                    <TableCell>
                      {sale.items.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {typeof sale.items[0].item === 'object' && sale.items[0].item.imageUrl ? (
                            <Avatar
                              src={sale.items[0].item.imageUrl}
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
                          <span>{totalItems} item(s)</span>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(sale.total)}</TableCell>
                    <TableCell>
                      <StatusChip status={sale.status} />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        component={RouterLink}
                        to={`/sales/${sale._id}`}
                        color="info"
                        size="small"
                        title="View details"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        component={RouterLink}
                        to={`/sales/${sale._id}/edit`}
                        color="primary"
                        size="small"
                        title="Edit sale"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => sale._id && handleDelete(sale._id)}
                        title="Delete sale"
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
      ) : (
        // Grid View
        <Grid2 container spacing={3}>
          {filteredSales.map((sale) => (
            <Grid2 size= {{ xs: 12, sm: 6, md: 4, lg: 3 }} key={sale._id}>
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
                    {sale.items.length} unique items ({sale.items.reduce((total, item) => total + item.quantity, 0)} total)
                  </Typography>

                  <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
                    {formatCurrency(sale.total)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    component={RouterLink}
                    to={`/sales/${sale._id}`}
                    size="small"
                    startIcon={<Visibility />}
                  >
                    View
                  </Button>
                  <Button
                    component={RouterLink}
                    to={`/sales/${sale._id}/edit`}
                    size="small"
                    startIcon={<Edit />}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => sale._id && handleDelete(sale._id)}
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
    </Box>
  );
}
