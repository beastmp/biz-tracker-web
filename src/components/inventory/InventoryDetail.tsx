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
  Stack
} from '@mui/material';
import { ArrowBack, Edit, Delete } from '@mui/icons-material';
import { itemsApi, Item } from '../../services/api';

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
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
        setError('Failed to load item details. The item may have been deleted.');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await itemsApi.delete(id);
      navigate('/inventory');
    } catch (error) {
      console.error('Failed to delete item:', error);
      setError('Failed to delete item. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Item Not Found
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />}
            component={RouterLink}
            to="/inventory"
          >
            Back to Inventory
          </Button>
        </Box>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="error">
            {error || "The requested item could not be found."}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {item.name}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />}
            component={RouterLink}
            to="/inventory"
          >
            Back to List
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<Edit />}
            component={RouterLink}
            to={`/inventory/${id}/edit`}
          >
            Edit
          </Button>
          <Button 
            variant="contained" 
            color="error"
            startIcon={<Delete />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Item Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  SKU
                </Typography>
                <Typography variant="body1">
                  {item.sku}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1">
                  <Chip label={item.category} size="small" />
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {item.description || "No description provided"}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Inventory Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Quantity in Stock
                </Typography>
                <Typography variant="h4" color={item.quantity > 0 ? 'success.main' : 'error.main'}>
                  {item.quantity}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(item.price)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Inventory Value
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(item.price * item.quantity)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {item.lastUpdated ? formatDate(item.lastUpdated) : "Unknown"}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}