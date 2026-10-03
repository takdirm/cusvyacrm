import axios from 'axios';
import { auth, firebaseAuth } from '../firebase/firebase';
import { getSelectedRegion } from '../../utility/localStorageControl';

let interceptorInitialized = false;

const getFirebaseToken = async () => {
  const user = auth.currentUser || firebaseAuth.getCurrentUser();
  if (!user) {
    return null;
  }
  return user.getIdToken();
};

export const setupAxiosAuthInterceptor = () => {
  if (interceptorInitialized) {
    return;
  }

  axios.interceptors.request.use(async (config) => {
    const token = await getFirebaseToken();
    const region = getSelectedRegion();
    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers.Authorization) {
      delete config.headers.Authorization;
    }

    if (region && region.code) {
      config.headers['X-Region-Code'] = region.code;
    } else if (config.headers['X-Region-Code']) {
      delete config.headers['X-Region-Code'];
    }

    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status;

      if (status === 401) {
        try {
          const user = firebaseAuth.getCurrentUser();
          if (user) {
            await firebaseAuth.signOut();
          }
        } catch {
          // Ignore sign-out failures while handling unauthorized errors.
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('scootr:unauthorized'));
        }
      }

      if (status === 403 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('scootr:forbidden'));
      }

      return Promise.reject(error);
    },
  );

  interceptorInitialized = true;
};
