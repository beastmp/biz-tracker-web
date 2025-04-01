import React from 'react';
import { Chip, ChipProps, Box, alpha } from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  MoreHoriz,
  Done,
  AccessTime,
  LocalShipping,
  Settings,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ThumbsUpDown
} from '@mui/icons-material';

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
  className?: string;
  withAnimation?: boolean;
  withText?: boolean;
}

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  size = 'medium',
  className,
  withAnimation = true,
  withText = true
}) => {
  // Define statusConfig based on the status string
  const statusConfig: {
    color: ChipProps['color'];
    icon: React.ReactElement;
    label?: string;
    variant?: ChipProps['variant'];
  } = React.useMemo(() => {
    switch (status?.toLowerCase()) {
      // Sales statuses
      case 'completed':
        return { color: 'success', icon: <CheckCircle />, label: 'Completed' };
      case 'pending':
        return { color: 'warning', icon: <Pending />, label: 'Pending' };
      case 'processing':
        return { color: 'info', icon: <Settings />, label: 'Processing' };
      case 'cancelled':
        return { color: 'error', icon: <Cancel />, label: 'Cancelled' };

      // Purchase statuses
      case 'ordered':
        return { color: 'info', icon: <LocalShipping />, label: 'Ordered' };
      case 'received':
        return { color: 'success', icon: <Done />, label: 'Received' };

      // Payment statuses
      case 'paid':
        return { color: 'success', icon: <CheckCircle />, label: 'Paid' };
      case 'unpaid':
        return { color: 'error', icon: <Cancel />, label: 'Unpaid' };
      case 'partial':
        return { color: 'warning', icon: <ThumbsUpDown />, label: 'Partial' };

      // Asset statuses
      case 'active':
        return { color: 'success', icon: <CheckCircle />, label: 'Active' };
      case 'maintenance':
        return { color: 'warning', icon: <Settings />, label: 'Maintenance' };
      case 'retired':
        return { color: 'error', icon: <Cancel />, label: 'Retired' };

      // Inventory statuses
      case 'in_stock':
        return { color: 'success', icon: <CheckCircle />, label: 'In Stock' };
      case 'low_stock':
        return { color: 'warning', icon: <WarningIcon />, label: 'Low Stock' };
      case 'out_of_stock':
        return { color: 'error', icon: <ErrorIcon />, label: 'Out of Stock' };

      // Default/unknown status
      default:
        return { color: 'default', icon: <MoreHoriz />, label: status || 'Unknown' };
    }
  }, [status]);

  // Apply animation keyframes if animation is enabled
  const animationStyle = withAnimation ? {
    '@keyframes pulse': {
      '0%': { boxShadow: '0 0 0 0 rgba(var(--status-color), 0.7)' },
      '70%': { boxShadow: '0 0 0 6px rgba(var(--status-color), 0)' },
      '100%': { boxShadow: '0 0 0 0 rgba(var(--status-color), 0)' }
    },
    animation: 'pulse 2s infinite',
    '--status-color': statusConfig.color === 'success' ? '76, 175, 80' :
      statusConfig.color === 'warning' ? '255, 152, 0' :
      statusConfig.color === 'error' ? '244, 67, 54' :
      statusConfig.color === 'info' ? '33, 150, 243' : '97, 97, 97'
  } : {};

  return (
    <Chip
      size={size}
      color={statusConfig.color}
      variant={statusConfig.variant || 'default'}
      icon={React.cloneElement(statusConfig.icon, { fontSize: size })}
      label={withText ? statusConfig.label : undefined}
      className={className}
      sx={{
        fontWeight: 500,
        ...animationStyle,
        '& .MuiChip-icon': {
          color: 'inherit',
          mr: withText ? undefined : 0
        },
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'scale(1.05)'
        },
        py: withText ? undefined : 0,
        minWidth: withText ? undefined : size === 'small' ? 32 : 40,
        width: withText ? undefined : size === 'small' ? 32 : 40,
        height: withText ? undefined : size === 'small' ? 32 : 40,
        borderRadius: withText ? undefined : '50%',
      }}
    />
  );
};

export default StatusChip;
