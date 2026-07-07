import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MASTER_KEY  = Deno.env.get("PAYDUNYA_MASTER_KEY")!;
const PRIVATE_KEY = Deno.env.get("PAYDUNYA_PRIVATE_KEY")!;
const TOKEN       = Deno.env.get("PAYDUNYA_TOKEN")!;
const MODE        = Deno.env.get("PAYDUNYA_MODE") || "live";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BASE_URL = MODE === "test"
  ? "https://app.paydunya.com/sandbox-api/v1"
  : "https://app.paydunya.com/api/v1";

async function sendEmail(supabase: ReturnType<typeof createClient>, template: string, data: Record<string, string>) {
  try {
    await supabase.functions.invoke("send-email", { body: { template, data } });
  } catch (err) {
    console.error("Email send failed (non-fatal):", err);
  }
}

async function confirmBooking(supabase: ReturnType<typeof createClient>, bookingId: string) {
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, user_id, price, payment_status, customer_name, start_time, duration")
    .eq("id", bookingId)
    .single();

  if (!booking) { console.error("Booking not found:", bookingId); return; }
  if (booking.payment_status === "paid") return; // idempotent

  const { error } = await supabase
    .from("bookings")
    .update({ payment_status: "paid" })
    .eq("id", bookingId);
  if (error) { console.error("Booking update failed:", error); return; }

  const pointsEarned = Math.floor(Number(booking.price || 0) / 1000);
  if (pointsEarned > 0 && booking.user_id) {
    await supabase.rpc("increment_loyalty_points", { uid: booking.user_id, pts: pointsEarned });
  }

  if (booking.user_id) {
    const { data: userRow } = await supabase
      .from("users").select("email, full_name").eq("id", booking.user_id).single();
    if (userRow?.email) {
      const startDate = new Date(booking.start_time);
      await sendEmail(supabase, "payment_confirmed", {
        to: userRow.email,
        name: userRow.full_name || booking.customer_name,
        date: startDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
        time: startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        duration: booking.duration >= 60 ? "1 heure" : "15 min",
        amount: String(booking.price),
      });
    }
  }
}

async function activateMembership(supabase: ReturnType<typeof createClient>, userId: string) {
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("users")
    .update({ is_member: true, member_expiry: expiry, membership_pending: false })
    .eq("id", userId);
  if (error) { console.error("Membership activation failed:", error); return; }

  const { data: userRow } = await supabase
    .from("users").select("email, full_name").eq("id", userId).single();
  if (userRow?.email) {
    await sendEmail(supabase, "membership_activated", {
      to: userRow.email,
      name: userRow.full_name || "Membre",
    });
  }
}

async function confirmEvent(supabase: ReturnType<typeof createClient>, eventId: string) {
  const { error } = await supabase
    .from("event_bookings")
    .update({ status: "confirmed", payment_status: "paid" })
    .eq("id", eventId);
  if (error) console.error("Event confirmation failed:", error);
}

serve(async (req) => {
  // PayDunya POSTs a form-encoded or JSON body with the invoice token
  let invoiceToken: string | null = null;

  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      invoiceToken = body.data?.invoice?.token || body.token || null;
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      invoiceToken = params.get("data[invoice][token]") || params.get("token") || null;
    }
  } catch (_) {
    return new Response("Bad request", { status: 400 });
  }

  if (!invoiceToken) return new Response("No token", { status: 400 });

  // Verify payment status with PayDunya — never trust the callback body alone
  const verifyRes = await fetch(`${BASE_URL}/checkout-invoice/confirm/${invoiceToken}`, {
    headers: {
      "PAYDUNYA-MASTER-KEY": MASTER_KEY,
      "PAYDUNYA-PRIVATE-KEY": PRIVATE_KEY,
      "PAYDUNYA-TOKEN": TOKEN,
    },
  });
  const invoice = await verifyRes.json();

  if (invoice.status !== "completed") {
    console.log("Invoice not completed:", invoice.status, invoiceToken);
    return new Response("Not completed", { status: 200 });
  }

  const custom = invoice.custom_data || {};
  const type = custom.type || (custom.booking_id ? "booking" : null);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  if (type === "booking" && custom.booking_id) {
    await confirmBooking(supabase, custom.booking_id);
  } else if (type === "membership" && custom.user_id) {
    await activateMembership(supabase, custom.user_id);
  } else if (type === "event" && custom.event_id) {
    await confirmEvent(supabase, custom.event_id);
  } else {
    console.error("Unknown payment type in custom_data:", JSON.stringify(custom));
  }

  return new Response("OK", { status: 200 });
});
