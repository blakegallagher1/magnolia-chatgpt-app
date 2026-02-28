import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';

export const knowledgeTools: Tool[] = [
  {
    name: 'knowledge_search',
    description:
      'Semantic search over the GPC knowledge base: underwriting guidelines, market reports, comp databases, and deal histories.',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string', description: 'Natural language search query' },
        top_k: { type: 'integer', default: 5, description: 'Number of results to return' },
        filter_type: {
          type: 'string',
          enum: ['guideline', 'market_report', 'comp', 'deal_history', 'all'],
          default: 'all',
        },
      },
    },
  },
  {
    name: 'knowledge_get',
    description: 'Retrieve a specific knowledge base entry by ID.',
    inputSchema: {
      type: 'object',
      required: ['entry_id'],
      properties: {
        entry_id: { type: 'string' },
      },
    },
  },
];

const SearchSchema = z.object({
  query: z.string(),
  top_k: z.number().int().default(5),
  filter_type: z
    .enum(['guideline', 'market_report', 'comp', 'deal_history', 'all'])
    .default('all'),
});

const GetSchema = z.object({
  entry_id: z.string(),
});

export async function dispatchKnowledgeTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'knowledge_search') {
    const params = SearchSchema.parse(args);
    return client.knowledge.search(params);
  }
  if (name === 'knowledge_get') {
    const { entry_id } = GetSchema.parse(args);
    return client.knowledge.get(entry_id);
  }
  throw new Error(`Unknown knowledge tool: ${name}`);
}
