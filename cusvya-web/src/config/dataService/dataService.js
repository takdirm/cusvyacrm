import { auth, firebaseAuth } from '../firebase/firebase';
import { getSelectedRegion } from '../../utility/localStorageControl';

const getApiEndpoint = () => {
  return window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT;
};

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return firebaseAuth.getCurrentUser() ? firebaseAuth.getCurrentUser().getIdToken() : null;
};

const buildUrl = (path) => {
  const base = (getApiEndpoint() || '').replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  return `${base}${normalizedPath}`;
};

const isFormData = (data) => typeof FormData !== 'undefined' && data instanceof FormData;

const getHeaders = async (includeBody = false) => {
  const headers = {};
  if (includeBody) headers['Content-Type'] = 'application/json';

  // Include Firebase JWT token in Authorization header
  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const selectedRegion = getSelectedRegion();
  if (selectedRegion && selectedRegion.code) {
    headers['X-Region-Code'] = selectedRegion.code;
  }

  return headers;
};

const log = (method, url, status) => {
  if (process.env.NODE_ENV === 'development') {
    if (status == null) console.log(`🚀 ${method} ${url}`);
    else console.log(`✅ ${method} ${url} → ${status}`);
  }
};

const handleResponse = async (response, url, method) => {
  log(method, url, response.status);
  if (!response.ok) {
    if (response.status === 401) {
      try {
        const user = firebaseAuth.getCurrentUser();
        if (user) {
          await firebaseAuth.signOut();
        }
      } catch (error) {
        // Ignore sign-out errors on unauthorized responses.
      }
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
      } catch (error) {
        // Ignore storage cleanup errors.
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('scootr:unauthorized'));
      }
    }

    if (response.status === 403 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scootr:forbidden'));
    }

    // Read body once as text, then attempt JSON parse — avoids "body stream already read"
    let errorData;
    try {
      const text = await response.text();
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = text;
      }
    } catch {
      errorData = null;
    }
    const err = new Error(`HTTP ${response.status}: ${response.statusText}`);
    err.response = { status: response.status, statusText: response.statusText, data: errorData };
    throw err;
  }
  // 204 No Content has no body
  if (response.status === 204) return { data: null, status: 204 };
  const data = await response.json();
  return { data, status: response.status };
};

class DataService {
  static async get(path = '') {
    const url = buildUrl(path);
    log('GET', url);
    const headers = await getHeaders(false);
    const response = await fetch(url, { method: 'GET', headers });
    return handleResponse(response, url, 'GET');
  }

  static async post(path = '', data = {}, optionalHeader = {}) {
    const url = buildUrl(path);
    log('POST', url);
    const formDataPayload = isFormData(data);
    const headers = await getHeaders(!formDataPayload);
    const callerHeaders = optionalHeader?.headers ? optionalHeader.headers : optionalHeader;
    const mergedHeaders = { ...headers, ...callerHeaders };

    if (formDataPayload) {
      delete mergedHeaders['Content-Type'];
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: mergedHeaders,
      body: formDataPayload ? data : JSON.stringify(data),
    });
    return handleResponse(response, url, 'POST');
  }

  static async put(path = '', data = {}) {
    const url = buildUrl(path);
    log('PUT', url);
    const headers = await getHeaders(true);
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse(response, url, 'PUT');
  }

  static async patch(path = '', data = {}) {
    const url = buildUrl(path);
    log('PATCH', url);
    const headers = await getHeaders(true);
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse(response, url, 'PATCH');
  }

  static async delete(path = '', data = {}) {
    const url = buildUrl(path);
    log('DELETE', url);
    const headers = await getHeaders(true);
    const opts = { method: 'DELETE', headers };
    if (data && Object.keys(data).length) opts.body = JSON.stringify(data);
    const response = await fetch(url, opts);
    return handleResponse(response, url, 'DELETE');
  }
}

export { DataService };

// Drop-in helper for components that still call axios directly.
// Usage: const { data } = await apiFetch('/Customer/123');
export const apiFetch = async (path, options = {}) => {
  const url = buildUrl(path);
  const method = (options.method || 'GET').toUpperCase();
  const isFormPayload = isFormData(options.body);
  const hasBody = options.body != null;
  const baseHeaders = await getHeaders(hasBody && !isFormPayload);
  const headers = { ...baseHeaders, ...(options.headers || {}) };
  if (isFormPayload) delete headers['Content-Type'];
  const response = await fetch(url, { ...options, headers });
  return handleResponse(response, url, method);
};
