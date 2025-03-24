/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  BarChart,
  ShowChart,
  DateRange,
  Search,
  PieChart
} from '@mui/icons-material';
import { salesApi, Sale } from '../../services/api';

interface ReportData {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  sales: Sale[];
  topProductsByQuantity: [string, number][];
  topProductsByWeight: [string, { weight: number, unit: string }][];
}

export default function SalesReport() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Get sales by payment method
  const getPaymentMethodStats = () => {
    if (!reportData?.sales) return [];

    const methodCounts: Record<string, number> = {};
    reportData.sales.forEach(sale => {
      const method = sale.paymentMethod;
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    return Object.entries(methodCounts).map(([method, count]) => ({
      method,
      count,
      percentage: (count / reportData.sales.length) * 100
    }));
  };

  // Get sales by status
  const getStatusStats = () => {
    if (!reportData?.sales) return [];

    const statusCounts: Record<string, number> = {};
    reportData.sales.forEach(sale => {
      const status = sale.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / reportData.sales.length) * 100
    }));
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await salesApi.getReport(startDate, endDate);
      const analysis = analyzeSales(data.sales);
      setReportData({ ...data, ...analysis });
    } catch (error) {
      console.error('Failed to fetch sales report:', error);
      setError('Failed to load sales report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
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

  // Updated analysis function to handle weight-based items
  const analyzeSales = (sales: Sale[]) => {
    let totalRevenue = 0;
    const salesByDate: Record<string, number> = {};
    const revenueByDate: Record<string, number> = {};
    const itemsSoldByQuantity: Record<string, number> = {};
    const itemsSoldByWeight: Record<string, { weight: number, unit: string }> = {};
    const revenueByCategory: Record<string, number> = {};

    sales.forEach(sale => {
      totalRevenue += sale.total;
      const date = new Date(sale.createdAt!).toLocaleDateString();
      salesByDate[date] = (salesByDate[date] || 0) + 1;
      revenueByDate[date] = (revenueByDate[date] || 0) + sale.total;

      sale.items.forEach(saleItem => {
        const item = typeof saleItem.item === 'object' ? saleItem.item : null;
        if (!item) return;

        const category = item.category || 'Uncategorized';
        revenueByCategory[category] = (revenueByCategory[category] || 0) + saleItem.priceAtSale * saleItem.quantity;

        if (item.trackingType === 'quantity') {
          itemsSoldByQuantity[item.name] = (itemsSoldByQuantity[item.name] || 0) + saleItem.quantity;
        } else {
          if (!itemsSoldByWeight[item.name]) {
            itemsSoldByWeight[item.name] = { weight: 0, unit: item.weightUnit };
          }
          itemsSoldByWeight[item.name].weight += saleItem.weight || 0;
        }
      });
    });

    const topProductsByQuantity = Object.entries(itemsSoldByQuantity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topProductsByWeight = Object.entries(itemsSoldByWeight)
      .sort((a, b) => b[1].weight - a[1].weight)
      .slice(0, 5);

    return {
      totalRevenue,
      totalSales: sales.length,
      salesByDate,
      revenueByDate,
      revenueByCategory,
      topProductsByQuantity,
      topProductsByWeight,
    };
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Sales Reports
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<Search />}
              onClick={fetchReport}
              disabled={loading || !startDate || !endDate}
            >
              {loading ? <CircularProgress size={24} /> : 'Generate Report'}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {reportData && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
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

            <Grid item xs={12} sm={4}>
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

            <Grid item xs={12} sm={4}>
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

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Sales by Payment Method
                  </Typography>
                  <PieChart color="primary" />
                </Box>
                <Divider sx={{ mb: 2 }} />

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Payment Method</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getPaymentMethodStats().map((stat) => (
                        <TableRow key={stat.method}>
                          <TableCell>
                            {stat.method.charAt(0).toUpperCase() + stat.method.slice(1)}
                          </TableCell>
                          <TableCell align="right">{stat.count}</TableCell>
                          <TableCell align="right">{stat.percentage.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Sales by Status
                  </Typography>
                  <PieChart color="primary" />
                </Box>
                <Divider sx={{ mb: 2 }} />

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getStatusStats().map((stat) => (
                        <TableRow key={stat.status}>
                          <TableCell>
                            <Chip
                              label={stat.status.replace('_', ' ')}
                              color={getStatusColor(stat.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{stat.count}</TableCell>
                          <TableCell align="right">{stat.percentage.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Products by Quantity
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <List>
                  {reportData?.topProductsByQuantity.map(([name, quantity], index) => (
                    <ListItem key={index} divider={index < reportData.topProductsByQuantity.length - 1}>
                      <ListItemText
                        primary={name}
                        secondary={`${quantity} units sold`}
                      />
                    </ListItem>
                  ))}
                  {(!reportData?.topProductsByQuantity.length) && (
                    <ListItem>
                      <ListItemText primary="No data available" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Products by Weight
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <List>
                  {reportData?.topProductsByWeight.map(([name, data], index) => (
                    <ListItem key={index} divider={index < reportData.topProductsByWeight.length - 1}>
                      <ListItemText
                        primary={name}
                        secondary={`${data.weight.toFixed(2)} ${data.unit} sold`}
                      />
                    </ListItem>
                  ))}
                  {(!reportData?.topProductsByWeight.length) && (
                    <ListItem>
                      <ListItemText primary="No data available" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Sales
            </Typography>
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
                  {reportData.sales.slice(0, 10).map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell>
                        {sale.createdAt && formatDate(sale.createdAt)}
                      </TableCell>
                      <TableCell>
                        {sale.customerName || 'Guest Customer'}
                      </TableCell>
                      <TableCell>{sale.items.length} item(s)</TableCell>
                      <TableCell align="right">{formatCurrency(sale.total)}</TableCell>
                      <TableCell>
                        <Chip
                          label={sale.status.replace('_', ' ')}
                          color={getStatusColor(sale.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {reportData.sales.length === 0 && (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                No sales found in the selected date range.
              </Typography>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}