import { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, TableContainer, Table, TableHead,
  TableBody, TableRow, TableCell, TableSortLabel, Chip, Card,
  CardContent, Grid
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { useItems } from '@hooks/useItems';
import { formatCurrency } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';

export default function InventoryProfitReport() {
  const { data: items = [], isLoading, error } = useItems();
  const [sortBy, setSortBy] = useState<string>('markup-desc');

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      // Calculate markup percentages
      const markupA = a.cost ? (a.price / a.cost - 1) * 100 : 0;
      const markupB = b.cost ? (b.price / b.cost - 1) * 100 : 0;

      switch(sortBy) {
        case 'markup-desc': return markupB - markupA;
        case 'markup-asc': return markupA - markupB;
        case 'profit-desc': return (b.price - (b.cost || 0)) - (a.price - (a.cost || 0));
        case 'profit-asc': return (a.price - (a.cost || 0)) - (b.price - (b.cost || 0));
        default: return 0;
      }
    });
  }, [items, sortBy]);

  // Chart data for markup by category
  const categoryMarkupData = useMemo(() => {
    const categories = new Map();

    items.forEach(item => {
      if (!item.category) return;

      if (!categories.has(item.category)) {
        categories.set(item.category, {
          items: 0,
          totalMarkup: 0,
          totalProfit: 0
        });
      }

      const markup = item.cost ? (item.price / item.cost - 1) * 100 : 0;
      const profit = item.price - (item.cost || 0);

      const categoryData = categories.get(item.category);
      categoryData.items++;
      categoryData.totalMarkup += markup;
      categoryData.totalProfit += profit;
    });

    return Array.from(categories.entries()).map(([category, data]) => ({
      name: category || 'Uncategorized',
      avgMarkup: data.items > 0 ? data.totalMarkup / data.items : 0,
      totalProfit: data.totalProfit
    }));
  }, [items]);

  // Calculate summary statistics with support for all measurement types
  const summaryStats = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let highestMarkup = 0;
    let highestMarkupItem = null;

    items.forEach(item => {
      // Calculate item value based on tracking type
      let itemValue = 0;
      let itemCost = 0;

      switch (item.trackingType) {
        case 'quantity':
          itemValue = item.price * item.quantity;
          itemCost = (item.cost || 0) * item.quantity;
          break;
        case 'weight':
          itemValue = item.priceType === 'each' ? item.price * (item.quantity || 1) : item.price * item.weight;
          itemCost = item.priceType === 'each' ? (item.cost || 0) * (item.quantity || 1) : (item.cost || 0) * item.weight;
          break;
        case 'length':
          itemValue = item.priceType === 'each' ? item.price * (item.quantity || 1) : item.price * item.length;
          itemCost = item.priceType === 'each' ? (item.cost || 0) * (item.quantity || 1) : (item.cost || 0) * item.length;
          break;
        case 'area':
          itemValue = item.priceType === 'each' ? item.price * (item.quantity || 1) : item.price * item.area;
          itemCost = item.priceType === 'each' ? (item.cost || 0) * (item.quantity || 1) : (item.cost || 0) * item.area;
          break;
        case 'volume':
          itemValue = item.priceType === 'each' ? item.price * (item.quantity || 1) : item.price * item.volume;
          itemCost = item.priceType === 'each' ? (item.cost || 0) * (item.quantity || 1) : (item.cost || 0) * item.volume;
          break;
      }

      totalValue += itemValue;
      totalCost += itemCost;

      const markup = item.cost ? (item.price / item.cost - 1) * 100 : 0;
      if (markup > highestMarkup && (item.cost || 0) > 0) {
        highestMarkup = markup;
        highestMarkupItem = item;
      }
    });

    return {
      totalValue,
      totalCost,
      totalProfit: totalValue - totalCost,
      overallMarkup: totalCost > 0 ? ((totalValue / totalCost - 1) * 100) : 0,
      highestMarkup,
      highestMarkupItem
    };
  }, [items]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorFallback error={error as Error} message="Failed to load inventory data" />;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Inventory Profit Analysis
      </Typography>

      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Inventory Value
              </Typography>
              <Typography variant="h4">
                {formatCurrency(summaryStats.totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Inventory Cost
              </Typography>
              <Typography variant="h4">
                {formatCurrency(summaryStats.totalCost)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Potential Profit
              </Typography>
              <Typography variant="h4" color="success.main">
                {formatCurrency(summaryStats.totalProfit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Overall Markup
              </Typography>
              <Typography variant="h4" color="primary.main">
                {summaryStats.overallMarkup.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chart */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Average Markup by Category
        </Typography>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryMarkupData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip formatter={(value, name) => [
              // Ensure 'name' is treated as a string before using includes method
              typeof name === 'string' && name.includes('Markup')
                ? `${Number(value).toFixed(1)}%`
                : formatCurrency(Number(value)),
              name
            ]} />
            <Legend />
            <Bar yAxisId="left" dataKey="avgMarkup" name="Avg. Markup (%)" fill="#8884d8" unit="%" />
            <Bar yAxisId="right" dataKey="totalProfit" name="Total Profit ($)" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Detailed table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Item Markup Details
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortBy.startsWith('profit')}
                    direction={sortBy === 'profit-asc' ? 'asc' : 'desc'}
                    onClick={() => setSortBy(sortBy === 'profit-asc' ? 'profit-desc' : 'profit-asc')}
                  >
                    Profit
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortBy.startsWith('markup')}
                    direction={sortBy === 'markup-asc' ? 'asc' : 'desc'}
                    onClick={() => setSortBy(sortBy === 'markup-asc' ? 'markup-desc' : 'markup-asc')}
                  >
                    Markup %
                  </TableSortLabel>
                </TableCell>
                <TableCell>Measurement</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedItems.map((item) => {
                const profit = item.price - (item.cost || 0);
                const markup = item.cost ? (item.price / item.cost - 1) * 100 : 0;

                return (
                  <TableRow key={item._id} hover>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category || 'Uncategorized'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          item.itemType === 'material' ? 'Material' :
                          item.itemType === 'product' ? 'Product' : 'Both'
                        }
                      />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(item.cost || 0)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                    <TableCell align="right"
                      sx={{ color: profit > 0 ? 'success.main' : 'error.main' }}
                    >
                      {formatCurrency(profit)}
                    </TableCell>
                    <TableCell align="right"
                      sx={{ color: markup > 0 ? 'success.main' : 'error.main' }}
                    >
                      {markup.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      {item.trackingType === 'quantity' && `${item.quantity} units`}
                      {item.trackingType === 'weight' && `${item.weight} ${item.weightUnit}`}
                      {item.trackingType === 'length' && `${item.length} ${item.lengthUnit}`}
                      {item.trackingType === 'area' && `${item.area} ${item.areaUnit}`}
                      {item.trackingType === 'volume' && `${item.volume} ${item.volumeUnit}`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}