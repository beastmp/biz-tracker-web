import { Chip, ChipProps } from "@mui/material";
import { getStatusColor, formatStatus } from "@utils/formatters";

interface StatusChipProps extends Omit<ChipProps, "color"> {
  status: string;
  size?: "small" | "medium";
}

export default function StatusChip({
  status,
  size = "small",
  ...props
}: StatusChipProps) {
  // Handle undefined status
  if (!status) {
    return (
      <Chip
        label="Unknown"
        color="default"
        size={size}
        {...props}
      />
    );
  }

  return (
    <Chip
      label={formatStatus(status)}
      color={getStatusColor(status)}
      size={size}
      {...props}
    />
  );
}
