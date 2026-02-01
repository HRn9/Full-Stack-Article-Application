import React, { useState, useEffect, useCallback } from 'react';
import type { Article, AppView, Attachment, Workspace } from '../types';
import { ArticleApi, WorkspaceApi, CommentApi } from '../api';
import ArticleForm from '../components/ArticleForm';
import ArticleList from '../components/ArticleList';
import ArticleView from '../components/ArticleView';
import NotificationToast from '../components/NotificationToast';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Delta } from 'quill';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const ArticlesPage: React.FC = () => {
  const [view, setView] = useState<AppView>('list');
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingArticle, setLoadingArticle] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );
  const [workspaceError, setWorkspaceError] = useState<string>('');
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
  const [workspaceLoading, setWorkspaceLoading] = useState<boolean>(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState<boolean>(false);
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const [versionsMeta, setVersionsMeta] = useState<
    { id: string; version: number; title?: string; createdAt?: string }[]
  >([]);
  const [search, setSearch] = useState<string>('');

  const { notifications, isConnected, removeNotification } = useWebSocket();
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const handleNavigateToUsers = useCallback(() => {
    navigate('/users');
  }, [navigate]);

  const fetchWorkspaces = useCallback(async (): Promise<void> => {
    setWorkspaceLoading(true);
    setWorkspaceError('');
    try {
      const data = await WorkspaceApi.listWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not load workspaces';
      setWorkspaceError(message);
      if (message === 'Unauthorized') {
        handleLogout();
      }
    } finally {
      setWorkspaceLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const fetchArticles = useCallback(
    async (workspaceId?: string, searchQuery?: string): Promise<void> => {
      setLoading(true);
      setError('');
      try {
        const data = await ArticleApi.listArticles(workspaceId, searchQuery);
        setArticles(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not load articles';
        setError(`${message}. Check if backend is running.`);
        if (message === 'Unauthorized') {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    },
    [handleLogout]
  );

  useEffect(() => {
    fetchArticles(selectedWorkspaceId || undefined, search);
    setSelectedArticle(null);
    setViewingVersion(null);
    setVersionsMeta([]);
    setView('list');
  }, [selectedWorkspaceId, fetchArticles]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchArticles(selectedWorkspaceId || undefined, search);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, fetchArticles]);

  const handleSelectArticle = async (id: string): Promise<void> => {
    setLoadingArticle(true);
    setError('');
    try {
      const article = await ArticleApi.getArticle(id);
      setSelectedArticle(article);
      setViewingVersion(article.currentVersion ?? null);
      setVersionsMeta(article.versions || []);
      setView('view');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not load article';
      setError(message);
      if (message === 'Unauthorized') {
        handleLogout();
      }
    } finally {
      setLoadingArticle(false);
    }
  };

  const handleCreateArticle = async (
    title: string,
    content: Delta,
    attachments: Attachment[],
    workspaceId: string
  ): Promise<void> => {
    try {
      await ArticleApi.createArticle(title, content, attachments, workspaceId);
      await fetchArticles(workspaceId);
      setSelectedWorkspaceId(workspaceId);
      setView('list');
      setError('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create article';
      setError(message);
      if (message === 'Unauthorized') {
        handleLogout();
      }
      throw err;
    }
  };

  const handleUpdateArticle = async (
    title: string,
    content: Delta,
    attachments: Attachment[],
    workspaceId?: string
  ): Promise<void> => {
    if (!selectedArticle) return;

    try {
      await ArticleApi.updateArticle(
        selectedArticle.id,
        title,
        content,
        attachments,
        workspaceId
      );
      const targetWorkspace = workspaceId || selectedWorkspaceId || null;
      if (targetWorkspace) {
        await fetchArticles(targetWorkspace);
        setSelectedWorkspaceId(targetWorkspace);
      } else {
        await fetchArticles();
      }
      setView('list');
      setSelectedArticle(null);
      setError('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update article';
      setError(message);
      if (message === 'Unauthorized') {
        handleLogout();
      }
      throw err;
    }
  };

  const handleDeleteArticle = async (): Promise<void> => {
    if (!selectedArticle) return;

    try {
      await ArticleApi.deleteArticle(selectedArticle.id);
      await fetchArticles(selectedWorkspaceId || undefined);
      setView('list');
      setSelectedArticle(null);
      setViewingVersion(null);
      setError('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete article';
      setError(message);
      if (message === 'Unauthorized') {
        handleLogout();
      }
    }
  };

  const handleEditArticle = (): void => {
    setView('edit');
    setError('');
  };

  const handleSelectVersion = async (version: number): Promise<void> => {
    if (!selectedArticle) return;

    if (
      selectedArticle.currentVersion !== undefined &&
      version === selectedArticle.currentVersion
    ) {
      await handleSelectArticle(selectedArticle.id);
      return;
    }

    try {
      const versioned = await ArticleApi.getArticleVersion(
        selectedArticle.id,
        version
      );
      setSelectedArticle((prev) => ({
        ...versioned,
        versions: versionsMeta,
        comments: prev?.comments,
      }));
      setViewingVersion(version);
      setError('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not load version';
      setError(message);
      if (message === 'Unauthorized') {
        handleLogout();
      }
    }
  };

  const handleCreateWorkspace = async (): Promise<void> => {
    if (!newWorkspaceName.trim()) {
      setWorkspaceError('Workspace name is required');
      return;
    }

    try {
      const workspace = await WorkspaceApi.createWorkspace(
        newWorkspaceName.trim()
      );
      const updated = [...workspaces, workspace];
      setWorkspaces(updated);
      setNewWorkspaceName('');
      setWorkspaceError('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create workspace';
      setWorkspaceError(message);
      if (message === 'Unauthorized') {
        handleLogout();
      }
    }
  };

  const handleRenameWorkspace = async (): Promise<void> => {
    if (!selectedWorkspaceId) return;
    const current = workspaces.find((w) => w.id === selectedWorkspaceId);
    const nextName = window.prompt(
      'Enter new workspace name',
      current?.name || ''
    );
    if (!nextName || !nextName.trim()) return;

    try {
      const updated = await WorkspaceApi.updateWorkspace(
        selectedWorkspaceId,
        nextName.trim(),
        current?.description
      );
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === updated.id ? updated : w))
      );
      setWorkspaceError('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to rename workspace';
      setWorkspaceError(message);
      if (message === 'Unauthorized') {
        handleLogout();
      }
    }
  };

  const handleDeleteWorkspace = async (): Promise<void> => {
    if (!selectedWorkspaceId) return;
    const current = workspaces.find((w) => w.id === selectedWorkspaceId);
    if (
      !window.confirm(
        `Delete workspace "${current?.name || 'current'}"? Articles and comments inside will be removed.`
      )
    ) {
      return;
    }

    try {
      await WorkspaceApi.deleteWorkspace(selectedWorkspaceId);
      const remaining = workspaces.filter((w) => w.id !== selectedWorkspaceId);
      setWorkspaces(remaining);
      const nextSelected = remaining.length ? remaining[0].id : null;
      setSelectedWorkspaceId(nextSelected);
      setArticles([]);
      setSelectedArticle(null);
      setView('list');
      setWorkspaceError('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete workspace';
      setWorkspaceError(message);
      if (message === 'Unauthorized') {
        handleLogout();
      }
    }
  };

  const handleAddComment = async (
    articleId: string,
    body: string,
    author?: string
  ): Promise<void> => {
    try {
      const comment = await CommentApi.createComment(articleId, body, author);
      setSelectedArticle((prev) =>
        prev
          ? {
              ...prev,
              comments: [comment, ...(prev.comments || [])],
            }
          : prev
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add comment';
      setError(message);
      if (message === 'Unauthorized') {
        handleLogout();
      }
    }
  };

  const handleUpdateComment = async (
    articleId: string,
    commentId: string,
    body: string,
    author?: string
  ): Promise<void> => {
    try {
      const updated = await CommentApi.updateComment(
        articleId,
        commentId,
        body,
        author
      );

      setSelectedArticle((prev) =>
        prev
          ? {
              ...prev,
              comments: (prev.comments || []).map((comment) =>
                comment.id === updated.id ? updated : comment
              ),
            }
          : prev
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update comment';
      setError(message);
      if (message === 'Unauthorized') {
        handleLogout();
      }
    }
  };

  const handleDeleteComment = async (
    articleId: string,
    commentId: string
  ): Promise<void> => {
    try {
      await CommentApi.deleteComment(articleId, commentId);
      setSelectedArticle((prev) =>
        prev
          ? {
              ...prev,
              comments: (prev.comments || []).filter(
                (comment) => comment.id !== commentId
              ),
            }
          : prev
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete comment';
      setError(message);
      if (message === 'Unauthorized') {
        handleLogout();
      }
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 Article Manager</h1>
        <div className="header-right">
          <div
            className={`ws-status ${isConnected ? 'connected' : 'disconnected'}`}
          >
            <span
              className="ws-indicator"
              title={isConnected ? 'Connected' : 'Disconnected'}
            >
              {isConnected ? '🟢' : '🔴'}
            </span>
          </div>
          <nav className="nav">
            <button
              className={`nav-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              Articles
            </button>
            <button
              className={`nav-btn ${view === 'create' ? 'active' : ''}`}
              onClick={() => setView('create')}
              disabled={workspaces.length === 0}
            >
              Create New
            </button>
            {isAdmin && (
              <button className="nav-btn" onClick={handleNavigateToUsers}>
                User Management
              </button>
            )}
          </nav>
          <div className="workspace-menu-wrapper">
            {workspaces.length > 0 && (
              <span className="workspace-current" title="Current workspace">
                <span className="workspace-dot">●</span>
                {selectedWorkspaceId
                  ? workspaces.find((w) => w.id === selectedWorkspaceId)
                      ?.name || 'Workspace'
                  : 'All workspaces'}
              </span>
            )}
            <button
              className="icon-button"
              aria-label="Manage workspaces"
              onClick={() => setWorkspaceMenuOpen((prev) => !prev)}
              title="Manage workspaces"
            >
              ⚙️
            </button>
            <button
              className="icon-button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              🚪
            </button>
            {workspaceMenuOpen && (
              <div className="workspace-panel">
                <div className="workspace-row">
                  <label htmlFor="workspace-select">Workspace</label>
                  <select
                    id="workspace-select"
                    value={selectedWorkspaceId ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedWorkspaceId(value === '' ? null : value);
                    }}
                    disabled={workspaceLoading || workspaces.length === 0}
                  >
                    <option value="">All workspaces</option>
                    {workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </option>
                    ))}
                    {workspaces.length === 0 && (
                      <option value="" disabled>
                        No workspaces yet
                      </option>
                    )}
                  </select>
                </div>
                <div className="workspace-row">
                  <button
                    className="btn-secondary"
                    onClick={handleRenameWorkspace}
                    disabled={!selectedWorkspaceId}
                  >
                    Rename
                  </button>
                  <button
                    className="btn-danger"
                    onClick={handleDeleteWorkspace}
                    disabled={!selectedWorkspaceId}
                  >
                    Delete
                  </button>
                </div>
                <div className="workspace-row">
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="New workspace name"
                  />
                  <button
                    className="btn-primary"
                    onClick={handleCreateWorkspace}
                  >
                    + Add
                  </button>
                </div>
                {workspaceError && (
                  <div className="error-banner">{workspaceError}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {error && <div className="error-banner">{error}</div>}

        {view === 'list' && (
          <>
            <div className="articles-toolbar">
              <input
                type="text"
                placeholder="🔍 Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              {search && (
                <button
                  className="clear-search"
                  onClick={() => setSearch('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <ArticleList
              articles={articles}
              loading={loading}
              onSelectArticle={handleSelectArticle}
              onRefresh={() =>
                fetchArticles(selectedWorkspaceId || undefined, search)
              }
            />
          </>
        )}

        {view === 'view' &&
          (loadingArticle ? (
            <div className="loading">Loading article...</div>
          ) : selectedArticle ? (
            <ArticleView
              article={selectedArticle}
              versions={versionsMeta}
              currentVersion={selectedArticle.currentVersion ?? null}
              viewingVersion={viewingVersion}
              onSelectVersion={handleSelectVersion}
              onBack={() => setView('list')}
              onEdit={handleEditArticle}
              onDelete={handleDeleteArticle}
              onAddComment={handleAddComment}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
            />
          ) : null)}

        {view === 'create' && (
          <ArticleForm
            onSubmit={handleCreateArticle}
            onCancel={() => setView('list')}
            workspaces={workspaces}
            workspaceId={selectedWorkspaceId || undefined}
          />
        )}

        {view === 'edit' && selectedArticle && (
          <ArticleForm
            article={selectedArticle}
            onSubmit={handleUpdateArticle}
            onCancel={() => {
              setView('view');
              setError('');
            }}
            workspaces={workspaces}
            workspaceId={selectedWorkspaceId || undefined}
          />
        )}
      </main>

      <NotificationToast
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
};

export default ArticlesPage;
