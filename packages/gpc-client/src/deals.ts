import type { Deal, CreateDealInput, UpdateDealInput, DealStage } from '@magnolia/shared-types';
import { GpcClient } from './client.js';

/**
 * Client methods for deal management endpoints.
 */
export class DealsClient extends GpcClient {
  /**
   * Get a deal by ID, name, or SKU.
   * Calls GET /api/v1/deals/lookup
   */
  async getDeal(params: { deal_id?: string; deal_name?: string; sku?: string }): Promise<Deal> {
    return this.get<Deal>('/api/v1/deals/lookup', params as Record<string, string>);
  }

  /**
   * Create a new deal.
   * Calls POST /api/v1/deals
   */
  async createDeal(input: CreateDealInput): Promise<Deal> {
    return this.post<Deal>('/api/v1/deals', input);
  }

  /**
   * Update an existing deal.
   * Calls PATCH /api/v1/deals/{deal_id}
   */
  async updateDeal(dealId: string, input: UpdateDealInput): Promise<Deal> {
    return this.patch<Deal>(`/api/v1/deals/${dealId}`, input);
  }

  /**
   * Transition a deal to a new stage.
   * Calls POST /api/v1/deals/{deal_id}/stage
   */
  async updateDealStatus(dealId: string, status: DealStage, notes?: string): Promise<Deal> {
    return this.post<Deal>(`/api/v1/deals/${dealId}/stage`, { status, notes });
  }

  /**
   * Run AI analysis on a deal.
   * Calls POST /api/v1/deals/{deal_id}/analyze
   */
  async analyzeDeal(dealId: string, options?: { include_comps?: boolean; include_market?: boolean }): Promise<{
    deal_id: string;
    analysis: string;
    financials: Record<string, number>;
    risks: string[];
    opportunities: string[];
  }> {
    return this.post(`/api/v1/deals/${dealId}/analyze`, options ?? {});
  }

  /**
   * Generate an investment memo for a deal.
   * Calls POST /api/v1/deals/{deal_id}/memo
   */
  async generateMemo(dealId: string, format: 'markdown' | 'html' = 'markdown'): Promise<{
    deal_id: string;
    memo: string;
    format: 'markdown' | 'html';
  }> {
    return this.post(`/api/v1/deals/${dealId}/memo`, { format });
  }

  /**
   * Trigger the full due diligence Temporal workflow.
   * Calls POST /api/v1/deals/{deal_id}/due-diligence
   */
  async runDueDiligence(dealId: string, priority: 'standard' | 'expedited' = 'standard'): Promise<{
    workflow_id: string;
    status: 'scheduled' | 'running';
    estimated_completion: string;
  }> {
    return this.post(`/api/v1/deals/${dealId}/due-diligence`, { priority });
  }
}
