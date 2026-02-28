import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';

export const zoningTools: Tool[] = [
  {
    name: 'zoning_details',
    description:
      'Get detailed zoning information for a parcel including permitted uses, development standards, and overlay districts.',
    inputSchema: {
      type: 'object',
      required: ['parcel_id'],
      properties: {
        parcel_id: { type: 'string' },
        include_overlay_districts: { type: 'boolean', default: true },
        include_development_standards: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'zoning_history',
    description: 'Retrieve the rezoning history and pending applications for a parcel.',
    inputSchema: {
      type: 'object',
      required: ['parcel_id'],
      properties: {
        parcel_id: { type: 'string' },
        include_pending: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'zoning_feasibility',
    description:
      'Assess development feasibility under current or proposed zoning. Returns max buildable SF, units, parking requirements.',
    inputSchema: {
      type: 'object',
      required: ['parcel_id', 'proposed_use'],
      properties: {
        parcel_id: { type: 'string' },
        proposed_use: {
          type: 'string',
          description: 'Proposed development use, e.g. "multifamily 5-story"',
        },
        zoning_override: {
          type: 'string',
          description: 'Test a hypothetical zoning code instead of current',
        },
      },
    },
  },
];

const DetailsSchema = z.object({
  parcel_id: z.string(),
  include_overlay_districts: z.boolean().default(true),
  include_development_standards: z.boolean().default(true),
});

const HistorySchema = z.object({
  parcel_id: z.string(),
  include_pending: z.boolean().default(true),
});

const FeasibilitySchema = z.object({
  parcel_id: z.string(),
  proposed_use: z.string(),
  zoning_override: z.string().optional(),
});

export async function dispatchZoningTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'zoning_details') {
    const params = DetailsSchema.parse(args);
    return client.post('/api/zoning/details', params);
  }
  if (name === 'zoning_history') {
    const params = HistorySchema.parse(args);
    return client.post('/api/zoning/history', params);
  }
  if (name === 'zoning_feasibility') {
    const params = FeasibilitySchema.parse(args);
    return client.post('/api/zoning/feasibility', params);
  }
  throw new Error(`Unknown zoning tool: ${name}`);
}
