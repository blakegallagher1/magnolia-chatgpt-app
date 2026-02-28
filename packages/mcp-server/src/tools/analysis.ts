import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';

export const analysisTools: Tool[] = [
  {
    name: 'underwrite_deal',
    description:
      'Run a financial underwriting model on a deal. Returns IRR, equity multiple, cash-on-cash, and sensitivity tables.',
    inputSchema: {
      type: 'object',
      required: ['deal_id'],
      properties: {
        deal_id: { type: 'string' },
        hold_period_years: { type: 'integer', default: 5 },
        equity_pct: { type: 'number', default: 0.3 },
        exit_cap_rate: { type: 'number', description: 'Terminal cap rate' },
        rent_growth_rate: { type: 'number', default: 0.03 },
        expense_ratio: { type: 'number', default: 0.35 },
      },
    },
  },
  {
    name: 'generate_memo',
    description:
      'Generate an investment memo for a deal using the memo_writer agent. Returns markdown-formatted memo.',
    inputSchema: {
      type: 'object',
      required: ['deal_id'],
      properties: {
        deal_id: { type: 'string' },
        memo_type: {
          type: 'string',
          enum: ['acquisition', 'disposition', 'development', 'loi', 'executive_summary'],
          default: 'acquisition',
        },
        include_sections: {
          type: 'array',
          items: { type: 'string' },
          description: 'Sections to include; defaults to all',
        },
      },
    },
  },
];

const UnderwriteSchema = z.object({
  deal_id: z.string(),
  hold_period_years: z.number().int().default(5),
  equity_pct: z.number().default(0.3),
  exit_cap_rate: z.number().optional(),
  rent_growth_rate: z.number().default(0.03),
  expense_ratio: z.number().default(0.35),
});

const MemoSchema = z.object({
  deal_id: z.string(),
  memo_type: z
    .enum(['acquisition', 'disposition', 'development', 'loi', 'executive_summary'])
    .default('acquisition'),
  include_sections: z.array(z.string()).optional(),
});

export async function dispatchAnalysisTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'underwrite_deal') {
    const params = UnderwriteSchema.parse(args);
    return client.post('/api/analysis/underwrite', params);
  }
  if (name === 'generate_memo') {
    const params = MemoSchema.parse(args);
    return client.agents.writeMemo(params.deal_id, params.memo_type);
  }
  throw new Error(`Unknown analysis tool: ${name}`);
}
