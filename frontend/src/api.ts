import type { Delta } from 'quill';
import type {
  Article,
  ApiError,
  Attachment,
  Workspace,
  Comment,
} from './types';
import { API_URL } from './config';

export class ArticleApi {
  static async listArticles(workspaceId?: string): Promise<Article[]> {
    const url =
      workspaceId !== undefined && workspaceId !== null && workspaceId !== ''
        ? `${API_URL}/articles?workspaceId=${encodeURIComponent(workspaceId)}`
        : `${API_URL}/articles`;
    const response = await fetch(url);
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
    attachments: Attachment[],
    workspaceId: string
  ): Promise<Article> {
    if (!workspaceId) {
      throw new Error('Workspace is required to create an article');
    }

    const response = await fetch(`${API_URL}/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        workspaceId,
        attachments: attachments || [],
      }),
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
    attachments: Attachment[],
    workspaceId?: string
  ): Promise<Article> {
    const response = await fetch(`${API_URL}/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        workspaceId,
        attachments: attachments || [],
      }),
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

export class WorkspaceApi {
  static async listWorkspaces(): Promise<Workspace[]> {
    const response = await fetch(`${API_URL}/workspaces`);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to fetch workspaces');
    }
    return response.json();
  }

  static async createWorkspace(
    name: string,
    description?: string
  ): Promise<Workspace> {
    const response = await fetch(`${API_URL}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to create workspace');
    }
    return response.json();
  }

  static async updateWorkspace(
    id: string,
    name: string,
    description?: string | null
  ): Promise<Workspace> {
    const response = await fetch(`${API_URL}/workspaces/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Workspace not found');
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to update workspace');
    }

    return response.json();
  }

  static async deleteWorkspace(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/workspaces/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Workspace not found');
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to delete workspace');
    }
  }
}

export class CommentApi {
  static async listComments(articleId: string): Promise<Comment[]> {
    const response = await fetch(`${API_URL}/articles/${articleId}/comments`);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to fetch comments');
    }
    return response.json();
  }

  static async createComment(
    articleId: string,
    body: string,
    author?: string
  ): Promise<Comment> {
    const response = await fetch(`${API_URL}/articles/${articleId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, author }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to create comment');
    }

    return response.json();
  }

  static async updateComment(
    articleId: string,
    commentId: string,
    body: string,
    author?: string
  ): Promise<Comment> {
    const response = await fetch(
      `${API_URL}/articles/${articleId}/comments/${commentId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, author }),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Comment not found');
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to update comment');
    }

    return response.json();
  }

  static async deleteComment(
    articleId: string,
    commentId: string
  ): Promise<void> {
    const response = await fetch(
      `${API_URL}/articles/${articleId}/comments/${commentId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Comment not found');
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to delete comment');
    }
  }
}
