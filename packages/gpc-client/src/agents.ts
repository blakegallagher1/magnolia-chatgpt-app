import type { AgentInvokeRequest, AgentInvokeResult } from '@magnolia/shared-types';
import type { GpcClient } from './client.js';

/** Available specialist agent names in GPC-CRES */
export type AgentName =
  | 'parcel_analyst'
  | 'market_analyst'
  | 'underwriter'
  | 'due_diligence_coordinator'
  | 'environmental_screener'
  | 'zoning_analyst'
  | 'flood_analyst'
  | 'demographic_analyst'
  | 'comp_analyst'
  | 'document_reviewer'
  | 'deal_manager'
  | 'memo_writer'
  | 'ownership_researcher'
  | 'site_selector'
  | 'portfolio_manager'
  | 'risk_assessor';

/** Status of a running agent task */
export interface AgentTaskStatus {
  task_id: string;
  agent_name: AgentName;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result: unknown | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * Client for invoking GPC-CRES specialist AI agents.
 * The 16 agents run on the OpenAI Agents SDK backend.
 */
export class AgentsClient {
  constructor(private readonly client: GpcClient) {}

  /**
   * Synchronously invoke an agent and wait for the result.
   */
  async invoke(req: AgentInvokeRequest): Promise<AgentInvokeResult> {
    return this.client.post<AgentInvokeResult>('/api/agents/invoke', req);
  }

  /**
   * Start an async agent task (fire and poll).
   */
  async startTask(req: AgentInvokeRequest): Promise<{ task_id: string }> {
    return this.client.post<{ task_id: string }>('/api/agents/tasks', req);
  }

  /**
   * Poll agent task status.
   */
  async getTaskStatus(taskId: string): Promise<AgentTaskStatus> {
    return this.client.get<AgentTaskStatus>(
      `/api/agents/tasks/${encodeURIComponent(taskId)}`,
    );
  }

  /**
   * Invoke the deal analyzer agent.
   */
  async analyzeDeal(
    dealId: string,
    conversationId?: string,
  ): Promise<AgentInvokeResult> {
    return this.invoke({
      agent_name: 'deal_manager',
      payload: { deal_id: dealId, conversation_id: conversationId },
    });
  }

  /**
   * Invoke the memo writer agent.
   */
  async writeMemo(
    dealId: string,
    memoType: string,
    conversationId?: string,
  ): Promise<AgentInvokeResult> {
    return this.invoke({
      agent_name: 'memo_writer',
      payload: { deal_id: dealId, memo_type: memoType, conversation_id: conversationId },
    });
  }
}
