import { supabase } from "./supabase";

async function sendEmail(template, data) {
  try {
    await supabase.functions.invoke("send-email", { body: { template, data } });
  } catch (_) {
    // Non-blocking — email failure should never break the main flow
  }
}

export function emailWelcome(user) {
  if (!user?.email) return;
  sendEmail("welcome", { to: user.email, name: user.name });
}

export function emailBookingConfirmed(user, booking) {
  if (!user?.email) return;
  sendEmail("booking_confirmed", {
    to: user.email,
    name: user.name,
    date: booking.dateStr,
    time: booking.time,
    duration: booking.durationLabel,
    amount: booking.amount,
  });
}

export function emailPaymentConfirmed(user, booking) {
  if (!user?.email) return;
  sendEmail("payment_confirmed", {
    to: user.email,
    name: user.name,
    date: booking.dateStr,
    time: booking.time,
    duration: booking.durationLabel,
    amount: booking.amount,
  });
}

export function emailMembershipActivated(user) {
  if (!user?.email) return;
  sendEmail("membership_activated", {
    to: user.email,
    name: user.name,
  });
}
