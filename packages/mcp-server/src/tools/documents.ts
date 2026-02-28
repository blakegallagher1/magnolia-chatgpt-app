import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';

export const documentTools: Tool[] = [
  {
    name: 'document_search',
    description: 'Search documents in the GPC-CRES document vault by keyword, deal, or type.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        deal_id: { type: 'string' },
        document_type: { type: 'string' },
        limit: { type: 'integer', default: 10 },
      },
    },
  },
  {
    name: 'document_get',
    description: 'Retrieve a document by ID, including its extracted text and metadata.',
    inputSchema: {
      type: 'object',
      required: ['document_id'],
      properties: {
        document_id: { type: 'string' },
        include_full_text: { type: 'boolean', default: false },
      },
    },
  },
];

const SearchSchema = z.object({
  query: z.string().optional(),
  deal_id: z.string().optional(),
  document_type: z.string().optional(),
  limit: z.number().int().default(10),
});

const GetSchema = z.object({
  document_id: z.string(),
  include_full_text: z.boolean().default(false),
});

export async function dispatchDocumentTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'document_search') {
    const params = SearchSchema.parse(args);
    return client.documents.search(params);
  }
  if (name === 'document_get') {
    const params = GetSchema.parse(args);
    return client.documents.get(params.document_id, { include_full_text: params.include_full_text });
  }
  throw new Error(`Unknown document tool: ${name}`);
}
