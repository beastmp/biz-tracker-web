import { Chip, ChipProps } from '@mui/material';
import { getStatusColor, formatStatus } from '@utils/formatters';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: string;
  size?: 'small' | 'medium';
}

export default function StatusChip({ status, size = 'small', ...props }: StatusChipProps) {
  return (
    <Chip
      label={formatStatus(status)}
      color={getStatusColor(status)}
      size={size}
      {...props}
    />
  );
}
