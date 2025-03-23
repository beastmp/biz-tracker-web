import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useState, useMemo } from 'react';

// Components
import Layout from './components/Layout';
import InventoryList from './components/inventory/InventoryList';
import InventoryDetail from './components/inventory/InventoryDetail';
import InventoryForm from './components/inventory/InventoryForm';
import SalesList from './components/sales/SalesList';
import SalesDetail from './components/sales/SalesDetail';
import SalesForm from './components/sales/SalesForm';
import SalesReport from './components/sales/SalesReport';
import PurchasesList from './components/purchases/PurchasesList';
import PurchaseDetail from './components/purchases/PurchaseDetail';
import PurchaseForm from './components/purchases/PurchaseForm';
import PurchasesReport from './components/purchases/PurchasesReport';
import Dashboard from './components/Dashboard';
import NotFound from './components/NotFound';

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  
  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode,
        primary: {
          main: '#0a7ea4',
        },
        secondary: {
          main: '#4caf50',
        },
      },
    }),
  [mode]);

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout toggleColorMode={toggleMode} />}>
            <Route index element={<Dashboard />} />
            
            {/* Inventory Routes */}
            <Route path="inventory">
              <Route index element={<InventoryList />} />
              <Route path="new" element={<InventoryForm />} />
              <Route path=":id" element={<InventoryDetail />} />
              <Route path=":id/edit" element={<InventoryForm />} />
            </Route>
            
            {/* Sales Routes */}
            <Route path="sales">
              <Route index element={<SalesList />} />
              <Route path="new" element={<SalesForm />} />
              <Route path=":id" element={<SalesDetail />} />
              <Route path=":id/edit" element={<SalesForm />} />
              <Route path="reports" element={<SalesReport />} />
            </Route>
            
            {/* Purchases Routes */}
            <Route path="purchases">
              <Route index element={<PurchasesList />} />
              <Route path="new" element={<PurchaseForm />} />
              <Route path=":id" element={<PurchaseDetail />} />
              <Route path=":id/edit" element={<PurchaseForm />} />
              <Route path="reports" element={<PurchasesReport />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;