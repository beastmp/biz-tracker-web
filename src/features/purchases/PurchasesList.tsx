import { useState } from 'react';
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
  Chip
} from '@mui/material';
import { Add, Delete, Edit, Search, Visibility } from '@mui/icons-material';
import { usePurchases, useDeletePurchase } from '@hooks/usePurchases';
import { formatCurrency, formatDate } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import StatusChip from '@components/ui/StatusChip';

export default function PurchasesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: purchases = [], isLoading, error } = usePurchases();
  const deletePurchase = useDeletePurchase();

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
      ) : (
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
      )}
    </Box>
  );
}
