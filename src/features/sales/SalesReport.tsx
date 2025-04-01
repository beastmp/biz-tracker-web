import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Stack,
  useTheme,
  Tab,
  Tabs,
  alpha,
  SelectChangeEvent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Print as PrintIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp,
  AttachMoney,
  ShoppingBasket,
  LocalShipping,
  CalendarToday,
  ShowChart,
  TableChart,
  Person,
  Inventory
} from '@mui/icons-material';
import { useSalesReport } from '@hooks/useSales';
import { formatCurrency, formatDate } from '@utils/formatters';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';

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

export default function SalesReport() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const { data, isLoading, error, refetch } = useSalesReport({
    startDate: startDate?.toISOString() || '',
    endDate: endDate?.toISOString() || '',
    period
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
      case 'year':
        start = new Date(now.setFullYear(now.getFullYear() - 5)); // Last 5 years
        break;
      default:
        start = new Date(now.setMonth(now.getMonth() - 1)); // Default to last month
    }

    setStartDate(start);
    setEndDate(new Date());
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = () => {
    if (!data || !data.salesByPeriod) return;

    // Convert data to CSV
    const header = ['Period', 'Orders', 'Total Sales'];
    const rows = data.salesByPeriod.map(item => [
      item.period,
      item.count,
      item.total.toFixed(2)
    ]);

    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-report-${formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const topProducts = useMemo(() => {
    if (!data || !data.topProducts) return [];
    return [...data.topProducts].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  }, [data]);

  const topCustomers = useMemo(() => {
    if (!data || !data.topCustomers) return [];
    return [...data.topCustomers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  }, [data]);

  if (isLoading) {
    return <LoadingScreen message="Generating report..." />;
  }

  if (error) {
    return <ErrorFallback error={error as Error} message="Failed to generate sales report" />;
  }

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Sales Reports
        </Typography>
        <Typography color="text.secondary" variant="subtitle1">
          Analyze your sales performance and trends
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
            <MenuItem value="year">Year</MenuItem>
          </Select>
        </FormControl>

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
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                mx: 'auto',
                alignItems: 'center'
              }}>
                <AttachMoney fontSize="large" />
              </Box>
              <Typography color="text.secondary" variant="subtitle1" gutterBottom>
                Total Sales
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold" color="primary">
                {formatCurrency(data?.summary?.totalSales || 0)}
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
                <ShoppingBasket fontSize="large" />
              </Box>
              <Typography color="text.secondary" variant="subtitle1" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold" color="success.main">
                {data?.summary?.totalOrders || 0}
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
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
                mx: 'auto',
                alignItems: 'center'
              }}>
                <TrendingUp fontSize="large" />
              </Box>
              <Typography color="text.secondary" variant="subtitle1" gutterBottom>
                Average Order Value
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold" color="info.main">
                {formatCurrency(data?.summary?.averageOrderValue || 0)}
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
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                color: theme.palette.secondary.main,
                mx: 'auto',
                alignItems: 'center'
              }}>
                <Inventory fontSize="large" />
              </Box>
              <Typography color="text.secondary" variant="subtitle1" gutterBottom>
                Total Items Sold
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold" color="secondary.main">
                {data?.summary?.totalItemsSold || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sales Chart Section */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="sales report tabs">
            <Tab
              icon={<ShowChart />}
              label="Sales Trend"
              iconPosition="start"
              sx={{
                px: 3,
                minHeight: 48,
                textTransform: 'none',
                fontWeight: 600,
              }}
            />
            <Tab
              icon={<TableChart />}
              label="Sales Breakdown"
              iconPosition="start"
              sx={{
                px: 3,
                minHeight: 48,
                textTransform: 'none',
                fontWeight: 600,
              }}
            />
          </Tabs>
        </Box>

        {/* Sales Trend Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ height: 400 }}>
            {data?.salesByPeriod && data.salesByPeriod.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.salesByPeriod}
                  margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="period"
                    padding={{ left: 20, right: 20 }}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(value) => formatCurrency(value, false)}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    formatter={(value: any, name: string) => {
                      if (name === 'Revenue') return formatCurrency(value);
                      return value;
                    }}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Legend wrapperStyle={{ paddingTop: 15 }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="total"
                    name="Revenue"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    name="Orders"
                    stroke={theme.palette.success.main}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.info.main, 0.02),
                  borderRadius: 2
                }}
              >
                <Typography color="text.secondary">
                  No sales data available for the selected period
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Sales Breakdown Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Sales by Status
              </Typography>
              <Box sx={{ height: 350, width: '100%' }}>
                {data?.salesByStatus && data.salesByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.salesByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.salesByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.info.main, 0.02),
                      borderRadius: 2
                    }}
                  >
                    <Typography color="text.secondary">
                      No status data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Sales by Payment Method
              </Typography>
              <Box sx={{ height: 350, width: '100%' }}>
                {data?.salesByPaymentMethod && data.salesByPaymentMethod.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.salesByPaymentMethod}
                      margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickFormatter={(value) => formatCurrency(value, false)}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend wrapperStyle={{ paddingTop: 15 }} />
                      <Bar
                        dataKey="value"
                        name="Amount"
                        fill={theme.palette.info.main}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.info.main, 0.02),
                      borderRadius: 2
                    }}
                  >
                    <Typography color="text.secondary">
                      No payment method data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {/* Detailed Stats */}
      <Grid container spacing={3}>
        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <ShoppingBasket color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="600">
                Top Selling Products
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProducts.length > 0 ? (
                    topProducts.map((product, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          bgcolor: index % 2 === 0 ? alpha(theme.palette.primary.main, 0.02) : 'transparent'
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {product.name}
                        </TableCell>
                        <TableCell align="right">{product.quantitySold}</TableCell>
                        <TableCell align="right">{formatCurrency(product.totalRevenue)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography color="text.secondary" sx={{ py: 2 }}>
                          No product data available
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Top Customers */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Person color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="600">
                Top Customers
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Total Spent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topCustomers.length > 0 ? (
                    topCustomers.map((customer, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          bgcolor: index % 2 === 0 ? alpha(theme.palette.success.main, 0.02) : 'transparent'
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {customer.name || 'Anonymous Customer'}
                        </TableCell>
                        <TableCell align="right">{customer.orderCount}</TableCell>
                        <TableCell align="right">{formatCurrency(customer.totalSpent)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography color="text.secondary" sx={{ py: 2 }}>
                          No customer data available
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
