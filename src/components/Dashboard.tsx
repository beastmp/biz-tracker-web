import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  AddCircleOutline,
  Inventory2Outlined,
  ShoppingCartOutlined,
  LocalShippingOutlined,
  SearchOutlined,
  //TrendingUpOutlined,
  ArrowForward
} from '@mui/icons-material';
import { useItems } from '@hooks/useItems';
import { useSales } from '@hooks/useSales';
import { usePurchases } from '@hooks/usePurchases';
import { formatCurrency, formatDate } from '@utils/formatters';
import StatusChip from '@components/ui/StatusChip';
import LoadingScreen from '@components/ui/LoadingScreen';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data using React Query hooks
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const { data: sales = [], isLoading: salesLoading } = useSales();
  const { data: purchases = [], isLoading: purchasesLoading } = usePurchases();

  // Calculate stats
  const lowStockItems = items.filter(item => {
    if (item.trackingType === 'quantity' && item.quantity <= 5) return true;
    if (item.trackingType === 'weight' && item.weight <= 2) return true;
    return false;
  });

  const totalInventoryValue = items.reduce((total, item) => {
    if (item.trackingType === 'quantity') {
      return total + (item.price * item.quantity);
    } else {
      if (item.priceType === 'each') {
        return total + (item.price * (item.quantity || 0));
      }
      return total + (item.price * item.weight);
    }
  }, 0);

  const recentSales = [...(sales || [])]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  const recentPurchases = [...(purchases || [])]
    .sort((a, b) => new Date(b.purchaseDate || 0).getTime() - new Date(a.purchaseDate || 0).getTime())
    .slice(0, 5);

  // Filter items based on search
  const filteredItems = items.filter(
    item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  // Show loading if any data is still loading
  if (itemsLoading || salesLoading || purchasesLoading) {
    return <LoadingScreen message="Loading dashboard data..." />;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Typography color="text.secondary">
          Welcome to your BizTracker dashboard
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Inventory
              </Typography>
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                {items.length} items
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {lowStockItems.length} items low in stock
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(totalInventoryValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Recent Sales
              </Typography>
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                {sales.length} orders
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {sales.filter(s => s.status === 'completed').length} completed
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(sales.reduce((total, sale) => total + sale.total, 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Recent Purchases
              </Typography>
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                {purchases.length} orders
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {purchases.filter(p => p.status === 'received').length} received
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(purchases.reduce((total, purchase) => total + purchase.total, 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddCircleOutline />}
                component={RouterLink}
                to="/inventory/new"
                fullWidth
              >
                Add Inventory
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShoppingCartOutlined />}
                component={RouterLink}
                to="/sales/new"
                fullWidth
              >
                New Sale
              </Button>
              <Button
                variant="outlined"
                startIcon={<LocalShippingOutlined />}
                component={RouterLink}
                to="/purchases/new"
                fullWidth
              >
                New Purchase
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Low Stock */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Search Inventory
              </Typography>
              <Button
                endIcon={<ArrowForward />}
                component={RouterLink}
                to="/inventory"
                size="small"
              >
                View All
              </Button>
            </Box>
            <TextField
              fullWidth
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
              size="small"
            />

            <Divider sx={{ mb: 2 }} />

            <List disablePadding sx={{ maxHeight: 350, overflow: 'auto' }}>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <ListItem
                    key={item._id}
                    divider
                    component={RouterLink}
                    to={`/inventory/${item._id}`}
                    sx={{
                      textDecoration: 'none',
                      color: 'inherit',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      }
                    }}
                  >
                    <ListItemText
                      primary={item.name}
                      secondary={`SKU: ${item.sku} | ${
                        item.trackingType === 'quantity'
                          ? `${item.quantity} in stock`
                          : `${item.weight} ${item.weightUnit} in stock`
                      } | ${formatCurrency(item.price)}`}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary={searchQuery ? "No matching items found" : "No items available"} />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Low Stock Alert
              </Typography>
              <Inventory2Outlined color="warning" />
            </Box>

            <Divider sx={{ mb: 2 }} />

            <List disablePadding sx={{ maxHeight: 350, overflow: 'auto' }}>
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item) => (
                  <ListItem
                    key={item._id}
                    divider
                    component={RouterLink}
                    to={`/inventory/${item._id}`}
                    sx={{
                      textDecoration: 'none',
                      color: 'inherit',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      }
                    }}
                  >
                    <ListItemText
                      primary={item.name}
                      secondary={
                        item.trackingType === 'quantity'
                          ? `Only ${item.quantity} left in stock`
                          : `Only ${item.weight} ${item.weightUnit} left in stock`
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No items low in stock" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Recent Sales
              </Typography>
              <Button
                endIcon={<ArrowForward />}
                component={RouterLink}
                to="/sales"
                size="small"
              >
                View All
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <List disablePadding sx={{ maxHeight: 350, overflow: 'auto' }}>
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <ListItem
                    key={sale._id}
                    divider
                    component={RouterLink}
                    to={`/sales/${sale._id}`}
                    sx={{
                      textDecoration: 'none',
                      color: 'inherit',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>{sale.customerName || 'Walk-in Customer'}</Typography>
                          <Typography color="primary">{formatCurrency(sale.total)}</Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="body2">
                            {sale.createdAt && formatDate(sale.createdAt)}
                          </Typography>
                          <StatusChip status={sale.status} />
                        </Box>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No recent sales" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Recent Purchases
              </Typography>
              <Button
                endIcon={<ArrowForward />}
                component={RouterLink}
                to="/purchases"
                size="small"
              >
                View All
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <List disablePadding sx={{ maxHeight: 350, overflow: 'auto' }}>
              {recentPurchases.length > 0 ? (
                recentPurchases.map((purchase) => (
                  <ListItem
                    key={purchase._id}
                    divider
                    component={RouterLink}
                    to={`/purchases/${purchase._id}`}
                    sx={{
                      textDecoration: 'none',
                      color: 'inherit',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>{purchase.supplier?.name || 'Unknown Supplier'}</Typography>
                          <Typography color="primary">{formatCurrency(purchase.total)}</Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="body2">
                            {purchase.purchaseDate && formatDate(purchase.purchaseDate)}
                          </Typography>
                          <StatusChip status={purchase.status} />
                        </Box>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No recent purchases" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}