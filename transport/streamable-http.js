// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * Streamable HTTP Transport for MCP
 *
 * Implements the MCP Streamable HTTP transport (June 2025 spec)
 * https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
 *
 * Features:
 * - Single endpoint POST/GET handling
 * - Session management with Mcp-Session-Id
 * - SSE streaming responses
 * - Deno Deploy compatible
 * - Circuit breaker for fault tolerance
 * - Retry with exponential backoff
 * - Request timeout protection
 * - Rate limiting
 * - Structured logging
 */

const PROTOCOL_VERSION = "2025-06-18";

// ============================================================================
// Logging Utility
// ============================================================================

const LogLevel = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
let currentLogLevel = LogLevel.INFO;

function setLogLevel(level) {
  currentLogLevel = level;
}

function log(level, message, context = {}) {
  if (level >= currentLogLevel) {
    const levelName = Object.keys(LogLevel).find((k) => LogLevel[k] === level);
    const entry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      message,
      ...context,
    };
    console.error(JSON.stringify(entry));
  }
}

// ============================================================================
// Circuit Breaker (Fault Tolerance)
// ============================================================================

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeoutMs = options.resetTimeoutMs || 30000;
    this.halfOpenRequests = options.halfOpenRequests || 1;
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
    this.halfOpenAttempts = 0;
  }

  canExecute() {
    if (this.state === "CLOSED") return true;
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = "HALF_OPEN";
        this.halfOpenAttempts = 0;
        log(LogLevel.INFO, "Circuit breaker transitioning to HALF_OPEN");
        return true;
      }
      return false;
    }
    // HALF_OPEN
    return this.halfOpenAttempts < this.halfOpenRequests;
  }

  recordSuccess() {
    if (this.state === "HALF_OPEN") {
      log(LogLevel.INFO, "Circuit breaker closing after successful request");
    }
    this.failures = 0;
    this.state = "CLOSED";
    this.halfOpenAttempts = 0;
  }

  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.state === "HALF_OPEN") {
      this.halfOpenAttempts++;
    }
    if (this.failures >= this.failureThreshold) {
      this.state = "OPEN";
      log(LogLevel.WARN, "Circuit breaker OPEN", { failures: this.failures });
    }
  }

  getState() {
    return { state: this.state, failures: this.failures };
  }
}

// ============================================================================
// Retry with Exponential Backoff
// ============================================================================

async function retryWithBackoff(
  fn,
  options = {}
) {
  const maxRetries = options.maxRetries || 3;
  const baseDelayMs = options.baseDelayMs || 100;
  const maxDelayMs = options.maxDelayMs || 5000;
  const retryableErrors = options.retryableErrors || ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"];

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isRetryable =
        retryableErrors.some((e) => error.code === e || error.message?.includes(e));

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      const jitter = Math.random() * delay * 0.1;
      log(LogLevel.DEBUG, "Retrying after error", {
        attempt: attempt + 1,
        delay: delay + jitter,
        error: error.message,
      });
      await new Promise((r) => setTimeout(r, delay + jitter));
    }
  }
  throw lastError;
}

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000;
    this.maxRequests = options.maxRequests || 100;
    this.requests = new Map(); // sessionId -> timestamps[]
  }

  isAllowed(sessionId) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let timestamps = this.requests.get(sessionId) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= this.maxRequests) {
      return false;
    }

    timestamps.push(now);
    this.requests.set(sessionId, timestamps);
    return true;
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [sessionId, timestamps] of this.requests) {
      const valid = timestamps.filter((t) => t > windowStart);
      if (valid.length === 0) {
        this.requests.delete(sessionId);
      } else {
        this.requests.set(sessionId, valid);
      }
    }
  }
}

// ============================================================================
// Request Timeout
// ============================================================================

function withTimeout(promise, timeoutMs, message = "Request timeout") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), timeoutMs)
    ),
  ]);
}

// ============================================================================
// Session ID Generation
// ============================================================================

function generateSessionId() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// ============================================================================
// Session Store
// ============================================================================

class SessionStore {
  constructor(ttlMs = 30 * 60 * 1000) {
    this.sessions = new Map();
    this.ttlMs = ttlMs;
  }

  create() {
    const sessionId = generateSessionId();
    const session = {
      id: sessionId,
      createdAt: Date.now(),
      lastAccess: Date.now(),
      initialized: false,
      pendingMessages: [],
      eventCounter: 0,
      requestCount: 0,
      errorCount: 0,
    };
    this.sessions.set(sessionId, session);
    this.cleanup();
    log(LogLevel.DEBUG, "Session created", { sessionId });
    return session;
  }

  get(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccess = Date.now();
    }
    return session;
  }

  delete(sessionId) {
    log(LogLevel.DEBUG, "Session deleted", { sessionId });
    return this.sessions.delete(sessionId);
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, session] of this.sessions) {
      if (now - session.lastAccess > this.ttlMs) {
        this.sessions.delete(id);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      log(LogLevel.DEBUG, "Sessions cleaned up", { count: cleaned });
    }
  }

  nextEventId(session) {
    session.eventCounter++;
    return `${session.id}-${session.eventCounter}`;
  }

  getStats() {
    return {
      activeSessions: this.sessions.size,
      oldestSession: Math.min(...[...this.sessions.values()].map((s) => s.createdAt)),
    };
  }
}

// ============================================================================
// SSE Utilities
// ============================================================================

function formatSSEEvent(data, eventId = null) {
  let event = "event: message\n";
  event += `data: ${JSON.stringify(data)}\n`;
  if (eventId) {
    event += `id: ${eventId}\n`;
  }
  event += "\n";
  return event;
}

function createSSEStream() {
  const encoder = new TextEncoder();
  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  return {
    stream,
    send(data, eventId = null) {
      const event = formatSSEEvent(data, eventId);
      controller.enqueue(encoder.encode(event));
    },
    close() {
      controller.close();
    },
  };
}

// ============================================================================
// Streamable HTTP Transport
// ============================================================================

export class StreamableHttpTransport {
  constructor(server, options = {}) {
    this.server = server;
    this.options = {
      path: options.path || "/mcp",
      allowedOrigins: options.allowedOrigins || null,
      enableCors: options.enableCors ?? true,
      sessionTtlMs: options.sessionTtlMs || 30 * 60 * 1000,
      requestTimeoutMs: options.requestTimeoutMs || 30000,
      enableRateLimiting: options.enableRateLimiting ?? true,
      rateLimitWindowMs: options.rateLimitWindowMs || 60000,
      rateLimitMaxRequests: options.rateLimitMaxRequests || 100,
      enableCircuitBreaker: options.enableCircuitBreaker ?? true,
      ...options,
    };

    this.sessions = new SessionStore(this.options.sessionTtlMs);
    this.messageHandlers = new Map();
    this.circuitBreaker = new CircuitBreaker();
    this.rateLimiter = new RateLimiter({
      windowMs: this.options.rateLimitWindowMs,
      maxRequests: this.options.rateLimitMaxRequests,
    });

    // Periodic cleanup
    if (typeof Deno !== "undefined") {
      setInterval(() => {
        this.sessions.cleanup();
        this.rateLimiter.cleanup();
      }, 60000);
    }
  }

  onMessage(handler) {
    this.messageHandler = handler;
  }

  onClose(handler) {
    this.closeHandler = handler;
  }

  async handleRequest(request) {
    const startTime = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;

    // Check path
    if (path !== this.options.path) {
      return new Response("Not Found", { status: 404 });
    }

    // Security: Check Origin
    const origin = request.headers.get("Origin");
    if (origin && this.options.allowedOrigins) {
      if (!this.options.allowedOrigins.includes(origin)) {
        log(LogLevel.WARN, "Forbidden origin", { origin });
        return new Response("Forbidden: Invalid Origin", { status: 403 });
      }
    }

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return this.corsResponse(request, 204);
    }

    // Circuit breaker check
    if (this.options.enableCircuitBreaker && !this.circuitBreaker.canExecute()) {
      log(LogLevel.WARN, "Circuit breaker open, rejecting request");
      return this.jsonResponse(
        { error: "Service temporarily unavailable" },
        503
      );
    }

    try {
      let response;
      switch (request.method) {
        case "POST":
          response = await withTimeout(
            this.handlePost(request),
            this.options.requestTimeoutMs,
            "Request processing timeout"
          );
          break;
        case "GET":
          response = await this.handleGet(request);
          break;
        case "DELETE":
          response = await this.handleDelete(request);
          break;
        default:
          response = new Response("Method Not Allowed", { status: 405 });
      }

      if (this.options.enableCircuitBreaker) {
        this.circuitBreaker.recordSuccess();
      }

      log(LogLevel.DEBUG, "Request completed", {
        method: request.method,
        path,
        status: response.status,
        durationMs: Date.now() - startTime,
      });

      return response;
    } catch (error) {
      if (this.options.enableCircuitBreaker) {
        this.circuitBreaker.recordFailure();
      }
      log(LogLevel.ERROR, "Request failed", {
        method: request.method,
        error: error.message,
      });
      return this.jsonResponse({ error: error.message }, 500);
    }
  }

  async handlePost(request) {
    const sessionId = request.headers.get("Mcp-Session-Id");
    const accept = request.headers.get("Accept") || "";
    const wantsSSE = accept.includes("text/event-stream");

    let body;
    try {
      body = await request.json();
    } catch {
      return this.jsonResponse({ error: "Invalid JSON" }, 400);
    }

    // Validate JSON-RPC structure
    const messages = Array.isArray(body) ? body : [body];
    for (const msg of messages) {
      if (!msg.jsonrpc || msg.jsonrpc !== "2.0") {
        return this.jsonResponse({ error: "Invalid JSON-RPC version" }, 400);
      }
    }

    const isInitialize =
      body.method === "initialize" ||
      (Array.isArray(body) && body.some((m) => m.method === "initialize"));

    let session;
    if (isInitialize) {
      session = this.sessions.create();
    } else {
      if (!sessionId) {
        return this.jsonResponse({ error: "Missing Mcp-Session-Id header" }, 400);
      }
      session = this.sessions.get(sessionId);
      if (!session) {
        return this.jsonResponse({ error: "Session not found" }, 404);
      }

      // Rate limiting
      if (this.options.enableRateLimiting && !this.rateLimiter.isAllowed(sessionId)) {
        log(LogLevel.WARN, "Rate limit exceeded", { sessionId });
        return this.jsonResponse({ error: "Rate limit exceeded" }, 429);
      }
    }

    session.requestCount++;
    const responses = [];

    for (const message of messages) {
      if (this.messageHandler) {
        try {
          const response = await this.messageHandler(message);
          if (response !== undefined) {
            responses.push(response);
          }
        } catch (error) {
          session.errorCount++;
          responses.push({
            jsonrpc: "2.0",
            id: message.id,
            error: {
              code: -32603,
              message: error.message,
            },
          });
        }
      }
    }

    if (responses.length === 0) {
      return this.acceptedResponse(session.id);
    }

    if (wantsSSE && responses.length > 1) {
      return this.sseResponse(session, responses);
    }

    const result = responses.length === 1 ? responses[0] : responses;
    return this.jsonResponse(result, 200, session.id);
  }

  async handleGet(request) {
    const sessionId = request.headers.get("Mcp-Session-Id");

    if (!sessionId) {
      return this.jsonResponse({ error: "Missing Mcp-Session-Id header" }, 400);
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return this.jsonResponse({ error: "Session not found" }, 404);
    }

    const sse = createSSEStream();

    for (const msg of session.pendingMessages) {
      sse.send(msg, this.sessions.nextEventId(session));
    }
    session.pendingMessages = [];
    sse.close();

    return this.corsResponse(
      request,
      200,
      {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Mcp-Session-Id": session.id,
        "MCP-Protocol-Version": PROTOCOL_VERSION,
      },
      sse.stream
    );
  }

  async handleDelete(request) {
    const sessionId = request.headers.get("Mcp-Session-Id");

    if (!sessionId) {
      return this.jsonResponse({ error: "Missing Mcp-Session-Id header" }, 400);
    }

    const deleted = this.sessions.delete(sessionId);
    if (!deleted) {
      return this.jsonResponse({ error: "Session not found" }, 404);
    }

    if (this.closeHandler) {
      this.closeHandler();
    }

    return new Response(null, { status: 204 });
  }

  sendToSession(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pendingMessages.push(message);
    }
  }

  // Health check data
  getHealth() {
    return {
      status: this.circuitBreaker.state === "OPEN" ? "degraded" : "healthy",
      circuitBreaker: this.circuitBreaker.getState(),
      sessions: this.sessions.getStats(),
    };
  }

  jsonResponse(data, status = 200, sessionId = null) {
    const headers = {
      "Content-Type": "application/json",
      "MCP-Protocol-Version": PROTOCOL_VERSION,
    };
    if (sessionId) {
      headers["Mcp-Session-Id"] = sessionId;
    }
    if (this.options.enableCors) {
      headers["Access-Control-Allow-Origin"] = "*";
      headers["Access-Control-Allow-Headers"] =
        "Content-Type, Mcp-Session-Id, MCP-Protocol-Version, Accept";
      headers["Access-Control-Expose-Headers"] =
        "Mcp-Session-Id, MCP-Protocol-Version";
    }
    return new Response(JSON.stringify(data), { status, headers });
  }

  acceptedResponse(sessionId) {
    const headers = {
      "MCP-Protocol-Version": PROTOCOL_VERSION,
    };
    if (sessionId) {
      headers["Mcp-Session-Id"] = sessionId;
    }
    if (this.options.enableCors) {
      headers["Access-Control-Allow-Origin"] = "*";
    }
    return new Response(null, { status: 202, headers });
  }

  sseResponse(session, messages) {
    const sse = createSSEStream();

    for (const msg of messages) {
      sse.send(msg, this.sessions.nextEventId(session));
    }
    sse.close();

    const headers = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Mcp-Session-Id": session.id,
      "MCP-Protocol-Version": PROTOCOL_VERSION,
    };
    if (this.options.enableCors) {
      headers["Access-Control-Allow-Origin"] = "*";
      headers["Access-Control-Expose-Headers"] =
        "Mcp-Session-Id, MCP-Protocol-Version";
    }

    return new Response(sse.stream, { status: 200, headers });
  }

  corsResponse(request, status = 200, headers = {}, body = null) {
    const responseHeaders = { ...headers };
    if (this.options.enableCors) {
      responseHeaders["Access-Control-Allow-Origin"] =
        request.headers.get("Origin") || "*";
      responseHeaders["Access-Control-Allow-Methods"] =
        "GET, POST, DELETE, OPTIONS";
      responseHeaders["Access-Control-Allow-Headers"] =
        "Content-Type, Mcp-Session-Id, MCP-Protocol-Version, Accept, Last-Event-ID";
      responseHeaders["Access-Control-Expose-Headers"] =
        "Mcp-Session-Id, MCP-Protocol-Version";
      responseHeaders["Access-Control-Max-Age"] = "86400";
    }
    return new Response(body, { status, headers: responseHeaders });
  }
}

// Export utilities for external use
export {
  CircuitBreaker,
  RateLimiter,
  retryWithBackoff,
  withTimeout,
  setLogLevel,
  LogLevel,
};

export default { StreamableHttpTransport, CircuitBreaker, RateLimiter };
