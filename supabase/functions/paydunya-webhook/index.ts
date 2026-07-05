import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MASTER_KEY  = Deno.env.get("PAYDUNYA_MASTER_KEY")!;
const PRIVATE_KEY = Deno.env.get("PAYDUNYA_PRIVATE_KEY")!;
const TOKEN       = Deno.env.get("PAYDUNYA_TOKEN")!;
const MODE        = Deno.env.get("PAYDUNYA_MODE") || "live";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY       = Deno.env.get("RESEND_API_KEY");

const BASE_URL = MODE === "test"
  ? "https://app.paydunya.com/sandbox-api/v1"
  : "https://app.paydunya.com/api/v1";

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

  if (!invoiceToken) {
    return new Response("No token", { status: 400 });
  }

  // Verify payment status with PayDunya
  const verifyRes = await fetch(`${BASE_URL}/checkout-invoice/confirm/${invoiceToken}`, {
    headers: {
      "PAYDUNYA-MASTER-KEY": MASTER_KEY,
      "PAYDUNYA-PRIVATE-KEY": PRIVATE_KEY,
      "PAYDUNYA-TOKEN": TOKEN,
    },
  });

  const invoice = await verifyRes.json();

  if (invoice.status !== "completed") {
    console.log("PayDunya invoice not completed:", invoice.status, invoiceToken);
    return new Response("Not completed", { status: 200 });
  }

  const bookingId = invoice.custom_data?.booking_id;
  if (!bookingId) {
    console.error("No booking_id in custom_data for token", invoiceToken);
    return new Response("No booking_id", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Fetch booking to get user info for email + loyalty points
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, user_id, price, payment_status, customer_name, phone, start_time, duration")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    console.error("Booking not found:", bookingId);
    return new Response("Booking not found", { status: 200 });
  }

  // Idempotency — skip if already paid
  if (booking.payment_status === "paid") {
    return new Response("Already paid", { status: 200 });
  }

  // Mark as paid
  const { error } = await supabase
    .from("bookings")
    .update({ payment_status: "paid" })
    .eq("id", bookingId);

  if (error) {
    console.error("Failed to update booking:", error);
    return new Response("DB error", { status: 500 });
  }

  // Award loyalty points (1 pt per 100 CFA)
  const pointsEarned = Math.floor(Number(booking.price || 0) / 1000);
  if (pointsEarned > 0 && booking.user_id) {
    await supabase.rpc("increment_loyalty_points", { uid: booking.user_id, pts: pointsEarned });
  }

  // Send payment confirmed email
  if (RESEND_API_KEY && booking.user_id) {
    try {
      const { data: userRow } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("id", booking.user_id)
        .single();

      if (userRow?.email) {
        const startDate = new Date(booking.start_time);
        const dateStr = startDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
        const timeStr = startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        const durationLabel = booking.duration >= 60 ? "1 heure" : "15 min";

        await supabase.functions.invoke("send-email", {
          body: {
            template: "payment_confirmed",
            data: {
              to: userRow.email,
              name: userRow.full_name || booking.customer_name,
              date: dateStr,
              time: timeStr,
              duration: durationLabel,
              amount: String(booking.price),
            },
          },
        });
      }
    } catch (emailErr) {
      console.error("Email send failed (non-fatal):", emailErr);
    }
  }

  return new Response("OK", { status: 200 });
});
