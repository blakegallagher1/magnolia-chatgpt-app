import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import { toToolError } from '../utils/errors.js';

/**
 * Register investment memo generation tools.
 *
 * Tools:
 *  - generate_investment_memo: Invoke the memo_writer agent to produce a full investment memo
 */
export function registerMemoTools(server: McpServer, client: MagnoliaClient): void {
  server.tool(
    'generate_investment_memo',
    'Generate a comprehensive investment memorandum for a deal using the GPC memo_writer AI agent. Sections: Executive Summary, Property Description, Market Analysis, Financial Analysis (with sensitivity tables), Risk Assessment, Due Diligence Summary, and Investment Recommendation. Output in markdown format ready for export.',
    {
      deal_id: z
        .string()
        .describe('Deal UUID or SKU to generate memo for'),
      sections: z
        .array(
          z.enum([
            'executive_summary',
            'property_description',
            'market_analysis',
            'financial_analysis',
            'risk_assessment',
            'due_diligence_summary',
            'recommendation',
          ]),
        )
        .optional()
        .describe('Sections to include (defaults to all). Use to generate partial memos.'),
      format: z
        .enum(['markdown', 'html'])
        .default('markdown')
        .describe('Output format: markdown (default) or HTML'),
      include_exhibits: z
        .boolean()
        .default(true)
        .describe('Include financial exhibits (rent rolls, sensitivity tables, comp tables)'),
    },
    async (args, _extra) => {
      try {
        const agentResult = await client.agents.generateMemo(args.deal_id, args.sections);

        const memo = agentResult.output as {
          deal_name?: string;
          sku?: string;
          sections?: Array<{ section: string; title: string; content: string }>;
          full_text?: string;
          generated_at?: string;
        };

        const fullText = memo.full_text ?? 
          memo.sections?.map((s) => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n') ??
          'Memo generation in progress...';

        // Build a brief preview for the chat
        const execSummary = memo.sections?.find((s) => s.section === 'executive_summary');
        const preview = execSummary?.content.slice(0, 300) ?? fullText.slice(0, 300);

        return {
          structuredContent: {
            deal_id: args.deal_id,
            deal_name: memo.deal_name,
            sku: memo.sku,
            sections: memo.sections ?? [],
            full_text: fullText,
            generated_at: memo.generated_at ?? new Date().toISOString(),
            format: args.format,
          },
          content: [
            {
              type: 'text' as const,
              text: [
                `## Investment Memo — ${memo.deal_name ?? args.deal_id}`,
                memo.sku ? `SKU: ${memo.sku}` : '',
                `Generated: ${memo.generated_at ?? new Date().toISOString()}`,
                '',
                '### Executive Summary Preview',
                preview + (fullText.length > 300 ? '...' : ''),
                '',
                `*Full memo (${memo.sections?.length ?? 0} sections) available in structuredContent.*`,
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
          _meta: {
            widget: 'document-viewer',
          },
        };
      } catch (error) {
        return toToolError(error, 'generate_investment_memo');
      }
    },
  );
}
