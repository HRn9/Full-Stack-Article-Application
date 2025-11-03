import React, { useState, useEffect } from 'react';
import type { Article, AppView } from './types';
import { ArticleApi } from './api';
import './App.css';
import ArticleForm from './components/ArticleForm';
import ArticleList from './components/ArticleList';
import ArticleView from './components/ArticleView';
import type { Delta } from 'quill';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('list');
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingArticle, setLoadingArticle] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const data = await ArticleApi.listArticles();
      setArticles(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load articles';
      setError(`${message}. Check if backend is running.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArticle = async (id: string): Promise<void> => {
    setLoadingArticle(true);
    setError('');
    try {
      const article = await ArticleApi.getArticle(id);
      setSelectedArticle(article);
      setView('view');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load article';
      setError(message);
    } finally {
      setLoadingArticle(false);
    }
  };

  const handleCreateArticle = async (title: string, content: Delta): Promise<void> => {
    try {
      await ArticleApi.createArticle(title, content);
      await fetchArticles();
      setView('list');
      setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create article';
      setError(message);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 Article Manager</h1>
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
          >
            Create New
          </button>
        </nav>
      </header>

      <main className="app-main">
        {error && <div className="error-banner">{error}</div>}

        {view === 'list' && (
          <ArticleList 
            articles={articles}
            loading={loading}
            onSelectArticle={handleSelectArticle}
            onRefresh={fetchArticles}
          />
        )}

        {view === 'view' && (
          loadingArticle ? (
            <div className="loading">Loading article...</div>
          ) : selectedArticle ? (
            <ArticleView 
              article={selectedArticle}
              onBack={() => setView('list')}
            />
          ) : null
        )}

        {view === 'create' && (
          <ArticleForm 
            onSubmit={handleCreateArticle}
            onCancel={() => setView('list')}
          />
        )}
      </main>
    </div>
  );
};

export default App;