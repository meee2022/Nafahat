export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs?: number;
}

/** A fetch that always settles, while preserving an optional caller signal. */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  { timeoutMs = 12_000, signal, ...init }: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(signal?.reason);
  if (signal?.aborted) abortFromCaller();
  else signal?.addEventListener('abort', abortFromCaller, { once: true });

  const timer = setTimeout(() => controller.abort(new Error('request-timeout')), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}
