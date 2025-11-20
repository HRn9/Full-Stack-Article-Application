import React, { useState, useRef } from 'react';
import type { Attachment } from '../types';
import { ArticleApi } from '../api';

interface AttachmentsProps {
  attachments: Attachment[];
  pendingFiles: File[];
  onChange: (attachments: Attachment[]) => void;
  onPendingFilesChange: (files: File[]) => void;
  readOnly?: boolean;
}

const Attachments: React.FC<AttachmentsProps> = ({
  attachments,
  pendingFiles,
  onChange,
  onPendingFilesChange,
  readOnly = false,
}) => {
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype: string): string => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    return '📎';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        'Invalid file type. Only images (JPG, PNG, GIF, WEBP) and PDFs are allowed.'
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setError('');
    onPendingFilesChange([...pendingFiles, file]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (attachment: Attachment) => {
    if (!window.confirm(`Remove "${attachment.originalName}"?`)) {
      return;
    }

    const updatedAttachments = attachments.filter(
      (a) => a.filename !== attachment.filename
    );
    onChange(updatedAttachments);
  };

  const handleRemovePendingFile = (index: number) => {
    const updatedFiles = pendingFiles.filter((_, i) => i !== index);
    onPendingFilesChange(updatedFiles);
  };

  const handleViewAttachment = (attachment: Attachment) => {
    const fullUrl = ArticleApi.getAttachmentUrl(attachment.filename);
    window.open(fullUrl, '_blank');
  };

  if (readOnly && attachments.length === 0) {
    return null;
  }

  const totalCount = attachments.length + pendingFiles.length;

  return (
    <div className="attachments-container">
      <div className="attachments-header">
        <h3>📎 Attachments {totalCount > 0 && `(${totalCount})`}</h3>
        {!readOnly && (
          <div className="attachment-upload">
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="btn-upload">
              + Add File
            </label>
            <small className="upload-hint">
              Images (JPG, PNG, GIF, WEBP) or PDF • Max 10MB
            </small>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {(attachments.length > 0 || pendingFiles.length > 0) && (
        <div className="attachments-list">
          {attachments.map((attachment) => (
            <div key={attachment.filename} className="attachment-item">
              <div className="attachment-icon">
                {getFileIcon(attachment.mimetype)}
              </div>
              <div className="attachment-info">
                <div
                  className="attachment-name"
                  title={attachment.originalName}
                >
                  {attachment.originalName}
                </div>
                <div className="attachment-meta">
                  {formatFileSize(attachment.size)}
                </div>
              </div>
              <div className="attachment-actions">
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => handleViewAttachment(attachment)}
                  title="View attachment"
                >
                  👁️
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    className="btn-icon btn-danger-icon"
                    onClick={() => handleRemoveAttachment(attachment)}
                    title="Remove attachment"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}

          {!readOnly &&
            pendingFiles.map((file, index) => (
              <div
                key={`pending-${index}`}
                className="attachment-item attachment-pending"
              >
                <div className="attachment-icon">{getFileIcon(file.type)}</div>
                <div className="attachment-info">
                  <div className="attachment-name" title={file.name}>
                    {file.name}
                  </div>
                  <div className="attachment-meta">
                    {formatFileSize(file.size)} • <em>Will upload on save</em>
                  </div>
                </div>
                <div className="attachment-actions">
                  <button
                    type="button"
                    className="btn-icon btn-danger-icon"
                    onClick={() => handleRemovePendingFile(index)}
                    title="Remove file"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Attachments;
