import React, { useState } from 'react'; //, useEffect
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Typography,
  InputAdornment,
  Checkbox,
  Alert
} from '@mui/material';
import {
  Search,
  BusinessCenter,
  AddCircle
} from '@mui/icons-material';
import { BusinessAsset } from '@custTypes/models';
import { useAssets } from '@hooks/useAssets';
import LoadingScreen from '@components/ui/LoadingScreen';

interface AssetSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onAssetsSelected: (assets: BusinessAsset[]) => void;
  multiSelect?: boolean;
  title?: string;
  showCreateOption?: boolean;
  initialSelected?: BusinessAsset[];
}

export default function AssetSelectDialog({
  open,
  onClose,
  onAssetsSelected,
  multiSelect = false,
  title = 'Select Assets',
  showCreateOption = false,
  initialSelected = []
}: AssetSelectDialogProps) {
  const { data: assets = [], isLoading, error } = useAssets();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAssets, setSelectedAssets] = useState<BusinessAsset[]>(initialSelected || []);

  // Reset selected assets when dialog opens or initialSelected changes
  // useEffect(() => {
  //   if (open) {
  //     setSelectedAssets(initialSelected || []);
  //   }
  // }, [open, initialSelected]);

  const handleAssetSelection = (asset: BusinessAsset) => {
    if (multiSelect) {
      // For multi-select: toggle selection
      if (isAssetSelected(asset)) {
        setSelectedAssets(selectedAssets.filter(item => item._id !== asset._id));
      } else {
        setSelectedAssets([...selectedAssets, asset]);
      }
    } else {
      // For single-select: replace selection
      setSelectedAssets([asset]);
      // For single-select mode, immediately confirm the selection
      onAssetsSelected([asset]);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    onAssetsSelected(selectedAssets);
    onClose();
  };

  const isAssetSelected = (asset: BusinessAsset): boolean => {
    return selectedAssets.some(item => item._id === asset._id);
  };

  // Filter assets based on the search query
  const filteredAssets = assets.filter((asset) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      asset.name?.toLowerCase().includes(searchLower) ||
      asset.category?.toLowerCase().includes(searchLower) ||
      asset.location?.toLowerCase().includes(searchLower) ||
      // Safely check if the tags array exists and has items before filtering
      (asset.tags && asset.tags.length > 0 && asset.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  });

  // Handle closing with the escape key or clicking outside the dialog
  const handleCloseCancel = () => {
    setSelectedAssets(initialSelected || []);
    onClose();
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Dialog
      open={open}
      onClose={handleCloseCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          {showCreateOption && (
            <Button
              startIcon={<AddCircle />}
              color="primary"
              onClick={() => {
                // Handle create new asset action
                console.log('Create new asset clicked');
                // This would typically open a create asset dialog or navigate to create asset page
              }}
            >
              Create New Asset
            </Button>
          )}
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          margin="normal"
          label="Search Assets"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, category, location, or tags"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
        />

        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to load assets: {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        ) : filteredAssets.length === 0 ? (
          <Box textAlign="center" py={4}>
            <BusinessCenter sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary" variant="body1">
              {searchQuery ? 'No assets match your search criteria' : 'No assets available'}
            </Typography>
            {showCreateOption && (
              <Button
                variant="contained"
                startIcon={<AddCircle />}
                sx={{ mt: 2 }}
                onClick={() => {
                  // Handle create new asset action
                }}
              >
                Add New Asset
              </Button>
            )}
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredAssets.map((asset) => (
              <ListItem
                key={asset._id}
                disablePadding
                secondaryAction={
                  multiSelect && (
                    <Checkbox
                      edge="end"
                      checked={isAssetSelected(asset)}
                      tabIndex={-1}
                      onClick={() => handleAssetSelection(asset)}
                    />
                  )
                }
              >
                <ListItemButton
                  onClick={() => handleAssetSelection(asset)}
                  selected={isAssetSelected(asset)}
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      src={asset.imageUrl}
                      sx={{ bgcolor: 'primary.main' }}
                    >
                      <BusinessCenter />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={asset.name}
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2">
                          {asset.category || 'General'} • {asset.status}
                        </Typography>
                        <Typography component="div" variant="caption" color="text.secondary">
                          Value: ${asset.currentValue?.toFixed(2) || '0.00'}
                          {asset.location && ` • Location: ${asset.location}`}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Box px={2} py={1} width="100%" display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {multiSelect ? `${selectedAssets.length} asset(s) selected` : ''}
          </Typography>
          <Box>
            <Button onClick={handleCloseCancel} color="inherit">
              Cancel
            </Button>
            {multiSelect && (
              <Button
                onClick={handleConfirmSelection}
                variant="contained"
                color="primary"
                disabled={selectedAssets.length === 0}
              >
                Add Selected
              </Button>
            )}
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
