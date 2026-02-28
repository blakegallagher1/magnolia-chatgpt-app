import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';

export const floodTools: Tool[] = [
  {
    name: 'flood_zone_detail',
    description:
      'Get detailed FEMA FIRM flood zone data for a parcel: zone designation, BFE, LOMA history, and insurance estimates.',
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
    name: 'flood_risk_score',
    description:
      'Get a composite flood risk score (0–100) for a parcel, combining FEMA zone, sea level rise projections, and historical events.',
    inputSchema: {
      type: 'object',
      properties: {
        parcel_id: { type: 'string' },
        lat: { type: 'number' },
        lng: { type: 'number' },
        include_climate_projections: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'flood_insurance_estimate',
    description:
      'Estimate NFIP or private flood insurance premium for a property.',
    inputSchema: {
      type: 'object',
      required: ['parcel_id', 'building_value'],
      properties: {
        parcel_id: { type: 'string' },
        building_value: { type: 'number', description: 'Replacement cost value in USD' },
        contents_value: { type: 'number' },
        deductible: { type: 'number', default: 1000 },
      },
    },
  },
];

const ZoneDetailSchema = z.object({
  parcel_id: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const RiskScoreSchema = z.object({
  parcel_id: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  include_climate_projections: z.boolean().default(true),
});

const InsuranceSchema = z.object({
  parcel_id: z.string(),
  building_value: z.number(),
  contents_value: z.number().optional(),
  deductible: z.number().default(1000),
});

export async function dispatchFloodTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'flood_zone_detail') {
    const params = ZoneDetailSchema.parse(args);
    return client.post('/api/flood/zone-detail', params);
  }
  if (name === 'flood_risk_score') {
    const params = RiskScoreSchema.parse(args);
    return client.post('/api/flood/risk-score', params);
  }
  if (name === 'flood_insurance_estimate') {
    const params = InsuranceSchema.parse(args);
    return client.post('/api/flood/insurance-estimate', params);
  }
  throw new Error(`Unknown flood tool: ${name}`);
}
