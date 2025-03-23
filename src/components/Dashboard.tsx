import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { 
  Inventory as InventoryIcon, 
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { itemsApi, Item, salesApi, Sale } from '../services/api';

export default function Dashboard() {
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: [] as Item[],
    categories: {} as Record<string, number>,
  });
  
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    recentSales: [] as Sale[]
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch inventory data
        const items = await itemsApi.getAll();
        
        const totalItems = items.length;
        const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const lowStockItems = items.filter(item => item.quantity < 5).sort((a, b) => a.quantity - b.quantity);
        
        const categories: Record<string, number> = {};
        items.forEach(item => {
          if (categories[item.category]) {
            categories[item.category]++;
          } else {
            categories[item.category] = 1;
          }
        });
        
        setInventoryStats({
          totalItems,
          totalValue,
          lowStockItems,
          categories
        });

        // Fetch sales data - last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        const salesReport = await salesApi.getReport(startDate, endDate);
        setSalesStats({
          totalSales: salesReport.totalSales,
          totalRevenue: salesReport.totalRevenue,
          recentSales: salesReport.sales.slice(0, 5)
        });
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'refunded': return 'error';
      case 'partially_refunded': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" gutterBottom>
                  Inventory Items
                </Typography>
                <InventoryIcon color="primary" />
              </Box>
              <Typography variant="h3" component="div">
                {inventoryStats.totalItems}
              </Typography>
              <Button 
                component={RouterLink} 
                to="/inventory" 
                size="small"
                sx={{ mt: 2 }}
              >
                View inventory
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" gutterBottom>
                  Inventory Value
                </Typography>
                <TrendingUpIcon color="success" />
              </Box>
              <Typography variant="h3" component="div">
                {formatCurrency(inventoryStats.totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" gutterBottom>
                  Total Sales (30 days)
                </Typography>
                <ShoppingCartIcon color="info" />
              </Box>
              <Typography variant="h3" component="div">
                {salesStats.totalSales}
              </Typography>
              <Button 
                component={RouterLink} 
                to="/sales" 
                size="small"
                sx={{ mt: 2 }}
              >
                View sales
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" gutterBottom>
                  Revenue (30 days)
                </Typography>
                <TrendingUpIcon color="secondary" />
              </Box>
              <Typography variant="h3" component="div">
                {formatCurrency(salesStats.totalRevenue)}
              </Typography>
              <Button 
                component={RouterLink} 
                to="/sales/reports" 
                size="small"
                sx={{ mt: 2 }}
              >
                View reports
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Low Stock Items
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {inventoryStats.lowStockItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No items are low in stock.
              </Typography>
            ) : (
              <List>
                {inventoryStats.lowStockItems.slice(0, 5).map((item) => (
                  <ListItem 
                    key={item._id}
                    component={RouterLink}
                    to={`/inventory/${item._id}`}
                    sx={{ 
                      textDecoration: 'none', 
                      color: 'text.primary',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <ListItemText 
                      primary={item.name} 
                      secondary={`SKU: ${item.sku} | ${item.quantity} in stock`}
                      primaryTypographyProps={{
                        color: item.quantity === 0 ? 'error' : 'text.primary',
                        fontWeight: item.quantity === 0 ? 'bold' : 'normal',
                      }}
                    />
                  </ListItem>
                ))}
                {inventoryStats.lowStockItems.length > 5 && (
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button 
                      component={RouterLink} 
                      to="/inventory"
                      size="small"
                    >
                      View all low stock items
                    </Button>
                  </Box>
                )}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Sales
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
                component={RouterLink}
                to="/sales/new"
              >
                New Sale
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {salesStats.recentSales.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No recent sales found. Create your first sale to start tracking.
              </Typography>
            ) : (
              <List>
                {salesStats.recentSales.map((sale) => (
                  <ListItem
                    key={sale._id}
                    component={RouterLink}
                    to={`/sales/${sale._id}`}
                    sx={{ 
                      textDecoration: 'none', 
                      color: 'text.primary',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{sale.customerName || 'Guest Customer'}</span>
                          <Typography variant="body2" color="primary">
                            {formatCurrency(sale.total)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{sale.createdAt && formatDate(sale.createdAt)}</span>
                          <Chip 
                            label={sale.status.replace('_', ' ')} 
                            color={getStatusColor(sale.status) as any}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button 
                    component={RouterLink} 
                    to="/sales"
                    size="small"
                  >
                    View all sales
                  </Button>
                </Box>
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}