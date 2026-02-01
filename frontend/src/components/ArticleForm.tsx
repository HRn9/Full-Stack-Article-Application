import React, { useRef, useEffect, useState } from 'react';
import Quill, { Delta } from 'quill';
import 'quill/dist/quill.snow.css';
import type { Article, Attachment, Workspace } from '../types';
import Attachments from './Attachments';
import { ArticleApi } from '../api';

interface ArticleFormProps {
  article?: Article;
  onSubmit: (
    title: string,
    content: Delta,
    attachments: Attachment[],
    workspaceId: string
  ) => Promise<void>;
  onCancel: () => void;
  workspaces: Workspace[];
  workspaceId?: string;
}

const ArticleForm: React.FC<ArticleFormProps> = ({
  article,
  onSubmit,
  onCancel,
  workspaces,
  workspaceId: workspaceIdProp,
}) => {
  const [title, setTitle] = useState<string>(article?.title || '');
  const [content, setContent] = useState<Delta | undefined>(article?.content);
  const [attachments, setAttachments] = useState<Attachment[]>(
    article?.attachments || []
  );
  const [workspaceId, setWorkspaceId] = useState<string>(
    article?.workspaceId || workspaceIdProp || ''
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<string>('');
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
            ['clean'],
          ],
        },
        placeholder: 'Write your article here...',
      });

      quillRef.current.on('text-change', () => {
        const delta = quillRef.current?.getContents();
        setContent(delta);
      });
    }
  }, []);

  useEffect(() => {
    if (quillRef.current && article?.content) {
      quillRef.current.setContents(article.content);
      setContent(article.content);
      setTitle(article.title);
      setAttachments(article.attachments || []);
      setPendingFiles([]);
      setWorkspaceId(article.workspaceId || workspaceIdProp || '');
    } else if (quillRef.current && !article) {
      quillRef.current.setText('');
      setContent(undefined);
      setTitle('');
      setAttachments([]);
      setPendingFiles([]);
      setWorkspaceId(workspaceIdProp || '');
    }
  }, [article, workspaceIdProp]);

  useEffect(() => {
    if (!workspaceId && workspaces.length > 0) {
      setWorkspaceId(workspaceIdProp || workspaces[0].id);
    }
  }, [workspaceId, workspaceIdProp, workspaces]);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError('');
    setUploadProgress('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!content) {
      setError('Content is required');
      return;
    }

    if (!workspaceId) {
      setError('Workspace is required');
      return;
    }

    setSubmitting(true);

    try {
      const uploadedAttachments: Attachment[] = [];

      if (pendingFiles.length > 0) {
        setUploadProgress(`Uploading ${pendingFiles.length} file(s)...`);

        for (let i = 0; i < pendingFiles.length; i++) {
          const file = pendingFiles[i];
          setUploadProgress(
            `Uploading file ${i + 1} of ${pendingFiles.length}: ${file.name}`
          );

          try {
            const uploadedFile = await ArticleApi.uploadFile(file);
            uploadedAttachments.push(uploadedFile);
          } catch (uploadError) {
            const message =
              uploadError instanceof Error
                ? uploadError.message
                : 'Failed to upload file';
            throw new Error(`Failed to upload ${file.name}: ${message}`);
          }
        }
      }

      const allAttachments = [...attachments, ...uploadedAttachments];

      setUploadProgress('Saving article...');

      await onSubmit(title, content, allAttachments, workspaceId);

      setTitle('');
      setAttachments([]);
      setPendingFiles([]);
      setWorkspaceId(workspaceIdProp || '');
      if (quillRef.current) {
        quillRef.current.setText('');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to submit article';
      setError(message);
    } finally {
      setSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="article-form-container">
      <h2>{article ? 'Edit Article' : 'Create New Article'}</h2>
      <form onSubmit={handleSubmit} className="article-form">
        {error && <div className="error-message">{error}</div>}
        {uploadProgress && (
          <div className="upload-progress">{uploadProgress}</div>
        )}

        <div className="form-group">
          <label htmlFor="workspace-select">Workspace *</label>
          <select
            id="workspace-select"
            className="select-control"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            disabled={submitting || workspaces.length === 0}
          >
            <option value="" disabled>
              Select workspace
            </option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
          {workspaces.length === 0 && (
            <small className="helper-text">
              Create a workspace before adding articles
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTitle(e.target.value)
            }
            placeholder="Enter article title"
            maxLength={200}
            disabled={submitting}
          />
          <small>{title.length}/200</small>
        </div>

        <div className="form-group">
          <label htmlFor="quill-editor">Content *</label>
          <div ref={editorContainerRef} id="quill-editor" />
        </div>

        <div className="form-group">
          <Attachments
            attachments={attachments}
            pendingFiles={pendingFiles}
            onChange={setAttachments}
            onPendingFilesChange={setPendingFiles}
            readOnly={false}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting
              ? uploadProgress || (article ? 'Updating...' : 'Publishing...')
              : article
                ? 'Update Article'
                : 'Publish Article'}
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
