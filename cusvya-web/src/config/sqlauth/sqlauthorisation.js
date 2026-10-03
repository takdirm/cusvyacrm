import { API } from '../api';
import { DataService } from '../dataService/dataService';
import { firebaseAuth } from '../firebase/firebase';

export const sqlAuthorisation = {
  // Register new user

  // Sign in user with Firebase
  signIn: async (username, password) => {
    try {
      // Step 1: Authenticate with Firebase using email/username as email
      // Note: If your backend uses usernames, you may need to convert username to email
      // For now, assuming username is the email address
      const email = username.includes('@') ? username : `${username}@scootr.app`;

      const firebaseResult = await firebaseAuth.signIn(email, password);

      if (!firebaseResult.success) {
        return {
          success: false,
          error: firebaseResult.error || 'Firebase authentication failed',
        };
      }

      // Step 2: Get Firebase ID token
      const firebaseToken = await firebaseAuth.getIdToken();

      if (!firebaseToken) {
        return {
          success: false,
          error: 'Failed to get Firebase token',
        };
      }

      // Step 3: Call backend login API with Firebase token already in headers
      // The DataService will automatically include the Firebase token in Authorization header
      const payload = {
        username,
        password,
      };

      const response = await DataService.post(`${API.auth.login}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log('Login Response:', response);

      // Check if response has data
      if (!response || !response.data) {
        return {
          success: false,
          error: 'Invalid response from server',
        };
      }

      const { user } = response.data;

      // Validate response structure
      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials or missing data',
        };
      }

      // Store user data in localStorage (token is managed by Firebase)
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authToken', firebaseToken); // Store for backwards compatibility

      return {
        success: true,
        token: firebaseToken,
        user: {
          username: user.username,
          email: user.email,
          level: user.level,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      console.error('Sign in error:', error);

      // Handle different error responses
      let errorMessage = 'Failed to sign in. Please try again.';

      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Invalid username or password';
        } else if (error.response.status === 403) {
          errorMessage = 'Account is not active';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.statusText) {
          errorMessage = `Error: ${error.response.statusText}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      // Sign out from Firebase
      await firebaseAuth.signOut();

      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

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

  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        return JSON.parse(userString);
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Get auth token from Firebase
  getToken: async () => {
    const firebaseToken = await firebaseAuth.getIdToken();
    if (firebaseToken) {
      return firebaseToken;
    }
    // Fallback to localStorage
    return localStorage.getItem('authToken');
  },

  // Check if user is authenticated (check Firebase auth state)
  isAuthenticated: () => {
    const firebaseUser = firebaseAuth.getCurrentUser();
    if (firebaseUser) {
      return true;
    }
    // Fallback to localStorage check
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Decode JWT token to check expiration
  isTokenExpired: () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return true;

      // Decode JWT token (without verification)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => {
            // Fix Line 144: Use template literal instead of string concatenation
            return `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`;
          })
          .join(''),
      );

      const decodedToken = JSON.parse(jsonPayload);
      const currentTime = Date.now() / 1000;

      // Check if token is expired
      return decodedToken.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  },

  // Validate session
  validateSession: () => {
    const isAuth = sqlAuthorisation.isAuthenticated();
    const isExpired = sqlAuthorisation.isTokenExpired();

    if (!isAuth || isExpired) {
      sqlAuthorisation.signOut();
      return false;
    }

    return true;
  },
};
