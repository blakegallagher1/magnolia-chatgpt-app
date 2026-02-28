/**
 * Widget registry — maps widget_type strings to HTML renderer functions.
 * Each renderer receives the data payload and render options, returning raw HTML.
 */

export type WidgetSize = 'compact' | 'standard' | 'expanded';

export interface RenderOptions {
  title?: string;
  size?: WidgetSize;
}

export type WidgetRenderer = (data: Record<string, unknown>, opts: RenderOptions) => string;

class WidgetRegistry {
  private readonly renderers = new Map<string, WidgetRenderer>();

  register(widgetType: string, renderer: WidgetRenderer): void {
    this.renderers.set(widgetType, renderer);
  }

  get(widgetType: string): WidgetRenderer | undefined {
    return this.renderers.get(widgetType);
  }

  list(): string[] {
    return [...this.renderers.keys()];
  }
}

export const widgetRegistry = new WidgetRegistry();

// Register all widget renderers (imported lazily to avoid circular deps)
import {
  renderDealCard,
  renderParcelMap,
  renderMarketChart,
  renderCompsTable,
  renderUnderwritingSummary,
  renderMemoPreview,
  renderFloodMap,
  renderZoningBadge,
  renderOwnershipTree,
  renderDemographicsChart,
  renderPipelineKanban,
  renderDocumentList,
} from './templates.js';

widgetRegistry.register('deal_card', renderDealCard);
widgetRegistry.register('parcel_map', renderParcelMap);
widgetRegistry.register('market_chart', renderMarketChart);
widgetRegistry.register('comps_table', renderCompsTable);
widgetRegistry.register('underwriting_summary', renderUnderwritingSummary);
widgetRegistry.register('memo_preview', renderMemoPreview);
widgetRegistry.register('flood_map', renderFloodMap);
widgetRegistry.register('zoning_badge', renderZoningBadge);
widgetRegistry.register('ownership_tree', renderOwnershipTree);
widgetRegistry.register('demographics_chart', renderDemographicsChart);
widgetRegistry.register('pipeline_kanban', renderPipelineKanban);
widgetRegistry.register('document_list', renderDocumentList);
