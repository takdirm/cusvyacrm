import { message } from 'antd';

import actions from './actions';
import { firebaseAuth } from '../../config/firebase/firebase';

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

// Firebase Sign In Action
const login = (email, password) => {
  return async (dispatch) => {
    try {
      dispatch({ type: LOGIN_BEGIN });

      const result = await firebaseAuth.signIn(email, password);

      if (result.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('isLoggedIn', 'true');

        dispatch({
          type: LOGIN_SUCCESS,
          payload: result.user,
        });

        message.success('Login successful!');
        return { success: true };
      }
    } catch (error) {
      dispatch({
        type: LOGIN_ERR,
        payload: error.message,
      });

      message.error('Login failed');
      return { success: false, error: error.message };
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
        // Clear localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');

        dispatch({
          type: LOGOUT_SUCCESS,
        });

        message.success('Logout successful!');
        return { success: true };
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

// Check if user is authenticated
const checkAuthState = () => {
  return (dispatch) => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        };

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');

        dispatch({
          type: LOGIN_SUCCESS,
          payload: userData,
        });
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');

        dispatch({
          type: LOGOUT_SUCCESS,
        });
      }
    });

    return unsubscribe;
  };
};

export { login, register, logOut, checkAuthState };
