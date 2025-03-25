import { Box, Typography, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

export default function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 5,
      }}
    >
      <Paper
        sx={{
          p: 5,
          textAlign: 'center',
          maxWidth: 500,
          width: '100%'
        }}
      >
        <Typography variant="h1" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
          404
        </Typography>

        <Typography variant="h4" sx={{ mb: 2 }}>
          Page Not Found
        </Typography>

        <Typography color="text.secondary" paragraph>
          The page you're looking for doesn't exist or has been moved.
        </Typography>

        <Button
          variant="contained"
          component={RouterLink}
          to="/"
          startIcon={<HomeIcon />}
          sx={{ mt: 3 }}
        >
          Return to Dashboard
        </Button>
      </Paper>
    </Box>
  );
}