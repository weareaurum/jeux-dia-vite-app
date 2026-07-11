import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Sliding-window rate limit backed by the `check_rate_limit` Postgres function.
 * Returns true if the request is allowed, false if the caller should be throttled.
 */
export async function checkRateLimit(
  req: Request,
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const key = `${bucket}:${ip}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("Rate limit check failed (allowing request):", error.message);
      return true; // fail open — never let a rate-limiter bug take down the API
    }
    return data === true;
  } catch (err) {
    console.error("Rate limit crash (allowing request):", err);
    return true;
  }
}

export function rateLimitResponse(cors: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques instants." }),
    { status: 429, headers: { ...cors, "Content-Type": "application/json" } },
  );
}
