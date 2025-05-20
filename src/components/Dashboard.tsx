import React, { useState, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
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
} from "@mui/material";
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
  Info,
  Visibility,
  ViewList,
  Campaign
} from "@mui/icons-material";
import { useItems } from "@hooks/useItems";
import { useSales } from "@hooks/useSales";
import { usePurchases } from "@hooks/usePurchases";
import { useAssets } from "@hooks/useAssets";
import { formatCurrency, formatDate } from "@utils/formatters";
import StatusChip from "@components/ui/StatusChip";
import LoadingScreen from "@components/ui/LoadingScreen";
import { useSettings } from "@hooks/useSettings";
import CreateProductDialog from "@components/inventory/CreateProductDialog";
import { Item, Sale, RelationshipPurchase } from "@custTypes/models";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

// Colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

/**
 * Main Dashboard component that displays business overview and metrics
 * 
 * @returns {JSX.Element} Dashboard component
 */
export default function Dashboard() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch data using React Query hooks with proper array validation
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const { data: sales = [], isLoading: salesLoading } = useSales();
  const { data: purchases = [], isLoading: purchasesLoading } = usePurchases();
  const { data: assets = [], isLoading: assetsLoading } = useAssets();

  // Get low stock threshold settings
  const { settings } = useSettings();

  // Calculate stats with safety checks
  const lowStockItems = useMemo(() => {
    // Ensure items is an array
    if (!Array.isArray(items)) return [];
    
    return items.filter(item => {
      // If alerts are disabled, don't consider anything low stock
      if (!settings.lowStockAlertsEnabled) return false;

      if (item.trackingType === "quantity" &&
          (item.quantity || 0) <= (settings.quantityThreshold || 5)) {
        return true;
      }

      if (item.trackingType === "weight") {
        if (item.priceType === "each" && (item.quantity || 0) <= 3) return true;

        const threshold =
          item.weightUnit === "kg" ? (settings.weightThresholds?.kg || 5) :
          item.weightUnit === "g" ? (settings.weightThresholds?.g || 500) :
          item.weightUnit === "lb" ? (settings.weightThresholds?.lb || 10) :
          item.weightUnit === "oz" ? (settings.weightThresholds?.oz || 16) : 5;

        if ((item.weight || 0) <= threshold) return true;
      }

      return false;
    });
  }, [
    items,
    settings.lowStockAlertsEnabled,
    settings.quantityThreshold,
    settings.weightThresholds
  ]);

  const totalInventoryValue = useMemo(() => {
    // Ensure items is an array
    if (!Array.isArray(items)) return 0;
    
    return items.reduce((total, item) => {
      if (item.trackingType === "quantity") {
        return total + ((item.price || 0) * (item.quantity || 0));
      } else {
        if (item.priceType === "each") {
          return total + ((item.price || 0) * (item.quantity || 0));
        }
        return total + ((item.price || 0) * (item.weight || 0));
      }
    }, 0);
  }, [items]);

  const recentSales = useMemo(() => {
    // Ensure sales is an array
    if (!Array.isArray(sales)) return [];
    
    return [...sales]
      .sort((a: Sale, b: Sale) => {
        // Safely handle dates that might be strings, Date objects, or undefined
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [sales]);

  const recentPurchases = useMemo(() => {
    // Ensure purchases is an array
    if (!Array.isArray(purchases)) return [];
    
    return [...purchases]
      .sort((a: RelationshipPurchase, b: RelationshipPurchase) => {
        // Safely handle dates that might be strings, Date objects, or undefined
        const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
        const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [purchases]);

  // Filter items based on search with safety checks
  const filteredItems = useMemo(() => {
    // Ensure items is an array
    if (!Array.isArray(items)) return [];
    
    return items
      .filter(
        item =>
          (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.sku || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 10);
  }, [items, searchQuery]);

  // Prepare data for charts with safety checks
  const categoryData = useMemo(() => {
    // Ensure items is an array
    if (!Array.isArray(items)) return [];
    
    const categories: Record<string, number> = {};
    items.forEach(item => {
      const category = item.category || "Uncategorized";
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
    // Set up the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split("T")[0],
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()],
        sales: 0,
        purchases: 0
      };
    }).reverse();

    // Ensure sales is an array before using it
    if (Array.isArray(sales)) {
      // Aggregate sales by day with proper date validation
      sales.forEach(sale => {
        if (!sale.createdAt) return;
        
        try {
          const saleDate = new Date(sale.createdAt).toISOString().split("T")[0];
          const dayData = last7Days.find(day => day.date === saleDate);
          if (dayData) {
            dayData.sales += sale.total || 0;
          }
        } catch (error) {
          console.error("Error processing sale date:", error);
        }
      });
    }

    // Ensure purchases is an array before using it
    if (Array.isArray(purchases)) {
      // Aggregate purchases by day with proper date validation
      purchases.forEach(purchase => {
        if (!purchase.purchaseDate) return;
        
        try {
          const purchaseDate = new Date(purchase.purchaseDate).toISOString().split("T")[0];
          const dayData = last7Days.find(day => day.date === purchaseDate);
          if (dayData) {
            dayData.purchases += purchase.total || 0;
          }
        } catch (error) {
          console.error("Error processing purchase date:", error);
        }
      });
    }

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

  // Safely calculate the total sales value
  const totalSalesValue = Array.isArray(sales) 
    ? sales.reduce((sum, sale) => sum + (sale.total || 0), 0) 
    : 0;

  // Safely calculate the total purchases value
  const totalPurchasesValue = Array.isArray(purchases) 
    ? purchases.reduce((sum, purchase) => sum + (purchase.total || 0), 0) 
    : 0;
    
  // Safely calculate the total assets value
  const totalAssetsValue = Array.isArray(assets) 
    ? assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0) 
    : 0;

  // Safely count pending sales
  const pendingSalesCount = Array.isArray(sales) 
    ? sales.filter(s => s.status === "pending").length 
    : 0;

  // Safely count pending purchases
  const pendingPurchasesCount = Array.isArray(purchases) 
    ? purchases.filter(p => p.status === "pending").length 
    : 0;

  // Safely count assets in maintenance
  const maintenanceAssetsCount = Array.isArray(assets) 
    ? assets.filter(a => a.status === "maintenance").length 
    : 0;

  return (
    <Box className="fade-in">
      {successMessage && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            boxShadow: theme.shadows[2],
            animation: "fadeIn 0.5s ease",
            borderRadius: 2
          }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Dashboard Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="700" sx={{ mb: 0.5 }}>
            Welcome to BizTracker
          </Typography>
          <Typography
            color="text.secondary"
            variant="subtitle1"
            component="div"
          >
            Here's what's happening with your business today
          </Typography>
        </Box>
      </Box>

      {/* Quick Stats & Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={3}>
            {/* Business Summary Stats */}
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2
                    }}
                  >
                    <Avatar
                      sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                    >
                      <Inventory2Outlined color="primary" />
                    </Avatar>
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      component="div"
                    >
                      Inventory
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {items.length}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="div"
                    sx={{ mb: 1 }}
                  >
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

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2
                    }}
                  >
                    <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                      <ShoppingCartOutlined color="success" />
                    </Avatar>
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      component="div"
                    >
                      Sales
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {Array.isArray(sales) ? sales.length : 0}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="div"
                    sx={{ mb: 1 }}
                  >
                    {formatCurrency(totalSalesValue)}
                  </Typography>

                  {pendingSalesCount > 0 && (
                    <Chip
                      label={`${pendingSalesCount} pending`}
                      color="info"
                      size="small"
                      icon={<Info fontSize="small" />}
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2
                    }}
                  >
                    <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                      <LocalShippingOutlined color="info" />
                    </Avatar>
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      component="div"
                    >
                      Purchases
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {Array.isArray(purchases) ? purchases.length : 0}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="div"
                    sx={{ mb: 1 }}
                  >
                    {formatCurrency(totalPurchasesValue)}
                  </Typography>

                  {pendingPurchasesCount > 0 && (
                    <Chip
                      label={`${pendingPurchasesCount} in transit`}
                      color="secondary"
                      size="small"
                      icon={<LocalShippingOutlined fontSize="small" />}
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2
                    }}
                  >
                    <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1) }}>
                      <BusinessCenter color="secondary" />
                    </Avatar>
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      component="div"
                    >
                      Assets
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {Array.isArray(assets) ? assets.length : 0}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="div"
                    sx={{ mb: 1 }}
                  >
                    {formatCurrency(totalAssetsValue)}
                  </Typography>

                  {maintenanceAssetsCount > 0 && (
                    <Chip
                      label={`${maintenanceAssetsCount} in maintenance`}
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
            <Grid size={{ xs: 12 }}>
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
                  <Box sx={{ height: 250, width: "100%" }}>
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
                          tickFormatter={(value) => value === 0 ? "$0" : `$${value}`}
                          axisLine={false}
                        />
                        <ChartTooltip
                          formatter={(value) => [
                            `${formatCurrency(value as number)}`,
                            ""
                          ]}
                          contentStyle={{ borderRadius: 8 }}
                          labelStyle={{ fontWeight: "bold" }}
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
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 3, borderRadius: 3, overflow: 'visible' }}>
            <CardHeader
              title="Quick Actions"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
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
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 4
                    },
                    transition: "transform 0.2s, box-shadow 0.2s"
                  }}
                >
                  Add Inventory Item
                </Button>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6 }}>
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
                  <Grid size={{ xs: 6 }}>
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
                  <Grid size={{ xs: 6 }}>
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
                  <Grid size={{ xs: 6 }}>
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
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{
                      mb: 1,
                      display: "flex",
                      alignItems: "center"
                    }}
                    component="div"
                  >
                    <Campaign color="info" fontSize="small" sx={{ mr: 1 }} />
                    Business Insights
                  </Typography>
                  {lowStockItems.length > 0 ? (
                    <Typography variant="body2" component="div">
                      You have <strong>{lowStockItems.length} items</strong> running low on stock
                      that need attention.
                    </Typography>
                  ) : (
                    <Typography variant="body2" component="div">
                      All inventory items are at healthy stock levels. Keep up the good work!
                    </Typography>
                  )}
                  {pendingSalesCount > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }} component="div">
                      There are <strong>{pendingSalesCount} pending sales orders</strong> that 
                      require processing.
                    </Typography>
                  )}
                  {pendingPurchasesCount > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }} component="div">
                      <strong>{pendingPurchasesCount} purchases</strong> are currently in transit.
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
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              action={
                <Tooltip title="View All">
                  <IconButton component={RouterLink} to="/inventory">
                    <ViewList />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ height: 180, width: "100%" }}>
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
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}-${entry.name}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(value) => [`${value} items`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Typography color="text.secondary" component="div">
                      No category data available
                    </Typography>
                  </Box>
                )}
              </Box>
              <Divider sx={{ mt: 2, mb: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardHeader
              title="Search Inventory"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
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

              <List disablePadding sx={{ maxHeight: 350, overflow: "auto" }}>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <React.Fragment key={item.id || `item-${index}`}>
                      {index > 0 && <Divider component="li" />}
                      <ListItem
                        component={RouterLink}
                        to={`/inventory/${item.id}`}
                        sx={{
                          textDecoration: "none",
                          color: "inherit",
                          py: 1.5,
                          borderRadius: 1,
                          "&:hover": {
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
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mr: 2,
                            backgroundImage: item.imageUrl ?
                              `url(${item.imageUrl})` : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          {!item.imageUrl && <Inventory2Outlined color="primary" />}
                        </Box>
                        <ListItemText
                          primary={
                            <Typography component="div">{item.name}</Typography>
                          }
                          secondary={
                            <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }} component="span">
                                SKU: {item.sku}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium" color="primary.main" component="span">
                                {formatCurrency(item.price || 0)}
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip
                          size="small"
                          label={item.trackingType === "quantity" ?
                            `${item.quantity || 0} in stock` :
                            `${item.weight || 0} ${item.weightUnit || 'units'}`
                          }
                          color={
                            lowStockItems.some(i => i.id === item.id) ?
                            "warning" : "default"
                          }
                          sx={{ ml: 1 }}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))
                ) : (
                  <Box
                    sx={{
                      p: 4,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",
                      bgcolor: alpha(theme.palette.info.main, 0.02),
                      borderRadius: 2
                    }}
                  >
                    <Typography
                      color="text.secondary"
                      component="div"
                      sx={{ fontStyle: "italic", mb: 2 }}
                    >
                      {searchQuery ?
                        "No items match your search" :
                        "Your inventory list is empty. Add some items to get started!"
                      }
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardHeader
              avatar={
                <Avatar
                  sx={{
                    bgcolor: lowStockItems.length > 0 ?
                      alpha(theme.palette.warning.main, 0.8) :
                      alpha(theme.palette.success.main, 0.8)
                  }}
                >
                  {lowStockItems.length > 0 ? <Warning /> : <CheckCircle />}
                </Avatar>
              }
              title={lowStockItems.length > 0 ? "Low Stock Items" : "Stock Levels"}
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              subheader={lowStockItems.length > 0 ?
                `${lowStockItems.length} items need attention` :
                "All items are at healthy stock levels"
              }
              action={
                <Button
                  component={RouterLink}
                  to="/inventory?filter=lowstock"
                  endIcon={<ArrowForward />}
                  size="small"
                  sx={{
                    visibility: lowStockItems.length > 0 ? "visible" : "hidden"
                  }}
                >
                  View All
                </Button>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <List
                sx={{
                  maxHeight: 350,
                  overflow: "auto",
                  "& .MuiListItem-root": {
                    borderRadius: 2,
                    mb: 0.5,
                    transition: "all 0.2s",
                  }
                }}
              >
                {lowStockItems.length > 0 ? (
                  lowStockItems.slice(0, 8).map((item) => (
                    <ListItem
                      key={item.id || `low-stock-${item.sku}`}
                      component={RouterLink}
                      to={`/inventory/${item.id}`}
                      sx={{
                        textDecoration: "none",
                        color: "inherit",
                        p: 1.5,
                        bgcolor: alpha(theme.palette.warning.main, 0.05),
                        "&:hover": {
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          transform: "translateY(-2px)"
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <Typography
                              fontWeight={500}
                              noWrap
                              sx={{ maxWidth: "70%" }}
                              component="div"
                            >
                              {item.name}
                            </Typography>
                            <Chip
                              size="small"
                              color="warning"
                              icon={<Warning fontSize="small" />}
                              label={item.trackingType === "quantity" ?
                                `${item.quantity || 0} left` :
                                `${item.weight || 0} ${item.weightUnit || 'units'} left`
                              }
                            />
                          </Box>
                        }
                        secondary={
                          <Typography component="span" variant="body2">
                            <Grid container component="span" alignItems="center" sx={{ mt: 0.5 }}>
                              <Grid size={{ xs: 8 }} component="span">
                                <LinearProgress
                                  variant="determinate"
                                  value={item.trackingType === 'quantity'
                                    ? Math.min((item.quantity || 0) / (settings.quantityThreshold || 5) * 50, 100)
                                    : 30 // Simplified for weight-based items
                                  }
                                  color="warning"
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Grid>
                              <Grid size={{ xs: 4 }} component="span" sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="text.secondary">
                                  SKU: {item.sku}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <Box
                    sx={{
                      p: 3,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",
                      color: "success.main",
                      mt: 2
                    }}
                  >
                    <CheckCircle color="success" sx={{ fontSize: 60, mb: 2, opacity: 0.8 }} />
                    <Typography
                      textAlign="center"
                      color="success.main"
                      fontWeight={500}
                      variant="h6"
                      component="div"
                    >
                      All inventory items are at healthy levels
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                      sx={{ mt: 1 }}
                      component="div"
                    >
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.8) }}>
                  <ShoppingCartOutlined />
                </Avatar>
              }
              title="Recent Sales"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              subheader={
                `Last ${Math.min(recentSales.length, 5)} of ${sales.length} total sales`
              }
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
                    <React.Fragment key={sale.id || `sale-${index}`}>
                      {index > 0 &&
                        <Divider component="li" sx={{ my: 0.5, opacity: 0.6 }} />
                      }
                      <ListItem
                        component={RouterLink}
                        to={`/sales/${sale.id}`}
                        sx={{
                          py: 1.5,
                          px: 1,
                          textDecoration: "none",
                          color: "inherit",
                          borderRadius: 2,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.success.main, 0.04),
                            transform: "translateX(4px)"
                          },
                          transition: "transform 0.2s, background-color 0.2s"
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5
                              }}
                            >
                              <Typography fontWeight={500} noWrap component="div">
                                {sale.customerName || "Walk-in Customer"}
                              </Typography>
                              <Typography fontWeight={600} color="primary.main" component="div">
                                {formatCurrency(sale.total || 0)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarToday fontSize="small" color="action" sx={{ fontSize: '0.9rem' }} />
                                <Typography variant="caption" color="text.secondary" component="span">
                                  {sale.createdAt ? formatDate(sale.createdAt) : ""}
                                </Typography>
                              </Box>
                              <StatusChip status={sale.status || "pending"} size="small" />
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))
                ) : (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography color="text.secondary" sx={{ mb: 1 }} component="div">
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

              {Array.isArray(sales) && sales.length > 5 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.8) }}>
                  <LocalShippingOutlined />
                </Avatar>
              }
              title="Recent Purchases"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              subheader={
                `Last ${Math.min(recentPurchases.length, 5)} of ${purchases.length} total purchases`
              }
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
                    <React.Fragment key={purchase.id || `purchase-${index}`}>
                      {index > 0 &&
                        <Divider component="li" sx={{ my: 0.5, opacity: 0.6 }} />
                      }
                      <ListItem
                        component={RouterLink}
                        to={`/purchases/${purchase.id}`}
                        sx={{
                          py: 1.5,
                          px: 1,
                          textDecoration: "none",
                          color: "inherit",
                          borderRadius: 2,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.info.main, 0.04),
                            transform: "translateX(4px)"
                          },
                          transition: "transform 0.2s, background-color 0.2s"
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5
                              }}
                            >
                              <Typography fontWeight={500} noWrap component="div">
                                {purchase.supplier?.name || "Unknown Supplier"}
                              </Typography>
                              <Typography fontWeight={600} color="info.main" component="div">
                                {formatCurrency(purchase.total || 0)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography component="span" variant="body2">
                              <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CalendarToday fontSize="small" color="action" sx={{ fontSize: '0.9rem' }} />
                                  <Typography variant="caption" color="text.secondary" component="span">
                                    {purchase.purchaseDate ? formatDate(purchase.purchaseDate) : ""}
                                  </Typography>
                                </Box>
                                <StatusChip status={purchase.status || "pending"} size="small" />
                              </Box>
                            </Typography>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))
                ) : (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography color="text.secondary" sx={{ mb: 1 }} component="div">
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

              {Array.isArray(purchases) && purchases.length > 5 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
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