import type { Delta } from "quill";
import type { Article, ApiError } from "./types";
import { API_URL } from "./config";

export class ArticleApi {
  static async listArticles(): Promise<Article[]> {
    const response = await fetch(`${API_URL}/articles`);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || "Failed to fetch articles");
    }
    return response.json();
  }

  static async getArticle(id: string): Promise<Article> {
    const response = await fetch(`${API_URL}/articles/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Article not found");
      }
      const error: ApiError = await response.json();
      throw new Error(error.error || "Failed to fetch article");
    }
    return response.json();
  }

  static async createArticle(title: string, content: Delta): Promise<Article> {
    const response = await fetch(`${API_URL}/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || "Failed to create article");
    }
    return response.json();
  }
}
