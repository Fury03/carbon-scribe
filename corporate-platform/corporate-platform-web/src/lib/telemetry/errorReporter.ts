/**
 * Centralized Error Reporting Service
 *
 * Provides structured error capture with:
 * - Typed severity levels
 * - Rate limiting (max N errors per window)
 * - Environment-based filtering (dev vs production)
 * - Forwarding to an observability platform endpoint
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorPayload {
  error: string;
  severity: ErrorSeverity;
  context: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  url: string;
  userAgent: string;
  requestId?: string;
}

// ── Rate limiter ─────────────────────────────────────────────────────────────

const RATE_LIMIT_MAX = Number(process.env.NEXT_PUBLIC_ERROR_RATE_LIMIT_MAX) || 50;
const RATE_LIMIT_WINDOW_MS =
  Number(process.env.NEXT_PUBLIC_ERROR_RATE_LIMIT_WINDOW_MS) || 60_000;

let windowStart = Date.now();
let windowCount = 0;

function isRateLimited(): boolean {
  const now = Date.now();
  if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
    windowStart = now;
    windowCount = 0;
  }
  if (windowCount >= RATE_LIMIT_MAX) return true;
  windowCount++;
  return false;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildPayload(
  error: unknown,
  severity: ErrorSeverity,
  context: string,
  metadata?: Record<string, unknown>,
  requestId?: string,
): ErrorPayload {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);

  return {
    error: message,
    severity,
    context,
    metadata: {
      ...metadata,
      ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
    },
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    requestId,
  };
}

// ── Platform forwarder ───────────────────────────────────────────────────────

const ENDPOINT = process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT;

async function forward(payload: ErrorPayload): Promise<void> {
  if (!ENDPOINT) return;
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Silently ignore forwarding failures to avoid recursion
  }
}

// ── Dev console output ───────────────────────────────────────────────────────

const IS_DEV = process.env.NODE_ENV === 'development';
const DEV_MIN_SEVERITY = (process.env.NEXT_PUBLIC_ERROR_DEV_MIN_SEVERITY ||
  'warning') as ErrorSeverity;

const SEVERITY_RANK: Record<ErrorSeverity, number> = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3,
};

function shouldLogToConsole(severity: ErrorSeverity): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[DEV_MIN_SEVERITY];
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Report an error to the centralized telemetry sink.
 *
 * @param error    - The error object or message string
 * @param context  - Component or service name (e.g. 'AuthContext', 'api-client')
 * @param severity - 'info' | 'warning' | 'error' | 'critical' (default: 'error')
 * @param metadata - Additional key/value debug context
 * @param requestId - Correlation ID if available
 */
export function reportError(
  error: unknown,
  context: string,
  severity: ErrorSeverity = 'error',
  metadata?: Record<string, unknown>,
  requestId?: string,
): void {
  if (isRateLimited()) return;

  const payload = buildPayload(error, severity, context, metadata, requestId);

  if (IS_DEV) {
    if (shouldLogToConsole(severity)) {
      // eslint-disable-next-line no-console
      console.error(`[${severity.toUpperCase()}] ${context}:`, error, metadata ?? '');
    }
    // In development, skip remote forwarding unless explicitly configured
    if (!ENDPOINT) return;
  }

  // Fire-and-forget
  forward(payload);
}
