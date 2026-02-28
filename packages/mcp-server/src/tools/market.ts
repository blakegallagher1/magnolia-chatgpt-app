import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import { toToolError } from '../utils/errors.js';

/**
 * Register market data tools.
 *
 * Tools:
 *  - get_market_data: Fetch economic time-series from FRED, BLS, Census, BEA, HUD
 */
export function registerMarketTools(server: McpServer, client: MagnoliaClient): void {
  server.tool(
    'get_market_data',
    'Fetch economic and market data from public APIs: FRED (Federal Reserve), BLS (Bureau of Labor Statistics), Census ACS, BEA (Bureau of Economic Analysis), HUD (housing data). Use for interest rates, employment, population trends, housing metrics, CPI, and commercial real estate market indicators.',
    {
      source: z
        .enum(['fred', 'bls', 'census', 'bea', 'hud'])
        .describe('Data source: fred=Federal Reserve, bls=Bureau of Labor Statistics, census=Census ACS, bea=Bureau of Economic Analysis, hud=HUD housing data'),
      series_id: z
        .string()
        .describe(
          'Series or variable identifier. FRED examples: "MORTGAGE30US" (30yr mortgage rate), "FEDFUNDS" (fed funds rate), "CPIAUCSL" (CPI). BLS examples: "CUUR0000SA0" (CPI all urban). Census: ACS variable like "B19013_001E" (median household income).',
        ),
      geography: z
        .string()
        .optional()
        .describe(
          'Geographic scope. FIPS code (e.g. "22033" for EBR Parish), MSA name (e.g. "Baton Rouge, LA MSA"), or state (e.g. "LA")',
        ),
      start_date: z
        .string()
        .optional()
        .describe('Start date in YYYY-MM-DD format (e.g. "2020-01-01")'),
      end_date: z
        .string()
        .optional()
        .describe('End date in YYYY-MM-DD format (defaults to latest available)'),
      frequency: z
        .enum(['daily', 'weekly', 'monthly', 'quarterly', 'annual'])
        .optional()
        .describe('Observation frequency (source default if omitted)'),
    },
    async (args, _extra) => {
      try {
        const result = await client.market.getSeries({
          source: args.source,
          series_id: args.series_id,
          geography: args.geography,
          start_date: args.start_date,
          end_date: args.end_date,
          frequency: args.frequency,
        });

        // Build sparkline summary (last 12 data points)
        const recent = result.data_points.slice(-12);
        const sparkData = recent.map((d) => `${d.date.slice(0, 7)}: ${d.value}`).join(', ');

        const yoyText =
          result.yoy_change != null
            ? ` (${result.yoy_change >= 0 ? '+' : ''}${(result.yoy_change * 100).toFixed(2)}% YoY)`
            : '';

        return {
          structuredContent: {
            source: result.source,
            series_id: result.series_id,
            series_name: result.series_name,
            geography: result.geography,
            latest_value: result.latest_value,
            latest_date: result.latest_date,
            yoy_change: result.yoy_change,
            data_points: result.data_points,
            metadata: result.metadata,
          },
          content: [
            {
              type: 'text' as const,
              text: [
                `## ${result.series_name} (${result.source.toUpperCase()})`,
                `**Geography:** ${result.geography || 'National'}`,
                result.latest_value != null
                  ? `**Latest (${result.latest_date}):** ${result.latest_value.toLocaleString()} ${result.data_points[0]?.unit ?? ''}${yoyText}`
                  : '',
                recent.length > 0 ? `\n**Recent data:** ${sparkData}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
          _meta: {
            widget: 'market-report',
          },
        };
      } catch (error) {
        return toToolError(error, 'get_market_data');
      }
    },
  );
}
