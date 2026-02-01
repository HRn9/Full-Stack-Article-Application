import React, { useState } from 'react';
import type { Comment } from '../types';
import { useAuth } from '../auth/AuthContext';

interface CommentsSectionProps {
  articleId: string;
  comments: Comment[];
  onAdd: (articleId: string, body: string, author?: string) => Promise<void>;
  onUpdate: (
    articleId: string,
    commentId: string,
    body: string,
    author?: string
  ) => Promise<void>;
  onDelete: (articleId: string, commentId: string) => Promise<void>;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  articleId,
  comments,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const { user } = useAuth();
  const [author, setAuthor] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const canEditComment = (comment: Comment) => {
    if (!user) return false;
    return user.role === 'admin' || 
           (comment.creatorId === user.id);
  };

  const handleAdd = async () => {
    if (!body.trim()) {
      setError('Comment text is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onAdd(articleId, body.trim(), author.trim() || undefined);
      setAuthor('');
      setBody('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add comment';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (comment: Comment) => {
    const nextBody = window.prompt('Edit comment', comment.body);
    if (nextBody === null) return;
    if (!nextBody.trim()) {
      setError('Comment text cannot be empty');
      return;
    }
    const nextAuthor = comment.author || undefined;

    try {
      await onUpdate(articleId, comment.id, nextBody.trim(), nextAuthor);
      setError('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update comment';
      setError(message);
    }
  };

  const handleDelete = async (comment: Comment) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await onDelete(articleId, comment.id);
      setError('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete comment';
      setError(message);
    }
  };

  return (
    <section className="comments-section">
      <div className="comments-header">
        <h3>Comments ({comments.length})</h3>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="comment-form">
        <input
          type="text"
          placeholder="Your name (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          disabled={saving}
        />
        <textarea
          placeholder="Add a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={saving}
          rows={3}
        />
        <button
          type="button"
          className="btn-primary"
          onClick={handleAdd}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Add Comment'}
        </button>
      </div>

      <div className="comments-list">
        {comments.length === 0 && (
          <div className="empty-state">No comments yet.</div>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            <div className="comment-actions">
              {canEditComment(comment) && (
                <button
                  type="button"
                  className="comment-action-btn"
                  onClick={() => handleUpdate(comment)}
                  title="Edit comment"
                  aria-label="Edit comment"
                >
                  ✏️
                </button>
              )}
              {canEditComment(comment) && (
                <button
                  type="button"
                  className="comment-action-btn"
                  onClick={() => handleDelete(comment)}
                  title="Delete comment"
                  aria-label="Delete comment"
                >
                  ❌
                </button>
              )}
            </div>
            <div className="comment-meta">
              <strong>{comment.author || 'Anonymous'}</strong>
            </div>
            <p className="comment-body">{comment.body}</p>
            <div className="comment-footer">
              <span className="comment-date">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CommentsSection;

