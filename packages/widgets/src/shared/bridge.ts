/**
 * Bridge between the ChatGPT iframe (plugin UI) and the ChatGPT host.
 *
 * ChatGPT Custom Actions provide a JavaScript API for hosted widgets:
 *   - window.chatgpt.sendMessage(text)      — send a message as the user
 *   - window.chatgpt.callTool(name, args)   — invoke a named tool
 *   - window.chatgpt.updateModelContext(s)  — push context string to the model
 *
 * This module wraps those calls with graceful degradation for dev environments
 * where the ChatGPT host API is not available.
 */

type ChatGPTHost = {
  sendMessage: (text: string) => void;
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  updateModelContext: (context: string) => void;
};

function getHost(): ChatGPTHost | null {
  const w = window as unknown as Record<string, unknown>;
  if (w['chatgpt'] && typeof w['chatgpt'] === 'object') {
    return w['chatgpt'] as ChatGPTHost;
  }
  return null;
}

/**
 * Send a message to the ChatGPT conversation as the user.
 */
export function sendMessage(text: string): void {
  const host = getHost();
  if (host) {
    host.sendMessage(text);
  } else {
    console.debug('[bridge] sendMessage (dev mode):', text);
  }
}

/**
 * Invoke a ChatGPT tool by name with the given arguments.
 * Returns the tool's result or undefined in dev mode.
 */
export async function callTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const host = getHost();
  if (host) {
    return host.callTool(name, args);
  } else {
    console.debug('[bridge] callTool (dev mode):', name, args);
    return undefined;
  }
}

/**
 * Push a context string to the model so it's aware of the current UI state.
 * Used to tell the model about things like the current map viewport.
 */
export function updateModelContext(context: string): void {
  const host = getHost();
  if (host) {
    host.updateModelContext(context);
  } else {
    console.debug('[bridge] updateModelContext (dev mode):', context);
  }
}
