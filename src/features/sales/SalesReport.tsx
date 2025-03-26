import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid2,
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
  List,
  ListItem,
  ListItemText,
  Alert
} from '@mui/material';
import {
  BarChart,
  ShowChart,
  DateRange,
  Search,
  PieChart
} from '@mui/icons-material';
import { useSalesReport } from '@hooks/useSales';
import { formatCurrency, formatDate } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import StatusChip from '@components/ui/StatusChip';

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
  const { data: reportData, isLoading, error } = useSalesReport(
    shouldFetch ? startDate : undefined,
    shouldFetch ? endDate : undefined
  );

  // Run the report on initial load
  useEffect(() => {
    setShouldFetch(true);
  }, []);

  // Get sales by payment method
  const getPaymentMethodStats = () => {
    if (!reportData?.sales || reportData.sales.length === 0) return [];

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
    if (!reportData?.sales || reportData.sales.length === 0) return [];

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

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Sales Reports
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid2 container spacing={3} alignItems="center" component="form" onSubmit={handleSubmit}>
          <Grid2 size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 4 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<Search />}
              onClick={fetchReport}
              type="submit"
              disabled={!startDate || !endDate}
            >
              Generate Report
            </Button>
          </Grid2>
        </Grid2>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Error loading report data. Please try again.
          </Alert>
        )}
      </Paper>

      {reportData && (
        <>
          <Grid2 container spacing={3} sx={{ mb: 4 }}>
            <Grid2 size={{ xs: 12, sm: 4 }}>
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
            </Grid2>

            <Grid2 size={{ xs: 12, sm: 4 }}>
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
            </Grid2>

            <Grid2 size={{ xs: 12, sm: 4 }}>
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
            </Grid2>
          </Grid2>

          <Grid2 container spacing={3} sx={{ mb: 4 }}>
            <Grid2 size={{ xs: 12, md: 6 }}>
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
                      {getPaymentMethodStats().length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid2>

            <Grid2 size={{ xs: 12, md: 6 }}>
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
                            <StatusChip status={stat.status} />
                          </TableCell>
                          <TableCell align="right">{stat.count}</TableCell>
                          <TableCell align="right">{stat.percentage.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                      {getStatusStats().length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid2>
          </Grid2>

          <Grid2 container spacing={3}>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Products by Quantity
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <List>
                  {reportData?.topProductsByQuantity?.map(([name, quantity], index) => (
                    <ListItem key={index} divider={index < (reportData.topProductsByQuantity?.length || 0) - 1}>
                      <ListItemText
                        primary={name}
                        secondary={`${quantity} units sold`}
                      />
                    </ListItem>
                  ))}
                  {(!reportData?.topProductsByQuantity || reportData.topProductsByQuantity.length === 0) && (
                    <ListItem>
                      <ListItemText primary="No data available" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid2>

            <Grid2 size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Products by Weight
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <List>
                  {reportData?.topProductsByWeight?.map(([name, data], index) => (
                    <ListItem key={index} divider={index < (reportData.topProductsByWeight?.length || 0) - 1}>
                      <ListItemText
                        primary={name}
                        secondary={`${data.weight.toFixed(2)} ${data.unit} sold`}
                      />
                    </ListItem>
                  ))}
                  {(!reportData?.topProductsByWeight || reportData.topProductsByWeight.length === 0) && (
                    <ListItem>
                      <ListItemText primary="No data available" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid2>
          </Grid2>

          <Paper sx={{ p: 3, mt: 3 }}>
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
                  {reportData?.sales?.slice(0, 10).map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell>
                        {sale.createdAt && formatDate(sale.createdAt)}
                      </TableCell>
                      <TableCell>
                        {sale.customerName || 'Guest Customer'}
                      </TableCell>
                      <TableCell>{sale.items?.length || 0} item(s)</TableCell>
                      <TableCell align="right">{formatCurrency(sale.total)}</TableCell>
                      <TableCell>
                        <StatusChip status={sale.status} />
                      </TableCell>
                      <TableCell>
                        {sale.paymentMethod?.charAt(0).toUpperCase() + sale.paymentMethod?.slice(1) || ''}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!reportData?.sales || reportData.sales.length === 0) && (
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
