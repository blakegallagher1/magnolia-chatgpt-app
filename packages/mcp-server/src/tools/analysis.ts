import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import { toToolError } from '../utils/errors.js';

/**
 * Register deal analysis tools.
 *
 * Tools:
 *  - analyze_deal: AI-powered deal analysis with financial projections
 */
export function registerAnalysisTools(server: McpServer, client: MagnoliaClient): void {
  server.tool(
    'analyze_deal',
    'Run a comprehensive AI-powered deal analysis using the GPC underwriter agent. Analyzes financials, market conditions, comparable transactions, environmental screening results, and risk factors. Returns a structured analysis with recommendations. Use before LOI or major pipeline decisions.',
    {
      deal_id: z
        .string()
        .describe('Deal UUID or SKU to analyze'),
      analysis_depth: z
        .enum(['quick', 'standard', 'deep'])
        .default('standard')
        .describe(
          'Analysis depth: quick=5-minute high-level, standard=full underwriting review, deep=exhaustive with agent delegation',
        ),
      focus_areas: z
        .array(
          z.enum([
            'financials',
            'market',
            'environmental',
            'zoning',
            'comps',
            'risk',
            'ownership',
          ]),
        )
        .optional()
        .describe('Specific focus areas. Omit for comprehensive analysis.'),
      conversation_id: z
        .string()
        .optional()
        .describe('MCP conversation ID for session continuity'),
    },
    async (args, _extra) => {
      try {
        const agentResult = await client.agents.analyzeDeal(args.deal_id, args.conversation_id);

        // The underwriter agent returns structured output
        const analysis = agentResult.output as {
          deal_name?: string;
          recommendation?: string;
          risk_level?: string;
          risk_score?: number;
          strengths?: string[];
          concerns?: string[];
          financial_summary?: Record<string, unknown>;
          market_summary?: string;
          next_steps?: string[];
          full_analysis?: string;
        };

        const strengths = analysis.strengths?.map((s) => `✅ ${s}`).join('\n') ?? '';
        const concerns = analysis.concerns?.map((c) => `⚠️ ${c}`).join('\n') ?? '';

        return {
          structuredContent: {
            deal_id: args.deal_id,
            recommendation: analysis.recommendation,
            risk_level: analysis.risk_level,
            risk_score: analysis.risk_score,
            strengths: analysis.strengths ?? [],
            concerns: analysis.concerns ?? [],
            financial_summary: analysis.financial_summary,
            market_summary: analysis.market_summary,
            next_steps: analysis.next_steps ?? [],
            tool_calls_made: agentResult.tool_calls?.length ?? 0,
          },
          content: [
            {
              type: 'text' as const,
              text: [
                `## Deal Analysis — ${analysis.deal_name ?? args.deal_id}`,
                `**Recommendation:** ${analysis.recommendation ?? 'Pending'}`,
                `**Risk Level:** ${analysis.risk_level ?? 'Unknown'} (${analysis.risk_score ?? 'N/A'}/100)`,
                '',
                strengths ? `### Strengths\n${strengths}` : '',
                concerns ? `### Concerns\n${concerns}` : '',
                analysis.market_summary ? `\n### Market Context\n${analysis.market_summary}` : '',
                analysis.next_steps?.length
                  ? `\n### Recommended Next Steps\n${analysis.next_steps.map((s) => `• ${s}`).join('\n')}`
                  : '',
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
          _meta: {
            widget: 'deal-dashboard',
          },
        };
      } catch (error) {
        return toToolError(error, 'analyze_deal');
      }
    },
  );
}
