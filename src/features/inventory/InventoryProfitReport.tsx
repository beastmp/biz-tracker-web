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
  alpha,
  SelectChangeEvent,
  Chip,
  ButtonGroup,
  Tab,
  Tabs
} from '@mui/material';
import {
  Print as PrintIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp,
  AttachMoney,
  Inventory as InventoryIcon,
  ShowChart,
  Filter as FilterIcon,
  MonetizationOn,
  Savings,
  FilterAlt,
  CheckCircle,
  TrendingDown,
  VisibilityOutlined,
  Category,
  ArrowForward
} from '@mui/icons-material';
import { useInventoryProfitReport } from '@hooks/useReports';
import { formatCurrency, formatDate, formatPercentage } from '@utils/formatters';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import { Link as RouterLink } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function InventoryProfitReport() {
  const theme = useTheme();
  const [period, setPeriod] = useState('month');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [profitThreshold, setProfitThreshold] = useState(0);
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [chartType, setChartType] = useState<'margin' | 'revenue' | 'profit'>('profit');
  const [tabValue, setTabValue] = useState(0);

  const { data, isLoading, error, refetch } = useInventoryProfitReport({
    startDate,
    endDate,
    period,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    profitThreshold
  });

  const handlePeriodChange = (event: SelectChangeEvent) => {
    setPeriod(event.target.value);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExport = () => {
    if (!data || !data.items) return;

    // Create CSV content
    const headers = ['Item', 'SKU', 'Category', 'Units Sold', 'Revenue', 'Cost', 'Profit', 'Margin (%)'];
    const rows = data.items.map(item => [
      item.name,
      item.sku,
      item.category || 'Uncategorized',
      item.unitsSold,
      item.revenue.toFixed(2),
      item.cost.toFixed(2),
      item.profit.toFixed(2),
      (item.margin * 100).toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download as file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `profit-report-${formatDate(new Date())}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate top profitable and unprofitable items
  const topProfitableItems = useMemo(() => {
    if (!data?.items) return [];
    return [...data.items]
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);
  }, [data?.items]);

  const topUnprofitableItems = useMemo(() => {
    if (!data?.items) return [];
    return [...data.items]
      .sort((a, b) => a.profit - b.profit)
      .filter(item => item.profit < 0)
      .slice(0, 10);
  }, [data?.items]);

  // Prepare data for charts
  const profitByCategory = useMemo(() => {
    if (!data?.profitByCategory) return [];
    return Object.entries(data.profitByCategory)
      .map(([category, values]) => ({
        name: category || 'Uncategorized',
        profit: values.profit,
        revenue: values.revenue,
        cost: values.cost,
        margin: values.margin * 100
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [data?.profitByCategory]);

  const chartData = useMemo(() => {
    if (!data?.profitByTime) return [];
    return data.profitByTime.map(item => ({
      name: item.period,
      profit: item.profit,
      revenue: item.revenue,
      cost: item.cost,
      margin: (item.profit / item.revenue) * 100
    }));
  }, [data?.profitByTime]);

  // Available categories for filter
  const categories = useMemo(() => {
    if (!data?.categories) return [];
    return data.categories;
  }, [data?.categories]);

  if (isLoading) {
    return <LoadingScreen message="Generating profit report..." />;
  }

  if (error) {
    return <ErrorFallback error={error as Error} message="Failed to generate profit report" />;
  }

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Inventory Profit Report
        </Typography>
        <Typography color="text.secondary" variant="subtitle1">
          Analyze your product profitability and margins
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
        {/* Date Range */}
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ minWidth: 150 }}
        />

        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ minWidth: 150 }}
        />

        {/* Period Grouping */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
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

        {/* Category Filter */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            label="Category"
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map(category => (
              <MenuItem key={category} value={category}>{category || 'Uncategorized'}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Profit Threshold */}
        <TextField
          label="Min Profit"
          type="number"
          value={profitThreshold}
          onChange={(e) => setProfitThreshold(Number(e.target.value))}
          size="small"
          InputProps={{
            startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
          }}
          sx={{ width: 120 }}
        />

        <Stack
          direction="row"
          spacing={1}
          sx={{
            ml: { xs: 0, md: 'auto' },
            mt: { xs: 1, md: 0 }
          }}
        >
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => refetch()} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export to CSV">
            <IconButton onClick={handleExport} color="primary">
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
                Total Revenue
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold" color="primary">
                {formatCurrency(data?.summary?.totalRevenue || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                From {data?.summary?.totalUnitsSold || 0} units sold
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
                <MonetizationOn fontSize="large" />
              </Box>
              <Typography color="text.secondary" variant="subtitle1" gutterBottom>
                Total Cost
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold" color="warning.main">
                {formatCurrency(data?.summary?.totalCost || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Across {data?.items?.length || 0} products
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
                <Savings fontSize="large" />
              </Box>
              <Typography color="text.secondary" variant="subtitle1" gutterBottom>
                Total Profit
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold" color="success.main">
                {formatCurrency(data?.summary?.totalProfit || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {data?.summary?.profitableItems || 0} profitable items
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
                Average Margin
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold" color="info.main">
                {formatPercentage(data?.summary?.averageMargin || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {data?.summary?.unprofitableItems || 0} unprofitable items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chart Section */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ShowChart color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              {chartType === 'profit' ? 'Profit Trends' :
               chartType === 'revenue' ? 'Revenue Trends' : 'Margin Analysis'}
            </Typography>
          </Box>

          <ButtonGroup variant="outlined" size="small">
            <Button
              onClick={() => setChartType('profit')}
              variant={chartType === 'profit' ? 'contained' : 'outlined'}
            >
              Profit
            </Button>
            <Button
              onClick={() => setChartType('revenue')}
              variant={chartType === 'revenue' ? 'contained' : 'outlined'}
            >
              Revenue
            </Button>
            <Button
              onClick={() => setChartType('margin')}
              variant={chartType === 'margin' ? 'contained' : 'outlined'}
            >
              Margin
            </Button>
          </ButtonGroup>
        </Box>

        <Box sx={{ height: 400 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'margin' ? (
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    padding={{ left: 20, right: 20 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    formatter={(value: any) => [`${value.toFixed(2)}%`, 'Margin']}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Legend wrapperStyle={{ paddingTop: 15 }} />
                  <Line
                    type="monotone"
                    dataKey="margin"
                    name="Profit Margin"
                    stroke={theme.palette.info.main}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    padding={{ left: 20, right: 20 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(value) => formatCurrency(value, false)}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    formatter={(value: any) => [formatCurrency(value), chartType === 'profit' ? 'Profit' : chartType === 'revenue' ? 'Revenue' : 'Cost']}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Legend wrapperStyle={{ paddingTop: 15 }} />
                  <Bar
                    dataKey={chartType === 'profit' ? 'profit' : 'revenue'}
                    name={chartType === 'profit' ? 'Profit' : 'Revenue'}
                    fill={chartType === 'profit' ? theme.palette.success.main : theme.palette.primary.main}
                    radius={[4, 4, 0, 0]}
                  />
                  {chartType === 'profit' && (
                    <Bar dataKey="cost" name="Cost" fill={theme.palette.warning.main} radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              )}
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
                No data available for the selected period
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Category Profitability */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Category color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={600}>
            Category Profitability
          </Typography>
        </Box>

        <Box sx={{ height: 400 }}>
          {profitByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={profitByCategory}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatCurrency(value, false)}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'Profit') return formatCurrency(value);
                    if (name === 'Margin') return `${value.toFixed(1)}%`;
                    return formatCurrency(value);
                  }}
                />
                <Legend />
                <Bar dataKey="profit" name="Profit" fill={theme.palette.success.main} radius={[0, 4, 4, 0]} />
                <Bar dataKey="revenue" name="Revenue" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} />
                <Bar dataKey="cost" name="Cost" fill={theme.palette.warning.main} radius={[0, 4, 4, 0]} />
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
                No category data available for the selected period
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Top Profitable and Unprofitable Items */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="profit tabs">
            <Tab
              label="Top Profitable Items"
              icon={<TrendingUp color="success" />}
              iconPosition="start"
              sx={{ fontWeight: 600, textTransform: 'none' }}
            />
            <Tab
              label="Unprofitable Items"
              icon={<TrendingDown color="error" />}
              iconPosition="start"
              sx={{ fontWeight: 600, textTransform: 'none' }}
            />
          </Tabs>
        </Box>

        {/* Top Profitable Items Tab */}
        <Box
          role="tabpanel"
          hidden={tabValue !== 0}
          id="tabpanel-top-profitable"
          aria-labelledby="tab-top-profitable"
        >
          {tabValue === 0 && (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Units Sold</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell align="right">Profit</TableCell>
                    <TableCell align="right">Margin</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProfitableItems.length > 0 ? (
                    topProfitableItems.map((item, index) => (
                      <TableRow
                        key={item.itemId}
                        sx={{
                          '&:nth-of-type(odd)': { bgcolor: alpha(theme.palette.success.main, 0.01) },
                          '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.03) },
                        }}
                      >
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.category || 'Uncategorized'}</TableCell>
                        <TableCell align="right">{item.unitsSold}</TableCell>
                        <TableCell align="right">{formatCurrency(item.revenue)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.cost)}</TableCell>
                        <TableCell align="right">
                          <Typography
                            color="success.main"
                            fontWeight="bold"
                          >
                            {formatCurrency(item.profit)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${(item.margin * 100).toFixed(1)}%`}
                            color="success"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            component={RouterLink}
                            to={`/inventory/${item.itemId}`}
                            size="small"
                          >
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">
                          No profitable items found in the selected period
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Unprofitable Items Tab */}
        <Box
          role="tabpanel"
          hidden={tabValue !== 1}
          id="tabpanel-unprofitable"
          aria-labelledby="tab-unprofitable"
        >
          {tabValue === 1 && (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Units Sold</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell align="right">Loss</TableCell>
                    <TableCell align="right">Margin</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topUnprofitableItems.length > 0 ? (
                    topUnprofitableItems.map((item, index) => (
                      <TableRow
                        key={item.itemId}
                        sx={{
                          '&:nth-of-type(odd)': { bgcolor: alpha(theme.palette.error.main, 0.01) },
                          '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.03) },
                        }}
                      >
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.category || 'Uncategorized'}</TableCell>
                        <TableCell align="right">{item.unitsSold}</TableCell>
                        <TableCell align="right">{formatCurrency(item.revenue)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.cost)}</TableCell>
                        <TableCell align="right">
                          <Typography
                            color="error.main"
                            fontWeight="bold"
                          >
                            {formatCurrency(item.profit)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${(item.margin * 100).toFixed(1)}%`}
                            color="error"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            component={RouterLink}
                            to={`/inventory/${item.itemId}`}
                            size="small"
                          >
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                        <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <CheckCircle color="success" fontSize="large" />
                          <Typography color="success.main" variant="h6">
                            No unprofitable items found
                          </Typography>
                          <Typography color="text.secondary">
                            All your items are generating profits during this period
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* Recommendations Section */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TrendingUp color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={600}>
            Recommendations
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {/* For profitable items */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.03), height: '100%' }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                Increase Profitability
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" paragraph>
                Based on your top performing products:
              </Typography>
              <ul style={{ paddingLeft: '20px' }}>
                <li>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Consider increasing stock levels for your top {topProfitableItems.slice(0, 3).map(p => `"${p.name}"`).join(', ')} products
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Review pricing strategy for items with highest margins for potential market adjustments
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Look for common characteristics among top performers to enhance similar products
                  </Typography>
                </li>
              </ul>
              <Button
                variant="outlined"
                color="success"
                endIcon={<ArrowForward />}
                component={RouterLink}
                to="/inventory"
                sx={{ mt: 2 }}
              >
                Manage Inventory
              </Button>
            </Card>
          </Grid>

          {/* For unprofitable items */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.03), height: '100%' }}>
              <Typography variant="h6" color="error.main" gutterBottom>
                Reduce Losses
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" paragraph>
                For items with negative profit margins:
              </Typography>
              <ul style={{ paddingLeft: '20px' }}>
                {topUnprofitableItems.length > 0 ? (
                  <>
                    <li>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Consider price adjustments for {topUnprofitableItems.slice(0, 2).map(p => `"${p.name}"`).join(', ')}
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Identify cost reduction opportunities in your supply chain or manufacturing process
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Review any underperforming products for potential discontinuation
                      </Typography>
                    </li>
                  </>
                ) : (
                  <li>
                    <Typography variant="body2">
                      Great job! All your products are currently profitable. Continue monitoring for any changes.
                    </Typography>
                  </li>
                )}
              </ul>
              <Button
                variant="outlined"
                color="error"
                endIcon={<ArrowForward />}
                component={RouterLink}
                to="/inventory/pricing"
                sx={{ mt: 2 }}
              >
                Review Pricing
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}