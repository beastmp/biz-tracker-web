import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% {
    opacity: 0.6;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.6;
    transform: scale(0.98);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  showAppName?: boolean;
  showLogo?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading data...',
  fullScreen = false,
  showAppName = true,
  showLogo = true
}) => {
  const theme = useTheme();

  const containerStyles = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(theme.palette.background.default, 0.7),
    backdropFilter: 'blur(4px)'
  } : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    width: '100%',
    padding: 4
  };

  return (
    <Box sx={containerStyles}>
      <Paper
        elevation={fullScreen ? 4 : 0}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          maxWidth: '90%',
          width: fullScreen ? 350 : '100%',
          background: fullScreen ? undefined : 'transparent',
          animation: `${fadeIn} 0.4s ease-in-out`,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {showLogo && (
          <Box
            sx={{
              mb: 3,
              animation: `${pulse} 2s infinite ease-in-out`,
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.1)
            }}
          >
            <Box
              component="img"
              src="/logo.svg"
              alt="BizTracker Logo"
              sx={{ width: 50, height: 50 }}
              onError={(e) => {
                // If logo fails to load, show a fallback
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </Box>
        )}

        {showAppName && (
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              mb: 2,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              MozBackgroundClip: 'text',
              MozTextFillColor: 'transparent'
            }}
          >
            BizTracker
          </Typography>
        )}

        <CircularProgress
          size={fullScreen ? 48 : 40}
          color="primary"
          thickness={4}
          sx={{ mb: 2 }}
        />

        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{
            mt: 1,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '40%',
              height: 2,
              backgroundColor: theme.palette.primary.main,
              borderRadius: 1
            }
          }}
        >
          {message}
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoadingScreen;
