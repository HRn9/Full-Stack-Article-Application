import React, { useState } from 'react';
import type { Article } from '../types';
import QuillReadOnly from './QuillReadOnly';

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

const ArticleView: React.FC<ArticleViewProps> = ({
  article,
  onBack,
  onEdit,
  onDelete,
}) => {
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>('');

  const handleDelete = async (): Promise<void> => {
    if (
      !window.confirm(
        'Are you sure you want to delete this article? This action cannot be undone.'
      )
    ) {
      return;
    }

    setDeleting(true);
    setDeleteError('');
    try {
      await onDelete();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete article';
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="article-view-container">
      <div className="article-view-header">
        <button onClick={onBack} className="btn-back">
          ← Back to Articles
        </button>
        <div className="article-actions">
          <button
            onClick={onEdit}
            className="btn-secondary"
            disabled={deleting}
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="btn-danger"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      {deleteError && <div className="error-message">{deleteError}</div>}
      <article className="article-content">
        <h1>{article.title}</h1>
        <div className="article-body">
          <QuillReadOnly delta={article.content} />
        </div>
      </article>
    </div>
  );
};

export default ArticleView;
