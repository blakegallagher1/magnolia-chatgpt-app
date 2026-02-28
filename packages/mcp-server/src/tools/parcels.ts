import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';

export const parcelTools: Tool[] = [
  {
    name: 'parcel_lookup',
    description:
      'Look up a parcel by APN, address, or coordinates. Returns ownership, legal description, acreage, and assessed value.',
    inputSchema: {
      type: 'object',
      properties: {
        apn: { type: 'string', description: 'Assessor Parcel Number' },
        address: { type: 'string', description: 'Street address' },
        lat: { type: 'number', description: 'Latitude' },
        lng: { type: 'number', description: 'Longitude' },
      },
    },
  },
  {
    name: 'parcel_search',
    description:
      'Search parcels by geography (bbox or polygon), size range, land use, or owner name.',
    inputSchema: {
      type: 'object',
      properties: {
        bbox: {
          type: 'object',
          properties: {
            north: { type: 'number' },
            south: { type: 'number' },
            east: { type: 'number' },
            west: { type: 'number' },
          },
          description: 'Bounding box for spatial search',
        },
        min_acres: { type: 'number' },
        max_acres: { type: 'number' },
        land_use: { type: 'string', description: 'Land use code or category' },
        owner_name: { type: 'string' },
        limit: { type: 'integer', default: 20 },
      },
    },
  },
];

const LookupSchema = z.object({
  apn: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const SearchSchema = z.object({
  bbox: z
    .object({
      north: z.number(),
      south: z.number(),
      east: z.number(),
      west: z.number(),
    })
    .optional(),
  min_acres: z.number().optional(),
  max_acres: z.number().optional(),
  land_use: z.string().optional(),
  owner_name: z.string().optional(),
  limit: z.number().int().default(20),
});

export async function dispatchParcelTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'parcel_lookup') {
    const params = LookupSchema.parse(args);
    return client.parcels.lookup(params);
  }
  if (name === 'parcel_search') {
    const params = SearchSchema.parse(args);
    return client.parcels.search(params);
  }
  throw new Error(`Unknown parcel tool: ${name}`);
}
