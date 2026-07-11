import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY    = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (!(await checkRateLimit(req, "delete-account", 5, 300))) {
    return rateLimitResponse(CORS);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // Verify the caller's identity from their own JWT — never trust a client-supplied user id
    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await authedClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const userId = user.id;

    // Anonymize rather than hard-delete transactional records that may be needed
    // for accounting/legal retention, but strip all personal identifiers.
    await admin.from("bookings").update({
      customer_name: "Compte supprimé",
      phone: null,
    }).eq("user_id", userId);

    await admin.from("event_bookings").update({
      customer_name: "Compte supprimé",
      phone: null,
      location_description: null,
      notes: null,
    }).eq("user_id", userId);

    // Admin audit logs are kept for accountability but no longer resolve to
    // a live user profile once it's deleted below.

    // Delete the profile row
    await admin.from("users").delete().eq("id", userId);

    // Delete the auth user (requires service role)
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("Auth user deletion failed:", delErr);
      return new Response(JSON.stringify({ error: delErr.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("delete-account crash:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
