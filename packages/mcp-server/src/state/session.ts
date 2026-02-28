import type { Env } from '../index.js';

// ─── Session Data Shape ───────────────────────────────────────────────────────

/** Data stored in the Durable Object session */
export interface SessionData {
  /** Currently selected parcel IDs */
  selected_parcels: string[];
  /** Active deal context (deal ID) */
  active_deal_id: string | null;
  /** Current map viewport */
  map_viewport: {
    center: [number, number];
    zoom: number;
    bbox: [number, number, number, number] | null;
  } | null;
  /** The last 20 tool calls (for context continuity) */
  recent_tool_calls: Array<{
    tool: string;
    args: Record<string, unknown>;
    result_summary: string;
    called_at: string;
  }>;
  /** Conversation ID from ChatGPT */
  conversation_id: string | null;
  /** When the session was last touched */
  updated_at: string;
}

const DEFAULT_SESSION: SessionData = {
  selected_parcels: [],
  active_deal_id: null,
  map_viewport: null,
  recent_tool_calls: [],
  conversation_id: null,
  updated_at: new Date().toISOString(),
};

// ─── Durable Object ───────────────────────────────────────────────────────────

/**
 * Durable Object that stores per-conversation session state.
 * One instance per conversation ID — persists parcel selections,
 * active deal context, map viewport, and recent tool call history.
 */
export class SessionState implements DurableObject {
  private readonly storage: DurableObjectStorage;

  constructor(state: DurableObjectState, _env: Env) {
    this.storage = state.storage;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    try {
      // ── GET /session → return current session ────────────────────────────
      if (method === 'GET') {
        const session = (await this.storage.get<SessionData>('session')) ?? DEFAULT_SESSION;
        return jsonResponse(session);
      }

      // ── PUT /session → replace session entirely ──────────────────────────
      if (method === 'PUT') {
        const data = (await request.json()) as SessionData;
        data.updated_at = new Date().toISOString();
        await this.storage.put('session', data);
        return jsonResponse({ ok: true });
      }

      // ── PATCH /session → merge partial updates ───────────────────────────
      if (method === 'PATCH') {
        const current = (await this.storage.get<SessionData>('session')) ?? DEFAULT_SESSION;
        const patch = (await request.json()) as Partial<SessionData>;
        const updated: SessionData = {
          ...current,
          ...patch,
          updated_at: new Date().toISOString(),
        };
        await this.storage.put('session', updated);
        return jsonResponse(updated);
      }

      // ── POST /session/tool-call → append a tool call record ──────────────
      if (method === 'POST' && url.pathname.endsWith('/tool-call')) {
        const current = (await this.storage.get<SessionData>('session')) ?? DEFAULT_SESSION;
        const call = (await request.json()) as SessionData['recent_tool_calls'][number];
        const calls = [...current.recent_tool_calls, call].slice(-20); // keep last 20
        const updated: SessionData = { ...current, recent_tool_calls: calls, updated_at: new Date().toISOString() };
        await this.storage.put('session', updated);
        return jsonResponse({ ok: true });
      }

      // ── DELETE /session → reset session ──────────────────────────────────
      if (method === 'DELETE') {
        await this.storage.put('session', DEFAULT_SESSION);
        return jsonResponse({ ok: true });
      }

      return new Response('Method not allowed', { status: 405 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
