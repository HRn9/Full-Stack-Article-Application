import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ArticlesPage from './pages/ArticlesPage';
import UserManagementPage from './pages/UserManagementPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import { useAuth } from './auth/AuthContext';

const App: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/app' : '/login'} replace />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <ArticlesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            {isAdmin ? <UserManagementPage /> : <Navigate to="/app" replace />}
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/app' : '/login'} replace />} />
    </Routes>
  );
};

export default App;
