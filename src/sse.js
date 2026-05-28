/**
 * Server-Sent Events (SSE) helpers.
 *
 * SSE wire format is line-based plain text:
 *
 *   event: <event-name>\n
 *   data: <utf-8 payload>\n
 *   \n              <-- blank line terminates the event
 *
 * Multiple `data:` lines are concatenated by the client with `\n`. We
 * JSON.stringify our payloads onto a single `data:` line — JSON.stringify
 * never produces a raw newline, so this is safe.
 *
 * Why SSE (and not WebSockets)?
 *   - One-way (server -> client) is exactly what "agent thinking out loud" needs.
 *   - Plain HTTP, no Upgrade handshake, works through every proxy/CDN.
 *   - EventSource auto-reconnects on the client (for GET-based streams).
 *
 * We use POST + manual SSE framing here so the client can send a JSON body.
 * The browser reads it with `fetch()` + a ReadableStream reader.
 */

/** Send the SSE handshake headers and flush them so the client opens its reader. */
export function openSseStream(res) {
  res.status(200).set({
    "Content-Type":      "text/event-stream",
    "Cache-Control":     "no-cache, no-transform",
    "Connection":        "keep-alive",
    // Disable proxy buffering (nginx). Without this, events get held until
    // the response closes, which defeats the point of streaming.
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
}

/** Write one framed SSE event. No-op if the response is already closed. */
export function sendSse(res, event, data) {
  if (res.writableEnded) return;
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Periodically write an SSE comment line to keep the connection alive.
 *
 * Why: nginx / load balancers / browsers will kill an "idle" connection after
 * 30-60s. SSE comments (lines starting with `:`) are ignored by the client
 * but reset every idle timer in the chain.
 *
 * Returns a stop function — call it from your `finally` block.
 */
export function startHeartbeat(res, intervalMs = 15_000) {
  const id = setInterval(() => {
    if (res.writableEnded) return clearInterval(id);
    res.write(`: ping ${Date.now()}\n\n`);
  }, intervalMs);
  return () => clearInterval(id);
}
