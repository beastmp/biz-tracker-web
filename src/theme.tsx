import { createTheme } from '@mui/material/styles';

// Extend the default theme
const theme = createTheme({
  // ...existing theme configuration...

  // You may need to extend shadows if your theme doesn't have enough elevation levels
  shadows: [
    'none',
    // Copy your existing shadows 1-23 here
    // ...
    // Add a new shadow for elevation 24
    '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)'
  ]
});

export default theme;
