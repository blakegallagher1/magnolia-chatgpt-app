import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';

export const screeningTools: Tool[] = [
  {
    name: 'environmental_screen',
    description:
      'Run a Phase I environmental screen on a parcel. Returns ASTEC recognized environmental conditions (RECs), regulatory database hits, and risk score.',
    inputSchema: {
      type: 'object',
      required: ['parcel_id'],
      properties: {
        parcel_id: { type: 'string' },
        include_historical_maps: { type: 'boolean', default: true },
        include_aerial_review: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'flood_zone_check',
    description:
      'Determine FEMA flood zone designation for a parcel or coordinate. Returns zone type, BFE, and insurance requirements.',
    inputSchema: {
      type: 'object',
      properties: {
        parcel_id: { type: 'string' },
        lat: { type: 'number' },
        lng: { type: 'number' },
      },
    },
  },
  {
    name: 'zoning_lookup',
    description:
      'Retrieve current zoning classification, permitted uses, setbacks, height limits, and FAR for a parcel.',
    inputSchema: {
      type: 'object',
      required: ['parcel_id'],
      properties: {
        parcel_id: { type: 'string' },
        include_overlay_districts: { type: 'boolean', default: true },
      },
    },
  },
];

const EnvSchema = z.object({
  parcel_id: z.string(),
  include_historical_maps: z.boolean().default(true),
  include_aerial_review: z.boolean().default(true),
});

const FloodSchema = z.object({
  parcel_id: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const ZoningSchema = z.object({
  parcel_id: z.string(),
  include_overlay_districts: z.boolean().default(true),
});

export async function dispatchScreeningTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'environmental_screen') {
    const params = EnvSchema.parse(args);
    return client.post('/api/screening/environmental', params);
  }
  if (name === 'flood_zone_check') {
    const params = FloodSchema.parse(args);
    return client.post('/api/screening/flood', params);
  }
  if (name === 'zoning_lookup') {
    const params = ZoningSchema.parse(args);
    return client.post('/api/screening/zoning', params);
  }
  throw new Error(`Unknown screening tool: ${name}`);
}
