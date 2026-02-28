// ─── Primitive Helpers ─────────────────────────────────────────────────────────

/** [longitude, latitude] coordinate pair */
export type Coordinates = [number, number];

/** ISO 8601 date string */
export type ISODateString = string;

/** UUID v4 string */
export type UUID = string;

// ─── GeoJSON Types ──────────────────────────────────────────────────────────────

/** GeoJSON geometry object */
export interface GeoJSONGeometry {
  type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon' | 'GeometryCollection';
  coordinates: unknown;
}

/** GeoJSON Feature */
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: Record<string, unknown>;
  id?: string | number;
}

/** GeoJSON FeatureCollection */
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

/** Generic success response wrapper */
export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

/** Generic error response */
export interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

/** Either a success or error response */
export type ApiResult<T> = ApiResponse<T> | ApiError;

// ─── Pagination ─────────────────────────────────────────────────────────────────

/** Pagination parameters */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/** Paginated response metadata */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ─── Auth ───────────────────────────────────────────────────────────────────────

/** Auth context passed to every MCP tool handler */
export interface AuthContext {
  /** Authenticated user ID (Supabase UUID) */
  user_id: string;
  /** API key used (masked) */
  api_key_hint: string;
  /** Request ID for tracing */
  request_id: string;
}
