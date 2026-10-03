import React, { createContext, useContext, useMemo, useState } from 'react';
import { signOutTemplateFirebase } from '../services/firebaseAuthService';

const AuthContext = createContext(null);
const authStorageKey = 'cusvya-template-auth';
const profileStorageKey = 'cusvya-template-profile';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(authStorageKey) || '');
  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem(profileStorageKey);
    return stored ? JSON.parse(stored) : null;
  });

  const contextValue = useMemo(
    () => ({
      token,
      profile,
      isAuthenticated: Boolean(token),
      login: (nextToken, nextProfile) => {
        localStorage.setItem(authStorageKey, nextToken);
        localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
        setToken(nextToken);
        setProfile(nextProfile);
      },
      logout: async () => {
        await signOutTemplateFirebase();
        localStorage.removeItem(authStorageKey);
        localStorage.removeItem(profileStorageKey);
        setToken('');
        setProfile(null);
      },
    }),
    [profile, token],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
