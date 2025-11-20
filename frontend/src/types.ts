import type { Delta } from 'quill';

export interface Attachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

export interface Article {
  id: string;
  title: string;
  content: Delta;
  preview?: string;
  attachments?: Attachment[];
  attachmentCount?: number;
}

export interface ApiError {
  error: string;
}

export type AppView = 'list' | 'view' | 'create' | 'edit';

export interface Notification {
  type:
    | 'article_created'
    | 'article_updated'
    | 'article_deleted'
  articleId?: string;
  title?: string;
  filename?: string;
  message: string;
  timestamp: string;
}
