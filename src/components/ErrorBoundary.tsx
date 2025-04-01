import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Paper, Typography, Box, Container, Stack, Divider } from '@mui/material';
import { ErrorOutline, Refresh, HomeOutlined, BugReport } from '@mui/icons-material';
import { Link } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<{
    error: Error | null;
    resetErrorBoundary: () => void;
  }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallbackComponent: FallbackComponent } = this.props;

    if (hasError) {
      if (FallbackComponent) {
        return <FallbackComponent
          error={error}
          resetErrorBoundary={this.resetErrorBoundary}
        />;
      }

      // Default fallback UI
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper
            elevation={2}
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Box sx={{
              mb: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <ErrorOutline color="error" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h4" color="error" gutterBottom fontWeight="bold">
                Something went wrong
              </Typography>
              <Typography variant="body1" color="text.secondary">
                The application encountered an unexpected error
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {error && (
              <Box
                sx={{
                  my: 3,
                  p: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                  borderRadius: 1,
                  overflow: 'auto',
                  textAlign: 'left',
                  maxHeight: '200px'
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
                  Error Details:
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace'
                  }}
                >
                  {error.toString()}
                </Typography>
              </Box>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Refresh />}
                onClick={this.resetErrorBoundary}
                sx={{ px: 4 }}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                component={Link}
                to="/"
                startIcon={<HomeOutlined />}
                sx={{ px: 4 }}
              >
                Back to Dashboard
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<BugReport />}
                onClick={() => window.location.href = 'mailto:support@biztracker.com?subject=Error Report&body=' + encodeURIComponent(error?.toString() || 'Unknown error')}
                sx={{ px: 4 }}
              >
                Report Issue
              </Button>
            </Stack>
          </Paper>
        </Container>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
