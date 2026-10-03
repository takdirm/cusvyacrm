import { message } from 'antd';
import actions from './actions';
import { API } from '../../../config/api';
import { DataService } from '../../../config/dataService/dataService';
import { firebaseAuth } from '../../../config/firebase/firebase';
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

const mapFirebaseError = (errorCode = '', errorText = '') => {
  const normalizedCode = String(errorCode || '').toLowerCase();
  const normalizedText = String(errorText || '').toLowerCase();

  if (!normalizedCode && !normalizedText) return 'Authentication failed.';
  if (
    normalizedCode.includes('auth/invalid-credential') ||
    normalizedCode.includes('auth/wrong-password') ||
    normalizedCode.includes('auth/user-not-found') ||
    normalizedText.includes('invalid-credential')
  ) {
    return 'Invalid email or password.';
  }
  if (normalizedCode.includes('auth/invalid-email') || normalizedText.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (normalizedCode.includes('auth/user-disabled') || normalizedText.includes('user-disabled')) {
    return 'This account has been disabled.';
  }
  if (normalizedCode.includes('auth/too-many-requests') || normalizedText.includes('too-many-requests')) {
    return 'Too many attempts. Please try again later.';
  }
  if (normalizedCode.includes('auth/network-request-failed') || normalizedText.includes('network-request-failed')) {
    return 'Unable to connect. Please check your connection.';
  }
  if (normalizedCode.includes('auth/api-key-not-valid')) {
    return 'Firebase configuration is invalid. Please contact support.';
  }
  if (normalizedCode.includes('auth/operation-not-allowed')) {
    return 'Email/password sign-in is not enabled in Firebase.';
  }
  if (normalizedCode.includes('auth/invalid-api-key') || normalizedCode.includes('auth/app-not-authorized')) {
    return 'Firebase project configuration mismatch. Please contact support.';
  }
  return 'Authentication failed.';
};

const getScootrCurrentUser = async () => {
  try {
    const response = await DataService.get(API.auth.me);
    return {
      success: true,
      data: response?.data || null,
    };
  } catch (error) {
    const status = error?.response?.status;
    const messageText =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Unable to load current user.';

    return {
      success: false,
      status,
      message: messageText,
    };
  }
};

const login = (email, password) => {
  return async (dispatch) => {
    try {
      dispatch({ type: LOGIN_BEGIN });

      const result = await firebaseAuth.signIn(email, password);
      if (!result.success) {
        const friendlyError = mapFirebaseError(result.code, result.error);
        console.error(
          `Firebase sign-in failed | code=${result.code || 'unknown'} | message=${result.error || ''} | details=${result.details || ''} | email=${email}`,
        );
        dispatch({
          type: LOGIN_ERR,
          payload: friendlyError,
        });

        message.error(friendlyError);
        return { success: false, error: friendlyError };
      }

      const scootrResult = await getScootrCurrentUser();
      if (!scootrResult.success || !scootrResult.data) {
        if (scootrResult.status === 401) {
          await firebaseAuth.signOut();
        }

        const authMessage =
          scootrResult.status === 403
            ? 'Access denied. You do not have permission to use this admin app.'
            : scootrResult.message || 'Unable to load your user profile.';

        dispatch({
          type: LOGIN_ERR,
          payload: authMessage,
        });

        message.error(authMessage);
        return { success: false, error: authMessage };
      }

      const userData = scootrResult.data;

      cookieUtils.setUserData(userData);
      cookieUtils.setLoginStatus(true);

      dispatch({
        type: LOGIN_SUCCESS,
        payload: userData,
      });

      message.success('Login successful!');
      return { success: true, user: userData };
    } catch (error) {
      const friendlyError = mapFirebaseError(error.code, error.message);
      dispatch({
        type: LOGIN_ERR,
        payload: friendlyError,
      });

      message.error(friendlyError);
      return { success: false, error: friendlyError };
    }
  };
};

// Firebase Sign Up Action
const register = (userData) => {
  return async (dispatch) => {
    try {
      dispatch({ type: SIGNUP_BEGIN });

      const { email, password, name } = userData;
      const result = await firebaseAuth.register(email, password, name);

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
      dispatch({
        type: SIGNUP_ERR,
        payload: error.message,
      });

      message.error('Registration failed');
      return { success: false, error: error.message };
    }
  };
};

// Firebase Sign Out Action
const logOut = () => {
  return async (dispatch) => {
    try {
      dispatch({ type: LOGOUT_BEGIN });

      const result = await firebaseAuth.signOut();

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
        return { success: false };
      }
    } catch (error) {
      dispatch({
        type: LOGOUT_ERR,
        payload: error.message,
      });

      message.error('Logout failed');
      return { success: false };
    }
  };
};

// Initialize auth state from cookies
const initializeAuthFromCookies = () => {
  return (dispatch) => {
    const isLoggedIn = cookieUtils.getLoginStatus();
    const userData = cookieUtils.getUserData();

    if (isLoggedIn && userData) {
      dispatch({
        type: LOGIN_SUCCESS,
        payload: userData,
      });
    } else {
      dispatch({
        type: LOGOUT_SUCCESS,
      });
    }
  };
};

// Check if user is authenticated
const checkAuthState = () => {
  return (dispatch) => {
    dispatch({ type: LOGIN_BEGIN });

    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      if (user) {
        const scootrResult = await getScootrCurrentUser();
        if (!scootrResult.success || !scootrResult.data) {
          cookieUtils.clearAuthCookies();
          dispatch({
            type: LOGIN_ERR,
            payload:
              scootrResult.status === 403
                ? 'Access denied. You do not have permission to use this admin app.'
                : scootrResult.message || 'Unable to load your user profile.',
          });
          return;
        }

        const userData = scootrResult.data;

        cookieUtils.setUserData(userData);
        cookieUtils.setLoginStatus(true);

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
    });

    return unsubscribe;
  };
};

export { login, register, logOut, checkAuthState, initializeAuthFromCookies };
