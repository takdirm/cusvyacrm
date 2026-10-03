// Runtime configuration loader
// This loads config.json from the public folder at runtime, allowing configuration changes without rebuild

class RuntimeConfig {
  constructor() {
    this.config = null;
    this.loading = false;
    this.loaded = false;
  }

  normalizeApiEndpoint(endpoint) {
    if (!endpoint || typeof window === 'undefined') {
      return endpoint;
    }

    try {
      const parsedEndpoint = new URL(endpoint, window.location.origin);
      const currentHostname = window.location.hostname;

      if (
        (parsedEndpoint.hostname === 'localhost' || parsedEndpoint.hostname === '127.0.0.1') &&
        currentHostname !== 'localhost' &&
        currentHostname !== '127.0.0.1'
      ) {
        parsedEndpoint.hostname = currentHostname;
        return `${parsedEndpoint.origin}${parsedEndpoint.pathname}${parsedEndpoint.search}${parsedEndpoint.hash}`;
      }

      return endpoint;
    } catch (error) {
      return endpoint;
    }
  }

  async load() {
    if (this.loaded) {
      return this.config;
    }

    if (this.loading) {
      // Wait for existing load to complete
      return new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (this.loaded) {
            clearInterval(checkLoaded);
            resolve(this.config);
          }
        }, 50);
      });
    }

    this.loading = true;

    const requiredFirebaseKeys = [
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_AUTH_DOMAIN',
      'REACT_APP_FIREBASE_PROJECT_ID',
      'REACT_APP_FIREBASE_APP_ID',
    ];

    try {
      const response = await fetch('/config.json');
      if (!response.ok) {
        throw new Error(`Failed to load config.json: ${response.statusText}`);
      }
      this.config = await response.json();
      this.config.REACT_APP_API_ENDPOINT = this.normalizeApiEndpoint(this.config.REACT_APP_API_ENDPOINT);
      this.config.REACT_APP_API_BASE_URL = this.normalizeApiEndpoint(
        this.config.REACT_APP_API_BASE_URL || this.config.REACT_APP_API_ENDPOINT,
      );

      const missingKeys = requiredFirebaseKeys.filter((key) => !this.config[key]);
      if (missingKeys.length > 0) {
        console.warn(`Runtime config is missing Firebase keys: ${missingKeys.join(', ')}`);
      }

      this.loaded = true;
      this.loading = false;

      // Store in window for easy access
      window.runtimeConfig = this.config;

      return this.config;
    } catch (error) {
      console.error('Error loading runtime config:', error);
      // Fallback to environment variables if config.json fails to load
      this.config = {
        REACT_APP_API_ENDPOINT: this.normalizeApiEndpoint(process.env.REACT_APP_API_ENDPOINT || '/api/'),
        REACT_APP_API_BASE_URL: this.normalizeApiEndpoint(
          process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8090',
        ),
        REACT_APP_GOOGLE_MAP_KEY: process.env.REACT_APP_GOOGLE_MAP_KEY || '',
        REACT_APP_GOOGLE_PLACES_API_KEY: process.env.REACT_APP_GOOGLE_PLACES_API_KEY || '',
        REACT_APP_FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY || '',
        REACT_APP_FIREBASE_AUTH_DOMAIN: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
        REACT_APP_FIREBASE_DATABASE_URL: process.env.REACT_APP_FIREBASE_DATABASE_URL || '',
        REACT_APP_FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
        REACT_APP_FIREBASE_STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
        REACT_APP_FIREBASE_APP_ID: process.env.REACT_APP_FIREBASE_APP_ID || '',
        REACT_APP_FIREBASE_MEASUREMENT_ID: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || '',
      };
      this.loaded = true;
      this.loading = false;
      window.runtimeConfig = this.config;
      return this.config;
    }
  }

  get(key, defaultValue = null) {
    if (!this.loaded) {
      console.warn('RuntimeConfig not loaded yet. Call load() first.');
      return defaultValue;
    }
    return this.config[key] || defaultValue;
  }
}

const runtimeConfig = new RuntimeConfig();

export default runtimeConfig;
