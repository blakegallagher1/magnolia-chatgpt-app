import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import { toToolError } from '../utils/errors.js';

/**
 * Register 7-layer environmental/regulatory screening tools.
 *
 * Tools:
 *  - screen_property: Run full or partial screening for a parcel
 */
export function registerScreeningTools(server: McpServer, client: MagnoliaClient): void {
  server.tool(
    'screen_property',
    'Run a comprehensive 7-layer environmental and regulatory screening for a parcel. Layers: (1) Zoning compliance, (2) FEMA flood zones, (3) USDA soil suitability, (4) NWI wetlands, (5) EPA environmental hazards (Superfund, RCRA, brownfields), (6) Traffic level-of-service, (7) LDEQ permit database. Returns pass/fail/warning for each layer plus an overall score and recommendations.',
    {
      parcel_id: z
        .string()
        .describe('Parish parcel ID (from search_parcels results), e.g. "1234567890"'),
      layers: z
        .array(
          z.enum(['zoning', 'flood', 'soils', 'wetlands', 'epa', 'traffic', 'ldeq']),
        )
        .optional()
        .describe(
          'Specific layers to run. Omit to run all 7 layers. Use to run a quick partial check.',
        ),
    },
    async (args, _extra) => {
      try {
        const result = args.layers
          ? await client.screening.screenLayers(args.parcel_id, args.layers)
          : await client.screening.screenFull(args.parcel_id);

        // Build a readable status table for the model
        const layerSummary = result.layers
          .map((l) => {
            const icon = l.status === 'pass' ? '✅' : l.status === 'fail' ? '❌' : l.status === 'warning' ? '⚠️' : '❓';
            return `${icon} **${l.label}**: ${l.details}`;
          })
          .join('\n');

        const passCount = result.layers.filter((l) => l.status === 'pass').length;
        const failCount = result.layers.filter((l) => l.status === 'fail').length;
        const warnCount = result.layers.filter((l) => l.status === 'warning').length;

        return {
          structuredContent: {
            parcel_id: result.parcel_id,
            address: result.address,
            overall_score: result.overall_score,
            layers: result.layers,
            summary: result.summary,
            recommendations: result.recommendations,
            counts: { pass: passCount, fail: failCount, warning: warnCount },
          },
          content: [
            {
              type: 'text' as const,
              text: [
                `## Screening Results — ${result.address}`,
                `**Overall Score:** ${result.overall_score}/100 | ✅ ${passCount} pass | ❌ ${failCount} fail | ⚠️ ${warnCount} warning`,
                '',
                layerSummary,
                '',
                `**Summary:** ${result.summary}`,
                result.recommendations.length > 0
                  ? `\n**Recommendations:**\n${result.recommendations.map((r) => `• ${r}`).join('\n')}`
                  : '',
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
        return toToolError(error, 'screen_property');
      }
    },
  );
}
