import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';

export const ownershipTools: Tool[] = [
  {
    name: 'ownership_lookup',
    description:
      'Look up current and historical ownership for a parcel. Returns owner name, entity type, address, and transfer history.',
    inputSchema: {
      type: 'object',
      required: ['parcel_id'],
      properties: {
        parcel_id: { type: 'string' },
        include_transfer_history: { type: 'boolean', default: true },
        include_entity_details: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'owner_portfolio',
    description:
      'Find all parcels owned by a given owner name or entity. Useful for portfolio analysis.',
    inputSchema: {
      type: 'object',
      required: ['owner_name'],
      properties: {
        owner_name: { type: 'string' },
        state: { type: 'string', description: 'Limit to a specific state (2-letter code)' },
        limit: { type: 'integer', default: 50 },
      },
    },
  },
];

const LookupSchema = z.object({
  parcel_id: z.string(),
  include_transfer_history: z.boolean().default(true),
  include_entity_details: z.boolean().default(true),
});

const PortfolioSchema = z.object({
  owner_name: z.string(),
  state: z.string().optional(),
  limit: z.number().int().default(50),
});

export async function dispatchOwnershipTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'ownership_lookup') {
    const params = LookupSchema.parse(args);
    return client.post('/api/ownership/lookup', params);
  }
  if (name === 'owner_portfolio') {
    const params = PortfolioSchema.parse(args);
    return client.post('/api/ownership/portfolio', params);
  }
  throw new Error(`Unknown ownership tool: ${name}`);
}
