/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { ArrowBack, Edit, Delete, NoPhotography } from '@mui/icons-material';
import { itemsApi, Item } from '../../services/api';

export default function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;

      try {
        const data = await itemsApi.getById(id);
        setItem(data);
      } catch (error) {
        console.error('Failed to fetch item:', error);
        setError('Failed to load item details');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await itemsApi.delete(id);
      navigate('/inventory');
    } catch (error) {
      console.error('Failed to delete item:', error);
      setError('Failed to delete item');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getStockStatusColor = (item: Item) => {
    if (item.trackingType === 'quantity') {
      if (item.quantity === 0) return 'error';
      if (item.quantity < 5) return 'warning';
      return 'success';
    } else {
      // For weight-tracked items
      if (item.priceType === 'each') {
        // Base status on quantity when pricing is per item
        if (!item.quantity || item.quantity === 0) return 'error';
        if (item.quantity < 3) return 'warning';
        return 'success';
      } else {
        // Base status on weight when pricing is per weight
        if (!item.weight || item.weight === 0) return 'error';

        // Different thresholds based on weight unit
        const lowThreshold =
          item.weightUnit === 'kg' ? 1 :
          item.weightUnit === 'g' ? 500 :
          item.weightUnit === 'lb' ? 2 :
          item.weightUnit === 'oz' ? 16 : 5;

        if (item.weight < lowThreshold) return 'warning';
        return 'success';
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !item) {
    return (
      <Box>
        <Typography variant="h5" color="error" gutterBottom>
          {error || 'Item not found'}
        </Typography>
        <Button component={RouterLink} to="/inventory" startIcon={<ArrowBack />}>
          Back to Inventory
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {item.name}
        </Typography>
        <Box>
          <Button
            component={RouterLink}
            to="/inventory"
            startIcon={<ArrowBack />}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Button
            component={RouterLink}
            to={`/inventory/${id}/edit`}
            startIcon={<Edit />}
            variant="contained"
            color="primary"
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            onClick={handleDelete}
            startIcon={<Delete />}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left column - Image and tags */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            {/* Display item image if available */}
            {item.imageUrl ? (
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    borderRadius: 8
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 2,
                  mb: 3
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <NoPhotography sx={{ fontSize: 60, color: '#cccccc' }} />
                  <Typography variant="body2" color="text.secondary">
                    No image available
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Display tags if available */}
            <Typography variant="h6" gutterBottom>
              Tags
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {item.tags && item.tags.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {item.tags.map(tag => (
                  <Chip key={tag} label={tag} size="medium" />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No tags added
              </Typography>
            )}

            {item.description && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Description
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1">
                  {item.description}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* Right column - Item details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Item Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List>
              <ListItem disablePadding sx={{ pb: 1 }}>
                <ListItemText primary="SKU" secondary={item.sku} />
              </ListItem>
              <ListItem disablePadding sx={{ pb: 1 }}>
                <ListItemText
                  primary="Category"
                  secondary={
                    <Chip
                      label={item.category}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  }
                />
              </ListItem>
              <ListItem disablePadding sx={{ pb: 1 }}>
                <ListItemText
                  primary="Tracking Type"
                  secondary={item.trackingType === 'quantity' ? 'Track by Quantity' : 'Track by Weight'}
                />
              </ListItem>
              {item.trackingType === 'quantity' ? (
                <ListItem disablePadding sx={{ pb: 1 }}>
                  <ListItemText
                    primary="Stock Level"
                    secondary={
                      <Chip
                        label={`${item.quantity} in stock`}
                        color={getStockStatusColor(item) as any}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    }
                  />
                </ListItem>
              ) : (
                <ListItem disablePadding sx={{ pb: 1 }}>
                  <ListItemText
                    primary="Stock Level"
                    secondary={
                      item.priceType === 'each' ? (
                        item.quantity > 0 ? (
                          <Chip
                            label={`${item.quantity} × ${item.weight}${item.weightUnit}`}
                            color={getStockStatusColor(item) as any}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        ) : (
                          <Chip
                            label="Out of Stock"
                            color="error"
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        )
                      ) : (
                        <Chip
                          label={`${item.weight}${item.weightUnit} in stock`}
                          color={getStockStatusColor(item) as any}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      )
                    }
                  />
                </ListItem>
              )}
              <ListItem disablePadding sx={{ pb: 1 }}>
                <ListItemText
                  primary="Price"
                  secondary={
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main', mt: 0.5 }}>
                      {formatCurrency(item.price)}
                      {/* Show appropriate price label based on tracking and price types */}
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        {item.trackingType === 'quantity'
                          ? 'per item'
                          : item.priceType === 'each'
                            ? 'per item'
                            : `/${item.weightUnit}`}
                      </Typography>
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem disablePadding sx={{ pb: 1 }}>
                <ListItemText
                  primary="Last Updated"
                  secondary={item.lastUpdated ? formatDate(item.lastUpdated) : 'Never'}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Inventory Value
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" component="div" color="primary">
                {/* Calculate inventory value based on tracking type AND price type */}
                {item.trackingType === 'quantity'
                  ? formatCurrency(item.price * item.quantity)
                  : item.priceType === 'each'
                    ? formatCurrency(item.price * (item.quantity || 0)) // Price per item × quantity
                    : formatCurrency(item.price * item.weight) // Price per weight unit × weight
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {/* Display calculation details based on tracking and price types */}
                {item.trackingType === 'quantity' ? (
                  `${item.quantity} units × ${formatCurrency(item.price)} each`
                ) : item.priceType === 'each' ? (
                  `${item.quantity || 0} items × ${formatCurrency(item.price)} each`
                ) : (
                  `${item.weight} ${item.weightUnit} × ${formatCurrency(item.price)}/${item.weightUnit}`
                )}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}