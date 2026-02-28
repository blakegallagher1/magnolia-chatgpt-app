import type { MarketDataRequest, MarketDataResponse, DemographicProfile, CompResult } from '@magnolia/shared-types';
import { GpcClient } from './client.js';

/**
 * Client methods for market intelligence endpoints.
 */
export class MarketClient extends GpcClient {
  /**
   * Fetch economic data from FRED, BLS, Census, BEA, or HUD.
   * Calls POST /api/v1/market/data
   */
  async getMarketData(request: MarketDataRequest): Promise<MarketDataResponse> {
    return this.post<MarketDataResponse>('/api/v1/market/data', request);
  }

  /**
   * Get Census demographic profile for a geography.
   * Calls GET /api/v1/market/demographics
   */
  async getDemographics(fips: string, geoType: 'state' | 'county' | 'msa' | 'tract' | 'zip'): Promise<DemographicProfile> {
    return this.get<DemographicProfile>('/api/v1/market/demographics', { fips, geo_type: geoType });
  }

  /**
   * Run comparable sales/lease analysis.
   * Calls POST /api/v1/market/comps
   */
  async runComps(params: {
    parcel_id?: string;
    address?: string;
    property_type: string;
    radius_miles?: number;
    limit?: number;
  }): Promise<CompResult> {
    return this.post<CompResult>('/api/v1/market/comps', params);
  }
}
