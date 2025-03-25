import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  Notifications,
  Storage,
  Security,
  Backup
} from '@mui/icons-material';
import { useAppContext } from '@context/AppContext';

export default function Settings() {
  const { mode, toggleColorMode } = useAppContext();
  const [notifications, setNotifications] = useState(false);
  const [dataBackup, setDataBackup] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleToggleNotifications = () => {
    setNotifications(!notifications);
    setSuccessMessage('Notification settings updated');
  };

  const handleToggleDataBackup = () => {
    setDataBackup(!dataBackup);
    setSuccessMessage('Data backup settings updated');
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      <Typography color="text.secondary" paragraph>
        Manage your application preferences and settings
      </Typography>

      <Grid container spacing={3}>
        {/* Theme Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List disablePadding>
              <ListItem>
                <ListItemIcon>
                  {mode === 'dark' ? <DarkMode /> : <LightMode />}
                </ListItemIcon>
                <ListItemText
                  primary="Dark Mode"
                  secondary="Switch between light and dark theme"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={mode === 'dark'}
                    onChange={toggleColorMode}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Notifications Settings */}
        <Grid item xs={12} md={6}>
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
        </Grid>

        {/* Data Settings */}
        <Grid item xs={12} md={6}>
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
            </List>
          </Paper>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
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
        </Grid>

        {/* Version Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" gutterBottom>
              BizTracker v1.0.0
            </Typography>
            <Typography color="text.secondary" variant="body2">
              © 2023 BizTracker. All rights reserved.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

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
