import { useState, useEffect } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { LinearProgress, Box, useTheme } from '@mui/material';

export default function GlobalLoadingIndicator() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [isVisible, setIsVisible] = useState(false);
  const theme = useTheme();

  // Add delay to prevent flashing for quick operations
  useEffect(() => {
    if (isFetching || isMutating) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isFetching, isMutating]);

  if (!isVisible) return null;

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      width: '100%'
    }}>
      <LinearProgress
        color="primary"
        sx={{
          height: 3,
          '& .MuiLinearProgress-bar': {
            backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          }
        }}
      />
    </Box>
  );
}
