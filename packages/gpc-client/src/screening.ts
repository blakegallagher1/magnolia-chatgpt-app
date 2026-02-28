import type { ScreeningRequest, ScreeningResult, BatchScreeningRequest } from '@magnolia/shared-types';
import { GpcClient } from './client.js';

/**
 * Client methods for property screening endpoints.
 */
export class ScreeningClient extends GpcClient {
  /**
   * Run the 7-layer screening for a single parcel.
   * Calls POST /api/v1/screening/screen
   */
  async screenProperty(request: ScreeningRequest): Promise<ScreeningResult> {
    return this.post<ScreeningResult>('/api/v1/screening/screen', request);
  }

  /**
   * Get a previously completed screening result.
   * Calls GET /api/v1/screening/{parcel_id}
   */
  async getScreeningResult(parcelId: string): Promise<ScreeningResult> {
    return this.get<ScreeningResult>(`/api/v1/screening/${parcelId}`);
  }

  /**
   * Schedule a batch screening job.
   * Calls POST /api/v1/screening/batch
   */
  async scheduleBatch(request: BatchScreeningRequest & { scheduled_for?: string }): Promise<{
    job_id: string;
    parcel_count: number;
    scheduled_for: string;
    status: 'queued';
  }> {
    return this.post('/api/v1/screening/batch', request);
  }
}
