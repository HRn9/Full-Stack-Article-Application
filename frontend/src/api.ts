import type { Delta } from 'quill';
import type { Article, ApiError, Attachment, Workspace, Comment, User } from './types';
import { API_URL } from './config';

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(extra?: Record<string, string>) {
  const token = getToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleAuthResponse<T>(response: Response): Promise<T> {
  if (response.ok) return response.json();
  if (response.status === 401) {
    clearToken();
    throw new Error('Unauthorized');
  }
  const error: ApiError = await response.json();
  throw new Error(error.error || 'Request failed');
}

export class ArticleApi {
  static async listArticles(workspaceId?: string): Promise<Article[]> {
    const url =
      workspaceId !== undefined && workspaceId !== null && workspaceId !== ''
        ? `${API_URL}/articles?workspaceId=${encodeURIComponent(workspaceId)}`
        : `${API_URL}/articles`;
    const response = await fetch(url, { headers: authHeaders() });
    return handleAuthResponse<Article[]>(response);
  }

  static async getArticle(id: string): Promise<Article> {
    const response = await fetch(`${API_URL}/articles/${id}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Article not found');
      }
      if (response.status === 401) {
        clearToken();
        throw new Error('Unauthorized');
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to fetch article');
    }
    const data = await response.json();
    return {
      id: data.id,
      workspaceId: data.workspaceId,
      workspace: data.workspace,
      currentVersion: data.currentVersion,
      title: data.latestVersion?.title ?? data.title,
      content: data.latestVersion?.content ?? data.content,
      attachments: data.latestVersion?.attachments ?? data.attachments ?? [],
      versions: data.versions,
      comments: data.comments,
      creator: data.creator
    };
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
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
      if (response.status === 401) {
        clearToken();
        throw new Error('Unauthorized');
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to update article');
    }
    return response.json();
  }

  static async getArticleVersion(
    articleId: string,
    version: number
  ): Promise<Article> {
    const response = await fetch(
      `${API_URL}/articles/${articleId}/versions/${version}`,
      { headers: authHeaders() }
    );
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Version not found');
      }
      if (response.status === 401) {
        clearToken();
        throw new Error('Unauthorized');
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to fetch article version');
    }

    const data = await response.json();
    const mapped: Article = {
      id: data.id,
      workspaceId: data.workspaceId,
      workspace: data.workspace,
      title: data.title,
      content: data.content,
      attachments: data.attachments || [],
      currentVersion: data.latestVersion,
    };

    return mapped;
  }

  static async deleteArticle(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/articles/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Article not found');
      }
      if (response.status === 401) {
        clearToken();
        throw new Error('Unauthorized');
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
      headers: authHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearToken();
        throw new Error('Unauthorized');
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }

    return response.json();
  }

  static async deleteAttachment(filename: string): Promise<void> {
    const response = await fetch(`${API_URL}/attachments/${filename}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Attachment not found');
      }
      if (response.status === 401) {
        clearToken();
        throw new Error('Unauthorized');
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
    const response = await fetch(`${API_URL}/workspaces`, {
      headers: authHeaders(),
    });
    return handleAuthResponse<Workspace[]>(response);
  }

  static async createWorkspace(
    name: string,
    description?: string
  ): Promise<Workspace> {
    const response = await fetch(`${API_URL}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
      headers: authHeaders(),
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
    const response = await fetch(`${API_URL}/articles/${articleId}/comments`, {
      headers: authHeaders(),
    });
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
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
      { method: 'DELETE', headers: authHeaders() }
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

export class AuthApi {
  static async register(email: string, password: string): Promise<string> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to register');
    }
    const data: { token: string } = await response.json();
    return data.token;
  }

  static async login(email: string, password: string): Promise<string> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid credentials');
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to login');
    }
    const data: { token: string } = await response.json();
    return data.token;
  }
}

export class UserApi {
  static async listUsers(): Promise<User[]> {
    const response = await fetch(`${API_URL}/users`, {
      headers: authHeaders(),
    });
    return handleAuthResponse<User[]>(response);
  }

  static async updateUserRole(id: string, role: 'user' | 'admin'): Promise<User> {
    const response = await fetch(`${API_URL}/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ role }),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to update user role');
    }
    return response.json();
  }

  static async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('User not found');
      }
      if (response.status === 400) {
        throw new Error('Cannot delete yourself');
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
  }
}
