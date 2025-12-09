import React, { useState } from 'react';
import type { Article } from '../types';
import QuillReadOnly from './QuillReadOnly';
import Attachments from './Attachments';
import CommentsSection from './CommentsSection';

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onAddComment: (articleId: string, body: string, author?: string) => Promise<void>;
  onUpdateComment: (
    articleId: string,
    commentId: string,
    body: string,
    author?: string
  ) => Promise<void>;
  onDeleteComment: (articleId: string, commentId: string) => Promise<void>;
}

const ArticleView: React.FC<ArticleViewProps> = ({
  article,
  onBack,
  onEdit,
  onDelete,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
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
        {article.workspace && (
          <div className="workspace-badge">
            Workspace: {article.workspace.name}
          </div>
        )}
        {article.attachments && article.attachments.length > 0 && (
          <div className="article-attachments">
            <Attachments
              attachments={article.attachments}
              pendingFiles={[]}
              onChange={() => {}}
              onPendingFilesChange={() => {}}
              readOnly={true}
            />
          </div>
        )}
        <div className="article-body">
          <QuillReadOnly delta={article.content} />
        </div>
        <CommentsSection
          articleId={article.id}
          comments={article.comments || []}
          onAdd={onAddComment}
          onUpdate={onUpdateComment}
          onDelete={onDeleteComment}
        />
      </article>
    </div>
  );
};

export default ArticleView;
