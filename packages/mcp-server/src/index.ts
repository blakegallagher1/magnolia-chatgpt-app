import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createGpcClient } from '@magnolia/gpc-client';
import { registerAllTools } from './tools/index.js';
import { registerWidgets } from './widgets/registry.js';
import { SessionState } from './state/session.js';
import { validateApiKey } from './utils/auth.js';

// Re-export the Durable Object class so Wrangler can find it
export { SessionState };

// ─── Environment Interface ────────────────────────────────────────────────────

export interface Env {
  /** Base URL of the GPC-CRES FastAPI gateway */
  GPC_GATEWAY_URL: string;
  /** API key for bearer token authentication to the gateway */
  GPC_API_KEY: string;
  /** Durable Object namespace for per-conversation session state */
  SESSION_STATE: DurableObjectNamespace;
  /** 'production' | 'development' */
  ENVIRONMENT: string;
  /** Static widget assets (from [assets] binding) */
  ASSETS?: { fetch(request: Request): Promise<Response> };
}

// ─── Worker Entry Point ───────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // ── Health check ──────────────────────────────────────────────────────────
    if (pathname === '/' || pathname === '/health') {
      return new Response(
        JSON.stringify({
          service: 'Magnolia Intelligence Platform',
          version: '1.0.0',
          status: 'ok',
          environment: env.ENVIRONMENT,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // ── MCP endpoint ──────────────────────────────────────────────────────────
    if (pathname === '/mcp' || pathname.startsWith('/mcp/')) {
      // Validate API key (for developer mode, checks a static key from env or header)
      const authError = validateApiKey(request, env);
      if (authError) return authError;

      const server = new McpServer({
        name: 'magnolia-intelligence',
        version: '1.0.0',
      });

      const client = createGpcClient({
        baseUrl: env.GPC_GATEWAY_URL,
        apiKey: env.GPC_API_KEY,
      });

      // Register all tools and widget resources
      registerAllTools(server, client, env);
      registerWidgets(server, env);

      // Delegate to MCP SDK's Streamable HTTP transport handler
      const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await server.connect(transport);
      return transport.handleRequest(request);
    }

    // ── Widget asset serving ──────────────────────────────────────────────────
    if (pathname.startsWith('/widgets/')) {
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
      return new Response('Widget assets not available', { status: 404 });
    }

    // ── Durable Object session proxy ──────────────────────────────────────────
    if (pathname.startsWith('/session/')) {
      const sessionId = url.searchParams.get('id') ?? 'default';
      const stub = env.SESSION_STATE.get(env.SESSION_STATE.idFromName(sessionId));
      return stub.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
