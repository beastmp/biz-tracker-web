import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Snackbar,
  TextField,
  FormControl,
  Select,
  SelectChangeEvent,
  MenuItem,
  InputAdornment,
  ToggleButtonGroup,
  Grid2,
  ToggleButton,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  Notifications,
  Storage,
  Security,
  Backup,
  Inventory,
  Scale,
  GridView as GridViewIcon,
  List as ListViewIcon,
  ViewModule,
  Sync,
  Link as LinkIcon,
  StackedBarChart,
  Calculate
} from '@mui/icons-material';
import { useAppContext } from '@hooks/useAppContext';
import { useSettings } from '@hooks/useSettings';
import { useRebuildRelationships, useRebuildInventory } from '@hooks/useItems';

export default function Settings() {
  // Change from 'mode' to 'theme' to match the AppContextProps interface
  const { theme, toggleColorMode } = useAppContext();
  const [notifications, setNotifications] = useState(false);
  const [dataBackup, setDataBackup] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rebuildingRelationships, setRebuildingRelationships] = useState(false);
  const rebuildRelationships = useRebuildRelationships();

  // Add state for inventory rebuild
  const [rebuildingInventory, setRebuildingInventory] = useState(false);
  const [rebuildResults, setRebuildResults] = useState<{
    processed: number;
    updated: number;
    errors: number;
    details: any[];
  } | null>(null);
  const [showRebuildDialog, setShowRebuildDialog] = useState(false);
  const rebuildInventory = useRebuildInventory();

  // Use settings context instead of local state
  const {
    lowStockAlertsEnabled,
    quantityThreshold,
    weightThresholds,
    defaultViewMode,
    setLowStockAlertsEnabled,
    setQuantityThreshold,
    updateWeightThreshold,
    setDefaultViewMode,
    defaultGroupBy,
    setDefaultGroupBy
  } = useSettings();

  const [selectedWeightUnit, setSelectedWeightUnit] = useState('lb');

  const handleToggleNotifications = () => {
    setNotifications(!notifications);
    setSuccessMessage('Notification settings updated');
  };

  const handleToggleDataBackup = () => {
    setDataBackup(!dataBackup);
    setSuccessMessage('Data backup settings updated');
  };

  const handleToggleLowStockAlerts = () => {
    setLowStockAlertsEnabled(!lowStockAlertsEnabled);
    setSuccessMessage('Low stock alert settings updated');
  };

  const handleQuantityThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setQuantityThreshold(value);
      setSuccessMessage('Quantity threshold updated');
    }
  };

  // Update the type annotation to use SelectChangeEvent
  const handleWeightUnitChange = (event: SelectChangeEvent) => {
    setSelectedWeightUnit(event.target.value);
  };

  const handleWeightThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      updateWeightThreshold(selectedWeightUnit as keyof typeof weightThresholds, value);
      setSuccessMessage(`${selectedWeightUnit} threshold updated`);
    }
  };

  const handleViewModeChange = (
    _: React.MouseEvent<HTMLElement>,
    newMode: 'grid' | 'list' | null
  ) => {
    if (newMode !== null) {
      setDefaultViewMode(newMode);
      setSuccessMessage(`Default view set to ${newMode} mode`);
    }
  };

  const handleGroupByChange = (event: SelectChangeEvent) => {
    setDefaultGroupBy(event.target.value as 'none' | 'itemType' | 'category');
    setSuccessMessage(`Default grouping set to ${event.target.value === 'none' ? 'None' :
        event.target.value === 'itemType' ? 'Item Type' : 'Category'
      }`);
  };

  const handleRebuildRelationships = async () => {
    setRebuildingRelationships(true);
    try {
      await rebuildRelationships.mutateAsync();
      setSuccessMessage('Item relationships have been successfully rebuilt!');
    } catch (error) {
      console.error('Failed to rebuild relationships:', error);
      setSuccessMessage('Failed to rebuild item relationships. Please try again.');
    } finally {
      setRebuildingRelationships(false);
    }
  };

  // Add handler for inventory rebuild
  const handleRebuildInventory = async () => {
    setRebuildingInventory(true);
    setRebuildResults(null);
    setShowRebuildDialog(false);

    try {
      const result = await rebuildInventory.mutateAsync();
      setRebuildResults(result);
      setSuccessMessage(`Successfully rebuilt inventory for ${result.updated} items!`);
    } catch (error) {
      console.error('Failed to rebuild inventory:', error);
      setSuccessMessage('Failed to rebuild inventory. Please try again.');
    } finally {
      setRebuildingInventory(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      <Typography color="text.secondary" paragraph>
        Manage your application preferences and settings
      </Typography>

      <Grid2 container spacing={3}>
        {/* Theme Settings */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List disablePadding>
              <ListItem>
                <ListItemIcon>
                  {theme === 'dark' ? <DarkMode /> : <LightMode />}
                </ListItemIcon>
                <ListItemText
                  primary="Dark Mode"
                  secondary="Switch between light and dark theme"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={theme === 'dark'}
                    onChange={toggleColorMode}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid2>

        {/* Notifications Settings */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List disablePadding>
              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText
                  primary="Push Notifications"
                  secondary="Receive alerts for low stock and other updates"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={notifications}
                    onChange={handleToggleNotifications}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid2>

        {/* Low Stock Settings */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Inventory Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List disablePadding>
              <ListItem>
                <ListItemIcon>
                  <Inventory />
                </ListItemIcon>
                <ListItemText
                  primary="Low Stock Alerts"
                  secondary="Enable warnings for items with low inventory"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={lowStockAlertsEnabled}
                    onChange={handleToggleLowStockAlerts}
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <Divider component="li" />

              {lowStockAlertsEnabled && (
                <>
                  <ListItem>
                    <ListItemText
                      primary="Quantity-Based Items"
                      secondary="Alert when quantity falls below threshold"
                      sx={{ ml: 2 }}
                    />
                    <ListItemSecondaryAction>
                      <TextField
                        type="number"
                        size="small"
                        value={quantityThreshold}
                        onChange={handleQuantityThresholdChange}
                        InputProps={{
                          inputProps: { min: 0 },
                          startAdornment: (
                            <InputAdornment position="start">
                              <Inventory fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ width: '100px' }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <Divider component="li" />

                  <ListItem>
                    <ListItemText
                      primary="Weight-Based Items"
                      secondary="Alert when weight falls below threshold"
                      sx={{ ml: 2 }}
                    />
                    <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormControl size="small" sx={{ width: '70px', mr: 1 }}>
                        <Select
                          value={selectedWeightUnit}
                          onChange={handleWeightUnitChange}
                          displayEmpty
                        >
                          <MenuItem value="kg">kg</MenuItem>
                          <MenuItem value="g">g</MenuItem>
                          <MenuItem value="lb">lb</MenuItem>
                          <MenuItem value="oz">oz</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        type="number"
                        size="small"
                        value={weightThresholds[selectedWeightUnit as keyof typeof weightThresholds]}
                        onChange={handleWeightThresholdChange}
                        InputProps={{
                          inputProps: {
                            min: 0,
                            step: selectedWeightUnit === 'g' ? 10 : 0.1
                          },
                          startAdornment: (
                            <InputAdornment position="start">
                              <Scale fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ width: '100px' }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </>
              )}
            </List>
          </Paper>
        </Grid2>

        {/* Display Settings */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Display Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List disablePadding>
              <ListItem>
                <ListItemIcon>
                  {defaultViewMode === 'grid' ? <GridViewIcon /> : <ListViewIcon />}
                </ListItemIcon>
                <ListItemText
                  primary="Default View Mode"
                  secondary="Choose how items are displayed in list screens"
                />
                <ListItemSecondaryAction>
                  <ToggleButtonGroup
                    value={defaultViewMode}
                    exclusive
                    onChange={handleViewModeChange}
                    size="small"
                  >
                    <ToggleButton value="grid">
                      <GridViewIcon fontSize="small" sx={{ mr: 0.5 }} /> Grid
                    </ToggleButton>
                    <ToggleButton value="list">
                      <ListViewIcon fontSize="small" sx={{ mr: 0.5 }} /> List
                    </ToggleButton>
                  </ToggleButtonGroup>
                </ListItemSecondaryAction>
              </ListItem>

              <Divider component="li" />

              <ListItem>
                <ListItemIcon>
                  <ViewModule />
                </ListItemIcon>
                <ListItemText
                  primary="Default Grouping"
                  secondary="How items are grouped in inventory lists"
                />
                <ListItemSecondaryAction>
                  <FormControl size="small" sx={{ width: 160 }}>
                    <Select
                      value={defaultGroupBy}
                      onChange={handleGroupByChange}
                    >
                      <MenuItem value="none">No Grouping</MenuItem>
                      <MenuItem value="itemType">By Item Type</MenuItem>
                      <MenuItem value="category">By Category</MenuItem>
                    </Select>
                  </FormControl>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid2>

        {/* Data Settings */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Data Management
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List disablePadding>
              <ListItem>
                <ListItemIcon>
                  <Storage />
                </ListItemIcon>
                <ListItemText
                  primary="Usage Data"
                  secondary="Store application usage data locally"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked
                    disabled
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <Divider component="li" />

              <ListItem>
                <ListItemIcon>
                  <Backup />
                </ListItemIcon>
                <ListItemText
                  primary="Data Backup"
                  secondary="Automatic backups of your business data"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={dataBackup}
                    onChange={handleToggleDataBackup}
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <Divider component="li" />

              <ListItem>
                <ListItemIcon>
                  <LinkIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Item Relationships"
                  secondary="Rebuild product-material relationships"
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleRebuildRelationships}
                    disabled={rebuildingRelationships}
                    startIcon={rebuildingRelationships ? <CircularProgress size={20} /> : <Sync />}
                    size="small"
                  >
                    {rebuildingRelationships ? 'Rebuilding...' : 'Rebuild'}
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>

              <Divider component="li" />

              {/* Add new list item for inventory rebuild */}
              <ListItem>
                <ListItemIcon>
                  <Calculate />
                </ListItemIcon>
                <ListItemText
                  primary="Inventory Quantities"
                  secondary="Rebuild inventory quantities, cost, and prices from purchase and sales history"
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setShowRebuildDialog(true)}
                    disabled={rebuildingInventory}
                    startIcon={rebuildingInventory ? <CircularProgress size={20} /> : <StackedBarChart />}
                    size="small"
                  >
                    {rebuildingInventory ? 'Rebuilding...' : 'Rebuild'}
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>

            {/* Show rebuild results if available */}
            {rebuildResults && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Inventory Rebuild Results:</Typography>
                <Typography variant="body2">
                  {rebuildResults.processed} items processed, {rebuildResults.updated} items updated, {rebuildResults.errors} errors
                </Typography>
              </Alert>
            )}
          </Paper>
        </Grid2>

        {/* Security Settings */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Security & Privacy
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List disablePadding>
              <ListItem>
                <ListItemIcon>
                  <Security />
                </ListItemIcon>
                <ListItemText
                  primary="Account Security"
                  secondary="Set up two-factor authentication and other security settings"
                />
                <ListItemSecondaryAction>
                  <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    Coming soon
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid2>

        {/* Version Info */}
        <Grid2 size={{ xs: 12 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" gutterBottom>
              BizTracker v1.0.0
            </Typography>
            <Typography color="text.secondary" variant="body2">
              © 2023 BizTracker. All rights reserved.
            </Typography>
          </Paper>
        </Grid2>
      </Grid2>

      {/* Add confirmation dialog for inventory rebuild */}
      <Dialog
        open={showRebuildDialog}
        onClose={() => setShowRebuildDialog(false)}
      >
        <DialogTitle>Rebuild Inventory</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will recalculate all inventory quantities, costs, and prices based on your purchase and sales history.
            Purchase data will only be used if the status is "received" and sales data will only be used if the status is "completed".
            <br /><br />
            Cost values will be updated based on the most recent purchase for each item.
            <br /><br />
            This operation may take some time to complete. Do you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRebuildDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRebuildInventory}
            variant="contained"
            color="primary"
            startIcon={<StackedBarChart />}
          >
            Rebuild Inventory
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
