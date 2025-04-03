import React, { useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
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
  InputAdornment,
  Grid,
  CardActionArea,
  Alert,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  CardHeader,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  AddCircleOutline,
  Inventory2Outlined,
  ShoppingCartOutlined,
  LocalShippingOutlined,
  SearchOutlined,
  ArrowForward,
  Construction,
  BusinessCenter,
  Warning,
  CheckCircle,
  CalendarToday,
  Add,
  TrendingDown,
  TrendingUp,
  Info,
  Visibility,
  ViewList,
  Autorenew,
  MonetizationOn,
  Campaign,
  Notifications,
  Assessment
} from '@mui/icons-material';
import { useItems } from '@hooks/useItems';
import { useSales } from '@hooks/useSales';
import { usePurchases } from '@hooks/usePurchases';
import { useAssets } from '@hooks/useAssets';
import { formatCurrency, formatDate } from '@utils/formatters';
import StatusChip from '@components/ui/StatusChip';
import LoadingScreen from '@components/ui/LoadingScreen';
import { useSettings } from '@hooks/useSettings';
import CreateProductDialog from '@components/inventory/CreateProductDialog';
import { Item } from '@custTypes/models';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch data using React Query hooks
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const { data: sales = [], isLoading: salesLoading } = useSales();
  const { data: purchases = [], isLoading: purchasesLoading } = usePurchases();
  const { data: assets = [], isLoading: assetsLoading } = useAssets();

  // Get low stock threshold settings
  const { lowStockAlertsEnabled, quantityThreshold, weightThresholds } = useSettings();

  // Calculate stats
  const lowStockItems = useMemo(() => {
    return items.filter(item => {
      // If alerts are disabled, don't consider anything low stock
      if (!lowStockAlertsEnabled) return false;

      if (item.trackingType === 'quantity' && item.quantity <= quantityThreshold) return true;

      if (item.trackingType === 'weight') {
        if (item.priceType === 'each' && (item.quantity || 0) <= 3) return true;

        const threshold =
          item.weightUnit === 'kg' ? weightThresholds.kg :
            item.weightUnit === 'g' ? weightThresholds.g :
              item.weightUnit === 'lb' ? weightThresholds.lb :
                item.weightUnit === 'oz' ? weightThresholds.oz : 5;

        if (item.weight <= threshold) return true;
      }

      return false;
    });
  }, [items, lowStockAlertsEnabled, quantityThreshold, weightThresholds]);

  const totalInventoryValue = useMemo(() => {
    return items.reduce((total, item) => {
      if (item.trackingType === 'quantity') {
        return total + (item.price * item.quantity);
      } else {
        if (item.priceType === 'each') {
          return total + (item.price * (item.quantity || 0));
        }
        return total + (item.price * item.weight);
      }
    }, 0);
  }, [items]);

  const recentSales = useMemo(() => {
    return [...(sales || [])]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);
  }, [sales]);

  const recentPurchases = useMemo(() => {
    return [...(purchases || [])]
      .sort((a, b) => new Date(b.purchaseDate || 0).getTime() - new Date(a.purchaseDate || 0).getTime())
      .slice(0, 5);
  }, [purchases]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    return items
      .filter(
        item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 10);
  }, [items, searchQuery]);

  // Prepare data for charts
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    items.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += 1;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [items]);

  const salesOverTime = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        sales: 0,
        purchases: 0
      };
    }).reverse();

    // Aggregate sales by day
    sales.forEach(sale => {
      const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
      const dayData = last7Days.find(day => day.date === saleDate);
      if (dayData) {
        dayData.sales += sale.total;
      }
    });

    // Aggregate purchases by day
    purchases.forEach(purchase => {
      const purchaseDate = new Date(purchase.purchaseDate).toISOString().split('T')[0];
      const dayData = last7Days.find(day => day.date === purchaseDate);
      if (dayData) {
        dayData.purchases += purchase.total;
      }
    });

    return last7Days;
  }, [sales, purchases]);

  // Handler for product creation
  const handleProductCreated = (product: Item) => {
    setSuccessMessage(`Successfully created product: ${product.name}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Show loading if any data is still loading
  if (itemsLoading || salesLoading || purchasesLoading || assetsLoading) {
    return <LoadingScreen message="Loading dashboard data..." />;
  }

  return (
    <Box className="fade-in">
      {successMessage && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            boxShadow: theme.shadows[2],
            animation: 'fadeIn 0.5s ease',
            borderRadius: 2
          }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Dashboard Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="700" sx={{ mb: 0.5 }}>
            Welcome to BizTracker
          </Typography>
          <Typography color="text.secondary" variant="subtitle1">
            Here's what's happening with your business today
          </Typography>
        </Box>
      </Box>

      {/* Quick Stats & Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Business Summary Stats */}
            <Grid item xs={12} sm={6} lg={3}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2
                  }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                      <Inventory2Outlined color="primary" />
                    </Avatar>
                    <Typography variant="subtitle1" color="text.secondary">
                      Inventory
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {items.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {formatCurrency(totalInventoryValue)} total value
                  </Typography>

                  {lowStockItems.length > 0 && (
                    <Chip
                      label={`${lowStockItems.length} low stock items`}
                      color="warning"
                      size="small"
                      icon={<Warning fontSize="small" />}
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2
                  }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                      <ShoppingCartOutlined color="success" />
                    </Avatar>
                    <Typography variant="subtitle1" color="text.secondary">
                      Sales
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {sales.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {formatCurrency(sales.reduce((sum, sale) => sum + sale.total, 0))}
                  </Typography>

                  {sales.filter(s => s.status === 'pending').length > 0 && (
                    <Chip
                      label={`${sales.filter(s => s.status === 'pending').length} pending`}
                      color="info"
                      size="small"
                      icon={<Info fontSize="small" />}
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2
                  }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                      <LocalShippingOutlined color="info" />
                    </Avatar>
                    <Typography variant="subtitle1" color="text.secondary">
                      Purchases
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {purchases.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {formatCurrency(purchases.reduce((sum, purchase) => sum + purchase.total, 0))}
                  </Typography>

                  {purchases.filter(p => p.status === 'ordered').length > 0 && (
                    <Chip
                      label={`${purchases.filter(p => p.status === 'ordered').length} in transit`}
                      color="secondary"
                      size="small"
                      icon={<LocalShippingOutlined fontSize="small" />}
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2
                  }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1) }}>
                      <BusinessCenter color="secondary" />
                    </Avatar>
                    <Typography variant="subtitle1" color="text.secondary">
                      Assets
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {assets.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {formatCurrency(assets.reduce((sum, asset) => sum + asset.currentValue, 0))}
                  </Typography>

                  {assets.filter(a => a.status === 'maintenance').length > 0 && (
                    <Chip
                      label={`${assets.filter(a => a.status === 'maintenance').length} in maintenance`}
                      color="warning"
                      size="small"
                      icon={<Construction fontSize="small" />}
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Sales & Purchases Chart */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardHeader
                  title="Revenue Overview"
                  subheader="Last 7 days of sales and purchases"
                  titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
                  action={
                    <Tooltip title="View Reports">
                      <IconButton component={RouterLink} to="/reports/sales">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  <Box sx={{ height: 250, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={salesOverTime}
                        margin={{
                          top: 5,
                          right: 25,
                          left: 5,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" />
                        <YAxis
                          tickFormatter={(value) => value === 0 ? '$0' : `$${value}`}
                          axisLine={false}
                        />
                        <ChartTooltip
                          formatter={(value) => [`${formatCurrency(value as number)}`, '']}
                          contentStyle={{ borderRadius: 8 }}
                          labelStyle={{ fontWeight: 'bold' }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          name="Sales"
                          stroke={theme.palette.success.main}
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="purchases"
                          name="Purchases"
                          stroke={theme.palette.info.main}
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Quick Actions Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3, borderRadius: 3, overflow: 'visible' }}>
            <CardHeader
              title="Quick Actions"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AddCircleOutline />}
                  component={RouterLink}
                  to="/inventory/new"
                  size="large"
                  sx={{
                    py: 1.5,
                    bgcolor: theme.palette.primary.main,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4
                    },
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  Add Inventory Item
                </Button>

                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<ShoppingCartOutlined />}
                      component={RouterLink}
                      to="/sales/new"
                      sx={{ py: 1 }}
                    >
                      New Sale
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<LocalShippingOutlined />}
                      component={RouterLink}
                      to="/purchases/new"
                      sx={{ py: 1 }}
                    >
                      New Purchase
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Construction />}
                      onClick={() => setCreateProductDialogOpen(true)}
                      sx={{ py: 1 }}
                    >
                      Create Product
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<BusinessCenter />}
                      component={RouterLink}
                      to="/assets/new"
                      sx={{ py: 1 }}
                    >
                      Add Asset
                    </Button>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1 }} />

                <Paper
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <Campaign color="info" fontSize="small" sx={{ mr: 1 }} /> Business Insights
                  </Typography>
                  {lowStockItems.length > 0 ? (
                    <Typography variant="body2">
                      You have <strong>{lowStockItems.length} items</strong> running low on stock that need attention.
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      All inventory items are at healthy stock levels. Keep up the good work!
                    </Typography>
                  )}
                  {sales.filter(s => s.status === 'pending').length > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      There are <strong>{sales.filter(s => s.status === 'pending').length} pending sales orders</strong> that require processing.
                    </Typography>
                  )}
                  {purchases.filter(p => p.status === 'ordered').length > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>{purchases.filter(p => p.status === 'ordered').length} purchases</strong> are currently in transit.
                    </Typography>
                  )}
                </Paper>
              </Stack>
            </CardContent>
          </Card>

          {/* Inventory by Category */}
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Inventory by Category"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              action={
                <Tooltip title="View All">
                  <IconButton component={RouterLink} to="/inventory">
                    <ViewList />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ height: 180, width: '100%' }}>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(value) => [`${value} items`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{
                    display: 'flex',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography color="text.secondary">No category data available</Typography>
                  </Box>
                )}
              </Box>
              <Divider sx={{ mt: 2, mb: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Button
                  component={RouterLink}
                  to="/inventory"
                  endIcon={<ArrowForward />}
                  size="small"
                >
                  Manage Inventory
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Low Stock and Search */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Search Inventory */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardHeader
              title="Search Inventory"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              action={
                <Button
                  endIcon={<ArrowForward />}
                  component={RouterLink}
                  to="/inventory"
                  size="small"
                >
                  View All
                </Button>
              }
            />
            <CardContent sx={{ pt: 0 }}>
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
              />

              <Divider sx={{ mb: 2 }} />

              <List disablePadding sx={{ maxHeight: 350, overflow: 'auto' }}>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <React.Fragment key={item._id || index}>
                      {index > 0 && <Divider component="li" />}
                      <ListItem
                        component={RouterLink}
                        to={`/inventory/${item._id}`}
                        sx={{
                          textDecoration: 'none',
                          color: 'inherit',
                          py: 1.5,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                          }
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                            backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        >
                          {!item.imageUrl && <Inventory2Outlined color="primary" />}
                        </Box>
                        <ListItemText
                          primary={item.name}
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                                SKU: {item.sku}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium" color="primary.main">
                                {formatCurrency(item.price)}
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip
                          size="small"
                          label={item.trackingType === 'quantity'
                            ? `${item.quantity} in stock`
                            : `${item.weight} ${item.weightUnit}`
                          }
                          color={lowStockItems.some(i => i._id === item._id) ? 'warning' : 'default'}
                          sx={{ ml: 1 }}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))
                ) : (
                  <Box sx={{
                    p: 4,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    bgcolor: alpha(theme.palette.info.main, 0.02),
                    borderRadius: 2
                  }}>
                    <Typography color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                      {searchQuery ? "No items match your search" : "Your inventory list is empty. Add some items to get started!"}
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      component={RouterLink}
                      to="/inventory/new"
                      size="small"
                    >
                      Add Item
                    </Button>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Low Stock Items */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: lowStockItems.length > 0 ? alpha(theme.palette.warning.main, 0.8) : alpha(theme.palette.success.main, 0.8) }}>
                  {lowStockItems.length > 0 ? <Warning /> : <CheckCircle />}
                </Avatar>
              }
              title={lowStockItems.length > 0 ? "Low Stock Items" : "Stock Levels"}
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              subheader={lowStockItems.length > 0
                ? `${lowStockItems.length} items need attention`
                : "All items are at healthy stock levels"
              }
              action={
                <Button
                  component={RouterLink}
                  to="/inventory?filter=lowstock"
                  endIcon={<ArrowForward />}
                  size="small"
                  sx={{ visibility: lowStockItems.length > 0 ? 'visible' : 'hidden' }}
                >
                  View All
                </Button>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <List
                sx={{
                  maxHeight: 350,
                  overflow: 'auto',
                  '& .MuiListItem-root': {
                    borderRadius: 2,
                    mb: 0.5,
                    transition: 'all 0.2s',
                  }
                }}
              >
                {lowStockItems.length > 0 ? (
                  lowStockItems.slice(0, 8).map((item) => (
                    <ListItem
                      key={item._id}
                      component={RouterLink}
                      to={`/inventory/${item._id}`}
                      sx={{
                        textDecoration: 'none',
                        color: 'inherit',
                        p: 1.5,
                        bgcolor: alpha(theme.palette.warning.main, 0.05),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography fontWeight={500} noWrap sx={{ maxWidth: '70%' }}>
                              {item.name}
                            </Typography>
                            <Chip
                              size="small"
                              color="warning"
                              icon={<Warning fontSize="small" />}
                              label={item.trackingType === 'quantity'
                                ? `${item.quantity} left`
                                : `${item.weight} ${item.weightUnit} left`
                              }
                            />
                          </Box>
                        }
                        secondary={
                          <Grid container alignItems="center" sx={{ mt: 0.5 }}>
                            <Grid item xs={8}>
                              <LinearProgress
                                variant="determinate"
                                value={item.trackingType === 'quantity'
                                  ? Math.min(item.quantity / quantityThreshold * 50, 100)
                                  : 30 // Simplified for weight-based items
                                }
                                color="warning"
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Grid>
                            <Grid item xs={4} sx={{ textAlign: 'right' }}>
                              <Typography variant="caption" color="text.secondary">
                                SKU: {item.sku}
                              </Typography>
                            </Grid>
                          </Grid>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <Box sx={{
                    p: 3,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    color: 'success.main',
                    mt: 2
                  }}>
                    <CheckCircle color="success" sx={{ fontSize: 60, mb: 2, opacity: 0.8 }} />
                    <Typography textAlign="center" color="success.main" fontWeight={500} variant="h6">
                      All inventory items are at healthy levels
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                      You're doing a great job managing your inventory!
                    </Typography>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        {/* Recent Sales */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.8) }}><ShoppingCartOutlined /></Avatar>}
              title="Recent Sales"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              subheader={`Last ${Math.min(recentSales.length, 5)} of ${sales.length} total sales`}
              action={
                <Button
                  component={RouterLink}
                  to="/sales"
                  endIcon={<ArrowForward />}
                  size="small"
                >
                  View All
                </Button>
              }
            />

            <CardContent sx={{ pt: 0 }}>
              <List disablePadding>
                {recentSales.length > 0 ? (
                  recentSales.map((sale, index) => (
                    <React.Fragment key={sale._id}>
                      {index > 0 && <Divider component="li" sx={{ my: 0.5, opacity: 0.6 }} />}
                      <ListItem
                        component={RouterLink}
                        to={`/sales/${sale._id}`}
                        sx={{
                          py: 1.5,
                          px: 1,
                          textDecoration: 'none',
                          color: 'inherit',
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.success.main, 0.04),
                            transform: 'translateX(4px)'
                          },
                          transition: 'transform 0.2s, background-color 0.2s'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography fontWeight={500} noWrap>
                                {sale.customerName || 'Walk-in Customer'}
                              </Typography>
                              <Typography fontWeight={600} color="primary.main">
                                {formatCurrency(sale.total)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarToday fontSize="small" color="action" sx={{ fontSize: '0.9rem' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(sale.createdAt || new Date())}
                                </Typography>
                              </Box>
                              <StatusChip status={sale.status} size="small" />
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      No recent sales
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      component={RouterLink}
                      to="/sales/new"
                      sx={{ mt: 1 }}
                      size="small"
                    >
                      Create Sale
                    </Button>
                  </Box>
                )}
              </List>

              {sales.length > 5 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    component={RouterLink}
                    to="/sales"
                    startIcon={<Visibility />}
                    size="small"
                  >
                    Show all {sales.length} sales
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Purchases */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.8) }}><LocalShippingOutlined /></Avatar>}
              title="Recent Purchases"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              subheader={`Last ${Math.min(recentPurchases.length, 5)} of ${purchases.length} total purchases`}
              action={
                <Button
                  component={RouterLink}
                  to="/purchases"
                  endIcon={<ArrowForward />}
                  size="small"
                >
                  View All
                </Button>
              }
            />

            <CardContent sx={{ pt: 0 }}>
              <List disablePadding>
                {recentPurchases.length > 0 ? (
                  recentPurchases.map((purchase, index) => (
                    <React.Fragment key={purchase._id}>
                      {index > 0 && <Divider component="li" sx={{ my: 0.5, opacity: 0.6 }} />}
                      <ListItem
                        component={RouterLink}
                        to={`/purchases/${purchase._id}`}
                        sx={{
                          py: 1.5,
                          px: 1,
                          textDecoration: 'none',
                          color: 'inherit',
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.info.main, 0.04),
                            transform: 'translateX(4px)'
                          },
                          transition: 'transform 0.2s, background-color 0.2s'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography fontWeight={500} noWrap>
                                {purchase.supplier?.name || 'Unknown Supplier'}
                              </Typography>
                              <Typography fontWeight={600} color="info.main">
                                {formatCurrency(purchase.total)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarToday fontSize="small" color="action" sx={{ fontSize: '0.9rem' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(purchase.purchaseDate || new Date())}
                                </Typography>
                              </Box>
                              <StatusChip status={purchase.status} size="small" />
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      No recent purchases
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      component={RouterLink}
                      to="/purchases/new"
                      sx={{ mt: 1 }}
                      size="small"
                    >
                      Create Purchase
                    </Button>
                  </Box>
                )}
              </List>

              {purchases.length > 5 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    component={RouterLink}
                    to="/purchases"
                    startIcon={<Visibility />}
                    size="small"
                  >
                    Show all {purchases.length} purchases
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add CreateProductDialog */}
      <CreateProductDialog
        open={createProductDialogOpen}
        onClose={() => setCreateProductDialogOpen(false)}
        onProductCreated={handleProductCreated}
      />
    </Box>
  );
}