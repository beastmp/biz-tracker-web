import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import { AddCircle, BusinessCenter, Search } from '@mui/icons-material';
import { BusinessAsset } from '@custTypes/models';
import { useAssets } from '@hooks/useAssets';
import { formatCurrency } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';

interface AssetSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onAssetSelect: (assets: BusinessAsset[]) => void;
  onCreateNew: () => void;
  selectedAssets: BusinessAsset[];
  onSelectAsset: (asset: BusinessAsset) => void;
}

export default function AssetSelectDialog({
  open,
  onClose,
  onAssetSelect,
  onCreateNew,
  selectedAssets,
  onSelectAsset
}: AssetSelectDialogProps) {
  const { data: assets = [], isLoading } = useAssets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (asset.assetTag && asset.assetTag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isAssetSelected = (asset: BusinessAsset): boolean => {
    return selectedAssets.some(selectedAsset => selectedAsset._id === asset._id);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Select Assets</Typography>
          <Box>
            <Button
              startIcon={<AddCircle />}
              color="primary"
              onClick={onCreateNew}
            >
              Create New Asset
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Search assets by name, category, or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          margin="normal"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        {isLoading ? (
          <LoadingScreen message="Loading assets..." />
        ) : filteredAssets.length > 0 ? (
          <List>
            {filteredAssets.map((asset) => (
              <ListItemButton
                key={asset._id}
                onClick={() => onSelectAsset(asset)}
                divider
                selected={isAssetSelected(asset)}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={isAssetSelected(asset)}
                    tabIndex={-1}
                    disableRipple
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAsset(asset);
                    }}
                  />
                </ListItemIcon>
                <ListItemAvatar>
                  <Avatar variant="rounded">
                    {asset.imageUrl ? (
                      <img src={asset.imageUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <BusinessCenter />
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={asset.name}
                  secondary={`Category: ${asset.category} | Value: ${formatCurrency(asset.currentValue)}`}
                />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            {searchQuery ? 'No assets matching your search criteria.' : 'No assets found. Create some assets first or click "Create New Asset" to add one now.'}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Typography variant="body2" sx={{ flexGrow: 1, ml: 2 }}>
          {selectedAssets.length} asset(s) selected
        </Typography>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() => onAssetSelect(selectedAssets)}
          color="primary"
          variant="contained"
          disabled={selectedAssets.length === 0}
        >
          Add Selected Assets
        </Button>
      </DialogActions>
    </Dialog>
  );
}
