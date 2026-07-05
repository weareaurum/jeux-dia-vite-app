import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Jeux Dia VR <noreply@jeuxdia.com>";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function bookingConfirmedHtml(data: Record<string, string>) {
  return `
<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px">
  <h1 style="color:#00f5d4;margin-top:0">Jeux Dia VR 🎮</h1>
  <h2 style="margin-top:0">Réservation confirmée !</h2>
  <p>Bonjour <strong>${data.name}</strong>,</p>
  <p>Votre réservation a bien été enregistrée.</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0">
    <tr><td style="padding:8px;color:#94a3b8">Date</td><td style="padding:8px;font-weight:700">${data.date}</td></tr>
    <tr><td style="padding:8px;color:#94a3b8">Heure</td><td style="padding:8px;font-weight:700">${data.time}</td></tr>
    <tr><td style="padding:8px;color:#94a3b8">Durée</td><td style="padding:8px;font-weight:700">${data.duration}</td></tr>
    <tr><td style="padding:8px;color:#94a3b8">Montant</td><td style="padding:8px;font-weight:700;color:#fcd34d">${Number(data.amount || 0).toLocaleString()} CFA</td></tr>
  </table>
  <p style="color:#94a3b8;font-size:13px">Présentez-vous 5 minutes avant votre créneau. Paiement via Mixx au +228 93 69 54 63.</p>
  <p style="margin-top:32px;color:#475569;font-size:12px">Jeux Dia VR · Lomé, Togo · <a href="https://jeuxdia.com" style="color:#00f5d4">jeuxdia.com</a></p>
</div>`;
}

function paymentConfirmedHtml(data: Record<string, string>) {
  return `
<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px">
  <h1 style="color:#00f5d4;margin-top:0">Jeux Dia VR 🎮</h1>
  <h2 style="margin-top:0">Paiement confirmé ✅</h2>
  <p>Bonjour <strong>${data.name}</strong>,</p>
  <p>Votre paiement a été vérifié. Votre session est confirmée !</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0">
    <tr><td style="padding:8px;color:#94a3b8">Date</td><td style="padding:8px;font-weight:700">${data.date}</td></tr>
    <tr><td style="padding:8px;color:#94a3b8">Heure</td><td style="padding:8px;font-weight:700">${data.time}</td></tr>
    <tr><td style="padding:8px;color:#94a3b8">Durée</td><td style="padding:8px;font-weight:700">${data.duration}</td></tr>
    <tr><td style="padding:8px;color:#94a3b8">Montant payé</td><td style="padding:8px;font-weight:700;color:#86efac">${Number(data.amount || 0).toLocaleString()} CFA</td></tr>
  </table>
  <p style="color:#94a3b8;font-size:13px">À bientôt chez Jeux Dia VR !</p>
  <p style="margin-top:32px;color:#475569;font-size:12px">Jeux Dia VR · Lomé, Togo · <a href="https://jeuxdia.com" style="color:#00f5d4">jeuxdia.com</a></p>
</div>`;
}

function membershipActivatedHtml(data: Record<string, string>) {
  return `
<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px">
  <h1 style="color:#00f5d4;margin-top:0">Jeux Dia VR 🎮</h1>
  <h2 style="margin-top:0;color:#a78bfa">Pass Membre activé 💜</h2>
  <p>Bonjour <strong>${data.name}</strong>,</p>
  <p>Votre <strong>Pass Membre 30 jours</strong> est maintenant actif. Profitez de sessions illimitées !</p>
  <ul style="color:#94a3b8;font-size:14px;line-height:1.8">
    <li>Sessions VR illimitées pendant 30 jours</li>
    <li>Possibilité d'inviter des accompagnants</li>
    <li>Points de fidélité sur chaque session</li>
  </ul>
  <p style="margin-top:32px;color:#475569;font-size:12px">Jeux Dia VR · Lomé, Togo · <a href="https://jeuxdia.com" style="color:#00f5d4">jeuxdia.com</a></p>
</div>`;
}

function welcomeHtml(data: Record<string, string>) {
  return `
<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px">
  <h1 style="color:#00f5d4;margin-top:0">Jeux Dia VR 🎮</h1>
  <h2 style="margin-top:0">Bienvenue, ${data.name} !</h2>
  <p>Votre compte a été créé avec succès. Vous pouvez maintenant réserver vos sessions VR en ligne.</p>
  <div style="background:rgba(0,245,212,0.07);border:1px solid rgba(0,245,212,0.3);border-radius:10px;padding:16px;margin:20px 0">
    <p style="margin:0 0 8px;font-weight:700;color:#00f5d4">Ce que vous pouvez faire :</p>
    <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:1.9">
      <li>Réserver une session VR (15 min ou 1 heure)</li>
      <li>S'inscrire aux tournois</li>
      <li>Activer le Pass Membre (30 jours illimités)</li>
      <li>Cumuler des points de fidélité</li>
    </ul>
  </div>
  <a href="https://jeuxdia.com" style="display:inline-block;background:#00f5d4;color:#000;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;margin-top:8px">Réserver maintenant</a>
  <p style="margin-top:32px;color:#475569;font-size:12px">Jeux Dia VR · Lomé, Togo · <a href="https://jeuxdia.com" style="color:#00f5d4">jeuxdia.com</a></p>
</div>`;
}

const TEMPLATES: Record<string, (d: Record<string, string>) => string> = {
  welcome: welcomeHtml,
  booking_confirmed: bookingConfirmedHtml,
  payment_confirmed: paymentConfirmedHtml,
  membership_activated: membershipActivatedHtml,
};

const SUBJECTS: Record<string, string> = {
  welcome: "Bienvenue chez Jeux Dia VR 🎮",
  booking_confirmed: "Réservation confirmée — Jeux Dia VR",
  payment_confirmed: "Paiement confirmé — Jeux Dia VR",
  membership_activated: "Votre Pass Membre est actif — Jeux Dia VR",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!RESEND_API_KEY) return new Response("RESEND_API_KEY not set", { status: 500, headers: CORS });

  try {
    const { template, data } = await req.json();
    const html = TEMPLATES[template]?.(data);
    if (!html || !data?.to) return new Response("Bad request", { status: 400, headers: CORS });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: data.to, subject: SUBJECTS[template], html }),
    });

    const result = await res.json();
    return new Response(JSON.stringify(result), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
});
