/**
 * @magnolia/gpc-client
 * Typed HTTP client for the GPC-CRES API.
 */
export { GpcClient } from './client.js';
export type { GpcClientOptions } from './client.js';

export { AgentsClient } from './agents.js';
export type { AgentName, AgentTaskStatus } from './agents.js';

export { WorkflowsClient } from './workflows.js';
export type {
  WorkflowRun,
  WorkflowStep,
  StartWorkflowRequest,
} from './workflows.js';

export { DealsClient } from './deals.js';
export type { CreateDealPayload, UpdateDealPayload, DealListParams } from './deals.js';

export { ParcelsClient } from './parcels.js';
export type { ParcelSearchParams } from './parcels.js';

export { DocumentsClient } from './documents.js';
export type { UploadDocumentOptions } from './documents.js';

export { CompsClient } from './comps.js';
export type { CompsSearchParams } from './comps.js';

export { MarketDataClient } from './market.js';

export { KnowledgeClient } from './knowledge.js';
export type { KnowledgeSearchParams } from './knowledge.js';
