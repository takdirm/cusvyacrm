import actions from './actions';
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

const initState = {
  login: cookieUtils.getLoginStatus(),
  user: cookieUtils.getUserData(),
  loading: false,
  error: null,
};

/**
 *
 * @todo impure state mutation/explaination
 */
const AuthReducer = (state = initState, action) => {
  const { type, data, err } = action;
  switch (type) {
    case LOGIN_BEGIN:
      return {
        ...state,
        loading: true,
      };
    case LOGIN_SUCCESS:
      return {
        ...state,
        login: true,
        user: action.payload,
        loading: false,
        error: null,
      };
    case LOGIN_ERR:
      return {
        ...state,
        login: false,
        user: null,
        error: action.payload,
        loading: false,
      };
    case LOGOUT_BEGIN:
      return {
        ...state,
        loading: true,
      };
    case LOGOUT_SUCCESS:
      return {
        ...state,
        login: false,
        user: null,
        loading: false,
        error: null,
      };
    case LOGOUT_ERR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case SIGNUP_BEGIN:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case SIGNUP_SUCCESS:
      return {
        ...state,
        login: true,
        user: action.payload,
        loading: false,
        error: null,
      };
    case SIGNUP_ERR:
      return {
        ...state,
        login: false,
        user: null,
        error: action.payload,
        loading: false,
      };
    default:
      return state;
  }
};
export default AuthReducer;
