import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';

export const memoTools: Tool[] = [
  {
    name: 'memo_generate',
    description:
      'Generate a professional investment memo for a deal. Returns formatted markdown.',
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
        tone: {
          type: 'string',
          enum: ['formal', 'concise', 'detailed'],
          default: 'formal',
        },
        include_financials: { type: 'boolean', default: true },
        include_risk_section: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'memo_export',
    description: 'Export a previously generated memo to PDF or DOCX.',
    inputSchema: {
      type: 'object',
      required: ['memo_id'],
      properties: {
        memo_id: { type: 'string' },
        format: {
          type: 'string',
          enum: ['pdf', 'docx'],
          default: 'pdf',
        },
      },
    },
  },
];

const GenerateSchema = z.object({
  deal_id: z.string(),
  memo_type: z
    .enum(['acquisition', 'disposition', 'development', 'loi', 'executive_summary'])
    .default('acquisition'),
  tone: z.enum(['formal', 'concise', 'detailed']).default('formal'),
  include_financials: z.boolean().default(true),
  include_risk_section: z.boolean().default(true),
});

const ExportSchema = z.object({
  memo_id: z.string(),
  format: z.enum(['pdf', 'docx']).default('pdf'),
});

export async function dispatchMemoTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'memo_generate') {
    const params = GenerateSchema.parse(args);
    return client.agents.writeMemo(params.deal_id, params.memo_type);
  }
  if (name === 'memo_export') {
    const { memo_id, format } = ExportSchema.parse(args);
    return client.post('/api/memos/export', { memo_id, format });
  }
  throw new Error(`Unknown memo tool: ${name}`);
}
