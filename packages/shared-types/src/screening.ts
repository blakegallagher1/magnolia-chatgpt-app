// ─── Screening Layer ──────────────────────────────────────────────────────────

/** Individual layer status values */
export type ScreeningStatus = 'pass' | 'fail' | 'warning' | 'unknown';

/** Names of all 7 screening layers */
export type ScreeningLayerName =
  | 'zoning'
  | 'flood'
  | 'soils'
  | 'wetlands'
  | 'epa'
  | 'traffic'
  | 'ldeq';

/** A single screening layer result */
export interface ScreeningLayer {
  /** Layer identifier */
  name: ScreeningLayerName;
  /** Human-readable label */
  label: string;
  /** Pass/fail/warning/unknown status */
  status: ScreeningStatus;
  /** Human-readable summary of findings */
  details: string;
  /** Raw data from the underlying data source */
  data: Record<string, unknown>;
  /** Data source attribution */
  source: string;
  /** When this layer was checked (ISO 8601) */
  checked_at: string;
}

// ─── Flood Layer Detail ───────────────────────────────────────────────────────

/** FEMA flood zone data */
export interface FloodLayerData {
  flood_zone: string;
  flood_zone_description: string;
  base_flood_elevation: number | null;
  firm_panel: string | null;
  community_number: string | null;
  is_sfha: boolean;
}

// ─── Soils Layer Detail ───────────────────────────────────────────────────────

/** USDA NRCS soils data */
export interface SoilsLayerData {
  map_units: Array<{
    symbol: string;
    name: string;
    percent_coverage: number;
    drainage_class: string;
    hydric: boolean;
  }>;
  dominant_drainage: string;
  has_hydric: boolean;
}

// ─── Zoning Layer Detail ──────────────────────────────────────────────────────

/** Zoning compliance detail */
export interface ZoningLayerData {
  district: string;
  description: string;
  permitted_uses: string[];
  conditional_uses: string[];
  min_lot_size_acres: number | null;
  max_building_coverage: number | null;
  max_height_ft: number | null;
  setbacks: {
    front: number | null;
    rear: number | null;
    side: number | null;
  };
}

// ─── Full Screening Result ────────────────────────────────────────────────────

/** Full 7-layer screening result for a parcel */
export interface ScreeningResult {
  /** Parcel being screened */
  parcel_id: string;
  /** Address of the parcel */
  address: string;
  /** All 7 layer results */
  layers: ScreeningLayer[];
  /** Overall score from 0–100 (100 = no issues) */
  overall_score: number;
  /** Summary of key findings */
  summary: string;
  /** Recommended next steps */
  recommendations: string[];
  /** When the screening was completed (ISO 8601) */
  timestamp: string;
}

// ─── Screening Request ────────────────────────────────────────────────────────

/** Request to screen a property */
export interface ScreeningRequest {
  /** Parcel ID to screen */
  parcel_id: string;
  /** Specific layers to run (omit for all 7) */
  layers?: ScreeningLayerName[];
}

/** Request to screen multiple parcels */
export interface BatchScreeningRequest {
  parcel_ids: string[];
  layers?: ScreeningLayerName[];
}
