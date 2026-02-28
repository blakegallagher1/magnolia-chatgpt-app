import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';

export const workflowTools: Tool[] = [
  {
    name: 'workflow_start',
    description:
      'Start a multi-step workflow on a deal. Supported workflows: due_diligence, site_selection, portfolio_review.',
    inputSchema: {
      type: 'object',
      required: ['workflow_name', 'deal_id'],
      properties: {
        workflow_name: {
          type: 'string',
          enum: ['due_diligence', 'site_selection', 'portfolio_review'],
        },
        deal_id: { type: 'string' },
        params: {
          type: 'object',
          description: 'Additional parameters for the workflow',
        },
      },
    },
  },
  {
    name: 'workflow_status',
    description: 'Get the current status and step progress of a running workflow.',
    inputSchema: {
      type: 'object',
      required: ['run_id'],
      properties: {
        run_id: { type: 'string' },
      },
    },
  },
  {
    name: 'workflow_cancel',
    description: 'Cancel a running workflow.',
    inputSchema: {
      type: 'object',
      required: ['run_id'],
      properties: {
        run_id: { type: 'string' },
      },
    },
  },
];

const StartSchema = z.object({
  workflow_name: z.enum(['due_diligence', 'site_selection', 'portfolio_review']),
  deal_id: z.string(),
  params: z.record(z.unknown()).optional(),
});

const StatusSchema = z.object({ run_id: z.string() });
const CancelSchema = z.object({ run_id: z.string() });

export async function dispatchWorkflowTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'workflow_start') {
    const params = StartSchema.parse(args);
    return client.workflows.start(params);
  }
  if (name === 'workflow_status') {
    const { run_id } = StatusSchema.parse(args);
    return client.workflows.getStatus(run_id);
  }
  if (name === 'workflow_cancel') {
    const { run_id } = CancelSchema.parse(args);
    return client.workflows.cancel(run_id);
  }
  throw new Error(`Unknown workflow tool: ${name}`);
}
