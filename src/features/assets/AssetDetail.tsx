import { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Grid2
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Build,
  CalendarToday,
  Place,
  Person,
  BusinessCenter,
  Receipt,
  AttachMoney,
  Add,
  NoPhotography,
  Handyman,
  Clear,
  Insurance,
  Category
} from '@mui/icons-material';
import { useAsset, useDeleteAsset, useAddMaintenanceRecord } from '@hooks/useAssets';
import { formatCurrency, formatDate } from '@utils/formatters';
import LoadingScreen from '@components/ui/LoadingScreen';
import ErrorFallback from '@components/ui/ErrorFallback';
import { SelectChangeEvent } from '@mui/material/Select';

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading, error } = useAsset(id);
  const deleteAsset = useDeleteAsset();
  const addMaintenanceRecord = useAddMaintenanceRecord();

  // State for maintenance dialog
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: 0,
    performedBy: '',
    frequency: 'monthly'
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this asset?')) {
      return;
    }

    try {
      await deleteAsset.mutateAsync(id);
      navigate('/assets');
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const handleMaintenanceFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMaintenanceForm({
      ...maintenanceForm,
      [name]: name === 'cost' ? parseFloat(value) : value
    });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setMaintenanceForm({
      ...maintenanceForm,
      [name]: value
    });
  };

  const submitMaintenanceForm = async () => {
    if (!id) return;

    try {
      await addMaintenanceRecord.mutateAsync({
        assetId: id,
        ...maintenanceForm
      });

      setMaintenanceDialogOpen(false);
      setSuccessMessage('Maintenance record added successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset form
      setMaintenanceForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        cost: 0,
        performedBy: '',
        frequency: 'monthly'
      });
    } catch (error) {
      console.error('Failed to add maintenance record:', error);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !asset) {
    return <ErrorFallback error={error as Error} message="Failed to load asset" />;
  }

  return (
    <Box>
      {/* Header with navigation and actions */}
      <Box sx={{ mb: 3 }}>
        <Grid2 container alignItems="center" spacing={2}>
          <Grid2 size="grow">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                component={RouterLink}
                to="/assets"
                startIcon={<ArrowBack />}
                variant="outlined"
                size="small"
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Typography variant="h4" component="h1">
                {asset.name}
              </Typography>
              <Chip
                label={asset.status}
                color={
                  asset.status === 'active' ? 'success' :
                  asset.status === 'maintenance' ? 'warning' :
                  'error'
                }
                variant="outlined"
              />
            </Box>
            {asset.assetTag && (
              <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
                Asset Tag: {asset.assetTag}
              </Typography>
            )}
          </Grid2>
          <Grid2>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Build />}
                onClick={() => setMaintenanceDialogOpen(true)}
              >
                Add Maintenance
              </Button>
              <Button
                component={RouterLink}
                to={`/assets/${id}/edit`}
                startIcon={<Edit />}
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
              <Button
                onClick={handleDelete}
                startIcon={<Delete />}
                variant="outlined"
                color="error"
              >
                Delete
              </Button>
            </Stack>
          </Grid2>
        </Grid2>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left column - Main details */}
        <Grid item xs={12} md={8}>
          {/* Asset Image */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            {asset.imageUrl ? (
              <Box
                sx={{
                  height: 300,
                  backgroundImage: `url(${asset.imageUrl})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  borderRadius: 1
                }}
              />
            ) : (
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1
                }}
              >
                <NoPhotography sx={{ fontSize: 60, color: '#cccccc', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No image available
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Asset Details */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <BusinessCenter sx={{ mr: 1, fontSize: 20 }} />
              Asset Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                <Typography variant="body1">{asset.category}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Typography variant="body1">
                  <Chip
                    label={asset.status}
                    size="small"
                    color={
                      asset.status === 'active' ? 'success' :
                      asset.status === 'maintenance' ? 'warning' :
                      'error'
                    }
                  />
                </Typography>
              </Grid>

              {asset.manufacturer && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Manufacturer</Typography>
                  <Typography variant="body1">{asset.manufacturer}</Typography>
                </Grid>
              )}

              {asset.model && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Model</Typography>
                  <Typography variant="body1">{asset.model}</Typography>
                </Grid>
              )}

              {asset.serialNumber && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Serial Number</Typography>
                  <Typography variant="body1">{asset.serialNumber}</Typography>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Purchase Date</Typography>
                <Typography variant="body1">
                  {asset.purchaseDate ? formatDate(asset.purchaseDate) : 'Not specified'}
                </Typography>
              </Grid>

              {asset.location && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                  <Typography variant="body1">{asset.location}</Typography>
                </Grid>
              )}

              {asset.assignedTo && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
                  <Typography variant="body1">{asset.assignedTo}</Typography>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Initial Cost</Typography>
                <Typography variant="body1" color="primary">{formatCurrency(asset.initialCost)}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Current Value</Typography>
                <Typography variant="body1">{formatCurrency(asset.currentValue)}</Typography>
              </Grid>

              {asset.purchaseId && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Purchase Reference</Typography>
                  <Button
                    component={RouterLink}
                    to={`/purchases/${typeof asset.purchaseId === 'string' ? asset.purchaseId : asset.purchaseId._id}`}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  >
                    View Purchase
                  </Button>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Maintenance Schedule */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Build sx={{ mr: 1, fontSize: 20 }} />
              Maintenance Schedule
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {asset.maintenanceSchedule ? (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Frequency</Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {asset.maintenanceSchedule.frequency}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Last Maintenance</Typography>
                    <Typography variant="body1">
                      {asset.maintenanceSchedule.lastMaintenance
                        ? formatDate(asset.maintenanceSchedule.lastMaintenance)
                        : 'Not yet maintained'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Next Maintenance Due</Typography>
                    <Typography variant="body1" color={
                      asset.maintenanceSchedule.nextMaintenance &&
                      new Date(asset.maintenanceSchedule.nextMaintenance) < new Date()
                        ? 'error.main'
                        : 'inherit'
                    }>
                      {asset.maintenanceSchedule.nextMaintenance
                        ? formatDate(asset.maintenanceSchedule.nextMaintenance)
                        : 'Not scheduled'}
                      {asset.maintenanceSchedule.nextMaintenance &&
                       new Date(asset.maintenanceSchedule.nextMaintenance) < new Date() &&
                        ' (Overdue)'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No maintenance schedule defined.
              </Typography>
            )}

            <Button
              variant="outlined"
              color="primary"
              startIcon={<Build />}
              onClick={() => setMaintenanceDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Add Maintenance Record
            </Button>
          </Paper>

          {/* Maintenance History */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Handyman sx={{ mr: 1, fontSize: 20 }} />
              Maintenance History
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {asset.maintenanceHistory && asset.maintenanceHistory.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Performed By</TableCell>
                      <TableCell align="right">Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...asset.maintenanceHistory].sort((a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                    ).map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>{record.description}</TableCell>
                        <TableCell>{record.performedBy}</TableCell>
                        <TableCell align="right">{formatCurrency(record.cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No maintenance records found.
              </Typography>
            )}
          </Paper>

          {/* Notes */}
          {asset.notes && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Category sx={{ mr: 1, fontSize: 20 }} />
                Notes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {asset.notes}
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={4}>
          {/* Financial Summary */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachMoney sx={{ mr: 1, fontSize: 20 }} />
              Financial Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Initial Cost</Typography>
              <Typography variant="h5" color="primary">{formatCurrency(asset.initialCost)}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Current Value</Typography>
              <Typography variant="h5">{formatCurrency(asset.currentValue)}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Depreciation</Typography>
              <Typography variant="h5" color={asset.currentValue < asset.initialCost ? "error" : "success"}>
                {formatCurrency(asset.currentValue - asset.initialCost)}
                <Typography variant="caption" sx={{ ml: 1 }}>
                  ({Math.round((asset.currentValue / asset.initialCost) * 100)}%)
                </Typography>
              </Typography>
            </Box>

            {asset.maintenanceHistory && asset.maintenanceHistory.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Total Maintenance Cost</Typography>
                <Typography variant="h5">
                  {formatCurrency(asset.maintenanceHistory.reduce((sum, record) => sum + record.cost, 0))}
                </Typography>
              </Box>
            )}

            <Box>
              <Typography variant="subtitle2" color="text.secondary">Total Cost of Ownership</Typography>
              <Typography variant="h5">
                {formatCurrency(
                  asset.initialCost +
                  (asset.maintenanceHistory ?
                    asset.maintenanceHistory.reduce((sum, record) => sum + record.cost, 0) : 0)
                )}
              </Typography>
            </Box>
          </Paper>

          {/* Tags */}
          {asset.tags && asset.tags.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Category sx={{ mr: 1, fontSize: 20 }} />
                Tags
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {asset.tags.map(tag => (
                  <Chip key={tag} label={tag} />
                ))}
              </Box>
            </Paper>
          )}

          {/* Insurance Information (placeholder) */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Insurance sx={{ mr: 1, fontSize: 20 }} />
              Insurance
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No insurance information available. Edit this asset to add insurance details.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Maintenance Dialog */}
      <Dialog open={maintenanceDialogOpen} onClose={() => setMaintenanceDialogOpen(false)}>
        <DialogTitle>Add Maintenance Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                name="date"
                type="date"
                value={maintenanceForm.date}
                onChange={handleMaintenanceFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={3}
                value={maintenanceForm.description}
                onChange={handleMaintenanceFormChange}
                placeholder="Describe the maintenance performed"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cost"
                name="cost"
                type="number"
                value={maintenanceForm.cost}
                onChange={handleMaintenanceFormChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Performed By"
                name="performedBy"
                value={maintenanceForm.performedBy}
                onChange={handleMaintenanceFormChange}
                placeholder="Name of person or company"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Maintenance Frequency</InputLabel>
                <Select
                  name="frequency"
                  value={maintenanceForm.frequency}
                  label="Maintenance Frequency"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaintenanceDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={submitMaintenanceForm}
            variant="contained"
            color="primary"
            disabled={!maintenanceForm.description || !maintenanceForm.performedBy}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
