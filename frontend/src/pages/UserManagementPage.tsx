import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { User } from '../types';
import './UserManagementPage.css';
import { UserApi } from '../api';

const UserManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (user?.role !== 'admin') return;

    try {
      setLoading(true);
      setError(null);
      const data = await UserApi.listUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    if (!user || user.id === userId) {
      setError('You cannot change your own role');
      return;
    }

    try {
      setUpdating(userId);
      setError(null);
      const updatedUser = await UserApi.updateUserRole(userId, newRole);
      setUsers(prevUsers =>
        prevUsers.map(u => u.id === userId ? updatedUser : u)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!user || user.id === userId) {
      setError('You cannot delete yourself');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setUpdating(userId);
      setError(null);
      await UserApi.deleteUser(userId);
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setUpdating(null);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="user-management-container">
        <div className="error-banner">
          <span className="error-icon">🔒</span>
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    if (!loading) {
      await fetchUsers();
    }
  };

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h1 className="user-management-title">User Management</h1>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="refresh-btn"
        >
          {loading && <span className="spinner"></span>}
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
          <button className="error-close-btn" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          Loading users...
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem) => (
                <tr key={userItem.id}>
                  <td className="user-email">
                    {userItem.email}
                    {userItem.id === user.id && (
                      <span className="current-user-label"> (You)</span>
                    )}
                  </td>
                  <td>
                    <span className={`user-role-badge ${userItem.role}`}>
                      {userItem.role}
                    </span>
                  </td>
                  <td className="user-created">
                    {new Date(userItem.createdAt).toLocaleDateString()}
                  </td>
                  <td className="user-actions">
                    {userItem.id !== user.id && (
                      <>
                        {userItem.role === 'admin' ? (
                          <button
                            onClick={() => handleRoleChange(userItem.id, 'user')}
                            disabled={updating === userItem.id}
                            className={`role-btn ${updating === userItem.id ? 'updating' : ''}`}
                          >
                            {updating === userItem.id ? 'Updating...' : 'Remove Admin'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(userItem.id, 'admin')}
                            disabled={updating === userItem.id}
                            className={`role-btn make-admin-btn ${updating === userItem.id ? 'updating' : ''}`}
                          >
                            {updating === userItem.id ? 'Updating...' : 'Make Admin'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(userItem.id)}
                          disabled={updating === userItem.id}
                          className={`role-btn delete-btn ${updating === userItem.id ? 'updating' : ''}`}
                        >
                          {updating === userItem.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </>
                    )}
                    {userItem.id === user.id && (
                      <span className="current-user-note">Current user</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && !loading && (
            <div className="empty-state">
              No users found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;