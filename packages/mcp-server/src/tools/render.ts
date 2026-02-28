import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { z } from 'zod';
import { widgetRegistry } from '../widgets/registry.js';

export const renderTools: Tool[] = [
  {
    name: 'render_widget',
    description:
      'Render a UI widget inline in the chat. Use this to display structured data as a visual component instead of raw JSON.',
    inputSchema: {
      type: 'object',
      required: ['widget_type', 'data'],
      properties: {
        widget_type: {
          type: 'string',
          enum: [
            'deal_card',
            'parcel_map',
            'market_chart',
            'comps_table',
            'underwriting_summary',
            'memo_preview',
            'flood_map',
            'zoning_badge',
            'ownership_tree',
            'demographics_chart',
            'pipeline_kanban',
            'document_list',
          ],
          description: 'Type of widget to render',
        },
        data: {
          type: 'object',
          description: 'Data payload for the widget',
        },
        title: { type: 'string', description: 'Optional widget title' },
        size: {
          type: 'string',
          enum: ['compact', 'standard', 'expanded'],
          default: 'standard',
        },
      },
    },
  },
  {
    name: 'render_dashboard',
    description:
      'Render a multi-widget dashboard layout for a deal. Combines deal card, map, underwriting, and market data.',
    inputSchema: {
      type: 'object',
      required: ['deal_id'],
      properties: {
        deal_id: { type: 'string' },
        widgets: {
          type: 'array',
          items: { type: 'string' },
          description: 'Widget types to include; defaults to standard deal dashboard',
          default: [
            'deal_card',
            'parcel_map',
            'underwriting_summary',
            'market_chart',
            'comps_table',
          ],
        },
        layout: {
          type: 'string',
          enum: ['grid', 'stacked', 'sidebar'],
          default: 'grid',
        },
      },
    },
  },
];

const RenderWidgetSchema = z.object({
  widget_type: z.enum([
    'deal_card',
    'parcel_map',
    'market_chart',
    'comps_table',
    'underwriting_summary',
    'memo_preview',
    'flood_map',
    'zoning_badge',
    'ownership_tree',
    'demographics_chart',
    'pipeline_kanban',
    'document_list',
  ]),
  data: z.record(z.unknown()),
  title: z.string().optional(),
  size: z.enum(['compact', 'standard', 'expanded']).default('standard'),
});

const RenderDashboardSchema = z.object({
  deal_id: z.string(),
  widgets: z
    .array(z.string())
    .default(['deal_card', 'parcel_map', 'underwriting_summary', 'market_chart', 'comps_table']),
  layout: z.enum(['grid', 'stacked', 'sidebar']).default('grid'),
});

export async function dispatchRenderTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  if (name === 'render_widget') {
    const params = RenderWidgetSchema.parse(args);
    const renderer = widgetRegistry.get(params.widget_type);
    if (!renderer) {
      throw new Error(`No renderer registered for widget type: ${params.widget_type}`);
    }
    const html = renderer(params.data, { title: params.title, size: params.size });
    return { type: 'html', content: html, widget_type: params.widget_type };
  }
  if (name === 'render_dashboard') {
    const params = RenderDashboardSchema.parse(args);
    const deal = await client.deals.get(params.deal_id);
    const widgetHtmlParts: string[] = [];
    for (const widgetType of params.widgets) {
      const renderer = widgetRegistry.get(widgetType);
      if (renderer) {
        const html = renderer({ deal }, { size: 'standard' });
        widgetHtmlParts.push(html);
      }
    }
    const dashboardHtml = `<div class="gpc-dashboard gpc-dashboard--${params.layout}">${widgetHtmlParts.join('\n')}</div>`;
    return { type: 'html', content: dashboardHtml, widget_count: widgetHtmlParts.length };
  }
  throw new Error(`Unknown render tool: ${name}`);
}
