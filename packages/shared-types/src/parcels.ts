import type { Coordinates, GeoJSONFeature, GeoJSONFeatureCollection } from './common.js';

// ─── Parcel Core ─────────────────────────────────────────────────────────────

/** A single parcel record from the PostGIS database (198K EBR parcels). */
export interface Parcel {
  /** Internal UUID primary key */
  id: string;
  /** Parish parcel identifier (e.g. "1234567890") */
  parcel_id: string;
  /** Street address */
  address: string;
  /** City */
  city: string;
  /** State (typically "LA") */
  state: string;
  /** ZIP code */
  zip: string;
  /** Current owner of record */
  owner: string;
  /** Owner mailing address */
  owner_address: string | null;
  /** Zoning district code (e.g. "C-1", "R-1A", "M-1") */
  zoning: string;
  /** Full zoning description */
  zoning_description: string | null;
  /** Land use classification */
  land_use: string;
  /** Land use description */
  land_use_description: string | null;
  /** Parcel area in acres */
  acres: number;
  /** Total assessed value in USD */
  assessed_value: number;
  /** Land assessed value in USD */
  land_value: number;
  /** Improvement assessed value in USD */
  improvement_value: number;
  /** Year last assessed */
  assessment_year: number | null;
  /** Longitude of parcel centroid */
  lng: number;
  /** Latitude of parcel centroid */
  lat: number;
  /** GeoJSON geometry (polygon or multipolygon) */
  geometry: GeoJSONFeature['geometry'];
  /** Subdivision name, if applicable */
  subdivision: string | null;
  /** Tax district */
  tax_district: string | null;
  /** Last sale date (ISO 8601) */
  last_sale_date: string | null;
  /** Last sale price in USD */
  last_sale_price: number | null;
  /** When this record was last updated */
  updated_at: string;
}

// ─── Search Parameters ────────────────────────────────────────────────────────

/** Parameters for parcel search endpoint */
export interface ParcelSearchParams {
  /** Natural language query (e.g. "commercial parcels near I-10 with 5+ acres") */
  query?: string;
  /** Bounding box as [west, south, east, north] WGS84 */
  bbox?: [number, number, number, number];
  /** Search radius in miles from center point */
  radius_miles?: number;
  /** Center point [lng, lat] for radius search */
  center?: Coordinates;
  /** Zoning district filter (exact or partial match) */
  zoning?: string;
  /** Land use category filter */
  land_use?: string;
  /** Minimum acreage */
  min_acres?: number;
  /** Maximum acreage */
  max_acres?: number;
  /** Minimum assessed value in USD */
  min_assessed_value?: number;
  /** Maximum assessed value in USD */
  max_assessed_value?: number;
  /** Owner name search (partial match) */
  owner?: string;
  /** Max number of results to return */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

// ─── Search Result ────────────────────────────────────────────────────────────

/** Result from parcel search */
export interface ParcelSearchResult {
  /** Total number of matching parcels (may exceed returned set) */
  total: number;
  /** Array of matching parcels (up to `limit`) */
  parcels: Parcel[];
  /** Bounding box of returned results [west, south, east, north] */
  bbox: [number, number, number, number] | null;
  /** GeoJSON FeatureCollection of returned parcels */
  geojson: GeoJSONFeatureCollection;
}
