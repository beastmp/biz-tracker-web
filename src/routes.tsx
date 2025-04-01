import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import Layout from '@components/Layout';
import Dashboard from '@components/Dashboard';
import NotFound from '@components/NotFound';
import LoadingScreen from '@components/ui/LoadingScreen';

// Lazy load feature components - organized by feature
// Inventory components
const InventoryList = lazy(() => import('@features/inventory/InventoryList'));
const InventoryDetail = lazy(() => import('@features/inventory/InventoryDetail'));
const InventoryForm = lazy(() => import('@features/inventory/InventoryForm'));
const InventoryProfitReport = lazy(() => import('@features/inventory/InventoryProfitReport'));

// Sales components
const SalesList = lazy(() => import('@features/sales/SalesList'));
const SalesDetail = lazy(() => import('@features/sales/SalesDetail'));
const SalesForm = lazy(() => import('@features/sales/SalesForm'));
const SalesReport = lazy(() => import('@features/sales/SalesReport'));

// Purchase components
const PurchasesList = lazy(() => import('@features/purchases/PurchasesList'));
const PurchaseDetail = lazy(() => import('@features/purchases/PurchaseDetail'));
const PurchaseForm = lazy(() => import('@features/purchases/PurchaseForm'));
const PurchasesReport = lazy(() => import('@features/purchases/PurchasesReport'));

// Asset components
const AssetsList = lazy(() => import('@features/assets/AssetsList'));
const AssetDetail = lazy(() => import('@features/assets/AssetDetail'));
const AssetForm = lazy(() => import('@features/assets/AssetForm'));

// Settings page
const Settings = lazy(() => import('@components/Settings'));

// Wrapper for Suspense to reduce repetition
const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component />
  </Suspense>
);

// Define application routes in a type-safe way
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      // Dashboard/Home route
      {
        index: true,
        element: <Dashboard />,
      },

      // Inventory routes
      {
        path: 'inventory',
        children: [
          { index: true, element: withSuspense(InventoryList) },
          { path: 'new', element: withSuspense(InventoryForm) },
          { path: ':id', element: withSuspense(InventoryDetail) },
          { path: ':id/edit', element: withSuspense(InventoryForm) },
          { path: 'profit-analysis', element: withSuspense(InventoryProfitReport) }
        ]
      },

      // Business Assets routes
      {
        path: 'assets',
        children: [
          { index: true, element: withSuspense(AssetsList) },
          { path: 'new', element: withSuspense(AssetForm) },
          { path: ':id', element: withSuspense(AssetDetail) },
          { path: ':id/edit', element: withSuspense(AssetForm) }
        ]
      },

      // Sales routes
      {
        path: 'sales',
        children: [
          { index: true, element: withSuspense(SalesList) },
          { path: 'new', element: withSuspense(SalesForm) },
          { path: ':id', element: withSuspense(SalesDetail) },
          { path: ':id/edit', element: withSuspense(SalesForm) },
          { path: 'reports', element: withSuspense(SalesReport) }
        ]
      },

      // Purchases routes
      {
        path: 'purchases',
        children: [
          { index: true, element: withSuspense(PurchasesList) },
          { path: 'new', element: withSuspense(PurchaseForm) },
          { path: ':id', element: withSuspense(PurchaseDetail) },
          { path: ':id/edit', element: withSuspense(PurchaseForm) },
          { path: 'reports', element: withSuspense(PurchasesReport) }
        ]
      },

      // Settings
      {
        path: 'settings',
        element: withSuspense(Settings),
      },

      // 404 page - always place at the end
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];

export default routes;
