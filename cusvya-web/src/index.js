/* eslint-disable import/no-unresolved */
import React from 'react';
import { createRoot } from 'react-dom/client';
import runtimeConfig from './config/runtimeConfig';

// Suppress known warnings and informational messages
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  if (typeof args[0] === 'string') {
    // Suppress findDOMNode warning from react-simple-maps v4 beta
    if (args[0].includes('findDOMNode is deprecated')) {
      return;
    }
    // Suppress Menu children warning (backward compatible, scheduled for future refactor)
    if (args[0].includes('Menu') && args[0].includes('children') && args[0].includes('deprecated')) {
      return;
    }
    // Suppress defaultProps warnings for chart components (non-critical, backward compatible)
    if (args[0].includes('Support for defaultProps will be removed')) {
      return;
    }
    // Suppress notification static method context warning (known limitation, non-critical)
    if (args[0].includes('notification') && args[0].includes('Static function can not consume context')) {
      return;
    }
    // Suppress message static method context warning (known limitation, non-critical)
    if (args[0].includes('[antd: message]') && args[0].includes('Static function can not consume context')) {
      return;
    }
    // Suppress notification btn deprecation (backward compatible)
    if (args[0].includes('Notification') && args[0].includes('btn') && args[0].includes('deprecated')) {
      return;
    }
  }
  originalError.apply(console, args);
};

console.warn = (...args) => {
  if (typeof args[0] === 'string') {
    // Suppress Redux selector performance warnings (optimization not critical for functionality)
    if (args[0].includes('Selector unknown returned a different result')) {
      return;
    }
    // Suppress Ant Design v5 deprecation warnings (already updated to new API)
    if (args[0].includes('dropdownMatchSelectWidth') && args[0].includes('deprecated')) {
      return;
    }
    if (args[0].includes('dropdownStyle') && args[0].includes('deprecated')) {
      return;
    }
    if (args[0].includes('popupClassName') && args[0].includes('deprecated')) {
      return;
    }
    if (args[0].includes('placement: bottomCenter') && args[0].includes('deprecated')) {
      return;
    }
    if (args[0].includes('visible') && args[0].includes('deprecated')) {
      return;
    }
    if (args[0].includes('strokeWidth') && args[0].includes('deprecated')) {
      return;
    }
    // Suppress React-Hot-Loader warning (not critical for production)
    if (args[0].includes('React-Hot-Loader') && args[0].includes('react-🔥-dom patch')) {
      return;
    }
    // Suppress string ref warning from third-party libraries (editorContainer)
    if (args[0].includes('string ref') && args[0].includes('editorContainer')) {
      return;
    }
    if (args[0].includes('Support for string refs will be removed')) {
      return;
    }
    // Suppress notification static method context warning (known limitation, non-critical)
    if (args[0].includes('notification') && args[0].includes('Static function can not consume context')) {
      return;
    }
  }
  originalWarn.apply(console, args);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element. Make sure there is a <div id="root"></div> in your HTML.');
}

const root = createRoot(rootElement);

// Load runtime config before rendering the app
runtimeConfig
  .load()
  .then(async () => {
    console.log('Runtime configuration loaded:', window.runtimeConfig);
    const [{ setupAxiosAuthInterceptor }, { default: App }, { default: reportWebVitals }] = await Promise.all([
      import('./config/api/axiosAuthInterceptor'),
      import('./App'),
      import('./reportWebVitals'),
    ]);

    // Ensure axios requests always include a fresh Firebase ID token.
    setupAxiosAuthInterceptor();

    root.render(<App />);
    reportWebVitals();
  })
  .catch(async (error) => {
    console.error('Failed to load runtime config, using defaults:', error);
    const [{ setupAxiosAuthInterceptor }, { default: App }, { default: reportWebVitals }] = await Promise.all([
      import('./config/api/axiosAuthInterceptor'),
      import('./App'),
      import('./reportWebVitals'),
    ]);

    // Ensure axios requests always include a fresh Firebase ID token.
    setupAxiosAuthInterceptor();

    root.render(<App />);
    reportWebVitals();
  });
