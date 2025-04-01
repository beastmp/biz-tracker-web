import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  useTheme,
  Divider,
  Collapse,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Refresh,
  Home as HomeIcon,
  ArrowBack,
  BugReport,
  ErrorOutline,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary?: () => void;
  message?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  showReportButton?: boolean;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  message = 'Something went wrong',
  showHomeButton = true,
  showBackButton = true,
  showReportButton = true
}) => {
  const theme = useTheme();
  const [showDetails, setShowDetails] = React.useState(false);

  const handleRefresh = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.reload();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: { xs: 2, md: 4 },
        minHeight: 300,
        width: '100%'
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          textAlign: 'center',
          maxWidth: '100%',
          width: 500,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: theme => `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
          }
        }}
        className="fade-in"
      >
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ErrorOutline
            color="error"
            sx={{
              fontSize: 60,
              mb: 2,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.7, transform: 'scale(0.98)' },
                '50%': { opacity: 1, transform: 'scale(1.03)' },
                '100%': { opacity: 0.7, transform: 'scale(0.98)' }
              }
            }}
          />
          <Typography variant="h5" color="error" gutterBottom fontWeight="bold">
            {message}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We encountered an error while trying to process your request.
          </Typography>
        </Box>

        <Box sx={{ mt: 3, mb: 3 }}>
          <Button
            variant="text"
            color="inherit"
            onClick={() => setShowDetails(!showDetails)}
            endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
            sx={{ mb: 1 }}
          >
            {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
          </Button>

          <Collapse in={showDetails}>
            {error && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: alpha(theme.palette.error.main, 0.05),
                  my: 1,
                  borderRadius: 1,
                  borderColor: alpha(theme.palette.error.main, 0.2),
                  textAlign: 'left',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    m: 0
                  }}
                >
                  {error.stack || error.toString()}
                </Typography>
              </Paper>
            )}
          </Collapse>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 1.5,
          flexWrap: { xs: 'wrap', sm: 'nowrap' }
        }}>
          <Button
            onClick={handleRefresh}
            variant="contained"
            color="primary"
            startIcon={<Refresh />}
          >
            Retry
          </Button>

          {showBackButton && (
            <Tooltip title="Go back to the previous page">
              <Button
                onClick={() => window.history.back()}
                variant="outlined"
                startIcon={<ArrowBack />}
              >
                Go Back
              </Button>
            </Tooltip>
          )}

          {showHomeButton && (
            <Button
              component={Link}
              to="/"
              variant="outlined"
              startIcon={<HomeIcon />}
            >
              Dashboard
            </Button>
          )}

          {showReportButton && (
            <Tooltip title="Report this error to the support team">
              <Button
                color="error"
                variant="text"
                startIcon={<BugReport />}
                onClick={() => window.location.href = 'mailto:support@biztracker.com?subject=Error Report&body=' + encodeURIComponent(error?.toString() || 'Unknown error')}
              >
                Report
              </Button>
            </Tooltip>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ErrorFallback;
