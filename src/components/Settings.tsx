import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  Select,
  MenuItem,
  TextField,
  Button,
  FormControl,
  FormGroup,
  FormControlLabel,
  InputLabel,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Stack,
  Tab,
  Tabs,
  InputAdornment,
  alpha,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  Slider
} from '@mui/material';

import {
  Save as SaveIcon,
  Refresh as ResetIcon,
  SettingsBackupRestore as RestoreIcon,
  ExpandMore,
  ColorLens,
  Notifications,
  Storage,
  ViewModule,
  Inventory2,
  Business,
  CurrencyExchange,
  BugReport,
  Language,
  Security,
  Email,
  Check,
  Info as InfoIcon
} from '@mui/icons-material';
import LoadingScreen from '@components/ui/LoadingScreen';
import { useAppContext } from '@hooks/useAppContext';
import { useSettings, SettingsContextType } from '@hooks/useSettings';
import { useRebuildRelationships, useRebuildInventory } from '@hooks/useItems';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const { theme, toggleColorMode } = useAppContext();
  const { settings, updateSettings, defaultSettings, loadSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<SettingsContextType['settings'] | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
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

  // Initialize local settings once the context settings are loaded
  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings({ ...settings });
    }
  }, [settings]);

  // if (!localSettings) {
  //   return <LoadingScreen message="Loading settings..." />;
  // }

  const handleInputChange = (path: string[], value: any) => {
    setLocalSettings((prev) => {
      if (!prev) return null;

      // Create a deep copy of previous settings
      const newSettings = JSON.parse(JSON.stringify(prev));

      // Navigate to the nested property
      let current = newSettings;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }

      // Set the value
      current[path[path.length - 1]] = value;

      return newSettings;
    });
  };

  const handleSaveSettings = () => {
    if (localSettings) {
      updateSettings(localSettings);
      setSuccessMessage('Settings saved successfully');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    }
  };

  const handleResetSettings = () => {
    if (defaultSettings) {
      setLocalSettings({ ...defaultSettings });
      setSuccessMessage('Settings reset to defaults');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    }
  };

  const handleChangeTab = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      'lowStockAlertsEnabled': 'Enable notifications for low stock items',
      'quantityThreshold': 'Minimum quantity before low stock alert',
      'defaultViewMode': 'Default view mode for inventory list',
      'defaultGroupBy': 'Default grouping for inventory items',
      'weightThresholds': 'Minimum weight before low stock alert',
      'companyName': 'Your business name used in reports and documents',
      'companyLogo': 'Logo URL for your business branding',
      'currency': 'Default currency for prices and transactions',
      'dateFormat': 'Format for displaying dates',
      'timeFormat': 'Format for displaying times',
      'taxRate': 'Default tax rate for sales',
      'enableDarkMode': 'Toggle between light and dark theme',
      'enableNotifications': 'Enable system notifications',
      'autoSave': 'Automatically save entries while editing'
    };

    return descriptions[key] || '';
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
    <Box className="fade-in">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure application preferences and defaults
          </Typography>
        </Box>

        <Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RestoreIcon />}
              onClick={handleResetSettings}
            >
              Reset to Defaults
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
            >
              Save Settings
            </Button>
          </Stack>
        </Box>
      </Box>

      {successMessage && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            animation: 'fadeIn 0.5s ease',
            boxShadow: 2,
            borderRadius: 1
          }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={handleChangeTab}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab
              icon={<Inventory2 fontSize="small" />}
              iconPosition="start"
              label="Inventory"
              sx={{ textTransform: 'none', fontWeight: 'medium' }}
            />
            <Tab
              icon={<Business fontSize="small" />}
              iconPosition="start"
              label="Company"
              sx={{ textTransform: 'none', fontWeight: 'medium' }}
            />
            <Tab
              icon={<CurrencyExchange fontSize="small" />}
              iconPosition="start"
              label="Sales & Taxes"
              sx={{ textTransform: 'none', fontWeight: 'medium' }}
            />
            <Tab
              icon={<ViewModule fontSize="small" />}
              iconPosition="start"
              label="Display"
              sx={{ textTransform: 'none', fontWeight: 'medium' }}
            />
            <Tab
              icon={<Notifications fontSize="small" />}
              iconPosition="start"
              label="Notifications"
              sx={{ textTransform: 'none', fontWeight: 'medium' }}
            />
            <Tab
              icon={<Storage fontSize="small" />}
              iconPosition="start"
              label="Data & Storage"
              sx={{ textTransform: 'none', fontWeight: 'medium' }}
            />
            <Tab
              icon={<BugReport fontSize="small" />}
              iconPosition="start"
              label="Advanced"
              sx={{ textTransform: 'none', fontWeight: 'medium' }}
            />
          </Tabs>
        </Box>

        {/* Inventory Settings */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                <CardHeader
                  title="Stock Management"
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                />
                <Divider />
                <CardContent>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.lowStockAlertsEnabled}
                          onChange={(e) => handleInputChange(['lowStockAlertsEnabled'], e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography>Low Stock Alerts</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getSettingDescription('lowStockAlertsEnabled')}
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      label="Quantity Threshold"
                      type="number"
                      value={localSettings.quantityThreshold}
                      onChange={(e) => handleInputChange(['quantityThreshold'], parseInt(e.target.value))}
                      helperText={getSettingDescription('quantityThreshold')}
                      disabled={!localSettings.lowStockAlertsEnabled}
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">units</InputAdornment>
                        ),
                      }}
                      sx={{ mb: 3 }}
                    />

                    <Typography variant="subtitle2" gutterBottom>
                      Weight Thresholds
                    </Typography>
                    <Box sx={{ pl: 2, pb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Kilograms (kg)"
                            type="number"
                            value={localSettings.weightThresholds.kg}
                            onChange={(e) => handleInputChange(['weightThresholds', 'kg'], parseFloat(e.target.value))}
                            disabled={!localSettings.lowStockAlertsEnabled}
                            fullWidth
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">kg</InputAdornment>
                              ),
                            }}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Grams (g)"
                            type="number"
                            value={localSettings.weightThresholds.g}
                            onChange={(e) => handleInputChange(['weightThresholds', 'g'], parseFloat(e.target.value))}
                            disabled={!localSettings.lowStockAlertsEnabled}
                            fullWidth
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">g</InputAdornment>
                              ),
                            }}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Pounds (lb)"
                            type="number"
                            value={localSettings.weightThresholds.lb}
                            onChange={(e) => handleInputChange(['weightThresholds', 'lb'], parseFloat(e.target.value))}
                            disabled={!localSettings.lowStockAlertsEnabled}
                            fullWidth
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">lb</InputAdornment>
                              ),
                            }}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Ounces (oz)"
                            type="number"
                            value={localSettings.weightThresholds.oz}
                            onChange={(e) => handleInputChange(['weightThresholds', 'oz'], parseFloat(e.target.value))}
                            disabled={!localSettings.lowStockAlertsEnabled}
                            fullWidth
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">oz</InputAdornment>
                              ),
                            }}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </FormGroup>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                <CardHeader
                  title="Inventory Display"
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                />
                <Divider />
                <CardContent>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Default View Mode</InputLabel>
                    <Select
                      value={localSettings.defaultViewMode}
                      onChange={(e) => handleInputChange(['defaultViewMode'], e.target.value as 'grid' | 'list')}
                      label="Default View Mode"
                    >
                      <MenuItem value="grid">Grid</MenuItem>
                      <MenuItem value="list">List</MenuItem>
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
                      {getSettingDescription('defaultViewMode')}
                    </Typography>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Default Group By</InputLabel>
                    <Select
                      value={localSettings.defaultGroupBy}
                      onChange={(e) => handleInputChange(['defaultGroupBy'], e.target.value as 'none' | 'category' | 'itemType')}
                      label="Default Group By"
                    >
                      <MenuItem value="none">No Grouping</MenuItem>
                      <MenuItem value="category">Category</MenuItem>
                      <MenuItem value="itemType">Item Type</MenuItem>
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
                      {getSettingDescription('defaultGroupBy')}
                    </Typography>
                  </FormControl>

                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Item Categories
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Define default categories for new inventory items
                    </Typography>
                    <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
                      <Typography variant="body2" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <InfoIcon fontSize="small" sx={{ mr: 1 }} />
                        Category management will be available in future updates
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardHeader
                  title="Inventory Automation"
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={localSettings.autoUpdateStock || false}
                            onChange={(e) => handleInputChange(['autoUpdateStock'], e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography>Auto-update Stock from Sales</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Automatically decrease inventory when sales are created
                            </Typography>
                          </Box>
                        }
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={localSettings.autoUpdateFromPurchases || false}
                            onChange={(e) => handleInputChange(['autoUpdateFromPurchases'], e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography>Auto-update Stock from Purchases</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Automatically increase inventory when purchases are received
                            </Typography>
                          </Box>
                        }
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Company Settings */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardHeader
                  title="Company Information"
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                />
                <Divider />
                <CardContent>
                  <TextField
                    label="Company Name"
                    value={localSettings.companyName || ''}
                    onChange={(e) => handleInputChange(['companyName'], e.target.value)}
                    fullWidth
                    helperText="Used in invoices, receipts, and reports"
                    sx={{ mb: 3 }}
                  />

                  <TextField
                    label="Company Logo URL"
                    value={localSettings.companyLogo || ''}
                    onChange={(e) => handleInputChange(['companyLogo'], e.target.value)}
                    fullWidth
                    helperText="URL to your company's logo"
                    sx={{ mb: 3 }}
                  />

                  <TextField
                    label="Contact Email"
                    value={localSettings.contactEmail || ''}
                    onChange={(e) => handleInputChange(['contactEmail'], e.target.value)}
                    fullWidth
                    helperText="Primary contact email for your business"
                    sx={{ mb: 3 }}
                  />

                  <TextField
                    label="Contact Phone"
                    value={localSettings.contactPhone || ''}
                    onChange={(e) => handleInputChange(['contactPhone'], e.target.value)}
                    fullWidth
                    helperText="Primary contact phone for your business"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardHeader
                  title="Address"
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                />
                <Divider />
                <CardContent>
                  <TextField
                    label="Street Address"
                    value={localSettings.address?.street || ''}
                    onChange={(e) => handleInputChange(['address', 'street'], e.target.value)}
                    fullWidth
                    sx={{ mb: 3 }}
                  />

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="City"
                        value={localSettings.address?.city || ''}
                        onChange={(e) => handleInputChange(['address', 'city'], e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="State/Province"
                        value={localSettings.address?.state || ''}
                        onChange={(e) => handleInputChange(['address', 'state'], e.target.value)}
                        fullWidth
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Postal/ZIP Code"
                        value={localSettings.address?.postal || ''}
                        onChange={(e) => handleInputChange(['address', 'postal'], e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Country"
                        value={localSettings.address?.country || ''}
                        onChange={(e) => handleInputChange(['address', 'country'], e.target.value)}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Sales & Taxes */}
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardHeader
                  title="Sales Settings"
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                />
                <Divider />
                <CardContent>
                  <TextField
                    label="Currency"
                    value={localSettings.currency || 'USD'}
                    onChange={(e) => handleInputChange(['currency'], e.target.value)}
                    select
                    fullWidth
                    helperText="Default currency for all transactions"
                    sx={{ mb: 3 }}
                  >
                    <MenuItem value="USD">US Dollar (USD)</MenuItem>
                    <MenuItem value="EUR">Euro (EUR)</MenuItem>
                    <MenuItem value="GBP">British Pound (GBP)</MenuItem>
                    <MenuItem value="CAD">Canadian Dollar (CAD)</MenuItem>
                    <MenuItem value="AUD">Australian Dollar (AUD)</MenuItem>
                    <MenuItem value="JPY">Japanese Yen (JPY)</MenuItem>
                  </TextField>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.includeTaxInPrice || false}
                        onChange={(e) => handleInputChange(['includeTaxInPrice'], e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography>Include Tax in Price</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Display prices with tax included by default
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 3, display: 'block' }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.sendReceiptEmail || false}
                        onChange={(e) => handleInputChange(['sendReceiptEmail'], e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography>Send Receipt Emails</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Automatically email receipts to customers
                        </Typography>
                      </Box>
                    }
                    sx={{ display: 'block' }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardHeader
                  title="Tax Settings"
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                />
                <Divider />
                <CardContent>
                  <TextField
                    label="Default Tax Rate (%)"
                    type="number"
                    value={localSettings.taxRate || 0}
                    onChange={(e) => handleInputChange(['taxRate'], parseFloat(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    fullWidth
                    helperText="Default tax rate applied to sales"
                    sx={{ mb: 3 }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.enableTaxExemptions || false}
                        onChange={(e) => handleInputChange(['enableTaxExemptions'], e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography>Enable Tax Exemptions</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Allow marking customers as tax exempt
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 3, display: 'block' }}
                  />

                  <TextField
                    label="Tax ID / VAT Number"
                    value={localSettings.taxId || ''}
                    onChange={(e) => handleInputChange(['taxId'], e.target.value)}
                    fullWidth
                    helperText="Your business tax identification number"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Display Settings */}
        <TabPanel value={currentTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardHeader
                  title="Theme & Appearance"
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                />
                <Divider />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.enableDarkMode || false}
                        onChange={(e) => handleInputChange(['enableDarkMode'], e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography>Dark Mode</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Use dark theme throughout the application
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 3, display: 'block' }}
                  />

                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>Primary Color</Typography>
                    <Stack direction="row" spacing={1}>
                      {['#1976d2', '#2e7d32', '#d32f2f', '#7b1fa2', '#ed6c02', '#0288d1'].map((color) => (
                        <Tooltip key={color} title={color}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: color,
                              borderRadius: 1,
                              cursor: 'pointer',
                              border: color === (localSettings.primaryColor || '#1976d2') ? '3px solid white' : 'none',
                              outline: color === (localSettings.primaryColor || '#1976d2') ? `2px solid ${color}` : 'none',
                              '&:hover': {
                                opacity: 0.8,
                              },
                            }}
                            onClick={() => handleInputChange(['primaryColor'], color)}
                          />
                        </Tooltip>
                      ))}
                    </Stack>
                  </Box>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Date Format</InputLabel>
                    <Select
                      value={localSettings.dateFormat || 'MM/DD/YYYY'}
                      onChange={(e) => handleInputChange(['dateFormat'], e.target.value)}
                      label="Date Format"
                    >
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                      <MenuItem value="YYYY/MM/DD">YYYY/MM/DD</MenuItem>
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
                      Format for displaying dates throughout the application
                    </Typography>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Time Format</InputLabel>
                    <Select
                      value={localSettings.timeFormat || '12h'}
                      onChange={(e) => handleInputChange(['timeFormat'], e.target.value)}
                      label="Time Format"
                    >
                      <MenuItem value="12h">12-hour (AM/PM)</MenuItem>
                      <MenuItem value="24h">24-hour</MenuItem>
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
                      Format for displaying times throughout the application
                    </Typography>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardHeader
                  title="Language & Localization"
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                />
                <Divider />
                <CardContent>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={localSettings.language || 'en-US'}
                      onChange={(e) => handleInputChange(['language'], e.target.value)}
                      label="Language"
                    >
                      <MenuItem value="en-US">English (US)</MenuItem>
                      <MenuItem value="en-GB">English (UK)</MenuItem>
                      <MenuItem value="es">Español</MenuItem>
                      <MenuItem value="fr">Français</MenuItem>
                      <MenuItem value="de">Deutsch</MenuItem>
                      <MenuItem value="zh">中文</MenuItem>
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
                      Application display language
                    </Typography>
                  </FormControl>

                  <Box
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.info.main, 0.05),
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <InfoIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Some language options may be limited in the current version. Full localization coming in future updates.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ mt: 3, borderRadius: 2 }}>
                <CardHeader
                  title="Report & Export Settings"
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                />
                <Divider />
                <CardContent>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Default Report Period</InputLabel>
                    <Select
                      value={localSettings.defaultReportPeriod || 'month'}
                      onChange={(e) => handleInputChange(['defaultReportPeriod'], e.target.value)}
                      label="Default Report Period"
                    >
                      <MenuItem value="day">Day</MenuItem>
                      <MenuItem value="week">Week</MenuItem>
                      <MenuItem value="month">Month</MenuItem>
                      <MenuItem value="quarter">Quarter</MenuItem>
                      <MenuItem value="year">Year</MenuItem>
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
                      Default time period for reports
                    </Typography>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>CSV Export Delimiter</InputLabel>
                    <Select
                      value={localSettings.csvDelimiter || ','}
                      onChange={(e) => handleInputChange(['csvDelimiter'], e.target.value)}
                      label="CSV Export Delimiter"
                    >
                      <MenuItem value=",">Comma (,)</MenuItem>
                      <MenuItem value=";">Semicolon (;)</MenuItem>
                      <MenuItem value="\t">Tab (\t)</MenuItem>
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
                      Delimiter used when exporting data to CSV format
                    </Typography>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Settings */}
        <TabPanel value={currentTab} index={4}>
          <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
            <CardHeader
              title="Notification Preferences"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
            />
            <Divider />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.enableNotifications || false}
                    onChange={(e) => handleInputChange(['enableNotifications'], e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography>Enable Notifications</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Show system notifications for important events
                    </Typography>
                  </Box>
                }
                sx={{ mb: 3, display: 'block' }}
              />

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Notify me about:
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.notifyLowStock || false}
                        onChange={(e) => handleInputChange(['notifyLowStock'], e.target.checked)}
                        disabled={!localSettings.enableNotifications}
                        color="primary"
                      />
                    }
                    label="Low stock items"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.notifyNewSales || false}
                        onChange={(e) => handleInputChange(['notifyNewSales'], e.target.checked)}
                        disabled={!localSettings.enableNotifications}
                        color="primary"
                      />
                    }
                    label="New sales"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.notifyNewPurchases || false}
                        onChange={(e) => handleInputChange(['notifyNewPurchases'], e.target.checked)}
                        disabled={!localSettings.enableNotifications}
                        color="primary"
                      />
                    }
                    label="New purchases"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.notifySystem || false}
                        onChange={(e) => handleInputChange(['notifySystem'], e.target.checked)}
                        disabled={!localSettings.enableNotifications}
                        color="primary"
                      />
                    }
                    label="System updates"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardHeader
              title="Email Notifications"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
            />
            <Divider />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.enableEmailNotifications || false}
                    onChange={(e) => handleInputChange(['enableEmailNotifications'], e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography>Email Notifications</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive important notifications via email
                    </Typography>
                  </Box>
                }
                sx={{ mb: 3, display: 'block' }}
              />

              <TextField
                label="Notification Email Address"
                type="email"
                value={localSettings.notificationEmail || ''}
                onChange={(e) => handleInputChange(['notificationEmail'], e.target.value)}
                disabled={!localSettings.enableEmailNotifications}
                fullWidth
                helperText="Email address for receiving notifications"
                sx={{ mb: 3 }}
              />

              <FormControl fullWidth>
                <InputLabel>Notification Frequency</InputLabel>
                <Select
                  value={localSettings.emailFrequency || 'realtime'}
                  onChange={(e) => handleInputChange(['emailFrequency'], e.target.value)}
                  disabled={!localSettings.enableEmailNotifications}
                  label="Notification Frequency"
                >
                  <MenuItem value="realtime">Real-time</MenuItem>
                  <MenuItem value="daily">Daily Digest</MenuItem>
                  <MenuItem value="weekly">Weekly Summary</MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
                  How often to receive email notifications
                </Typography>
              </FormControl>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Data & Storage */}
        <TabPanel value={currentTab} index={5}>
          <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
            <CardHeader
              title="Data Storage & Backup"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
            />
            <Divider />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.autoSave || true}
                    onChange={(e) => handleInputChange(['autoSave'], e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography>Auto-Save</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Automatically save changes while editing
                    </Typography>
                  </Box>
                }
                sx={{ mb: 3, display: 'block' }}
              />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Auto-Backup Frequency</InputLabel>
                <Select
                  value={localSettings.backupFrequency || 'weekly'}
                  onChange={(e) => handleInputChange(['backupFrequency'], e.target.value)}
                  label="Auto-Backup Frequency"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="never">Never</MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
                  How often to create automatic data backups
                </Typography>
              </FormControl>

              <TextField
                label="Backup Location"
                value={localSettings.backupLocation || ''}
                onChange={(e) => handleInputChange(['backupLocation'], e.target.value)}
                fullWidth
                helperText="Path where backups will be stored (leave empty for default)"
                sx={{ mb: 3 }}
              />

              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled // Would be enabled in a real implementation
                >
                  Backup Now
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ResetIcon />}
                  disabled // Would be enabled in a real implementation
                >
                  Restore Backup
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardHeader
              title="Data Management"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              sx={{ color: theme.palette.error.main }}
            />
            <Divider />
            <CardContent>
              <Typography variant="body2" paragraph>
                These actions affect your data permanently and cannot be undone.
              </Typography>

              <Stack direction="row" spacing={2}>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleRebuildRelationships}
                    disabled={rebuildingRelationships}
                    startIcon={rebuildingRelationships ? <CircularProgress size={20} /> : <Sync />}
                    size="small"
                  >
                    {rebuildingRelationships ? 'Rebuilding...' : 'Rebuild product-material relationships'}
                  </Button>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setShowRebuildDialog(true)}
                    disabled={rebuildingInventory}
                    startIcon={rebuildingInventory ? <CircularProgress size={20} /> : <StackedBarChart />}
                    size="small"
                  >
                    {rebuildingInventory ? 'Rebuilding...' : 'Rebuild inventory quantities, cost, and prices'}
                  </Button>
                <Button
                  variant="outlined"
                  color="error"
                  disabled // Would be enabled with confirmation dialog in real implementation
                >
                  Clear All Sales Data
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  disabled // Would be enabled with confirmation dialog in real implementation
                >
                  Reset All Settings
                </Button>
              </Stack>
            {/* Show rebuild results if available */}
            {rebuildResults && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Inventory Rebuild Results:</Typography>
                <Typography variant="body2">
                  {rebuildResults.processed} items processed, {rebuildResults.updated} items updated, {rebuildResults.errors} errors
                </Typography>
              </Alert>
            )}
            </CardContent>
          </Card>
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
        </TabPanel>

        {/* Advanced Settings */}
        <TabPanel value={currentTab} index={6}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">Warning: Advanced Settings</Typography>
            <Typography variant="body2">
              Changes to these settings may affect application performance and functionality.
              Only modify if you understand the implications.
            </Typography>
          </Alert>

          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography fontWeight="bold">Application Performance</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Data Caching Duration
                  </Typography>
                  <Slider
                    value={localSettings.cacheDuration || 5}
                    onChange={(_e, value) => handleInputChange(['cacheDuration'], value as number)}
                    aria-labelledby="cache-duration-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={1}
                    max={30}
                    valueLabelFormat={value => `${value} min`}
                    sx={{ mb: 3 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Time in minutes to cache data before refreshing from server
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.enablePerformanceMode || false}
                        onChange={(e) => handleInputChange(['enablePerformanceMode'], e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography>Performance Mode</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Optimize for performance on slower devices (reduces animations)
                        </Typography>
                      </Box>
                    }
                    sx={{ display: 'block' }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography fontWeight="bold">Developer Options</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.debugMode || false}
                    onChange={(e) => handleInputChange(['debugMode'], e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography>Debug Mode</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Enable logging of additional debugging information
                    </Typography>
                  </Box>
                }
                sx={{ mb: 3, display: 'block' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.enableDevtools || false}
                    onChange={(e) => handleInputChange(['enableDevtools'], e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography>Advanced Developer Tools</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Enable additional developer tooling and diagnostics
                    </Typography>
                  </Box>
                }
                sx={{ display: 'block' }}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography fontWeight="bold">Experimental Features</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="info" sx={{ mb: 3 }}>
                These features are still in development and may not be fully functional.
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.enableExperimentalFeatures || false}
                        onChange={(e) => handleInputChange(['enableExperimentalFeatures'], e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Enable Experimental Features"
                  />
                </Grid>

                {localSettings.enableExperimentalFeatures && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={localSettings.enableBarcodeScanner || false}
                            onChange={(e) => handleInputChange(['enableBarcodeScanner'], e.target.checked)}
                            color="primary"
                            disabled={!localSettings.enableExperimentalFeatures}
                          />
                        }
                        label={
                          <Box>
                            <Typography>Barcode Scanner</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Use camera to scan barcodes
                            </Typography>
                          </Box>
                        }
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={localSettings.enableAIRecommendations || false}
                            onChange={(e) => handleInputChange(['enableAIRecommendations'], e.target.checked)}
                            color="primary"
                            disabled={!localSettings.enableExperimentalFeatures}
                          />
                        }
                        label={
                          <Box>
                            <Typography>AI Inventory Recommendations</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Get smart reorder suggestions
                            </Typography>
                          </Box>
                        }
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </TabPanel>
      </Paper>
    </Box>
  );
}