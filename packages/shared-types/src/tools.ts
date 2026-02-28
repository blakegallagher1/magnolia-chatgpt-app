import type { ParcelSearchParams, ParcelSearchResult } from './parcels.js';
import type { ScreeningRequest, ScreeningResult, BatchScreeningRequest } from './screening.js';
import type { Deal, CreateDealInput, UpdateDealInput, DealStage } from './deals.js';
import type { MarketDataRequest, MarketDataResponse, DemographicProfile, CompResult } from './market.js';

// ─── Tool Names ────────────────────────────────────────────────────────────────

/** All MCP tool names exposed by the server */
export type MCPToolName =
  // Parcel Intelligence
  | 'search_parcels'
  | 'screen_property'
  | 'check_zoning'
  | 'get_flood_risk'
  | 'search_ownership'
  // Deal Management
  | 'get_deal_status'
  | 'create_deal'
  | 'update_deal_status'
  | 'analyze_deal'
  | 'generate_investment_memo'
  // Market Intelligence
  | 'get_market_data'
  | 'get_demographics'
  | 'run_comps'
  // Documents & Knowledge
  | 'search_documents'
  | 'search_knowledge'
  | 'fetch_knowledge'
  // Workflows
  | 'run_due_diligence'
  | 'schedule_screening'
  // Rendering
  | 'render_parcel_map'
  | 'render_deal_dashboard'
  | 'render_market_report'
  | 'render_comp_grid'
  | 'render_screening_results'
  | 'render_portfolio_view'
  | 'render_document_viewer';

// ─── Tool Input / Output Maps ──────────────────────────────────────────────────

/** Input types for each MCP tool */
export interface MCPToolInputs {
  search_parcels: ParcelSearchParams;
  screen_property: ScreeningRequest;
  check_zoning: { parcel_id: string; proposed_use?: string };
  get_flood_risk: { parcel_id: string };
  search_ownership: { parcel_id?: string; owner_name?: string; address?: string };
  get_deal_status: { deal_id?: string; deal_name?: string; sku?: string };
  create_deal: CreateDealInput;
  update_deal_status: { deal_id: string; status: DealStage; notes?: string };
  analyze_deal: { deal_id: string; include_comps?: boolean; include_market?: boolean };
  generate_investment_memo: { deal_id: string; format?: 'markdown' | 'html' };
  get_market_data: MarketDataRequest;
  get_demographics: { fips: string; geo_type: 'state' | 'county' | 'msa' | 'tract' | 'zip' };
  run_comps: { parcel_id?: string; address?: string; property_type: string; radius_miles?: number; limit?: number };
  search_documents: { query: string; deal_id?: string; limit?: number };
  search_knowledge: { query: string; limit?: number };
  fetch_knowledge: { article_id: string };
  run_due_diligence: { deal_id: string; priority?: 'standard' | 'expedited' };
  schedule_screening: BatchScreeningRequest & { scheduled_for?: string };
  render_parcel_map: { parcel_ids: string[]; center?: [number, number]; zoom?: number };
  render_deal_dashboard: { deal_id: string; include_timeline?: boolean };
  render_market_report: { fips: string; report_type: 'overview' | 'retail' | 'office' | 'industrial' | 'multifamily' };
  render_comp_grid: { parcel_id: string; property_type: string; radius_miles?: number };
  render_screening_results: { parcel_id: string };
  render_portfolio_view: { filter_stage?: string };
  render_document_viewer: { document_id: string; highlight_terms?: string[] };
}

/** Output types for each MCP tool */
export interface MCPToolOutputs {
  search_parcels: ParcelSearchResult;
  screen_property: ScreeningResult;
  check_zoning: { compliant: boolean; district: string; analysis: string };
  get_flood_risk: { parcel_id: string; flood_zone: string; is_sfha: boolean; details: string };
  search_ownership: { owner: string; address: string; history: Array<{ date: string; price: number; grantor: string; grantee: string }> };
  get_deal_status: Deal;
  create_deal: Deal;
  update_deal_status: Deal;
  analyze_deal: { deal_id: string; analysis: string; financials: Record<string, number>; risks: string[]; opportunities: string[] };
  generate_investment_memo: { deal_id: string; memo: string; format: 'markdown' | 'html' };
  get_market_data: MarketDataResponse;
  get_demographics: DemographicProfile;
  run_comps: CompResult;
  search_documents: { total: number; results: Array<{ document_id: string; title: string; snippet: string; score: number }> };
  search_knowledge: { total: number; results: Array<{ article_id: string; title: string; snippet: string; score: number }> };
  fetch_knowledge: { article_id: string; title: string; content: string; updated_at: string };
  run_due_diligence: { workflow_id: string; status: 'scheduled' | 'running'; estimated_completion: string };
  schedule_screening: { job_id: string; parcel_count: number; scheduled_for: string; status: 'queued' };
  render_parcel_map: { resource_uri: string; widget_type: 'parcel_map' };
  render_deal_dashboard: { resource_uri: string; widget_type: 'deal_dashboard' };
  render_market_report: { resource_uri: string; widget_type: 'market_report' };
  render_comp_grid: { resource_uri: string; widget_type: 'comp_grid' };
  render_screening_results: { resource_uri: string; widget_type: 'screening_results' };
  render_portfolio_view: { resource_uri: string; widget_type: 'portfolio_view' };
  render_document_viewer: { resource_uri: string; widget_type: 'document_viewer' };
}
