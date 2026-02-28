// ─── Data Sources ─────────────────────────────────────────────────────────────

/** Supported market data sources */
export type MarketDataSource = 'fred' | 'bls' | 'census' | 'bea' | 'hud';

// ─── Market Data Request ──────────────────────────────────────────────────────

/** Request for market data from public APIs */
export interface MarketDataRequest {
  /** Which API to query */
  source: MarketDataSource;
  /** Series or dataset identifier (e.g. FRED series ID "GNPCA") */
  series_id?: string;
  /** Geography FIPS code */
  fips?: string;
  /** Geography type */
  geo_type?: 'state' | 'county' | 'msa' | 'tract' | 'zip';
  /** Start date (ISO 8601) */
  start_date?: string;
  /** End date (ISO 8601) */
  end_date?: string;
  /** Additional source-specific parameters */
  params?: Record<string, string | number>;
}

// ─── Market Data Point ──────────────────────────────────────────────────────

/** A single time-series data point */
export interface MarketDataPoint {
  date: string;
  value: number;
  unit?: string;
}

// ─── Market Data Response ───────────────────────────────────────────────────

/** Response from a market data API */
export interface MarketDataResponse {
  source: MarketDataSource;
  series_id: string | null;
  title: string;
  geography: string | null;
  frequency: string | null;
  units: string;
  data: MarketDataPoint[];
  metadata: Record<string, unknown>;
}

// ─── Demographics ──────────────────────────────────────────────────────────────

/** Census demographic profile for a geography */
export interface DemographicProfile {
  fips: string;
  geography_name: string;
  geo_type: string;
  population: number;
  median_household_income: number;
  per_capita_income: number;
  poverty_rate: number;
  unemployment_rate: number;
  median_age: number;
  owner_occupied_rate: number;
  renter_occupied_rate: number;
  vacancy_rate: number;
  population_growth_5yr: number | null;
  median_home_value: number;
  median_gross_rent: number;
  college_attainment_rate: number;
  data_year: number;
}

// ─── Comparable Sales ──────────────────────────────────────────────────────────

/** A single comp (sale or lease) */
export interface Comp {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  property_type: string;
  transaction_type: 'sale' | 'lease';
  transaction_date: string;
  sale_price: number | null;
  price_per_sf: number | null;
  lease_rate_psf: number | null;
  gross_sf: number;
  nla_sf: number | null;
  cap_rate: number | null;
  occupancy_at_sale: number | null;
  lat: number;
  lng: number;
  distance_miles: number | null;
  source: string;
}

/** Result of a comp search */
export interface CompResult {
  total: number;
  comps: Comp[];
  summary: {
    avg_price_psf: number | null;
    median_price_psf: number | null;
    avg_cap_rate: number | null;
    avg_lease_rate: number | null;
  };
}
