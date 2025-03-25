import { useState, useEffect } from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Container,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  PieChart as SalesReportsIcon,
  ShoppingBag as PurchasesIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Receipt as PurchaseReportsIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import { useAppContext } from '@context/AppContext';

const drawerWidth = 240;

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const location = useLocation();
  const theme = useTheme();
  const { toggleColorMode } = useAppContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Close drawer when route changes on mobile
  useEffect(() => {
    if (isMobile && drawerOpen) {
      setDrawerOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Set initial drawer state based on screen size
  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" noWrap component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
          BizTracker
        </Typography>
        {!isMobile && (
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/" selected={isActive('/')}>
            <ListItemIcon>
              <DashboardIcon color={isActive('/') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/inventory" selected={isActive('/inventory')}>
            <ListItemIcon>
              <InventoryIcon color={isActive('/inventory') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Inventory" />
          </ListItemButton>
        </ListItem>
        {/* Purchases Menu Items */}
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/purchases" selected={isActive('/purchases')}>
            <ListItemIcon>
              <PurchasesIcon color={isActive('/purchases') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Purchases" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/purchases/reports" selected={isActive('/purchases/reports')}>
            <ListItemIcon>
              <PurchaseReportsIcon color={isActive('/purchases/reports') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Purchase Reports" />
          </ListItemButton>
        </ListItem>
        {/* Sales Menu Items */}
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/sales" selected={isActive('/sales')}>
            <ListItemIcon>
              <ShoppingCartIcon color={isActive('/sales') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Sales" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/sales/reports" selected={isActive('/sales/reports')}>
            <ListItemIcon>
              <SalesReportsIcon color={isActive('/sales/reports') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Sales Reports" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/settings" onClick={toggleDrawer}>
            <ListItemIcon>
              <SettingsIcon  color={isActive('/settings') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: drawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { md: drawerOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            BizTracker
          </Typography>
          <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
            {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Desktop: Persistent drawer */}
      {!isMobile && (
        <Drawer
          variant="persistent"
          open={drawerOpen}
          sx={{
            width: 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Mobile: Temporary drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={toggleDrawer}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main content - shifts when drawer opens/closes */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          ml: { md: drawerOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}