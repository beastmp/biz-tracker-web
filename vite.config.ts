import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@custTypes': path.resolve(__dirname, './src/types'),
      '@config': path.resolve(__dirname, './src/config'),
      '@context': path.resolve(__dirname, './src/context'),
    }
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      strict: true,
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Customize how chunks are created
        manualChunks: (id) => {
          // Node modules bundling strategy
          if (id.includes("node_modules")) {
            // React and React Router need to be bundled together to ensure context is available
            if (id.includes("react") ||
                id.includes("scheduler") ||
                id.includes("prop-types") ||
                id.includes("use-sync-external-store") ||
                id.includes("react-is") ||
                id.includes("react-dom") ||
                id.includes("@emotion") ||
                id.includes("react-router") ||
                id.includes("/history/") ||
                id.includes("/mini-create-react-context/") ||
                id.includes("react-router-dom") ||
                id.includes("@remix-run/router") ||
                id.includes("use-")) {
              return "vendor-react-core";
            }

            // MUI packages
            if (id.includes("@mui")) {
              return "vendor-mui";
            }

            // Other major libs you might want to separate
            if (id.includes("axios")) return "vendor-axios";
            if (id.includes("lodash")) return "vendor-lodash";
            if (id.includes("firebase")) return "vendor-firebase";

            // Additional common libraries that may have dependencies
            if (id.includes("date-fns")) return "vendor-date-fns";
            if (id.includes("redux")) return "vendor-redux";
            if (id.includes("formik") || id.includes("yup")) {
              return "vendor-forms";
            }

            // Rest of your existing config...
            if (id.includes("i18n") || id.includes("intl")) {
              return "vendor-i18n";
            }
            if (id.includes("chart") || id.includes("d3")) {
              return "vendor-charts";
            }

            // Common packages with known initialization dependencies
            const moduleUtilsList = [
              "hoist-non-react-statics",
              "object-assign",
              "tslib",
              "classnames",
              "shallowequal",
              "clsx"
            ];

            const moduleName = id.split("node_modules/")[1]?.split("/")[0];
            if (moduleName) {
              // React-related utilities should be with React
              if (moduleUtilsList.includes(moduleName)) {
                return "vendor-react-core";
              }

              // Group potentially problematic modules by category
              if (moduleName.startsWith("@babel") ||
                  moduleName.includes("babel") ||
                  moduleName.includes("core-js")) {
                return "vendor-babel-polyfills";
              }

              // Split scoped packages by category
              if (moduleName.startsWith("@")) {
                // Extract the organization name
                const orgName = moduleName.split("/")[0].substring(1);

                // For problematic organizations, bundle entire org together
                const problematicOrgs = [
                  "tanstack",
                  "floating-ui",
                  "popperjs",
                  "radix-ui",
                  "remix-run",
                  "headlessui"
                ];

                if (problematicOrgs.includes(orgName)) {
                  return `vendor-${orgName}`;
                }

                // Other scoped packages by organization
                return `vendor-scoped-${orgName}`;
              }

              // Chunk remaining packages by first letter
              const firstChar = moduleName.charAt(0).toLowerCase();
              if (/[a-z]/.test(firstChar)) {
                return `vendor-${firstChar}`;
              }
              return "vendor-other-chars";
            }

            return "vendor-others";
          }

          // Application code chunking strategy

          // Features (screens/pages)
          if (id.includes('/features/')) {
            const feature = id.split('/features/')[1].split('/')[0];
            return `feature-${feature}`;
          }

          // Components chunking (for reusable components)
          if (id.includes('/components/')) {
            const component = id.split('/components/')[1].split('/')[0];
            return `component-${component}`;
          }

          // Keep core app code together
          if (id.includes('/src/App') ||
              id.includes('/src/main') ||
              id.includes('/src/router')) {
            return 'app-core';
          }

          // Services, hooks, utils, etc.
          if (id.includes('/services/')) return 'services';
          if (id.includes('/hooks/')) return 'hooks';
          if (id.includes('/utils/')) return 'utils';
          if (id.includes('/context/')) return 'context';
        },
        // Control the chunk file naming pattern
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
