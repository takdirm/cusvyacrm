import React, { createContext, useContext } from 'react';
import { LoadScript } from '@react-google-maps/api';

const libraries = ['places', 'geometry'];

const GoogleMapsContext = createContext({
  isLoaded: false,
});

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within GoogleMapsProvider');
  }
  return context;
};

const sanitize = (value) => {
  if (value == null) return '';
  const trimmed = String(value).trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

export function GoogleMapsProvider({ children }) {
  const apiKey =
    sanitize(window?.runtimeConfig?.REACT_APP_GOOGLE_MAP_KEY) ||
    sanitize(window?.runtimeConfig?.REACT_APP_GOOGLE_PLACES_API_KEY) ||
    sanitize(process.env.REACT_APP_GOOGLE_MAP_KEY) ||
    sanitize(process.env.REACT_APP_GOOGLE_PLACES_API_KEY);

  if (!apiKey) {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, error: 'API key missing' }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={libraries}
      onLoad={() => console.log('Google Maps API loaded')}
      onError={(error) => console.error('Google Maps API error:', error)}
    >
      <GoogleMapsContext.Provider value={{ isLoaded: true }}>{children}</GoogleMapsContext.Provider>
    </LoadScript>
  );
}
