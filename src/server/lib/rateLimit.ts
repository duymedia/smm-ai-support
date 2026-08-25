import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash Redis credentials are provided
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let upstashRatelimit: Ratelimit | null = null;

if (UPSTASH_URL && UPSTASH_TOKEN) {
  try {
    const redis = new Redis({
      url: UPSTASH_URL,
      token: UPSTASH_TOKEN,
    });
    upstashRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: true,
      prefix: "nexussmm:ratelimit",
    });
  } catch (err) {
    console.warn("Upstash Redis initialization failed, using in-memory rate limiting:", err);
  }
}

// In-Memory Rate Limiting Fallback (sliding window)
interface MemoryRecord {
  timestamps: number[];
}
const memoryStore = new Map<string, MemoryRecord>();

/**
 * Check rate limit for a given identifier (IP or user ID)
 * @param identifier e.g. "auth:login:127.0.0.1"
 * @param limit maximum requests allowed in the window
 * @param windowSeconds time window in seconds
 */
export async function checkRateLimit(
  identifier: string,
  limit = 10,
  windowSeconds = 60
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // If Upstash Redis is configured
  if (upstashRatelimit) {
    try {
      const res = await upstashRatelimit.limit(identifier);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    } catch (e) {
      console.warn("Upstash limit error, falling back to memory store:", e);
    }
  }

  // Fallback in-memory limiter
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  let record = memoryStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(identifier, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const reset = oldest + windowMs;
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, limit - record.timestamps.length);
  const reset = now + windowMs;

  return {
    success: true,
    limit,
    remaining,
    reset,
  };
}
