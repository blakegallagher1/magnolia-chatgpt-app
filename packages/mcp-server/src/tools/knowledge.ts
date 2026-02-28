import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import { toToolError } from '../utils/errors.js';

/**
 * Register company knowledge base tools.
 * These conform to the OpenAI Company Knowledge schema.
 *
 * Tools:
 *  - search_knowledge: Search the GPC knowledge base
 *  - fetch_knowledge: Fetch a full knowledge base article
 */
export function registerKnowledgeTools(server: McpServer, client: MagnoliaClient): void {
  // ── search_knowledge ─────────────────────────────────────────────────────────
  server.tool(
    'search_knowledge',
    'Search the Gallagher Property Company internal knowledge base. Contains company SOPs, market research reports, underwriting guidelines, legal templates, vendor directories, EBR Parish regulations, Louisiana real estate law summaries, and GPC-CRES system documentation.',
    {
      query: z
        .string()
        .describe('Search query (natural language or keyword)'),
      limit: z
        .number()
        .int()
        .positive()
        .max(10)
        .default(5)
        .describe('Number of results to return (default 5)'),
    },
    async (args, _extra) => {
      try {
        const result = await client.documents.searchKnowledge(args.query, args.limit);

        const resultLines = result.results.map(
          (r, i) =>
            `**${i + 1}. [${r.title}](${r.url})** — ${r.source} (Score: ${(r.score * 100).toFixed(0)}%)\n> ${r.snippet}`,
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
                `## Knowledge Base — "${result.query}"`,
                `Found ${result.total} results:`,
                '',
                resultLines.join('\n\n'),
              ].join('\n'),
            },
          ],
        };
      } catch (error) {
        return toToolError(error, 'search_knowledge');
      }
    },
  );

  // ── fetch_knowledge ──────────────────────────────────────────────────────────
  server.tool(
    'fetch_knowledge',
    'Retrieve the full text of a knowledge base article by its ID. Use after search_knowledge to read the complete content of a relevant document.',
    {
      id: z
        .string()
        .describe('Knowledge article ID (from search_knowledge results)'),
    },
    async (args, _extra) => {
      try {
        const article = await client.documents.fetchKnowledge(args.id);

        return {
          structuredContent: {
            id: article.id,
            title: article.title,
            text: article.text,
            url: article.url,
            metadata: article.metadata,
          },
          content: [
            {
              type: 'text' as const,
              text: [
                `# ${article.title}`,
                `**Source:** ${article.url}`,
                '',
                article.text,
              ].join('\n'),
            },
          ],
        };
      } catch (error) {
        return toToolError(error, 'fetch_knowledge');
      }
    },
  );
}
