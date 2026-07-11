import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const BASE = Deno.env.get("PAYDUNYA_MODE") === "live"
  ? "https://app.paydunya.com/api/v1"
  : "https://app.paydunya.com/sandbox-api/v1";

const NETS: Record<string, string> = { tmoney: "togocel-togo", flooz: "moov-togo" };

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  if (!(await checkRateLimit(req, "register-tournament", 10, 60))) {
    return rateLimitResponse(cors);
  }

  try {
    const { tournamentId, userId, nickname, amount, phone, network } = await req.json();
    const sb = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: existing } = await sb.from("tournament_registrations")
      .select("id").eq("tournament_id", tournamentId).eq("user_id", userId).maybeSingle();
    if (existing) return new Response(
      JSON.stringify({ error: "Déjà inscrit(e) à ce tournoi." }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );

    const { data: t } = await sb.from("tournaments").select("title").eq("id", tournamentId).single();

    const pdH: Record<string, string> = {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY":  Deno.env.get("PAYDUNYA_MASTER_KEY") ?? "",
      "PAYDUNYA-PUBLIC-KEY":  Deno.env.get("PAYDUNYA_PUBLIC_KEY") ?? "",
      "PAYDUNYA-PRIVATE-KEY": Deno.env.get("PAYDUNYA_PRIVATE_KEY") ?? "",
      "PAYDUNYA-TOKEN":       Deno.env.get("PAYDUNYA_TOKEN") ?? "",
    };

    const invR = await fetch(`${BASE}/checkout-invoice/create`, {
      method: "POST", headers: pdH,
      body: JSON.stringify({
        invoice: { total_amount: amount, description: `Inscription tournoi – ${t?.title ?? ""}` },
        store: { name: "Jeux Dia VR" },
        actions: {
          cancel_url:   "https://jeuxdia.com/payment-cancelled",
          return_url:   "https://jeuxdia.com/payment-complete",
          callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/paydunya-webhook`,
        },
        custom_data: { type: "tournament", tournament_id: tournamentId, user_id: userId, nickname },
      }),
    });
    const inv = await invR.json();
    if (inv.response_code !== "00") return new Response(
      JSON.stringify({ error: inv.description ?? "Erreur facture" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );

    const spR = await fetch(`${BASE}/softpay/${NETS[network]}`, {
      method: "POST", headers: pdH,
      body: JSON.stringify({ phone_number: phone, invoice_token: inv.token }),
    });
    const sp = await spR.json();
    if (sp.response_code !== "00") return new Response(
      JSON.stringify({ error: sp.description ?? "Erreur paiement" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );

    const { error: dbE } = await sb.from("tournament_registrations").insert({
      tournament_id: tournamentId, user_id: userId,
      gamer_nickname: nickname, payment_status: "pending",
    });
    if (dbE) return new Response(
      JSON.stringify({ error: dbE.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Erreur interne" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
