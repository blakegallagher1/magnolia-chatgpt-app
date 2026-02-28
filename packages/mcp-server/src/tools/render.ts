import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import { WIDGET_RESOURCE_URIS } from '../widgets/registry.js';
import { toToolError } from '../utils/errors.js';

/**
 * Register all render_* tools that instruct ChatGPT to display a widget.
 *
 * Tools:
 *  - render_parcel_map
 *  - render_deal_dashboard
 *  - render_market_report
 *  - render_comp_grid
 *  - render_screening_results
 *  - render_portfolio_view
 *  - render_document_viewer
 */
export function registerRenderTools(server: McpServer, _client: MagnoliaClient): void {
  // ── render_parcel_map ───────────────────────────────────────────────────────
  server.tool(
    'render_parcel_map',
    'Display an interactive MapLibre GL map showing parcel search results. Call this after search_parcels or any tool that returns GeoJSON parcel data to give the user a visual map. The map supports click-to-screen and viewport context updates.',
    {
      geojson: z
        .record(z.unknown())
        .optional()
        .describe('GeoJSON FeatureCollection to render (from search_parcels _meta.geojson)'),
      bbox: z
        .array(z.number())
        .length(4)
        .optional()
        .describe('Map bounding box [west, south, east, north]'),
      center: z
        .array(z.number())
        .length(2)
        .optional()
        .describe('Map center [lng, lat]'),
      zoom: z
        .number()
        .min(1)
        .max(22)
        .default(13)
        .describe('Initial zoom level (default 13)'),
      highlight_parcel_id: z
        .string()
        .optional()
        .describe('Parcel ID to highlight/focus on'),
      title: z
        .string()
        .optional()
        .describe('Map title displayed in the widget header'),
    },
    async (args, _extra) => {
      try {
        return {
          structuredContent: {
            widget: 'parcel-map',
            resource_uri: WIDGET_RESOURCE_URIS['parcel-map'],
            params: args,
          },
          content: [
            {
              type: 'text' as const,
              text: `Rendering interactive parcel map${args.title ? ` — ${args.title}` : ''}. Use the map to click parcels for details.`,
            },
          ],
          _meta: {
            widget: 'parcel-map',
            geojson: args.geojson,
            bbox: args.bbox as [number, number, number, number] | undefined,
            render_params: args,
          },
        };
      } catch (error) {
        return toToolError(error, 'render_parcel_map');
      }
    },
  );

  // ── render_deal_dashboard ───────────────────────────────────────────────────────
  server.tool(
    'render_deal_dashboard',
    'Display the deal metrics dashboard widget showing pipeline stage, financials, risk score gauge, timeline, and action buttons. Call after get_deal_status or analyze_deal to provide a visual summary.',
    {
      deal_data: z
        .record(z.unknown())
        .optional()
        .describe('Deal object (from get_deal_status structuredContent)'),
      show_actions: z
        .boolean()
        .default(true)
        .describe('Show action buttons (Run Due Diligence, Generate Memo, etc.)'),
    },
    async (args, _extra) => {
      try {
        return {
          structuredContent: {
            widget: 'deal-dashboard',
            resource_uri: WIDGET_RESOURCE_URIS['deal-dashboard'],
            params: args,
          },
          content: [
            {
              type: 'text' as const,
              text: 'Rendering deal dashboard.',
            },
          ],
          _meta: {
            widget: 'deal-dashboard',
            render_params: args,
          },
        };
      } catch (error) {
        return toToolError(error, 'render_deal_dashboard');
      }
    },
  );

  // ── render_market_report ───────────────────────────────────────────────────────
  server.tool(
    'render_market_report',
    'Display a market data report widget with time-series charts and key metric cards. Call after get_market_data or get_demographics to visualize the data.',
    {
      market_data: z
        .record(z.unknown())
        .optional()
        .describe('MarketDataResult or DemographicsResult from prior tool calls'),
      chart_type: z
        .enum(['line', 'bar', 'area'])
        .default('line')
        .describe('Preferred chart type'),
      title: z
        .string()
        .optional()
        .describe('Report title'),
    },
    async (args, _extra) => {
      try {
        return {
          structuredContent: {
            widget: 'market-report',
            resource_uri: WIDGET_RESOURCE_URIS['market-report'],
            params: args,
          },
          content: [
            {
              type: 'text' as const,
              text: `Rendering market report widget${args.title ? ` — ${args.title}` : ''}.`,
            },
          ],
          _meta: {
            widget: 'market-report',
            render_params: args,
          },
        };
      } catch (error) {
        return toToolError(error, 'render_market_report');
      }
    },
  );

  // ── render_comp_grid ─────────────────────────────────────────────────────────
  server.tool(
    'render_comp_grid',
    'Display a comparable transactions data grid with sortable columns and map pins. Call after run_comps.',
    {
      comps_data: z
        .record(z.unknown())
        .optional()
        .describe('CompsResult from run_comps structuredContent'),
    },
    async (args, _extra) => {
      try {
        return {
          structuredContent: {
            widget: 'comp-grid',
            resource_uri: WIDGET_RESOURCE_URIS['parcel-map'],
            params: args,
          },
          content: [
            {
              type: 'text' as const,
              text: 'Rendering comparables grid.',
            },
          ],
          _meta: {
            widget: 'comp-grid',
            render_params: args,
          },
        };
      } catch (error) {
        return toToolError(error, 'render_comp_grid');
      }
    },
  );

  // ── render_screening_results ───────────────────────────────────────────────────────
  server.tool(
    'render_screening_results',
    'Display a 7-layer screening results panel with pass/fail indicators and expandable detail sections. Call after screen_property, check_zoning, or get_flood_risk.',
    {
      screening_data: z
        .record(z.unknown())
        .optional()
        .describe('ScreeningResult from screen_property structuredContent'),
    },
    async (args, _extra) => {
      try {
        return {
          structuredContent: {
            widget: 'screening-results',
            resource_uri: WIDGET_RESOURCE_URIS['screening-results'],
            params: args,
          },
          content: [
            {
              type: 'text' as const,
              text: 'Rendering screening results panel.',
            },
          ],
          _meta: {
            widget: 'screening-results',
            render_params: args,
          },
        };
      } catch (error) {
        return toToolError(error, 'render_screening_results');
      }
    },
  );

  // ── render_portfolio_view ────────────────────────────────────────────────────────
  server.tool(
    'render_portfolio_view',
    'Display a portfolio overview dashboard showing all active deals across pipeline stages with aggregate metrics. Use to give an at-a-glance view of the full deal pipeline.',
    {
      stage_filter: z
        .array(
          z.enum(['prospect', 'triage', 'loi', 'under_contract', 'due_diligence', 'closing', 'closed']),
        )
        .optional()
        .describe('Filter by pipeline stages (omit to show all active)'),
    },
    async (args, _extra) => {
      try {
        return {
          structuredContent: {
            widget: 'portfolio-view',
            resource_uri: WIDGET_RESOURCE_URIS['deal-dashboard'],
            params: args,
          },
          content: [
            {
              type: 'text' as const,
              text: 'Rendering portfolio overview.',
            },
          ],
          _meta: {
            widget: 'portfolio-view',
            render_params: args,
          },
        };
      } catch (error) {
        return toToolError(error, 'render_portfolio_view');
      }
    },
  );

  // ── render_document_viewer ───────────────────────────────────────────────────────
  server.tool(
    'render_document_viewer',
    'Display a document viewer showing search results or full document text with highlighted relevant passages. Call after search_documents or fetch_knowledge.',
    {
      document_data: z
        .record(z.unknown())
        .optional()
        .describe('Document search results or full document content'),
      highlight_query: z
        .string()
        .optional()
        .describe('Query string to highlight in the document text'),
    },
    async (args, _extra) => {
      try {
        return {
          structuredContent: {
            widget: 'document-viewer',
            resource_uri: WIDGET_RESOURCE_URIS['document-viewer'],
            params: args,
          },
          content: [
            {
              type: 'text' as const,
              text: 'Rendering document viewer.',
            },
          ],
          _meta: {
            widget: 'document-viewer',
            render_params: args,
          },
        };
      } catch (error) {
        return toToolError(error, 'render_document_viewer');
      }
    },
  );
}
