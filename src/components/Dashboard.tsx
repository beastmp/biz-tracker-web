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
  Chip,
  Tab,
  Tabs
} from '@mui/material';
import { 
  Inventory as InventoryIcon, 
  TrendingUp as SalesRevenueIcon,
  Add as AddIcon,
  ShoppingCart as InventoryValueIcon,
  TrendingDown as PurchasesIcon
} from '@mui/icons-material';
import { itemsApi, Item, salesApi, Sale, purchasesApi, Purchase } from '../services/api';

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
  
  const [purchasesStats, setPurchasesStats] = useState({
    totalPurchases: 0,
    totalCost: 0,
    recentPurchases: [] as Purchase[]
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch inventory data
        const items = await itemsApi.getAll();
        
        const totalItems = items.length;
        const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const lowStockItems = items.filter(item => item.quantity < 2).sort((a, b) => a.quantity - b.quantity);
        
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
        
        // Fetch purchases data - last 30 days
        const purchasesReport = await purchasesApi.getReport(startDate, endDate);
        setPurchasesStats({
          totalPurchases: purchasesReport.totalPurchases || 0,
          totalCost: purchasesReport.totalCost || 0,
          recentPurchases: (purchasesReport.purchases || []).slice(0, 5)
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
      case 'completed': 
      case 'received': 
        return 'success';
      case 'refunded': 
      case 'cancelled': 
        return 'error';
      case 'partially_refunded': 
      case 'partially_received': 
        return 'warning';
      case 'pending':
        return 'info';
      default: 
        return 'default';
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" gutterBottom>
                  Inventory Items
                </Typography>
                <InventoryIcon color="warning" />
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

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" gutterBottom>
                  Inventory Value
                </Typography>
                <InventoryValueIcon color="primary" />
              </Box>
              <Typography variant="h3" component="div">
                {formatCurrency(inventoryStats.totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" gutterBottom>
                  Revenue (30 days)
                </Typography>
                <SalesRevenueIcon color="success" />
              </Box>
              <Typography variant="h3" component="div">
                {formatCurrency(salesStats.totalRevenue)}
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

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" gutterBottom>
                  Purchase Costs (30 days)
                </Typography>
                <PurchasesIcon color="error" />
              </Box>
              <Typography variant="h3" component="div">
                {formatCurrency(purchasesStats.totalCost)}
              </Typography>
              <Button 
                component={RouterLink} 
                to="/purchases" 
                size="small"
                sx={{ mt: 2 }}
              >
                View purchases
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
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="transactions tabs">
                <Tab label="Recent Sales" />
                <Tab label="Recent Purchases" />
              </Tabs>
            </Box>
            
            {activeTab === 0 && (
              <Box sx={{ pt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
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
                
                {salesStats.recentSales.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
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
              </Box>
            )}
            
            {activeTab === 1 && (
              <Box sx={{ pt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    size="small"
                    component={RouterLink}
                    to="/purchases/new"
                  >
                    New Purchase
                  </Button>
                </Box>
                
                {purchasesStats.recentPurchases.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    No recent purchases found. Create your first purchase to start tracking.
                  </Typography>
                ) : (
                  <List>
                    {purchasesStats.recentPurchases.map((purchase) => (
                      <ListItem
                        key={purchase._id}
                        component={RouterLink}
                        to={`/purchases/${purchase._id}`}
                        sx={{ 
                          textDecoration: 'none', 
                          color: 'text.primary',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>{purchase.supplier?.name || 'Unknown Supplier'}</span>
                              <Typography variant="body2" color="error">
                                {formatCurrency(purchase.total)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{purchase.purchaseDate && formatDate(purchase.purchaseDate)}</span>
                              <Chip 
                                label={purchase.status.replace('_', ' ')} 
                                color={getStatusColor(purchase.status) as any}
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
                        to="/purchases"
                        size="small"
                      >
                        View all purchases
                      </Button>
                    </Box>
                  </List>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}