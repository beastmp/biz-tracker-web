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
  useMediaQuery,
  ListSubheader,
  Collapse,
  Avatar,
  Tooltip,
  alpha
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
  ChevronLeft as ChevronLeftIcon,
  BusinessCenter as BusinessCenterIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  BrightnessAuto as BrightnessAutoIcon
} from '@mui/icons-material';
import { useAppContext } from '@hooks/useAppContext';

const drawerWidth = 260;

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [inventorySubmenuOpen, setInventorySubmenuOpen] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const { toggleColorMode, theme: themeMode } = useAppContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Close drawer when route changes on mobile
  useEffect(() => {
    if (isMobile && drawerOpen) {
      setDrawerOpen(false);
    }
  }, [location.pathname, isMobile, drawerOpen]);

  // Set initial drawer state based on screen size
  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  // Check if inventory or assets page is open to auto-expand the submenu
  useEffect(() => {
    if (location.pathname.startsWith('/inventory') || location.pathname.startsWith('/assets')) {
      setInventorySubmenuOpen(true);
    }
  }, [location.pathname]);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const toggleInventorySubmenu = () => {
    setInventorySubmenuOpen(!inventorySubmenuOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const drawer = (
    <div>
      <Box sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: alpha(theme.palette.primary.main, 0.08)
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 34,
              height: 34
            }}
          >
            B
          </Avatar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold',
              letterSpacing: 0.5
            }}
          >
            BizTracker
          </Typography>
        </Box>
        {!isMobile && (
          <IconButton onClick={toggleDrawer} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <Divider />

      <Box sx={{ mt: 1 }}>
        <List component="nav" sx={{ px: 1.5 }}>
          <ListItemButton
            component={RouterLink}
            to="/"
            selected={isActive('/')}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                }
              }
            }}
          >
            <ListItemIcon>
              <DashboardIcon color={isActive('/') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText
              primary="Dashboard"
              primaryTypographyProps={{
                fontWeight: isActive('/') ? 600 : 400
              }}
            />
          </ListItemButton>

          {/* Inventory and Assets section with submenu */}
          <ListItemButton
            onClick={toggleInventorySubmenu}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              bgcolor: (isActive('/inventory') || isActive('/assets')) && !inventorySubmenuOpen ?
                alpha(theme.palette.primary.main, 0.12) : 'transparent',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              }
            }}
          >
            <ListItemIcon>
              <InventoryIcon color={(isActive('/inventory') || isActive('/assets')) ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText
              primary="Items & Assets"
              primaryTypographyProps={{
                fontWeight: (isActive('/inventory') || isActive('/assets')) ? 600 : 400
              }}
            />
            {inventorySubmenuOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>

          <Collapse in={inventorySubmenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              <ListItemButton
                sx={{
                  pl: 2,
                  py: 0.75,
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.18),
                    }
                  }
                }}
                component={RouterLink}
                to="/inventory"
                selected={isActive('/inventory')}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <InventoryIcon
                    fontSize="small"
                    color={isActive('/inventory') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Inventory"
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive('/inventory') ? 600 : 400
                  }}
                />
              </ListItemButton>

              <ListItemButton
                sx={{
                  pl: 2,
                  py: 0.75,
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.18),
                    }
                  }
                }}
                component={RouterLink}
                to="/assets"
                selected={isActive('/assets')}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <BusinessCenterIcon
                    fontSize="small"
                    color={isActive('/assets') ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Business Assets"
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive('/assets') ? 600 : 400
                  }}
                />
              </ListItemButton>
            </List>
          </Collapse>

          {/* Purchases Menu Items */}
          <ListItemButton
            component={RouterLink}
            to="/purchases"
            selected={isActive('/purchases')}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                }
              }
            }}
          >
            <ListItemIcon>
              <PurchasesIcon color={isActive('/purchases') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText
              primary="Purchases"
              primaryTypographyProps={{
                fontWeight: isActive('/purchases') ? 600 : 400
              }}
            />
          </ListItemButton>

          <ListItemButton
            component={RouterLink}
            to="/purchases/reports"
            selected={isActive('/purchases/reports')}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                }
              }
            }}
          >
            <ListItemIcon>
              <PurchaseReportsIcon color={isActive('/purchases/reports') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText
              primary="Purchase Reports"
              primaryTypographyProps={{
                fontWeight: isActive('/purchases/reports') ? 600 : 400
              }}
            />
          </ListItemButton>

          {/* Sales Menu Items */}
          <ListItemButton
            component={RouterLink}
            to="/sales"
            selected={isActive('/sales')}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                }
              }
            }}
          >
            <ListItemIcon>
              <ShoppingCartIcon color={isActive('/sales') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText
              primary="Sales"
              primaryTypographyProps={{
                fontWeight: isActive('/sales') ? 600 : 400
              }}
            />
          </ListItemButton>

          <ListItemButton
            component={RouterLink}
            to="/sales/reports"
            selected={isActive('/sales/reports')}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                }
              }
            }}
          >
            <ListItemIcon>
              <SalesReportsIcon color={isActive('/sales/reports') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText
              primary="Sales Reports"
              primaryTypographyProps={{
                fontWeight: isActive('/sales/reports') ? 600 : 400
              }}
            />
          </ListItemButton>
        </List>
      </Box>

      <Divider sx={{ mt: 1, mb: 1 }} />

      <List sx={{ px: 1.5 }}>
        <ListItemButton
          component={RouterLink}
          to="/settings"
          selected={isActive('/settings')}
          sx={{
            borderRadius: 2,
            '&.Mui-selected': {
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.18),
              }
            }
          }}
        >
          <ListItemIcon>
            <SettingsIcon color={isActive('/settings') ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText
            primary="Settings"
            primaryTypographyProps={{
              fontWeight: isActive('/settings') ? 600 : 400
            }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={toggleColorMode}
          sx={{ borderRadius: 2, mt: 1 }}
        >
          <ListItemIcon>
            {themeMode === 'dark' ? <BrightnessAutoIcon /> : <BrightnessAutoIcon />}
          </ListItemIcon>
          <ListItemText primary={`${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`} />
        </ListItemButton>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: drawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { md: drawerOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              component="div"
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontWeight: 600,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              BizTracker
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}>
              <IconButton
                onClick={toggleColorMode}
                color="inherit"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                  }
                }}
              >
                {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </Box>
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
              borderRight: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
              backgroundImage: 'none',
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
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
              backgroundImage: 'none',
            },
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
          p: { xs: 2, md: 3 },
          width: '100%',
          ml: { md: drawerOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          bgcolor: theme.palette.background.default,
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" className="fade-in">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}