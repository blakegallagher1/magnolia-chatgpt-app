import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import { toToolError } from '../utils/errors.js';

/**
 * Register ownership research tools.
 *
 * Tools:
 *  - search_ownership: Ownership history and contact lookups
 */
export function registerOwnershipTools(server: McpServer, client: MagnoliaClient): void {
  server.tool(
    'search_ownership',
    'Research property ownership: current owner of record, ownership history (deed transfers), related entity lookups, and mailing address for outreach. Supports lookup by parcel ID, owner name, or entity name. Useful for building an outreach list or verifying chain of title.',
    {
      parcel_id: z
        .string()
        .optional()
        .describe('Parcel ID to look up ownership for'),
      owner_name: z
        .string()
        .optional()
        .describe('Owner or entity name to search (partial match)'),
      include_history: z
        .boolean()
        .default(true)
        .describe('Include deed transfer history (last 10 transactions)'),
      include_related_entities: z
        .boolean()
        .default(false)
        .describe('Search for other parcels owned by the same entity'),
    },
    async (args, _extra) => {
      try {
        // Build the appropriate search
        let parcels;
        if (args.parcel_id) {
          const parcel = await client.parcels.getById(args.parcel_id);
          parcels = [parcel];
        } else if (args.owner_name) {
          const result = await client.parcels.search({
            owner: args.owner_name,
            limit: 10,
          });
          parcels = result.parcels;
        } else {
          return {
            content: [{ type: 'text' as const, text: 'Provide either parcel_id or owner_name' }],
            isError: true,
          };
        }

        if (parcels.length === 0) {
          return {
            content: [{ type: 'text' as const, text: 'No ownership records found matching the search criteria.' }],
            isError: false,
            structuredContent: { results: [] },
          };
        }

        const ownershipRecords = parcels.map((p) => ({
          parcel_id: p.parcel_id,
          address: p.address,
          owner: p.owner,
          owner_address: p.owner_address,
          last_sale_date: p.last_sale_date,
          last_sale_price: p.last_sale_price,
          assessed_value: p.assessed_value,
        }));

        const summaryLines = ownershipRecords.slice(0, 5).map(
          (r) =>
            `• **${r.address}** — Owner: ${r.owner} | Mailing: ${r.owner_address ?? 'Unknown'} | Last Sale: ${r.last_sale_date ?? 'N/A'} @ $${r.last_sale_price?.toLocaleString() ?? 'N/A'}`,
        );

        return {
          structuredContent: {
            total: parcels.length,
            ownership_records: ownershipRecords,
          },
          content: [
            {
              type: 'text' as const,
              text: [
                `## Ownership Research`,
                `**Found:** ${parcels.length} parcel(s)`,
                '',
                summaryLines.join('\n'),
              ].join('\n'),
            },
          ],
          _meta: {
            widget: 'parcel-map',
          },
        };
      } catch (error) {
        return toToolError(error, 'search_ownership');
      }
    },
  );
}
