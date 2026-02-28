import { GpcClient } from './client.js';

/**
 * Client methods for document and knowledge base endpoints.
 */
export class DocumentsClient extends GpcClient {
  /**
   * Semantic search across deal documents stored in Qdrant.
   * Calls POST /api/v1/documents/search
   */
  async searchDocuments(query: string, options?: { deal_id?: string; limit?: number }): Promise<{
    total: number;
    results: Array<{ document_id: string; title: string; snippet: string; score: number }>;
  }> {
    return this.post('/api/v1/documents/search', { query, ...options });
  }

  /**
   * Semantic search across the GPC knowledge base.
   * Calls POST /api/v1/knowledge/search
   */
  async searchKnowledge(query: string, limit?: number): Promise<{
    total: number;
    results: Array<{ article_id: string; title: string; snippet: string; score: number }>;
  }> {
    return this.post('/api/v1/knowledge/search', { query, limit });
  }

  /**
   * Fetch the full content of a knowledge base article.
   * Calls GET /api/v1/knowledge/{article_id}
   */
  async fetchKnowledge(articleId: string): Promise<{
    article_id: string;
    title: string;
    content: string;
    updated_at: string;
  }> {
    return this.get(`/api/v1/knowledge/${articleId}`);
  }
}
