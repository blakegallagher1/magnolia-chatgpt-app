import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import { toToolError } from '../utils/errors.js';

/**
 * Register Temporal workflow trigger tools.
 *
 * Tools:
 *  - run_due_diligence: Trigger full DD workflow
 *  - schedule_screening: Trigger batch screening workflow
 */
export function registerWorkflowTools(server: McpServer, client: MagnoliaClient): void {
  // ── run_due_diligence ────────────────────────────────────────────────────────
  server.tool(
    'run_due_diligence',
    'Trigger a comprehensive due diligence Temporal workflow for a deal. The workflow orchestrates: 7-layer property screening for all associated parcels, comparable sales analysis, market data aggregation, document collection checklist, title search coordination, and risk scoring. Returns a workflow ID for status tracking.',
    {
      deal_id: z
        .string()
        .describe('Deal UUID or SKU to run due diligence for'),
      parcel_ids: z
        .array(z.string())
        .optional()
        .describe('Override the parcels to screen (defaults to all parcels linked to the deal)'),
      priority: z
        .enum(['normal', 'high', 'urgent'])
        .default('normal')
        .describe('Workflow priority: urgent will expedite processing'),
      notify_on_complete: z
        .boolean()
        .default(true)
        .describe('Send notification when due diligence is complete'),
    },
    async (args, _extra) => {
      try {
        // If no parcel_ids provided, get them from the deal
        let parcelIds = args.parcel_ids ?? [];
        if (parcelIds.length === 0) {
          const deal = await client.deals.getById(args.deal_id);
          parcelIds = deal.parcels;
        }

        const result = await client.workflows.triggerDueDiligence(args.deal_id, parcelIds);

        return {
          structuredContent: {
            workflow_id: result.workflow_id,
            run_id: result.run_id,
            status: result.status,
            deal_id: args.deal_id,
            parcel_count: parcelIds.length,
            started_at: result.started_at,
          },
          content: [
            {
              type: 'text' as const,
              text: [
                result.status === 'already_running'
                  ? `⚠️ Due diligence workflow is already running for this deal.`
                  : `✅ Due diligence workflow started successfully.`,
                `**Workflow ID:** \`${result.workflow_id}\``,
                `**Parcels:** ${parcelIds.length} parcel(s) queued for screening`,
                `**Started:** ${result.started_at}`,
                `\nThe workflow will run: property screening (7 layers) → comps analysis → market data → risk scoring.`,
                `Use the workflow ID to check status.`,
              ].join('\n'),
            },
          ],
          _meta: {
            workflow_id: result.workflow_id,
          },
        };
      } catch (error) {
        return toToolError(error, 'run_due_diligence');
      }
    },
  );

  // ── schedule_screening ─────────────────────────────────────────────────────
  server.tool(
    'schedule_screening',
    'Schedule a batch property screening Temporal workflow for multiple parcels. Useful for screening a list of prospect parcels before committing to detailed analysis. Each parcel gets the full 7-layer treatment.',
    {
      parcel_ids: z
        .array(z.string())
        .min(1)
        .max(100)
        .describe('List of parcel IDs to screen (1–100 parcels)'),
      label: z
        .string()
        .optional()
        .describe('Label for this batch screening job (e.g. "I-10 Corridor Survey - Q1 2025")'),
      layers: z
        .array(z.enum(['zoning', 'flood', 'soils', 'wetlands', 'epa', 'traffic', 'ldeq']))
        .optional()
        .describe('Specific layers to run (omit for all 7)'),
    },
    async (args, _extra) => {
      try {
        const result = await client.workflows.triggerBatchScreening(
          args.parcel_ids,
          args.label,
        );

        return {
          structuredContent: {
            workflow_id: result.workflow_id,
            run_id: result.run_id,
            status: result.status,
            parcel_count: args.parcel_ids.length,
            label: args.label,
            started_at: result.started_at,
          },
          content: [
            {
              type: 'text' as const,
              text: [
                `✅ Batch screening workflow started.`,
                `**Workflow ID:** \`${result.workflow_id}\``,
                `**Label:** ${args.label ?? 'Unnamed batch'}`,
                `**Parcels:** ${args.parcel_ids.length} queued`,
                `**Layers:** ${args.layers?.join(', ') ?? 'All 7 layers'}`,
              ].join('\n'),
            },
          ],
          _meta: {
            workflow_id: result.workflow_id,
          },
        };
      } catch (error) {
        return toToolError(error, 'schedule_screening');
      }
    },
  );
}
