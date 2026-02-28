import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GpcClient } from '@magnolia/gpc-client';
import { parcelTools, dispatchParcelTool } from './parcels.js';
import { screeningTools, dispatchScreeningTool } from './screening.js';
import { dealTools, dispatchDealTool } from './deals.js';
import { marketTools, dispatchMarketTool } from './market.js';
import { compsTools, dispatchCompsTool } from './comps.js';
import { analysisTools, dispatchAnalysisTool } from './analysis.js';
import { zoningTools, dispatchZoningTool } from './zoning.js';
import { floodTools, dispatchFloodTool } from './flood.js';
import { ownershipTools, dispatchOwnershipTool } from './ownership.js';
import { demographicTools, dispatchDemographicTool } from './demographics.js';
import { documentTools, dispatchDocumentTool } from './documents.js';
import { knowledgeTools, dispatchKnowledgeTool } from './knowledge.js';
import { workflowTools, dispatchWorkflowTool } from './workflows.js';
import { memoTools, dispatchMemoTool } from './memo.js';
import { renderTools, dispatchRenderTool } from './render.js';

export const allTools: Tool[] = [
  ...parcelTools,
  ...screeningTools,
  ...dealTools,
  ...marketTools,
  ...compsTools,
  ...analysisTools,
  ...zoningTools,
  ...floodTools,
  ...ownershipTools,
  ...demographicTools,
  ...documentTools,
  ...knowledgeTools,
  ...workflowTools,
  ...memoTools,
  ...renderTools,
];

const dispatchers: Record<
  string,
  (client: GpcClient, name: string, args: unknown) => Promise<unknown>
> = {};

for (const tool of parcelTools) dispatchers[tool.name] = dispatchParcelTool;
for (const tool of screeningTools) dispatchers[tool.name] = dispatchScreeningTool;
for (const tool of dealTools) dispatchers[tool.name] = dispatchDealTool;
for (const tool of marketTools) dispatchers[tool.name] = dispatchMarketTool;
for (const tool of compsTools) dispatchers[tool.name] = dispatchCompsTool;
for (const tool of analysisTools) dispatchers[tool.name] = dispatchAnalysisTool;
for (const tool of zoningTools) dispatchers[tool.name] = dispatchZoningTool;
for (const tool of floodTools) dispatchers[tool.name] = dispatchFloodTool;
for (const tool of ownershipTools) dispatchers[tool.name] = dispatchOwnershipTool;
for (const tool of demographicTools) dispatchers[tool.name] = dispatchDemographicTool;
for (const tool of documentTools) dispatchers[tool.name] = dispatchDocumentTool;
for (const tool of knowledgeTools) dispatchers[tool.name] = dispatchKnowledgeTool;
for (const tool of workflowTools) dispatchers[tool.name] = dispatchWorkflowTool;
for (const tool of memoTools) dispatchers[tool.name] = dispatchMemoTool;
for (const tool of renderTools) dispatchers[tool.name] = dispatchRenderTool;

export async function dispatchTool(
  client: GpcClient,
  name: string,
  args: unknown,
): Promise<unknown> {
  const dispatch = dispatchers[name];
  if (!dispatch) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return dispatch(client, name, args);
}
