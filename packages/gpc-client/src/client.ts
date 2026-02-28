import type { ApiError } from '@magnolia/shared-types';

// ─── Client Configuration ─────────────────────────────────────────────────────

export interface GpcClientConfig {
  /** Base URL of the GPC-CRES FastAPI gateway */
  baseUrl: string;
  /** API key for bearer token authentication */
  apiKey: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** Max retry attempts on transient errors (default: 2) */
  maxRetries?: number;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/** HTTP methods supported by the client */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Represents a structured gateway error */
class GpcApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'GpcApiError';
    this.status = error.status;
    this.code = error.code;
    this.details = error.details ?? {};
  }
}

// ─── Base Client ──────────────────────────────────────────────────────────────

/**
 * Base HTTP client for the GPC-CRES FastAPI gateway.
 * Uses native fetch (Cloudflare Workers compatible).
 */
export class GpcClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(config: GpcClientConfig) {
    // Strip trailing slash
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 30_000;
    this.maxRetries = config.maxRetries ?? 2;
  }

  // ─── Public Methods ─────────────────────────────────────────────────────────

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>('GET', url, undefined);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>('POST', url, body);
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>('PUT', url, body);
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>('PATCH', url, body);
  }

  async delete<T>(path: string): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>('DELETE', url, undefined);
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Build a URL with optional query string parameters.
   */
  private buildUrl(path: string, params?: Record<string, unknown>): string {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            for (const item of value) {
              url.searchParams.append(key, String(item));
            }
          } else {
            url.searchParams.set(key, String(value));
          }
        }
      }
    }
    return url.toString();
  }

  /**
   * Execute an HTTP request with timeout, retries, and error handling.
   */
  private async request<T>(
    method: HttpMethod,
    url: string,
    body: unknown,
    attempt = 0,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-Client': 'magnolia-mcp/1.0',
        },
        body: body !== undefined ? JSON.stringify(body) : null,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response body
      const contentType = response.headers.get('content-type') ?? '';
      const isJson = contentType.includes('application/json');
      const responseBody = isJson
        ? ((await response.json()) as unknown)
        : await response.text();

      if (!response.ok) {
        // Try to extract a structured error
        if (isJson && typeof responseBody === 'object' && responseBody !== null) {
          const maybeError = responseBody as Record<string, unknown>;
          const apiError: ApiError = {
            code: String(maybeError['code'] ?? 'API_ERROR'),
            message: String(maybeError['detail'] ?? maybeError['message'] ?? 'Unknown gateway error'),
            details: (maybeError['details'] as Record<string, unknown>) ?? {},
            status: response.status,
          };
          throw new GpcApiError(apiError);
        }
        throw new GpcApiError({
          code: 'HTTP_ERROR',
          message: `Gateway returned ${response.status}: ${String(responseBody)}`,
          status: response.status,
        });
      }

      return responseBody as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry on network errors and 5xx responses (not 4xx)
      const isRetryable =
        error instanceof TypeError || // network error
        (error instanceof GpcApiError && error.status >= 500);

      if (isRetryable && attempt < this.maxRetries) {
        // Exponential backoff: 200ms, 400ms
        await sleep(200 * Math.pow(2, attempt));
        return this.request<T>(method, url, body, attempt + 1);
      }

      throw error;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
