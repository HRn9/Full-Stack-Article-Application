/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthApi, clearToken as clearStoredToken, getToken as getStoredToken, setToken as storeToken } from '../api';
import type { User } from '../types';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  pending: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function parseJwt(token: string): { sub: string; email: string; role: string } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
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
      
      // Parse user info from JWT
      const payload = parseJwt(jwt);
      if (payload) {
        setUser({
          id: payload.sub,
          email: payload.email,
          role: payload.role as 'user' | 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
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
      
      // Parse user info from JWT
      const payload = parseJwt(jwt);
      if (payload) {
        setUser({
          id: payload.sub,
          email: payload.email,
          role: payload.role as 'user' | 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to register';
      setError(msg);
      throw err;
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    const storedToken = getStoredToken();
    if (storedToken) {
      setToken(storedToken);
      const payload = parseJwt(storedToken);
      if (payload) {
        setUser({
          id: payload.sub,
          email: payload.email,
          role: payload.role as 'user' | 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      setToken(null);
      setUser(null);
    }
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        register,
        logout,
        isAuthenticated: Boolean(token),
        isAdmin,
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

