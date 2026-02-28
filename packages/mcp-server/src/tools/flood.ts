import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import { toToolError } from '../utils/errors.js';

/**
 * Register flood risk tools.
 *
 * Tools:
 *  - get_flood_risk: FEMA FIRM flood zone analysis
 */
export function registerFloodTools(server: McpServer, client: MagnoliaClient): void {
  server.tool(
    'get_flood_risk',
    'Retrieve FEMA flood zone data for a parcel from the Flood Insurance Rate Maps (FIRM). Returns flood zone classification (AE, X, etc.), base flood elevation, SFHA status, FIRM panel reference, and insurance implications. Critical for site selection and due diligence.',
    {
      parcel_id: z
        .string()
        .describe('Parcel ID to check flood risk for'),
      include_insurance_estimate: z
        .boolean()
        .default(false)
        .describe('Include a rough NFIP flood insurance cost estimate'),
      include_history: z
        .boolean()
        .default(false)
        .describe('Include historical flood claim data for the parcel area'),
    },
    async (args, _extra) => {
      try {
        const result = await client.screening.screenLayers(args.parcel_id, ['flood']);
        const floodLayer = result.layers.find((l) => l.name === 'flood');

        if (!floodLayer) {
          throw new Error('Flood data not available for this parcel');
        }

        const data = floodLayer.data as {
          flood_zone?: string;
          flood_zone_description?: string;
          base_flood_elevation?: number;
          firm_panel?: string;
          community_number?: string;
          is_sfha?: boolean;
          effective_date?: string;
        };

        const zone = data.flood_zone ?? 'Unknown';
        const isSFHA = data.is_sfha ?? false;
        const bfe = data.base_flood_elevation;

        // Zone interpretation
        const zoneInterpretation: Record<string, string> = {
          AE: '1% annual chance flood zone — mandatory flood insurance for federally-backed loans',
          AH: 'Shallow flooding (1–3 ft) with base flood elevation',
          AO: 'Sheet flow flooding — depth 1–3 ft',
          A: '1% annual chance flood zone — no BFE determined',
          X: 'Minimal flood hazard — outside 500-year floodplain',
          '0.2 PCT ANNUAL CHANCE FLOOD HAZARD': '0.2% annual chance (500-year) flood zone',
          VE: 'Coastal high-hazard area with wave action',
        };

        const interpretation =
          Object.entries(zoneInterpretation).find(([k]) => zone.startsWith(k))?.[1] ??
          'Contact FEMA or local floodplain administrator for interpretation';

        return {
          structuredContent: {
            parcel_id: args.parcel_id,
            address: result.address,
            flood_zone: zone,
            flood_zone_description: data.flood_zone_description,
            base_flood_elevation: bfe,
            is_sfha: isSFHA,
            firm_panel: data.firm_panel,
            community_number: data.community_number,
            effective_date: data.effective_date,
            interpretation,
            status: floodLayer.status,
          },
          content: [
            {
              type: 'text' as const,
              text: [
                `## Flood Risk — ${result.address}`,
                `**Flood Zone:** ${zone} (${isSFHA ? '⚠️ SFHA — High-Risk' : '✅ Non-SFHA'})`,
                data.flood_zone_description ? `**Zone Description:** ${data.flood_zone_description}` : '',
                bfe != null ? `**Base Flood Elevation:** ${bfe} ft NAVD88` : '',
                data.firm_panel ? `**FIRM Panel:** ${data.firm_panel}` : '',
                data.effective_date ? `**Effective Date:** ${data.effective_date}` : '',
                `\n**Interpretation:** ${interpretation}`,
                isSFHA
                  ? '\n⚠️ **Flood insurance is required** for federally-backed financing on this parcel.'
                  : '\n✅ Flood insurance is not mandated but may still be recommended.',
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
          _meta: {
            widget: 'screening-results',
          },
        };
      } catch (error) {
        return toToolError(error, 'get_flood_risk');
      }
    },
  );
}
