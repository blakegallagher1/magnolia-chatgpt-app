import type { GpcClient } from './client.js';

export interface WorkflowRun {
  run_id: string;
  workflow_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  steps: WorkflowStep[];
  result: unknown | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface WorkflowStep {
  step_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at: string | null;
  completed_at: string | null;
  output: unknown | null;
}

export interface StartWorkflowRequest {
  workflow_name: string;
  deal_id: string;
  params?: Record<string, unknown>;
  conversation_id?: string;
}

/**
 * Client for GPC-CRES multi-step workflow orchestration.
 */
export class WorkflowsClient {
  constructor(private readonly client: GpcClient) {}

  /**
   * Start a named workflow.
   */
  async start(req: StartWorkflowRequest): Promise<{ run_id: string }> {
    return this.client.post<{ run_id: string }>('/api/workflows', req);
  }

  /**
   * Get workflow run status.
   */
  async getStatus(runId: string): Promise<WorkflowRun> {
    return this.client.get<WorkflowRun>(
      `/api/workflows/${encodeURIComponent(runId)}`,
    );
  }

  /**
   * Cancel a running workflow.
   */
  async cancel(runId: string): Promise<{ ok: boolean }> {
    return this.client.post<{ ok: boolean }>(
      `/api/workflows/${encodeURIComponent(runId)}/cancel`,
      {},
    );
  }

  /**
   * Run full due-diligence workflow on a deal.
   */
  async runDueDiligence(
    dealId: string,
    params?: Record<string, unknown>,
  ): Promise<{ run_id: string }> {
    return this.start({ workflow_name: 'due_diligence', deal_id: dealId, params });
  }

  /**
   * Run site-selection workflow.
   */
  async runSiteSelection(
    dealId: string,
    params?: Record<string, unknown>,
  ): Promise<{ run_id: string }> {
    return this.start({ workflow_name: 'site_selection', deal_id: dealId, params });
  }
}
