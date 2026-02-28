import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';

export const marketTools: Tool[] = [
  {
    name: 'market_snapshot',
    description:
      'Get a current market snapshot for a metro/submarket: vacancy rates, avg rents, cap rates, absorption, and pipeline.',
    inputSchema: {
      type: 'object',
      required: ['market'],
      properties: {
        market: { type: 'string', description: 'Metro or submarket name, e.g. "Austin TX"' },
        property_type: {
          type: 'string',
          enum: ['office', 'industrial', 'retail', 'multifamily', 'land', 'mixed_use'],
        },
        as_of_date: { type: 'string', description: 'ISO date; defaults to most recent quarter' },
      },
    },
  },
  {
    name: 'market_trends',
    description:
      'Get historical market trend data (time series) for a given market and metric.',
    inputSchema: {
      type: 'object',
      required: ['market', 'metric'],
      properties: {
        market: { type: 'string' },
        metric: {
          type: 'string',
          enum: ['vacancy_rate', 'asking_rent', 'cap_rate', 'absorption', 'deliveries'],
        },
        property_type: { type: 'string' },
        periods: { type: 'integer', default: 8, description: 'Number of quarters to return' },
      },
    },
  },
];

const SnapshotSchema = z.object({
  market: z.string(),
  property_type: z
    .enum(['office', 'industrial', 'retail', 'multifamily', 'land', 'mixed_use'])
    .optional(),
  as_of_date: z.string().optional(),
});

const TrendsSchema = z.object({
  market: z.string(),
  metric: z.enum(['vacancy_rate', 'asking_rent', 'cap_rate', 'absorption', 'deliveries']),
  property_type: z.string().optional(),
  periods: z.number().int().default(8),
});

export async function dispatchMarketTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'market_snapshot') {
    const params = SnapshotSchema.parse(args);
    return client.marketData.snapshot(params);
  }
  if (name === 'market_trends') {
    const params = TrendsSchema.parse(args);
    return client.marketData.trends(params);
  }
  throw new Error(`Unknown market tool: ${name}`);
}
