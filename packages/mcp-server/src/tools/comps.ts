import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import { toToolError } from '../utils/errors.js';

/**
 * Register comparable sales/lease analysis tools.
 *
 * Tools:
 *  - run_comps: Pull comparable sales and lease transactions
 */
export function registerCompsTools(server: McpServer, client: MagnoliaClient): void {
  server.tool(
    'run_comps',
    'Run a comparable sales and/or lease analysis for a subject property. Returns recent transactions within a radius, with per-SF pricing, cap rates, and market summary statistics. Use to support valuation and underwriting.',
    {
      subject_parcel_id: z
        .string()
        .optional()
        .describe('Parcel ID of the subject property (preferred)'),
      address: z
        .string()
        .optional()
        .describe('Street address of the subject property (if parcel ID not available)'),
      property_type: z
        .string()
        .optional()
        .describe('Property type filter (e.g. "Retail", "Office", "Industrial", "Multifamily", "Land")'),
      transaction_type: z
        .enum(['sale', 'lease', 'both'])
        .default('sale')
        .describe('Transaction type: sale, lease, or both'),
      radius_miles: z
        .number()
        .positive()
        .default(3)
        .describe('Search radius in miles (default 3)'),
      months_back: z
        .number()
        .int()
        .positive()
        .default(36)
        .describe('How many months back to search (default 36 months)'),
      limit: z
        .number()
        .int()
        .positive()
        .max(50)
        .default(20)
        .describe('Maximum number of comparable transactions to return'),
    },
    async (args, _extra) => {
      try {
        const result = await client.market.getComps({
          subject_parcel_id: args.subject_parcel_id,
          address: args.address,
          property_type: args.property_type,
          transaction_type: args.transaction_type === 'both' ? undefined : args.transaction_type,
          radius_miles: args.radius_miles,
          months_back: args.months_back,
          limit: args.limit,
        });

        const compLines = result.comps.slice(0, 5).map((c) => {
          const psf = c.price_per_sf != null ? ` ($${c.price_per_sf.toFixed(0)}/SF)` : '';
          const cap = c.cap_rate != null ? ` @ ${(c.cap_rate * 100).toFixed(2)}% cap` : '';
          const dist = c.distance_miles != null ? ` [${c.distance_miles.toFixed(1)} mi]` : '';
          return `• ${c.address} — $${c.price.toLocaleString()}${psf}${cap} (${c.date.slice(0, 7)})${dist}`;
        });

        return {
          structuredContent: {
            subject: result.subject,
            comps_count: result.comps.length,
            median_price_per_sf: result.median_price_per_sf,
            avg_cap_rate: result.avg_cap_rate,
            comps: result.comps,
            summary: result.summary,
          },
          content: [
            {
              type: 'text' as const,
              text: [
                `## Comparable ${args.transaction_type === 'lease' ? 'Leases' : 'Sales'} — ${result.subject}`,
                `**Found:** ${result.comps.length} comps within ${args.radius_miles} miles`,
                result.median_price_per_sf != null
                  ? `**Median Price/SF:** $${result.median_price_per_sf.toFixed(0)}`
                  : '',
                result.avg_cap_rate != null
                  ? `**Avg Cap Rate:** ${(result.avg_cap_rate * 100).toFixed(2)}%`
                  : '',
                '',
                compLines.join('\n'),
                '',
                result.summary,
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
          _meta: {
            widget: 'comp-grid',
          },
        };
      } catch (error) {
        return toToolError(error, 'run_comps');
      }
    },
  );
}
