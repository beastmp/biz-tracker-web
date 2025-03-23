import { Outlet } from 'react-router-dom';
import { AppBar, Box, Container, IconButton, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Menu as MenuIcon, Brightness4, Brightness7, Dashboard, Inventory, PieChart, ShoppingCart, Settings } from '@mui/icons-material';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export default function Layout({ toggleTheme, isDarkMode }: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BizTracker
          </Typography>
          <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem button component={Link} to="/dashboard" onClick={toggleDrawer}>
              <ListItemIcon>
                <Dashboard />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button component={Link} to="/inventory" onClick={toggleDrawer}>
              <ListItemIcon>
                <Inventory />
              </ListItemIcon>
              <ListItemText primary="Inventory" />
            </ListItem>
            
            {/* Sales Menu Items */}
            <ListItem button component={Link} to="/sales" onClick={toggleDrawer}>
              <ListItemIcon>
                <ShoppingCart />
              </ListItemIcon>
              <ListItemText primary="Sales" />
            </ListItem>
            <ListItem button component={Link} to="/sales/reports" onClick={toggleDrawer}>
              <ListItemIcon>
                <PieChart />
              </ListItemIcon>
              <ListItemText primary="Sales Reports" />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem button component={Link} to="/settings" onClick={toggleDrawer}>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 10 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}