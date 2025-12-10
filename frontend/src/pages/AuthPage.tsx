import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Navigate, Link } from 'react-router-dom';

interface AuthPageProps {
  mode: 'login' | 'register';
}

const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const { login, register, isAuthenticated, pending, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setLocalError(authError || '');
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Authentication failed';
      setLocalError(message);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="app auth-app">
      <header className="app-header">
        <h1>{mode === 'login' ? 'Login' : 'Register'}</h1>
        <div className="nav">
          <Link className={`nav-btn ${mode === 'login' ? 'active' : ''}`} to="/login">
            Login
          </Link>
          <Link className={`nav-btn ${mode === 'register' ? 'active' : ''}`} to="/register">
            Register
          </Link>
        </div>
      </header>
      <main className="app-main">
        {localError && <div className="error-banner">{localError}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </div>
          <div className="form-actions">
            <button
              className="btn-primary"
              type="submit"
              disabled={pending || !email || !password}
            >
              {pending ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AuthPage;

