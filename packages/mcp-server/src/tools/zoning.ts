import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import { toToolError } from '../utils/errors.js';

/**
 * Register zoning analysis tools.
 *
 * Tools:
 *  - check_zoning: Detailed zoning compliance and permitted use analysis
 */
export function registerZoningTools(server: McpServer, client: MagnoliaClient): void {
  server.tool(
    'check_zoning',
    'Retrieve detailed zoning information for a parcel: district classification, permitted uses (by-right), conditional uses (require approval), development standards (setbacks, height limits, FAR, lot coverage), and compatibility with a proposed use. Uses the East Baton Rouge Parish Unified Development Code.',
    {
      parcel_id: z
        .string()
        .describe('Parcel ID to check zoning for'),
      proposed_use: z
        .string()
        .optional()
        .describe(
          'Proposed use or development type to check compatibility (e.g. "drive-through restaurant", "self-storage", "multifamily 50 units")',
        ),
      include_adjacent: z
        .boolean()
        .default(false)
        .describe('Also return zoning of immediately adjacent parcels'),
    },
    async (args, _extra) => {
      try {
        // Use the screening client for the zoning layer with detailed output
        const result = await client.screening.screenLayers(args.parcel_id, ['zoning']);
        const zoningLayer = result.layers.find((l) => l.name === 'zoning');

        if (!zoningLayer) {
          throw new Error('Zoning data not available for this parcel');
        }

        const data = zoningLayer.data as {
          district?: string;
          description?: string;
          permitted_uses?: string[];
          conditional_uses?: string[];
          min_lot_size_acres?: number;
          max_building_coverage?: number;
          max_height_ft?: number;
          setbacks?: { front?: number; rear?: number; side?: number };
        };

        // Check proposed use compatibility
        let compatibilityText = '';
        if (args.proposed_use) {
          const isPermitted = data.permitted_uses?.some((u) =>
            u.toLowerCase().includes(args.proposed_use!.toLowerCase()),
          );
          const isConditional = data.conditional_uses?.some((u) =>
            u.toLowerCase().includes(args.proposed_use!.toLowerCase()),
          );
          if (isPermitted) {
            compatibilityText = `✅ "${args.proposed_use}" appears to be a **permitted use** in ${data.district}`;
          } else if (isConditional) {
            compatibilityText = `⚠️ "${args.proposed_use}" may be allowed as a **conditional use** in ${data.district} — requires CUP/SUP approval`;
          } else {
            compatibilityText = `❌ "${args.proposed_use}" does not appear to be permitted in ${data.district} — verify with parish planning`;
          }
        }

        return {
          structuredContent: {
            parcel_id: args.parcel_id,
            address: result.address,
            district: data.district,
            description: data.description,
            permitted_uses: data.permitted_uses ?? [],
            conditional_uses: data.conditional_uses ?? [],
            development_standards: {
              min_lot_size_acres: data.min_lot_size_acres,
              max_building_coverage: data.max_building_coverage,
              max_height_ft: data.max_height_ft,
              setbacks: data.setbacks,
            },
            proposed_use: args.proposed_use,
            proposed_use_compatible: compatibilityText || null,
          },
          content: [
            {
              type: 'text' as const,
              text: [
                `## Zoning — ${result.address}`,
                `**District:** ${data.district} — ${data.description}`,
                compatibilityText,
                data.permitted_uses?.length
                  ? `\n**Permitted Uses (by-right):** ${data.permitted_uses.slice(0, 8).join(', ')}${data.permitted_uses.length > 8 ? ` (+${data.permitted_uses.length - 8} more)` : ''}`
                  : '',
                data.conditional_uses?.length
                  ? `**Conditional Uses:** ${data.conditional_uses.slice(0, 5).join(', ')}${data.conditional_uses.length > 5 ? ` (+${data.conditional_uses.length - 5} more)` : ''}`
                  : '',
                data.max_height_ft != null ? `**Max Height:** ${data.max_height_ft} ft` : '',
                data.max_building_coverage != null
                  ? `**Max Lot Coverage:** ${(data.max_building_coverage * 100).toFixed(0)}%`
                  : '',
                data.setbacks
                  ? `**Setbacks:** Front ${data.setbacks.front ?? 'N/A'} ft | Rear ${data.setbacks.rear ?? 'N/A'} ft | Side ${data.setbacks.side ?? 'N/A'} ft`
                  : '',
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
          _meta: { widget: 'screening-results' },
        };
      } catch (error) {
        return toToolError(error, 'check_zoning');
      }
    },
  );
}
