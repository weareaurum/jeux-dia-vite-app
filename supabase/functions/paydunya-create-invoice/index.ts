import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MASTER_KEY  = Deno.env.get("PAYDUNYA_MASTER_KEY")!;
const PRIVATE_KEY = Deno.env.get("PAYDUNYA_PRIVATE_KEY")!;
const TOKEN       = Deno.env.get("PAYDUNYA_TOKEN")!;
const MODE        = Deno.env.get("PAYDUNYA_MODE") || "live"; // "live" or "test"

const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BASE_URL = MODE === "test"
  ? "https://app.paydunya.com/sandbox-api/v1"
  : "https://app.paydunya.com/api/v1";

const APP_URL = "https://jeuxdia.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { bookingId, amount, description, customerName, customerEmail, customerPhone } = await req.json();

    if (!bookingId || !amount) {
      return new Response(JSON.stringify({ error: "bookingId and amount required" }), { status: 400, headers: CORS });
    }

    // Retrieve Supabase Edge Function URL for webhook
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: fnData } = await supabase.functions.url("paydunya-webhook");
    const webhookUrl = fnData || `${SUPABASE_URL}/functions/v1/paydunya-webhook`;

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
        cancel_url: `${APP_URL}?paydunya=cancelled`,
        return_url: `${APP_URL}?paydunya=completed`,
        callback_url: webhookUrl,
      },
      custom_data: {
        booking_id: bookingId,
      },
      ...(customerName || customerEmail || customerPhone
        ? {
            customer: {
              ...(customerName  ? { name: customerName }   : {}),
              ...(customerEmail ? { email: customerEmail } : {}),
              ...(customerPhone ? { phone: customerPhone } : {}),
            },
          }
        : {}),
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
      console.error("PayDunya error:", result);
      return new Response(
        JSON.stringify({ error: result.description || "PayDunya invoice creation failed" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ checkout_url: result.response_text, token: result.token }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("paydunya-create-invoice error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
