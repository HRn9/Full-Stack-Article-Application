import type { Delta } from 'quill';

export interface Article {
  id: string;
  title: string;
  content: Delta;
  preview?: string;
}

export interface ApiError {
  error: string;
}

export type AppView = 'list' | 'view' | 'create' | 'edit';
