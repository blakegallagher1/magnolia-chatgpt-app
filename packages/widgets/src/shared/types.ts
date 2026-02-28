/**
 * Shared TypeScript types for widget tool results and data structures.
 * These mirror the shapes returned by the MCP tools.
 */

import type { DealStage } from '@magnolia/shared-types';

// ─── Map / Parcel ─────────────────────────────────────────────────────────────

export interface MapViewport {
  center: [number, number];
  zoom: number;
  bbox: [number, number, number, number];
}

export interface ParcelToolResult {
  geojson: unknown; // GeoJSON FeatureCollection
  total: number;
  bbox?: [number, number, number, number];
  filters_applied?: Record<string, unknown>;
}

// ─── Deal ─────────────────────────────────────────────────────────────────────

export interface DealMetrics {
  ask_price?: string;
  cap_rate?: string;
  cap_rate_variant?: 'default' | 'gold' | 'green' | 'red';
  noi?: string;
  irr?: string;
  irr_variant?: 'default' | 'gold' | 'green' | 'red';
  equity_multiple?: string;
  hold_period?: string;
  risk_score?: number;
}

export interface DealRecord {
  id: string;
  name: string;
  stage: DealStage;
  parcel_id?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface DealToolResult {
  deal: DealRecord;
  metrics: DealMetrics;
}

export const STAGE_CONFIG: Record<DealStage, { label: string; color: string; nextLabel?: string }> = {
  prospecting: { label: 'Prospecting', color: '#6B7280', nextLabel: 'Move to Screening' },
  screening: { label: 'Screening', color: '#F59E0B', nextLabel: 'Move to Due Diligence' },
  due_diligence: { label: 'Due Diligence', color: '#3B82F6', nextLabel: 'Move to Under Contract' },
  under_contract: { label: 'Under Contract', color: '#8B5CF6', nextLabel: 'Mark as Closed' },
  closed: { label: 'Closed', color: '#10B981' },
  dead: { label: 'Dead', color: '#EF4444' },
};

// ─── Market ───────────────────────────────────────────────────────────────────

export interface MarketMetric {
  label: string;
  value: string;
  percentile?: number; // 0–100, used for bar width
  color?: string;
}

export interface MarketToolResult {
  summary: {
    title: string;
    subtitle: string;
  };
  stats: Array<{
    label: string;
    value: string;
    delta?: string;
    trend?: 'up' | 'down' | 'flat';
  }>;
  chart: {
    labels: string[];
    datasets: Array<{
      label?: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }>;
  };
  metrics?: MarketMetric[];
}

// ─── Screening ────────────────────────────────────────────────────────────────

export interface ScreeningLayer {
  name: string;
  status: 'pass' | 'warn' | 'fail' | 'pending';
  summary: string;
  details?: string[];
}

export interface ScreeningToolResult {
  parcel_id: string;
  address: string;
  score: number; // 0–100
  recommendation: string;
  layers: ScreeningLayer[];
}
