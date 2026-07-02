import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Redis } from 'https://deno.land/x/upstash_redis@v1.20.0/mod.ts';

// Initialize Redis client from environment variables
const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_REST_URL') || '',
  token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '',
});

serve(async (req) => {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Increment request count for this IP
    const current = await redis.incr(ip);
    
    // Set expiry of 60 seconds on the first request
    if (current === 1) {
      await redis.expire(ip, 60);
    }
    
    // Rate limit: 20 requests per minute
    if (current > 20) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, count: current }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});
