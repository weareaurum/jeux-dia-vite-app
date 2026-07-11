import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const MASTER_KEY  = Deno.env.get("PAYDUNYA_MASTER_KEY")!;
const PRIVATE_KEY = Deno.env.get("PAYDUNYA_PRIVATE_KEY")!;
const TOKEN       = Deno.env.get("PAYDUNYA_TOKEN")!;
const MODE        = Deno.env.get("PAYDUNYA_MODE") || "live";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

const BASE_URL = MODE === "test"
  ? "https://app.paydunya.com/sandbox-api/v1"
  : "https://app.paydunya.com/api/v1";

const APP_URL     = "https://jeuxdia.com";
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/paydunya-webhook`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (!(await checkRateLimit(req, "paydunya-create-invoice", 10, 60))) {
    return rateLimitResponse(CORS);
  }

  try {
    const { type, bookingId, userId, eventId, amount, description, customerName, customerEmail, customerPhone } = await req.json();

    const payType = type || "booking";
    const refId = payType === "membership" ? userId : payType === "event" ? eventId : bookingId;
    if (!refId || !amount) {
      return new Response(JSON.stringify({ error: "reference id and amount required" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (!MASTER_KEY || !PRIVATE_KEY || !TOKEN) {
      return new Response(JSON.stringify({ error: "PayDunya API keys not configured" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const body = {
      invoice: {
        items: {
          item_0: {
            name: description || "Session VR — Jeux Dia",
            quantity: 1,
            unit_price: String(amount),
            total_price: String(amount),
            description: description || "Réservation Jeux Dia VR",
          },
        },
        total_amount: amount,
        description: `Jeux Dia VR — ${description || "Réservation"}`,
      },
      store: { name: "Jeux Dia VR" },
      actions: {
        // Clean paths only — PayDunya appends ?token=... which breaks URLs that already have a query string
        cancel_url: `${APP_URL}/payment-cancelled`,
        return_url: `${APP_URL}/payment-complete`,
        callback_url: WEBHOOK_URL,
      },
      custom_data: {
        type: payType,
        ...(payType === "booking"    ? { booking_id: refId } : {}),
        ...(payType === "membership" ? { user_id: refId }    : {}),
        ...(payType === "event"      ? { event_id: refId }   : {}),
      },
      ...(customerName || customerEmail || customerPhone ? {
        customer: {
          ...(customerName  ? { name: customerName }   : {}),
          ...(customerEmail ? { email: customerEmail } : {}),
          ...(customerPhone ? { phone: customerPhone } : {}),
        },
      } : {}),
    };

    const res = await fetch(`${BASE_URL}/checkout-invoice/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PAYDUNYA-MASTER-KEY": MASTER_KEY,
        "PAYDUNYA-PRIVATE-KEY": PRIVATE_KEY,
        "PAYDUNYA-TOKEN": TOKEN,
      },
      body: JSON.stringify(body),
    });

    const result = await res.json();

    if (result.response_code !== "00") {
      console.error("PayDunya error:", JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: result.response_text || result.description || "PayDunya invoice creation failed", paydunya: result }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ checkout_url: result.response_text, token: result.token }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("paydunya-create-invoice crash:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
