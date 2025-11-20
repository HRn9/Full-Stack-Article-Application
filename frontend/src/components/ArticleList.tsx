import type { Article } from '../types';

interface ArticleListProps {
  articles: Article[];
  loading: boolean;
  onSelectArticle: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  loading,
  onSelectArticle,
  onRefresh,
}) => {
  if (loading) return <div className="loading">Loading articles...</div>;

  if (articles.length === 0) {
    return (
      <div className="empty-state">
        <p>No articles yet. Create one to get started!</p>
        <button onClick={onRefresh} className="btn-secondary">
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="article-list-container">
      <div className="list-header">
        <h2>Articles ({articles.length})</h2>
        <button onClick={onRefresh} className="btn-secondary">
          Refresh
        </button>
      </div>
      <ul className="article-list">
        {articles.map((article) => (
          <li key={article.id} className="article-item">
            <button
              onClick={() => onSelectArticle(article.id)}
              className="article-link"
            >
              <h3>{article.title}</h3>
              <p>{article.preview || 'No preview available'} ...</p>
              {article.attachmentCount !== undefined &&
                article.attachmentCount > 0 && (
                  <small>
                    📎 {article.attachmentCount} attachment
                    {article.attachmentCount !== 1 ? 's' : ''}
                  </small>
                )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArticleList;
