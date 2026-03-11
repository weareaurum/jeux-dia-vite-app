import { useState, useMemo, useCallback } from "react";

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:       #050810;
      --surface:  #0d1220;
      --card:     #111827;
      --border:   #1e2d45;
      --accent:   #00f5d4;
      --accent2:  #7c3aed;
      --accent3:  #f59e0b;
      --text:     #e2e8f0;
      --muted:    #64748b;
      --danger:   #ef4444;
      --success:  #10b981;
      --glow:     0 0 20px rgba(0,245,212,0.25);
      --glow2:    0 0 20px rgba(124,58,237,0.25);
    }

    html, body { height: 100%; }

    body {
      font-family: 'Syne', sans-serif;
      background: var(--bg);
      color: var(--text);
      overflow-x: hidden;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--accent2); border-radius: 2px; }

    .orbitron { font-family: 'Orbitron', monospace; }
    .mono { font-family: 'JetBrains Mono', monospace; }

    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 10px rgba(0,245,212,0.3); }
      50%       { box-shadow: 0 0 30px rgba(0,245,212,0.6); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-6px); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

    .fade-in { animation: fadeIn 0.4s ease forwards; }

    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer;
      font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
      transition: all 0.2s; letter-spacing: 0.03em;
    }
    .btn-primary { background: var(--accent); color: #000; }
    .btn-primary:hover { filter: brightness(1.15); transform: translateY(-1px); box-shadow: var(--glow); }
    .btn-ghost { background: transparent; color: var(--accent); border: 1px solid var(--accent); }
    .btn-ghost:hover { background: rgba(0,245,212,0.1); }
    .btn-danger { background: var(--danger); color: #fff; }
    .btn-amber { background: var(--accent3); color: #000; }
    .btn-purple { background: var(--accent2); color: #fff; }
    .btn-purple:hover { filter: brightness(1.15); box-shadow: var(--glow2); }
    .btn-sm { padding: 8px 16px; font-size: 12px; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
    }

    .tag {
      display: inline-block; padding: 2px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 600; letter-spacing: 0.05em; font-family: 'JetBrains Mono';
    }
    .tag-green  { background: rgba(16,185,129,0.15); color: var(--success); border: 1px solid rgba(16,185,129,0.3); }
    .tag-amber  { background: rgba(245,158,11,0.15); color: var(--accent3); border: 1px solid rgba(245,158,11,0.3); }
    .tag-purple { background: rgba(124,58,237,0.15); color: #a78bfa; border: 1px solid rgba(124,58,237,0.3); }
    .tag-red    { background: rgba(239,68,68,0.15); color: var(--danger); border: 1px solid rgba(239,68,68,0.3); }
    .tag-cyan   { background: rgba(0,245,212,0.1); color: var(--accent); border: 1px solid rgba(0,245,212,0.3); }

    input, select, textarea {
      background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
      color: var(--text); padding: 10px 14px; font-family: 'Syne', sans-serif;
      font-size: 14px; width: 100%; outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input:focus, select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,245,212,0.1); }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 640px) {
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
    }

    .scanlines::after {
      content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
    }

    .noise {
      position: fixed; inset: 0; pointer-events: none; z-index: 9998; opacity: 0.025;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(5,8,16,0.85); backdrop-filter: blur(8px);
      z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .modal { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 32px; max-width: 480px; width: 100%; animation: fadeIn 0.3s ease; position: relative; }

    .toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 2000; display: flex; flex-direction: column; gap: 10px; }
    .toast { padding: 14px 20px; border-radius: 10px; font-size: 14px; font-weight: 500; animation: fadeIn 0.3s ease; min-width: 260px; display: flex; align-items: center; gap: 10px; }
    .toast-success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); color: #6ee7b7; }
    .toast-error   { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); color: #fca5a5; }
    .toast-info    { background: rgba(0,245,212,0.1); border: 1px solid rgba(0,245,212,0.3); color: var(--accent); }

    .nav { display: flex; align-items: center; gap: 4px; }
    .nav-item { padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; color: var(--muted); letter-spacing: 0.03em; }
    .nav-item.active { color: var(--accent); background: rgba(0,245,212,0.08); }
    .nav-item:hover:not(.active) { color: var(--text); background: var(--surface); }

    .slot { border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; font-size: 12px; font-family: 'JetBrains Mono'; }
    .slot-available { background: rgba(0,245,212,0.06); border-color: rgba(0,245,212,0.2); color: var(--accent); }
    .slot-available:hover { background: rgba(0,245,212,0.15); border-color: var(--accent); transform: scale(1.02); }
    .slot-booked { background: rgba(124,58,237,0.1); border-color: rgba(124,58,237,0.25); color: #a78bfa; cursor: default; }
    .slot-blocked { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.2); color: #f87171; cursor: default; }
    .slot-selected { background: rgba(0,245,212,0.2); border-color: var(--accent); box-shadow: var(--glow); color: var(--accent); }
    .slot-buffer { background: rgba(100,116,139,0.06); border-color: rgba(100,116,139,0.15); color: var(--muted); cursor: default; font-size: 10px; }

    .stat-card { position: relative; overflow: hidden; }
    .stat-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%); pointer-events: none; }

    .qr-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; }
    .qr-cell { aspect-ratio: 1; border-radius: 1px; }

    .progress-bar { height: 6px; border-radius: 3px; background: var(--border); overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width 0.5s ease; }

    .cyber-corner { position: relative; }
    .cyber-corner::before, .cyber-corner::after {
      content: ''; position: absolute; width: 12px; height: 12px;
    }
    .cyber-corner::before { top: 0; left: 0; border-top: 2px solid var(--accent); border-left: 2px solid var(--accent); }
    .cyber-corner::after  { bottom: 0; right: 0; border-bottom: 2px solid var(--accent); border-right: 2px solid var(--accent); }
  `}</style>
);

const TIME_SLOTS = [
  "09:00","09:20","09:40","10:00","10:20","10:40","11:00","11:20","11:40",
  "12:00","12:20","12:40","13:00","13:20","13:40","14:00","14:20","14:40",
  "15:00","15:20","15:40","16:00","16:20","16:40","17:00","17:20","17:40",
  "18:00","18:20","18:40","19:00","19:20","19:40","20:00"
];

const DURATIONS = [
  { label: "15 min", minutes: 15, slots: 1, price: 1000 },
  { label: "1 heure", minutes: 60, slots: 4, price: 3000 }
];

const DAYS = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function formatCFA(n) { return n.toLocaleString("fr-FR") + " CFA"; }

function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function generateQRFromCode(code = "") {
  const cells = [];
  let seed = 0;
  for (let i = 0; i < code.length; i++) seed += code.charCodeAt(i);
  for (let i = 0; i < 100; i++) {
    cells.push(((seed * (i + 3) + i * 17) % 2) === 0 ? 1 : 0);
  }
  return cells;
}

function getWeekDates(offset = 0) {
  const today = new Date();
  const currentDay = today.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + diffToMonday + offset * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function slotKey(date, time) {
  return `${toLocalDateStr(date)}_${time}`;
}

function bookingSlotKeyFromParts(dateStr, time) {
  return `${dateStr}_${time}`;
}

function getSlotsForDuration(startTime, slotsNeeded) {
  const startIdx = TIME_SLOTS.indexOf(startTime);
  if (startIdx === -1) return [];
  return TIME_SLOTS.slice(startIdx, startIdx + slotsNeeded);
}

function canBookSlots(bookings, dateStr, startTime, slotsNeeded) {
  const requiredSlots = getSlotsForDuration(startTime, slotsNeeded);
  if (requiredSlots.length !== slotsNeeded) return false;

  return requiredSlots.every((time) => {
    const existing = bookings.find(
      (b) => b.dateStr === dateStr && b.time === time && b.type !== "buffer"
    );
    return !existing;
  });
}

function getSlotStatusForDay(bookings, dateStr, time) {
  const entry = bookings.find((b) => b.dateStr === dateStr && b.time === time);
  if (!entry) return "available";
  if (entry.type === "blocked") return "blocked";
  if (entry.type === "buffer") return "buffer";
  return "booked";
}

const TODAY = new Date();
const todayStr = toLocalDateStr(TODAY);

const INITIAL_BOOKINGS = [
  { id: "b1_0", slotKey: `${todayStr}_10:00`, dateStr: todayStr, time: "10:00", duration: "1 heure", name: "Koffi A.", phone: "+228 90 11 22 33", type: "member", status: "confirmed", amount: 0, isPrimary: true, confirmCode: "JD-DEMO01" },
  { id: "b1_1", slotKey: `${todayStr}_10:20`, dateStr: todayStr, time: "10:20", duration: "1 heure", name: "Koffi A.", phone: "+228 90 11 22 33", type: "member", status: "confirmed", amount: 0, isPrimary: false, confirmCode: "JD-DEMO01" },
  { id: "b1_2", slotKey: `${todayStr}_10:40`, dateStr: todayStr, time: "10:40", duration: "1 heure", name: "Koffi A.", phone: "+228 90 11 22 33", type: "member", status: "confirmed", amount: 0, isPrimary: false, confirmCode: "JD-DEMO01" },
  { id: "b1_3", slotKey: `${todayStr}_11:00`, dateStr: todayStr, time: "11:00", duration: "1 heure", name: "Koffi A.", phone: "+228 90 11 22 33", type: "member", status: "confirmed", amount: 0, isPrimary: false, confirmCode: "JD-DEMO01" },
  { id: "b1_buf", slotKey: `${todayStr}_11:20`, dateStr: todayStr, time: "11:20", duration: "buffer", name: null, type: "buffer", status: "buffer", amount: 0 },
  { id: "b4", slotKey: `${todayStr}_13:00`, dateStr: todayStr, time: "13:00", duration: "15 min", name: "Ami D.", phone: "+228 91 44 55 66", type: "casual", status: "confirmed", amount: 1000, isPrimary: true, confirmCode: "JD-DEMO02" },
  { id: "b5", slotKey: `${todayStr}_14:40`, dateStr: todayStr, time: "14:40", duration: null, name: null, type: "blocked", status: "blocked", amount: 0, reason: "Maintenance" },
];

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, var(--accent2), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", animation: "float 3s ease-in-out infinite" }}>
        <span style={{ fontSize: 20 }}>🥽</span>
      </div>
      <div>
        <div className="orbitron" style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.05em", lineHeight: 1 }}>
          JEUX<span style={{ color: "var(--accent)" }}>DIA</span>
        </div>
        <div className="mono" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em" }}>VR LOUNGE · LOMÉ</div>
      </div>
    </div>
  );
}

function QRCode({ code }) {
  const cells = useMemo(() => generateQRFromCode(code), [code]);
  return (
    <div style={{ padding: 16, background: "#fff", borderRadius: 8, display: "inline-block" }}>
      <div className="qr-grid" style={{ width: 120, height: 120 }}>
        {cells.map((c, i) => (
          <div key={i} className="qr-cell" style={{ background: c ? "#000" : "#fff" }} />
        ))}
      </div>
    </div>
  );
}

function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✗" : "ℹ"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function PaymentModal({ booking, onSuccess, onClose, isMember }) {
  const [step, setStep] = useState("method");
  const [method, setMethod] = useState(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmCode, setConfirmCode] = useState(null);

  const amount = booking.amount;

  async function pay() {
    if (!phone.match(/^\+?[0-9\s]{8,}$/)) return;
    setLoading(true);
    setStep("processing");
    await new Promise((r) => setTimeout(r, 1800));
    const code = "JD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setConfirmCode(code);
    setStep("done");
    setLoading(false);
  }

  if (isMember) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2 className="orbitron" style={{ fontSize: 18, marginBottom: 8, color: "var(--accent)" }}>Réservation Membre</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
            En tant que membre actif, votre réservation est <strong style={{ color: "var(--success)" }}>gratuite</strong>.
          </p>
          <div className="card" style={{ marginBottom: 24, background: "var(--surface)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Créneau</span>
              <span className="mono" style={{ fontSize: 13, color: "var(--accent)" }}>{booking.time}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Durée</span>
              <span style={{ fontSize: 13 }}>{booking.duration}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Montant</span>
              <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 700 }}>0 CFA ✦ MEMBRE</span>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => onSuccess("MEMBER-FREE")}>
            Confirmer la réservation →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {step !== "done" && (
          <>
            <h2 className="orbitron" style={{ fontSize: 18, marginBottom: 4, color: "var(--accent)" }}>
              {booking.isMembership ? "Activer Membership" : "Payer la session"}
            </h2>
            <p className="mono" style={{ color: "var(--muted)", fontSize: 12, marginBottom: 24 }}>
              MONTANT : <span style={{ color: "var(--accent3)", fontWeight: 700 }}>{formatCFA(amount)}</span>
              {booking.time && <> · {booking.time} · {booking.duration}</>}
            </p>
          </>
        )}

        {step === "method" && (
          <div className="fade-in">
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>Choisissez votre opérateur Mobile Money :</p>
            <div className="grid-2" style={{ marginBottom: 24 }}>
              {["T-Money", "Flooz"].map((m) => (
                <div
                  key={m}
                  onClick={() => {
                    setMethod(m);
                    setStep("phone");
                  }}
                  style={{ border: `1px solid ${method === m ? "var(--accent)" : "var(--border)"}`, borderRadius: 10, padding: 20, cursor: "pointer", textAlign: "center", transition: "all 0.2s", background: method === m ? "rgba(0,245,212,0.08)" : "var(--surface)" }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{m === "T-Money" ? "🔵" : "🟠"}</div>
                  <div className="orbitron" style={{ fontSize: 14, fontWeight: 700 }}>{m}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{m === "T-Money" ? "Togocel" : "Moov Africa"}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
              Powered by <span style={{ color: "var(--accent)" }}>FedaPay</span> / <span style={{ color: "var(--accent)" }}>PayGate.tg</span>
            </p>
          </div>
        )}

        {step === "phone" && (
          <div className="fade-in">
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 8 }}>Numéro {method} :</p>
            <input placeholder="+228 90 XX XX XX" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ marginBottom: 20, fontSize: 16 }} />
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20, padding: 12, background: "var(--surface)", borderRadius: 8 }}>
              Vous recevrez une demande de paiement de <strong style={{ color: "var(--accent3)" }}>{formatCFA(amount)}</strong> sur le numéro saisi. Confirmez sur votre téléphone.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => setStep("method")} style={{ flex: 1 }}>← Retour</button>
              <button className="btn btn-primary" onClick={pay} style={{ flex: 2 }} disabled={phone.length < 8 || loading}>
                Envoyer la demande →
              </button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="fade-in" style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: 60, height: 60, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
            <p className="orbitron" style={{ color: "var(--accent)", marginBottom: 8 }}>TRAITEMENT EN COURS</p>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Attente de confirmation {method}...</p>
            <p className="mono" style={{ color: "var(--muted)", fontSize: 11, marginTop: 8, animation: "blink 1.5s ease infinite" }}>NE PAS FERMER CETTE FENÊTRE</p>
          </div>
        )}

        {step === "done" && (
          <div className="fade-in" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 className="orbitron" style={{ fontSize: 18, color: "var(--success)", marginBottom: 8 }}>PAIEMENT CONFIRMÉ</h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>
              {booking.isMembership ? "Votre membership de 30 jours est activé !" : "Votre session est réservée !"}
            </p>
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
              <QRCode code={confirmCode} />
            </div>
            <p className="mono" style={{ fontSize: 12, color: "var(--accent)", marginBottom: 4 }}>CODE DE RÉSERVATION</p>
            <p className="orbitron" style={{ fontSize: 20, fontWeight: 900, letterSpacing: "0.15em", marginBottom: 24 }}>{confirmCode}</p>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>
              Présentez ce QR code à l'accueil. Une confirmation WhatsApp vous sera envoyée.
            </p>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => onSuccess(confirmCode)}>
              Terminé ✓
            </button>
          </div>
        )}

        {step !== "processing" && step !== "done" && (
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
        )}
      </div>
    </div>
  );
}

function BlockModal({ slot, onClose, onBlock }) {
  const [reason, setReason] = useState("Maintenance");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="orbitron" style={{ fontSize: 16, marginBottom: 16, color: "var(--danger)" }}>Bloquer ce créneau</h2>
        <p className="mono" style={{ color: "var(--accent)", marginBottom: 16, fontSize: 13 }}>{slot.time} — {slot.dateStr}</p>
        <label style={{ color: "var(--muted)", fontSize: 13, display: "block", marginBottom: 6 }}>Raison :</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ marginBottom: 20 }}>
          <option>Maintenance</option>
          <option>Client walk-in cash</option>
          <option>Nettoyage</option>
          <option>Événement privé</option>
        </select>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
          <button className="btn btn-danger" onClick={() => onBlock(reason)} style={{ flex: 1 }}>Bloquer ✗</button>
        </div>
      </div>
    </div>
  );
}

function AuthModal({ mode, onClose, onLogin, onRegister }) {
  const [tab, setTab] = useState(mode || "login");
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <Logo />
        <div style={{ display: "flex", gap: 0, marginTop: 24, marginBottom: 24, borderBottom: "1px solid var(--border)" }}>
          {["login", "register"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ flex: 1, padding: "10px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Syne", borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent", color: tab === t ? "var(--accent)" : "var(--muted)", letterSpacing: "0.05em" }}
            >
              {t === "login" ? "CONNEXION" : "INSCRIPTION"}
            </button>
          ))}
        </div>

        {tab === "login" ? (
          <div className="fade-in">
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "var(--muted)", fontSize: 12, display: "block", marginBottom: 6 }}>TÉLÉPHONE</label>
              <input placeholder="+228 90 XX XX XX" value={form.phone} onChange={upd("phone")} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: "var(--muted)", fontSize: 12, display: "block", marginBottom: 6 }}>MOT DE PASSE</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={upd("password")} />
            </div>
            <button className="btn btn-primary" style={{ width: "100%", marginBottom: 12 }} onClick={() => onLogin(form)}>Se connecter →</button>
            <button className="btn btn-ghost" style={{ width: "100%", fontSize: 12 }} onClick={() => onLogin({ ...form, isAdmin: true, name: "Admin Jeux Dia" })}>
              🔑 Connexion Admin (démo)
            </button>
          </div>
        ) : (
          <div className="fade-in">
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "var(--muted)", fontSize: 12, display: "block", marginBottom: 6 }}>NOM COMPLET</label>
              <input placeholder="Ex: Koffi Amega" value={form.name} onChange={upd("name")} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "var(--muted)", fontSize: 12, display: "block", marginBottom: 6 }}>TÉLÉPHONE</label>
              <input placeholder="+228 90 XX XX XX" value={form.phone} onChange={upd("phone")} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: "var(--muted)", fontSize: 12, display: "block", marginBottom: 6 }}>MOT DE PASSE</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={upd("password")} />
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => onRegister(form)}>
              Créer mon compte →
            </button>
          </div>
        )}
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
      </div>
    </div>
  );
}

function CalendarView({ user, bookings, onBook, onBlock, addToast }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0]);
  const [bookingModal, setBookingModal] = useState(false);

  const weekDates = getWeekDates(weekOffset);
  const isAdmin = user?.isAdmin;
  const isMember = user?.memberStatus === "active";
  const dateStr = toLocalDateStr(selectedDate);
  const dayBookings = bookings.filter((b) => b.dateStr === dateStr);

  const getSlotStatus = (time) => getSlotStatusForDay(bookings, dateStr, time);

  const handleSlotClick = (time) => {
    const status = getSlotStatus(time);

    if (isAdmin) {
      if (status === "available") {
        onBlock({ time, dateStr, slotKey: bookingSlotKeyFromParts(dateStr, time) });
      }
      return;
    }

    if (status !== "available") return;

    const allowed = canBookSlots(bookings, dateStr, time, selectedDuration.slots);
    if (!allowed) {
      addToast(`Impossible de réserver ${selectedDuration.label} à ${time}. Des créneaux sont déjà occupés.`, "error");
      return;
    }

    setSelectedSlot(time);
    setBookingModal(true);
  };

  const getSlotInfo = (time) => dayBookings.find((b) => b.time === time);

  return (
    <div className="fade-in">
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset((w) => w - 1)}>← Semaine précédente</button>
          <span className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>
            {MONTHS[weekDates[0].getMonth()]} {weekDates[0].getFullYear()}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset((w) => w + 1)}>Semaine suivante →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {weekDates.map((d, i) => {
            const active = d.toDateString() === selectedDate.toDateString();
            const isToday = d.toDateString() === new Date().toDateString();
            const compare = new Date(d);
            compare.setHours(0, 0, 0, 0);
            const nowDay = new Date();
            nowDay.setHours(0, 0, 0, 0);
            const isPast = compare < nowDay;
            return (
              <div
                key={i}
                onClick={() => !isPast && setSelectedDate(new Date(d))}
                style={{ textAlign: "center", padding: "10px 4px", borderRadius: 8, cursor: isPast ? "default" : "pointer", background: active ? "rgba(0,245,212,0.12)" : "transparent", border: active ? "1px solid var(--accent)" : "1px solid transparent", opacity: isPast ? 0.35 : 1, transition: "all 0.15s" }}
              >
                <div style={{ fontSize: 10, color: active ? "var(--accent)" : "var(--muted)", marginBottom: 4, letterSpacing: "0.05em" }}>{DAYS[d.getDay()]}</div>
                <div className="orbitron" style={{ fontSize: 15, fontWeight: 700, color: active ? "var(--accent)" : isToday ? "var(--accent3)" : "var(--text)" }}>{d.getDate()}</div>
                {isToday && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent3)", margin: "4px auto 0" }} />}
              </div>
            );
          })}
        </div>
      </div>

      {!isAdmin && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {DURATIONS.map((d) => (
            <div
              key={d.label}
              onClick={() => setSelectedDuration(d)}
              style={{ flex: 1, padding: "14px", borderRadius: 10, cursor: "pointer", border: `1px solid ${selectedDuration.label === d.label ? "var(--accent)" : "var(--border)"}`, background: selectedDuration.label === d.label ? "rgba(0,245,212,0.08)" : "var(--card)", textAlign: "center", transition: "all 0.2s" }}
            >
              <div className="orbitron" style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{d.label}</div>
              <div style={{ fontSize: 13, color: isMember ? "var(--success)" : "var(--accent3)", fontWeight: 700 }}>
                {isMember ? "0 CFA ✦" : formatCFA(d.price)}
              </div>
            </div>
          ))}
        </div>
      )}

      {isMember && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span>🏆</span>
          <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 600 }}>
            Membre Actif — Sessions gratuites pendant encore <strong>{user.daysLeft}</strong> jour{user.daysLeft > 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 className="orbitron" style={{ fontSize: 14, fontWeight: 700 }}>
            Créneaux — {DAYS[selectedDate.getDay()]} {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}
          </h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="tag tag-cyan">Disponible</span>
            <span className="tag tag-purple">Réservé</span>
            <span className="tag tag-red">Bloqué</span>
          </div>
        </div>

        {isAdmin && (
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16, padding: "8px 12px", background: "var(--surface)", borderRadius: 6 }}>
            ⚡ Mode Admin : cliquez sur un créneau disponible pour le bloquer
          </p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {TIME_SLOTS.map((time) => {
            const status = getSlotStatus(time);
            const info = getSlotInfo(time);
            const isSelected = selectedSlot === time;
            const cls = isSelected ? "slot slot-selected" : `slot slot-${status}`;
            return (
              <div
                key={time}
                className={cls}
                onClick={() => handleSlotClick(time)}
                title={info?.name ? `${info.name}${info.reason ? " — " + info.reason : ""}` : undefined}
                style={{ position: "relative", userSelect: "none" }}
              >
                {status === "buffer" ? (
                  <span style={{ fontSize: 9, letterSpacing: "0.05em" }}>~ buffer</span>
                ) : (
                  <>
                    <span>{time}</span>
                    {status === "booked" && info?.name && info?.isPrimary && (
                      <span style={{ display: "block", fontSize: 9, opacity: 0.7, marginTop: 2 }}>{info.name.split(" ")[0]}</span>
                    )}
                    {status === "blocked" && (
                      <span style={{ display: "block", fontSize: 9, opacity: 0.7, marginTop: 2 }}>{info?.reason}</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {bookingModal && selectedSlot && (
        <PaymentModal
          isMember={isMember}
          booking={{ time: selectedSlot, duration: selectedDuration.label, amount: isMember ? 0 : selectedDuration.price }}
          onClose={() => {
            setBookingModal(false);
            setSelectedSlot(null);
          }}
          onSuccess={(code) => {
            onBook({
              slotKey: bookingSlotKeyFromParts(dateStr, selectedSlot),
              dateStr,
              time: selectedSlot,
              duration: selectedDuration.label,
              name: user?.name || "Invité",
              phone: user?.phone || "",
              type: isMember ? "member" : "casual",
              status: "confirmed",
              amount: isMember ? 0 : selectedDuration.price,
              confirmCode: code,
              slots: selectedDuration.slots,
            });
            setBookingModal(false);
            setSelectedSlot(null);
          }}
        />
      )}
    </div>
  );
}

function MembershipPage({ user, onActivate, onRenew }) {
  const [payModal, setPayModal] = useState(false);
  const isActive = user?.memberStatus === "active";
  const isExpired = user?.memberStatus === "expired";
  const progress = isActive ? Math.min(100, (user.daysLeft / 30) * 100) : 0;

  return (
    <div className="fade-in">
      <div className="card cyber-corner" style={{ marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 150, height: 150, background: "radial-gradient(circle, rgba(0,245,212,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 className="orbitron" style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>
                PASS <span style={{ color: "var(--accent)" }}>MEMBRE</span>
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>Accès illimité pendant 30 jours</p>
            </div>
            {isActive && <span className="tag tag-green" style={{ fontSize: 13, padding: "6px 14px" }}>ACTIF</span>}
            {isExpired && <span className="tag tag-red" style={{ fontSize: 13, padding: "6px 14px" }}>EXPIRÉ</span>}
            {!user?.memberStatus && <span className="tag tag-amber" style={{ fontSize: 13, padding: "6px 14px" }}>GUEST</span>}
          </div>

          {isActive && (
            <>
              <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Expiration dans</span>
                <span className="mono" style={{ fontSize: 13, color: "var(--accent)" }}>{user.daysLeft} jour{user.daysLeft > 1 ? "s" : ""}</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: 20 }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>
                Expire le {new Date(user.memberExpiry).toLocaleDateString("fr-FR")}
              </p>
            </>
          )}

          {(isExpired || !user?.memberStatus) && (
            <div style={{ padding: "16px", background: "var(--surface)", borderRadius: 10, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Prix</span>
                <span className="orbitron" style={{ fontSize: 20, color: "var(--accent3)", fontWeight: 900 }}>10,000 CFA</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Durée</span>
                <span style={{ fontSize: 13 }}>30 jours</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Réservations</span>
                <span style={{ fontSize: 13, color: "var(--success)" }}>Illimitées · 0 CFA</span>
              </div>
            </div>
          )}

          {!user ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Connectez-vous pour activer un pass membre.</p>
          ) : (isExpired || !user?.memberStatus) ? (
            <button className="btn btn-purple" style={{ width: "100%", fontSize: 16, padding: "14px" }} onClick={() => setPayModal(true)}>
              {isExpired ? "Renouveler le Pass →" : "Activer le Pass Membre →"}
            </button>
          ) : (
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => setPayModal(true)}>
              Renouveler maintenant
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="orbitron" style={{ fontSize: 14, marginBottom: 16, color: "var(--accent)" }}>AVANTAGES MEMBRES</h3>
        {[
          ["🎮", "Sessions VR gratuites", "Réservez autant de créneaux que vous voulez à 0 CFA"],
          ["⚡", "Réservation instantanée", "Pas de paiement à chaque session, confirmez en 1 clic"],
          ["📅", "Priorité calendrier", "Accès en avant-première aux nouveaux créneaux"],
          ["🏆", "Statut Premium", "Insigne membre sur votre profil"],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ display: "flex", gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{title}</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {payModal && (
        <PaymentModal
          booking={{ amount: 10000, isMembership: true }}
          onClose={() => setPayModal(false)}
          onSuccess={(code) => {
            setPayModal(false);
            (isExpired ? onRenew : onActivate)(code);
          }}
        />
      )}
    </div>
  );
}

function AdminDashboard({ bookings, onUnblock }) {
  const todayBookings = bookings.filter((b) => b.dateStr === todayStr && b.status === "confirmed" && b.isPrimary !== false && b.type !== "membership");
  const bookingRevenue = bookings.filter((b) => b.status === "confirmed" && b.isPrimary !== false).reduce((s, b) => s + (b.amount || 0), 0);
  const tmoney = Math.round(bookingRevenue * 0.55);
  const flooz = bookingRevenue - tmoney;

  return (
    <div className="fade-in">
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: "Revenus Total", value: formatCFA(bookingRevenue), icon: "💰", color: "var(--accent3)" },
          { label: "Sessions aujourd'hui", value: todayBookings.length, icon: "🎮", color: "var(--accent)" },
          { label: "Via T-Money / Flooz", value: `${formatCFA(tmoney)} / ${formatCFA(flooz)}`, icon: "📱", color: "#a78bfa" },
        ].map((s) => (
          <div key={s.label} className="card stat-card">
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div className="orbitron" style={{ fontSize: s.value.toString().length > 10 ? 13 : 18, fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="orbitron" style={{ fontSize: 13, marginBottom: 16, color: "var(--accent)" }}>REVENUS PAR SOURCE</h3>
        {[
          { label: "T-Money (Togocel)", amount: tmoney, pct: bookingRevenue ? Math.round((tmoney / bookingRevenue) * 100) : 0, color: "#3b82f6" },
          { label: "Flooz (Moov Africa)", amount: flooz, pct: bookingRevenue ? Math.round((flooz / bookingRevenue) * 100) : 0, color: "#f97316" },
          { label: "Memberships (30j)", amount: bookings.filter((b) => b.type === "membership" && b.status === "confirmed").reduce((s, b) => s + (b.amount || 0), 0), pct: bookingRevenue ? Math.round((bookings.filter((b) => b.type === "membership" && b.status === "confirmed").reduce((s, b) => s + (b.amount || 0), 0) / bookingRevenue) * 100) : 0, color: "#a78bfa" },
        ].map((r) => (
          <div key={r.label} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>{r.label}</span>
              <span className="mono" style={{ fontSize: 13, color: r.color }}>{formatCFA(r.amount)}</span>
            </div>
            <div className="progress-bar">
              <div style={{ height: "100%", borderRadius: 3, background: r.color, width: `${Math.max(0, Math.min(100, r.pct))}%`, transition: "width 0.5s ease" }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="orbitron" style={{ fontSize: 13, marginBottom: 16, color: "var(--accent)" }}>
          RÉSERVATIONS DU JOUR — {todayStr}
        </h3>
        {bookings.filter((b) => b.dateStr === todayStr).length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Aucune réservation pour aujourd'hui</p>
        ) : (
          <div>
            {bookings
              .filter((b) => b.dateStr === todayStr)
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((b) => (
                <div key={b.id || b.slotKey} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                  <span className="mono" style={{ fontSize: 14, color: "var(--accent)", minWidth: 50 }}>{b.time}</span>
                  <div style={{ flex: 1 }}>
                    {b.type === "blocked" ? (
                      <div>
                        <span style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>⊘ BLOQUÉ</span>
                        <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{b.reason}</span>
                      </div>
                    ) : b.type === "buffer" ? (
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>~ Buffer nettoyage</span>
                    ) : b.type === "membership" ? (
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</span>
                        <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>Paiement membership</span>
                      </div>
                    ) : (
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</span>
                        <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{b.duration}</span>
                        {b.isPrimary === false && <span style={{ color: "var(--muted)", fontSize: 11, marginLeft: 8 }}>(suite)</span>}
                      </div>
                    )}
                  </div>
                  {b.type === "casual" && b.isPrimary !== false && <span className="tag tag-amber">CASUAL · {formatCFA(b.amount)}</span>}
                  {b.type === "member" && b.isPrimary !== false && <span className="tag tag-green">MEMBRE · 0 CFA</span>}
                  {b.type === "membership" && <span className="tag tag-purple">PASS · {formatCFA(b.amount)}</span>}
                  {b.type === "blocked" && <button className="btn btn-ghost btn-sm" onClick={() => onUnblock(b)}>Débloquer</button>}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfilePage({ user, bookings }) {
  const myBookings = bookings.filter((b) => b.phone === user?.phone && b.status === "confirmed" && b.type !== "membership" && b.isPrimary !== false);
  const isActive = user?.memberStatus === "active";

  return (
    <div className="fade-in">
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent2), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
            {user?.name?.charAt(0) || "?"}
          </div>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 18 }}>{user?.name || "Invité"}</h2>
            <p className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>{user?.phone || "—"}</p>
          </div>
          {isActive && <span className="tag tag-green" style={{ marginLeft: "auto" }}>MEMBRE ACTIF</span>}
        </div>

        {isActive && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Pass expire dans</span>
              <span className="mono" style={{ fontSize: 13, color: "var(--accent)" }}>{user.daysLeft} jours</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(user.daysLeft / 30) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="orbitron" style={{ fontSize: 13, marginBottom: 16, color: "var(--accent)" }}>MES RÉSERVATIONS</h3>
        {myBookings.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Aucune réservation pour le moment.</p>
        ) : (
          myBookings.map((b) => (
            <div key={b.id || b.slotKey} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{b.dateStr} à {b.time}</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>{b.duration}</div>
              </div>
              {b.type === "member" ? <span className="tag tag-green">0 CFA</span> : <span className="tag tag-amber">{formatCFA(b.amount)}</span>}
              {b.confirmCode && <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{b.confirmCode}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("calendar");
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [toasts, setToasts] = useState([]);
  const [blockTarget, setBlockTarget] = useState(null);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const handleLogin = (form) => {
    const isAdmin = form.isAdmin;
    const u = {
      name: isAdmin ? "Admin Jeux Dia" : form.name || "Joueur Anonyme",
      phone: form.phone || "+228 90 00 00 00",
      isAdmin,
      memberStatus: isAdmin ? null : null,
      daysLeft: 18,
      memberExpiry: new Date(Date.now() + 18 * 86400000).toISOString(),
    };
    setUser(u);
    setShowAuth(false);
    addToast(`Bienvenue ${u.name} !`, "success");
    if (isAdmin) setPage("admin");
  };

  const handleRegister = (form) => {
    const u = { name: form.name || "Nouveau Joueur", phone: form.phone || "+228 90 00 00 00", isAdmin: false, memberStatus: null, daysLeft: 0, memberExpiry: null };
    setUser(u);
    setShowAuth(false);
    addToast("Compte créé avec succès !", "success");
  };

  const handleBook = (booking) => {
    const id = "b" + Date.now();
    const startIdx = TIME_SLOTS.indexOf(booking.time);

    if (startIdx === -1) {
      addToast("Créneau invalide.", "error");
      return;
    }

    if (!canBookSlots(bookings, booking.dateStr, booking.time, booking.slots)) {
      addToast("Ce créneau n'est plus disponible.", "error");
      return;
    }

    const newBookings = [];

    for (let i = 0; i < booking.slots; i++) {
      const time = TIME_SLOTS[startIdx + i];
      if (!time) break;

      newBookings.push({
        ...booking,
        id: `${id}_${i}`,
        time,
        slotKey: bookingSlotKeyFromParts(booking.dateStr, time),
        isPrimary: i === 0,
        amount: i === 0 ? booking.amount : 0,
      });
    }

    const bufferIdx = startIdx + booking.slots;
    if (bufferIdx < TIME_SLOTS.length) {
      const bufferTime = TIME_SLOTS[bufferIdx];
      const bufferExists = bookings.some((b) => b.dateStr === booking.dateStr && b.time === bufferTime);
      if (!bufferExists) {
        newBookings.push({
          id: `${id}_buffer`,
          slotKey: bookingSlotKeyFromParts(booking.dateStr, bufferTime),
          dateStr: booking.dateStr,
          time: bufferTime,
          duration: "buffer",
          type: "buffer",
          status: "buffer",
          amount: 0,
        });
      }
    }

    setBookings((b) => [...b, ...newBookings]);
    addToast(`Session réservée pour ${booking.time} ! Code: ${booking.confirmCode}`, "success");
  };

  const handleBlock = (slotInfo) => {
    setBlockTarget(slotInfo);
  };

  const confirmBlock = (reason) => {
    const exists = bookings.some((b) => b.dateStr === blockTarget.dateStr && b.time === blockTarget.time && b.type !== "buffer");
    if (exists) {
      addToast("Impossible de bloquer ce créneau car il est déjà occupé.", "error");
      setBlockTarget(null);
      return;
    }
    const b = { ...blockTarget, id: "blk" + Date.now(), type: "blocked", status: "blocked", reason, amount: 0 };
    setBookings((prev) => [...prev, b]);
    setBlockTarget(null);
    addToast(`Créneau ${b.time} bloqué : ${reason}`, "info");
  };

  const handleUnblock = (booking) => {
    setBookings((prev) => prev.filter((b) => b.id !== booking.id));
    addToast("Créneau débloqué", "success");
  };

  const handleActivateMembership = (code) => {
    const expiry = new Date(Date.now() + 30 * 86400000).toISOString();
    const now = new Date();

    setUser((u) => ({ ...u, memberStatus: "active", daysLeft: 30, memberExpiry: expiry }));
    setBookings((prev) => [
      ...prev,
      {
        id: "m" + Date.now(),
        dateStr: toLocalDateStr(now),
        time: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        slotKey: `membership_${Date.now()}`,
        name: user?.name || "Client",
        phone: user?.phone || "",
        type: "membership",
        status: "confirmed",
        amount: 10000,
        confirmCode: code,
        isPrimary: true,
      },
    ]);
    addToast("🏆 Membership activé ! Profitez de 30 jours d'accès gratuit.", "success");
  };

  const handleRenewMembership = (code) => {
    const expiry = new Date(Date.now() + 30 * 86400000).toISOString();
    const now = new Date();

    setUser((u) => ({ ...u, memberStatus: "active", daysLeft: 30, memberExpiry: expiry }));
    setBookings((prev) => [
      ...prev,
      {
        id: "m" + Date.now(),
        dateStr: toLocalDateStr(now),
        time: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        slotKey: `membership_${Date.now()}`,
        name: user?.name || "Client",
        phone: user?.phone || "",
        type: "membership",
        status: "confirmed",
        amount: 10000,
        confirmCode: code,
        isPrimary: true,
      },
    ]);
    addToast("✓ Membership renouvelé pour 30 jours !", "success");
  };

  const navItems = user?.isAdmin
    ? [{ id: "admin", label: "Dashboard" }, { id: "calendar", label: "Calendrier" }]
    : [{ id: "calendar", label: "Réserver" }, { id: "membership", label: "Membership" }, ...(user ? [{ id: "profile", label: "Profil" }] : [])];

  return (
    <div className="scanlines" style={{ minHeight: "100vh" }}>
      <div className="noise" />
      <GlobalStyle />

      <header style={{ background: "rgba(13,18,32,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100, padding: "0 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Logo />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <nav className="nav" style={{ display: "flex" }}>
              {navItems.map((n) => (
                <div key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>{n.label}</div>
              ))}
            </nav>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                <div
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent2), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}
                  onClick={() => setPage(user?.isAdmin ? "admin" : "profile")}
                >
                  {user.name.charAt(0)}
                </div>
              </div>
            ) : (
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={() => { setAuthMode("login"); setShowAuth(true); }}>
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 80px" }}>
        {!user && page === "calendar" && (
          <div className="card cyber-corner" style={{ marginBottom: 24, background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,245,212,0.08))", borderColor: "rgba(124,58,237,0.3)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,245,212,0.15) 0%, transparent 70%)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span className="tag tag-cyan" style={{ animation: "blink 2s ease infinite" }}>OUVERT</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>09:00 – 21:00 · 7j/7</span>
              </div>
              <h1 className="orbitron" style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, marginBottom: 8 }}>
                Vivez la réalité<br /><span style={{ color: "var(--accent)" }}>virtuelle</span> à Lomé
              </h1>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
                Réservez votre session VR en ligne et payez par T-Money ou Flooz.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" onClick={() => { setAuthMode("register"); setShowAuth(true); }}>Créer un compte →</button>
                <button className="btn btn-ghost" onClick={() => { setAuthMode("login"); setShowAuth(true); }}>Se connecter</button>
              </div>
            </div>
          </div>
        )}

        {page === "calendar" && <CalendarView user={user} bookings={bookings} onBook={handleBook} onBlock={handleBlock} addToast={addToast} />}
        {page === "membership" && <MembershipPage user={user} onActivate={handleActivateMembership} onRenew={handleRenewMembership} />}
        {page === "profile" && user && !user.isAdmin && <ProfilePage user={user} bookings={bookings} />}
        {page === "admin" && user?.isAdmin && <AdminDashboard bookings={bookings} onUnblock={handleUnblock} />}
      </main>

      {showAuth && <AuthModal mode={authMode} onClose={() => setShowAuth(false)} onLogin={handleLogin} onRegister={handleRegister} />}
      {blockTarget && <BlockModal slot={blockTarget} onClose={() => setBlockTarget(null)} onBlock={confirmBlock} />}

      <Toast toasts={toasts} />

      {!user && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 20px", background: "rgba(13,18,32,0.95)", borderTop: "1px solid var(--border)", backdropFilter: "blur(12px)", display: "flex", gap: 12, justifyContent: "center", zIndex: 50 }}>
          <button className="btn btn-ghost" style={{ flex: 1, maxWidth: 200 }} onClick={() => { setAuthMode("login"); setShowAuth(true); }}>Se connecter</button>
          <button className="btn btn-primary" style={{ flex: 1, maxWidth: 200 }} onClick={() => { setAuthMode("register"); setShowAuth(true); }}>Créer un compte</button>
        </div>
      )}
    </div>
  );
}
