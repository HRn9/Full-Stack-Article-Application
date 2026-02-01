import React, { useState } from 'react';
import type { Article, ArticleVersionMeta } from '../types';
import QuillReadOnly from './QuillReadOnly';
import Attachments from './Attachments';
import CommentsSection from './CommentsSection';

interface ArticleViewProps {
  article: Article;
  versions?: ArticleVersionMeta[];
  currentVersion?: number | null;
  viewingVersion?: number | null;
  onSelectVersion?: (version: number) => void;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onAddComment: (
    articleId: string,
    body: string,
    author?: string
  ) => Promise<void>;
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
  versions = [],
  currentVersion = null,
  viewingVersion = null,
  onSelectVersion,
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

  const isViewingOldVersion =
    currentVersion !== null &&
    viewingVersion !== null &&
    viewingVersion !== currentVersion;

  return (
    <div className="article-view-container">
      <div className="article-view-header">
        <button onClick={onBack} className="btn-back">
          ← Back to Articles
        </button>
        <div className="article-actions">
          {versions.length > 0 && (
            <div className="version-selector">
              <label htmlFor="version-select">Version:</label>
              <select
                id="version-select"
                className="select-control"
                value={viewingVersion ?? currentVersion ?? ''}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (onSelectVersion) onSelectVersion(v);
                }}
              >
                {versions
                  .sort((a, b) => b.version - a.version)
                  .map((v) => (
                    <option key={v.id} value={v.version}>
                      v{v.version}{' '}
                      {v.version === currentVersion ? '(latest)' : ''}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <button
            onClick={onEdit}
            className="btn-secondary"
            disabled={
              deleting || (viewingVersion ?? currentVersion) !== currentVersion
            }
            title={
              (viewingVersion ?? currentVersion) !== currentVersion
                ? 'Editing only allowed on latest version'
                : 'Edit'
            }
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
        {(article.workspace || isViewingOldVersion) && (
          <div className="badge-row">
            {isViewingOldVersion && (
              <span className="version-badge warning" role="status">
                Viewing version v{viewingVersion} (latest is v{currentVersion}).
                Read-only.
              </span>
            )}
            {article.workspace && (
              <span className="workspace-badge" role="status">
                Workspace: {article.workspace.name}
              </span>
            )}
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
