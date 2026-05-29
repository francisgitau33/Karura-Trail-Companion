import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.error('Failed to initialize Upstash Redis:', error);
}

// Fallback memory cache if Redis is not configured (for development only)
const fallbackCache = new Map();

// Helper to create a rate limiter or return a fallback
function createLimiter(
  prefix: string,
  requests: number,
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d`,
) {
  if (redis) {
    return new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      ephemeralCache: fallbackCache,
      prefix: `@upstash/ratelimit:${prefix}`,
    });
  }
  
  // Return a mock limiter if Redis is not configured.
  // In production, you should rely on the caller to enforce a strict block if this mock is returned
  // for sensitive public routes, but for admin login a mock might be acceptable locally.
  return {
    limit: async (identifier: string) => {
      console.warn(`[RateLimit Fallback] Redis not configured. Bypassing rate limit for ${prefix}:${identifier}`);
      return { success: true, limit: requests, remaining: requests - 1, reset: Date.now() + 60000 };
    },
  };
}

export const limiters = {
  adminLogin: createLimiter('admin_login', 5, '15 m'),
  placeSuggestion: createLimiter('place_suggestion', 10, '1 h'),
  trailSuggestion: createLimiter('trail_suggestion', 5, '1 h'),
};

export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = headersList.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'anonymous_local';
}

export function isRateLimitConfigured(): boolean {
  return redis !== null;
}
