import type { Delta } from 'quill';
import type { Article, ApiError, Attachment } from './types';
import { API_URL } from './config';

export class ArticleApi {
  static async listArticles(): Promise<Article[]> {
    const response = await fetch(`${API_URL}/articles`);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to fetch articles');
    }
    return response.json();
  }

  static async getArticle(id: string): Promise<Article> {
    const response = await fetch(`${API_URL}/articles/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Article not found');
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to fetch article');
    }
    return response.json();
  }

  static async createArticle(
    title: string,
    content: Delta,
    attachments?: Attachment[]
  ): Promise<Article> {
    const response = await fetch(`${API_URL}/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, attachments: attachments || [] }),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to create article');
    }
    return response.json();
  }

  static async updateArticle(
    id: string,
    title: string,
    content: Delta,
    attachments?: Attachment[]
  ): Promise<Article> {
    const response = await fetch(`${API_URL}/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, attachments: attachments || [] }),
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Article not found');
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to update article');
    }
    return response.json();
  }

  static async deleteArticle(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/articles/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Article not found');
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to delete article');
    }
  }

  static async uploadFile(file: File): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }

    return response.json();
  }

  static async deleteAttachment(filename: string): Promise<void> {
    const response = await fetch(`${API_URL}/attachments/${filename}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Attachment not found');
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to delete attachment');
    }
  }

  static getAttachmentUrl(filename: string): string {
    return `${API_URL.replace('/api', '')}/attachments/${filename}`;
  }
}
