import type {
  CompsResult,
  DemographicsResult,
  MarketDataRequest,
  MarketDataResult,
  MarketDataSource,
} from '@magnolia/shared-types';
import type { GpcClient } from './client.js';

/**
 * Client for market data: FRED, BLS, Census, BEA, HUD.
 */
export class MarketClient {
  constructor(private readonly client: GpcClient) {}

  /**
   * Fetch a time-series from any supported market data source.
   */
  async getSeries(req: MarketDataRequest): Promise<MarketDataResult> {
    return this.client.post<MarketDataResult>('/api/market/series', req);
  }

  /**
   * Get multiple series in one request.
   */
  async getMultipleSeries(requests: MarketDataRequest[]): Promise<MarketDataResult[]> {
    return this.client.post<MarketDataResult[]>('/api/market/series/batch', requests);
  }

  /**
   * Get current market snapshot for a given geography.
   */
  async getSnapshot(geography: string): Promise<{
    cap_rate: MarketDataResult | null;
    vacancy: MarketDataResult | null;
    rent: MarketDataResult | null;
    absorption: MarketDataResult | null;
  }> {
    return this.client.get('/api/market/snapshot', { geography });
  }

  /**
   * Convenience: Fetch a FRED series.
   */
  async getFred(seriesId: string, startDate?: string, endDate?: string): Promise<MarketDataResult> {
    const req: MarketDataRequest = { source: 'fred', series_id: seriesId };
    if (startDate !== undefined) req.start_date = startDate;
    if (endDate !== undefined) req.end_date = endDate;
    return this.getSeries(req);
  }

  /**
   * Convenience: Fetch a BLS series.
   */
  async getBls(seriesId: string, geography?: string): Promise<MarketDataResult> {
    const req: MarketDataRequest = { source: 'bls', series_id: seriesId };
    if (geography !== undefined) req.geography = geography;
    return this.getSeries(req);
  }

  /**
   * Get Census ACS demographic data for a geography.
   */
  async getDemographics(geography: string, year?: number): Promise<DemographicsResult> {
    return this.client.get<DemographicsResult>('/api/market/demographics', {
      geography,
      year: year?.toString(),
    });
  }

  /**
   * Run comparable sales/lease analysis.
   */
  async getComps(params: {
    subject_parcel_id?: string;
    address?: string;
    property_type?: string;
    radius_miles?: number;
    transaction_type?: 'sale' | 'lease';
    months_back?: number;
    limit?: number;
  }): Promise<CompsResult> {
    return this.client.post<CompsResult>('/api/market/comps', params);
  }
}
