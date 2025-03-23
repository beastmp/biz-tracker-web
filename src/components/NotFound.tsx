import { Box, Typography, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function NotFound() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
      <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 500 }}>
        <Typography variant="h2" sx={{ mb: 2 }}>
          404
        </Typography>
        <Typography variant="h5" sx={{ mb: 4 }}>
          Page Not Found
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Button variant="contained" color="primary" component={RouterLink} to="/dashboard">
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  );
}