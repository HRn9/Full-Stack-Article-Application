import React, { useRef, useEffect, useState } from 'react';
import Quill, { Delta } from 'quill';
import 'quill/dist/quill.snow.css';

interface ArticleFormProps {
  onSubmit: (title: string, content: Delta) => Promise<void>;
  onCancel: () => void;
}

const ArticleForm: React.FC<ArticleFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<Delta>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (editorContainerRef.current && !quillRef.current) {
      editorContainerRef.current.innerHTML = '';

      const editorElement = document.createElement('div');
      editorContainerRef.current.appendChild(editorElement);

      quillRef.current = new Quill(editorElement, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean']
          ]
        },
        placeholder: 'Write your article here...',
      });

      quillRef.current.on('text-change', () => {
        const delta = quillRef.current?.getContents();
        setContent(delta);
      });
    }
  }, []);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
  
    if (!content) {
      setError('Content is required');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(title, content);
      setTitle('');
      if (quillRef.current) {
        quillRef.current.setText('');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit article';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="article-form-container">
      <h2>Create New Article</h2>
      <form onSubmit={handleSubmit} className="article-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Enter article title"
            maxLength={200}
            disabled={submitting}
          />
          <small>{title.length}/200</small>
        </div>

        <div className="form-group">
          <label htmlFor="quill-editor">Content *</label>
          <div 
            ref={editorContainerRef}
            id="quill-editor"
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Publishing...' : 'Publish Article'}
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArticleForm;