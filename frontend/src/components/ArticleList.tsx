import type { Delta } from "quill";
import type { Article } from "../types";

interface ArticleListProps {
  articles: Article[];
  loading: boolean;
  onSelectArticle: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}
const getPreviewText = (content: Delta): string => {
  try {
    if (content && typeof content === 'object' && 'ops' in content) {
      return content.ops
        .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
        .join('')
        .slice(0, 150)
        .trim();
    }
    return '';
  } catch {
    return '';
  }
};

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
        <button onClick={onRefresh} className="btn-secondary">Refresh</button>
      </div>
    );
  }

  return (
    <div className="article-list-container">
      <div className="list-header">
        <h2>Articles ({articles.length})</h2>
        <button onClick={onRefresh} className="btn-secondary">Refresh</button>
      </div>
      <ul className="article-list">
        {articles.map((article) => (
          <li key={article.id} className="article-item">
            <button
              onClick={() => onSelectArticle(article.id)}
              className="article-link"
            >
              <h3>{article.title}</h3>
              <p>{getPreviewText(article.content) || 'No preview available'} ...</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArticleList;