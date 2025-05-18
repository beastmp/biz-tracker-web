import { useState, useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Tabs,
  Tab,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  BarChart,
  ShowChart,
  DateRange,
  Search,
  GetApp,
  FilterList,
  PieChart,
  TrendingUp,
  Person,
  Scale,
  Straighten,
  SquareFoot,
  LocalDrink,
  Inventory,
  TrendingDown,
  Print,
  CompareArrows,
  Category,
  Domain
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart as RechartBarChart,
  Bar,
  PieChart as RechartPieChart,
  Pie,
  Cell
} from 'recharts';
import { SaleItem, TrackingType } from '@custTypes/models';
import { useSalesReport, useSalesTrend } from '@hooks/useSales';
import { formatCurrency, formatDate, formatUnit } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import StatusChip from '@components/ui/StatusChip';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Tab panel for report sections
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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ paddingTop: 20 }}
    >
      {value === index && children}
    </div>
  );
}

export default function SalesReport() {
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [shouldFetch, setShouldFetch] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareStartDate, setCompareStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 60);
    return date.toISOString().split('T')[0];
  });
  const [compareEndDate, setCompareEndDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 31);
    return date.toISOString().split('T')[0];
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('all');
  const [measurementTypeFilter, setMeasurementTypeFilter] = useState<string>('all');

  // Get report data
  const { data: reportData, isLoading, error } = useSalesReport(
    shouldFetch ? startDate : undefined,
    shouldFetch ? endDate : undefined
  );

  // We'll need to create a useSalesTrend hook in the same way as usePurchasesTrend
  const { data: trendData, isLoading: trendLoading } = useSalesTrend(
    shouldFetch ? startDate : undefined,
    shouldFetch ? endDate : undefined
  );

  // Add comparison data query
  const { data: compareData, isLoading: compareLoading } = useSalesReport(
    compareMode ? compareStartDate : undefined,
    compareMode ? compareEndDate : undefined
  );

  // Run the report on initial load
  useEffect(() => {
    setShouldFetch(true);
  }, []);

  const fetchReport = () => {
    if (!startDate || !endDate) {
      return;
    }
    setShouldFetch(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchReport();
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCustomerFilterChange = (event: SelectChangeEvent) => {
    setCustomerFilter(event.target.value);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  const handleCategoryFilterChange = (event: SelectChangeEvent) => {
    setCategoryFilter(event.target.value);
  };

  const handleItemTypeFilterChange = (event: SelectChangeEvent) => {
    setItemTypeFilter(event.target.value);
  };

  const handleMeasurementTypeFilterChange = (event: SelectChangeEvent) => {
    setMeasurementTypeFilter(event.target.value);
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
  };

  const handlePrint = () => {
    window.print();
  };

  // Get sales by status
  const getStatusStats = () => {
    if (!reportData?.sales || reportData.sales.length === 0) return [];

    const statusCounts: Record<string, number> = {};
    reportData.sales.forEach(sale => {
      const status = sale.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      percentage: (count / reportData.sales.length) * 100
    }));
  };

  // Get sales by payment method
  const getPaymentMethodStats = () => {
    if (!reportData?.sales || reportData.sales.length === 0) return [];

    const methodCounts: Record<string, number> = {};
    reportData.sales.forEach(sale => {
      const method = sale.paymentMethod;
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    return Object.entries(methodCounts).map(([method, count]) => ({
      name: method,
      value: count,
      percentage: (count / reportData.sales.length) * 100
    }));
  };

  // Get customer data
  const getCustomerData = () => {
    if (!reportData?.sales) return [];

    const customerCounts: Record<string, { count: number, total: number }> = {};
    reportData.sales.forEach(sale => {
      const customerName = sale.customerName || 'Walk-in Customer';
      if (!customerCounts[customerName]) {
        customerCounts[customerName] = { count: 0, total: 0 };
      }
      customerCounts[customerName].count++;
      customerCounts[customerName].total += sale.total;
    });

    return Object.entries(customerCounts)
      .map(([name, { count, total }]) => ({
        name,
        count,
        total,
        percentage: (count / reportData.sales.length) * 100
      }))
      .sort((a, b) => b.total - a.total);
  };

  // Get item statistics
  const getItemStats = () => {
    if (!reportData?.sales) return [];

    const itemCounts: Record<string, { count: number, total: number }> = {};

    reportData.sales.forEach(sale => {
      sale.items.forEach(item => {
        const itemName = typeof item.item === 'object' ? item.item.name : 'Unknown Item';
        if (!itemCounts[itemName]) {
          itemCounts[itemName] = { count: 0, total: 0 };
        }
        itemCounts[itemName].count++;

        // Calculate the item total based on its measurement type
        let itemTotal = 0;
        if (item.soldBy === 'quantity') {
          itemTotal = item.priceAtSale * item.quantity;
        } else if (item.soldBy === 'weight') {
          itemTotal = item.priceAtSale * item.weight;
        } else if (item.soldBy === 'length') {
          itemTotal = item.priceAtSale * item.length;
        } else if (item.soldBy === 'area') {
          itemTotal = item.priceAtSale * item.area;
        } else if (item.soldBy === 'volume') {
          itemTotal = item.priceAtSale * item.volume;
        }

        itemCounts[itemName].total += itemTotal;
      });
    });

    return Object.entries(itemCounts)
      .map(([name, { count, total }]) => ({
        name,
        count,
        total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10 items
  };

  // Get measurement type data
  const getMeasurementTypeData = () => {
    if (!reportData?.sales || reportData.sales.length === 0) return [];

    const measurementCounts: Record<string, { count: number, total: number }> = {
      'quantity': { count: 0, total: 0 },
      'weight': { count: 0, total: 0 },
      'length': { count: 0, total: 0 },
      'area': { count: 0, total: 0 },
      'volume': { count: 0, total: 0 }
    };

    reportData.sales.forEach(sale => {
      if (!sale.items) return;

      sale.items.forEach(item => {
        const soldBy = item.soldBy || 'quantity';

        if (!measurementCounts[soldBy]) {
          measurementCounts[soldBy] = { count: 0, total: 0 };
        }

        measurementCounts[soldBy].count++;

        // Calculate the item total based on its measurement type
        let itemTotal = 0;
        if (soldBy === 'quantity') {
          itemTotal = (item.priceAtSale || 0) * (item.quantity || 0);
        } else if (soldBy === 'weight') {
          itemTotal = (item.priceAtSale || 0) * (item.weight || 0);
        } else if (soldBy === 'length') {
          itemTotal = (item.priceAtSale || 0) * (item.length || 0);
        } else if (soldBy === 'area') {
          itemTotal = (item.priceAtSale || 0) * (item.area || 0);
        } else if (soldBy === 'volume') {
          itemTotal = (item.priceAtSale || 0) * (item.volume || 0);
        }

        measurementCounts[soldBy].total += itemTotal;
      });
    });

    const totalSalesValue = reportData.sales.reduce((sum, s) => sum + (s.total || 0), 0);

    return Object.entries(measurementCounts)
      .filter(([, { count }]) => count > 0)
      .map(([type, { count, total }]) => ({
        name: type,
        count,
        total,
        percentage: totalSalesValue > 0 ? (total / totalSalesValue) * 100 : 0
      }));
  };

  // Get category data
  const getCategoryData = () => {
    if (!reportData?.sales) return [];

    const categoryCounts: Record<string, { count: number, total: number }> = {};

    reportData.sales.forEach(sale => {
      sale.items.forEach(item => {
        const itemDetails = typeof item.item === 'object' ? item.item : null;
        const category = itemDetails?.category || 'Uncategorized';

        if (!categoryCounts[category]) {
          categoryCounts[category] = { count: 0, total: 0 };
        }

        categoryCounts[category].count++;

        // Calculate the item total based on its measurement type
        let itemTotal = 0;
        if (item.soldBy === 'quantity') {
          itemTotal = item.priceAtSale * item.quantity;
        } else if (item.soldBy === 'weight') {
          itemTotal = item.priceAtSale * item.weight;
        } else if (item.soldBy === 'length') {
          itemTotal = item.priceAtSale * item.length;
        } else if (item.soldBy === 'area') {
          itemTotal = item.priceAtSale * item.area;
        } else if (item.soldBy === 'volume') {
          itemTotal = item.priceAtSale * item.volume;
        }

        categoryCounts[category].total += itemTotal;
      });
    });

    return Object.entries(categoryCounts)
      .map(([category, { count, total }]) => ({
        name: category,
        count,
        total,
        percentage: total / reportData.sales.reduce((sum, s) => sum + s.total, 0) * 100
      }))
      .sort((a, b) => b.total - a.total);
  };

  // Get item type data
  const getItemTypeData = () => {
    if (!reportData?.sales) return [];

    const typeCounts: Record<string, { count: number, total: number }> = {};

    reportData.sales.forEach(sale => {
      sale.items.forEach(item => {
        const itemDetails = typeof item.item === 'object' ? item.item : null;
        const itemType = itemDetails?.itemType || 'product';

        if (!typeCounts[itemType]) {
          typeCounts[itemType] = { count: 0, total: 0 };
        }

        typeCounts[itemType].count++;

        // Calculate the item total based on its measurement type
        let itemTotal = 0;
        if (item.soldBy === 'quantity') {
          itemTotal = item.priceAtSale * item.quantity;
        } else if (item.soldBy === 'weight') {
          itemTotal = item.priceAtSale * item.weight;
        } else if (item.soldBy === 'length') {
          itemTotal = item.priceAtSale * item.length;
        } else if (item.soldBy === 'area') {
          itemTotal = item.priceAtSale * item.area;
        } else if (item.soldBy === 'volume') {
          itemTotal = item.priceAtSale * item.volume;
        }

        typeCounts[itemType].total += itemTotal;
      });
    });

    return Object.entries(typeCounts)
      .map(([type, { count, total }]) => ({
        name: type,
        count,
        total,
        percentage: total / reportData.sales.reduce((sum, s) => sum + s.total, 0) * 100
      }));
  };

  // Filter sales based on filters
  const filteredSales = useMemo(() => {
    if (!reportData?.sales) return [];

    return reportData.sales.filter(sale => {
      const customerMatch = customerFilter === 'all' ||
        (sale.customerName && sale.customerName === customerFilter);
      const statusMatch = statusFilter === 'all' ||
        sale.status === statusFilter;
      const categoryMatch = categoryFilter === 'all' || sale.items.some(item => {
        const itemDetails = typeof item.item === 'object' ? item.item : null;
        return itemDetails?.category === categoryFilter;
      });
      const itemTypeMatch = itemTypeFilter === 'all' || sale.items.some(item => {
        const itemDetails = typeof item.item === 'object' ? item.item : null;
        return itemDetails?.itemType === itemTypeFilter;
      });
      const measurementTypeMatch = measurementTypeFilter === 'all' || sale.items.some(item => {
        return item.soldBy === measurementTypeFilter;
      });

      return customerMatch && statusMatch && categoryMatch && itemTypeMatch && measurementTypeMatch;
    });
  }, [reportData, customerFilter, statusFilter, categoryFilter, itemTypeFilter, measurementTypeFilter]);

  // Get all customer names for the filter
  const customerNames = useMemo(() => {
    if (!reportData?.sales) return [];

    const customers = new Set<string>();
    reportData.sales.forEach(sale => {
      if (sale.customerName) {
        customers.add(sale.customerName);
      }
    });

    return Array.from(customers).sort();
  }, [reportData]);

  // Get all categories for filtering
  const categoryNames = useMemo(() => {
    if (!reportData?.sales) return [];

    const categories = new Set<string>();
    reportData.sales.forEach(sale => {
      sale.items.forEach(item => {
        const itemDetails = typeof item.item === 'object' ? item.item : null;
        if (itemDetails?.category) {
          categories.add(itemDetails.category);
        }
      });
    });

    return Array.from(categories).sort();
  }, [reportData]);

  // Get measurement icon based on type
  const getMeasurementIcon = (trackingType: string) => {
    switch (trackingType) {
      case 'quantity': return <Inventory fontSize="small" />;
      case 'weight': return <Scale fontSize="small" />;
      case 'length': return <Straighten fontSize="small" />;
      case 'area': return <SquareFoot fontSize="small" />;
      case 'volume': return <LocalDrink fontSize="small" />;
      default: return <Inventory fontSize="small" />;
    }
  };

  // Format measurement value with unit
  const formatMeasurement = (item: SaleItem) => {
    if (!item) return '';

    const unit = (type: TrackingType, unitValue: string | undefined) => {
      return formatUnit(unitValue || '') || {
        weight: 'lb',
        length: 'in',
        area: 'sqft',
        volume: 'l',
        quantity: 'units'
      }[type] || '';
    };

    switch (item.soldBy) {
      case 'weight':
        return `${item.weight} ${unit('weight', item.weightUnit)}`;
      case 'length':
        return `${item.length} ${unit('length', item.lengthUnit)}`;
      case 'area':
        return `${item.area} ${unit('area', item.areaUnit)}`;
      case 'volume':
        return `${item.volume} ${unit('volume', item.volumeUnit)}`;
      default: // quantity
        return `${item.quantity} units`;
    }
  };

  // Calculate comparison metrics
  const comparisonMetrics = useMemo(() => {
    if (!compareMode || !reportData || !compareData) {
      return null;
    }

    const currentTotal = reportData.totalRevenue || 0;
    const previousTotal = compareData.totalRevenue || 0;
    const totalDiff = currentTotal - previousTotal;
    const totalPercentChange = previousTotal > 0 ? (totalDiff / previousTotal) * 100 : 0;

    const currentCount = reportData.totalSales || 0;
    const previousCount = compareData.totalSales || 0;
    const countDiff = currentCount - previousCount;
    const countPercentChange = previousCount > 0 ? (countDiff / previousCount) * 100 : 0;

    const currentAvg = reportData.averageOrderValue || 0;
    const previousAvg = compareData.averageOrderValue || 0;
    const avgDiff = currentAvg - previousAvg;
    const avgPercentChange = previousAvg > 0 ? (avgDiff / previousAvg) * 100 : 0;

    return {
      totalDiff,
      totalPercentChange,
      countDiff,
      countPercentChange,
      avgDiff,
      avgPercentChange
    };
  }, [compareMode, reportData, compareData]);

  // Export report to CSV
  const exportReportCSV = () => {
    if (!reportData) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Customer,Items,Total,Status,Payment Method\n";

    filteredSales.forEach(sale => {
      csvContent += `${sale.createdAt ? formatDate(sale.createdAt) : ''},`;
      csvContent += `"${sale.customerName || 'Walk-in Customer'}",`;
      csvContent += `${sale.items.length},`;
      csvContent += `${sale.total},`;
      csvContent += `${sale.status},`;
      csvContent += `${sale.paymentMethod}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || trendLoading || (compareMode && compareLoading)) {
    return <LoadingScreen />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Sales Reports
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          component={RouterLink}
          to="/sales"
        >
          Back to Sales
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center" component="form" onSubmit={handleSubmit}>
          <Grid size={{ xs: 12, sm: compareMode ? 3 : 4 }}>
            <TextField
              fullWidth
              label={compareMode ? "Current Period Start" : "Start Date"}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: compareMode ? 3 : 4 }}>
            <TextField
              fullWidth
              label={compareMode ? "Current Period End" : "End Date"}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          {compareMode && (
            <>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  label="Previous Period Start"
                  type="date"
                  value={compareStartDate}
                  onChange={(e) => setCompareStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  label="Previous Period End"
                  type="date"
                  value={compareEndDate}
                  onChange={(e) => setCompareEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}
          <Grid size={{ xs: 12, sm: compareMode ? 12 : 4 }} sx={{ display: 'flex', mt: compareMode ? 2 : 0, gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<Search />}
              onClick={fetchReport}
              type="submit"
              disabled={!startDate || !endDate || (compareMode && (!compareStartDate || !compareEndDate))}
            >
              Generate Report
            </Button>
            <Tooltip title="Toggle Comparison Mode">
              <Button
                variant="outlined"
                color={compareMode ? "primary" : "inherit"}
                onClick={toggleCompareMode}
              >
                <CompareArrows />
              </Button>
            </Tooltip>
            <Tooltip title="Print Report">
              <Button
                variant="outlined"
                onClick={handlePrint}
              >
                <Print />
              </Button>
            </Tooltip>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Error loading report data. Please try again.
          </Alert>
        )}
      </Paper>

      {reportData && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography color="text.secondary" gutterBottom>
                      Total Sales
                    </Typography>
                    <BarChart color="primary" />
                  </Box>
                  <Typography variant="h3" component="div">
                    {reportData.totalSales}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`From ${formatDate(startDate)} to ${formatDate(endDate)}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography color="text.secondary" gutterBottom>
                      Total Revenue
                    </Typography>
                    <ShowChart color="success" />
                  </Box>
                  <Typography variant="h3" component="div">
                    {formatCurrency(reportData.totalRevenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`From ${formatDate(startDate)} to ${formatDate(endDate)}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography color="text.secondary" gutterBottom>
                      Average Order Value
                    </Typography>
                    <DateRange color="info" />
                  </Box>
                  <Typography variant="h3" component="div">
                    {formatCurrency(reportData.averageOrderValue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`From ${formatDate(startDate)} to ${formatDate(endDate)}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {compareMode && comparisonMetrics && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Period Comparison
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography color="text.secondary" gutterBottom>
                          Sales Count Change
                        </Typography>
                        {comparisonMetrics.countPercentChange >= 0 ? (
                          <TrendingUp color="success" />
                        ) : (
                          <TrendingDown color="error" />
                        )}
                      </Box>
                      <Typography variant="h4" component="div">
                        {comparisonMetrics.countDiff > 0 ? '+' : ''}{comparisonMetrics.countDiff}
                      </Typography>
                      <Typography variant="body2" color={comparisonMetrics.countPercentChange >= 0 ? "success.main" : "error.main"}>
                        {comparisonMetrics.countPercentChange > 0 ? '+' : ''}
                        {comparisonMetrics.countPercentChange.toFixed(1)}% from previous period
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography color="text.secondary" gutterBottom>
                          Revenue Change
                        </Typography>
                        {comparisonMetrics.totalPercentChange >= 0 ? (
                          <TrendingUp color="success" />
                        ) : (
                          <TrendingDown color="error" />
                        )}
                      </Box>
                      <Typography variant="h4" component="div">
                        {formatCurrency(comparisonMetrics.totalDiff)}
                      </Typography>
                      <Typography variant="body2" color={comparisonMetrics.totalPercentChange >= 0 ? "success.main" : "error.main"}>
                        {comparisonMetrics.totalPercentChange > 0 ? '+' : ''}
                        {comparisonMetrics.totalPercentChange.toFixed(1)}% from previous period
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography color="text.secondary" gutterBottom>
                          Average Order Change
                        </Typography>
                        {comparisonMetrics.avgPercentChange >= 0 ? (
                          <TrendingUp color="success" />
                        ) : (
                          <TrendingDown color="error" />
                        )}
                      </Box>
                      <Typography variant="h4" component="div">
                        {formatCurrency(comparisonMetrics.avgDiff)}
                      </Typography>
                      <Typography variant="body2" color={comparisonMetrics.avgPercentChange >= 0 ? "success.main" : "error.main"}>
                        {comparisonMetrics.avgPercentChange > 0 ? '+' : ''}
                        {comparisonMetrics.avgPercentChange.toFixed(1)}% from previous period
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Report Tabs */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
                <Tab label="Summary" />
                <Tab label="Trends" />
                <Tab label="Customers" />
                <Tab label="Items" />
                <Tab label="Categories" />
                <Tab label="Measurement Types" />
              </Tabs>

              <Box>
                <Tooltip title="Export to CSV">
                  <IconButton onClick={exportReportCSV}>
                    <GetApp />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Divider />

            {/* Summary Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Sales by Status
                      </Typography>
                      <PieChart color="primary" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartPieChart>
                          <Pie
                            data={getStatusStats()}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                          >
                            {getStatusStats().map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </RechartPieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Sales by Payment Method
                      </Typography>
                      <PieChart color="primary" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartPieChart>
                          <Pie
                            data={getPaymentMethodStats()}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#82ca9d"
                            label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                          >
                            {getPaymentMethodStats().map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </RechartPieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Trends Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Sales Trends
                      </Typography>
                      <TrendingUp color="primary" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Line type="monotone" dataKey="totalSales" stroke="#8884d8" />
                          <Line type="monotone" dataKey="totalRevenue" stroke="#82ca9d" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Sales Value Trends
                      </Typography>
                      <TrendingUp color="primary" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartBarChart data={trendData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="totalSales" fill="#8884d8" />
                          <Bar dataKey="totalRevenue" fill="#82ca9d" />
                        </RechartBarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Customers Tab */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Sales by Customer
                      </Typography>
                      <Person color="primary" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartPieChart>
                          <Pie
                            data={getCustomerData()}
                            dataKey="total"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                          >
                            {getCustomerData().map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </RechartPieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Customer Filter
                      </Typography>
                      <FilterList color="primary" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <FormControl fullWidth>
                      <InputLabel>Customer</InputLabel>
                      <Select
                        value={customerFilter}
                        onChange={handleCustomerFilterChange}
                        label="Customer"
                      >
                        <MenuItem value="all">All Customers</MenuItem>
                        {customerNames.map((name) => (
                          <MenuItem key={name} value={name}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Items Tab */}
            <TabPanel value={tabValue} index={3}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Top 10 Items
                      </Typography>
                      <PieChart color="primary" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartPieChart>
                          <Pie
                            data={getItemStats()}
                            dataKey="total"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            label={({ name, total }) => `${name} (${formatCurrency(total)})`}
                          >
                            {getItemStats().map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </RechartPieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Status Filter
                      </Typography>
                      <FilterList color="primary" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        label="Status"
                      >
                        <MenuItem value="all">All Statuses</MenuItem>
                        {['completed', 'refunded', 'partially_refunded'].map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Categories Tab */}
            <TabPanel value={tabValue} index={4}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Sales by Category
                      </Typography>
                      <Category color="primary" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartPieChart>
                          <Pie
                            data={getCategoryData()}
                            dataKey="total"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                          >
                            {getCategoryData().map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </RechartPieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Category Filter
                      </Typography>
                      <FilterList color="primary" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={categoryFilter}
                        onChange={handleCategoryFilterChange}
                        label="Category"
                      >
                        <MenuItem value="all">All Categories</MenuItem>
                        {categoryNames.map((name) => (
                          <MenuItem key={name} value={name}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Sales by Item Type
                      </Typography>
                      <Domain color="primary" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartPieChart>
                          <Pie
                            data={getItemTypeData()}
                            dataKey="total"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#82ca9d"
                            label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                          >
                            {getItemTypeData().map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </RechartPieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Item Type Filter
                      </Typography>
                      <FilterList color="primary" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <FormControl fullWidth>
                      <InputLabel>Item Type</InputLabel>
                      <Select
                        value={itemTypeFilter}
                        onChange={handleItemTypeFilterChange}
                        label="Item Type"
                      >
                        <MenuItem value="all">All Types</MenuItem>
                        {['material', 'product', 'both'].map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Measurement Types Tab */}
            <TabPanel value={tabValue} index={5}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Sales by Measurement Type
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Scale fontSize="small" />
                        <Straighten fontSize="small" />
                        <Inventory fontSize="small" />
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartPieChart>
                          <Pie
                            data={getMeasurementTypeData()}
                            dataKey="total"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                          >
                            {getMeasurementTypeData().map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </RechartPieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Measurement Type Filter
                      </Typography>
                      <FilterList color="primary" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <FormControl fullWidth>
                      <InputLabel>Measurement Type</InputLabel>
                      <Select
                        value={measurementTypeFilter}
                        onChange={handleMeasurementTypeFilterChange}
                        label="Measurement Type"
                      >
                        <MenuItem value="all">All Types</MenuItem>
                        <MenuItem value="quantity">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Inventory fontSize="small" />
                            <span>Quantity</span>
                          </Box>
                        </MenuItem>
                        <MenuItem value="weight">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Scale fontSize="small" />
                            <span>Weight</span>
                          </Box>
                        </MenuItem>
                        <MenuItem value="length">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Straighten fontSize="small" />
                            <span>Length</span>
                          </Box>
                        </MenuItem>
                        <MenuItem value="area">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SquareFoot fontSize="small" />
                            <span>Area</span>
                          </Box>
                        </MenuItem>
                        <MenuItem value="volume">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocalDrink fontSize="small" />
                            <span>Volume</span>
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Items by Measurement Type
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Item Name</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Measurement Type</TableCell>
                            <TableCell>Measurement</TableCell>
                            <TableCell align="right">Unit Price</TableCell>
                            <TableCell align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredSales.flatMap(sale =>
                            sale.items.map((item, idx) => {
                              const itemDetails = typeof item.item === 'object' ? item.item : null;
                              const soldBy = item.soldBy || 'quantity';
                              const itemName = itemDetails?.name || 'Unknown Item';
                              const category = itemDetails?.category || 'Uncategorized';

                              // Calculate the item total based on its measurement type
                              let itemTotal = 0;
                              if (soldBy === 'quantity') {
                                itemTotal = item.priceAtSale * item.quantity;
                              } else if (soldBy === 'weight') {
                                itemTotal = item.priceAtSale * item.weight;
                              } else if (soldBy === 'length') {
                                itemTotal = item.priceAtSale * item.length;
                              } else if (soldBy === 'area') {
                                itemTotal = item.priceAtSale * item.area;
                              } else if (soldBy === 'volume') {
                                itemTotal = item.priceAtSale * item.volume;
                              }

                              return (
                                <TableRow key={`${sale.id}-${idx}`}>
                                  <TableCell>{itemName}</TableCell>
                                  <TableCell>{category}</TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      {getMeasurementIcon(soldBy)}
                                      <span>{soldBy}</span>
                                    </Box>
                                  </TableCell>
                                  <TableCell>{formatMeasurement(item)}</TableCell>
                                  <TableCell align="right">{formatCurrency(item.priceAtSale)}</TableCell>
                                  <TableCell align="right">{formatCurrency(itemTotal)}</TableCell>
                                </TableRow>
                              );
                            })
                          )}
                          {filteredSales.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} align="center">No items found with the selected filters.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Recent Sales</Typography>
            <Divider sx={{ mb: 2 }} />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSales.slice(0, 10).map((sale) => (
                    <TableRow
                      key={sale.id}
                      hover
                      onClick={() => window.location.href = `/sales/${sale.id}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <TableCell>{sale.createdAt && formatDate(sale.createdAt)}</TableCell>
                      <TableCell>{sale.customerName || 'Walk-in Customer'}</TableCell>
                      <TableCell>
                        {sale.items?.length > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                            {sale.items.some(i => i.soldBy === 'quantity') && (
                              <Tooltip title="Contains quantity items">
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Inventory fontSize="small" color="action" />
                                </Box>
                              </Tooltip>
                            )}
                            {sale.items.some(i => i.soldBy === 'weight') && (
                              <Tooltip title="Contains weight items">
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Scale fontSize="small" color="action" />
                                </Box>
                              </Tooltip>
                            )}
                            {sale.items.some(i => i.soldBy === 'length') && (
                              <Tooltip title="Contains length items">
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Straighten fontSize="small" color="action" />
                                </Box>
                              </Tooltip>
                            )}
                            {sale.items.some(i => i.soldBy === 'area') && (
                              <Tooltip title="Contains area items">
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <SquareFoot fontSize="small" color="action" />
                                </Box>
                              </Tooltip>
                            )}
                            {sale.items.some(i => i.soldBy === 'volume') && (
                              <Tooltip title="Contains volume items">
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <LocalDrink fontSize="small" color="action" />
                                </Box>
                              </Tooltip>
                            )}
                            <span>{sale.items?.length || 0}</span>
                          </Box>
                        ) : (
                          '0'
                        )}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(sale.total)}</TableCell>
                      <TableCell><StatusChip status={sale.status} /></TableCell>
                      <TableCell>{sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredSales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No sales found in the selected date range.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
}
