import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';

const sanitizeConfigValue = (value) => {
  if (value == null) return '';
  const trimmed = String(value).trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const getRuntimeConfigValue = (key, defaultValue = '') => {
  const runtimeValue = sanitizeConfigValue(window.runtimeConfig?.[key]);
  if (runtimeValue) {
    return runtimeValue;
  }

  if (!window.runtimeConfig) {
    return sanitizeConfigValue(process.env[key] || defaultValue);
  }

  return sanitizeConfigValue(defaultValue);
};

const projectId = getRuntimeConfigValue('REACT_APP_FIREBASE_PROJECT_ID');
const configuredAuthDomain = getRuntimeConfigValue('REACT_APP_FIREBASE_AUTH_DOMAIN');
const authDomain =
  configuredAuthDomain && configuredAuthDomain !== 'googleapis.com'
    ? configuredAuthDomain
    : projectId
      ? `${projectId}.firebaseapp.com`
      : '';

const firebaseConfig = {
  apiKey: getRuntimeConfigValue('REACT_APP_FIREBASE_API_KEY'),
  authDomain,
  databaseURL: getRuntimeConfigValue('REACT_APP_FIREBASE_DATABASE_URL'),
  projectId,
  storageBucket: getRuntimeConfigValue(
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    projectId ? `${projectId}.appspot.com` : '',
  ),
  messagingSenderId: getRuntimeConfigValue('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getRuntimeConfigValue('REACT_APP_FIREBASE_APP_ID', '1:106691603987274653967:web:app'),
  measurementId: getRuntimeConfigValue('REACT_APP_FIREBASE_MEASUREMENT_ID'),
};

if (process.env.NODE_ENV === 'development') {
  console.log('Firebase config loaded', {
    apiKeySuffix: firebaseConfig.apiKey ? firebaseConfig.apiKey.slice(-6) : '',
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    appId: firebaseConfig.appId,
    runtimeConfigLoaded: Boolean(window.runtimeConfig),
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Ignore persistence errors; Firebase will still work for the current session.
});

// Firebase authentication functions
export const firebaseAuth = {
  // Register new user
  register: async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Fix Line 32: Use object destructuring
      const { user } = userCredential;

      // Update user profile with display name
      if (displayName) {
        await updateProfile(user, {
          // Fix Line 37: Property shorthand
          displayName,
        });
      }

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || displayName,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      return {
        success: false,
        code: error.code,
        error: error.message,
      };
    }
  },

  // Sign in user
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Fix Line 62: Use object destructuring
      const { user } = userCredential;

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      const providerErrorMessage =
        error?.customData?._tokenResponse?.error?.message || error?.customData?.serverResponse || '';
      return {
        success: false,
        code: error.code,
        error: error.message,
        details: providerErrorMessage,
      };
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      await signOut(auth);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Get Firebase ID token for current user
  getIdToken: async (forceRefresh = false) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return null;
      }
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Error getting Firebase ID token:', error);
      return null;
    }
  },

  // Request password reset email
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Send email verification to current user
  sendVerificationEmail: async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: 'No authenticated user found.' };
      }
      await sendEmailVerification(user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },
};

export default app;
