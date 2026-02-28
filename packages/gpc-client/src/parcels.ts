import type { Parcel, ParcelSearchParams, ParcelSearchResult } from '@magnolia/shared-types';
import { GpcClient } from './client.js';

/**
 * Client methods for parcel-related endpoints.
 */
export class ParcelsClient extends GpcClient {
  /**
   * Search parcels using natural language or structured filters.
   * Calls POST /api/v1/parcels/search
   */
  async searchParcels(params: ParcelSearchParams): Promise<ParcelSearchResult> {
    return this.post<ParcelSearchResult>('/api/v1/parcels/search', params);
  }

  /**
   * Get a single parcel by ID.
   * Calls GET /api/v1/parcels/{id}
   */
  async getParcel(parcelId: string): Promise<Parcel> {
    return this.get<Parcel>(`/api/v1/parcels/${parcelId}`);
  }

  /**
   * Get zoning details for a parcel.
   * Calls GET /api/v1/parcels/{id}/zoning
   */
  async getZoning(parcelId: string, proposedUse?: string): Promise<{
    compliant: boolean;
    district: string;
    analysis: string;
  }> {
    return this.get(`/api/v1/parcels/${parcelId}/zoning`, proposedUse ? { proposed_use: proposedUse } : undefined);
  }

  /**
   * Get flood risk for a parcel.
   * Calls GET /api/v1/parcels/{id}/flood-risk
   */
  async getFloodRisk(parcelId: string): Promise<{
    parcel_id: string;
    flood_zone: string;
    is_sfha: boolean;
    details: string;
  }> {
    return this.get(`/api/v1/parcels/${parcelId}/flood-risk`);
  }

  /**
   * Search ownership records.
   * Calls GET /api/v1/parcels/ownership
   */
  async searchOwnership(params: { parcel_id?: string; owner_name?: string; address?: string }): Promise<{
    owner: string;
    address: string;
    history: Array<{ date: string; price: number; grantor: string; grantee: string }>;
  }> {
    return this.get('/api/v1/parcels/ownership', params as Record<string, string>);
  }
}
