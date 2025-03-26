import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid2,
  Divider,
  Button,
  TextField,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent
} from '@mui/material';
import { ArrowBack, BarChart, ShowChart, DateRange, Search } from '@mui/icons-material';
import { usePurchasesReport } from '@hooks/usePurchases';
import { formatCurrency, formatDate } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import StatusChip from '@components/ui/StatusChip';

export default function PurchasesReport() {
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [shouldFetch, setShouldFetch] = useState(false);
  const { data: reportData, isLoading, error } = usePurchasesReport(
    shouldFetch ? startDate : undefined,
    shouldFetch ? endDate : undefined
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

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Purchases Report
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          component={RouterLink}
          to="/purchases"
        >
          Back to Purchases
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid2 container spacing={3} alignItems="center" component="form" onSubmit={handleSubmit}>
          <Grid2 size= {{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid2>
          <Grid2 size= {{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid2>
          <Grid2 size= {{ xs: 12, sm: 4 }}>
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
            <Grid2 size= {{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography color="text.secondary" gutterBottom>
                      Total Purchases
                    </Typography>
                    <BarChart color="primary" />
                  </Box>
                  <Typography variant="h3" component="div">
                    {reportData.totalPurchases}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`From ${formatDate(startDate)} to ${formatDate(endDate)}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>

            <Grid2 size= {{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography color="text.secondary" gutterBottom>
                      Total Cost
                    </Typography>
                    <ShowChart color="error" />
                  </Box>
                  <Typography variant="h3" component="div">
                    {formatCurrency(reportData.totalCost)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`From ${formatDate(startDate)} to ${formatDate(endDate)}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>

            <Grid2 size= {{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography color="text.secondary" gutterBottom>
                      Average Purchase Value
                    </Typography>
                    <DateRange color="info" />
                  </Box>
                  <Typography variant="h3" component="div">
                    {formatCurrency(reportData.averagePurchaseValue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`From ${formatDate(startDate)} to ${formatDate(endDate)}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
          </Grid2>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Purchase Details</Typography>
            <Divider sx={{ mb: 2 }} />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.purchases.map((purchase) => (
                    <TableRow
                      key={purchase._id}
                      hover
                      onClick={() => window.location.href = `/purchases/${purchase._id}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <TableCell>{purchase.purchaseDate && formatDate(purchase.purchaseDate)}</TableCell>
                      <TableCell>{purchase.supplier?.name || 'Unknown Supplier'}</TableCell>
                      <TableCell>{purchase.invoiceNumber || '-'}</TableCell>
                      <TableCell>{purchase.items?.length || 0}</TableCell>
                      <TableCell><StatusChip status={purchase.status} /></TableCell>
                      <TableCell align="right">{formatCurrency(purchase.total)}</TableCell>
                    </TableRow>
                  ))}
                  {reportData.purchases.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No purchases found in the selected date range.</TableCell>
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
