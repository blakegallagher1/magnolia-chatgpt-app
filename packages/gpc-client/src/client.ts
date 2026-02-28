import type { ApiResult } from '@magnolia/shared-types';

// ─── Client Config ────────────────────────────────────────────────────────────

/** Configuration for the GPC API client */
export interface GpcClientConfig {
  /** Base URL for the GPC-CRES FastAPI gateway */
  baseUrl: string;
  /** Bearer token / API key */
  apiKey: string;
  /** Optional request timeout in ms (default: 30000) */
  timeoutMs?: number;
}

// ─── HTTP Error ───────────────────────────────────────────────────────────────

export class GpcApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GpcApiError';
  }
}

// ─── Base Client ─────────────────────────────────────────────────────────────

/**
 * Base HTTP client for the GPC-CRES FastAPI gateway.
 * Handles auth, error normalization, and timeout.
 */
export class GpcClient {
  protected readonly config: Required<GpcClientConfig>;

  constructor(config: GpcClientConfig) {
    this.config = {
      timeoutMs: 30_000,
      ...config,
    };
  }

  /**
   * Make an authenticated GET request.
   */
  async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = new URL(path, this.config.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }
    }
    return this.request<T>('GET', url.toString());
  }

  /**
   * Make an authenticated POST request with JSON body.
   */
  async post<T>(path: string, body: unknown): Promise<T> {
    const url = new URL(path, this.config.baseUrl);
    return this.request<T>('POST', url.toString(), body);
  }

  /**
   * Make an authenticated PATCH request with JSON body.
   */
  async patch<T>(path: string, body: unknown): Promise<T> {
    const url = new URL(path, this.config.baseUrl);
    return this.request<T>('PATCH', url.toString(), body);
  }

  // ─── Private ───────────────────────────────────────────────────────────────────────

  private async request<T>(method: string, url: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Accept': 'application/json',
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const json = await response.json() as ApiResult<T>;

      if (!response.ok || !json.success) {
        const err = json as { success: false; error: string; code: string; details?: Record<string, unknown> };
        throw new GpcApiError(
          response.status,
          err.code ?? 'UNKNOWN',
          err.error ?? response.statusText,
          err.details
        );
      }

      return (json as { success: true; data: T }).data;
    } finally {
      clearTimeout(timer);
    }
  }
}
