# BizTracker Web Application

## Table of Contents

1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Key Technologies](#key-technologies)
4. [Core Components](#core-components)
5. [Feature Modules](#feature-modules)
6. [Data Flow](#data-flow)
7. [Setup and Configuration](#setup-and-configuration)
8. [Extending the Application](#extending-the-application)

## Introduction

BizTracker is a comprehensive web application for small businesses to track inventory, sales, and purchases. It helps business owners maintain accurate inventory records, analyze product profitability, and monitor business transactions. The application features a modern React-based frontend with Material UI components for a responsive and intuitive user interface.

## Project Structure

The application follows a feature-based structure:

```
biz-tracker-web/
├── src/
│   ├── components/       # Shared UI components
│   ├── context/          # React context providers
│   ├── features/         # Feature modules
│   │   ├── inventory/    # Inventory management
│   │   ├── purchases/    # Purchase management
│   │   └── sales/        # Sales management
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript definitions
│   └── utils/            # Utility functions
├── public/               # Static assets
├── index.html            # Entry HTML file
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript configuration
```

## Key Technologies

- **React**: Frontend library for building user interfaces
- **TypeScript**: Type-safe JavaScript
- **Material UI**: Component library for consistent design
- **React Router**: Navigation and routing
- **React Query**: Data fetching, caching, and state management
- **Vite**: Build tool and development server
- **Firebase**: Hosting and backend services

## Core Components

### Application Layout

The `Layout` component (`src/components/Layout.tsx`) provides the overall structure of the application, including:

- Responsive AppBar with navigation toggle
- Side drawer navigation menu
- Main content container
- Theme toggle functionality

```tsx
// Main parts of the layout
<AppBar />         // Top navigation bar
<Drawer />         // Side navigation menu
<Box component="main"> // Main content area
  <Outlet />       // Route content is rendered here
</Box>
```

### Context Providers

#### `AppContext` (`src/context/AppContext.tsx`)

Manages application-wide state including:
- Theme switching (light/dark mode)
- Default view mode for lists (grid/list)

#### `SettingsContext` (`src/context/SettingsContext.tsx`)

Provides user preferences and settings:
- Low stock alert thresholds
- Display preferences
- Data management options

These settings are persisted in localStorage for a seamless user experience across sessions.

### Error Handling

The `ErrorBoundary` component (`src/components/ErrorBoundary.tsx`) catches JavaScript errors in child components, preventing the entire application from crashing. It displays a user-friendly error message and provides options to recover.

`ErrorFallback` (`src/components/ui/ErrorFallback.tsx`) renders a standardized error message with options to retry or navigate to the dashboard.

## Feature Modules

### Dashboard (`src/components/Dashboard.tsx`)

The dashboard provides an overview of business operations with:
- Quick stats on inventory, sales, and purchases
- Low stock alerts
- Recent activity feeds
- Quick action buttons

It connects with multiple data hooks:
```tsx
const { data: items } = useItems();
const { data: sales } = useSales();
const { data: purchases } = usePurchases();
```

### Inventory Management

#### Inventory List (`src/features/inventory/InventoryList.tsx`)

The inventory list shows all items with comprehensive filtering and viewing options:

- Grid/list view toggle
- Grouping by category or item type
- Search functionality
- Sorting options
- Low stock indicators

It uses the settings context to respect user preferences:
```tsx
const { lowStockAlertsEnabled, quantityThreshold, weightThresholds, defaultViewMode, defaultGroupBy } = useSettings();
```

#### Inventory Detail (`src/features/inventory/InventoryDetail.tsx`)

Displays comprehensive information about a single inventory item:
- Basic item information
- Stock levels and status
- Pricing and cost information
- Material relationships (components)
- Product relationships (where used)
- Quick actions

It allows breaking down generic material items into specific items through the `BreakdownItemsDialog`.

#### Inventory Form (`src/features/inventory/InventoryForm.tsx`)

A multi-section form for creating and editing inventory items:
- Basic information (name, SKU, category)
- Stock information with flexible tracking types (quantity, weight, length, area, volume)
- Pricing information with markup calculation
- Product composition (material components)
- Image upload
- Tags

Supports complex inventory use cases like:
- Pack-based purchasing
- Multi-measurement tracking
- Material-to-product relationships

#### Profit Analysis (`src/features/inventory/InventoryProfitReport.tsx`)

Analyzes inventory profitability with:
- Markup percentages by item
- Profit margins
- Category-based analysis
- Visual charts and data tables

### Sales and Purchases

The sales and purchases modules follow a similar pattern with list, detail, and form components:
- `SalesList.tsx` / `PurchasesList.tsx`: Display all transactions
- `SalesDetail.tsx` / `PurchaseDetail.tsx`: Show details of specific transactions
- `SalesForm.tsx` / `PurchaseForm.tsx`: Create or edit transactions

These modules use dedicated hooks (`useSales`, `usePurchases`) to manage their specific data.

### Special Components

#### `CreateProductDialog` (`src/components/inventory/CreateProductDialog.tsx`)

A dialog that streamlines the creation of products from existing materials:
1. Select materials and quantities
2. Set markup percentage or final price
3. Calculate costs and pricing automatically
4. Generate a new product with properly tracked material relationships

#### `BreakdownItemsDialog` (`src/components/inventory/BreakdownItemsDialog.tsx`)

Enables breaking down generic materials into specific derived items:
1. Allocate quantities or weights from source material
2. Generate appropriate SKUs and names
3. Set specific properties for derived items
4. Track relationships between source and derived items

## Data Flow

The application uses React Query hooks for data fetching and state management:

1. **Custom Hooks**: Domain-specific hooks fetch and manipulate data:
   - `useItems()`: Inventory management
   - `useSales()`: Sales transactions
   - `usePurchases()`: Purchase orders

2. **API Client**: Common utilities in `src/utils/apiClient.ts` handle HTTP requests

3. **Context Providers**: Manage application state and user preferences

4. **Component Integration**: Components consume hooks and context to render UI

## Setup and Configuration

### Environment Variables

The application uses environment variables for configuration (`.env.example`):
```
VITE_API_URL=http://localhost:3000
```

### Firebase Configuration

`firebase.json` configures hosting and deployment:
```json
// Firebase hosting configuration
```

### TypeScript Configuration

Two TypeScript configurations manage different parts of the project:
- `tsconfig.app.json`: Application code
- `tsconfig.node.json`: Build scripts and configuration

## Extending the Application

### Adding New Features

1. Create new components in the appropriate feature directory
2. Add data hooks in `src/hooks/`
3. Define types in `src/types/models.ts`
4. Add routes in `src/routes.tsx`
5. Update navigation in `src/components/Layout.tsx`

### Customizing the UI

The application uses Material UI theming which can be extended in `src/context/AppContext.tsx`.

### API Integration

To integrate with different backends:
1. Modify the API client in `src/utils/apiClient.ts`
2. Update environment variables in `.env`
3. Adjust data hooks as needed

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
