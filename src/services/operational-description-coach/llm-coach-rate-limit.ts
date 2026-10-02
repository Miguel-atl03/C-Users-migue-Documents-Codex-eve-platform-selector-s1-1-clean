type RateLimitBucket = {
  count: number;
  windowStartedAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

export function checkOperationalDescriptionLlmRateLimit(sessionId: string) {
  const key = sessionId.trim();
  if (!key) {
    return { allowed: false, reason: "missing_session" as const };
  }

  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now - current.windowStartedAt > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStartedAt: now });
    return { allowed: true, reason: null };
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, reason: "rate_limited" as const };
  }

  current.count += 1;
  buckets.set(key, current);
  return { allowed: true, reason: null };
}

export function resetOperationalDescriptionLlmRateLimitForTests() {
  buckets.clear();
}
