import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "./lib/supabase";
import logoImg from "./assets/jdlo.png";

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
      0%, 100% { box-shadow: 0 0 10px rgba(0,245,212,0.25); }
      50% { box-shadow: 0 0 26px rgba(0,245,212,0.45); }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) scale(1); }
      50% { transform: translateY(-6px) scale(1.01); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

    .fade-in { animation: fadeIn 0.35s ease forwards; }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-family: 'Syne', sans-serif;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
      letter-spacing: 0.03em;
    }

    .btn-primary { background: var(--accent); color: #000; }
    .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: var(--glow); }

    .btn-ghost {
      background: transparent;
      color: var(--accent);
      border: 1px solid var(--accent);
    }
    .btn-ghost:hover { background: rgba(0,245,212,0.08); }

    .btn-danger { background: var(--danger); color: #fff; }
    .btn-purple { background: var(--accent2); color: #fff; }
    .btn-purple:hover { filter: brightness(1.1); box-shadow: var(--glow2); }
    .btn-sm { padding: 8px 16px; font-size: 12px; }
    .btn-link {
      background: none;
      border: none;
      color: var(--accent);
      cursor: pointer;
      font-size: 12px;
      padding: 0;
      text-align: left;
    }
    .btn-link:hover { text-decoration: underline; }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
    }

    .tag {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      font-family: 'JetBrains Mono', monospace;
    }

    .tag-green  { background: rgba(16,185,129,0.15); color: var(--success); border: 1px solid rgba(16,185,129,0.3); }
    .tag-amber  { background: rgba(245,158,11,0.15); color: var(--accent3); border: 1px solid rgba(245,158,11,0.3); }
    .tag-purple { background: rgba(124,58,237,0.15); color: #a78bfa; border: 1px solid rgba(124,58,237,0.3); }
    .tag-red    { background: rgba(239,68,68,0.15); color: var(--danger); border: 1px solid rgba(239,68,68,0.3); }
    .tag-cyan   { background: rgba(0,245,212,0.1); color: var(--accent); border: 1px solid rgba(0,245,212,0.3); }

    input, select, textarea {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      padding: 10px 14px;
      font-family: 'Syne', sans-serif;
      font-size: 14px;
      width: 100%;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input:focus, select:focus, textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(0,245,212,0.1);
    }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

    @media (max-width: 640px) {
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
    }

    .scanlines::after {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.03) 2px,
        rgba(0,0,0,0.03) 4px
      );
    }

    .noise {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9998;
      opacity: 0.02;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(5,8,16,0.85);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      max-width: 560px;
      width: 100%;
      animation: fadeIn 0.3s ease;
      position: relative;
      max-height: 90vh;
      overflow-y: auto;
    }

    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .toast {
      padding: 14px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      animation: fadeIn 0.3s ease;
      min-width: 260px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .toast-success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); color: #6ee7b7; }
    .toast-error   { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); color: #fca5a5; }
    .toast-info    { background: rgba(0,245,212,0.1); border: 1px solid rgba(0,245,212,0.3); color: var(--accent); }

    .nav {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .nav-item {
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;
      color: var(--muted);
      letter-spacing: 0.03em;
    }

    .nav-item.active { color: var(--accent); background: rgba(0,245,212,0.08); }
    .nav-item:hover:not(.active) { color: var(--text); background: var(--surface); }

    .slot {
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.15s;
      border: 1px solid transparent;
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
    }

    .slot-available {
      background: rgba(0,245,212,0.06);
      border-color: rgba(0,245,212,0.2);
      color: var(--accent);
    }

    .slot-available:hover {
      background: rgba(0,245,212,0.15);
      border-color: var(--accent);
      transform: scale(1.02);
    }

    .slot-booked {
      background: rgba(124,58,237,0.1);
      border-color: rgba(124,58,237,0.25);
      color: #a78bfa;
      cursor: default;
    }

    .slot-blocked {
      background: rgba(239,68,68,0.08);
      border-color: rgba(239,68,68,0.2);
      color: #f87171;
      cursor: default;
    }

    .slot-selected {
      background: rgba(0,245,212,0.2);
      border-color: var(--accent);
      box-shadow: var(--glow);
      color: var(--accent);
    }

    .slot-buffer {
      background: rgba(100,116,139,0.06);
      border-color: rgba(100,116,139,0.15);
      color: var(--muted);
      cursor: default;
      font-size: 10px;
    }

    .stat-card { position: relative; overflow: hidden; }
    .stat-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%);
      pointer-events: none;
    }

    .qr-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; }
    .qr-cell { aspect-ratio: 1; border-radius: 1px; }

    .progress-bar {
      height: 6px;
      border-radius: 3px;
      background: var(--border);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      background: linear-gradient(90deg, var(--accent), var(--accent2));
      transition: width 0.5s ease;
    }

    .cyber-corner { position: relative; }
    .cyber-corner::before, .cyber-corner::after {
      content: '';
      position: absolute;
      width: 12px;
      height: 12px;
    }

    .cyber-corner::before {
      top: 0;
      left: 0;
      border-top: 2px solid var(--accent);
      border-left: 2px solid var(--accent);
    }

    .cyber-corner::after {
      bottom: 0;
      right: 0;
      border-bottom: 2px solid var(--accent);
      border-right: 2px solid var(--accent);
    }
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
const todayStr = toLocalDateStr(new Date());

function formatCFA(n) {
  return (n || 0).toLocaleString("fr-FR") + " CFA";
}

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

function durationLabelToMinutes(label) {
  return label === "1 heure" ? 60 : 15;
}

function durationMinutesToLabel(minutes) {
  return minutes >= 60 ? "1 heure" : "15 min";
}

function durationMinutesToSlots(minutes) {
  return minutes >= 60 ? 4 : 1;
}

function combineDateAndTime(dateStr, time) {
  return new Date(`${dateStr}T${time}:00`);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function formatTimeHHMM(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function makeUserFromDb(row) {
  const now = new Date();
  const expiry = row?.member_expiry ? new Date(row.member_expiry) : null;
  const isActiveMember = !!row?.is_member && expiry && expiry > now;
  const isExpiredMember = !!row?.is_member && expiry && expiry <= now;
  const daysLeft = expiry ? Math.max(0, Math.ceil((expiry - now) / 86400000)) : 0;

  return {
    id: row.id,
    name: row.full_name || "Joueur",
    phone: row.phone || "",
    email: row.email || "",
    role: row.role || "customer",
    isAdmin: row.role === "admin",
    memberStatus: isActiveMember ? "active" : isExpiredMember ? "expired" : null,
    daysLeft,
    memberExpiry: row.member_expiry || null,
  };
}

function expandBookingRecord(row) {
  const start = new Date(row.start_time);
  const dateStr = toLocalDateStr(start);
  const startTime = formatTimeHHMM(start);
  const durationMinutes = row.duration || 15;
  const slots = durationMinutesToSlots(durationMinutes);
  const slotTimes = getSlotsForDuration(startTime, slots);
  const type = row.price > 0 ? "casual" : "member";

  const out = slotTimes.map((time, i) => ({
    id: `${row.id}_${i}`,
    sourceId: row.id,
    slotKey: bookingSlotKeyFromParts(dateStr, time),
    dateStr,
    time,
    duration: durationMinutesToLabel(durationMinutes),
    name: row.customer_name,
    phone: row.phone,
    type,
    status: row.status || "confirmed",
    amount: i === 0 ? (row.price || 0) : 0,
    isPrimary: i === 0,
    confirmCode: row.confirm_code || null,
  }));

  const startIdx = TIME_SLOTS.indexOf(startTime);
  const bufferTime = TIME_SLOTS[startIdx + slots];

  if (bufferTime) {
    out.push({
      id: `${row.id}_buffer`,
      sourceId: row.id,
      slotKey: bookingSlotKeyFromParts(dateStr, bufferTime),
      dateStr,
      time: bufferTime,
      duration: "buffer",
      type: "buffer",
      status: "buffer",
      amount: 0,
    });
  }

  return out;
}

function expandBlockedSlotRecord(row) {
  const start = new Date(row.start_time);
  const end = new Date(row.end_time);
  const dateStr = toLocalDateStr(start);
  const startTime = formatTimeHHMM(start);
  const totalMinutes = Math.max(20, Math.ceil((end - start) / 60000));
  const blocks = Math.max(1, Math.ceil(totalMinutes / 20));
  const slotTimes = getSlotsForDuration(startTime, blocks);

  return slotTimes.map((time, i) => ({
    id: `blk_${row.id}_${i}`,
    sourceId: row.id,
    slotKey: bookingSlotKeyFromParts(dateStr, time),
    dateStr,
    time,
    duration: null,
    name: null,
    phone: null,
    type: "blocked",
    status: "blocked",
    amount: 0,
    reason: row.reason,
    isPrimary: i === 0,
  }));
}

async function writeAdminLog(user, actionType, targetTable, targetId, details = {}) {
  if (!user?.id) return;

  await supabase.from("admin_activity_logs").insert({
    admin_user_id: user.id,
    admin_name: user.name || "Admin",
    action_type: actionType,
    target_table: targetTable,
    target_id: targetId ? String(targetId) : null,
    details,
  });
}

function Logo({ size = 72, clickable = false, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: 18,
        padding: 8,
        background: "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(0,245,212,0.14))",
        border: "1px solid rgba(0,245,212,0.22)",
        boxShadow: "var(--glow)",
        animation: "float 3s ease-in-out infinite, pulse-glow 3s ease-in-out infinite",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: clickable ? "pointer" : "default",
        flexShrink: 0,
      }}
    >
      <img
        src={logoImg}
        alt="Jeux Dia"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          borderRadius: 12,
        }}
      />
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

function ForgotPasswordModal({ onClose, onSend }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email) return;
    setLoading(true);
    await onSend(email);
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <h2 className="orbitron" style={{ fontSize: 18, marginBottom: 8, color: "var(--accent)" }}>
          Mot de passe oublié
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
          Entrez votre email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ color: "var(--muted)", fontSize: 12, display: "block", marginBottom: 6 }}>EMAIL</label>
          <input
            type="email"
            placeholder="exemple@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit} disabled={!email || loading}>
            Envoyer →
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({ onClose, onSave }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!password || password.length < 6) return;
    if (password !== confirm) return;
    setLoading(true);
    await onSave(password);
    setLoading(false);
  }

  const mismatch = confirm && password !== confirm;

  return (
    <div className="modal-overlay" onClick={() => {}}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <h2 className="orbitron" style={{ fontSize: 18, marginBottom: 8, color: "var(--accent)" }}>
          Nouveau mot de passe
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "var(--muted)", fontSize: 12, display: "block", marginBottom: 6 }}>NOUVEAU MOT DE PASSE</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ color: "var(--muted)", fontSize: 12, display: "block", marginBottom: 6 }}>CONFIRMER</label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {mismatch && (
            <p style={{ marginTop: 8, color: "var(--danger)", fontSize: 12 }}>
              Les mots de passe ne correspondent pas.
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Fermer
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={submit}
            disabled={!password || password.length < 6 || mismatch || loading}
          >
            Sauvegarder →
          </button>
        </div>
      </div>
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

    try {
      setLoading(true);

      const publicKey = import.meta.env.VITE_FEDAPAY_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error("Clé publique FedaPay manquante");
      }

      if (!window.FedaPay) {
        throw new Error("FedaPay Checkout.js n'est pas chargé");
      }

      const widget = window.FedaPay.init({
        public_key: publicKey,
        environment: "sandbox",
        locale: "fr",
        transaction: {
          amount,
          description: booking.isMembership
            ? "Jeux Dia Membership 30 jours"
            : `Jeux Dia session ${booking.duration || ""} ${booking.time || ""}`,
        },
        customer: {
          firstname: booking.name ? booking.name.split(" ")[0] : "Client",
          lastname: booking.name ? booking.name.split(" ").slice(1).join(" ") : "Jeux Dia",
          phone_number: {
            number: phone.replace(/\s/g, ""),
            country: "tg",
          },
        },
        onComplete: function ({ reason }) {
          if (reason === window.FedaPay.CHECKOUT_COMPLETED) {
            const code = "JD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
            setConfirmCode(code);
            setStep("done");
          } else {
            setStep("phone");
          }
          setLoading(false);
        },
      });

      setStep("processing");
      widget.open();
    } catch (error) {
      alert(error.message || "Erreur de paiement");
      setLoading(false);
      setStep("phone");
    }
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
                  style={{
                    border: `1px solid ${method === m ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: 10,
                    padding: 20,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s",
                    background: method === m ? "rgba(0,245,212,0.08)" : "var(--surface)"
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{m === "T-Money" ? "🔵" : "🟠"}</div>
                  <div className="orbitron" style={{ fontSize: 14, fontWeight: 700 }}>{m}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {m === "T-Money" ? "Togocel" : "Moov Africa"}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
              Powered by <span style={{ color: "var(--accent)" }}>FedaPay</span>
            </p>
          </div>
        )}

        {step === "phone" && (
          <div className="fade-in">
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 8 }}>Numéro {method} :</p>
            <input
              placeholder="+228 90 XX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ marginBottom: 20, fontSize: 16 }}
            />
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20, padding: 12, background: "var(--surface)", borderRadius: 8 }}>
              Vous recevrez une demande de paiement de <strong style={{ color: "var(--accent3)" }}>{formatCFA(amount)}</strong> sur le numéro saisi.
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
            <div
              style={{
                width: 60,
                height: 60,
                border: "3px solid var(--border)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 20px"
              }}
            />
            <p className="orbitron" style={{ color: "var(--accent)", marginBottom: 8 }}>TRAITEMENT EN COURS</p>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Attente de confirmation {method}...</p>
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
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => onSuccess(confirmCode)}>
              Terminé ✓
            </button>
          </div>
        )}

        {step !== "processing" && step !== "done" && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "none",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: 18
            }}
          >
            ✕
          </button>
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

function EditUserModal({ userData, onClose, onSave }) {
  const [form, setForm] = useState({
    ...userData,
    member_expiry: userData?.member_expiry
      ? new Date(userData.member_expiry).toISOString().slice(0, 16)
      : "",
  });

  const update = (key) => (e) =>
    setForm({
      ...form,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="orbitron" style={{ fontSize: 16, marginBottom: 18, color: "var(--accent)" }}>
          Modifier utilisateur
        </h2>

        <div style={{ display: "grid", gap: 12 }}>
          <input value={form.full_name || ""} onChange={update("full_name")} placeholder="Nom complet" />
          <input value={form.phone || ""} onChange={update("phone")} placeholder="Téléphone" />
          <input value={form.email || ""} onChange={update("email")} placeholder="Email" />
          <select value={form.role || "customer"} onChange={update("role")}>
            <option value="customer">customer</option>
            <option value="admin">admin</option>
          </select>

          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <input type="checkbox" checked={!!form.is_member} onChange={update("is_member")} style={{ width: 16 }} />
            Pass membre actif
          </label>

          <input
            type="datetime-local"
            value={form.member_expiry || ""}
            onChange={update("member_expiry")}
            placeholder="Expiration membership"
          />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave(form)}>
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthModal({ mode, onClose, onLogin, onRegister, onForgotPassword, onGoogleLogin }) {
  const [tab, setTab] = useState(mode || "login");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <Logo size={110} />
        </div>

        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid var(--border)" }}>
          {["login", "register"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "Syne",
                borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                color: tab === t ? "var(--accent)" : "var(--muted)",
                letterSpacing: "0.05em"
              }}
            >
              {t === "login" ? "CONNEXION" : "INSCRIPTION"}
            </button>
          ))}
        </div>

        {tab === "login" ? (
          <div className="fade-in">
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "var(--muted)", fontSize: 12, display: "block", marginBottom: 6 }}>EMAIL</label>
              <input type="email" placeholder="exemple@email.com" value={form.email} onChange={upd("email")} />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ color: "var(--muted)", fontSize: 12, display: "block", marginBottom: 6 }}>MOT DE PASSE</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={upd("password")} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <button className="btn-link" onClick={onForgotPassword}>
                Mot de passe oublié ?
              </button>
            </div>

            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => onLogin(form)}>
              Se connecter →
            </button>

            <button className="btn btn-ghost" style={{ width: "100%", marginTop: 12 }} onClick={onGoogleLogin}>
              Continuer avec Google
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

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "var(--muted)", fontSize: 12, display: "block", marginBottom: 6 }}>EMAIL</label>
              <input type="email" placeholder="exemple@email.com" value={form.email} onChange={upd("email")} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ color: "var(--muted)", fontSize: 12, display: "block", marginBottom: 6 }}>MOT DE PASSE</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={upd("password")} />
            </div>

            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => onRegister(form)}>
              Créer mon compte →
            </button>

            <button className="btn btn-ghost" style={{ width: "100%", marginTop: 12 }} onClick={onGoogleLogin}>
              Continuer avec Google
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            color: "var(--muted)",
            cursor: "pointer",
            fontSize: 18
          }}
        >
          ✕
        </button>
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

    if (!user && !isAdmin) {
      addToast("Connectez-vous d'abord pour réserver.", "info");
      return;
    }

    if (isAdmin) {
      if (status === "available") {
        onBlock({ time, dateStr, slotKey: bookingSlotKeyFromParts(dateStr, time) });
      }
      return;
    }

    if (status !== "available") return;

    const allowed = canBookSlots(bookings, dateStr, time, selectedDuration.slots);
    if (!allowed) {
      addToast(`Impossible de réserver ${selectedDuration.label} à ${time}.`, "error");
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
                style={{
                  textAlign: "center",
                  padding: "10px 4px",
                  borderRadius: 8,
                  cursor: isPast ? "default" : "pointer",
                  background: active ? "rgba(0,245,212,0.12)" : "transparent",
                  border: active ? "1px solid var(--accent)" : "1px solid transparent",
                  opacity: isPast ? 0.35 : 1,
                  transition: "all 0.15s"
                }}
              >
                <div style={{ fontSize: 10, color: active ? "var(--accent)" : "var(--muted)", marginBottom: 4, letterSpacing: "0.05em" }}>
                  {DAYS[d.getDay()]}
                </div>
                <div className="orbitron" style={{ fontSize: 15, fontWeight: 700, color: active ? "var(--accent)" : isToday ? "var(--accent3)" : "var(--text)" }}>
                  {d.getDate()}
                </div>
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
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 10,
                cursor: "pointer",
                border: `1px solid ${selectedDuration.label === d.label ? "var(--accent)" : "var(--border)"}`,
                background: selectedDuration.label === d.label ? "rgba(0,245,212,0.08)" : "var(--card)",
                textAlign: "center",
                transition: "all 0.2s"
              }}
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
                      <span style={{ display: "block", fontSize: 9, opacity: 0.7, marginTop: 2 }}>
                        {info.name.split(" ")[0]}
                      </span>
                    )}
                    {status === "blocked" && (
                      <span style={{ display: "block", fontSize: 9, opacity: 0.7, marginTop: 2 }}>
                        {info?.reason}
                      </span>
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
          booking={{ time: selectedSlot, duration: selectedDuration.label, amount: isMember ? 0 : selectedDuration.price, name: user?.name || "Client" }}
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
          booking={{ amount: 10000, isMembership: true, name: user?.name || "Client" }}
          onClose={() => setPayModal(false)}
          onSuccess={async () => {
            setPayModal(false);
            if (isExpired) {
              await onRenew();
            } else {
              await onActivate();
            }
          }}
        />
      )}
    </div>
  );
}

function AdminDashboard({ bookings, payments, onUnblock, allUsers = [], onEditUser, activityLogs = [] }) {
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");

  const todayBookings = bookings.filter(
    (b) =>
      b.dateStr === todayStr &&
      b.status === "confirmed" &&
      b.isPrimary !== false &&
      b.type !== "buffer" &&
      b.type !== "blocked"
  );

  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + (p.amount || 0), 0);

  const membershipRevenue = payments
    .filter((p) => p.status === "paid" && p.method === "membership_pass")
    .reduce((s, p) => s + (p.amount || 0), 0);

  const sessionRevenue = totalRevenue - membershipRevenue;
  const tmoney = Math.round(sessionRevenue * 0.55);
  const flooz = sessionRevenue - tmoney;

  const activeMembers = allUsers.filter((u) => {
    if (!u.member_expiry || !u.is_member) return false;
    return new Date(u.member_expiry) > new Date();
  }).length;

  const expiredMembers = allUsers.filter((u) => {
    if (!u.member_expiry || !u.is_member) return false;
    return new Date(u.member_expiry) <= new Date();
  }).length;

  const filteredBookings = bookings.filter((b) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (b.name || "").toLowerCase().includes(q) ||
      (b.phone || "").toLowerCase().includes(q) ||
      (b.time || "").toLowerCase().includes(q) ||
      (b.dateStr || "").toLowerCase().includes(q)
    );
  });

  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      String(p.amount || "").includes(q) ||
      (p.method || "").toLowerCase().includes(q) ||
      (p.status || "").toLowerCase().includes(q)
    );
  });

  const blockedSlots = bookings.filter((b) => b.type === "blocked");

  return (
    <div className="fade-in">
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <h2 className="orbitron" style={{ fontSize: 18, color: "var(--accent)" }}>
            PORTAIL ADMIN
          </h2>
          <input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 280 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {[
            { id: "overview", label: "Vue d'ensemble" },
            { id: "bookings", label: "Réservations" },
            { id: "payments", label: "Paiements" },
            { id: "members", label: "Utilisateurs" },
            { id: "blocked", label: "Créneaux bloqués" },
            { id: "logs", label: "Journal admin" },
          ].map((item) => (
            <button
              key={item.id}
              className={`btn ${tab === item.id ? "btn-primary" : "btn-ghost"} btn-sm`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="grid-3" style={{ marginBottom: 20 }}>
          {[
            { label: "Revenus Total", value: formatCFA(totalRevenue), icon: "💰", color: "var(--accent3)" },
            { label: "Sessions aujourd'hui", value: todayBookings.length, icon: "🎮", color: "var(--accent)" },
            { label: "Membres actifs", value: activeMembers, icon: "🏆", color: "#6ee7b7" },
            { label: "Membres expirés", value: expiredMembers, icon: "⌛", color: "#f87171" },
            { label: "T-Money", value: formatCFA(tmoney), icon: "📱", color: "#3b82f6" },
            { label: "Flooz", value: formatCFA(flooz), icon: "🟠", color: "#f97316" },
          ].map((s) => (
            <div key={s.label} className="card stat-card">
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div className="orbitron" style={{ fontSize: 18, fontWeight: 900, color: s.color, marginBottom: 4 }}>
                {s.value}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "bookings" && (
        <div className="card">
          <h3 className="orbitron" style={{ fontSize: 13, marginBottom: 16, color: "var(--accent)" }}>TOUTES LES RÉSERVATIONS</h3>
          {filteredBookings.filter((b) => b.type !== "buffer").length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Aucune réservation trouvée.</p>
          ) : (
            filteredBookings
              .filter((b) => b.type !== "buffer")
              .map((b) => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{b.name || "—"}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>
                      {b.dateStr} · {b.time} · {b.duration} · {b.phone || "—"}
                    </div>
                  </div>
                  <div>
                    {b.type === "blocked" ? (
                      <span className="tag tag-red">BLOQUÉ</span>
                    ) : b.type === "member" ? (
                      <span className="tag tag-green">MEMBRE</span>
                    ) : (
                      <span className="tag tag-amber">{formatCFA(b.amount)}</span>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {tab === "payments" && (
        <div className="card">
          <h3 className="orbitron" style={{ fontSize: 13, marginBottom: 16, color: "var(--accent)" }}>TOUS LES PAIEMENTS</h3>
          {filteredPayments.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Aucun paiement trouvé.</p>
          ) : (
            filteredPayments.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{formatCFA(p.amount)}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>{p.method || "—"} · {p.status || "—"}</div>
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                  {p.created_at ? new Date(p.created_at).toLocaleString("fr-FR") : ""}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "members" && (
        <div className="card">
          <h3 className="orbitron" style={{ fontSize: 13, marginBottom: 16, color: "var(--accent)" }}>UTILISATEURS</h3>
          {allUsers.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Aucun utilisateur trouvé.</p>
          ) : (
            allUsers.map((u) => {
              const active = u.is_member && u.member_expiry && new Date(u.member_expiry) > new Date();
              const expired = u.is_member && u.member_expiry && new Date(u.member_expiry) <= new Date();

              return (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.full_name || "—"}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>
                      {u.phone || "—"} · {u.email || "—"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {u.role === "admin" ? (
                      <span className="tag tag-purple">ADMIN</span>
                    ) : active ? (
                      <span className="tag tag-green">MEMBRE ACTIF</span>
                    ) : expired ? (
                      <span className="tag tag-red">MEMBRE EXPIRÉ</span>
                    ) : (
                      <span className="tag tag-amber">CLIENT</span>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => onEditUser(u)}>
                      Modifier
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "blocked" && (
        <div className="card">
          <h3 className="orbitron" style={{ fontSize: 13, marginBottom: 16, color: "var(--accent)" }}>CRÉNEAUX BLOQUÉS</h3>
          {blockedSlots.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Aucun créneau bloqué.</p>
          ) : (
            blockedSlots.map((b) => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{b.dateStr} · {b.time}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>{b.reason || "Sans raison"}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => onUnblock(b)}>
                  Débloquer
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "logs" && (
        <div className="card">
          <h3 className="orbitron" style={{ fontSize: 13, marginBottom: 16, color: "var(--accent)" }}>JOURNAL ADMIN</h3>
          {activityLogs.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Aucune activité enregistrée.</p>
          ) : (
            activityLogs.map((log) => (
              <div key={log.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 600 }}>{log.admin_name || "Admin"} · {log.action_type}</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  {log.target_table || "—"} · {log.target_id || "—"} · {log.created_at ? new Date(log.created_at).toLocaleString("fr-FR") : ""}
                </div>
                <pre style={{ marginTop: 8, whiteSpace: "pre-wrap", fontSize: 11, color: "var(--muted)" }}>
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ProfilePage({ user, bookings }) {
  const myBookings = bookings.filter(
    (b) =>
      b.phone === user?.phone &&
      b.status === "confirmed" &&
      b.isPrimary !== false &&
      b.type !== "buffer" &&
      b.type !== "blocked"
  );

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
          <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            Aucune réservation pour le moment.
          </p>
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [blockTarget, setBlockTarget] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const ensureUserRow = useCallback(async (authUser) => {
    if (!authUser?.id) return null;

    const { data: existing, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!selectError && existing) {
      return existing;
    }

    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.user_metadata?.display_name ||
      authUser.email?.split("@")[0] ||
      "Utilisateur";

    const phone =
      authUser.user_metadata?.phone ||
      authUser.phone ||
      "";

    const email = authUser.email || "";

    const { data: inserted, error: insertError } = await supabase
      .from("users")
      .insert({
        id: authUser.id,
        full_name: fullName,
        phone,
        email,
        role: "customer",
        is_member: false,
        member_expiry: null,
      })
      .select()
      .single();

    if (insertError) {
      return null;
    }

    return inserted;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);

    const [bookingsRes, blockedRes, paymentsRes, usersRes, logsRes] = await Promise.all([
      supabase.from("bookings").select("*").order("start_time", { ascending: true }),
      supabase.from("blocked_slots").select("*").order("start_time", { ascending: true }),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("users").select("*").order("created_at", { ascending: false }),
      supabase.from("admin_activity_logs").select("*").order("created_at", { ascending: false }),
    ]);

    if (bookingsRes.error || blockedRes.error || paymentsRes.error || usersRes.error || logsRes.error) {
      addToast("Erreur de chargement depuis Supabase.", "error");
      setLoading(false);
      return;
    }

    const expandedBookings = (bookingsRes.data || []).flatMap(expandBookingRecord);
    const expandedBlocked = (blockedRes.data || []).flatMap(expandBlockedSlotRecord);

    const combined = [...expandedBookings, ...expandedBlocked].sort((a, b) => {
      const aKey = `${a.dateStr}_${a.time}`;
      const bKey = `${b.dateStr}_${b.time}`;
      return aKey.localeCompare(bKey);
    });

    setBookings(combined);
    setPayments(paymentsRes.data || []);
    setAllUsers(usersRes.data || []);
    setActivityLogs(logsRes.data || []);
    setLoading(false);
  }, [addToast]);

  const fetchCurrentProfile = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData?.session?.user;

    if (!authUser) {
      setUser(null);
      return;
    }

    const ensured = await ensureUserRow(authUser);
    if (ensured) {
      setUser(makeUserFromDb(ensured));
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!error && data) {
      setUser(makeUserFromDb(data));
    }
  }, [ensureUserRow]);

  useEffect(() => {
    loadData();
    fetchCurrentProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const authUser = session?.user || null;

      if (authUser) {
        await ensureUserRow(authUser);
      }

      await fetchCurrentProfile();

      if (event === "PASSWORD_RECOVERY") {
        setShowAuth(false);
        setShowForgotPassword(false);
        setShowResetPassword(true);
      }

      if (event === "SIGNED_IN" && authUser) {
        setShowAuth(false);
        await loadData();
      }
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, [loadData, fetchCurrentProfile, ensureUserRow]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://jeux-dia-vite-app.vercel.app",
      },
    });

    if (error) {
      addToast(error.message, "error");
    }
  };

  const handleLogin = async (form) => {
    if (!form.email || !form.password) {
      addToast("Entrez email et mot de passe.", "error");
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      addToast(authError.message, "error");
      return;
    }

    const authUser = authData.user;

    if (!authUser) {
      addToast("Utilisateur introuvable.", "error");
      return;
    }

    const ensured = await ensureUserRow(authUser);

    if (!ensured) {
      addToast("Profil utilisateur introuvable.", "error");
      return;
    }

    const u = makeUserFromDb(ensured);
    setUser(u);
    setShowAuth(false);
    setPage(u.isAdmin ? "admin" : "calendar");
    addToast(`Bienvenue ${u.name} !`, "success");
  };

  const handleRegister = async (form) => {
    if (!form.name || !form.phone || !form.email || !form.password) {
      addToast("Remplissez nom, téléphone, email et mot de passe.", "error");
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: "https://jeux-dia-vite-app.vercel.app",
      },
    });

    if (authError) {
      addToast(authError.message, "error");
      return;
    }

    const authUser = authData.user;

    if (!authUser) {
      addToast("Compte créé, mais utilisateur introuvable.", "error");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        id: authUser.id,
        full_name: form.name,
        phone: form.phone,
        email: form.email,
        role: "customer",
        is_member: false,
        member_expiry: null,
      })
      .select()
      .single();

    if (error) {
      addToast("Compte auth créé, mais erreur profil users.", "error");
      return;
    }

    const u = makeUserFromDb(data);
    setUser(u);
    setShowAuth(false);
    addToast("Compte sécurisé créé avec succès !", "success");
  };

  const handleForgotPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://jeux-dia-vite-app.vercel.app",
    });

    if (error) {
      addToast(error.message, "error");
      return;
    }

    setShowForgotPassword(false);
    addToast("Email de réinitialisation envoyé.", "success");
  };

  const handleRecoveredPasswordUpdate = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      addToast(error.message, "error");
      return;
    }

    setShowResetPassword(false);
    addToast("Mot de passe mis à jour avec succès.", "success");
  };

  const handleBook = async (booking) => {
    if (!user) {
      addToast("Connectez-vous pour réserver.", "error");
      setAuthMode("login");
      setShowAuth(true);
      return;
    }

    if (!canBookSlots(bookings, booking.dateStr, booking.time, booking.slots)) {
      addToast("Ce créneau n'est plus disponible.", "error");
      return;
    }

    const start = combineDateAndTime(booking.dateStr, booking.time);
    const durationMinutes = durationLabelToMinutes(booking.duration);
    const end = addMinutes(start, durationMinutes);

    const { error } = await supabase.from("bookings").insert({
      user_id: user.id || null,
      customer_name: booking.name,
      phone: booking.phone,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration: durationMinutes,
      price: booking.amount,
      status: "confirmed",
      payment_method: booking.amount > 0 ? "mobile_money" : "member",
      confirm_code: booking.confirmCode || null,
    });

    if (error) {
      addToast("Erreur lors de l'enregistrement de la réservation.", "error");
      return;
    }

    if (booking.amount > 0) {
      await supabase.from("payments").insert({
        user_id: user.id || null,
        amount: booking.amount,
        method: "mobile_money",
        status: "paid",
      });
    }

    await loadData();
    addToast(`Session réservée pour ${booking.time} !`, "success");
  };

  const handleBlock = (slotInfo) => {
    setBlockTarget(slotInfo);
  };

  const confirmBlock = async (reason) => {
    if (!blockTarget) return;

    const exists = bookings.some(
      (b) =>
        b.dateStr === blockTarget.dateStr &&
        b.time === blockTarget.time &&
        b.type !== "buffer"
    );

    if (exists) {
      addToast("Impossible de bloquer ce créneau car il est déjà occupé.", "error");
      setBlockTarget(null);
      return;
    }

    const start = combineDateAndTime(blockTarget.dateStr, blockTarget.time);
    const end = addMinutes(start, 20);

    const { data, error } = await supabase
      .from("blocked_slots")
      .insert({
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        reason,
      })
      .select()
      .single();

    if (error) {
      addToast("Erreur pendant le blocage du créneau.", "error");
      setBlockTarget(null);
      return;
    }

    await writeAdminLog(user, "BLOCK_SLOT", "blocked_slots", data.id, {
      dateStr: blockTarget.dateStr,
      time: blockTarget.time,
      reason,
    });

    setBlockTarget(null);
    await loadData();
    addToast("Créneau bloqué", "info");
  };

  const handleUnblock = async (booking) => {
    if (!booking?.sourceId) {
      addToast("Blocage introuvable.", "error");
      return;
    }

    const { error } = await supabase
      .from("blocked_slots")
      .delete()
      .eq("id", booking.sourceId);

    if (error) {
      addToast("Erreur pendant le déblocage.", "error");
      return;
    }

    await writeAdminLog(user, "UNBLOCK_SLOT", "blocked_slots", booking.sourceId, {
      dateStr: booking.dateStr,
      time: booking.time,
      reason: booking.reason || null,
    });

    await loadData();
    addToast("Créneau débloqué", "success");
  };

  const handleSaveUserEdit = async (updatedUser) => {
    if (!updatedUser?.id) return;

    const oldUser = allUsers.find((u) => u.id === updatedUser.id);

    const { error } = await supabase
      .from("users")
      .update({
        full_name: updatedUser.full_name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role,
        is_member: updatedUser.is_member,
        member_expiry: updatedUser.member_expiry || null,
      })
      .eq("id", updatedUser.id);

    if (error) {
      addToast("Erreur lors de la mise à jour de l'utilisateur.", "error");
      return;
    }

    await writeAdminLog(user, "EDIT_USER", "users", updatedUser.id, {
      before: oldUser,
      after: updatedUser,
    });

    setEditingUser(null);
    await loadData();
    addToast("Utilisateur mis à jour.", "success");
  };

  const handleActivateMembership = async () => {
    if (!user?.id) {
      addToast("Connectez-vous d'abord.", "error");
      return;
    }

    const expiry = new Date(Date.now() + 30 * 86400000).toISOString();

    const { data, error } = await supabase
      .from("users")
      .update({
        is_member: true,
        member_expiry: expiry,
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      addToast("Erreur pendant l'activation du membership.", "error");
      return;
    }

    await supabase.from("payments").insert({
      user_id: user.id,
      amount: 10000,
      method: "membership_pass",
      status: "paid",
    });

    setUser(makeUserFromDb(data));
    await loadData();
    addToast("Membership activé !", "success");
  };

  const handleRenewMembership = async () => {
    if (!user?.id) {
      addToast("Connectez-vous d'abord.", "error");
      return;
    }

    const expiry = new Date(Date.now() + 30 * 86400000).toISOString();

    const { data, error } = await supabase
      .from("users")
      .update({
        is_member: true,
        member_expiry: expiry,
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      addToast("Erreur pendant le renouvellement.", "error");
      return;
    }

    await supabase.from("payments").insert({
      user_id: user.id,
      amount: 10000,
      method: "membership_pass",
      status: "paid",
    });

    setUser(makeUserFromDb(data));
    await loadData();
    addToast("Membership renouvelé !", "success");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage("calendar");
    addToast("Déconnecté.", "info");
  };

  const navItems = user?.isAdmin
    ? [{ id: "admin", label: "Dashboard" }, { id: "calendar", label: "Calendrier" }]
    : [{ id: "calendar", label: "Réserver" }, { id: "membership", label: "Membership" }, ...(user ? [{ id: "profile", label: "Profil" }] : [])];

  return (
    <div className="scanlines" style={{ minHeight: "100vh" }}>
      <div className="noise" />
      <GlobalStyle />

      <header style={{ background: "rgba(13,18,32,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100, padding: "0 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          <Logo size={78} clickable onClick={() => setPage("calendar")} />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <nav className="nav" style={{ display: "flex" }}>
              {navItems.map((n) => (
                <div key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
                  {n.label}
                </div>
              ))}
            </nav>

            {user ? (
              <>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent2), var(--accent))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    cursor: "pointer"
                  }}
                  onClick={() => setPage(user?.isAdmin ? "admin" : "profile")}
                >
                  {user.name.charAt(0)}
                </div>

                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sortir</button>
              </>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => { setAuthMode("login"); setShowAuth(true); }}>
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 80px" }}>
        {loading && (
          <div className="card" style={{ marginBottom: 20 }}>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>Chargement des données Supabase...</p>
          </div>
        )}

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
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={() => { setAuthMode("register"); setShowAuth(true); }}>Créer un compte →</button>
                <button className="btn btn-ghost" onClick={() => { setAuthMode("login"); setShowAuth(true); }}>Se connecter</button>
              </div>
            </div>
          </div>
        )}

        {page === "calendar" && <CalendarView user={user} bookings={bookings} onBook={handleBook} onBlock={handleBlock} addToast={addToast} />}
        {page === "membership" && <MembershipPage user={user} onActivate={handleActivateMembership} onRenew={handleRenewMembership} />}
        {page === "profile" && user && !user.isAdmin && <ProfilePage user={user} bookings={bookings} />}
        {page === "admin" && user?.isAdmin && (
          <AdminDashboard
            bookings={bookings}
            payments={payments}
            allUsers={allUsers}
            activityLogs={activityLogs}
            onUnblock={handleUnblock}
            onEditUser={setEditingUser}
          />
        )}
      </main>

      {showAuth && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuth(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onForgotPassword={() => {
            setShowAuth(false);
            setShowForgotPassword(true);
          }}
          onGoogleLogin={handleGoogleLogin}
        />
      )}

      {showForgotPassword && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPassword(false)}
          onSend={handleForgotPassword}
        />
      )}

      {showResetPassword && (
        <ResetPasswordModal
          onClose={() => setShowResetPassword(false)}
          onSave={handleRecoveredPasswordUpdate}
        />
      )}

      {blockTarget && <BlockModal slot={blockTarget} onClose={() => setBlockTarget(null)} onBlock={confirmBlock} />}

      {editingUser && (
        <EditUserModal
          userData={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUserEdit}
        />
      )}

      <Toast toasts={toasts} />

      {!user && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 20px", background: "rgba(13,18,32,0.95)", borderTop: "1px solid var(--border)", backdropFilter: "blur(12px)", display: "flex", gap: 12, justifyContent: "center", zIndex: 50, flexWrap: "wrap" }}>
          <button className="btn btn-ghost" style={{ flex: 1, maxWidth: 200 }} onClick={() => { setAuthMode("login"); setShowAuth(true); }}>Se connecter</button>
          <button className="btn btn-primary" style={{ flex: 1, maxWidth: 200 }} onClick={() => { setAuthMode("register"); setShowAuth(true); }}>Créer un compte</button>
        </div>
      )}
    </div>
  );
}