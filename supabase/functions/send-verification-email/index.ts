import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, checkRateLimitByKey, rateLimitResponse } from "../_shared/rateLimit.ts";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY    = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY       = Deno.env.get("RESEND_API_KEY");
const FROM = "Jeux Dia VR <noreply@jeuxdia.com>";
const APP_URL = "https://jeuxdia.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function verifyEmailHtml(name: string, link: string) {
  return `
<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px">
  <h1 style="color:#00f5d4;margin-top:0">Jeux Dia VR 🎮</h1>
  <h2 style="margin-top:0">Confirmez votre adresse email</h2>
  <p>Bonjour <strong>${esc(name)}</strong>,</p>
  <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et sécuriser votre compte Jeux Dia VR.</p>
  <a href="${link}" style="display:inline-block;background:#00f5d4;color:#000;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;margin:16px 0">Confirmer mon email</a>
  <p style="color:#94a3b8;font-size:13px">Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.</p>
  <p style="margin-top:32px;color:#475569;font-size:12px">Jeux Dia VR · Lomé, Togo · <a href="https://jeuxdia.com" style="color:#00f5d4">jeuxdia.com</a></p>
</div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!RESEND_API_KEY) return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });

  if (!(await checkRateLimit(req, "send-verification-email", 5, 600))) {
    return rateLimitResponse(CORS);
  }

  try {
    // Only the logged-in user can request their own verification email — never
    // trust a client-supplied userId, which would let anyone spam arbitrary accounts.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authErr } = await authedClient.auth.getUser();
    if (authErr || !authUser) {
      return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    const userId = authUser.id;

    // Belt-and-suspenders: throttle per-account too, independent of shared/rotating IPs
    if (!(await checkRateLimitByKey(`send-verification-email:user:${userId}`, 5, 600))) {
      return rateLimitResponse(CORS);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: userRow, error: userErr } = await supabase
      .from("users").select("id, email, full_name, email_verified").eq("id", userId).single();

    if (userErr || !userRow?.email) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    if (userRow.email_verified) {
      return new Response(JSON.stringify({ success: true, alreadyVerified: true }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // Invalidate any previous outstanding tokens for this user, then issue a fresh one
    await supabase.from("email_verification_tokens").delete().eq("user_id", userId);
    const { data: tokenRow, error: tokenErr } = await supabase
      .from("email_verification_tokens").insert({ user_id: userId }).select("token").single();

    if (tokenErr || !tokenRow?.token) {
      return new Response(JSON.stringify({ error: "Could not create verification token" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const link = `${SUPABASE_URL}/functions/v1/verify-email?token=${tokenRow.token}`;
    const html = verifyEmailHtml(userRow.full_name || "Client", link);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: userRow.email, subject: "Confirmez votre email — Jeux Dia VR", html }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend error:", errBody);
      return new Response(JSON.stringify({ error: "Email send failed" }), { status: 502, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-verification-email crash:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
