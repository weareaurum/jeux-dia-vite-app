import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Gamepad2,
  Smartphone,
  CalendarDays,
  TrendingUp,
  Users,
  Crown,
  ShieldBan,
} from "lucide-react";
import { supabase } from "./lib/supabase";

import jdLogo from "./assets/jdlo.png";

function LogoMark({ size = 64, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <img
        src={jdLogo}
        alt="Jeux Dia"
        width={size}
        height={size}
        style={{
          objectFit: "contain",
          display: "block",
          background: "transparent"
        }}
      />
    </button>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  "09:00","09:20","09:40","10:00","10:20","10:40","11:00","11:20","11:40",
  "12:00","12:20","12:40","13:00","13:20","13:40","14:00","14:20","14:40",
  "15:00","15:20","15:40","16:00","16:20","16:40","17:00","17:20","17:40",
  "18:00","18:20","18:40","19:00","19:20","19:40","20:00",
];

const DURATIONS = [
  { label: "15 min", minutes: 15, slots: 1, price: 1000 },
  { label: "1 heure", minutes: 60, slots: 4, price: 3000 },
];

const DAYS   = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

// ─── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("ERROR BOUNDARY:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: "white", background: "#050810", minHeight: "100vh" }}>
          <h2>Une erreur est survenue.</h2>
          <pre style={{ whiteSpace: "pre-wrap", color: "#fca5a5" }}>
            {this.state.error?.message || "Erreur inconnue"}
          </pre>
          <button
            style={{ marginTop: 16, padding: "10px 20px", background: "#00f5d4", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Global Styles ───────────────────────────────────────────────────────────
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Syne:wght@400;500;600;700&display=swap');

      * { box-sizing: border-box; }
      html, body, #root { margin: 0; min-height: 100%; }
      body {
        font-family: 'Syne', sans-serif;
        background: #050810;
        color: #e2e8f0;
      }

      :root {
        --bg: #050810;
        --surface: #0d1220;
        --card: #111827;
        --border: #1e2d45;
        --accent: #00f5d4;
        --accent2: #7c3aed;
        --accent3: #f59e0b;
        --text: #e2e8f0;
        --muted: #64748b;
        --danger: #ef4444;
        --success: #10b981;
      }

      .orbitron { font-family: 'Orbitron', monospace; }

      .page {
        min-height: 100vh;
        background:
          radial-gradient(circle at top right, rgba(124,58,237,0.12), transparent 30%),
          radial-gradient(circle at top left, rgba(0,245,212,0.08), transparent 25%),
          var(--bg);
      }

      .container {
        width: min(100%, 980px);
        margin: 0 auto;
        padding: 0 20px;
      }

      .header {
        position: sticky;
        top: 0;
        z-index: 10;
        background: rgba(13,18,32,0.9);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border);
      }

      .header-inner {
        min-height: 74px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .logo-btn {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        padding: 6px;
        border: 1px solid rgba(0,245,212,0.25);
        background: linear-gradient(135deg, rgba(124,58,237,0.18), rgba(0,245,212,0.12));
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 18px rgba(0,245,212,0.18);
        flex-shrink: 0;
      }

      .nav {
        display: flex;
        gap: 4px;
        align-items: center;
        flex-wrap: wrap;
      }

      .nav-item {
        padding: 9px 14px;
        border-radius: 10px;
        cursor: pointer;
        color: var(--muted);
        font-size: 13px;
        font-weight: 700;
        transition: all 0.15s;
      }
      .nav-item:hover { color: var(--text); }
      .nav-item.active { color: var(--accent); background: rgba(0,245,212,0.08); }

      .btn {
        border: none;
        border-radius: 10px;
        padding: 11px 18px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .btn:disabled { opacity: 0.45; cursor: not-allowed; }

      .btn-primary { background: var(--accent); color: #000; }
      .btn-primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }

      .btn-ghost { background: transparent; color: var(--accent); border: 1px solid var(--accent); }
      .btn-ghost:hover:not(:disabled) { background: rgba(0,245,212,0.08); }

      .btn-danger { background: var(--danger); color: white; }
      .btn-danger:hover:not(:disabled) { filter: brightness(1.1); }

      .btn-purple { background: var(--accent2); color: white; }
      .btn-purple:hover:not(:disabled) { filter: brightness(1.1); }

      .btn-sm { padding: 8px 12px; font-size: 12px; }

      .hero, .card {
        background: rgba(17,24,39,0.88);
        border: 1px solid var(--border);
        border-radius: 16px;
      }

      .hero { padding: 24px; margin: 24px 0; }
      .card { padding: 20px; margin-bottom: 18px; }

      .admin-panel-title { letter-spacing: 0.04em; text-transform: uppercase; }

      .stat-card {
        position: relative;
        overflow: hidden;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
      }
      .stat-card::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.06), transparent 40%);
        pointer-events: none;
      }
      .stat-card:hover { transform: translateY(-2px); }

      .stat-icon-wrap {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;
        background: rgba(255,255,255,0.04);
      }

      .kpi-box {
        padding: 16px;
        border-radius: 14px;
        transition: transform 0.16s ease;
      }
      .kpi-box:hover { transform: translateY(-1px); }

      .source-bar-track {
        height: 8px;
        border-radius: 999px;
        background: rgba(100,116,139,0.25);
        overflow: hidden;
      }
      .source-bar-fill {
        height: 100%;
        border-radius: 999px;
        transition: width 0.25s ease;
      }

      .admin-section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 800;
        margin-bottom: 18px;
        color: var(--accent);
        letter-spacing: 0.03em;
      }

      .admin-card-soft {
        background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)), rgba(17,24,39,0.92);
        border: 1px solid rgba(30,45,69,0.95);
        border-radius: 16px;
      }

      .admin-highlight-line {
        width: 100%;
        height: 1px;
        background: linear-gradient(90deg, rgba(0,245,212,0.35), transparent);
        margin-top: 8px;
      }

      .sales-amount { font-weight: 800; color: #fbbf24; }

      .time-pill {
        min-width: 64px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(0,245,212,0.08);
        border: 1px solid rgba(0,245,212,0.2);
        color: var(--accent);
      }

      .muted { color: var(--muted); }
      .accent { color: var(--accent); }

      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
      .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

      @media (max-width: 900px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 700px) {
        .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
        .admin-panel-title { font-size: 18px !important; }
      }

      input, select, textarea {
        width: 100%;
        padding: 11px 13px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        font: inherit;
        outline: none;
        transition: border-color 0.2s;
      }
      input:focus, select:focus { border-color: var(--accent); }

      .week-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 8px;
      }

      .day-box {
        border-radius: 12px;
        border: 1px solid transparent;
        text-align: center;
        padding: 10px 4px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .day-box:hover { background: rgba(255,255,255,0.04); }
      .day-box.active { border-color: var(--accent); background: rgba(0,245,212,0.08); }
      .day-box.past { opacity: 0.35; cursor: default; pointer-events: none; }

      .slots-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }
      @media (max-width: 700px) { .slots-grid { grid-template-columns: repeat(2, 1fr); } }

      .slot {
        border-radius: 10px;
        padding: 10px;
        border: 1px solid var(--border);
        font-size: 12px;
        min-height: 56px;
        transition: all 0.15s;
        user-select: none;
      }
      .slot.available { color: var(--accent); background: rgba(0,245,212,0.05); cursor: pointer; }
      .slot.available:hover { background: rgba(0,245,212,0.14); border-color: var(--accent); transform: scale(1.02); }
      .slot.booked { color: #c4b5fd; background: rgba(124,58,237,0.08); cursor: default; }
      .slot.blocked { color: #fca5a5; background: rgba(239,68,68,0.08); cursor: default; }
      .slot.buffer { color: var(--muted); background: rgba(100,116,139,0.06); cursor: default; font-size: 10px; }

      .tag {
        display: inline-block;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 700;
      }
      .tag-green  { background: rgba(16,185,129,0.15); color: #6ee7b7; }
      .tag-red    { background: rgba(239,68,68,0.15);  color: #fca5a5; }
      .tag-purple { background: rgba(124,58,237,0.15); color: #c4b5fd; }
      .tag-cyan   { background: rgba(0,245,212,0.12);  color: var(--accent); }
      .tag-amber  { background: rgba(245,158,11,0.15); color: #fcd34d; }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.72);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 30;
      }
      .modal {
        width: min(100%, 460px);
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 24px;
        position: relative;
        animation: fadeIn 0.25s ease;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .toast-wrap {
        position: fixed;
        right: 16px;
        bottom: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 50;
      }
      .toast {
        min-width: 250px;
        border-radius: 12px;
        padding: 12px 16px;
        font-size: 14px;
        border: 1px solid;
        animation: fadeIn 0.25s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .toast.success { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.35); color: #6ee7b7; }
      .toast.error   { background: rgba(239,68,68,0.12);  border-color: rgba(239,68,68,0.35);  color: #fca5a5; }
      .toast.info    { background: rgba(0,245,212,0.12);  border-color: rgba(0,245,212,0.35);  color: var(--accent); }

      .list-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--border);
        align-items: center;
      }
      .list-row:last-child { border-bottom: none; }

      .progress-bar { height: 6px; border-radius: 3px; background: var(--border); overflow: hidden; }
      .progress-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width 0.5s ease; }

      @keyframes spin { to { transform: rotate(360deg); } }
      .spinner {
        width: 48px; height: 48px;
        border: 3px solid var(--border);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 20px auto;
      }
    `}</style>
  );
}

// ─── Utility functions ───────────────────────────────────────────────────────
function formatCFA(value) {
  return `${(value || 0).toLocaleString("fr-FR")} CFA`;
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

function combineDateAndTime(dateStr, time) {
  return new Date(`${dateStr}T${time}:00`);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function hhmm(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getStartOfWeek(dateInput) {
  const date = new Date(dateInput);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + diff);
  return date;
}

function makeUser(row) {
  if (!row) return { id: "", name: "Utilisateur", email: "", phone: "", role: "customer", isAdmin: false, memberStatus: null, daysLeft: 0, memberExpiry: null };
  const now    = new Date();
  const expiry = row.member_expiry ? new Date(row.member_expiry) : null;
  const active  = !!row.is_member && expiry && expiry > now;
  const expired = !!row.is_member && expiry && expiry <= now;
  return {
    id: row.id || "",
    name: row.full_name || "Utilisateur",
    email: row.email || "",
    phone: row.phone || "",
    role: row.role || "customer",
    isAdmin: row.role === "admin",
    memberStatus: active ? "active" : expired ? "expired" : null,
    daysLeft: expiry ? Math.max(0, Math.ceil((expiry - now) / 86400000)) : 0,
    memberExpiry: row.member_expiry || null,
  };
}

function expandBookingRow(row) {
  const start     = new Date(row.start_time);
  const dateStr   = toDateStr(start);
  const startTime = hhmm(start);
  const minutes   = row.duration || 15;
  const slots     = minutes >= 60 ? 4 : 1;
  const startIdx  = TIME_SLOTS.indexOf(startTime);
  if (startIdx === -1) return [];
  const times = TIME_SLOTS.slice(startIdx, startIdx + slots);

  const items = times.map((time, i) => ({
    id: `${row.id}_${i}`,
    sourceId: row.id,
    dateStr,
    time,
    type: row.price > 0 ? "booked" : "member",
    name: row.customer_name,
    phone: row.phone,
    isPrimary: i === 0,
    amount: i === 0 ? row.price || 0 : 0,
    durationLabel: minutes >= 60 ? "1 heure" : "15 min",
  }));

  const bufferTime = TIME_SLOTS[startIdx + slots];
  if (bufferTime) {
    items.push({ id: `${row.id}_buffer`, sourceId: row.id, dateStr, time: bufferTime, type: "buffer", isPrimary: false });
  }
  return items;
}

function expandBlockedRow(row) {
  const start     = new Date(row.start_time);
  const end       = new Date(row.end_time);
  const dateStr   = toDateStr(start);
  const startTime = hhmm(start);
  const blocks    = Math.max(1, Math.ceil((end - start) / 60000 / 20));
  const startIdx  = TIME_SLOTS.indexOf(startTime);
  if (startIdx === -1) return [];
  const times = TIME_SLOTS.slice(startIdx, startIdx + blocks);
  return times.map((time, i) => ({
    id: `blocked_${row.id}_${i}`,
    sourceId: row.id,
    dateStr,
    time,
    type: "blocked",
    reason: row.reason || "Bloqué",
    isPrimary: i === 0,
  }));
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toasts({ items }) {
  return (
    <div className="toast-wrap">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✗" : "ℹ"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ mode, onClose, onLogin, onRegister, onForgotPassword, onGoogleLogin }) {
  const [tab,  setTab]  = useState(mode || "login");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <div className="logo-btn" style={{ cursor: "default", width: 80, height: 80 }}>
          <LogoMark size={56} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button type="button" className={`btn ${tab === "login" ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1 }} onClick={() => setTab("login")}>
          Connexion
        </button>
        <button type="button" className={`btn ${tab === "register" ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1 }} onClick={() => setTab("register")}>
          Inscription
        </button>
      </div>

      {tab === "login" ? (
        <>
          <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
            <input type="email" placeholder="Email" value={form.email} onChange={upd("email")} />
            <input type="password" placeholder="Mot de passe" value={form.password} onChange={upd("password")} />
          </div>
          <button type="button" className="btn" style={{ background: "none", color: "var(--accent)", padding: "4px 0", marginBottom: 14 }} onClick={onForgotPassword}>
            Mot de passe oublié ?
          </button>
          <div style={{ display: "grid", gap: 10 }}>
            <button type="button" className="btn btn-primary" onClick={() => onLogin(form)}>Se connecter →</button>
            <button type="button" className="btn btn-ghost" onClick={onGoogleLogin}>Continuer avec Google</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
            <input placeholder="Nom complet" value={form.name} onChange={upd("name")} />
            <input placeholder="Téléphone (+228...)" value={form.phone} onChange={upd("phone")} />
            <input type="email" placeholder="Email" value={form.email} onChange={upd("email")} />
            <input type="password" placeholder="Mot de passe" value={form.password} onChange={upd("password")} />
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <button type="button" className="btn btn-primary" onClick={() => onRegister(form)}>Créer mon compte →</button>
            <button type="button" className="btn btn-ghost" onClick={onGoogleLogin}>Continuer avec Google</button>
          </div>
        </>
      )}

      <button type="button" onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>✕</button>
    </Modal>
  );
}

// ─── Forgot Password Modal ────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose, onSubmit }) {
  const [email, setEmail] = useState("");
  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Mot de passe oublié</h3>
      <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Annuler</button>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSubmit(email)} disabled={!email}>Envoyer</button>
      </div>
    </Modal>
  );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ onClose, onSubmit }) {
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const mismatch = confirm && password !== confirm;
  return (
    <Modal onClose={() => {}}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Nouveau mot de passe</h3>
      <div style={{ display: "grid", gap: 12, marginBottom: 8 }}>
        <input type="password" placeholder="Nouveau mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input type="password" placeholder="Confirmer" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {mismatch && <p style={{ color: "#fca5a5", fontSize: 13, marginBottom: 8 }}>Les mots de passe ne correspondent pas.</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Fermer</button>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSubmit(password)} disabled={!password || password !== confirm}>
          Sauvegarder
        </button>
      </div>
    </Modal>
  );
}

// ─── Booking Confirm Modal ────────────────────────────────────────────────────
function BookModal({ booking, isMember, onClose, onConfirm }) {
  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>
        {isMember ? "Réservation Membre (gratuite)" : "Confirmer la réservation"}
      </h3>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="list-row"><span className="muted">Créneau</span><strong>{booking.time}</strong></div>
        <div className="list-row"><span className="muted">Durée</span><strong>{booking.durationLabel}</strong></div>
        <div className="list-row">
          <span className="muted">Montant</span>
          <strong style={{ color: isMember ? "#6ee7b7" : "#fcd34d" }}>
            {isMember ? "0 CFA ✦ MEMBRE" : formatCFA(booking.amount)}
          </strong>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Annuler</button>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={onConfirm}>Confirmer →</button>
      </div>
    </Modal>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────
function EditUserModal({ userData, onClose, onSave }) {
  const [form, setForm] = useState({
    full_name: userData.full_name || "",
    phone:     userData.phone    || "",
    email:     userData.email    || "",
    role:      userData.role     || "customer",
    is_member: !!userData.is_member,
  });

  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Modifier utilisateur</h3>
      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Nom complet" />
        <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Téléphone" />
        <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
        <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
          <option value="customer">customer</option>
          <option value="admin">admin</option>
        </select>
        <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={form.is_member} onChange={(e) => setForm((p) => ({ ...p, is_member: e.target.checked }))} style={{ width: 16 }} />
          Membership actif
        </label>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Annuler</button>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave(form)}>Sauvegarder</button>
      </div>
    </Modal>
  );
}

// ─── Block Slot Modal ─────────────────────────────────────────────────────────
// FIX: was missing — admin block used inline modal that had no reason picker UI
function BlockModal({ slot, onClose, onBlock }) {
  const [reason, setReason] = useState("Maintenance");
  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginTop: 0, marginBottom: 8, color: "var(--danger)" }}>Bloquer ce créneau</h3>
      <p style={{ color: "var(--accent)", fontFamily: "monospace", marginBottom: 16, fontSize: 13 }}>
        {slot.dateStr} à {slot.time}
      </p>
      <label style={{ color: "var(--muted)", fontSize: 13, display: "block", marginBottom: 6 }}>Raison :</label>
      <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ marginBottom: 20 }}>
        <option>Maintenance</option>
        <option>Client walk-in cash</option>
        <option>Nettoyage</option>
        <option>Événement privé</option>
      </select>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Annuler</button>
        <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => onBlock(reason)}>Bloquer ✗</button>
      </div>
    </Modal>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────
function CalendarView({ user, bookings, onOpenBooking, onOpenBlock, addToast }) {
  const [weekOffset,       setWeekOffset]       = useState(0);
  const [selectedDate,     setSelectedDate]     = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0]);

  const weekDates = getWeekDates(weekOffset);
  const dateStr   = toDateStr(selectedDate);
  const today     = new Date(); today.setHours(0,0,0,0);

  // Build a quick lookup map for O(1) slot status queries
  const slotMap = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const key = `${b.dateStr}_${b.time}`;
      map[key] = b;
    });
    return map;
  }, [bookings]);

  function slotStatus(time) {
    const b = slotMap[`${dateStr}_${time}`];
    if (!b) return { type: "available" };
    if (b.type === "blocked") return { type: "blocked", label: b.reason || "Bloqué" };
    if (b.type === "buffer")  return { type: "buffer",  label: "buffer" };
    return { type: "booked", label: b.name || "Réservé" };
  }

  function handleClick(time) {
    const status = slotStatus(time);

    if (user?.isAdmin) {
      if (status.type === "available") onOpenBlock(dateStr, time);
      return;
    }
    if (!user) { addToast("Connectez-vous d'abord.", "info"); return; }
    if (status.type !== "available") return;

    // Check consecutive slots availability
    const startIdx = TIME_SLOTS.indexOf(time);
    const needed   = TIME_SLOTS.slice(startIdx, startIdx + selectedDuration.slots);
    if (needed.length !== selectedDuration.slots) { addToast("Créneau trop proche de la fermeture.", "error"); return; }
    const blocked = needed.some((t) => slotStatus(t).type !== "available");
    if (blocked) { addToast("Un ou plusieurs créneaux requis sont déjà pris.", "error"); return; }

    onOpenBooking({
      dateStr,
      time,
      durationLabel:   selectedDuration.label,
      durationMinutes: selectedDuration.minutes,
      amount: user.memberStatus === "active" ? 0 : selectedDuration.price,
    });
  }

  return (
    <>
      {/* Week picker */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setWeekOffset((v) => v - 1)}>← Précédente</button>
          <div className="muted">{MONTHS[weekDates[0].getMonth()]} {weekDates[0].getFullYear()}</div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setWeekOffset((v) => v + 1)}>Suivante →</button>
        </div>
        <div className="week-grid">
          {weekDates.map((d) => {
            const isActive  = d.toDateString() === selectedDate.toDateString();
            const isToday   = d.toDateString() === new Date().toDateString();
            const isPast    = d < today;
            return (
              <div
                key={d.toISOString()}
                className={`day-box ${isActive ? "active" : ""} ${isPast ? "past" : ""}`}
                onClick={() => !isPast && setSelectedDate(new Date(d))}
              >
                <div className="muted" style={{ fontSize: 10, letterSpacing: "0.05em" }}>{DAYS[d.getDay()]}</div>
                <div className="orbitron" style={{ fontWeight: 700, color: isToday ? "var(--accent3)" : undefined }}>{d.getDate()}</div>
                {isToday && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent3)", margin: "3px auto 0" }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Duration picker (non-admin only) */}
      {!user?.isAdmin && (
        <div className="grid-2">
          {DURATIONS.map((d) => (
            <div
              key={d.label}
              className="card"
              onClick={() => setSelectedDuration(d)}
              style={{ cursor: "pointer", borderColor: selectedDuration.label === d.label ? "var(--accent)" : "var(--border)", transition: "border-color 0.15s" }}
            >
              <div className="orbitron" style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>{d.label}</div>
              <div style={{ color: user?.memberStatus === "active" ? "#6ee7b7" : "#fcd34d", fontWeight: 700 }}>
                {user?.memberStatus === "active" ? "0 CFA ✦ MEMBRE" : formatCFA(d.price)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member badge */}
      {user?.memberStatus === "active" && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span>🏆</span>
          <span style={{ fontSize: 13, color: "#6ee7b7", fontWeight: 600 }}>
            Membre Actif — Sessions gratuites encore <strong>{user.daysLeft}</strong> jour{user.daysLeft !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Admin hint */}
      {user?.isAdmin && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 16, fontSize: 13, color: "#fca5a5" }}>
          ⚡ Mode Admin : cliquez sur un créneau <strong>disponible</strong> pour le bloquer.
        </div>
      )}

      {/* Slots grid */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <strong>Créneaux — {DAYS[selectedDate.getDay()]} {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}</strong>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="tag tag-cyan">Disponible</span>
            <span className="tag tag-purple">Réservé</span>
            <span className="tag tag-red">Bloqué</span>
          </div>
        </div>

        <div className="slots-grid">
          {TIME_SLOTS.map((time) => {
            const s   = slotStatus(time);
            const cls = s.type === "available" ? "available"
                      : s.type === "blocked"   ? "blocked"
                      : s.type === "buffer"    ? "buffer"
                      : "booked";
            return (
              <div key={time} className={`slot ${cls}`} onClick={() => handleClick(time)}>
                <div style={{ fontWeight: 700 }}>{time}</div>
                {s.label && s.type !== "available" && (
                  <div style={{ fontSize: 10, marginTop: 3, opacity: 0.8 }}>{s.label}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Membership Page ──────────────────────────────────────────────────────────
function MembershipPage({ user, onActivate }) {
  const isActive  = user?.memberStatus === "active";
  const isExpired = user?.memberStatus === "expired";
  const progress  = isActive ? Math.min(100, (user.daysLeft / 30) * 100) : 0;

  return (
    <>
      <div className="card" style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: "radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h2 className="orbitron" style={{ marginTop: 0, marginBottom: 4 }}>
                PASS <span className="accent">MEMBRE</span>
              </h2>
              <p className="muted" style={{ fontSize: 14 }}>Accès illimité pendant 30 jours.</p>
            </div>
            {isActive  && <span className="tag tag-green" style={{ fontSize: 13, padding: "6px 14px" }}>ACTIF</span>}
            {isExpired && <span className="tag tag-red"   style={{ fontSize: 13, padding: "6px 14px" }}>EXPIRÉ</span>}
            {!user?.memberStatus && <span className="tag tag-amber" style={{ fontSize: 13, padding: "6px 14px" }}>GUEST</span>}
          </div>

          {isActive && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span className="muted" style={{ fontSize: 13 }}>Expiration dans</span>
                <span className="accent" style={{ fontFamily: "monospace", fontSize: 13 }}>{user.daysLeft} jour{user.daysLeft !== 1 ? "s" : ""}</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: 12 }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="muted" style={{ fontSize: 12 }}>
                Expire le {new Date(user.memberExpiry).toLocaleDateString("fr-FR")}
              </p>
            </>
          )}

          {(!user || !isActive) && (
            <div style={{ padding: "16px", background: "var(--surface)", borderRadius: 10, margin: "16px 0" }}>
              <div className="list-row"><span className="muted" style={{ fontSize: 13 }}>Prix</span><span className="orbitron" style={{ fontSize: 20, color: "#fcd34d", fontWeight: 900 }}>10,000 CFA</span></div>
              <div className="list-row"><span className="muted" style={{ fontSize: 13 }}>Durée</span><span style={{ fontSize: 13 }}>30 jours</span></div>
              <div className="list-row"><span className="muted" style={{ fontSize: 13 }}>Réservations</span><span style={{ fontSize: 13, color: "#6ee7b7" }}>Illimitées · 0 CFA</span></div>
            </div>
          )}

          {!user ? (
            <p className="muted" style={{ fontSize: 13 }}>Connectez-vous pour activer le membership.</p>
          ) : !isActive ? (
            <button type="button" className="btn btn-purple" style={{ width: "100%", fontSize: 16, padding: 14 }} onClick={onActivate}>
              {isExpired ? "Renouveler le Pass →" : "Activer le Pass Membre →"}
            </button>
          ) : (
            <button type="button" className="btn btn-ghost" style={{ width: "100%" }} onClick={onActivate}>
              Renouveler maintenant
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="orbitron" style={{ marginTop: 0, marginBottom: 16, color: "var(--accent)" }}>AVANTAGES MEMBRES</h3>
        {[
          ["🎮", "Sessions VR gratuites",    "Réservez autant de créneaux que vous voulez à 0 CFA"],
          ["⚡", "Réservation instantanée",   "Pas de paiement à chaque session, confirmez en 1 clic"],
          ["📅", "Priorité calendrier",       "Accès en avant-première aux nouveaux créneaux"],
          ["🏆", "Statut Premium",            "Insigne membre sur votre profil"],
        ].map(([icon, title, desc]) => (
          <div key={title} className="list-row" style={{ gap: 14 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{title}</div>
              <div className="muted" style={{ fontSize: 13 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({ user, bookings }) {
  const mine = bookings.filter(
    (b) => b.phone === user?.phone && b.isPrimary && (b.type === "booked" || b.type === "member")
  );
  const isActive = user?.memberStatus === "active";

  return (
    <>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent2), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</div>
            <div className="muted" style={{ fontSize: 13 }}>{user?.email}</div>
            <div className="muted" style={{ fontSize: 13 }}>{user?.phone}</div>
          </div>
          {isActive && <span className="tag tag-green">MEMBRE ACTIF</span>}
        </div>
        {isActive && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="muted" style={{ fontSize: 13 }}>Pass expire dans</span>
              <span className="accent" style={{ fontFamily: "monospace", fontSize: 13 }}>{user.daysLeft} jours</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(user.daysLeft / 30) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="orbitron" style={{ marginTop: 0, marginBottom: 16, color: "var(--accent)" }}>MES RÉSERVATIONS</h3>
        {mine.length === 0 ? (
          <p className="muted" style={{ textAlign: "center", padding: "20px 0" }}>Aucune réservation pour le moment.</p>
        ) : (
          mine.map((b) => (
            <div key={b.id} className="list-row">
              <div>
                <div style={{ fontWeight: 600 }}>{b.dateStr} à {b.time}</div>
                <div className="muted" style={{ fontSize: 12 }}>{b.durationLabel}</div>
              </div>
              <span className={`tag ${b.type === "member" ? "tag-green" : "tag-amber"}`}>
                {b.type === "member" ? "0 CFA" : formatCFA(b.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ─── Dashboard Stat Card ──────────────────────────────────────────────────────
function DashboardStatCard({ icon: Icon, title, value, subtitle, color, bg }) {
  return (
    <div className="card stat-card" style={{ background: bg, borderColor: color }}>
      <div className="stat-icon-wrap" style={{ border: `1px solid ${color}` }}>
        <Icon size={24} color={color} strokeWidth={2.2} />
      </div>
      <div className="orbitron" style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.2, marginBottom: 6 }}>{value}</div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div className="muted" style={{ fontSize: 13 }}>{subtitle}</div>
    </div>
  );
}

function RevenueSourceBar({ label, value, color, width }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <strong style={{ fontSize: 14 }}>{label}</strong>
        <strong style={{ color, fontSize: 14 }}>{formatCFA(value)}</strong>
      </div>
      <div className="source-bar-track">
        <div className="source-bar-fill" style={{ width, background: color }} />
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ users, bookings, logs, onEditUser, onUnblock }) {
  const today        = new Date();
  const todayStr     = toDateStr(today);
  const startOfWeek  = getStartOfWeek(today);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const primaryBookings = bookings.filter(
    (b) => b.isPrimary && (b.type === "booked" || b.type === "member")
  );
  const todayBookings = primaryBookings.filter((b) => b.dateStr === todayStr);
  const blocked       = bookings.filter((b) => b.type === "blocked" && b.isPrimary);
  const paidBookings  = primaryBookings.filter((b) => Number(b.amount || 0) > 0);
  const memberBookings = primaryBookings.filter((b) => b.type === "member");

  const totalSales   = paidBookings.reduce((s, b) => s + Number(b.amount || 0), 0);
  const todaySales   = paidBookings.filter((b) => b.dateStr === todayStr).reduce((s, b) => s + Number(b.amount || 0), 0);
  const weeklySales  = paidBookings.filter((b) => new Date(`${b.dateStr}T${b.time}:00`) >= startOfWeek).reduce((s, b) => s + Number(b.amount || 0), 0);
  const monthlySales = paidBookings.filter((b) => new Date(`${b.dateStr}T${b.time}:00`) >= startOfMonth).reduce((s, b) => s + Number(b.amount || 0), 0);

  const recentSales = [...paidBookings]
    .sort((a, b) => new Date(`${b.dateStr}T${b.time}:00`) - new Date(`${a.dateStr}T${a.time}:00`))
    .slice(0, 10);

  const tmoneySales      = Math.round(totalSales * 0.55);
  const floozSales       = totalSales - tmoneySales;
  const membershipSales  = 0;
  const sourceMax = Math.max(tmoneySales, floozSales, membershipSales, 1);
  const sourceWidth = (v) => `${Math.max(4, (v / sourceMax) * 100)}%`;

  return (
    <>
      <div className="card admin-card-soft" style={{ paddingBottom: 12 }}>
        <div className="orbitron admin-panel-title" style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: "var(--accent)" }}>
          DASHBOARD ADMIN
        </div>
        <div className="muted">Vue d'ensemble des ventes, réservations et activité.</div>
        <div className="admin-highlight-line" />
      </div>

      <div className="grid-4">
        <DashboardStatCard icon={Wallet}     title="Revenus total"      value={formatCFA(totalSales)}  subtitle="Tous paiements confirmés"  color="#fbbf24" bg="linear-gradient(180deg, rgba(245,158,11,0.14), rgba(17,24,39,0.96))" />
        <DashboardStatCard icon={Gamepad2}   title="Sessions aujourd'hui" value={todayBookings.length} subtitle="Réservations du jour"       color="#00f5d4" bg="linear-gradient(180deg, rgba(0,245,212,0.12), rgba(17,24,39,0.96))" />
        <DashboardStatCard icon={Smartphone} title="T-Money / Flooz"    value={`${formatCFA(tmoneySales)} / ${formatCFA(floozSales)}`} subtitle="Répartition estimée" color="#c4b5fd" bg="linear-gradient(180deg, rgba(124,58,237,0.14), rgba(17,24,39,0.96))" />
        <DashboardStatCard icon={TrendingUp} title="Semaine en cours"   value={formatCFA(weeklySales)} subtitle="Performance hebdomadaire"   color="#6ee7b7" bg="linear-gradient(180deg, rgba(16,185,129,0.14), rgba(17,24,39,0.96))" />
      </div>

      <div className="grid-2">
        <div className="card admin-card-soft">
          <div className="orbitron admin-section-title"><Wallet size={18} color="var(--accent)" />REVENUS PAR SOURCE</div>
          <div style={{ display: "grid", gap: 18 }}>
            <RevenueSourceBar label="T-Money (Togocel)"     value={tmoneySales}     color="#60a5fa" width={sourceWidth(tmoneySales)} />
            <RevenueSourceBar label="Flooz (Moov Africa)"   value={floozSales}      color="#fb923c" width={sourceWidth(floozSales)} />
            <RevenueSourceBar label="Memberships (30j)"     value={membershipSales} color="#a78bfa" width={sourceWidth(membershipSales)} />
          </div>
        </div>

        <div className="card admin-card-soft">
          <div className="orbitron admin-section-title"><TrendingUp size={18} color="var(--accent)" />KPI RAPIDES</div>
          <div className="grid-2">
            {[
              { icon: CalendarDays, label: "Ventes du jour",       value: formatCFA(todaySales),   color: "var(--accent)",  borderColor: "rgba(0,245,212,0.18)",    bg: "rgba(0,245,212,0.04)" },
              { icon: TrendingUp,   label: "Ventes du mois",       value: formatCFA(monthlySales), color: "#c4b5fd",        borderColor: "rgba(124,58,237,0.2)",     bg: "rgba(124,58,237,0.05)" },
              { icon: Users,        label: "Réservations payées",   value: paidBookings.length,     color: "#fbbf24",        borderColor: "rgba(245,158,11,0.2)",     bg: "rgba(245,158,11,0.05)" },
              { icon: Crown,        label: "Sessions membres",       value: memberBookings.length,   color: "#6ee7b7",        borderColor: "rgba(16,185,129,0.2)",     bg: "rgba(16,185,129,0.05)" },
            ].map(({ icon: Icon, label, value, color, borderColor, bg }) => (
              <div key={label} className="kpi-box" style={{ border: `1px solid ${borderColor}`, background: bg }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Icon size={18} color={color} />
                  <div className="muted" style={{ fontSize: 12 }}>{label}</div>
                </div>
                <div className="orbitron" style={{ fontWeight: 800, fontSize: 20, color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card admin-card-soft">
        <div className="orbitron admin-section-title"><Gamepad2 size={18} color="var(--accent)" />RÉSERVATIONS DU JOUR — {todayStr}</div>
        {todayBookings.length === 0 ? (
          <p className="muted">Aucune réservation aujourd'hui.</p>
        ) : (
          todayBookings.map((b) => (
            <div key={b.id} className="list-row">
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span className="orbitron time-pill">{b.time}</span>
                <strong>{b.name || "Client"}</strong>
                <span className="muted" style={{ fontSize: 12 }}>{b.durationLabel}</span>
              </div>
              <span className={`tag ${b.type === "member" ? "tag-green" : "tag-amber"}`}>
                {b.type === "member" ? "MEMBRE · 0 CFA" : formatCFA(b.amount)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="card admin-card-soft">
        <div className="orbitron admin-section-title"><TrendingUp size={18} color="var(--accent)" />VENTES RÉCENTES</div>
        {recentSales.length === 0 ? (
          <p className="muted">Aucune vente enregistrée.</p>
        ) : (
          recentSales.map((sale) => (
            <div key={sale.id} className="list-row">
              <div>
                <div style={{ fontWeight: 600 }}>{sale.name || "Client"} — {sale.dateStr} à {sale.time}</div>
                <div className="muted" style={{ fontSize: 12 }}>{sale.durationLabel}</div>
              </div>
              <div className="sales-amount">{formatCFA(sale.amount)}</div>
            </div>
          ))
        )}
      </div>

      <div className="card admin-card-soft">
        <div className="orbitron admin-section-title"><Users size={18} color="var(--accent)" />UTILISATEURS</div>
        {users.length === 0 ? (
          <p className="muted">Aucun utilisateur.</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="list-row">
              <div>
                <div style={{ fontWeight: 600 }}>{u.full_name || "—"}</div>
                <div className="muted" style={{ fontSize: 12 }}>{u.email || "—"} · {u.phone || "—"}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className={`tag ${u.role === "admin" ? "tag-purple" : u.is_member ? "tag-green" : "tag-amber"}`}>
                  {u.role === "admin" ? "ADMIN" : u.is_member ? "MEMBRE" : "CLIENT"}
                </span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEditUser(u)}>Modifier</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card admin-card-soft">
        <div className="orbitron admin-section-title"><ShieldBan size={18} color="#fca5a5" />CRÉNEAUX BLOQUÉS</div>
        {blocked.length === 0 ? (
          <p className="muted">Aucun créneau bloqué.</p>
        ) : (
          blocked.map((b) => (
            <div key={b.id} className="list-row">
              <div>
                <div style={{ fontWeight: 600 }}>{b.dateStr} à {b.time}</div>
                <div className="muted" style={{ fontSize: 12 }}>{b.reason || "Bloqué"}</div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onUnblock(b)}>Débloquer</button>
            </div>
          ))
        )}
      </div>

      <div className="card admin-card-soft">
        <div className="orbitron admin-section-title"><CalendarDays size={18} color="var(--accent)" />JOURNAL ADMIN</div>
        {logs.length === 0 ? (
          <p className="muted">Aucune activité enregistrée.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="list-row">
              <div>
                <div style={{ fontWeight: 600 }}>{log.admin_name || "Admin"} · {log.action_type}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {log.target_table || "—"} · {log.created_at ? new Date(log.created_at).toLocaleString("fr-FR") : ""}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ─── App (root) ───────────────────────────────────────────────────────────────
export default function App() {
  const [page,         setPage]         = useState("calendar");
  const [user,         setUser]         = useState(null);
  const [rawUsers,     setRawUsers]     = useState([]);
  const [bookings,     setBookings]     = useState([]);
  const [logs,         setLogs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [authModal,    setAuthModal]    = useState(false);
  const [authMode,     setAuthMode]     = useState("login");
  const [forgotModal,  setForgotModal]  = useState(false);
  const [resetModal,   setResetModal]   = useState(false);
  const [bookingDraft, setBookingDraft] = useState(null);
  const [blockDraft,   setBlockDraft]   = useState(null);
  const [editUser,     setEditUser]     = useState(null);
  const [toasts,       setToasts]       = useState([]);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  const resetUi = useCallback(() => {
    setAuthModal(false);
    setForgotModal(false);
    setResetModal(false);
    setBookingDraft(null);
    setBlockDraft(null);
    setEditUser(null);
  }, []);

  // ── Data loaders ───────────────────────────────────────────────────────────
  const loadData = useCallback(async (currentUser) => {
    try {
      const [{ data: bData, error: bErr }, { data: blData, error: blErr }] = await Promise.all([
        supabase.from("bookings").select("*").order("start_time", { ascending: true }),
        supabase.from("blocked_slots").select("*").order("start_time", { ascending: true }),
      ]);

      if (bErr || blErr) {
        console.error("loadData error", bErr || blErr);
        addToast((bErr || blErr).message, "error");
        return;
      }

      const bookingItems = (bData || []).flatMap(expandBookingRow);
      const blockedItems = (blData || []).flatMap(expandBlockedRow);
      setBookings([...bookingItems, ...blockedItems]);

      if (currentUser?.isAdmin) {
        const [{ data: uData }, { data: lData }] = await Promise.all([
          supabase.from("users").select("*").order("created_at", { ascending: false }),
          supabase.from("admin_activity_logs").select("*").order("created_at", { ascending: false }),
        ]);
        setRawUsers(uData || []);
        setLogs(lData || []);
      }
    } catch (err) {
      console.error("loadData crash", err);
      addToast(err?.message || "Erreur chargement.", "error");
    }
  }, [addToast]);

  const ensureUserProfile = useCallback(async (authUser) => {
    if (!authUser?.id) return null;
    try {
      const { data: existing } = await supabase.from("users").select("*").eq("id", authUser.id).maybeSingle();
      if (existing) return existing;
      // Profile doesn't exist yet — return a minimal object (trigger/edge function should insert it)
      return {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Utilisateur",
        email: authUser.email || "",
        phone: authUser.user_metadata?.phone || "",
        role: "customer",
        is_member: false,
        member_expiry: null,
      };
    } catch (err) {
      console.error("ensureUserProfile error", err);
      return null;
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (error) { console.error("getSession error", error); setUser(null); await loadData(null); return; }

      const authUser = data?.session?.user;
      if (!authUser) { setUser(null); await loadData(null); return; }

      const row   = await ensureUserProfile(authUser);
      const built = makeUser(row || { id: authUser.id, full_name: authUser.email?.split("@")[0] || "Utilisateur", email: authUser.email || "", phone: "", role: "customer", is_member: false, member_expiry: null });
      setUser(built);
      await loadData(built);
    } catch (err) {
      console.error("loadCurrentUser crash", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [ensureUserProfile, loadData]);

  // ── Admin activity log helper ─────────────────────────────────────────────
  // FIX: defined as useCallback so it doesn't need to be called before its definition
  const logAdminAction = useCallback(async (actionType, targetTable, targetId, details = {}) => {
    if (!user?.isAdmin) return;
    try {
      await supabase.from("admin_activity_logs").insert({
        admin_user_id: user.id,
        admin_name:    user.name,
        action_type:   actionType,
        target_table:  targetTable,
        target_id:     targetId ? String(targetId) : null,
        details,
      });
    } catch (err) {
      console.error("logAdminAction error", err);
    }
  }, [user]);

  // ── Auth state listener ───────────────────────────────────────────────────
  useEffect(() => {
    loadCurrentUser();
    const { data: listener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") { setResetModal(true); return; }
      // SIGNED_IN / SIGNED_OUT handled by loadCurrentUser
      await loadCurrentUser();
    });
    return () => listener?.subscription?.unsubscribe?.();
  }, []); // intentionally empty — loadCurrentUser is stable via useCallback

  // ── Auth handlers ─────────────────────────────────────────────────────────
  async function handleLogin(form) {
    if (!form.email || !form.password) { addToast("Entrez votre email et mot de passe.", "error"); return; }
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
    if (error) { addToast(error.message, "error"); return; }
    if (!data?.user) { addToast("Aucun utilisateur trouvé.", "error"); return; }
    const row   = await ensureUserProfile(data.user);
    const built = makeUser(row || { id: data.user.id, full_name: data.user.email?.split("@")[0] || "Utilisateur", email: data.user.email || "", phone: "", role: "customer", is_member: false, member_expiry: null });
    setUser(built);
    resetUi();
    setPage(built.isAdmin ? "admin" : "calendar");
    await loadData(built);
    addToast(`Bienvenue, ${built.name} !`);
  }

  async function handleRegister(form) {
    if (!form.name || !form.phone || !form.email || !form.password) { addToast("Remplissez tous les champs.", "error"); return; }
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: { full_name: form.name, phone: form.phone }, emailRedirectTo: window.location.origin },
    });
    if (error) { addToast(error.message, "error"); return; }
    resetUi();
    if (data.session) {
      addToast("Compte créé et connecté !");
      await loadCurrentUser();
    } else {
      addToast("Compte créé ! Vérifiez votre email pour confirmer.", "info");
    }
  }

  async function handleForgotPassword(email) {
    if (!email) { addToast("Entrez votre email.", "error"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) { addToast(error.message, "error"); return; }
    setForgotModal(false);
    addToast("Email de réinitialisation envoyé.");
  }

  async function handleResetPassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { addToast(error.message, "error"); return; }
    setResetModal(false);
    addToast("Mot de passe mis à jour.");
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) addToast(error.message, "error");
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) { addToast(error.message, "error"); return; }
    setUser(null);
    setPage("calendar");
    setRawUsers([]);
    setLogs([]);
    setBookings([]);
    resetUi();
    addToast("Déconnecté.", "info");
    await loadData(null);
  }

  // ── Booking ───────────────────────────────────────────────────────────────
  async function confirmBooking() {
    if (!bookingDraft || !user) return;
    const start = combineDateAndTime(bookingDraft.dateStr, bookingDraft.time);
    const end   = addMinutes(start, bookingDraft.durationMinutes);
    const { error } = await supabase.from("bookings").insert({
      user_id:       user.id,
      customer_name: user.name,
      phone:         user.phone,
      start_time:    start.toISOString(),
      end_time:      end.toISOString(),
      duration:      bookingDraft.durationMinutes,
      price:         bookingDraft.amount,
      status:        "confirmed",
    });
    if (error) { addToast(error.message, "error"); return; }
    setBookingDraft(null);
    await loadData(user);
    addToast(`Session réservée à ${bookingDraft.time} !`);
  }

  // ── Block / Unblock ───────────────────────────────────────────────────────
  async function confirmBlock(reason) {
    if (!blockDraft || !user?.isAdmin) return;
    const start = combineDateAndTime(blockDraft.dateStr, blockDraft.time);
    const end   = addMinutes(start, 20);
    const { data, error } = await supabase.from("blocked_slots").insert({ start_time: start.toISOString(), end_time: end.toISOString(), reason }).select().single();
    if (error) { addToast(error.message, "error"); return; }
    await logAdminAction("BLOCK_SLOT", "blocked_slots", data?.id, { dateStr: blockDraft.dateStr, time: blockDraft.time, reason });
    setBlockDraft(null);
    await loadData(user);
    addToast(`Créneau ${blockDraft.time} bloqué : ${reason}`, "info");
  }

  async function handleUnblock(item) {
    const { error } = await supabase.from("blocked_slots").delete().eq("id", item.sourceId);
    if (error) { addToast(error.message, "error"); return; }
    await logAdminAction("UNBLOCK_SLOT", "blocked_slots", item.sourceId, { dateStr: item.dateStr, time: item.time });
    await loadData(user);
    addToast("Créneau débloqué.");
  }

  // ── Membership ────────────────────────────────────────────────────────────
  async function handleActivateMembership() {
    if (!user) return;
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase.from("users").update({ is_member: true, member_expiry: expiry }).eq("id", user.id).select().single();
    if (error) { addToast(error.message, "error"); return; }
    setUser(makeUser(data));
    await loadData(makeUser(data));
    addToast("🏆 Membership activé ! 30 jours d'accès gratuit.");
  }

  // ── Edit user (admin) ─────────────────────────────────────────────────────
  async function handleSaveUserEdit(form) {
    if (!editUser) return;
    const { error } = await supabase.from("users").update(form).eq("id", editUser.id);
    if (error) { addToast(error.message, "error"); return; }
    await logAdminAction("EDIT_USER", "users", editUser.id, form);
    setEditUser(null);
    await loadData(user);
    addToast("Utilisateur mis à jour.");
  }

  // ── Nav items ─────────────────────────────────────────────────────────────
  const navItems = useMemo(() =>
    user?.isAdmin
      ? [{ id: "admin", label: "Dashboard" }, { id: "calendar", label: "Calendrier" }]
      : [
          { id: "calendar",   label: "Réserver"   },
          { id: "membership", label: "Membership" },
          ...(user ? [{ id: "profile", label: "Profil" }] : []),
        ],
  [user]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <div className="page">
        <GlobalStyle />

        {/* Header */}
        <header className="header">
          <div className="container header-inner">
            <button type="button" className="logo-btn" onClick={() => { setPage("calendar"); resetUi(); }}>
              <LogoMark size={44} />
            </button>

            <div className="nav">
              {navItems.map((item) => (
                <div key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
                  {item.label}
                </div>
              ))}

              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
                  <div
                    style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent2), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                    onClick={() => setPage(user.isAdmin ? "admin" : "profile")}
                    title={user.name}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>Sortir</button>
                </div>
              ) : (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 4 }} onClick={() => { setAuthMode("login"); setAuthModal(true); }}>
                  Connexion
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="container" style={{ paddingTop: 24, paddingBottom: 90 }}>

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div className="spinner" />
              <p className="muted">Chargement…</p>
            </div>
          )}

          {!loading && (
            <>
              {/* Hero (unauthenticated) */}
              {!user && page === "calendar" && (
                <div className="hero" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,245,212,0.08))", borderColor: "rgba(124,58,237,0.3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span className="tag tag-cyan">OUVERT</span>
                    <span className="muted" style={{ fontSize: 11, fontFamily: "monospace" }}>09:00 – 20:40 · 7j/7</span>
                  </div>
                  <h1 className="orbitron" style={{ fontSize: 30, lineHeight: 1.15, marginBottom: 10, marginTop: 0 }}>
                    Vivez la réalité<br /><span className="accent">virtuelle</span> à Lomé
                  </h1>
                  <p className="muted" style={{ marginBottom: 20, fontSize: 15 }}>
                    Réservez votre session VR en ligne. Payez par T-Money ou Flooz.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button type="button" className="btn btn-primary" onClick={() => { setAuthMode("register"); setAuthModal(true); }}>
                      Créer un compte →
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => { setAuthMode("login"); setAuthModal(true); }}>
                      Se connecter
                    </button>
                  </div>
                </div>
              )}

              {page === "calendar"   && <CalendarView user={user} bookings={bookings} addToast={addToast} onOpenBooking={setBookingDraft} onOpenBlock={(dateStr, time) => setBlockDraft({ dateStr, time })} />}
              {page === "membership" && <MembershipPage user={user} onActivate={handleActivateMembership} />}
              {page === "profile"    && user && !user.isAdmin && <ProfilePage user={user} bookings={bookings} />}
              {page === "admin"      && user?.isAdmin && <AdminDashboard users={rawUsers} bookings={bookings} logs={logs} onEditUser={setEditUser} onUnblock={handleUnblock} />}
            </>
          )}
        </main>

        {/* Sticky bottom CTA (unauthenticated) */}
        {!user && !loading && (
          <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "14px 20px", background: "rgba(13,18,32,0.97)", borderTop: "1px solid var(--border)", backdropFilter: "blur(12px)", display: "flex", gap: 10, justifyContent: "center", zIndex: 20 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1, maxWidth: 200 }} onClick={() => { setAuthMode("login"); setAuthModal(true); }}>Se connecter</button>
            <button type="button" className="btn btn-primary" style={{ flex: 1, maxWidth: 200 }} onClick={() => { setAuthMode("register"); setAuthModal(true); }}>Créer un compte</button>
          </div>
        )}

        {/* Modals */}
        {authModal && (
          <AuthModal
            mode={authMode}
            onClose={() => setAuthModal(false)}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onForgotPassword={() => { setAuthModal(false); setForgotModal(true); }}
            onGoogleLogin={handleGoogleLogin}
          />
        )}

        {forgotModal && <ForgotPasswordModal onClose={() => setForgotModal(false)} onSubmit={handleForgotPassword} />}
        {resetModal  && <ResetPasswordModal  onClose={() => setResetModal(false)}  onSubmit={handleResetPassword} />}

        {bookingDraft && (
          <BookModal
            booking={bookingDraft}
            isMember={user?.memberStatus === "active"}
            onClose={() => setBookingDraft(null)}
            onConfirm={confirmBooking}
          />
        )}

        {/* FIX: was using an inline block modal — now uses proper BlockModal component with reason selector */}
        {blockDraft && (
          <BlockModal
            slot={blockDraft}
            onClose={() => setBlockDraft(null)}
            onBlock={confirmBlock}
          />
        )}

        {editUser && (
          <EditUserModal
            userData={editUser}
            onClose={() => setEditUser(null)}
            onSave={handleSaveUserEdit}
          />
        )}

        <Toasts items={toasts} />
      </div>
    </ErrorBoundary>
  );
}
