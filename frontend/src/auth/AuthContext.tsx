/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthApi, clearToken as clearStoredToken, getToken as getStoredToken, setToken as storeToken } from '../api';

interface AuthContextValue {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  pending: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setError(null);
    setPending(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setPending(true);
    setError(null);
    try {
      const jwt = await AuthApi.login(email, password);
      storeToken(jwt);
      setToken(jwt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to login';
      setError(msg);
      throw err;
    } finally {
      setPending(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setPending(true);
    setError(null);
    try {
      const jwt = await AuthApi.register(email, password);
      storeToken(jwt);
      setToken(jwt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to register';
      setError(msg);
      throw err;
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    if (!getStoredToken()) {
      setToken(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        register,
        logout,
        isAuthenticated: Boolean(token),
        pending,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

