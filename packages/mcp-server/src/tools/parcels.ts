import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import { toToolError } from '../utils/errors.js';

/**
 * Register parcel search tools.
 *
 * Tools:
 *  - search_parcels: Natural language + spatial + attribute search across 198K EBR parcels
 */
export function registerParcelTools(server: McpServer, client: MagnoliaClient): void {
  server.tool(
    'search_parcels',
    'Natural language search across 198,000+ East Baton Rouge Parish parcels. Supports spatial queries (bounding box, radius from point), attribute filters (owner name, zoning district, land use category, acreage range, assessed value range), and full-text queries. Returns parcel details with coordinates and GeoJSON for map rendering.',
    {
      query: z
        .string()
        .optional()
        .describe(
          'Natural language query, e.g. "commercial parcels near I-10 corridor with 5+ acres" or "properties owned by XYZ LLC"',
        ),
      bbox: z
        .array(z.number())
        .length(4)
        .optional()
        .describe('Bounding box [west_lng, south_lat, east_lng, north_lat] in WGS84'),
      radius_miles: z
        .number()
        .positive()
        .optional()
        .describe('Search radius in miles from the center point'),
      center: z
        .array(z.number())
        .length(2)
        .optional()
        .describe('Center point [longitude, latitude] for radius search'),
      zoning: z
        .string()
        .optional()
        .describe('Zoning district code or partial name (e.g. "C-1", "Heavy Commercial", "R-")'),
      land_use: z
        .string()
        .optional()
        .describe('Land use category filter (e.g. "Commercial", "Industrial", "Vacant Land")'),
      min_acres: z.number().nonnegative().optional().describe('Minimum parcel area in acres'),
      max_acres: z.number().positive().optional().describe('Maximum parcel area in acres'),
      min_assessed_value: z
        .number()
        .nonnegative()
        .optional()
        .describe('Minimum total assessed value in USD'),
      max_assessed_value: z
        .number()
        .positive()
        .optional()
        .describe('Maximum total assessed value in USD'),
      owner: z
        .string()
        .optional()
        .describe('Owner name search (partial match, case-insensitive)'),
      limit: z
        .number()
        .int()
        .positive()
        .max(200)
        .default(25)
        .describe('Maximum number of results to return (default 25, max 200)'),
      offset: z
        .number()
        .int()
        .nonnegative()
        .default(0)
        .describe('Pagination offset (default 0)'),
    },
    async (args, _extra) => {
      try {
        const result = await client.parcels.search({
          ...args,
          bbox: args.bbox as [number, number, number, number] | undefined,
          center: args.center as [number, number] | undefined,
        });

        // Summarize top results for the model
        const topParcels = result.parcels.slice(0, 10).map((p) => ({
          parcel_id: p.parcel_id,
          address: p.address,
          owner: p.owner,
          zoning: p.zoning,
          land_use: p.land_use,
          acres: p.acres,
          assessed_value: p.assessed_value,
          coordinates: [p.lng, p.lat] as [number, number],
        }));

        const summaryLines = result.parcels
          .slice(0, 5)
          .map((p) => `• ${p.address} — ${p.zoning}, ${p.acres} ac, $${p.assessed_value.toLocaleString()} assessed`)
          .join('\n');

        return {
          structuredContent: {
            total: result.total,
            returned: result.parcels.length,
            parcels: topParcels,
            summary: `Found ${result.total} parcels${args.query ? ` matching "${args.query}"` : ''}`,
          },
          content: [
            {
              type: 'text' as const,
              text: `Found **${result.total}** parcels${args.query ? ` matching "${args.query}"` : ''}. Showing top ${Math.min(5, result.parcels.length)}:\n\n${summaryLines}`,
            },
          ],
          _meta: {
            widget: 'parcel-map',
            geojson: result.geojson,
            bbox: result.bbox ?? undefined,
          },
        };
      } catch (error) {
        return toToolError(error, 'search_parcels');
      }
    },
  );
}
