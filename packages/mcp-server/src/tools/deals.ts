import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';

export const dealTools: Tool[] = [
  {
    name: 'deal_list',
    description: 'List deals in the pipeline with optional filters.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'closed', 'dead', 'all'],
          default: 'active',
        },
        deal_type: { type: 'string' },
        limit: { type: 'integer', default: 20 },
        offset: { type: 'integer', default: 0 },
      },
    },
  },
  {
    name: 'deal_get',
    description: 'Retrieve full details for a single deal by ID.',
    inputSchema: {
      type: 'object',
      required: ['deal_id'],
      properties: {
        deal_id: { type: 'string' },
      },
    },
  },
  {
    name: 'deal_create',
    description: 'Create a new deal in the GPC-CRES pipeline.',
    inputSchema: {
      type: 'object',
      required: ['name', 'deal_type'],
      properties: {
        name: { type: 'string', description: 'Deal name' },
        deal_type: {
          type: 'string',
          enum: [
            'acquisition',
            'disposition',
            'development',
            'joint_venture',
            'debt',
            'other',
          ],
        },
        parcel_ids: { type: 'array', items: { type: 'string' } },
        ask_price: { type: 'number' },
        target_close_date: { type: 'string', description: 'ISO date string' },
        notes: { type: 'string' },
      },
    },
  },
  {
    name: 'deal_update',
    description: 'Update deal fields.',
    inputSchema: {
      type: 'object',
      required: ['deal_id'],
      properties: {
        deal_id: { type: 'string' },
        status: { type: 'string' },
        ask_price: { type: 'number' },
        offer_price: { type: 'number' },
        target_close_date: { type: 'string' },
        notes: { type: 'string' },
        assignee: { type: 'string' },
      },
    },
  },
  {
    name: 'deal_add_document',
    description: 'Attach a document to a deal by document ID.',
    inputSchema: {
      type: 'object',
      required: ['deal_id', 'document_id'],
      properties: {
        deal_id: { type: 'string' },
        document_id: { type: 'string' },
        document_type: { type: 'string', description: 'e.g. PSA, LOI, survey, title' },
      },
    },
  },
  {
    name: 'deal_run_agent',
    description:
      'Invoke a specialist AI agent on a deal. Supported agents: deal_manager, memo_writer, underwriter, due_diligence_coordinator.',
    inputSchema: {
      type: 'object',
      required: ['deal_id', 'agent_name'],
      properties: {
        deal_id: { type: 'string' },
        agent_name: {
          type: 'string',
          enum: ['deal_manager', 'memo_writer', 'underwriter', 'due_diligence_coordinator'],
        },
        instruction: { type: 'string', description: 'Optional override instruction for the agent' },
      },
    },
  },
];

const ListSchema = z.object({
  status: z.enum(['active', 'closed', 'dead', 'all']).default('active'),
  deal_type: z.string().optional(),
  limit: z.number().int().default(20),
  offset: z.number().int().default(0),
});

const GetSchema = z.object({ deal_id: z.string() });

const CreateSchema = z.object({
  name: z.string(),
  deal_type: z.enum([
    'acquisition',
    'disposition',
    'development',
    'joint_venture',
    'debt',
    'other',
  ]),
  parcel_ids: z.array(z.string()).optional(),
  ask_price: z.number().optional(),
  target_close_date: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateSchema = z.object({
  deal_id: z.string(),
  status: z.string().optional(),
  ask_price: z.number().optional(),
  offer_price: z.number().optional(),
  target_close_date: z.string().optional(),
  notes: z.string().optional(),
  assignee: z.string().optional(),
});

const AddDocSchema = z.object({
  deal_id: z.string(),
  document_id: z.string(),
  document_type: z.string().optional(),
});

const RunAgentSchema = z.object({
  deal_id: z.string(),
  agent_name: z.enum([
    'deal_manager',
    'memo_writer',
    'underwriter',
    'due_diligence_coordinator',
  ]),
  instruction: z.string().optional(),
});

export async function dispatchDealTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'deal_list') {
    const params = ListSchema.parse(args);
    return client.deals.list(params);
  }
  if (name === 'deal_get') {
    const { deal_id } = GetSchema.parse(args);
    return client.deals.get(deal_id);
  }
  if (name === 'deal_create') {
    const payload = CreateSchema.parse(args);
    return client.deals.create(payload);
  }
  if (name === 'deal_update') {
    const { deal_id, ...rest } = UpdateSchema.parse(args);
    return client.deals.update(deal_id, rest);
  }
  if (name === 'deal_add_document') {
    const params = AddDocSchema.parse(args);
    return client.post(`/api/deals/${params.deal_id}/documents`, {
      document_id: params.document_id,
      document_type: params.document_type,
    });
  }
  if (name === 'deal_run_agent') {
    const { deal_id, agent_name, instruction } = RunAgentSchema.parse(args);
    return client.agents.invoke({
      agent_name,
      payload: { deal_id, instruction },
    });
  }
  throw new Error(`Unknown deal tool: ${name}`);
}
