import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, checkRateLimitByKey, rateLimitResponse } from "../_shared/rateLimit.ts";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY    = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = "https://jeuxdia.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (!(await checkRateLimit(req, "invite-admin", 10, 600))) {
    return rateLimitResponse(CORS);
  }

  try {
    // Only a logged-in super admin can invite a new admin — never trust a
    // client-supplied role claim.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authErr } = await authedClient.auth.getUser();
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: callerRow } = await admin.from("users").select("role, full_name").eq("id", caller.id).single();
    if (callerRow?.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Réservé aux super admins." }), { status: 403, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // Per-account throttle in addition to per-IP, independent of shared/rotating IPs
    if (!(await checkRateLimitByKey(`invite-admin:caller:${caller.id}`, 10, 600))) {
      return rateLimitResponse(CORS);
    }

    const { email, fullName } = await req.json();
    if (!email || !isValidEmail(email) || !fullName?.trim()) {
      return new Response(JSON.stringify({ error: "Email et nom requis." }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    const cleanEmail = String(email).trim().toLowerCase();

    // inviteUserByEmail creates a brand-new auth account and emails a link for
    // the invitee to set their OWN password — it errors if the email already
    // has an account, which is exactly what stops "promoting" an existing
    // customer into an admin through this path.
    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(cleanEmail, {
      data: { full_name: fullName.trim() },
      redirectTo: `${APP_URL}/`,
    });

    if (inviteErr || !invited?.user) {
      const msg = inviteErr?.message || "";
      const friendly = msg.toLowerCase().includes("already been registered") || msg.toLowerCase().includes("already exists")
        ? "Cet email a déjà un compte. Un admin doit avoir un email qui n'est pas déjà utilisé."
        : (inviteErr?.message || "Erreur lors de l'invitation.");
      return new Response(JSON.stringify({ error: friendly }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // handle_new_user() already created a public.users row with role='customer'
    // (via the auth.users trigger). Promote it to admin as the service role,
    // which bypasses the customer/admin self-service restriction trigger.
    const { error: promoteErr } = await admin
      .from("users")
      .update({ role: "admin", full_name: fullName.trim() })
      .eq("id", invited.user.id);

    if (promoteErr) {
      console.error("Failed to promote invited user to admin:", promoteErr);
      // Roll back the auth user so we don't leave an orphaned customer account
      await admin.auth.admin.deleteUser(invited.user.id);
      return new Response(JSON.stringify({ error: "Erreur lors de la promotion en admin." }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, userId: invited.user.id }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("invite-admin crash:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
