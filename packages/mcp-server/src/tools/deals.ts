import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import type { CreateDealInput, UpdateDealInput, DealStage } from '@magnolia/shared-types';
import { toToolError } from '../utils/errors.js';

/** Format a deal stage for display */
function formatStage(stage: DealStage): string {
  const labels: Record<DealStage, string> = {
    prospect: 'Prospect',
    triage: 'Triage',
    loi: 'LOI',
    under_contract: 'Under Contract',
    due_diligence: 'Due Diligence',
    closing: 'Closing',
    closed: 'Closed',
    dead: 'Dead',
  };
  return labels[stage] ?? stage;
}

/**
 * Register deal pipeline management tools.
 *
 * Tools:
 *  - get_deal_status: Retrieve deal details
 *  - create_deal: Create a new deal
 *  - update_deal_status: Transition a deal through pipeline stages
 */
export function registerDealTools(server: McpServer, client: MagnoliaClient): void {
  // ── get_deal_status ────────────────────────────────────────────────────────
  server.tool(
    'get_deal_status',
    'Retrieve full deal details including pipeline stage, financial metrics, key dates, associated parcels, and risk score. Supports lookup by deal UUID, SKU (e.g. "GPC-2024-047"), or deal name.',
    {
      deal_id: z
        .string()
        .optional()
        .describe('Deal UUID or SKU (e.g. "GPC-2024-047")'),
      deal_name: z
        .string()
        .optional()
        .describe('Deal name for fuzzy search (e.g. "3045 Florida Blvd")'),
    },
    async (args, _extra) => {
      try {
        let deal;
        if (args.deal_id) {
          deal = await client.deals.getById(args.deal_id);
        } else if (args.deal_name) {
          const results = await client.deals.search({ query: args.deal_name, per_page: 1 });
          if (!results.items[0]) {
            return {
              content: [{ type: 'text' as const, text: `No deal found matching "${args.deal_name}"` }],
              isError: true,
            };
          }
          deal = results.items[0];
        } else {
          return {
            content: [{ type: 'text' as const, text: 'Provide either deal_id or deal_name' }],
            isError: true,
          };
        }

        const f = deal.financials;
        const financialLines = [
          f.purchase_price != null && `Purchase Price: $${f.purchase_price.toLocaleString()}`,
          f.cap_rate != null && `Cap Rate: ${(f.cap_rate * 100).toFixed(2)}%`,
          f.noi != null && `NOI: $${f.noi.toLocaleString()}/yr`,
          f.irr != null && `IRR: ${(f.irr * 100).toFixed(1)}%`,
          f.cash_on_cash != null && `Cash-on-Cash: ${(f.cash_on_cash * 100).toFixed(1)}%`,
          f.dscr != null && `DSCR: ${f.dscr.toFixed(2)}x`,
          f.equity_multiple != null && `Equity Multiple: ${f.equity_multiple.toFixed(2)}x`,
        ]
          .filter(Boolean)
          .join(' | ');

        return {
          structuredContent: deal,
          content: [
            {
              type: 'text' as const,
              text: [
                `## ${deal.name} (${deal.sku})`,
                `**Stage:** ${formatStage(deal.status)} | **Risk Score:** ${deal.risk_score ?? 'N/A'}/100`,
                financialLines ? `**Financials:** ${financialLines}` : '',
                deal.notes ? `**Notes:** ${deal.notes.slice(0, 200)}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
          _meta: {
            widget: 'deal-dashboard',
          },
        };
      } catch (error) {
        return toToolError(error, 'get_deal_status');
      }
    },
  );

  // ── create_deal ────────────────────────────────────────────────────────────
  server.tool(
    'create_deal',
    'Create a new commercial real estate deal in the GPC pipeline. Automatically assigns a SKU and initializes the deal at "prospect" stage.',
    {
      name: z.string().describe('Descriptive deal name (e.g. "3045 Florida Blvd Acquisition")'),
      jurisdiction: z
        .string()
        .default('East Baton Rouge Parish, LA')
        .describe('Jurisdiction (parish, city, or county)'),
      property_type: z
        .string()
        .optional()
        .describe('Property type (e.g. "Retail", "Office", "Industrial", "Mixed-Use", "Land")'),
      parcel_ids: z
        .array(z.string())
        .optional()
        .describe('Parcel IDs to associate with this deal'),
      purchase_price: z
        .number()
        .positive()
        .optional()
        .describe('Initial purchase price estimate in USD'),
      cap_rate: z
        .number()
        .positive()
        .max(1)
        .optional()
        .describe('Estimated cap rate as decimal (e.g. 0.065 = 6.5%)'),
      notes: z.string().optional().describe('Initial notes or deal rationale (markdown)'),
      tags: z.array(z.string()).optional().describe('Tags for categorization'),
    },
    async (args, _extra) => {
      try {
        const input: CreateDealInput = {
          name: args.name,
          jurisdiction: args.jurisdiction,
          property_type: args.property_type,
          parcels: args.parcel_ids,
          notes: args.notes ?? '',
          tags: args.tags,
          financials: {
            purchase_price: args.purchase_price ?? null,
            cap_rate: args.cap_rate ?? null,
          },
        };

        const deal = await client.deals.create(input);

        return {
          structuredContent: deal,
          content: [
            {
              type: 'text' as const,
              text: `✅ Deal **${deal.name}** created with SKU **${deal.sku}**. Stage: ${formatStage(deal.status)}. ID: \`${deal.id}\``,
            },
          ],
          _meta: { widget: 'deal-dashboard' },
        };
      } catch (error) {
        return toToolError(error, 'create_deal');
      }
    },
  );

  // ── update_deal_status ─────────────────────────────────────────────────────
  server.tool(
    'update_deal_status',
    'Transition a deal to a new pipeline stage. Valid stages: prospect → triage → loi → under_contract → due_diligence → closing → closed (or dead at any stage).',
    {
      deal_id: z.string().describe('Deal UUID or SKU'),
      new_stage: z
        .enum(['prospect', 'triage', 'loi', 'under_contract', 'due_diligence', 'closing', 'closed', 'dead'])
        .describe('Target pipeline stage'),
      notes: z
        .string()
        .optional()
        .describe('Notes about this stage transition (e.g. "LOI executed at $2.1M, 15-day DD period")'),
      update_fields: z
        .object({
          purchase_price: z.number().positive().optional(),
          cap_rate: z.number().positive().max(1).optional(),
          closing_date: z.string().optional().describe('ISO 8601 date (YYYY-MM-DD)'),
          loi_date: z.string().optional().describe('ISO 8601 date'),
          contract_date: z.string().optional().describe('ISO 8601 date'),
          due_diligence_expiry: z.string().optional().describe('ISO 8601 date'),
        })
        .optional()
        .describe('Optional field updates to apply alongside the stage transition'),
    },
    async (args, _extra) => {
      try {
        const transition = await client.deals.updateStatus(args.deal_id, args.new_stage, args.notes);

        // Also update any additional fields
        if (args.update_fields && Object.keys(args.update_fields).length > 0) {
          const updateInput: UpdateDealInput = {};
          const uf = args.update_fields;
          if (uf.purchase_price !== undefined || uf.cap_rate !== undefined) {
            updateInput.financials = {
              purchase_price: uf.purchase_price ?? null,
              cap_rate: uf.cap_rate ?? null,
            };
          }
          if (uf.closing_date !== undefined || uf.loi_date !== undefined || uf.contract_date !== undefined || uf.due_diligence_expiry !== undefined) {
            updateInput.key_dates = {
              closing_date: uf.closing_date ?? null,
              loi_date: uf.loi_date ?? null,
              contract_date: uf.contract_date ?? null,
              due_diligence_expiry: uf.due_diligence_expiry ?? null,
            };
          }
          await client.deals.update(args.deal_id, updateInput);
        }

        return {
          structuredContent: transition,
          content: [
            {
              type: 'text' as const,
              text: `✅ Deal moved from **${formatStage(transition.from_stage)}** → **${formatStage(transition.to_stage)}**${args.notes ? `\n\nNotes: ${args.notes}` : ''}`,
            },
          ],
          _meta: { widget: 'deal-dashboard' },
        };
      } catch (error) {
        return toToolError(error, 'update_deal_status');
      }
    },
  );
}
