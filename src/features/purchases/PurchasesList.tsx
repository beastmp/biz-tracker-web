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
  Card,
  CardContent,
  CardActions,
  Divider,
  Grid2,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Search,
  Visibility,
  GridView as GridViewIcon,
  List as ListViewIcon,
} from '@mui/icons-material';
import { usePurchases, useDeletePurchase } from '@hooks/usePurchases';
import { formatCurrency, formatDate } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import StatusChip from '@components/ui/StatusChip';
import { useSettings } from '@context/SettingsContext';

export default function PurchasesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: purchases = [], isLoading, error } = usePurchases();
  const deletePurchase = useDeletePurchase();
  const { defaultViewMode } = useSettings();

  // Initialize view mode from settings
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode);

  // Update view mode if settings change
  useEffect(() => {
    setViewMode(defaultViewMode);
  }, [defaultViewMode]);

  // Filter purchases when search query changes
  const filteredPurchases = searchQuery
    ? purchases.filter(purchase =>
        (purchase.supplier?.name && purchase.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (purchase.invoiceNumber && purchase.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : purchases;

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase? This will update inventory quantities.')) {
      return;
    }
    try {
      await deletePurchase.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete purchase:', error);
    }
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

      <TextField
        fullWidth
        margin="normal"
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
        sx={{ mb: 3 }}
      />

      {filteredPurchases.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No purchases found
          </Typography>
          <Typography color="textSecondary" sx={{ mt: 1 }}>
            Click "New Purchase" to record your first purchase
          </Typography>
        </Paper>
      ) : viewMode === 'list' ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Invoice #</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPurchases.map((purchase) => {
                return (
                  <TableRow key={purchase._id} hover>
                    <TableCell>
                      {purchase.purchaseDate && formatDate(purchase.purchaseDate)}
                    </TableCell>
                    <TableCell>{purchase.supplier.name || 'Unknown Supplier'}</TableCell>
                    <TableCell>{purchase.invoiceNumber || '-'}</TableCell>
                    <TableCell>{purchase.items.length}</TableCell>
                    <TableCell>{formatCurrency(purchase.total)}</TableCell>
                    <TableCell>
                      <StatusChip status={purchase.status} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        component={RouterLink}
                        to={`/purchases/${purchase._id}`}
                        color="info"
                        size="small"
                        title="View details"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        component={RouterLink}
                        to={`/purchases/${purchase._id}/edit`}
                        color="primary"
                        size="small"
                        title="Edit purchase"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => purchase._id && handleDelete(purchase._id)}
                        title="Delete purchase"
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
          {filteredPurchases.map((purchase) => (
            <Grid2 size= {{ xs: 12, sm: 6, md: 4, lg: 3 }} key={purchase._id}>
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
                      {purchase.supplier.name || 'Unknown Supplier'}
                    </Typography>
                    <StatusChip status={purchase.status} />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {purchase.purchaseDate && formatDate(purchase.purchaseDate)}
                  </Typography>

                  {purchase.invoiceNumber && (
                    <Typography variant="body2" color="text.secondary">
                      Invoice: {purchase.invoiceNumber}
                    </Typography>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="body2">
                    {purchase.items.length} items purchased
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
          ))}
        </Grid2>
      )}
    </Box>
  );
}
