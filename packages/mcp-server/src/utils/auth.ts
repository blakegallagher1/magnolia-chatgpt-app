import type { Env } from '../index.js';

/**
 * Validate the API key on incoming MCP requests.
 *
 * In Developer Mode (single user), we simply check that the request
 * carries the correct bearer token matching an env-configured key,
 * OR is coming from localhost in development.
 *
 * Returns null if valid, or a 401 Response if not.
 */
export function validateApiKey(request: Request, env: Env): Response | null {
  // Allow all requests in development without auth
  if (env.ENVIRONMENT === 'development') {
    return null;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorizedResponse('Missing Authorization header. Expected: Bearer <api-key>');
  }

  const token = authHeader.slice('Bearer '.length).trim();

  // The MCP_API_KEY is the shared secret for developer mode access.
  // It's stored as a Wrangler secret (not in wrangler.toml vars).
  const expectedKey = (env as unknown as Record<string, string>)['MCP_API_KEY'];
  if (expectedKey && token !== expectedKey) {
    return unauthorizedResponse('Invalid API key');
  }

  return null;
}

function unauthorizedResponse(message: string): Response {
  return new Response(
    JSON.stringify({
      error: 'Unauthorized',
      message,
      code: 'AUTH_FAILED',
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="Magnolia Intelligence Platform"',
      },
    },
  );
}
