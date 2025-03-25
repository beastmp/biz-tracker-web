import { Button, Paper, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { RefreshOutlined, HomeOutlined } from '@mui/icons-material';

interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary?: () => void;
  message?: string;
}

export default function ErrorFallback({
  error,
  resetErrorBoundary,
  message = 'Something went wrong'
}: ErrorFallbackProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: 500,
        mx: 'auto',
        my: 4
      }}
    >
      <Typography variant="h5" color="error" gutterBottom>
        {message}
      </Typography>

      {error && (
        <Typography
          variant="body2"
          color="text.secondary"
          component="pre"
          sx={{
            mb: 3,
            p: 2,
            backgroundColor: 'grey.100',
            borderRadius: 1,
            overflow: 'auto',
            maxWidth: '100%'
          }}
        >
          {error.message}
        </Typography>
      )}

      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        {resetErrorBoundary && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshOutlined />}
            onClick={resetErrorBoundary}
          >
            Try Again
          </Button>
        )}

        <Button
          variant="outlined"
          component={Link}
          to="/"
          startIcon={<HomeOutlined />}
        >
          Go to Dashboard
        </Button>
      </Box>
    </Paper>
  );
}
