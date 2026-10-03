// Cookie utility functions
export const cookieUtils = {
  // Set a cookie with expiration
  setCookie: (name, value, days = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const isSecure = window.location.protocol === 'https:';
    const secureFlag = isSecure ? ';Secure' : '';
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict${secureFlag}`;
  },

  // Get a cookie by name
  getCookie: (name) => {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  // Delete a cookie
  deleteCookie: (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
  },

  // Set user data in cookie (JSON stringified)
  setUserData: (userData, days = 7) => {
    const userJson = JSON.stringify(userData);
    cookieUtils.setCookie('user', userJson, days);
  },

  // Get user data from cookie (parsed from JSON)
  getUserData: () => {
    const userCookie = cookieUtils.getCookie('user');
    if (userCookie) {
      try {
        return JSON.parse(userCookie);
      } catch (error) {
        console.error('Error parsing user cookie:', error);
        return null;
      }
    }
    return null;
  },

  // Set login status
  setLoginStatus: (isLoggedIn, days = 7) => {
    cookieUtils.setCookie('isLoggedIn', isLoggedIn.toString(), days);
  },

  setAuthToken: (token, days = 7) => {
    cookieUtils.setCookie('authToken', token, days);
  },
  // Get login status
  getLoginStatus: () => {
    const loginStatus = cookieUtils.getCookie('isLoggedIn');
    return loginStatus === 'true';
  },

  // Clear all auth cookies
  clearAuthCookies: () => {
    cookieUtils.deleteCookie('user');
    cookieUtils.deleteCookie('isLoggedIn');
    cookieUtils.deleteCookie('token');
  },
};
