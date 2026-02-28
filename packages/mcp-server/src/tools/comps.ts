import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';

export const compsTools: Tool[] = [
  {
    name: 'comps_search',
    description:
      'Search comparable sales or leases. Filter by location, property type, size, date range.',
    inputSchema: {
      type: 'object',
      properties: {
        center_lat: { type: 'number' },
        center_lng: { type: 'number' },
        radius_miles: { type: 'number', default: 1 },
        property_type: { type: 'string' },
        transaction_type: { type: 'string', enum: ['sale', 'lease'] },
        min_sf: { type: 'number' },
        max_sf: { type: 'number' },
        date_from: { type: 'string', description: 'ISO date' },
        date_to: { type: 'string', description: 'ISO date' },
        limit: { type: 'integer', default: 10 },
      },
    },
  },
  {
    name: 'comps_summary',
    description:
      'Summarize comparable transactions for a deal — median price/SF, price range, days on market.',
    inputSchema: {
      type: 'object',
      required: ['deal_id'],
      properties: {
        deal_id: { type: 'string' },
        comp_type: { type: 'string', enum: ['sale', 'lease'], default: 'sale' },
        radius_miles: { type: 'number', default: 1 },
        lookback_months: { type: 'integer', default: 24 },
      },
    },
  },
];

const SearchSchema = z.object({
  center_lat: z.number().optional(),
  center_lng: z.number().optional(),
  radius_miles: z.number().default(1),
  property_type: z.string().optional(),
  transaction_type: z.enum(['sale', 'lease']).optional(),
  min_sf: z.number().optional(),
  max_sf: z.number().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  limit: z.number().int().default(10),
});

const SummarySchema = z.object({
  deal_id: z.string(),
  comp_type: z.enum(['sale', 'lease']).default('sale'),
  radius_miles: z.number().default(1),
  lookback_months: z.number().int().default(24),
});

export async function dispatchCompsTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'comps_search') {
    const params = SearchSchema.parse(args);
    return client.comps.search(params);
  }
  if (name === 'comps_summary') {
    const params = SummarySchema.parse(args);
    return client.post(`/api/comps/summary`, params);
  }
  throw new Error(`Unknown comps tool: ${name}`);
}
