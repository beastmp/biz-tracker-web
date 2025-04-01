import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  useTheme,
  alpha,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Print as PrintIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  AttachMoney,
  Inventory as InventoryIcon,
  ShowChart,
  Receipt,
  LocalShipping,
  TrendingDown,
  TrendingUp,
  People,
  Visibility,
  FilterAlt,
  Business,
  ArrowForward,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { usePurchasesReport } from '@hooks/usePurchases';
import { formatCurrency, formatDate } from '@utils/formatters';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import { Link as RouterLink } from 'react-router-dom';
import StatusChip from '@components/ui/StatusChip';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Active pie chart sector renderer
const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-midAngle * Math.PI / 180);
  const cos = Math.cos(-midAngle * Math.PI / 180);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={14} fontWeight="bold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12}>
        {`${formatCurrency(value)}`}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={12}>
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

export default function PurchasesReport() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(new Date().setMonth(new Date().getMonth() - 6))
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<string>('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch report data with filters
  const { data, isLoading, error, refetch } = usePurchasesReport({
    startDate: startDate?.toISOString() || '',
    endDate: endDate?.toISOString() || '',
    period,
    supplier: supplierFilter === 'all' ? undefined : supplierFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    category: categoryFilter === 'all' ? undefined : categoryFilter
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePeriodChange = (event: SelectChangeEvent) => {
    const newPeriod = event.target.value;
    setPeriod(newPeriod);

    // Auto-adjust date range based on period
    const now = new Date();
    let start = new Date();

    switch (newPeriod) {
      case 'day':
        start = new Date(now.setDate(now.getDate() - 30)); // Last 30 days
        break;
      case 'week':
        start = new Date(now.setDate(now.getDate() - 90)); // Last ~12 weeks
        break;
      case 'month':
        start = new Date(now.setMonth(now.getMonth() - 12)); // Last 12 months
        break;
      case 'quarter':
        start = new Date(now.setMonth(now.getMonth() - 24)); // Last 8 quarters (2 years)
        break;
      case 'year':
        start = new Date(now.setFullYear(now.getFullYear() - 5)); // Last 5 years
        break;
      default:
        start = new Date(now.setMonth(now.getMonth() - 6)); // Default to last 6 months
    }

    setStartDate(start);
    setEndDate(new Date());
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handlePrint = () => {
    window.print();
  };

  // Export data to CSV
  const exportToCSV = () => {
    if (!data || !data.purchasesByPeriod) return;

    const header = ['Period', 'Orders', 'Total Cost'];
    const rows = data.purchasesByPeriod.map(item => [
      item.period,
      item.count,
      item.total.toFixed(2)
    ]);

    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `purchases-report-${formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export detailed purchase data
  const exportDetailedCSV = () => {
    if (!data || !data.purchases) return;

    // Create CSV headers and rows
    const header = ['Date', 'Supplier', 'Items', 'Status', 'Total Cost'];
    const rows = data.purchases.map(purchase => [
      formatDate(new Date(purchase.purchaseDate)),
      purchase.supplier?.name || 'Unknown',
      purchase.items.length,
      purchase.status,
      purchase.total.toFixed(2)
    ]);

    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `purchases-detailed-${formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Derived data for top suppliers
  const topSuppliers = useMemo(() => {
    if (!data?.topSuppliers) return [];
    return [...data.topSuppliers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
  }, [data?.topSuppliers]);

  // Derived data for top items
  const topItems = useMemo(() => {
    if (!data?.topItems) return [];
    return [...data.topItems].sort((a, b) => b.totalCost - a.totalCost).slice(0, 10);
  }, [data?.topItems]);

  // Sort and filter purchases for the table
  const sortedPurchases = useMemo(() => {
    if (!data?.purchases) return [];

    return [...data.purchases].sort((a, b) => {
      if (orderBy === 'date') {
        const dateA = new Date(a.purchaseDate);
        const dateB = new Date(b.purchaseDate);
        return order === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      } else if (orderBy === 'supplier') {
        const supplierA = a.supplier?.name || '';
        const supplierB = b.supplier?.name || '';
        return order === 'asc'
          ? supplierA.localeCompare(supplierB)
          : supplierB.localeCompare(supplierA);
      } else if (orderBy === 'total') {
        return order === 'asc' ? a.total - b.total : b.total - a.total;
      } else if (orderBy === 'items') {
        return order === 'asc' ? a.items.length - b.items.length : b.items.length - a.items.length;
      } else if (orderBy === 'status') {
        return order === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
      return 0;
    });
  }, [data?.purchases, orderBy, order]);

  // Paginated purchases for table display
  const paginatedPurchases = useMemo(() => {
    return sortedPurchases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedPurchases, page, rowsPerPage]);

  // Format purchase data for charts
  const trendData = useMemo(() => {
    if (!data?.purchasesByPeriod) return [];

    return data.purchasesByPeriod.map(item => ({
      name: item.period,
      amount: item.total,
      count: item.count,
      avgOrderValue: item.count > 0 ? item.total / item.count : 0
    }));
  }, [data?.purchasesByPeriod]);

  // Format category data for pie chart
  const categoryData = useMemo(() => {
    if (!data?.purchasesByCategory) return [];

    return Object.entries(data.purchasesByCategory || {})
      .map(([category, amount]) => ({
        name: category || 'Uncategorized',
        value: amount
      }))
      .sort((a, b) => b.value - a.value);
  }, [data?.purchasesByCategory]);

  // Calculate forecast based on trends
  const calculateForecast = () => {
    if (!trendData || trendData.length < 3) return null;

    // Simple average of last 3 periods for forecast
    const lastThreePeriods = trendData.slice(-3);
    const avgAmount = lastThreePeriods.reduce((sum, item) => sum + item.amount, 0) / lastThreePeriods.length;

    // Calculate percentage change from previous month
    const currentAmount = trendData[trendData.length - 1]?.amount || 0;
    const previousAmount = trendData[trendData.length - 2]?.amount || 1; // Avoid division by zero
    const percentageChange = ((currentAmount - previousAmount) / previousAmount) * 100;

    return {
      forecastAmount: avgAmount,
      percentageChange,
      increasing: percentageChange > 0
    };
  };

  const forecast = calculateForecast();

  // Available statuses for filter
  const availableStatuses = useMemo(() => {
    if (!data?.purchases) return [];

    const statuses = new Set<string>();
    data.purchases.forEach(purchase => {
      statuses.add(purchase.status);
    });

    return Array.from(statuses);
  }, [data?.purchases]);

  // Available categories for filter
  const availableCategories = useMemo(() => {
    if (!data?.topItems) return [];

    const categories = new Set<string>();
    data.topItems.forEach(item => {
      if (item.category) categories.add(item.category);
    });

    return Array.from(categories);
  }, [data?.topItems]);

  if (isLoading) {
    return <LoadingScreen message="Generating purchase report..." />;
  }

  if (error) {
    return <ErrorFallback error={error as Error} message="Failed to generate purchase report" />;
  }

  const suppliers = data?.suppliers || [];

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Purchases Report
        </Typography>
        <Typography color="text.secondary" variant="subtitle1">
          Analyze your purchasing patterns and supplier data
        </Typography>
      </Box>

      {/* Filters and Actions */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2,
          borderRadius: 2,
          boxShadow: theme.shadows[2]
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                sx: { minWidth: 130 }
              }
            }}
          />
        </LocalizationProvider>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                sx: { minWidth: 130 }
              }
            }}
          />
        </LocalizationProvider>

        <FormControl size="small" sx={{ minWidth: 120, flexGrow: { xs: 1, md: 0 } }}>
          <InputLabel>Group By</InputLabel>
          <Select
            value={period}
            onChange={handlePeriodChange}
            label="Group By"
          >
            <MenuItem value="day">Day</MenuItem>
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
            <MenuItem value="quarter">Quarter</MenuItem>
            <MenuItem value="year">Year</MenuItem>
          </Select>
        </FormControl>

        <Tooltip title="More Filters">
          <Button
            startIcon={<FilterAlt />}
            variant="outlined"
            size="small"
            onClick={() => {}}
            sx={{ display: { xs: 'flex', md: 'none' } }}
          >
            Filters
          </Button>
        </Tooltip>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Supplier</InputLabel>
            <Select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              label="Supplier"
            >
              <MenuItem value="all">All Suppliers</MenuItem>
              {suppliers.map(supplier => (
                <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {availableStatuses.map(status => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              {availableCategories.map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            marginLeft: { xs: 0, md: 'auto' },
            mt: { xs: 1, md: 0 }
          }}
        >
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => refetch()} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export to CSV">
            <IconButton onClick={exportToCSV} color="primary">
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Report">
            <IconButton onClick={handlePrint} color="primary">
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Mobile Filters (Collapsed initially) */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: '47%', flexGrow: 1 }}>
          <InputLabel>Supplier</InputLabel>
          <Select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            label="Supplier"
          >
            <MenuItem value="all">All Suppliers</MenuItem>
            {suppliers.map(supplier => (
              <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: '47%', flexGrow: 1 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Statuses</MenuItem>
            {availableStatuses.map(status => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: '47%', flexGrow: 1 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            label="Category"
          >
            <MenuItem value="all">All Categories</MenuItem>
            {availableCategories.map(category => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 2,
                height: 56,
                width: 56,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
                mx: 'auto',
                alignItems: 'center'
              }}>
                <Receipt fontSize="large" />
              </Box>
              <Typography color="text.secondary" variant="subtitle1" gutterBottom>
                Total Purchases
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold" color="info.main">
                {data?.summary?.purchaseCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Orders placed in selected period
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 2,
                height: 56,
                width: 56,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                mx: 'auto',
                alignItems: 'center'
              }}>
                <AttachMoney fontSize="large" />
              </Box>
              <Typography color="text.secondary" variant="subtitle1" gutterBottom>
                Total Spent
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold" color="primary">
                {formatCurrency(data?.summary?.totalSpent || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Across all suppliers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 2,
                height: 56,
                width: 56,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                mx: 'auto',
                alignItems: 'center'
              }}>
                <InventoryIcon fontSize="large" />
              </Box>
              <Typography color="text.secondary" variant="subtitle1" gutterBottom>
                Total Items
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold" color="success.main">
                {data?.summary?.totalItems || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Items purchased in this period
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 2,
                height: 56,
                width: 56,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
                mx: 'auto',
                alignItems: 'center'
              }}>
                <Business fontSize="large" />
              </Box>
              <Typography color="text.secondary" variant="subtitle1" gutterBottom>
                Avg. Order Value
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold" color="warning.main">
                {formatCurrency(data?.summary?.purchaseCount ? data?.summary?.totalSpent / data?.summary?.purchaseCount : 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {data?.summary?.supplierCount || 0} different suppliers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Report tabs */}
      <Paper sx={{ borderRadius: 2, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="purchase report tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label="Spend Analysis"
              icon={<ShowChart />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: tabValue === 0 ? 'bold' : 'normal' }}
            />
            <Tab
              label="Supplier Analysis"
              icon={<People />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: tabValue === 1 ? 'bold' : 'normal' }}
            />
            <Tab
              label="Items Analysis"
              icon={<InventoryIcon />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: tabValue === 2 ? 'bold' : 'normal' }}
            />
            <Tab
              label="Purchases List"
              icon={<Receipt />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: tabValue === 3 ? 'bold' : 'normal' }}
            />
          </Tabs>
        </Box>

        {/* Spend Analysis Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Purchase trend over time */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ mb: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Purchase Spend Trend
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Total purchase spending over time
                  </Typography>

                  <Box sx={{ height: 350, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={trendData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 30,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          tickMargin={10}
                        />
                        <YAxis
                          tickFormatter={(value) => formatCurrency(value, false)}
                          tick={{ fontSize: 12 }}
                        />
                        <ChartTooltip
                          formatter={(value: any) => formatCurrency(value)}
                          labelFormatter={(label) => `Period: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          name="Purchase Total"
                          fill={alpha(theme.palette.primary.main, 0.3)}
                          stroke={theme.palette.primary.main}
                          activeDot={{ r: 6 }}
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Spend by Category Pie Chart */}
            <Grid item xs={12} sm={12} lg={4}>
              <Card sx={{ mb: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Spend by Category
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Distribution of purchases across categories
                  </Typography>

                  <Box sx={{ height: 350, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            activeIndex={activePieIndex}
                            activeShape={renderActiveShape}
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                            onMouseEnter={(_, index) => setActivePieIndex(index)}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                stroke={theme.palette.background.paper}
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <ChartTooltip formatter={(value) => formatCurrency(value as number)} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          flexDirection: 'column',
                          gap: 2
                        }}
                      >
                        <PieChartIcon sx={{ fontSize: 50, color: 'text.secondary', opacity: 0.5 }} />
                        <Typography color="text.secondary" align="center">
                          No category data available.<br/>
                          Try selecting a different time period.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Order Count Trend */}
            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Purchase Order Count
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Number of purchase orders over time
                  </Typography>

                  <Box sx={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={trendData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 30,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          tickMargin={10}
                        />
                        <YAxis
                          tickFormatter={(value) => value.toString()}
                          tick={{ fontSize: 12 }}
                        />
                        <ChartTooltip
                          formatter={(value: any) => [`${value} orders`, 'Order Count']}
                          labelFormatter={(label) => `Period: ${label}`}
                        />
                        <Bar
                          dataKey="count"
                          name="Order Count"
                          fill={theme.palette.info.main}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Average Order Value Trend */}
            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Average Order Value
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Average value per purchase order
                  </Typography>

                  <Box sx={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 30,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          tickMargin={10}
                        />
                        <YAxis
                          tickFormatter={(value) => formatCurrency(value, false)}
                          tick={{ fontSize: 12 }}
                        />
                        <ChartTooltip
                          formatter={(value: any) => formatCurrency(value)}
                          labelFormatter={(label) => `Period: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="avgOrderValue"
                          name="Average Order Value"
                          stroke={theme.palette.success.main}
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

            {/* Forecast Card */}
            {forecast && (
              <Grid item xs={12}>
                <Card sx={{
                  bgcolor: alpha(theme.palette.info.main, 0.04),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}>
                  <CardContent>
                    <Grid container alignItems="center" spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" fontWeight="bold" color="info.main" gutterBottom>
                          Spend Forecast
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Based on your recent purchase history
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Estimated Next Period Spend
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="info.main" gutterBottom>
                          {formatCurrency(forecast.forecastAmount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                        <Stack direction="row" spacing={1} sx={{ justifyContent: { xs: 'center', md: 'flex-end' } }}>
                          {forecast.increasing ? (
                            <TrendingUp color="error" />
                          ) : (
                            <TrendingDown color="success" />
                          )}
                          <Typography
                            color={forecast.increasing ? 'error.main' : 'success.main'}
                            fontWeight="medium"
                          >
                            {forecast.increasing ? '+' : ''}{forecast.percentageChange.toFixed(1)}%
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                              from previous period
                            </Typography>
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          This forecast is an estimate based on your purchase history
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Supplier Analysis Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* Top Suppliers */}
            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 3, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Top Suppliers by Spend
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your highest-spend suppliers
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      endIcon={<ArrowForward />}
                      component={RouterLink}
                      to="/suppliers"
                    >
                      All Suppliers
                    </Button>
                  </Box>

                  <Box sx={{ height: 350, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topSuppliers}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 30,
                          left: 80,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis
                          type="number"
                          tickFormatter={(value) => formatCurrency(value, false)}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          width={80}
                        />
                        <ChartTooltip formatter={(value: any) => formatCurrency(value)} />
                        <Bar
                          dataKey="totalSpent"
                          name="Total Spent"
                          fill={theme.palette.primary.main}
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Supplier Order Count */}
            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 3, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Suppliers by Order Count
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Frequency of orders by supplier
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ height: 350, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topSuppliers}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 30,
                          left: 80,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          width={80}
                        />
                        <ChartTooltip formatter={(value: any) => [`${value} orders`, 'Orders']} />
                        <Bar
                          dataKey="orderCount"
                          name="Order Count"
                          fill={theme.palette.info.main}
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Supplier Table */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Supplier Performance
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Detailed breakdown of suppliers in this period
                  </Typography>

                  <TableContainer>
                    <Table size="medium">
                      <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableRow>
                          <TableCell>Supplier</TableCell>
                          <TableCell align="right">Orders</TableCell>
                          <TableCell align="right">Items</TableCell>
                          <TableCell align="right">Total Spend</TableCell>
                          <TableCell align="right">Avg Order Value</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topSuppliers.map((supplier, index) => (
                          <TableRow
                            key={supplier.id || index}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell component="th" scope="row">{supplier.name}</TableCell>
                            <TableCell align="right">{supplier.orderCount}</TableCell>
                            <TableCell align="right">{supplier.itemCount}</TableCell>
                            <TableCell align="right">{formatCurrency(supplier.totalSpent)}</TableCell>
                            <TableCell align="right">{formatCurrency(supplier.orderCount > 0 ? supplier.totalSpent / supplier.orderCount : 0)}</TableCell>
                            <TableCell align="right">
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  component={RouterLink}
                                  to={`/suppliers/${supplier.id}`}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}

                        {topSuppliers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                              <Typography color="text.secondary">
                                No supplier data available for the selected period
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Items Analysis Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {/* Top Items */}
            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 3, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Top Items by Spend
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Highest expenditure on inventory items
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      endIcon={<ArrowForward />}
                      component={RouterLink}
                      to="/inventory"
                    >
                      All Items
                    </Button>
                  </Box>

                  <Box sx={{ height: 350, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topItems}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 30,
                          left: 100,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis
                          type="number"
                          tickFormatter={(value) => formatCurrency(value, false)}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          width={100}
                        />
                        <ChartTooltip formatter={(value: any) => formatCurrency(value)} />
                        <Bar
                          dataKey="totalCost"
                          name="Total Cost"
                          fill={theme.palette.success.main}
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Items by Quantity */}
            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 3, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Top Items by Quantity
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Items purchased in highest quantity
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ height: 350, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topItems}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 30,
                          left: 100,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          width={100}
                        />
                        <ChartTooltip formatter={(value: any) => [`${value} units`, 'Quantity']} />
                        <Bar
                          dataKey="quantity"
                          name="Quantity"
                          fill={theme.palette.warning.main}
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Items Table */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Item Purchase Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Most frequently purchased items
                  </Typography>

                  <TableContainer>
                    <Table size="medium">
                      <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>SKU</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Cost</TableCell>
                          <TableCell align="right">Total Cost</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topItems.map((item, index) => (
                          <TableRow
                            key={item.id || index}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell component="th" scope="row">{item.name}</TableCell>
                            <TableCell>{item.sku}</TableCell>
                            <TableCell>{item.category || 'Uncategorized'}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(item.unitCost)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.totalCost)}</TableCell>
                            <TableCell align="right">
                              <Tooltip title="View Item">
                                <IconButton
                                  size="small"
                                  component={RouterLink}
                                  to={`/inventory/${item.id}`}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}

                        {topItems.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                              <Typography color="text.secondary">
                                No item data available for the selected period
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Purchases List Tab */}
        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Purchase Orders
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete list of purchase orders in the selected period
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportDetailedCSV}
                >
                  Export Detailed
                </Button>
              </Box>

              <TableContainer>
                <Table size="medium">
                  <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'date'}
                          direction={orderBy === 'date' ? order : 'asc'}
                          onClick={() => handleRequestSort('date')}
                        >
                          Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'supplier'}
                          direction={orderBy === 'supplier' ? order : 'asc'}
                          onClick={() => handleRequestSort('supplier')}
                        >
                          Supplier
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={orderBy === 'items'}
                          direction={orderBy === 'items' ? order : 'asc'}
                          onClick={() => handleRequestSort('items')}
                        >
                          Items
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'status'}
                          direction={orderBy === 'status' ? order : 'asc'}
                          onClick={() => handleRequestSort('status')}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={orderBy === 'total'}
                          direction={orderBy === 'total' ? order : 'asc'}
                          onClick={() => handleRequestSort('total')}
                        >
                          Total
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{formatDate(new Date(purchase.purchaseDate))}</TableCell>
                        <TableCell>{purchase.supplier?.name || 'Unknown'}</TableCell>
                        <TableCell align="right">{purchase.items.length}</TableCell>
                        <TableCell>
                          <StatusChip status={purchase.status} />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(purchase.total)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Purchase">
                            <IconButton
                              size="small"
                              component={RouterLink}
                              to={`/purchases/${purchase.id}`}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}

                    {paginatedPurchases.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            No purchases found for the selected filters
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={sortedPurchases.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
    </Box>
  );
}
