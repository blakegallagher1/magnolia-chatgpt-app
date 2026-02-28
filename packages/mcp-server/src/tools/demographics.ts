import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';

export const demographicTools: Tool[] = [
  {
    name: 'demographics_snapshot',
    description:
      'Get demographic snapshot for a trade area: population, income, age distribution, household size, employment.',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' },
        radius_miles: { type: 'number', default: 1 },
        parcel_id: { type: 'string', description: 'Alternative to lat/lng' },
        rings: {
          type: 'array',
          items: { type: 'number' },
          description: 'Drive-time rings in miles, e.g. [1, 3, 5]',
        },
      },
    },
  },
  {
    name: 'demographics_trends',
    description:
      'Get 10-year demographic trend and 5-year forecast for a trade area.',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' },
        radius_miles: { type: 'number', default: 1 },
        parcel_id: { type: 'string' },
        metrics: {
          type: 'array',
          items: { type: 'string' },
          description: 'e.g. ["population", "median_income", "employment_rate"]',
        },
      },
    },
  },
];

const SnapshotSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius_miles: z.number().default(1),
  parcel_id: z.string().optional(),
  rings: z.array(z.number()).optional(),
});

const TrendsSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius_miles: z.number().default(1),
  parcel_id: z.string().optional(),
  metrics: z.array(z.string()).optional(),
});

export async function dispatchDemographicTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'demographics_snapshot') {
    const params = SnapshotSchema.parse(args);
    return client.post('/api/demographics/snapshot', params);
  }
  if (name === 'demographics_trends') {
    const params = TrendsSchema.parse(args);
    return client.post('/api/demographics/trends', params);
  }
  throw new Error(`Unknown demographic tool: ${name}`);
}
