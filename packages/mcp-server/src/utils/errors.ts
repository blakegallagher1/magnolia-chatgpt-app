/**
 * Standardized error handling utilities for MCP tool handlers.
 */

/** MCP tool error result shape */
export interface ToolErrorResult {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
}

/**
 * Convert any caught error into a MCP tool error result.
 */
export function toToolError(error: unknown, toolName: string): ToolErrorResult {
  const message = formatError(error);
  return {
    content: [
      {
        type: 'text' as const,
        text: `[${toolName}] Error: ${message}`,
      },
    ],
    isError: true as const,
  };
}

/**
 * Extract a human-readable message from any error value.
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    // If the error has a structured API error shape, include the code
    const maybeCode = (error as Record<string, unknown>)['code'];
    if (typeof maybeCode === 'string') {
      return `${maybeCode}: ${error.message}`;
    }
    return error.message;
  }
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}

/**
 * Wrap a tool handler with automatic error catching.
 * Returns either the handler's result or a ToolErrorResult.
 */
export async function withErrorHandling<T>(
  toolName: string,
  handler: () => Promise<T>,
): Promise<T | ToolErrorResult> {
  try {
    return await handler();
  } catch (error) {
    return toToolError(error, toolName);
  }
}
