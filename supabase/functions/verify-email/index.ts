import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = "https://jeuxdia.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function redirect(status: "verified" | "expired" | "invalid") {
  return new Response(null, {
    status: 302,
    headers: { ...CORS, Location: `${APP_URL}/?email_verified=${status}` },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (!(await checkRateLimit(req, "verify-email", 20, 60))) {
    return rateLimitResponse(CORS);
  }

  const token = new URL(req.url).searchParams.get("token");
  if (!token) return redirect("invalid");

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: tokenRow } = await supabase
      .from("email_verification_tokens").select("user_id, expires_at").eq("token", token).maybeSingle();

    if (!tokenRow) return redirect("invalid");

    if (new Date(tokenRow.expires_at) < new Date()) {
      await supabase.from("email_verification_tokens").delete().eq("token", token);
      return redirect("expired");
    }

    await supabase.from("users").update({ email_verified: true }).eq("id", tokenRow.user_id);
    await supabase.from("email_verification_tokens").delete().eq("token", token);

    return redirect("verified");
  } catch (err) {
    console.error("verify-email crash:", err.message);
    return redirect("invalid");
  }
});
