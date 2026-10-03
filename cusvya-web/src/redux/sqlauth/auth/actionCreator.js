import { message } from 'antd';
import actions from './actions';
import { sqlAuthorisation } from '../../../config/sqlauth/sqlauthorisation';
import { cookieUtils } from '../../../utility/cookieUtils';

const {
  LOGIN_BEGIN,
  LOGIN_SUCCESS,
  LOGIN_ERR,
  LOGOUT_BEGIN,
  LOGOUT_SUCCESS,
  LOGOUT_ERR,
  SIGNUP_BEGIN,
  SIGNUP_SUCCESS,
  SIGNUP_ERR,
} = actions;

// Sql Auth Sign In Action
const login = (username, password) => {
  return async (dispatch) => {
    try {
      dispatch({ type: LOGIN_BEGIN });

      const result = await sqlAuthorisation.signIn(username, password);

      if (result.success) {
        // Store user data in cookies
        cookieUtils.setUserData(result.user);
        cookieUtils.setLoginStatus(true);
        cookieUtils.setAuthToken(result.token);

        dispatch({
          type: LOGIN_SUCCESS,
          payload: result.user,
        });

        message.success('Login successful!');
        // Reload the whole page to re-request the current URL and reinitialize app state
        try {
          window.location.reload();
        } catch (err) {
          // In non-browser environments fail silently
          console.error('Page reload failed:', err);
        }
        return { success: true, user: result.user };
      } else {
        dispatch({
          type: LOGIN_ERR,
          payload: result.error,
        });

        message.error(result.error || 'Login failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login action error:', error);

      dispatch({
        type: LOGIN_ERR,
        payload: error.message,
      });

      message.error('An unexpected error occurred during login');
      return { success: false, error: error.message };
    }
  };
};

// Register new user (if needed in the future)
const register = (userData) => {
  return async (dispatch) => {
    try {
      dispatch({ type: SIGNUP_BEGIN });

      const { email, password, name } = userData;
      const result = await sqlAuthorisation.register(email, password, name);

      if (result.success) {
        dispatch({
          type: SIGNUP_SUCCESS,
          payload: result.user,
        });

        message.success('Registration successful!');
        return { success: true, user: result.user };
      } else {
        dispatch({
          type: SIGNUP_ERR,
          payload: result.error,
        });

        message.error(result.error || 'Registration failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Registration action error:', error);

      dispatch({
        type: SIGNUP_ERR,
        payload: error.message,
      });

      message.error('An unexpected error occurred during registration');
      return { success: false, error: error.message };
    }
  };
};

// Sign Out Action
const logOut = () => {
  return async (dispatch) => {
    try {
      dispatch({ type: LOGOUT_BEGIN });

      const result = await sqlAuthorisation.signOut();

      if (result.success) {
        // Clear cookies
        cookieUtils.clearAuthCookies();

        dispatch({
          type: LOGOUT_SUCCESS,
        });

        message.success('Logout successful!');
        return { success: true };
      } else {
        dispatch({
          type: LOGOUT_ERR,
          payload: result.error,
        });

        message.error('Logout failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Logout action error:', error);

      dispatch({
        type: LOGOUT_ERR,
        payload: error.message,
      });

      message.error('An unexpected error occurred during logout');
      return { success: false, error: error.message };
    }
  };
};

// Initialize auth state from cookies
const initializeAuthFromCookies = () => {
  return (dispatch) => {
    try {
      const isLoggedIn = cookieUtils.getLoginStatus();
      const userData = cookieUtils.getUserData();
      const token = cookieUtils.getAuthToken();

      // Validate session
      if (isLoggedIn && userData && token) {
        // Check if token is expired
        const isExpired = sqlAuthorisation.isTokenExpired();

        if (isExpired) {
          // Token expired, clear cookies and logout
          cookieUtils.clearAuthCookies();
          dispatch({
            type: LOGOUT_SUCCESS,
          });
          message.warning('Your session has expired. Please login again.');
        } else {
          // Valid session, restore user state
          dispatch({
            type: LOGIN_SUCCESS,
            payload: userData,
          });
        }
      } else {
        // No valid session, logout
        dispatch({
          type: LOGOUT_SUCCESS,
        });
      }
    } catch (error) {
      console.error('Error initializing auth from cookies:', error);
      cookieUtils.clearAuthCookies();
      dispatch({
        type: LOGOUT_SUCCESS,
      });
    }
  };
};

// Check if user is authenticated (for route protection)
const checkAuthState = () => {
  return (dispatch) => {
    try {
      // Validate session using JWT
      const isValid = sqlAuthorisation.validateSession();

      if (isValid) {
        const userData = sqlAuthorisation.getCurrentUser();
        if (userData) {
          dispatch({
            type: LOGIN_SUCCESS,
            payload: userData,
          });
        } else {
          cookieUtils.clearAuthCookies();
          dispatch({
            type: LOGOUT_SUCCESS,
          });
        }
      } else {
        // Session invalid, clear everything
        cookieUtils.clearAuthCookies();
        dispatch({
          type: LOGOUT_SUCCESS,
        });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      cookieUtils.clearAuthCookies();
      dispatch({
        type: LOGOUT_SUCCESS,
      });
    }
  };
};

export { login, register, logOut, checkAuthState, initializeAuthFromCookies };
