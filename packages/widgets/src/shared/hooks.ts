import { useState, useEffect } from 'react';

/**
 * Hook that returns the most recent tool result injected by ChatGPT.
 *
 * ChatGPT passes the tool result to the iframe via a `message` event with:
 *   { type: 'tool_result', data: <any> }
 *
 * Returns null until a result is received.
 */
export function useToolResult<T = unknown>(): T | null {
  const [result, setResult] = useState<T | null>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Security: only accept messages from parent (ChatGPT host)
      // In production this would validate event.origin against known ChatGPT domains
      if (event.data?.type === 'tool_result') {
        setResult(event.data.data as T);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return result;
}

/**
 * Hook that subscribes to viewport updates sent from the parent ChatGPT host.
 * Returns the latest viewport or null if none received yet.
 */
export function useViewportSync<V = unknown>(): V | null {
  const [viewport, setViewport] = useState<V | null>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'viewport_update') {
        setViewport(event.data.data as V);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return viewport;
}
