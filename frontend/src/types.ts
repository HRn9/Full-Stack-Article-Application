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
  commentCount?: number;
  currentVersion?: number;
  latestVersion?: ArticleVersion;
  versions?: ArticleVersionMeta[];
  workspaceId: string;
  workspace?: Workspace;
  comments?: Comment[];
}

export interface ArticleVersion {
  id: string;
  version: number;
  title: string;
  content: Delta;
  attachments?: Attachment[];
}

export interface ArticleVersionMeta {
  id: string;
  version: number;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
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
  workspaceId?: string;
  workspaceName?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  articleCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  articleId: string;
  author?: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}
