import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import { toToolError } from '../utils/errors.js';

/**
 * Register document search tools.
 *
 * Tools:
 *  - search_documents: Semantic search over deal documents in Qdrant
 */
export function registerDocumentTools(server: McpServer, client: MagnoliaClient): void {
  server.tool(
    'search_documents',
    'Semantic search across deal documents stored in the Qdrant vector database: appraisals, environmental reports, title commitments, leases, financial statements, due diligence reports, surveys, and more. Returns relevant text excerpts with source attribution.',
    {
      query: z
        .string()
        .describe(
          'Natural language search query (e.g. "environmental Phase I findings", "tenant lease expiration dates", "cap rate in appraisal")',
        ),
      deal_id: z
        .string()
        .optional()
        .describe('Limit search to documents for a specific deal'),
      document_type: z
        .string()
        .optional()
        .describe(
          'Filter by document type (e.g. "appraisal", "phase_i", "title", "lease", "financial", "survey")',
        ),
      limit: z
        .number()
        .int()
        .positive()
        .max(20)
        .default(5)
        .describe('Number of results to return (default 5)'),
    },
    async (args, _extra) => {
      try {
        const result = await client.documents.search({
          query: args.query,
          deal_id: args.deal_id,
          document_type: args.document_type,
          limit: args.limit,
        });

        const resultLines = result.results.map(
          (r, i) =>
            `**${i + 1}. ${r.title}** (${r.document_type}) — Relevance: ${(r.score * 100).toFixed(0)}%\n> ${r.snippet}`,
        );

        return {
          structuredContent: {
            query: result.query,
            total: result.total,
            results: result.results,
          },
          content: [
            {
              type: 'text' as const,
              text: [
                `## Document Search — "${result.query}"`,
                `Found ${result.total} relevant documents:`,
                '',
                resultLines.join('\n\n'),
              ].join('\n'),
            },
          ],
          _meta: {
            widget: 'document-viewer',
          },
        };
      } catch (error) {
        return toToolError(error, 'search_documents');
      }
    },
  );
}
