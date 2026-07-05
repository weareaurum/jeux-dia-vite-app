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
import { identify, reset, track } from "./lib/analytics";
import { emailWelcome, emailBookingConfirmed, emailPaymentConfirmed, emailMembershipActivated } from "./lib/email";
import jdLogo from "./assets/jdlo.png";

function LogoMark({ size = 64, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <img src={jdLogo} alt="Jeux Dia" width={size} height={size} style={{ objectFit: "contain", display: "block", background: "transparent" }} />
    </button>
  );
}

const TIME_SLOTS = [
  "09:00","09:20","09:40","10:00","10:20","10:40","11:00","11:20","11:40",
  "12:00","12:20","12:40","13:00","13:20","13:40","14:00","14:20","14:40",
  "15:00","15:20","15:40","16:00","16:20","16:40","17:00","17:20","17:40",
  "18:00","18:20","18:40","19:00","19:20","19:40","20:00"
];

const DURATIONS = [
  { label: "15 min", minutes: 15, slots: 1, price: 1000, people: "1 personne", desc: "Session solo" },
  { label: "1 heure", minutes: 60, slots: 4, price: 3000, people: "1–3 personnes", desc: "Session partagée" },
];

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ERROR BOUNDARY CAUGHT:", error, info);
  }

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
        background: rgba(13, 18, 32, 0.9);
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
        width: 74px;
        height: 74px;
        border-radius: 18px;
        padding: 8px;
        border: 1px solid rgba(0,245,212,0.25);
        background: linear-gradient(135deg, rgba(124,58,237,0.18), rgba(0,245,212,0.12));
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 18px rgba(0,245,212,0.18);
      }

      .logo-btn img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }

      .nav {
        display: flex;
        gap: 8px;
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
      .spinner {
        width: 48px; height: 48px;
        border: 3px solid var(--border);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 20px auto;
      }

      .hero, .card {
        background: rgba(17,24,39,0.88);
        border: 1px solid var(--border);
        border-radius: 16px;
      }

      .hero {
        padding: 24px;
        margin: 24px 0;
      }

      .card {
        padding: 20px;
        margin-bottom: 18px;
      }
.admin-panel-title {
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.stat-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.stat-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.06), transparent 40%);
  pointer-events: none;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 18px 40px rgba(0,0,0,0.28);
}

.stat-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(8px);
}

.kpi-box {
  padding: 16px;
  border-radius: 14px;
  transition: transform 0.16s ease, border-color 0.16s ease;
}

.kpi-box:hover {
  transform: translateY(-1px);
}

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
  background:
    linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)),
    rgba(17,24,39,0.92);
  border: 1px solid rgba(30,45,69,0.95);
  border-radius: 16px;
}

.admin-highlight-line {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, rgba(0,245,212,0.35), transparent);
  margin-top: 8px;
}

.sales-amount {
  font-weight: 800;
  color: #fbbf24;
}

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

@media (max-width: 700px) {
  .admin-panel-title {
    font-size: 18px !important;
  }
}
      .muted { color: var(--muted); }
      .accent { color: var(--accent); }

      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      .grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
      }

      .grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

@media (max-width: 900px) {
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
}

      @media (max-width: 700px) {
        .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
      }

      input, select {
        width: 100%;
        padding: 11px 13px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        font: inherit;
      }

      .week-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 8px;
      }

      .day-box {
        border-radius: 12px;
        border: 1px solid transparent;
        text-align: center;
        padding: 10px 6px;
        cursor: pointer;
      }

      .day-box.active {
        border-color: var(--accent);
        background: rgba(0,245,212,0.08);
      }

      .slots-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }

      @media (max-width: 700px) {
        .slots-grid { grid-template-columns: repeat(2, 1fr); }
      }

      .slot {
        border-radius: 10px;
        padding: 10px;
        border: 1px solid var(--border);
        font-size: 12px;
        min-height: 56px;
      }

      .slot.available {
        color: var(--accent);
        background: rgba(0,245,212,0.05);
        cursor: pointer;
      }

      .slot.booked {
        color: #c4b5fd;
        background: rgba(124,58,237,0.08);
      }

      .slot.blocked {
        color: #fca5a5;
        background: rgba(239,68,68,0.08);
      }

      .slot.buffer {
        color: var(--muted);
        background: rgba(100,116,139,0.08);
      }

      .tag {
        display: inline-block;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 700;
      }

      .tag-green { background: rgba(16,185,129,0.15); color: #6ee7b7; }
      .tag-red { background: rgba(239,68,68,0.15); color: #fca5a5; }
      .tag-purple { background: rgba(124,58,237,0.15); color: #c4b5fd; }
      .tag-cyan { background: rgba(0,245,212,0.12); color: var(--accent); }
      .tag-amber { background: rgba(245,158,11,0.15); color: #fcd34d; }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.65);
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
        padding: 22px;
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
        padding: 12px 14px;
        font-size: 14px;
        border: 1px solid;
      }

      .toast.success {
        background: rgba(16,185,129,0.12);
        border-color: rgba(16,185,129,0.35);
        color: #6ee7b7;
      }

      .toast.error {
        background: rgba(239,68,68,0.12);
        border-color: rgba(239,68,68,0.35);
        color: #fca5a5;
      }

      .toast.info {
        background: rgba(0,245,212,0.12);
        border-color: rgba(0,245,212,0.35);
        color: var(--accent);
      }

      .list-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--border);
      }

      /* ── TABLET (≤ 900px) ── */
      @media (max-width: 900px) {
        .container { padding: 0 16px; }
        .hero { padding: 18px; margin: 16px 0; }
        .card { padding: 16px; }
        .week-grid { gap: 4px; }
        .day-box { padding: 8px 3px; font-size: 11px; }
        .modal { padding: 18px; }
        .admin-section-title { font-size: 15px; }
      }

      /* ── MOBILE (≤ 640px) ── */
      @media (max-width: 640px) {
        .container { padding: 0 12px; }

        /* Header */
        .header-inner { min-height: 56px; gap: 8px; }
        .logo-btn { width: 48px; height: 48px; border-radius: 12px; padding: 6px; }

        /* Nav: wrap tightly, smaller items */
        .nav { gap: 2px; flex-wrap: wrap; }
        .nav-item { padding: 7px 9px; font-size: 11px; border-radius: 8px; }
        .btn-sm { padding: 7px 10px; font-size: 11px; }

        /* Cards & hero */
        .hero { padding: 14px; margin: 12px 0; }
        .card { padding: 14px; margin-bottom: 12px; }

        /* Calendar week grid — tighter on mobile */
        .week-grid { gap: 3px; }
        .day-box { padding: 6px 2px; border-radius: 8px; }
        .day-box .day-num { font-size: 14px; }
        .day-box .day-label { font-size: 9px; }

        /* Slots: 2 columns already but tighten */
        .slots-grid { gap: 6px; }
        .slot { padding: 8px 6px; font-size: 11px; min-height: 48px; }

        /* Grids collapse */
        .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }

        /* Admin */
        .admin-section-title { font-size: 13px; gap: 6px; margin-bottom: 12px; }
        .admin-card-soft { padding: 14px; }
        .stat-icon-wrap { width: 40px; height: 40px; border-radius: 10px; }
        .kpi-box { padding: 12px; }

        /* List rows: stack label+buttons vertically when tight */
        .list-row { flex-wrap: wrap; gap: 8px; }

        /* Modal: near full-screen */
        .modal-backdrop { padding: 8px; align-items: flex-end; }
        .modal {
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 16px 16px 12px 12px;
          padding: 16px;
        }

        /* Toast: full width */
        .toast-wrap { right: 8px; left: 8px; bottom: 8px; }
        .toast { min-width: unset; width: 100%; }

        /* Tags */
        .tag { font-size: 10px; padding: 3px 8px; }

        /* Buttons in flex rows */
        .btn { border-radius: 8px; }
      }

      /* ── VERY SMALL (≤ 380px) ── */
      @media (max-width: 380px) {
        .nav-item { padding: 6px 7px; font-size: 10px; }
        .day-box { padding: 4px 1px; }
      }

      /* ── Main content area ── */
      .main-content { padding-top: 24px; padding-bottom: 90px; }
      @media (max-width: 640px) {
        .main-content { padding-top: 16px; padding-bottom: 100px; }
      }

      /* ── Bottom CTA bar ── */
      .bottom-cta { padding: 14px; gap: 10px; }
      @media (max-width: 640px) {
        .bottom-cta { padding: 10px 12px; gap: 8px; }
        .bottom-cta .btn { flex: 1; padding: 12px 8px; font-size: 13px; }
      }

      /* ── Admin user table rows ── */
      @media (max-width: 640px) {
        .admin-user-row { flex-direction: column; align-items: flex-start !important; gap: 8px !important; }
        .admin-user-row .row-actions { align-self: flex-end; }
        .week-nav { font-size: 11px !important; gap: 6px !important; }
        .week-nav button { padding: 6px 10px !important; font-size: 11px !important; }
      }

      /* ── Scrollable admin tables on tablet ── */
      @media (max-width: 900px) {
        .scroll-x { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      }
    `}</style>
  );
}

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
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + diffToMonday);
  return date;
}

function makeUser(row) {
  if (!row) {
    return {
      id: "",
      name: "Utilisateur",
      email: "",
      phone: "",
      role: "customer",
      isAdmin: false,
      memberStatus: null,
      daysLeft: 0,
      memberExpiry: null,
    };
  }

  const now = new Date();
  const expiry = row?.member_expiry ? new Date(row.member_expiry) : null;
  const active = !!row?.is_member && expiry && expiry > now;
  const expired = !!row?.is_member && expiry && expiry <= now;

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
    loyaltyPoints: row.loyalty_points || 0,
  };
}

// Stripped version for calendar_slots view (no PII) — used for non-admin users
function expandCalendarRow(row) {
  const start = new Date(row.start_time);
  const dateStr = toDateStr(start);
  const startTime = hhmm(start);
  const minutes = row.duration || 15;
  const slots = minutes >= 60 ? 4 : 1;
  const startIndex = TIME_SLOTS.indexOf(startTime);
  const times = TIME_SLOTS.slice(startIndex, startIndex + slots);

  const items = times.map((time, i) => ({
    id: `${row.id}_${i}`,
    sourceId: row.id,
    dateStr,
    time,
    type: row.price > 0 ? "booked" : "member",
    isPrimary: i === 0,
    durationLabel: minutes >= 60 ? "1 heure" : "15 min",
  }));

  const bufferTime = TIME_SLOTS[startIndex + slots];
  if (bufferTime) {
    items.push({ id: `${row.id}_buffer`, sourceId: row.id, dateStr, time: bufferTime, type: "buffer", isPrimary: false });
  }
  return items;
}

function expandBookingRow(row) {
  const start = new Date(row.start_time);
  const dateStr = toDateStr(start);
  const startTime = hhmm(start);
  const minutes = row.duration || 15;
  const slots = minutes >= 60 ? 4 : 1;
  const startIndex = TIME_SLOTS.indexOf(startTime);
  const times = TIME_SLOTS.slice(startIndex, startIndex + slots);

  const items = times.map((time, i) => ({
    id: `${row.id}_${i}`,
    sourceId: row.id,
    dateStr,
    time,
    type: row.price > 0 ? "booked" : "member",
    name: row.customer_name,
    phone: row.phone,
    userId: row.user_id,
    isPrimary: i === 0,
    amount: i === 0 ? row.price || 0 : 0,
    durationLabel: minutes >= 60 ? "1 heure" : "15 min",
    paymentStatus: row.payment_status || "pending",
    paymentMethod: row.payment_method || null,
  }));

  const bufferTime = TIME_SLOTS[startIndex + slots];
  if (bufferTime) {
    items.push({
      id: `${row.id}_buffer`,
      sourceId: row.id,
      dateStr,
      time: bufferTime,
      type: "buffer",
      isPrimary: false,
    });
  }

  return items;
}

function expandBlockedRow(row) {
  const start = new Date(row.start_time);
  const end = new Date(row.end_time);
  const dateStr = toDateStr(start);
  const startTime = hhmm(start);
  const blocks = Math.max(1, Math.ceil((end - start) / 60000 / 20));
  const startIndex = TIME_SLOTS.indexOf(startTime);
  const times = TIME_SLOTS.slice(startIndex, startIndex + blocks);

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

function Toasts({ items }) {
  return (
    <div className="toast-wrap">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function AuthModal({
  mode,
  onClose,
  onLogin,
  onRegister,
  onForgotPassword,
  onGoogleLogin,
}) {
  const [tab, setTab] = useState(mode || "login");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", confirmPassword: "" });
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [pwError, setPwError] = useState("");

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "confirmPassword" || key === "password") setPwError("");
  }

  async function submitLogin() {
    if (submitting) return;
    setSubmitting(true);
    try { await onLogin(form); } finally { setSubmitting(false); }
  }

  async function submitRegister() {
    if (submitting) return;
    if (form.password !== form.confirmPassword) {
      setPwError("Les mots de passe ne correspondent pas.");
      return;
    }
    setPwError("");
    setSubmitting(true);
    try {
      const result = await onRegister(form);
      if (result === "email_required") setRegistered(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (registered) {
    return (
      <Modal onClose={onClose}>
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
          <h3 style={{ marginTop: 0, color: "var(--accent)" }}>Compte créé !</h3>
          <div style={{ background: "rgba(0,245,212,0.07)", border: "1px solid var(--accent)", borderRadius: 12, padding: "16px", margin: "16px 0", textAlign: "left" }}>
            <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Un email de confirmation a été envoyé à :</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>{form.email}</p>
            <p style={{ margin: "10px 0 0", fontSize: 13 }} className="muted">Cliquez sur le lien dans l'email pour activer votre compte, puis connectez-vous.</p>
          </div>
          <button type="button" className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} onClick={onClose}>
            Compris
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={submitting ? undefined : onClose}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <div className="logo-btn" style={{ width: 110, height: 110, cursor: "default" }}>
          <img src={jdLogo} alt="Jeux Dia" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button type="button" className={`btn ${tab === "login" ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1 }} onClick={() => setTab("login")} disabled={submitting}>
          Connexion
        </button>
        <button type="button" className={`btn ${tab === "register" ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1 }} onClick={() => setTab("register")} disabled={submitting}>
          Inscription
        </button>
      </div>

      {tab === "login" ? (
        <>
          <div style={{ display: "grid", gap: 12 }}>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              onInput={(e) => update("email", e.target.value)}
              disabled={submitting}
              autoComplete="email"
            />
            <input
              className="input"
              type="password"
              name="password"
              placeholder="Mot de passe"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              onInput={(e) => update("password", e.target.value)}
              disabled={submitting}
              autoComplete="current-password"
              onKeyDown={(e) => e.key === "Enter" && submitLogin()}
            />
          </div>

          <div style={{ marginTop: 10, marginBottom: 16 }}>
            <button
              type="button"
              className="btn"
              style={{ background: "none", color: "var(--accent)", padding: 0 }}
              onClick={onForgotPassword}
              disabled={submitting}
            >
              Mot de passe oublié ?
            </button>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <button type="button" className="btn btn-primary" onClick={submitLogin} disabled={submitting}>
              {submitting ? "Connexion…" : "Se connecter →"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onGoogleLogin} disabled={submitting}>
              Continuer avec Google
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "grid", gap: 12 }}>
            <input
              className="input"
              placeholder="Nom complet"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              disabled={submitting}
              autoComplete="name"
            />
            <input
              className="input"
              placeholder="Téléphone"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              disabled={submitting}
              autoComplete="tel"
            />
            <input
              className="input"
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              onInput={(e) => update("email", e.target.value)}
              disabled={submitting}
              autoComplete="email"
            />
            <input
              className="input"
              type="password"
              name="new-password"
              placeholder="Mot de passe"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              onInput={(e) => update("password", e.target.value)}
              disabled={submitting}
              autoComplete="new-password"
            />
            <input
              className="input"
              type="password"
              name="confirm-password"
              placeholder="Confirmer le mot de passe"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              onInput={(e) => update("confirmPassword", e.target.value)}
              disabled={submitting}
              autoComplete="new-password"
              onKeyDown={(e) => e.key === "Enter" && submitRegister()}
            />
            {pwError && <p style={{ color: "#fca5a5", fontSize: 12, margin: 0 }}>{pwError}</p>}
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-primary" onClick={submitRegister} disabled={submitting}>
              {submitting ? "Création…" : "Créer mon compte →"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onGoogleLogin} disabled={submitting}>
              Continuer avec Google
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function ForgotPasswordModal({ onClose, onSubmit }) {
  const [email, setEmail] = useState("");

  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginTop: 0 }}>Mot de passe oublié</h3>
      <p className="muted">Entrez votre email.</p>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
          Annuler
        </button>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSubmit(email)}>
          Envoyer
        </button>
      </div>
    </Modal>
  );
}

function ResetPasswordModal({ onClose, onSubmit }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <Modal onClose={() => {}}>
      <h3 style={{ marginTop: 0 }}>Nouveau mot de passe</h3>
      <div style={{ display: "grid", gap: 12 }}>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirmer"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {confirm && password !== confirm && (
        <p style={{ color: "#fca5a5" }}>Les mots de passe ne correspondent pas.</p>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
          Fermer
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={() => onSubmit(password)}
          disabled={!password || password !== confirm}
        >
          Sauvegarder
        </button>
      </div>
    </Modal>
  );
}

function MembershipPayModal({ onClose, onConfirm }) {
  const [paying, setPaying] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [promoCode, setPromoCode] = React.useState("");
  const [promoResult, setPromoResult] = React.useState(null);
  const [promoError, setPromoError] = React.useState("");
  const [checking, setChecking] = React.useState(false);

  const BASE_PRICE = 10000;
  const promoDiscount = promoResult
    ? promoResult.discount_type === "percent"
      ? Math.round(BASE_PRICE * promoResult.discount_value / 100)
      : Math.min(promoResult.discount_value, BASE_PRICE)
    : 0;
  const finalPrice = BASE_PRICE - promoDiscount;

  async function checkPromo() {
    if (!promoCode.trim()) return;
    setPromoError(""); setPromoResult(null); setChecking(true);
    try {
      const sb = (await import("./lib/supabase")).supabase;
      const { data, error } = await sb.from("promo_codes")
        .select("*").eq("code", promoCode.trim().toUpperCase()).single();
      if (error || !data) { setPromoError("Code invalide."); return; }
      if (!data.is_active) { setPromoError("Code désactivé."); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setPromoError("Code expiré."); return; }
      if (data.max_uses !== null && data.uses_count >= data.max_uses) { setPromoError("Code épuisé."); return; }
      const mTypes = Array.isArray(data.applicable_to) ? data.applicable_to : (data.applicable_to ? [data.applicable_to] : []);
      if (mTypes.length > 0 && !mTypes.includes("membership")) {
        setPromoError("Ce code n'est pas valable pour le Pass Membre."); return;
      }
      setPromoResult(data);
    } finally { setChecking(false); }
  }

  async function handleConfirm() {
    setPaying(true);
    await onConfirm(promoResult);
    setDone(true);
  }

  if (done) {
    return (
      <Modal onClose={onClose}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <h3 style={{ color: "var(--accent)", marginTop: 0 }}>Demande en attente</h3>
          <p className="muted" style={{ fontSize: 13 }}>L'admin activera votre pass après vérification du paiement.</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 8, width: "100%" }} onClick={onClose}>Compris</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginTop: 0 }}>Activer le Pass Membre</h3>
      <div className="card" style={{ marginBottom: 0, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)" }}>
        <div className="list-row">
          <span className="muted">Pass</span>
          <strong>30 jours illimités</strong>
        </div>
        {promoResult && (
          <div className="list-row">
            <span className="muted">Réduction ({promoResult.code})</span>
            <strong style={{ color: "#86efac" }}>-{promoResult.discount_type === "percent" ? `${promoResult.discount_value}%` : `${promoDiscount.toLocaleString()} CFA`}</strong>
          </div>
        )}
        <div className="list-row" style={{ borderBottom: "none" }}>
          <span className="muted">Montant</span>
          <strong style={{ color: "#fcd34d" }}>{finalPrice === 0 ? "GRATUIT" : `${finalPrice.toLocaleString()} CFA`}</strong>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input className="input" placeholder="Code promo (optionnel)" value={promoCode}
          onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); setPromoError(""); }}
          onKeyDown={e => e.key === "Enter" && checkPromo()}
          style={{ flex: 1, fontSize: 13 }} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={checkPromo} disabled={checking || !promoCode.trim()}>
          {checking ? "..." : "Appliquer"}
        </button>
      </div>
      {promoError && <p style={{ color: "#fca5a5", fontSize: 12, margin: "4px 0 0" }}>{promoError}</p>}
      {promoResult && <p style={{ color: "#86efac", fontSize: 12, margin: "4px 0 0" }}>Code appliqué !</p>}
      <div style={{ background: "rgba(0,245,212,0.07)", border: "1px solid rgba(0,245,212,0.3)", borderRadius: 10, padding: "14px 16px", margin: "14px 0", fontSize: 13 }}>
        <p style={{ margin: "0 0 6px", fontWeight: 700 }}>Envoyez 10,000 CFA via Mixx au :</p>
        <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--accent)", letterSpacing: 2 }}>+228 93 69 54 63</p>
        <p style={{ margin: "8px 0 0", fontSize: 12 }} className="muted">Mentionnez votre nom en référence.</p>
      </div>
      <p className="muted" style={{ fontSize: 12 }}>Après paiement, cliquez "J'ai payé" — l'admin activera votre pass dès vérification.</p>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={paying}>Annuler</button>
        <button type="button" className="btn btn-primary" style={{ flex: 1, background: "var(--purple)" }} onClick={handleConfirm} disabled={paying}>
          {paying ? "Envoi..." : "J'ai payé"}
        </button>
      </div>
    </Modal>
  );
}

function loadPaydunyaScript() {
  return new Promise((resolve, reject) => {
    if (window.PDCheckout) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://app.paydunya.com/assets/js/checkout.min.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("PayDunya script failed to load"));
    document.head.appendChild(s);
  });
}

function BookModal({ booking, isMember, user, onClose, onConfirm }) {
  const [promoCode, setPromoCode]   = React.useState("");
  const [promoResult, setPromoResult] = React.useState(null);
  const [promoError, setPromoError] = React.useState("");
  const [checking, setChecking]     = React.useState(false);
  const [phone, setPhone]           = React.useState("");
  const [network, setNetwork]       = React.useState("tmoney");
  const [paying, setPaying]         = React.useState(false);
  const [paid, setPaid]             = React.useState(false);
  const [payError, setPayError]     = React.useState("");
  const [guestCount, setGuestCount] = React.useState(0);
  const [usePoints, setUsePoints]   = React.useState(false);
  // PayDunya inline state
  const [pdState, setPdState]       = React.useState(null); // null | "opening" | "checkout" | "checking" | "success"
  const [pdBookingId, setPdBookingId] = React.useState(null);

  const canHaveGuests = isMember && booking.durationMinutes >= 60;
  const GUEST_PRICE = 3000;
  const guestTotal = canHaveGuests ? guestCount * GUEST_PRICE : 0;

  const baseAmount  = isMember ? guestTotal : booking.amount;
  const promoDiscount = promoResult
    ? promoResult.type === "percent"
      ? Math.round(baseAmount * promoResult.discount / 100)
      : Math.min(promoResult.discount, baseAmount)
    : 0;
  const availablePoints = user?.loyaltyPoints || 0;
  // 10 pts = 1,000 CFA; max points discount capped at baseAmount - promoDiscount
  const maxPointsDiscount = Math.floor(availablePoints / 10) * 1000;
  const pointsDiscount = usePoints ? Math.min(maxPointsDiscount, Math.max(0, baseAmount - promoDiscount)) : 0;
  const pointsUsed = pointsDiscount > 0 ? Math.ceil(pointsDiscount / 1000) * 10 : 0;
  const discount = promoDiscount;
  const finalAmount = Math.max(0, baseAmount - promoDiscount - pointsDiscount);

  async function checkPromo() {
    if (!promoCode.trim()) return;
    setChecking(true); setPromoError(""); setPromoResult(null);
    const { data, error } = await supabase
      .from("promo_codes").select("*")
      .eq("code", promoCode.trim().toUpperCase()).eq("is_active", true).single();
    setChecking(false);
    if (error || !data) { setPromoError("Code invalide."); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setPromoError("Code expiré."); return; }
    if (data.max_uses !== null && data.uses_count >= data.max_uses) { setPromoError("Code épuisé."); return; }

    // Check applicable_to restriction (array — empty means all)
    const types = Array.isArray(data.applicable_to) ? data.applicable_to : (data.applicable_to ? [data.applicable_to] : []);
    if (types.length > 0) {
      if (types.includes("membership") && !types.includes("15min") && !types.includes("1hr")) { setPromoError("Ce code est valable pour le Pass Membre uniquement."); return; }
      if (types.includes("evenements") && !types.includes("15min") && !types.includes("1hr")) { setPromoError("Ce code est valable pour les Événements uniquement."); return; }
      if (types.includes("15min") && !types.includes("1hr") && booking.durationMinutes >= 60) { setPromoError("Ce code est valable pour les sessions 15 min uniquement."); return; }
      if (types.includes("1hr") && !types.includes("15min") && booking.durationMinutes < 60) { setPromoError("Ce code est valable pour les sessions 1 heure uniquement."); return; }
    }

    // Check applicable_days restriction
    if (data.applicable_days?.length) {
      const bookingDay = new Date(booking.dateStr + "T00:00:00").getDay();
      if (!data.applicable_days.includes(bookingDay)) {
        const dayNames = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
        setPromoError(`Ce code est valable seulement le : ${data.applicable_days.sort().map(d => dayNames[d]).join(", ")}.`);
        return;
      }
    }

    // Check applicable_time restriction
    if (data.applicable_time_start && data.applicable_time_end && booking.time) {
      const bookingMinutes = parseInt(booking.time.split(":")[0]) * 60 + parseInt(booking.time.split(":")[1]);
      const startMinutes = parseInt(data.applicable_time_start.split(":")[0]) * 60 + parseInt(data.applicable_time_start.split(":")[1]);
      const endMinutes = parseInt(data.applicable_time_end.split(":")[0]) * 60 + parseInt(data.applicable_time_end.split(":")[1]);
      if (bookingMinutes < startMinutes || bookingMinutes >= endMinutes) {
        setPromoError(`Ce code est valable entre ${data.applicable_time_start.slice(0,5)} et ${data.applicable_time_end.slice(0,5)}.`);
        return;
      }
    }

    setPromoResult({ discount: data.discount_value, type: data.discount_type, id: data.id, code: data.code });
  }

  async function handlePay() {
    if (finalAmount === 0) { onConfirm(promoResult, 0, null, guestCount, pointsUsed); return; }
    setPaying(true); setPayError("");
    try {
      if (network === "paydunya") {
        await handlePaydunyaInline();
      } else {
        await onConfirm(promoResult, finalAmount, network, guestCount, pointsUsed);
        setPaid(true);
      }
    } catch (err) {
      setPayError("Erreur. Réessayez.");
      setPaying(false);
    }
  }

  async function handlePaydunyaInline() {
    setPdState("opening");
    // Step 1: reserve the slot (creates booking with paydunya_pending)
    const result = await onConfirm(promoResult, finalAmount, "paydunya", guestCount, pointsUsed);
    const bookingId = result?.bookingId;
    if (!bookingId) { setPaying(false); setPdState(null); return; }
    setPdBookingId(bookingId);

    // Step 2: create PayDunya invoice
    const durationLabel = booking.durationMinutes >= 60 ? "1 heure" : "15 min";
    const { data: inv, error: invErr } = await supabase.functions.invoke("paydunya-create-invoice", {
      body: {
        bookingId,
        amount: finalAmount,
        description: `Session VR ${durationLabel} — ${booking.dateStr} ${booking.time}`,
        customerName: user?.name,
        customerEmail: user?.email,
        customerPhone: user?.phone,
      },
    });

    if (invErr || !inv?.token) {
      // Release the reserved slot
      await supabase.from("bookings").delete().eq("id", bookingId);
      setPdBookingId(null);
      setPdState(null);
      setPaying(false);
      setPayError("Service PayDunya indisponible. Réessayez ou choisissez Mixx/Cash.");
      return;
    }

    // Step 3: load PayDunya inline JS and open overlay
    try {
      await loadPaydunyaScript();
    } catch (_) {
      // Script failed to load — fallback: open PayDunya hosted page in same tab
      window.location.href = inv.checkout_url || `https://app.paydunya.com/checkout/invoice/${inv.token}`;
      return;
    }

    setPdState("checkout");
    setPaying(false);
    // PDCheckout.open shows an overlay on top of the current page
    if (window.PDCheckout?.open) {
      window.PDCheckout.open(inv.token);
    } else if (window.PDCheckout?.loadPDCheckout) {
      window.PDCheckout.loadPDCheckout(inv.token);
    }
  }

  async function checkPaydunyaStatus() {
    if (!pdBookingId) return;
    setPdState("checking");
    const { data } = await supabase
      .from("bookings").select("payment_status").eq("id", pdBookingId).single();
    if (data?.payment_status === "paid") {
      setPdState("success");
    } else {
      setPdState("checkout");
      setPayError("Paiement non encore reçu. Complétez le paiement puis vérifiez à nouveau.");
    }
  }

  async function cancelPaydunya() {
    if (pdBookingId) {
      await supabase.from("bookings").delete().eq("id", pdBookingId);
    }
    setPdBookingId(null);
    setPdState(null);
    setPayError("");
    setPaying(false);
  }

  if (paid) {
    return (
      <Modal onClose={onClose}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <h3 style={{ color: "var(--accent)", marginTop: 0 }}>Réservation en attente</h3>
          <div style={{ background: "rgba(0,245,212,0.07)", border: "1px solid var(--accent)", borderRadius: 12, padding: "16px", margin: "16px 0", textAlign: "left" }}>
            <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Envoyez {formatCFA(finalAmount)} via Mixx au :</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--accent)", letterSpacing: 2 }}>+228 93 69 54 63</p>
            <p style={{ margin: "8px 0 0", fontSize: 12 }} className="muted">Mentionnez votre nom en référence.</p>
          </div>
          <p className="muted" style={{ fontSize: 13 }}>L'admin confirmera votre paiement et vous serez notifié(e) dès que votre réservation est validée.</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 8, width: "100%" }} onClick={onClose}>Compris</button>
        </div>
      </Modal>
    );
  }

  if (pdState === "success") {
    return (
      <Modal onClose={onClose}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h3 style={{ color: "#6ee7b7", marginTop: 0 }}>Paiement confirmé !</h3>
          <p className="muted" style={{ fontSize: 14 }}>Votre réservation est validée. À bientôt chez Jeux Dia VR !</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 16, width: "100%" }} onClick={onClose}>Fermer</button>
        </div>
      </Modal>
    );
  }

  if (pdState === "opening" || pdState === "checkout" || pdState === "checking") {
    return (
      <Modal onClose={onClose}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
          <h3 style={{ marginTop: 0 }}>Paiement PayDunya</h3>
          {pdState === "opening" && (
            <p className="muted">Ouverture du paiement en cours…</p>
          )}
          {(pdState === "checkout" || pdState === "checking") && (
            <>
              <p style={{ marginBottom: 4 }}>
                La fenêtre PayDunya est ouverte sur cette page.
              </p>
              <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
                Complétez le paiement de <strong>{formatCFA(finalAmount)}</strong> dans la fenêtre PayDunya, puis cliquez sur le bouton ci-dessous.
              </p>
              {payError && <p style={{ color: "#fca5a5", fontSize: 13, marginBottom: 12 }}>{payError}</p>}
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%", marginBottom: 10 }}
                onClick={checkPaydunyaStatus}
                disabled={pdState === "checking"}
              >
                {pdState === "checking" ? "Vérification…" : "✓ J'ai payé — Vérifier"}
              </button>
            </>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: "100%", color: "#fca5a5" }}
            onClick={cancelPaydunya}
            disabled={pdState === "opening" || pdState === "checking"}
          >
            Annuler le paiement
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginTop: 0 }}>
        {isMember ? "Réservation Membre" : "Payer et réserver"}
      </h3>

      <div className="card" style={{ marginBottom: 0 }}>
        <div className="list-row">
          <span className="muted">Créneau</span>
          <strong>{booking.time}</strong>
        </div>
        <div className="list-row">
          <span className="muted">Durée</span>
          <strong>{booking.durationLabel}</strong>
        </div>
        {(promoResult || pointsDiscount > 0) && (
          <>
            <div className="list-row">
              <span className="muted">Prix de base</span>
              <span>{formatCFA(baseAmount)}</span>
            </div>
            {promoResult && (
              <div className="list-row">
                <span className="muted" style={{ color: "#6ee7b7" }}>Code {promoResult.code}</span>
                <span style={{ color: "#6ee7b7" }}>−{formatCFA(promoDiscount)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="list-row">
                <span className="muted" style={{ color: "#fbbf24" }}>Points ({pointsUsed} pts)</span>
                <span style={{ color: "#fbbf24" }}>−{formatCFA(pointsDiscount)}</span>
              </div>
            )}
          </>
        )}
        <div className="list-row" style={{ borderBottom: (canHaveGuests || (availablePoints >= 10 && baseAmount > 0)) ? undefined : "none" }}>
          <span className="muted">Montant</span>
          <strong style={{ color: (promoResult || pointsDiscount > 0) ? "#6ee7b7" : "var(--accent)" }}>
            {finalAmount === 0 ? (isMember ? "Gratuit (membre)" : "Gratuit") : formatCFA(finalAmount)}
          </strong>
        </div>
        {availablePoints >= 10 && baseAmount > 0 && !isMember && (
          <div className="list-row" style={{ borderBottom: canHaveGuests ? undefined : "none", alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 13 }}>⭐ {availablePoints} points disponibles</span>
            <button type="button"
              onClick={() => setUsePoints(u => !u)}
              style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: `1.5px solid ${usePoints ? "#fbbf24" : "var(--border)"}`,
                background: usePoints ? "rgba(251,191,36,0.12)" : "transparent",
                color: usePoints ? "#fbbf24" : "var(--muted)" }}>
              {usePoints ? `−${formatCFA(pointsDiscount)} appliqué` : "Utiliser mes points"}
            </button>
          </div>
        )}
        {canHaveGuests && (
          <div className="list-row" style={{ borderBottom: "none", alignItems: "center" }}>
            <span className="muted">Invités (3,000 CFA / pers.)</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" className="btn btn-ghost btn-sm" style={{ padding: "2px 10px", fontSize: 18 }}
                onClick={() => setGuestCount(g => Math.max(0, g - 1))}>−</button>
              <span style={{ fontWeight: 700, minWidth: 16, textAlign: "center" }}>{guestCount}</span>
              <button type="button" className="btn btn-ghost btn-sm" style={{ padding: "2px 10px", fontSize: 18 }}
                onClick={() => setGuestCount(g => Math.min(2, g + 1))}>+</button>
            </div>
          </div>
        )}
      </div>

      {isMember && canHaveGuests && guestCount > 0 && (
        <>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "16px 0 8px" }}>Paiement pour {guestCount} invité{guestCount > 1 ? "s" : ""} ({formatCFA(finalAmount)})</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {["tmoney", "cash"].map((n) => (
              <button key={n} type="button" onClick={() => setNetwork(n)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `2px solid ${network === n ? "var(--accent)" : "var(--border)"}`,
                  background: network === n ? "rgba(0,245,212,0.1)" : "transparent",
                  color: network === n ? "var(--accent)" : "var(--muted)", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                {n === "tmoney" ? "Mixx" : "Cash"}
              </button>
            ))}
          </div>
          {network === "tmoney" && (
            <div style={{ background: "rgba(0,245,212,0.07)", border: "1px solid rgba(0,245,212,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
              Envoyez <strong>{formatCFA(finalAmount)}</strong> au <strong>+228 93 69 54 63</strong> via Mixx pour les invités.
            </div>
          )}
          {payError && <p style={{ color: "#fca5a5", fontSize: 12, marginTop: 6 }}>{payError}</p>}
        </>
      )}

      {!isMember && (
        <>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="Code promo"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value); setPromoResult(null); setPromoError(""); }}
              style={{ flex: 1, textTransform: "uppercase" }}
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={checkPromo} disabled={checking}>
              {checking ? "..." : "Appliquer"}
            </button>
          </div>
          {promoError && <p style={{ color: "#fca5a5", fontSize: 12, marginTop: 6 }}>{promoError}</p>}
          {promoResult && <p style={{ color: "#6ee7b7", fontSize: 12, marginTop: 6 }}>✓ Réduction appliquée !</p>}

          <p style={{ fontSize: 12, color: "var(--muted)", margin: "16px 0 8px" }}>Mode de paiement</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {["tmoney", "paydunya", "cash"].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNetwork(n)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: `2px solid ${network === n ? "var(--accent)" : "var(--border)"}`,
                  background: network === n ? "rgba(0,245,212,0.1)" : "transparent",
                  color: network === n ? "var(--accent)" : "var(--muted)", fontWeight: 700, cursor: "pointer", fontSize: 13,
                }}
              >
                {n === "tmoney" ? "Mixx" : n === "paydunya" ? "PayDunya" : "Cash"}
              </button>
            ))}
          </div>
          {network === "tmoney" && (
            <div style={{ background: "rgba(0,245,212,0.07)", border: "1px solid rgba(0,245,212,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
              Envoyez <strong>{formatCFA(finalAmount)}</strong> au <strong>+228 93 69 54 63</strong> via Mixx. Votre réservation sera confirmée après vérification.
            </div>
          )}
          {network === "paydunya" && (
            <div style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
              Vous serez redirigé(e) vers PayDunya pour payer <strong>{formatCFA(finalAmount)}</strong> en ligne (Mobile Money, carte, etc.).
            </div>
          )}
          {payError && <p style={{ color: "#fca5a5", fontSize: 12, marginTop: 6 }}>{payError}</p>}
        </>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={paying}>
          Annuler
        </button>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handlePay} disabled={paying}>
          {paying ? "..." : isMember && finalAmount === 0 ? "Confirmer" : network === "paydunya" ? `Payer avec PayDunya →` : `Payer ${formatCFA(finalAmount)}`}
        </button>
      </div>
    </Modal>
  );
}

function EditUserModal({ userData, onClose, onSave }) {
  const [form, setForm] = useState({
    full_name: userData.full_name || "",
    phone: userData.phone || "",
    email: userData.email || "",
    role: userData.role || "customer",
    is_member: !!userData.is_member,
  });

  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginTop: 0 }}>Modifier utilisateur</h3>
      <div style={{ display: "grid", gap: 12 }}>
        <input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Nom complet" />
        <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Téléphone" />
        <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
        <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
          <option value="customer">customer</option>
          <option value="admin">admin</option>
        </select>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={form.is_member}
            onChange={(e) => setForm((p) => ({ ...p, is_member: e.target.checked }))}
            style={{ width: 16 }}
          />
          Membership actif
        </label>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
          Annuler
        </button>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave(form)}>
          Sauvegarder
        </button>
      </div>
    </Modal>
  );
}

function RescheduleModal({ booking, bookings, onClose, onConfirm }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [selectedDate, setSelectedDate] = React.useState(today);
  const [selectedTime, setSelectedTime] = React.useState(null);
  const dateStr = toDateStr(selectedDate);
  const slots = booking.durationMinutes >= 60 ? 4 : 1;

  const weekDates = getWeekDates(weekOffset);

  function slotStatus(time) {
    const found = bookings.find(
      (b) => b.dateStr === dateStr && b.time === time && b.sourceId !== booking.sourceId
    );
    if (!found) return "available";
    if (found.type === "buffer" || found.type === "booked" || found.type === "blocked") return "taken";
    return "available";
  }

  function isSlotSelectable(time) {
    const startIndex = TIME_SLOTS.indexOf(time);
    const needed = TIME_SLOTS.slice(startIndex, startIndex + slots);
    return needed.length === slots && needed.every((t) => slotStatus(t) === "available");
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="orbitron" style={{ marginTop: 0, fontSize: 16 }}>
        Modifier la réservation
      </h3>
      <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
        Actuelle : {booking.dateStr} à {booking.time} ({booking.durationLabel})
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setWeekOffset((v) => v - 1)}>←</button>
        <span className="muted" style={{ fontSize: 13 }}>
          {MONTHS[weekDates[0].getMonth()]} {weekDates[0].getFullYear()}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setWeekOffset((v) => v + 1)}>→</button>
      </div>

      <div className="week-grid" style={{ marginBottom: 12 }}>
        {weekDates.map((d) => {
          const isPast = d < today;
          return (
            <div
              key={d.toISOString()}
              className={`day-box ${d.toDateString() === selectedDate.toDateString() ? "active" : ""} ${isPast ? "disabled" : ""}`}
              onClick={() => { if (!isPast) { setSelectedDate(new Date(d)); setSelectedTime(null); } }}
              style={{ opacity: isPast ? 0.35 : 1, cursor: isPast ? "not-allowed" : "pointer" }}
            >
              <div className="muted" style={{ fontSize: 11 }}>{DAYS[d.getDay()]}</div>
              <div className="orbitron" style={{ fontWeight: 700 }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, maxHeight: 200, overflowY: "auto", marginBottom: 14 }}>
        {TIME_SLOTS.map((time) => {
          const ok = isSlotSelectable(time);
          const selected = selectedTime === time;
          return (
            <button
              key={time}
              type="button"
              disabled={!ok}
              onClick={() => ok && setSelectedTime(time)}
              style={{
                padding: "6px 4px",
                fontSize: 12,
                borderRadius: 6,
                border: `1px solid ${selected ? "var(--accent)" : ok ? "var(--border)" : "transparent"}`,
                background: selected ? "var(--accent)" : ok ? "rgba(255,255,255,0.04)" : "transparent",
                color: selected ? "#050810" : ok ? "var(--text)" : "var(--muted)",
                cursor: ok ? "pointer" : "not-allowed",
                fontWeight: selected ? 700 : 400,
              }}
            >
              {time}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Annuler</button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={!selectedTime}
          onClick={() => selectedTime && onConfirm({ dateStr, time: selectedTime })}
        >
          Confirmer
        </button>
      </div>
    </Modal>
  );
}

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

function AdminSlotModal({ dateStr, time, onClose, onBlock, onBook }) {
  const [mode, setMode] = React.useState(null); // "block" | "book"
  const [blockReason, setBlockReason] = React.useState("Maintenance");
  const [bookForm, setBookForm] = React.useState({
    name: "", phone: "", duration: 15, price: 1000, payment_method: "cash",
  });

  if (!mode) {
    return (
      <Modal onClose={onClose}>
        <h3 style={{ marginTop: 0 }}>Créneau — {dateStr} à {time}</h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Que voulez-vous faire avec ce créneau ?</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button type="button" className="btn btn-primary" onClick={() => setMode("book")}>
            📋 Réservation manuelle (client)
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setMode("block")}>
            🔒 Bloquer le créneau
          </button>
        </div>
      </Modal>
    );
  }

  if (mode === "block") {
    return (
      <Modal onClose={onClose}>
        <h3 style={{ marginTop: 0 }}>Bloquer — {dateStr} à {time}</h3>
        <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Raison</label>
        <select value={blockReason} onChange={(e) => setBlockReason(e.target.value)} style={{ marginBottom: 16 }}>
          <option>Maintenance</option>
          <option>Client walk-in cash</option>
          <option>Nettoyage</option>
          <option>Événement privé</option>
          <option>Autre</option>
        </select>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setMode(null)}>Retour</button>
          <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => onBlock(blockReason)}>Bloquer ✗</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginTop: 0 }}>Réservation manuelle — {dateStr} à {time}</h3>
      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        <input className="input" placeholder="Nom du client *" value={bookForm.name} onChange={(e) => setBookForm((f) => ({ ...f, name: e.target.value }))} />
        <input className="input" placeholder="Téléphone *" value={bookForm.phone} onChange={(e) => setBookForm((f) => ({ ...f, phone: e.target.value }))} />
        <select className="input" value={bookForm.duration} onChange={(e) => setBookForm((f) => ({ ...f, duration: Number(e.target.value), price: Number(e.target.value) >= 60 ? 3000 : 1000 }))}>
          <option value={15}>15 min — 1 000 CFA</option>
          <option value={60}>1 heure — 3 000 CFA</option>
        </select>
        <input className="input" type="number" placeholder="Prix (CFA)" value={bookForm.price} onChange={(e) => setBookForm((f) => ({ ...f, price: Number(e.target.value) }))} />
        <div>
          <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Mode de paiement</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { id: "cash", label: "💵 Cash" },
              { id: "card", label: "💳 Carte" },
              { id: "tmoney", label: "📱 Mixx" },
              { id: "flooz", label: "📱 Flooz" },
            ].map((pm) => (
              <button
                key={pm.id}
                type="button"
                className={`btn btn-sm ${bookForm.payment_method === pm.id ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setBookForm((f) => ({ ...f, payment_method: pm.id }))}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setMode(null)}>Retour</button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={!bookForm.name || !bookForm.phone}
          onClick={() => onBook(bookForm)}
        >
          Confirmer
        </button>
      </div>
    </Modal>
  );
}

function CalendarView({ user, bookings, onOpenBooking, onOpenBlock, onOpenAdminSlot, addToast }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0]);

  const weekDates = getWeekDates(weekOffset);
  const dateStr = toDateStr(selectedDate);

  function slotStatus(time) {
    const found = bookings.find((b) => b.dateStr === dateStr && b.time === time);
    if (!found) return { type: "available" };
    if (found.type === "blocked") return { type: "blocked", label: found.reason || "Bloqué" };
    if (found.type === "buffer") return { type: "buffer", label: "buffer" };
    return { type: "booked", label: found.name || "Réservé" };
  }

  function handleClick(time) {
    const status = slotStatus(time);

    if (user?.isAdmin) {
      if (status.type === "available") onOpenAdminSlot(dateStr, time);
      return;
    }

    if (!user) {
      addToast("Connectez-vous d'abord.", "info");
      return;
    }

    if (status.type !== "available") return;

    const startIndex = TIME_SLOTS.indexOf(time);
    const needed = TIME_SLOTS.slice(startIndex, startIndex + selectedDuration.slots);
    const blocked = needed.some((t) => slotStatus(t).type !== "available");
    if (blocked || needed.length !== selectedDuration.slots) {
      addToast("Créneau indisponible.", "error");
      return;
    }

    onOpenBooking({
      dateStr,
      time,
      durationLabel: selectedDuration.label,
      durationMinutes: selectedDuration.minutes,
      amount: user.memberStatus === "active" ? 0 : selectedDuration.price,
    });
  }

  return (
    <>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setWeekOffset((v) => v - 1)}>
            ← Semaine précédente
          </button>
          <div className="muted">
            {MONTHS[weekDates[0].getMonth()]} {weekDates[0].getFullYear()}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setWeekOffset((v) => v + 1)}>
            Semaine suivante →
          </button>
        </div>

        <div className="week-grid">
          {weekDates.map((d) => (
            <div
              key={d.toISOString()}
              className={`day-box ${d.toDateString() === selectedDate.toDateString() ? "active" : ""}`}
              onClick={() => setSelectedDate(new Date(d))}
            >
              <div className="muted" style={{ fontSize: 11 }}>{DAYS[d.getDay()]}</div>
              <div className="orbitron" style={{ fontWeight: 700 }}>{d.getDate()}</div>
            </div>
          ))}
        </div>
      </div>

      {!user?.isAdmin && (
        <div className="grid-2">
          {DURATIONS.map((d) => (
            <div
              key={d.label}
              className="card"
              onClick={() => setSelectedDuration(d)}
              style={{
                cursor: "pointer",
                borderColor: selectedDuration.label === d.label ? "var(--accent)" : "var(--border)",
              }}
            >
              <div className="orbitron" style={{ fontWeight: 700, fontSize: 22, marginBottom: 4 }}>{d.label}</div>
              <div style={{ color: user?.memberStatus === "active" ? "#6ee7b7" : "#fcd34d", fontWeight: 700, marginBottom: 8 }}>
                {user?.memberStatus === "active" ? "0 CFA ✦" : formatCFA(d.price)}
              </div>
              <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginBottom: 2 }}>{d.people}</div>
              <div className="muted" style={{ fontSize: 12 }}>{d.desc}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
          <strong>
            Créneaux — {DAYS[selectedDate.getDay()]} {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}
          </strong>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="tag tag-cyan">Disponible</span>
            <span className="tag tag-purple">Réservé</span>
            <span className="tag tag-red">Bloqué</span>
          </div>
        </div>

        <div className="slots-grid">
          {TIME_SLOTS.map((time) => {
            const s = slotStatus(time);
            const cls =
              s.type === "available"
                ? "available"
                : s.type === "blocked"
                ? "blocked"
                : s.type === "buffer"
                ? "buffer"
                : "booked";

            return (
              <div key={time} className={`slot ${cls}`} onClick={() => handleClick(time)}>
                <div style={{ fontWeight: 700 }}>{time}</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>{s.label || ""}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function MembershipPage({ user, onActivate }) {
  return (
    <>
      <div className="card">
        <h2 className="orbitron" style={{ marginTop: 0 }}>
          PASS <span className="accent">MEMBRE</span>
        </h2>
        <p className="muted">Accès illimité pendant 30 jours.</p>

        {user?.memberStatus === "active" ? (
          <>
            <p>
              <span className="tag tag-green">ACTIF</span>
            </p>
            <p className="muted">
              Expire dans {user.daysLeft} jour{user.daysLeft > 1 ? "s" : ""}
            </p>
          </>
        ) : (
          <>
            {user?.memberStatus === "expired" && (
              <p style={{ color: "#fca5a5", fontWeight: 600, marginBottom: 8 }}>
                Votre pass a expiré. Renouvelez-le pour reprendre les avantages.
              </p>
            )}
            <p style={{ fontWeight: 700, color: "#fcd34d" }}>10,000 CFA / 30 jours</p>
            {user ? (
              <button type="button" className="btn btn-purple" onClick={onActivate}>
                {user.memberStatus === "expired" ? "Renouveler le Pass Membre" : "Activer le Pass Membre"}
              </button>
            ) : (
              <p className="muted">Connectez-vous pour activer le membership.</p>
            )}
          </>
        )}
      </div>

      <div className="card">
        <strong>Avantages</strong>
        <div className="list-row"><span>🎮 Sessions gratuites</span></div>
        <div className="list-row"><span>⚡ Réservation rapide</span></div>
        <div className="list-row"><span>📅 Priorité calendrier</span></div>
        <div className="list-row" style={{ borderBottom: "none" }}><span>🏆 Statut premium</span></div>
      </div>
    </>
  );
}

function ProfilePage({ user, bookings, onCancel, onReschedule, onSaveProfile, onChangePassword }) {
  const now = new Date();
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({ name: user?.name || "", phone: user?.phone || "" });
  const mine = bookings.filter(
    (b) =>
      (b.userId === user?.id || b.phone === user?.phone) &&
      b.isPrimary &&
      (b.type === "booked" || b.type === "member")
  );

  const paidHistory = mine
    .filter((b) => b.type === "booked" && b.paymentStatus === "paid")
    .sort((a, b) => new Date(`${b.dateStr}T${b.time}`) - new Date(`${a.dateStr}T${a.time}`));

  const totalPaid = paidHistory.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const pending = mine.filter((b) => b.type === "booked" && b.paymentStatus !== "paid");

  return (
    <>
      <div className="card">
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              className="input"
              placeholder="Nom complet"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Téléphone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => { onSaveProfile(form); setEditing(false); }}
              >
                Sauvegarder
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h2 style={{ marginTop: 0 }}>{user?.name}</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setForm({ name: user?.name || "", phone: user?.phone || "" }); setEditing(true); }}>
                Modifier
              </button>
            </div>
            <div className="muted">{user?.email}</div>
            <div className="muted">{user?.phone}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {user?.memberStatus === "active" && <span className="tag tag-green">MEMBRE ACTIF</span>}
              {user?.loyaltyPoints > 0 && (
                <span className="tag tag-amber">⭐ {user.loyaltyPoints} points</span>
              )}
            </div>
            {user?.loyaltyPoints >= 10 && (
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                {Math.floor(user.loyaltyPoints / 10) * 1000} CFA utilisables à la prochaine réservation (10 pts = 1,000 CFA)
              </p>
            )}
            <div style={{ marginTop: 14 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onChangePassword}>
                Changer mon mot de passe
              </button>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <strong>Historique des paiements</strong>
          <span className="orbitron" style={{ color: "var(--accent)", fontSize: 14 }}>{formatCFA(totalPaid)}</span>
        </div>
        {paidHistory.length === 0 && pending.length === 0 ? (
          <p className="muted">Aucun paiement enregistré.</p>
        ) : (
          <>
            {paidHistory.map((b) => (
              <div key={b.id} className="list-row">
                <div>
                  <div>{b.dateStr} à {b.time}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{b.durationLabel}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="tag tag-green">PAYÉ</span>
                  <span style={{ fontWeight: 700 }}>{formatCFA(b.amount)}</span>
                </div>
              </div>
            ))}
            {pending.map((b) => (
              <div key={b.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <div>{b.dateStr} à {b.time}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{b.durationLabel}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {b.paymentStatus === "rejected"
                      ? <span className="tag tag-red">REJETÉ</span>
                      : <span className="tag tag-amber">EN ATTENTE</span>}
                    <span>{formatCFA(b.amount)}</span>
                  </div>
                </div>
                {b.paymentStatus === "pending" && (b.paymentMethod === "tmoney" || b.paymentMethod === "flooz") && (
                  <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                    Envoyez <strong>{formatCFA(b.amount)}</strong> au <strong>+228 93 69 54 63</strong> via Mixx pour valider votre réservation.
                  </div>
                )}
                {b.paymentStatus === "paydunya_pending" && (
                  <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                    Paiement PayDunya en cours de vérification. Confirmation automatique sous peu.
                  </div>
                )}
                {b.paymentStatus === "rejected" && (
                  <div style={{ background: "rgba(252,165,165,0.08)", border: "1px solid rgba(252,165,165,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#fca5a5" }}>
                    Paiement non reçu. Contactez-nous pour assistance.
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      <div className="card">
        <strong>Mes réservations</strong>
        {mine.length === 0 ? (
          <p className="muted">Aucune réservation.</p>
        ) : (
          mine.map((b) => {
            const isFuture = new Date(`${b.dateStr}T${b.time}:00`) > now;
            return (
              <div key={b.id} className="list-row">
                <div>
                  <div>{b.dateStr} à {b.time}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{b.durationLabel}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {b.type !== "member" && (
                    <span className={`tag ${b.paymentStatus === "paid" ? "tag-green" : "tag-amber"}`}>
                      {b.paymentStatus === "paid" ? "PAYÉ" : "EN ATTENTE"}
                    </span>
                  )}
                  <span>{b.type === "member" ? "0 CFA" : formatCFA(b.amount)}</span>
                  {isFuture && b.type === "booked" && (
                    <>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onReschedule(b)}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: "#fca5a5" }}
                        onClick={() => onCancel(b)}
                      >
                        Annuler
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
function DashboardStatCard({ icon: Icon, title, value, subtitle, color, bg }) {
  return (
    <div
      className="card stat-card"
      style={{
        background: bg,
        borderColor: color,
      }}
    >
      <div
        className="stat-icon-wrap"
        style={{
          border: `1px solid ${color}`,
        }}
      >
        <Icon size={24} color={color} strokeWidth={2.2} />
      </div>

      <div
        className="orbitron admin-panel-title"
        style={{
          fontSize: 24,
          fontWeight: 800,
          color,
          lineHeight: 1.2,
          marginBottom: 8,
          textTransform: "none",
          letterSpacing: "0",
        }}
      >
        {value}
      </div>

      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div className="muted" style={{ fontSize: 13 }}>{subtitle}</div>
    </div>
  );
}

function RevenueSourceBar({ label, value, color, width }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <strong>{label}</strong>
        <strong style={{ color }}>{formatCFA(value)}</strong>
      </div>

      <div className="source-bar-track">
        <div
          className="source-bar-fill"
          style={{
            width,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

const EVENT_BASE_GUESTS = 5;
const EVENT_BASE_HOURS = 4;
const EVENT_BASE_PRICE = 25000;
const EVENT_EXTRA_PERSON = 500;
const EVENT_EXTRA_HOUR = 100;
const EVENT_DISTANCE_RATE = 5000; // per 20km
// Adidogomé, Lomé, Togo
const ADIDOGOME_LAT = 6.1750;
const ADIDOGOME_LNG = 1.1550;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcEventPrice(guests, hours, distanceKm = 0) {
  const extraGuests = Math.max(0, guests - EVENT_BASE_GUESTS);
  const extraHours = Math.max(0, hours - EVENT_BASE_HOURS);
  const distanceFee = Math.ceil(distanceKm / 20) * EVENT_DISTANCE_RATE;
  return EVENT_BASE_PRICE + extraGuests * EVENT_EXTRA_PERSON + extraHours * EVENT_EXTRA_HOUR + distanceFee;
}

function EventsPage({ user, onSubmit }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = React.useState({
    eventDate: "", startTime: "09:00", guests: 5, hours: 4,
    distanceKm: 0, location: "", notes: "",
  });
  const [distanceKm, setDistanceKm] = React.useState(null);
  const [pin, setPin] = React.useState(null); // { lat, lng }
  const [pinLabel, setPinLabel] = React.useState("");
  const mapRef = React.useRef(null);
  const leafletMapRef = React.useRef(null);
  const markerRef = React.useRef(null);

  const total = calcEventPrice(form.guests, form.hours, distanceKm ?? 0);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  // Boot Leaflet map once
  React.useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    // Dynamically import leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    import("leaflet").then((L) => {
      const lf = L.default || L;
      // Center on Lomé
      const map = lf.map(mapRef.current).setView([6.1375, 1.2123], 13);
      lf.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      // Custom small red pin icon
      const icon = lf.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;background:var(--accent);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      });

      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        // Place / move marker
        if (markerRef.current) { markerRef.current.setLatLng([lat, lng]); }
        else { markerRef.current = lf.marker([lat, lng], { icon }).addTo(map); }
        setPin({ lat, lng });
        const km = haversineKm(ADIDOGOME_LAT, ADIDOGOME_LNG, lat, lng);
        setDistanceKm(Math.round(km * 10) / 10);
        // Reverse geocode for label
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "fr" } }
          );
          const data = await res.json();
          const label = data.display_name?.split(",").slice(0, 3).join(", ") || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setPinLabel(label);
          setForm((f) => ({ ...f, location: label }));
        } catch (_) {
          const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setPinLabel(label);
          setForm((f) => ({ ...f, location: label }));
        }
      });

      leafletMapRef.current = map;
    });
    return () => {
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, []);

  function handleSubmit() {
    if (!user || !form.eventDate || !pin) return;
    onSubmit({ ...form, distanceKm: distanceKm ?? 0, total });
  }

  return (
    <>
      <div className="card">
        <h2 className="orbitron" style={{ marginTop: 0 }}>
          VR <span className="accent">ÉVÉNEMENTS</span>
        </h2>
        <p className="muted">
          Nous nous déplaçons chez vous pour vos fêtes, anniversaires et événements d'entreprise. 2 casques VR, animation incluse.
        </p>
      </div>

      <div className="card">
        <strong style={{ display: "block", marginBottom: 16 }}>Configurer votre événement</strong>
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Date de l'événement</label>
            <input type="date" min={today} value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
          </div>
          <div>
            <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Heure de début</label>
            <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </div>
          <div className="grid-2">
            <div>
              <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Nombre d'invités</label>
              <input type="number" min={1} max={200} value={form.guests} onChange={(e) => set("guests", Number(e.target.value))} placeholder="Ex: 20" />
            </div>
            <div>
              <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Durée (heures)</label>
              <input type="number" min={1} max={24} value={form.hours} onChange={(e) => set("hours", Number(e.target.value))} placeholder="Ex: 4" />
            </div>
          </div>

          <div>
            <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              Lieu de l'événement — <span style={{ color: "var(--accent)" }}>cliquez sur la carte pour épingler</span>
            </label>
            <div
              ref={mapRef}
              style={{ width: "100%", height: 260, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}
            />
            {pin && pinLabel && (
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>📍 {pinLabel}</div>
            )}
            {!pin && (
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Aucun emplacement sélectionné</div>
            )}
          </div>

          <div>
            <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Notes (optionnel)</label>
            <input
              placeholder="Ex: Anniversaire, thème souhaité..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ background: "linear-gradient(180deg, rgba(0,245,212,0.07), rgba(17,24,39,0.96))", borderColor: "var(--accent)", textAlign: "center" }}>
        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>DEVIS ESTIMÉ</div>
        <div className="orbitron" style={{ fontSize: 28, color: "var(--accent)" }}>{formatCFA(total)}</div>
        {!pin && (
          <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>Épinglez votre adresse sur la carte pour inclure les frais de déplacement</div>
        )}
      </div>

      {user ? (
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: "100%", padding: "14px" }}
          onClick={handleSubmit}
          disabled={!form.eventDate || !pin}
        >
          Envoyer la demande →
        </button>
      ) : (
        <p className="muted" style={{ textAlign: "center" }}>Connectez-vous pour soumettre une demande.</p>
      )}
    </>
  );
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function PromoCodesSection({ onRefresh }) {
  const [codes, setCodes] = React.useState([]);
  const EMPTY_FORM = { code: "", discount_type: "fixed", discount_value: "", max_uses: "", expires_at: "", applicable_to: [], applicable_days: [], applicable_time_start: "", applicable_time_end: "" };
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [loading, setLoading] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(null);
  const [actionError, setActionError] = React.useState("");

  React.useEffect(() => { fetchCodes(); }, []);

  async function fetchCodes() {
    const { data, error } = await (await import("./lib/supabase")).supabase
      .from("promo_codes").select("*").order("created_at", { ascending: false });
    if (error) { console.error("Promo codes fetch error:", error); return; }
    setCodes(data || []);
  }

  function toggleDay(d) {
    setForm(f => ({
      ...f,
      applicable_days: f.applicable_days.includes(d)
        ? f.applicable_days.filter(x => x !== d)
        : [...f.applicable_days, d],
    }));
  }

  async function handleCreate() {
    if (!form.code.trim() || !form.discount_value) return;
    setLoading(true);
    const { error } = await (await import("./lib/supabase")).supabase.from("promo_codes").insert({
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
      is_active: true,
      uses_count: 0,
      applicable_to: form.applicable_to,
      applicable_days: form.applicable_days.length > 0 ? form.applicable_days : null,
      applicable_time_start: form.applicable_time_start || null,
      applicable_time_end: form.applicable_time_end || null,
    });
    setLoading(false);
    if (error) { alert(error.message); return; }
    setForm(EMPTY_FORM);
    fetchCodes();
  }

  async function toggleActive(id, current) {
    setActionError("");
    const sb = (await import("./lib/supabase")).supabase;
    const { error } = await sb.from("promo_codes").update({ is_active: !current }).eq("id", id);
    if (error) { setActionError(`Erreur : ${error.message}`); return; }
    fetchCodes();
  }

  async function deleteCode(id) {
    setActionError("");
    const sb = (await import("./lib/supabase")).supabase;
    const { error } = await sb.from("promo_codes").delete().eq("id", id);
    if (error) { setActionError(`Erreur : ${error.message}`); return; }
    setConfirmDelete(null);
    fetchCodes();
  }

  function promoRestrictionLabel(c) {
    const parts = [];
    const types = Array.isArray(c.applicable_to) ? c.applicable_to : (c.applicable_to ? [c.applicable_to] : []);
    const typeMap = { "15min": "15 min", "1hr": "1 heure", "membership": "Pass Membre", "evenements": "Événements" };
    if (types.length > 0) parts.push(types.map(t => typeMap[t] || t).join(", ") + " seulement");
    if (c.applicable_days?.length) parts.push(c.applicable_days.sort().map(d => DAY_LABELS[d]).join(", "));
    if (c.applicable_time_start && c.applicable_time_end) parts.push(`${c.applicable_time_start.slice(0,5)}–${c.applicable_time_end.slice(0,5)}`);
    return parts.length ? parts.join(" · ") : null;
  }

  return (
    <div className="card admin-card-soft">
      <div className="orbitron admin-section-title" style={{ marginBottom: 14 }}>
        <Crown size={18} color="#fbbf24" />
        CODES PROMO
      </div>

      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="Code (ex: FETE20)"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            style={{ flex: 1, minWidth: 120 }}
          />
          <select
            className="input"
            value={form.discount_type}
            onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}
            style={{ flex: 1, minWidth: 120 }}
          >
            <option value="fixed">Fixe (CFA)</option>
            <option value="percent">Pourcentage (%)</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="input"
            type="number"
            placeholder={form.discount_type === "percent" ? "Réduction (%)" : "Réduction (CFA)"}
            value={form.discount_value}
            onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
            style={{ flex: 1 }}
          />
          <input
            className="input"
            type="number"
            placeholder="Utilisations max (vide = illimité)"
            value={form.max_uses}
            onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
            style={{ flex: 1 }}
          />
          <input
            className="input"
            type="date"
            placeholder="Expiration (optionnel)"
            value={form.expires_at}
            onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
            style={{ flex: 1 }}
          />
        </div>

        {/* Restrictions */}
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "12px 14px", display: "grid", gap: 10 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 2 }}>RESTRICTIONS (optionnel)</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", minWidth: 60 }}>Session</span>
            {[["15min", "15 min"], ["1hr", "1 heure"], ["membership", "Pass Membre"], ["evenements", "Événements"]].map(([val, label]) => {
              const selected = (form.applicable_to || []).includes(val);
              return (
                <button key={val} type="button"
                  onClick={() => setForm(f => {
                    const cur = f.applicable_to || [];
                    return { ...f, applicable_to: selected ? cur.filter(x => x !== val) : [...cur, val] };
                  })}
                  style={{ padding: "4px 12px", borderRadius: 8, border: `1.5px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                    background: selected ? "rgba(0,245,212,0.1)" : "transparent",
                    color: selected ? "var(--accent)" : "var(--muted)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  {label}
                </button>
              );
            })}
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{(form.applicable_to || []).length === 0 ? "(toutes)" : ""}</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", minWidth: 60 }}>Jours</span>
            {DAY_LABELS.map((d, i) => (
              <button key={i} type="button"
                onClick={() => toggleDay(i)}
                style={{ padding: "4px 10px", borderRadius: 8, border: `1.5px solid ${form.applicable_days.includes(i) ? "var(--accent)" : "var(--border)"}`,
                  background: form.applicable_days.includes(i) ? "rgba(0,245,212,0.1)" : "transparent",
                  color: form.applicable_days.includes(i) ? "var(--accent)" : "var(--muted)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                {d}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", minWidth: 60 }}>Horaire</span>
            <input className="input" type="time" value={form.applicable_time_start}
              onChange={e => setForm(f => ({ ...f, applicable_time_start: e.target.value }))}
              style={{ flex: 1, fontSize: 13 }} />
            <span style={{ color: "var(--muted)", fontSize: 12 }}>à</span>
            <input className="input" type="time" value={form.applicable_time_end}
              onChange={e => setForm(f => ({ ...f, applicable_time_end: e.target.value }))}
              style={{ flex: 1, fontSize: 13 }} />
          </div>
        </div>

        <button type="button" className="btn btn-primary btn-sm" onClick={handleCreate} disabled={loading}>
          {loading ? "..." : "Créer le code"}
        </button>
      </div>

      {actionError && <p style={{ color: "#fca5a5", fontSize: 12, marginBottom: 8 }}>{actionError}</p>}
      {codes.length === 0 ? (
        <p className="muted">Aucun code promo.</p>
      ) : (
        codes.map((c) => (
          <div key={c.id} className="list-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <strong>{c.code}</strong>
                  <span className={`tag ${c.is_active ? "tag-green" : "tag-amber"}`}>
                    {c.is_active ? "ACTIF" : "INACTIF"}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {c.discount_type === "percent" ? `${c.discount_value}%` : formatCFA(c.discount_value)} de réduction
                  {" · "}{c.uses_count} utilisé{c.uses_count !== 1 ? "s" : ""}
                  {c.max_uses ? ` / ${c.max_uses}` : " (illimité)"}
                  {c.expires_at ? ` · Expire ${c.expires_at}` : ""}
                </div>
                {promoRestrictionLabel(c) && (
                  <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 2 }}>↳ {promoRestrictionLabel(c)}</div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleActive(c.id, c.is_active)}>
                  {c.is_active ? "Désactiver" : "Activer"}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" style={{ color: "#fca5a5" }} onClick={() => setConfirmDelete(c.id)}>
                  ✕
                </button>
              </div>
            </div>
            {confirmDelete === c.id && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(252,100,100,0.08)", border: "1px solid rgba(252,100,100,0.3)", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ flex: 1, fontSize: 13 }}>Supprimer <strong>{c.code}</strong> ?</span>
                <button type="button" className="btn btn-ghost btn-sm" style={{ color: "#fca5a5" }} onClick={() => deleteCode(c.id)}>Oui, supprimer</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}>Annuler</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

const MONTH_LABELS = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];

function MonthlyRevenueChart({ paidBookings }) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] });
  }
  const data = months.map(({ year, month, label }) => {
    const total = paidBookings
      .filter(b => { const d = new Date(b.dateStr); return d.getFullYear() === year && d.getMonth() === month; })
      .reduce((s, b) => s + Number(b.amount || 0), 0);
    return { label, total };
  });
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const BAR_W = 36, GAP = 12, H = 120, PAD_LEFT = 50;
  const totalW = PAD_LEFT + (BAR_W + GAP) * 6 - GAP + 10;
  return (
    <div className="card admin-card-soft">
      <div className="orbitron admin-section-title">
        <TrendingUp size={18} color="var(--accent)" />
        REVENUS 6 DERNIERS MOIS
      </div>
      <svg viewBox={`0 0 ${totalW} ${H + 44}`} style={{ width: "100%", overflow: "visible" }}>
        {/* Y-axis labels */}
        {[0, 0.5, 1].map((frac) => {
          const y = H - frac * H;
          const val = Math.round(frac * maxVal / 1000) * 1000;
          return (
            <g key={frac}>
              <line x1={PAD_LEFT} y1={y} x2={totalW} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              <text x={PAD_LEFT - 6} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="10">
                {val >= 1000 ? `${val/1000}k` : val}
              </text>
            </g>
          );
        })}
        {/* Bars */}
        {data.map(({ label, total }, i) => {
          const barH = total > 0 ? Math.max(4, (total / maxVal) * H) : 0;
          const x = PAD_LEFT + i * (BAR_W + GAP);
          const isCurrentMonth = i === 5;
          return (
            <g key={label}>
              <rect x={x} y={H - barH} width={BAR_W} height={barH} rx={4}
                fill={isCurrentMonth ? "url(#barGrad)" : "rgba(0,245,212,0.25)"} />
              <text x={x + BAR_W / 2} y={H + 14} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">{label}</text>
              {total > 0 && (
                <text x={x + BAR_W / 2} y={H - barH - 5} textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="700">
                  {total >= 1000 ? `${(total/1000).toFixed(1)}k` : total}
                </text>
              )}
            </g>
          );
        })}
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f5d4" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function CustomerProfileModal({ targetUser, bookings, onClose }) {
  const userBookings = bookings.filter(b =>
    b.isPrimary && (b.type === "booked" || b.type === "member") &&
    (b.userId === targetUser.id || b.phone === targetUser.phone)
  ).sort((a, b) => new Date(`${b.dateStr}T${b.time}`) - new Date(`${a.dateStr}T${a.time}`));

  const totalPaid = userBookings.filter(b => b.paymentStatus === "paid" && b.type === "booked")
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  const sessionCount = userBookings.filter(b => b.paymentStatus === "paid" || b.type === "member").length;
  const lastVisit = userBookings[0];

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(124,58,237,0.2)", border: "2px solid rgba(124,58,237,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#c4b5fd" }}>
          {(targetUser.full_name || "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{targetUser.full_name || "—"}</div>
          <div className="muted" style={{ fontSize: 12 }}>{targetUser.email || "—"}</div>
          <div className="muted" style={{ fontSize: 12 }}>{targetUser.phone || "—"}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Total dépensé", value: formatCFA(totalPaid), color: "var(--accent)" },
          { label: "Sessions", value: sessionCount, color: "#c4b5fd" },
          { label: "Points fidélité", value: `⭐ ${targetUser.loyalty_points || 0}`, color: "#fbbf24" },
          { label: "Statut", value: targetUser.is_member ? "Membre" : targetUser.role === "admin" ? "Admin" : "Client", color: targetUser.is_member ? "#6ee7b7" : "var(--muted)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
            <div className="muted" style={{ fontSize: 11 }}>{label}</div>
            <div style={{ fontWeight: 800, fontSize: 16, color, marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>

      {lastVisit && (
        <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
          Dernière visite : {lastVisit.dateStr} à {lastVisit.time}
        </div>
      )}

      <div style={{ maxHeight: 200, overflowY: "auto", display: "grid", gap: 6 }}>
        {userBookings.length === 0 ? (
          <p className="muted">Aucune réservation.</p>
        ) : userBookings.map(b => (
          <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "7px 10px", fontSize: 13 }}>
            <span>{b.dateStr} · {b.time} · {b.durationLabel}</span>
            <span style={{ color: b.type === "member" ? "#6ee7b7" : b.paymentStatus === "paid" ? "var(--accent)" : "#f59e0b", fontWeight: 700 }}>
              {b.type === "member" ? "Membre" : b.paymentStatus === "paid" ? formatCFA(b.amount) : "En attente"}
            </span>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-ghost" style={{ marginTop: 14, width: "100%" }} onClick={onClose}>Fermer</button>
    </Modal>
  );
}

function AdminDashboard({ users, bookings, logs, eventBookings = [], onEditUser, onUnblock, onConfirmPayment, onRejectPayment, onAdminCancel, onConfirmEvent, onCancelEvent, onConfirmMembership, onRejectMembership }) {
  const today = new Date();
  const todayStr = toDateStr(today);
  const startOfWeek = getStartOfWeek(today);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Date range filter state
  const [reportFrom, setReportFrom] = React.useState("");
  const [reportTo, setReportTo] = React.useState("");
  const [profileTarget, setProfileTarget] = React.useState(null);

  function sendDailySummary() {
    const todayList = primaryBookings.filter(b => b.dateStr === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time));
    if (todayList.length === 0) {
      const msg = `📋 *Résumé du jour — Jeux Dia VR*\n📅 ${todayStr}\n\nAucune réservation aujourd'hui.`;
      window.open(`https://wa.me/22893695463?text=${encodeURIComponent(msg)}`, "_blank");
      return;
    }
    const lines = todayList.map(b =>
      `🕐 ${b.time} — ${b.name || "Client"} · ${b.durationLabel} · ${b.type === "member" ? "Membre" : formatCFA(b.amount)} · ${b.paymentStatus === "paid" ? "✅ Payé" : "⏳ En attente"}`
    );
    const totalRevenue = todayList.filter(b => b.paymentStatus === "paid").reduce((s, b) => s + Number(b.amount || 0), 0);
    const msg = [
      `📋 *Résumé du jour — Jeux Dia VR*`,
      `📅 ${todayStr} · ${todayList.length} réservation${todayList.length > 1 ? "s" : ""}`,
      ``,
      ...lines,
      ``,
      `💰 Revenus confirmés : ${formatCFA(totalRevenue)}`,
    ].join("\n");
    window.open(`https://wa.me/22893695463?text=${encodeURIComponent(msg)}`, "_blank");
  }

  const primaryBookings = bookings.filter(
    (b) => b.isPrimary && (b.type === "booked" || b.type === "member")
  );

  const todayBookings = primaryBookings.filter((b) => b.dateStr === todayStr);
  const blocked = bookings.filter((b) => b.type === "blocked" && b.isPrimary);

  const paidBookings = primaryBookings.filter((b) => Number(b.amount || 0) > 0 && b.paymentStatus === "paid");
  const memberBookings = primaryBookings.filter((b) => b.type === "member");

  const totalSales = paidBookings.reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const weeklySales = paidBookings
    .filter((b) => new Date(`${b.dateStr}T${b.time}:00`) >= startOfWeek)
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const monthlySales = paidBookings
    .filter((b) => new Date(`${b.dateStr}T${b.time}:00`) >= startOfMonth)
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  // Date range filtered bookings
  const rangeBookings = React.useMemo(() => {
    if (!reportFrom && !reportTo) return paidBookings;
    return paidBookings.filter((b) => {
      if (reportFrom && b.dateStr < reportFrom) return false;
      if (reportTo && b.dateStr > reportTo) return false;
      return true;
    });
  }, [paidBookings, reportFrom, reportTo]);

  const rangeSales = rangeBookings.reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const allPricedBookings = primaryBookings.filter((b) => Number(b.amount || 0) > 0);

  // Real payment method breakdown
  const tmoneySales = paidBookings.filter((b) => b.paymentMethod === "tmoney").reduce((s, b) => s + Number(b.amount || 0), 0);
  const floozSales  = paidBookings.filter((b) => b.paymentMethod === "flooz").reduce((s, b) => s + Number(b.amount || 0), 0);
  const cashSales   = paidBookings.filter((b) => b.paymentMethod === "cash" || !b.paymentMethod).reduce((s, b) => s + Number(b.amount || 0), 0);
  const cardSales   = paidBookings.filter((b) => b.paymentMethod === "card").reduce((s, b) => s + Number(b.amount || 0), 0);

  const sourceMax = Math.max(tmoneySales, floozSales, cashSales, cardSales, 1);
  const sourceWidth = (value) => `${Math.max(6, (value / sourceMax) * 100)}%`;

  // Customer growth: signups per month
  const growthByMonth = users.reduce((acc, u) => {
    if (!u.created_at) return acc;
    const month = u.created_at.slice(0, 7);
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  const growthData = Object.entries(growthByMonth)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);
  const growthMax = Math.max(...growthData.map((m) => m.count), 1);
  const totalMembers = users.filter((u) => u.is_member).length;

  const hourCounts = primaryBookings.reduce((acc, b) => {
    const hour = b.time ? b.time.split(":")[0] + "h00" : null;
    if (hour) acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});
  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour));
  const peakMax = Math.max(...peakHours.map((h) => h.count), 1);

  const recentSales = [...allPricedBookings]
    .sort((a, b) => new Date(`${b.dateStr}T${b.time}:00`) - new Date(`${a.dateStr}T${a.time}:00`))
    .slice(0, 10);

  return (
    <>
      <div className="card admin-card-soft" style={{ paddingBottom: 12 }}>
        <div
          className="orbitron admin-panel-title"
          style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: "var(--accent)" }}
        >
          DASHBOARD ADMIN
        </div>
        <div className="muted">
          Vue d’ensemble des ventes, réservations et activité du jour.
        </div>
        <div className="admin-highlight-line" />
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 10, color: "#6ee7b7", border: "1px solid rgba(110,231,183,0.3)" }} onClick={sendDailySummary}>
          📋 Envoyer résumé du jour WhatsApp
        </button>
      </div>

      <div className="grid-4">
        <DashboardStatCard
          icon={Wallet}
          title="Revenus total"
          value={formatCFA(totalSales)}
          subtitle="Tous les paiements confirmés"
          color="#fbbf24"
          bg="linear-gradient(180deg, rgba(245,158,11,0.14), rgba(17,24,39,0.96))"
        />

        <DashboardStatCard
          icon={Gamepad2}
          title="Sessions aujourd'hui"
          value={todayBookings.length}
          subtitle="Réservations du jour"
          color="#00f5d4"
          bg="linear-gradient(180deg, rgba(0,245,212,0.12), rgba(17,24,39,0.96))"
        />

        <DashboardStatCard
          icon={Smartphone}
          title="Mixx / Flooz"
          value={`${formatCFA(tmoneySales)} / ${formatCFA(floozSales)}`}
          subtitle="Paiements mobiles réels"
          color="#c4b5fd"
          bg="linear-gradient(180deg, rgba(124,58,237,0.14), rgba(17,24,39,0.96))"
        />

        <DashboardStatCard
          icon={TrendingUp}
          title="Semaine en cours"
          value={formatCFA(weeklySales)}
          subtitle="Performance hebdomadaire"
          color="#6ee7b7"
          bg="linear-gradient(180deg, rgba(16,185,129,0.14), rgba(17,24,39,0.96))"
        />
      </div>

      {/* ── Pending membership requests ── */}
      {(() => {
        const pendingMembers = users.filter(u => u.membership_pending);
        if (pendingMembers.length === 0) return null;
        return (
          <div className="card" style={{ border: "1px solid rgba(124,58,237,0.5)", background: "rgba(124,58,237,0.06)" }}>
            <div className="orbitron admin-section-title" style={{ color: "#a78bfa" }}>
              💜 DEMANDES PASS MEMBRE ({pendingMembers.length})
            </div>
            {pendingMembers.map(u => (
              <div key={u.id} className="list-row" style={{ alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{u.full_name || "Client"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{u.phone || u.email || "—"} · 10,000 CFA</div>
                </div>
                <span style={{ fontWeight: 700, color: "#fcd34d" }}>10,000 CFA</span>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => onConfirmMembership(u)}>✓ Activer</button>
                <button type="button" className="btn btn-ghost btn-sm" style={{ color: "#fca5a5" }} onClick={() => onRejectMembership(u)}>✕ Rejeter</button>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Pending payment approvals ── */}
      {(() => {
        const pendingPay = primaryBookings.filter(b => (b.paymentStatus === "pending" || b.paymentStatus === "paydunya_pending") && Number(b.amount || 0) > 0);
        if (pendingPay.length === 0) return null;
        return (
          <div className="card" style={{ border: "1px solid rgba(245,158,11,0.5)", background: "rgba(245,158,11,0.06)" }}>
            <div className="orbitron admin-section-title" style={{ color: "#f59e0b" }}>
              🔔 PAIEMENTS EN ATTENTE DE VÉRIFICATION ({pendingPay.length})
            </div>
            {pendingPay.map(b => (
              <div key={b.id} className="list-row" style={{ alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{b.name || "Client"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{b.dateStr} à {b.time} · {b.durationLabel} · {b.paymentMethod === "tmoney" ? "Mixx" : b.paymentMethod === "flooz" ? "Flooz" : b.paymentMethod === "paydunya" ? "PayDunya 🔄" : b.paymentMethod || "—"}</div>
                </div>
                <span style={{ fontWeight: 700, color: "#f59e0b" }}>{formatCFA(b.amount)}</span>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => onConfirmPayment(b)}>✓ Confirmer</button>
                <button type="button" className="btn btn-ghost btn-sm" style={{ color: "#fca5a5" }} onClick={() => onRejectPayment(b)}>✕ Rejeter</button>
              </div>
            ))}
          </div>
        );
      })()}

      <div className="grid-2">
        <div className="card admin-card-soft">
          <div className="orbitron admin-section-title">
            <Wallet size={18} color="var(--accent)" />
            REVENUS PAR SOURCE
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <RevenueSourceBar label="Mixx (Togocel)" value={tmoneySales} color="#60a5fa" width={sourceWidth(tmoneySales)} />
            <RevenueSourceBar label="Flooz (Moov Africa)" value={floozSales} color="#fb923c" width={sourceWidth(floozSales)} />
            <RevenueSourceBar label="Cash" value={cashSales} color="#6ee7b7" width={sourceWidth(cashSales)} />
            <RevenueSourceBar label="Carte bancaire" value={cardSales} color="#a78bfa" width={sourceWidth(cardSales)} />
          </div>
        </div>

        <div className="card admin-card-soft">
          <div className="orbitron admin-section-title">
            <TrendingUp size={18} color="var(--accent)" />
            KPI RAPIDES
          </div>

          <div className="grid-2">
            <div
              className="kpi-box"
              style={{
                border: "1px solid rgba(0,245,212,0.18)",
                background: "rgba(0,245,212,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <CalendarDays size={18} color="#00f5d4" />
                <div className="muted">Ventes du jour</div>
              </div>
              <div className="orbitron" style={{ fontWeight: 800, fontSize: 22, color: "var(--accent)" }}>
                {formatCFA(paidBookings.filter((b) => b.dateStr === todayStr).reduce((s, b) => s + Number(b.amount || 0), 0))}
              </div>
            </div>

            <div
              className="kpi-box"
              style={{
                border: "1px solid rgba(124,58,237,0.2)",
                background: "rgba(124,58,237,0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <TrendingUp size={18} color="#c4b5fd" />
                <div className="muted">Ventes du mois</div>
              </div>
              <div className="orbitron" style={{ fontWeight: 800, fontSize: 22, color: "#c4b5fd" }}>
                {formatCFA(monthlySales)}
              </div>
            </div>

            <div
              className="kpi-box"
              style={{
                border: "1px solid rgba(245,158,11,0.2)",
                background: "rgba(245,158,11,0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Users size={18} color="#fbbf24" />
                <div className="muted">Payées / En attente</div>
              </div>
              <div className="orbitron" style={{ fontWeight: 800, fontSize: 22, color: "#fbbf24" }}>
                {paidBookings.length} / {primaryBookings.filter((b) => Number(b.amount || 0) > 0 && b.paymentStatus !== "paid").length}
              </div>
            </div>

            <div
              className="kpi-box"
              style={{
                border: "1px solid rgba(16,185,129,0.2)",
                background: "rgba(16,185,129,0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Crown size={18} color="#6ee7b7" />
                <div className="muted">Sessions membres</div>
              </div>
              <div className="orbitron" style={{ fontWeight: 800, fontSize: 22, color: "#6ee7b7" }}>
                {memberBookings.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MonthlyRevenueChart paidBookings={paidBookings} />

      <div className="card admin-card-soft">
        <div className="orbitron admin-section-title">
          <CalendarDays size={18} color="var(--accent)" />
          RAPPORT PAR PÉRIODE
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="muted" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Du</label>
            <input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="muted" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Au</label>
            <input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} />
          </div>
          {(reportFrom || reportTo) && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setReportFrom(""); setReportTo(""); }}>
              Réinitialiser
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div className="kpi-box" style={{ flex: 1, minWidth: 120, border: "1px solid rgba(0,245,212,0.18)", background: "rgba(0,245,212,0.04)" }}>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>{reportFrom || reportTo ? "Revenus (période)" : "Revenus total"}</div>
            <div className="orbitron" style={{ fontWeight: 800, fontSize: 20, color: "var(--accent)" }}>{formatCFA(rangeSales)}</div>
          </div>
          <div className="kpi-box" style={{ flex: 1, minWidth: 120, border: "1px solid rgba(251,191,36,0.18)", background: "rgba(245,158,11,0.04)" }}>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Sessions (période)</div>
            <div className="orbitron" style={{ fontWeight: 800, fontSize: 20, color: "#fbbf24" }}>{rangeBookings.length}</div>
          </div>
          <div className="kpi-box" style={{ flex: 1, minWidth: 120, border: "1px solid rgba(110,231,183,0.18)", background: "rgba(16,185,129,0.04)" }}>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Moy. / session</div>
            <div className="orbitron" style={{ fontWeight: 800, fontSize: 20, color: "#6ee7b7" }}>
              {rangeBookings.length > 0 ? formatCFA(Math.round(rangeSales / rangeBookings.length)) : "—"}
            </div>
          </div>
        </div>
        {(reportFrom || reportTo) && rangeBookings.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Sessions dans cette période</div>
            {rangeBookings.slice(0, 20).map((b) => (
              <div key={b.id} className="list-row" style={{ fontSize: 13 }}>
                <span>{b.dateStr} à {b.time} — {b.name}</span>
                <span className="sales-amount">{formatCFA(b.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card admin-card-soft">
        <div className="orbitron admin-section-title">
          <TrendingUp size={18} color="var(--accent)" />
          HEURES DE POINTE
        </div>

        {peakHours.length === 0 ? (
          <p className="muted">Pas encore de données.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {peakHours.map(({ hour, count }) => (
              <div key={hour} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="orbitron" style={{ fontSize: 12, minWidth: 44, color: "var(--muted)" }}>{hour}</span>
                <div style={{ flex: 1, height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.round((count / peakMax) * 100)}%`,
                    background: count === peakMax ? "var(--accent)" : "rgba(0,245,212,0.4)",
                    borderRadius: 6,
                    transition: "width 0.3s",
                  }} />
                </div>
                <span className="muted" style={{ fontSize: 12, minWidth: 24, textAlign: "right" }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card admin-card-soft">
        <div className="orbitron admin-section-title">
          <Users size={18} color="#c4b5fd" />
          CROISSANCE CLIENTS
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div className="kpi-box" style={{ flex: 1, border: "1px solid rgba(196,181,253,0.2)", background: "rgba(124,58,237,0.05)" }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Total clients</div>
            <div className="orbitron" style={{ fontWeight: 800, fontSize: 22, color: "#c4b5fd" }}>{users.length}</div>
          </div>
          <div className="kpi-box" style={{ flex: 1, border: "1px solid rgba(110,231,183,0.2)", background: "rgba(16,185,129,0.05)" }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Membres actifs</div>
            <div className="orbitron" style={{ fontWeight: 800, fontSize: 22, color: "#6ee7b7" }}>{totalMembers}</div>
          </div>
        </div>

        {growthData.length === 0 ? (
          <p className="muted">Pas encore de données.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {growthData.map(({ month, count }) => (
              <div key={month} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="muted" style={{ fontSize: 12, minWidth: 54 }}>
                  {new Date(month + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })}
                </span>
                <div style={{ flex: 1, height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.round((count / growthMax) * 100)}%`,
                    background: "rgba(196,181,253,0.6)",
                    borderRadius: 6,
                  }} />
                </div>
                <span className="muted" style={{ fontSize: 12, minWidth: 24, textAlign: "right" }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card admin-card-soft">
        <div className="orbitron admin-section-title">
          <Gamepad2 size={18} color="var(--accent)" />
          RÉSERVATIONS DU JOUR — {todayStr}
        </div>

        {todayBookings.length === 0 ? (
          <p className="muted">Aucune réservation aujourd’hui.</p>
        ) : (
          todayBookings.map((b) => (
            <div key={b.id} className="list-row" style={{ alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span className="orbitron time-pill">{b.time}</span>
                  <strong>{b.name || "Client"}</strong>
                  <span className="muted">{b.durationLabel}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className={`tag ${b.type === "member" ? "tag-green" : b.paymentStatus === "paid" ? "tag-green" : "tag-amber"}`}>
                  {b.type === "member" ? "MEMBRE • 0 CFA" : b.paymentStatus === "paid" ? `PAYÉ • ${formatCFA(b.amount)}` : `EN ATTENTE • ${formatCFA(b.amount)}`}
                </span>
                {b.type !== "member" && b.paymentStatus !== "paid" && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => onConfirmPayment(b)}>
                    Marquer payé
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-sm" style={{ color: "#fca5a5" }} onClick={() => onAdminCancel(b)}>
                  Annuler
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card admin-card-soft">
        <div className="orbitron admin-section-title">
          <TrendingUp size={18} color="var(--accent)" />
          VENTES RÉCENTES
        </div>

        {recentSales.length === 0 ? (
          <p className="muted">Aucune vente enregistrée.</p>
        ) : (
          recentSales.map((sale) => (
            <div key={sale.id} className="list-row">
              <div>
                <div>{sale.name || "Client"} — {sale.dateStr} à {sale.time}</div>
                <div className="muted" style={{ fontSize: 12 }}>{sale.durationLabel}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className={`tag ${sale.paymentStatus === "paid" ? "tag-green" : "tag-amber"}`}>
                  {sale.paymentStatus === "paid" ? "PAYÉ" : "EN ATTENTE"}
                </span>
                <span className="sales-amount">{formatCFA(sale.amount)}</span>
                {sale.paymentStatus !== "paid" && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => onConfirmPayment(sale)}>
                    Marquer payé
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-sm" style={{ color: "#fca5a5" }} onClick={() => onAdminCancel(sale)}>
                  Annuler
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card admin-card-soft">
        <div className="orbitron admin-section-title">
          <CalendarDays size={18} color="#c4b5fd" />
          DEMANDES ÉVÉNEMENTS
        </div>

        {eventBookings.length === 0 ? (
          <p className="muted">Aucune demande d'événement.</p>
        ) : (
          eventBookings.map((ev) => (
            <div key={ev.id} className="list-row" style={{ alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                  <strong>{ev.customer_name || "Client"}</strong>
                  <span className="muted">·</span>
                  <span className="muted">{ev.phone}</span>
                  <span className={`tag ${ev.status === "confirmed" ? "tag-green" : ev.status === "cancelled" ? "tag-red" : "tag-amber"}`}>
                    {ev.status === "confirmed" ? "CONFIRMÉ" : ev.status === "cancelled" ? "ANNULÉ" : "EN ATTENTE"}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  📅 {ev.event_date} à {ev.start_time} · 👥 {ev.guest_count} pers. · ⏱ {ev.duration_hours}h · 🚗 {ev.distance_km} km
                </div>
                <div className="muted" style={{ fontSize: 12 }}>📍 {ev.location_description}</div>
                {ev.notes && <div className="muted" style={{ fontSize: 12 }}>📝 {ev.notes}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <strong style={{ color: "var(--accent)", whiteSpace: "nowrap" }}>{formatCFA(ev.total_price)}</strong>
                {ev.status === "pending" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => onConfirmEvent(ev.id)}>
                      Confirmer
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ color: "#fca5a5" }} onClick={() => onCancelEvent(ev.id)}>
                      Refuser
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <PromoCodesSection />

      <div className="card admin-card-soft">
        <div className="orbitron admin-section-title">
          <Users size={18} color="var(--accent)" />
          UTILISATEURS
        </div>

        {users.map((u) => (
          <div key={u.id} className="list-row" style={{ cursor: "pointer" }} onClick={() => setProfileTarget(u)}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{u.full_name || "—"}</div>
              <div className="muted" style={{ fontSize: 12 }}>{u.email || "—"} · {u.phone || "—"}</div>
              {u.loyalty_points > 0 && <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 1 }}>⭐ {u.loyalty_points} points</div>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className={`tag ${u.role === "admin" ? "tag-purple" : u.is_member ? "tag-green" : "tag-amber"}`}>
                {u.role === "admin" ? "ADMIN" : u.is_member ? "MEMBRE" : "CLIENT"}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onEditUser(u); }}>
                Modifier
              </button>
            </div>
          </div>
        ))}
        {profileTarget && (
          <CustomerProfileModal
            targetUser={profileTarget}
            bookings={bookings}
            onClose={() => setProfileTarget(null)}
          />
        )}
      </div>

      <div className="card admin-card-soft">
        <div className="orbitron admin-section-title">
          <ShieldBan size={18} color="#fca5a5" />
          CRÉNEAUX BLOQUÉS
        </div>

        {blocked.length === 0 ? (
          <p className="muted">Aucun créneau bloqué.</p>
        ) : (
          blocked.map((b) => (
            <div key={b.id} className="list-row">
              <div>
                <div>{b.dateStr} à {b.time}</div>
                <div className="muted" style={{ fontSize: 12 }}>{b.reason || "Bloqué"}</div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onUnblock(b)}>
                Débloquer
              </button>
            </div>
          ))
        )}
      </div>

      <div className="card admin-card-soft">
        <div className="orbitron admin-section-title">
          <CalendarDays size={18} color="var(--accent)" />
          JOURNAL ADMIN
        </div>

        {logs.length === 0 ? (
          <p className="muted">Aucune activité.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="list-row">
              <div>
                <div>{log.admin_name || "Admin"} · {log.action_type}</div>
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

// ─── TOURNAMENT COMPONENTS ───────────────────────────────────────────────────

function TournamentStatusBadge({ status }) {
  const map = {
    upcoming: { label: "À venir", cls: "tag-cyan" },
    active:   { label: "En cours", cls: "tag-green" },
    completed:{ label: "Terminé", cls: "tag-purple" },
    cancelled:{ label: "Annulé", cls: "tag-red" },
  };
  const s = map[status] || map.upcoming;
  return <span className={`tag ${s.cls}`}>{s.label}</span>;
}

function TournamentCard({ t, onSelect }) {
  return (
    <div
      className="card"
      onClick={() => onSelect(t)}
      style={{ cursor: "pointer", transition: "border-color 0.18s", borderColor: "var(--border)" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
    >
      {t.image_url && (
        <img src={t.image_url} alt={t.title} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <strong style={{ fontSize: 16 }}>{t.title}</strong>
        <TournamentStatusBadge status={t.status} />
      </div>
      {t.game && <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>🎮 {t.game}</p>}
      {t.start_date && (
        <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
          📅 {new Date(t.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      )}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {t.entry_fee > 0 ? (
          <span className="tag tag-amber">🏆 {t.entry_fee.toLocaleString("fr-FR")} CFA</span>
        ) : (
          <span className="tag tag-green">Gratuit</span>
        )}
        {t.max_participants && (
          <span className="muted" style={{ fontSize: 12 }}>Max {t.max_participants} joueurs</span>
        )}
      </div>
    </div>
  );
}

function RegisterTournamentModal({ tournament, user, onClose, onRegistered }) {
  const [nickname, setNickname] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [network, setNetwork] = React.useState("tmoney");
  const [loading, setLoading] = React.useState(false);
  const [paid, setPaid] = React.useState(false);
  const [err, setErr] = React.useState("");
  const hasFee = tournament.entry_fee > 0;

  async function handleSubmit() {
    if (!nickname.trim()) { setErr("Entrez votre pseudo gamer."); return; }
    if (hasFee && !phone.trim()) { setErr("Entrez votre numéro de téléphone."); return; }
    setLoading(true); setErr("");
    try {
      if (hasFee) {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-tournament`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tournamentId: tournament.id,
              userId: user.id,
              nickname: nickname.trim(),
              amount: tournament.entry_fee,
              phone: phone.trim(),
              network,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok || data.error) { setErr(data.error ?? "Erreur paiement."); setLoading(false); return; }
        setPaid(true);
        setTimeout(() => { onRegistered(); onClose(); }, 2500);
      } else {
        const { error } = await supabase.from("tournament_registrations").insert({
          tournament_id: tournament.id,
          user_id: user.id,
          gamer_nickname: nickname.trim(),
          payment_status: "free",
        });
        if (error) { setErr(error.message); setLoading(false); return; }
        onRegistered();
        onClose();
      }
    } catch (_e) {
      setErr("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  }

  if (paid) return (
    <div className="modal-backdrop">
      <div className="modal" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📱</div>
        <h3 className="orbitron" style={{ color: "var(--accent)", marginTop: 0 }}>Notification envoyée !</h3>
        <p className="muted">Approbation de paiement requise sur votre téléphone.</p>
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <strong style={{ fontSize: 18 }}>S'inscrire — {tournament.title}</strong>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Pseudo Gamer *</label>
            <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="MonPseudo123" />
          </div>
          {hasFee && (
            <>
              <div>
                <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Réseau de paiement</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ id: "tmoney", label: "Mixx" }].map(n => (
                    <button
                      key={n.id}
                      type="button"
                      className={`btn btn-sm ${network === n.id ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setNetwork(n.id)}
                      style={{ flex: 1 }}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Téléphone *</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9XXXXXXX" type="tel" />
              </div>
            </>
          )}
          {err && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{err}</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
              {loading ? "…" : hasFee ? `Payer ${tournament.entry_fee.toLocaleString("fr-FR")} CFA` : "S'inscrire"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TournamentFeed({ tournament, user, registrations }) {
  const [posts, setPosts] = React.useState([]);
  const [content, setContent] = React.useState("");
  const [imgUrl, setImgUrl] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const myReg = registrations.find(r => r.user_id === user?.id);

  React.useEffect(() => {
    if (!tournament) return;
    supabase.from("tournament_posts")
      .select("*, author:author_id(full_name)")
      .eq("tournament_id", tournament.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("Tournament posts fetch error:", error);
        setPosts(data || []);
      });
  }, [tournament?.id]);

  async function handlePost() {
    if (!content.trim() && !imgUrl.trim() && !videoUrl.trim()) return;
    setPosting(true);
    const { data, error } = await supabase.from("tournament_posts").insert({
      tournament_id: tournament.id,
      author_id: user.id,
      author_name: user.name,
      content: content.trim() || null,
      image_url: imgUrl.trim() || null,
      video_url: videoUrl.trim() || null,
      is_admin_post: user.isAdmin,
    }).select("*, author:author_id(full_name)").single();
    setPosting(false);
    if (error) { console.error("Tournament post error:", error); return; }
    if (data) {
      setPosts(p => [data, ...p]);
      setContent(""); setImgUrl(""); setVideoUrl("");
    }
  }

  async function handleDelete(postId) {
    const { error } = await supabase.from("tournament_posts").delete().eq("id", postId);
    if (error) { console.error("Tournament post delete error:", error); return; }
    setPosts(p => p.filter(x => x.id !== postId));
  }

  const canPost = user?.isAdmin || (myReg && (myReg.payment_status === "free" || myReg.payment_status === "paid"));

  return (
    <div>
      <h3 style={{ color: "var(--accent)", marginBottom: 16 }}>📣 Feed Participants</h3>
      {canPost && (
        <div className="card" style={{ marginBottom: 20 }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Message pour les participants…"
            rows={3}
            style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", font: "inherit", resize: "vertical", boxSizing: "border-box" }}
          />
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <input value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="URL image (optionnel)" />
            <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="URL vidéo (optionnel)" />
          </div>
          <button type="button" className="btn btn-primary" style={{ marginTop: 10, width: "100%" }} onClick={handlePost} disabled={posting}>
            {posting ? "…" : "Publier"}
          </button>
        </div>
      )}
      {posts.length === 0 && (
        <p className="muted" style={{ textAlign: "center", padding: "30px 0" }}>Aucune publication pour l'instant.</p>
      )}
      {posts.map(post => (
        <div key={post.id} className="card" style={{ borderColor: post.is_admin_post ? "rgba(0,245,212,0.3)" : "var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent2),var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#000" }}>
                {(post.author?.full_name || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <strong style={{ fontSize: 13 }}>{post.author?.full_name || post.author_name || "Joueur"}</strong>
                {post.is_admin_post && <span className="tag tag-cyan" style={{ marginLeft: 6, fontSize: 10 }}>Admin</span>}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="muted" style={{ fontSize: 11 }}>{new Date(post.created_at).toLocaleDateString("fr-FR")}</span>
              {(user?.isAdmin || post.author_id === user?.id) && (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(post.id)}>✕</button>
              )}
            </div>
          </div>
          {post.content && <p style={{ margin: "8px 0", fontSize: 14 }}>{post.content}</p>}
          {post.image_url && <img src={post.image_url} alt="" style={{ width: "100%", borderRadius: 10, marginTop: 8, maxHeight: 400, objectFit: "cover" }} />}
          {post.video_url && (
            <video src={post.video_url} controls style={{ width: "100%", borderRadius: 10, marginTop: 8 }} />
          )}
        </div>
      ))}
    </div>
  );
}

function TournamentDetail({ tournament, user, onBack }) {
  const [registrations, setRegistrations] = React.useState([]);
  const [showRegModal, setShowRegModal] = React.useState(false);
  const [showParticipants, setShowParticipants] = React.useState(false);
  const myReg = registrations.find(r => r.user_id === user?.id);
  const isRegistered = myReg && (myReg.payment_status === "free" || myReg.payment_status === "paid");
  const canSeeFeed = isRegistered || user?.isAdmin;

  async function loadRegistrations() {
    const { data, error } = await supabase.from("tournament_registrations")
      .select("*, user:user_id(full_name, email, phone)")
      .eq("tournament_id", tournament.id);
    if (error) console.error("Load registrations error:", error);
    setRegistrations(data || []);
  }

  React.useEffect(() => { loadRegistrations(); }, [tournament.id]);

  const paidCount = registrations.filter(r => r.payment_status === "paid" || r.payment_status === "free").length;

  return (
    <div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 16 }}>← Retour</button>
      <div className="card">
        {tournament.image_url && (
          <img src={tournament.image_url} alt={tournament.title} style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 10, marginBottom: 16 }} />
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <h2 className="orbitron" style={{ margin: 0, fontSize: 22 }}>{tournament.title}</h2>
          <TournamentStatusBadge status={tournament.status} />
        </div>
        {tournament.game && <p className="muted" style={{ marginBottom: 8 }}>🎮 {tournament.game}</p>}
        {tournament.description && <p style={{ fontSize: 14, marginBottom: 16 }}>{tournament.description}</p>}
        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          {tournament.start_date && (
            <div className="muted" style={{ fontSize: 13 }}>
              📅 Début: {new Date(tournament.start_date).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
          {tournament.prize_pool && <div className="muted" style={{ fontSize: 13 }}>🏆 Prix: {tournament.prize_pool}</div>}
          <div className="muted" style={{ fontSize: 13 }}>👥 Inscrits: {paidCount}{tournament.max_participants ? ` / ${tournament.max_participants}` : ""}</div>
          <div className="muted" style={{ fontSize: 13 }}>
            💰 Inscription: {tournament.entry_fee > 0 ? `${tournament.entry_fee.toLocaleString("fr-FR")} CFA` : "Gratuite"}
          </div>
        </div>
        {user?.isAdmin && (
          <button type="button" className="btn btn-ghost" style={{ width: "100%", marginBottom: 8 }} onClick={() => setShowParticipants(v => !v)}>
            👥 {showParticipants ? "Masquer" : "Voir"} les participants ({paidCount})
          </button>
        )}
        {user && !isRegistered && !user.isAdmin && tournament.status === "upcoming" && (
          <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={() => setShowRegModal(true)}>
            S'inscrire
          </button>
        )}
        {isRegistered && (
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7", textAlign: "center" }}>
            ✅ Vous êtes inscrit(e) — <strong>{myReg.gamer_nickname}</strong>
          </div>
        )}
        {!user && (
          <p className="muted" style={{ textAlign: "center", fontSize: 13 }}>Connectez-vous pour vous inscrire.</p>
        )}
      </div>

      {/* Admin: participants list */}
      {user?.isAdmin && showParticipants && (
        <div className="card">
          <strong style={{ display: "block", marginBottom: 12 }}>Liste des participants</strong>
          {registrations.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Aucun inscrit.</p>}
          {registrations.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < registrations.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent2),var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#000", flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.gamer_nickname}</div>
                <div className="muted" style={{ fontSize: 12 }}>{r.user?.full_name || "—"} · {r.user?.email || r.user?.phone || ""}</div>
              </div>
              <span className={`tag ${r.payment_status === "paid" ? "tag-cyan" : r.payment_status === "free" ? "tag-green" : "tag-yellow"}`} style={{ fontSize: 11 }}>
                {r.payment_status === "paid" ? "Payé" : r.payment_status === "free" ? "Gratuit" : "En attente"}
              </span>
            </div>
          ))}
        </div>
      )}

      {canSeeFeed && (
        <TournamentFeed tournament={tournament} user={user} registrations={registrations} />
      )}
      {showRegModal && (
        <RegisterTournamentModal
          tournament={tournament}
          user={user}
          onClose={() => setShowRegModal(false)}
          onRegistered={loadRegistrations}
        />
      )}
    </div>
  );
}

function CreateTournamentModal({ onClose, onCreated }) {
  const [form, setForm] = React.useState({
    title: "", game: "", description: "", entry_fee: 0,
    max_participants: "", prize_pool: "", image_url: "",
    start_date: "", end_date: "", status: "upcoming",
  });
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleCreate() {
    if (!form.title.trim()) { setErr("Titre requis."); return; }
    setLoading(true);
    const payload = {
      title: form.title.trim(),
      game: form.game.trim() || null,
      description: form.description.trim() || null,
      entry_fee: Number(form.entry_fee) || 0,
      max_participants: form.max_participants ? Number(form.max_participants) : null,
      prize_pool: form.prize_pool.trim() || null,
      image_url: form.image_url.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
    };
    const { error } = await supabase.from("tournaments").insert(payload);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    onCreated();
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: "min(100%,560px)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <strong style={{ fontSize: 18 }}>Créer un tournoi</strong>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          {[
            { label: "Titre *", key: "title", placeholder: "Nom du tournoi" },
            { label: "Jeu", key: "game", placeholder: "Ex: Beat Saber, Pistol Whip…" },
            { label: "URL Image", key: "image_url", placeholder: "https://…" },
            { label: "Prix / Lot", key: "prize_pool", placeholder: "Ex: 25 000 CFA + trophée" },
          ].map(f => (
            <div key={f.key}>
              <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>{f.label}</label>
              <input value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
            </div>
          ))}
          <div>
            <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", font: "inherit", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
          <div className="grid-2">
            <div>
              <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Frais d'inscription (CFA)</label>
              <input type="number" min={0} value={form.entry_fee} onChange={e => set("entry_fee", e.target.value)} />
            </div>
            <div>
              <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Max participants</label>
              <input type="number" min={2} value={form.max_participants} onChange={e => set("max_participants", e.target.value)} placeholder="Illimité" />
            </div>
          </div>
          <div className="grid-2">
            <div>
              <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Date de début</label>
              <input type="datetime-local" value={form.start_date} onChange={e => set("start_date", e.target.value)} />
            </div>
            <div>
              <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Date de fin</label>
              <input type="datetime-local" value={form.end_date} onChange={e => set("end_date", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Statut</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="upcoming">À venir</option>
              <option value="active">En cours</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
          {err && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{err}</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
            <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={loading} style={{ flex: 1 }}>
              {loading ? "…" : "Créer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TournamentsPage({ user }) {
  const [tournaments, setTournaments] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [showCreate, setShowCreate] = React.useState(false);

  async function loadTournaments() {
    const { data } = await supabase.from("tournaments").select("*").order("start_date", { ascending: true });
    setTournaments(data || []);
  }

  React.useEffect(() => { loadTournaments(); }, []);

  if (selected) {
    return <TournamentDetail tournament={selected} user={user} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 className="orbitron" style={{ margin: 0 }}>
          🏆 <span className="accent">TOURNOIS</span>
        </h2>
        {user?.isAdmin && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            + Créer un tournoi
          </button>
        )}
      </div>
      {tournaments.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="muted">Aucun tournoi pour l'instant.</p>
          {user?.isAdmin && (
            <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowCreate(true)}>
              Créer le premier tournoi
            </button>
          )}
        </div>
      )}
      <div style={{ display: "grid", gap: 0 }}>
        {tournaments.map(t => (
          <TournamentCard key={t.id} t={t} onSelect={setSelected} />
        ))}
      </div>
      {showCreate && (
        <CreateTournamentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { loadTournaments(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPageState] = useState("calendar");
  function setPage(p) {
    setPageState(p);
    // Keep URL clean (no hash) — just stay at root since this is a single-page app
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }
  const loginInProgress = React.useRef(false);
  const [user, setUser] = useState(null);
  const [rawUsers, setRawUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [eventBookings, setEventBookings] = useState([]);
  const [rescheduleDraft, setRescheduleDraft] = useState(null);
  const [adminSlotDraft, setAdminSlotDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [forgotModal, setForgotModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [bookingDraft, setBookingDraft] = useState(null);
  const [blockDraft, setBlockDraft] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [membershipPayModal, setMembershipPayModal] = useState(false);
  const [toasts, setToasts] = useState([]);

  const resetUiState = useCallback(() => {
    setAuthModal(false);
    setForgotModal(false);
    setResetModal(false);
    setBookingDraft(null);
    setBlockDraft(null);
    setEditUser(null);
  }, []);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const loadData = useCallback(async (currentUser = null) => {
    try {
      let bookingItems = [];

      if (currentUser?.isAdmin) {
        // Admin: full data including PII
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*")
          .order("start_time", { ascending: true });
        if (bookingsError) { addToast(bookingsError.message, "error"); setLoading(false); return; }
        bookingItems = (bookingsData || []).flatMap(expandBookingRow);
      } else {
        // Non-admin: use security-definer RPC (bypasses RLS, returns no PII)
        const { data: calendarData, error: calendarError } = await supabase
          .rpc("get_calendar_slots")
          .order("start_time", { ascending: true });
        if (calendarError) { addToast(calendarError.message, "error"); setLoading(false); return; }
        const calendarItems = (calendarData || []).flatMap(expandCalendarRow);

        if (currentUser?.id) {
          // Also fetch own full bookings (with PII) for profile page
          const { data: myBookings } = await supabase
            .from("bookings")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("start_time", { ascending: true });
          const myItems = (myBookings || []).flatMap(expandBookingRow);
          const myIds = new Set((myBookings || []).map((b) => b.id));
          // Merge: own full items + other calendar items (no PII)
          bookingItems = [...calendarItems.filter((i) => !myIds.has(i.sourceId)), ...myItems];
        } else {
          bookingItems = calendarItems;
        }
      }

      const { data: blockedData, error: blockedError } = await supabase
        .from("blocked_slots")
        .select("*")
        .order("start_time", { ascending: true });

      if (blockedError) {
        addToast(blockedError.message, "error");
        setLoading(false);
        return;
      }

      const blockedItems = (blockedData || []).flatMap(expandBlockedRow);
      setBookings([...bookingItems, ...blockedItems]);

      const { data: eventsData } = await supabase
        .from("event_bookings")
        .select("*")
        .order("created_at", { ascending: false });
      setEventBookings(eventsData || []);

      if (currentUser?.isAdmin) {
        const { data: usersData } = await supabase.from("users").select("*").order("created_at", { ascending: false });
        const { data: logsData } = await supabase.from("admin_activity_logs").select("*").order("created_at", { ascending: false });
        setRawUsers(usersData || []);
        setLogs(logsData || []);
      } else {
        setRawUsers([]);
        setLogs([]);
      }
    } catch (err) {
      console.error("LOAD DATA CRASH", err);
      addToast(err?.message || "Erreur chargement données.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, setLoading]);

  const ensureUserProfile = useCallback(async (authUser) => {
    try {
      if (!authUser?.id) return null;

      const { data: existing, error: existingError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (existingError) {
        console.error("ENSURE USER PROFILE READ ERROR", existingError);
        return null;
      }

      if (existing) return existing;

      // New user — insert profile into DB
      const newProfile = {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Utilisateur",
        email: authUser.email || "",
        phone: authUser.user_metadata?.phone || "",
        role: "customer",
        is_member: false,
        member_expiry: null,
      };
      const { data: inserted, error: insertError } = await supabase
        .from("users")
        .insert(newProfile)
        .select()
        .single();
      if (insertError) {
        console.error("ENSURE USER PROFILE INSERT ERROR", insertError);
        return newProfile; // fall back to in-memory profile
      }
      return inserted;
    } catch (err) {
      console.error("ENSURE USER PROFILE CRASH", err);
      return null;
    }
  }, []);

  const loadCurrentUser = useCallback(async (authUser, { navigate = false } = {}) => {
    try {
      let resolvedUser = authUser;
      if (!resolvedUser) {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session?.user) { setUser(null); await loadData(null); return; }
        resolvedUser = data.session.user;
      }
      const row = await ensureUserProfile(resolvedUser);
      const built = makeUser(row || {
        id: resolvedUser.id,
        full_name: resolvedUser.user_metadata?.full_name || "Utilisateur",
        email: resolvedUser.email || "",
        phone: resolvedUser.user_metadata?.phone || "",
        role: "customer",
        is_member: false,
        member_expiry: null,
      });
      setUser(built);
      await loadData(built);
      if (navigate) {
        setPage(built.isAdmin ? "admin" : "calendar");
        addToast("Connexion réussie.");
      }
    } catch (err) {
      console.error("LOAD CURRENT USER CRASH", err);
      setUser(null);
      setLoading(false);
    }
  }, [ensureUserProfile, loadData, addToast]);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately on subscribe,
    // so we use it as the single source of truth for the initial auth check.
    // No separate loadCurrentUser() call needed — avoids race with INITIAL_SESSION.
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === "SIGNED_OUT") { setUser(null); setPage("calendar"); loadData(null); return; }
        if (event === "PASSWORD_RECOVERY") { setResetModal(true); return; }
        if (event === "SIGNED_IN") {
          if (!loginInProgress.current) await loadCurrentUser(session?.user, { navigate: true });
        } else if (event === "TOKEN_REFRESHED") {
          if (session?.user) await loadCurrentUser(session.user);
        } else if (event === "INITIAL_SESSION") {
          if (session?.user) {
            await loadCurrentUser(session.user);
          } else {
            // No session on page load — load public data and stop loading spinner
            await loadData(null);
          }
        }
      } catch (err) {
        console.error("AUTH STATE CHANGE CRASH", err);
      }
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, [loadCurrentUser, loadData]);

  // Handle return from PayDunya (fallback: only reached if PDCheckout.js fails and we fell back to full redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pdStatus = params.get("paydunya");
    if (!pdStatus) return;
    window.history.replaceState(null, "", window.location.pathname);
    if (pdStatus === "completed") {
      addToast("Paiement PayDunya reçu ! Confirmation en cours.", "success");
    } else if (pdStatus === "cancelled") {
      addToast("Paiement annulé.", "error");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function logAdminAction(actionType, targetTable, targetId, details = {}) {
    if (!user?.isAdmin) return;
    const { error } = await supabase.from("admin_activity_logs").insert({
      admin_user_id: user.id,
      admin_name: user.name,
      action_type: actionType,
      target_table: targetTable,
      target_id: targetId ? String(targetId) : null,
      details,
    });
    if (error) console.error("Admin log error:", error);
  }

  async function handleLogin(form) {
    if (!form.email || !form.password) {
      addToast("Entrez votre email et mot de passe.", "error");
      return;
    }
    loginInProgress.current = true;
    try {
      const authPromise = supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 15000)
      );
      const { data, error } = await Promise.race([authPromise, timeout]);
      if (error) {
        const msg = error.message || "";
        const fr = msg.includes("Invalid login credentials") ? "Email ou mot de passe incorrect."
          : msg.includes("Email not confirmed") ? "Confirmez votre email avant de vous connecter."
          : msg.includes("Too many requests") ? "Trop de tentatives. Réessayez dans quelques minutes."
          : msg.includes("User not found") ? "Aucun compte avec cet email."
          : msg || "Connexion impossible.";
        addToast(fr, "error");
        return;
      }
      const row = await ensureUserProfile(data.user);
      const built = makeUser(row || {
        id: data.user.id,
        full_name: data.user.user_metadata?.full_name || "Utilisateur",
        email: data.user.email || "",
        phone: data.user.user_metadata?.phone || "",
        role: "customer",
        is_member: false,
        member_expiry: null,
      });
      setUser(built);
      identify(built);
      track("user_logged_in", { method: "email", role: built.role });
      resetUiState();
      setPage(built.isAdmin ? "admin" : "calendar");
      addToast("Connexion réussie.");
      await loadData(built);
    } catch (err) {
      const msg = err?.message === "timeout"
        ? "Connexion trop lente. Vérifiez votre réseau et réessayez."
        : err?.message || "Erreur inattendue.";
      addToast(msg, "error");
    } finally {
      loginInProgress.current = false;
    }
  }

  async function handleRegister(form) {
    if (!form.name || !form.phone || !form.email || !form.password) {
      addToast("Remplissez tous les champs.", "error");
      return;
    }
    const email = form.email.trim();
    loginInProgress.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: { full_name: form.name, phone: form.phone },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) { addToast(error.message, "error"); return; }

      // Session returned immediately — email confirmation disabled
      if (data.session) {
        const row = await ensureUserProfile(data.user);
        const built = makeUser(row || { id: data.user.id, full_name: form.name, email, phone: form.phone, role: "customer", is_member: false, member_expiry: null });
        setUser(built);
        identify(built);
        track("user_registered", { method: "email" });
        emailWelcome(built);
        resetUiState();
        setPage(built.isAdmin ? "admin" : "calendar");
        addToast("Compte créé ! Bienvenue 🎮");
        await loadData(built);
        return;
      }

      // Try signing in immediately (some Supabase configs allow this)
      const { data: signInData } = await supabase.auth.signInWithPassword({ email, password: form.password });
      if (signInData?.session) {
        const row = await ensureUserProfile(signInData.user);
        const built = makeUser(row || { id: signInData.user.id, full_name: form.name, email, phone: form.phone, role: "customer", is_member: false, member_expiry: null });
        setUser(built);
        identify(built);
        track("user_registered", { method: "email" });
        emailWelcome(built);
        resetUiState();
        setPage(built.isAdmin ? "admin" : "calendar");
        addToast("Compte créé ! Bienvenue 🎮");
        await loadData(built);
        return;
      }

      // Email confirmation required — send welcome email and show confirmation screen
      emailWelcome({ email, name: form.name });
      return "email_required";
    } catch (err) {
      addToast(err?.message || "Erreur pendant l'inscription.", "error");
    } finally {
      loginInProgress.current = false;
    }
  }

  async function handleForgotPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) {
      addToast(error.message, "error");
      return;
    }

    setForgotModal(false);
    addToast("Email de réinitialisation envoyé.");
  }

  async function handleResetPassword(password) {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      addToast(error.message, "error");
      return;
    }

    setResetModal(false);
    addToast("Mot de passe mis à jour.");
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) addToast(error.message, "error");
    else track("user_logged_in", { method: "google" });
  }

  async function handleLogout() {
    // Clear UI immediately so the user sees instant feedback
    setUser(null);
    setPage("calendar");
    resetUiState();
    setRawUsers([]);
    setLogs([]);
    setBookings([]);
    setEventBookings([]);
    setMembershipPayModal(false);
    track("user_logged_out");
    reset();
    addToast("Déconnecté.", "info");
    // Sign out locally — no network round-trip required
    try { await supabase.auth.signOut({ scope: "local" }); } catch (_) {}
  }

  async function confirmBooking(promoResult = null, finalAmount = null, paymentMethod = null, guestCount = 0, pointsUsed = 0) {
    if (!bookingDraft || !user) return;

    const start = combineDateAndTime(bookingDraft.dateStr, bookingDraft.time);
    const end = addMinutes(start, bookingDraft.durationMinutes);
    const price = finalAmount !== null ? finalAmount : bookingDraft.amount;
    const isPaydunya = paymentMethod === "paydunya";
    const isCashOrFree = paymentMethod === "cash" || price === 0;

    const { data: inserted, error } = await supabase.from("bookings").insert({
      user_id: user.id,
      customer_name: user.name,
      phone: user.phone,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration: bookingDraft.durationMinutes,
      price,
      status: "confirmed",
      payment_status: isCashOrFree ? "paid" : isPaydunya ? "paydunya_pending" : "pending",
      payment_method: paymentMethod || null,
      promo_code: promoResult?.code || null,
      guest_count: guestCount || 0,
    }).select("id").single();

    if (error) {
      addToast(error.message, "error");
      return;
    }

    if (promoResult?.id) {
      await supabase.rpc("increment_promo_uses", { promo_id: promoResult.id });
    }

    // Deduct redeemed loyalty points
    if (pointsUsed > 0) {
      await supabase.rpc("increment_loyalty_points", { uid: user.id, pts: -pointsUsed });
    }

    // PayDunya: slot reserved, return booking ID for BookModal to handle inline payment
    if (isPaydunya && inserted?.id) {
      track("booking_created", { duration: bookingDraft.durationMinutes, amount: price, payment_method: "paydunya", promo_used: !!promoResult });
      setBookingDraft(null);
      return { bookingId: inserted.id };
    }

    const draft = { ...bookingDraft };
    setBookingDraft(null);
    await loadData(user);
    addToast("Réservation confirmée.");
    track("booking_created", { duration: draft?.durationMinutes, amount: finalAmount, payment_method: paymentMethod, promo_used: !!promoResult });
    emailBookingConfirmed(user, { dateStr: draft?.dateStr, time: draft?.time, durationLabel: draft?.durationLabel, amount: finalAmount });

    const msg = [
      `✅ *Nouvelle réservation — Jeux Dia VR*`,
      `👤 Nom : ${user.name}`,
      `📞 Téléphone : ${user.phone}`,
      `📅 Date : ${draft.dateStr}`,
      `🕐 Heure : ${draft.time}`,
      `⏱ Durée : ${draft.durationMinutes >= 60 ? "1 heure" : "15 min"}`,
      `💰 Montant : ${price > 0 ? price.toLocaleString("fr-FR") + " CFA" : "0 CFA (Membre)"}`,
      promoResult ? `🎟 Code promo : ${promoResult.code}` : "",
      ``,
      `Merci de confirmer le paiement à l'arrivée.`,
    ].filter(Boolean).join("\n");

    window.open(`https://wa.me/22893695463?text=${encodeURIComponent(msg)}`, "_blank");
  }

  async function confirmBlock(reason, slotOverride = null) {
    const slot = slotOverride || blockDraft;
    if (!slot || !user?.isAdmin) return;

    const start = combineDateAndTime(slot.dateStr, slot.time);
    const end = addMinutes(start, 20);

    const { data, error } = await supabase
      .from("blocked_slots")
      .insert({ start_time: start.toISOString(), end_time: end.toISOString(), reason })
      .select()
      .single();

    if (error) { addToast(error.message, "error"); return; }

    await logAdminAction("BLOCK_SLOT", "blocked_slots", data?.id, { dateStr: slot.dateStr, time: slot.time, reason });

    if (!slotOverride) setBlockDraft(null);
    await loadData(user);
    addToast("Créneau bloqué.", "info");
  }

  async function handleUnblock(item) {
    const { error } = await supabase.from("blocked_slots").delete().eq("id", item.sourceId);

    if (error) {
      addToast(error.message, "error");
      return;
    }

    await logAdminAction("UNBLOCK_SLOT", "blocked_slots", item.sourceId, {
      dateStr: item.dateStr,
      time: item.time,
    });

    await loadData(user);
    addToast("Créneau débloqué.");
  }

  async function handleAdminBookOverride(form) {
    if (!adminSlotDraft) return;
    const { dateStr, time } = adminSlotDraft;
    const start = combineDateAndTime(dateStr, time);
    const end = addMinutes(start, form.duration);

    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      customer_name: form.name,
      phone: form.phone,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration: form.duration,
      price: form.price,
      status: "confirmed",
      payment_status: form.price === 0 ? "paid" : "pending",
      payment_method: form.payment_method || null,
    });

    if (error) { addToast(error.message, "error"); return; }

    await logAdminAction("MANUAL_BOOKING", "bookings", null, { name: form.name, phone: form.phone, dateStr, time });
    setAdminSlotDraft(null);
    await loadData(user);
    addToast(`Réservation créée pour ${form.name}.`);
  }

  async function handleConfirmEvent(id) {
    const { error } = await supabase.from("event_bookings").update({ status: "confirmed" }).eq("id", id);
    if (error) { addToast(error.message, "error"); return; }
    await logAdminAction("CONFIRM_EVENT", "event_bookings", id, {});
    await loadData(user);
    addToast("Événement confirmé.");
  }

  async function handleCancelEvent(id) {
    const { error } = await supabase.from("event_bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) { addToast(error.message, "error"); return; }
    await logAdminAction("CANCEL_EVENT", "event_bookings", id, {});
    await loadData(user);
    addToast("Événement refusé.", "info");
  }

  async function handleSubmitEvent(form) {
    if (!user) return;

    const { error } = await supabase.from("event_bookings").insert({
      user_id: user.id,
      customer_name: user.name,
      phone: user.phone,
      event_date: form.eventDate,
      start_time: form.startTime,
      guest_count: form.guests,
      duration_hours: form.hours,
      distance_km: form.distanceKm,
      location_description: form.location,
      notes: form.notes,
      total_price: form.total,
      status: "pending",
    });

    if (error) {
      addToast(error.message, "error");
      return;
    }

    addToast("Demande envoyée ! Nous vous contactons sous 24h.");
    setPage("calendar");

    const msg = [
      `🎉 *Demande d'événement VR — Jeux Dia*`,
      `👤 ${user.name} | 📞 ${user.phone}`,
      `📅 Date : ${form.eventDate} à ${form.startTime}`,
      `👥 Invités : ${form.guests} personnes`,
      `⏱ Durée : ${form.hours}h`,
      `📍 Lieu : ${form.location}`,
      `🗺 Localisation : https://www.google.com/maps/search/${encodeURIComponent(form.location + ", Lomé, Togo")}`,
      `💰 Devis total : ${formatCFA(form.total)}`,
      form.notes ? `📝 Notes : ${form.notes}` : "",
    ].filter(Boolean).join("\n");

    window.open(`https://wa.me/22893695463?text=${encodeURIComponent(msg)}`, "_blank");
  }

  async function handleReschedule({ dateStr, time }) {
    if (!rescheduleDraft) return;
    const start = combineDateAndTime(dateStr, time);
    const end = addMinutes(start, rescheduleDraft.durationMinutes);

    const { error } = await supabase
      .from("bookings")
      .update({
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      })
      .eq("id", rescheduleDraft.sourceId);

    if (error) { addToast(error.message, "error"); return; }

    setRescheduleDraft(null);
    await loadData(user);
    addToast("Réservation modifiée.");
  }

  async function handleSaveProfile(form) {
    if (!form.name || !form.phone) {
      addToast("Nom et téléphone requis.", "error");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .update({ full_name: form.name, phone: form.phone })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      addToast(error.message, "error");
      return;
    }

    setUser(makeUser(data));
    addToast("Profil mis à jour.");
  }

  async function handleCancelBooking(booking) {
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", booking.sourceId);

    if (error) {
      addToast(error.message, "error");
      return;
    }

    await loadData(user);
    addToast("Réservation annulée.", "info");
  }

  async function handleAdminCancelBooking(booking) {
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", booking.sourceId);

    if (error) {
      addToast(error.message, "error");
      return;
    }

    await logAdminAction("CANCEL_BOOKING", "bookings", booking.sourceId, {
      customer: booking.name,
      date: booking.dateStr,
      time: booking.time,
    });

    await loadData(user);
    addToast(`Réservation annulée — ${booking.name}.`, "info");
  }

  async function handleConfirmPayment(booking) {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ payment_status: "paid" })
        .eq("id", booking.sourceId);
      if (error) { addToast(error.message, "error"); return; }

      const pointsEarned = Math.floor(Number(booking.amount || 0) / 1000);
      if (pointsEarned > 0 && booking.userId) {
        await supabase.rpc("increment_loyalty_points", { uid: booking.userId, pts: pointsEarned });
      }

      await logAdminAction("CONFIRM_PAYMENT", "bookings", booking.sourceId, { customer: booking.name, amount: booking.amount, points: pointsEarned });
      await loadData(user);
      addToast(`✅ Paiement confirmé — ${booking.name}${pointsEarned > 0 ? ` (+${pointsEarned} pts)` : ""}`);
      track("payment_confirmed_admin", { amount: booking.amount, points_earned: pointsEarned });
      emailPaymentConfirmed({ email: booking.email, name: booking.name }, booking);
    } catch (err) {
      addToast(err?.message || "Erreur confirmation paiement.", "error");
    }
  }

  async function handleRejectPayment(booking) {
    const { error } = await supabase
      .from("bookings")
      .update({ payment_status: "rejected", status: "cancelled" })
      .eq("id", booking.sourceId);
    if (error) { addToast(error.message, "error"); return; }
    await logAdminAction("REJECT_PAYMENT", "bookings", booking.sourceId, { customer: booking.name, amount: booking.amount });
    await loadData(user);
    addToast(`Paiement rejeté — ${booking.name}`, "error");
  }

  function handleActivateMembership() {
    if (!user) return;
    setMembershipPayModal(true);
  }

  async function handleMembershipPayConfirm(promoResult = null) {
    if (!user) return;
    const { error } = await supabase
      .from("users")
      .update({ membership_pending: true })
      .eq("id", user.id);
    if (error) { addToast(error.message, "error"); return; }
    if (promoResult?.id) {
      await supabase.rpc("increment_promo_uses", { promo_id: promoResult.id });
    }
    setMembershipPayModal(false);
    addToast("Demande envoyée. L'admin activera votre pass après vérification du paiement.");
    const BASE_PRICE = 10000;
    const discount = promoResult
      ? promoResult.discount_type === "percent"
        ? Math.round(BASE_PRICE * promoResult.discount_value / 100)
        : Math.min(promoResult.discount_value, BASE_PRICE)
      : 0;
    const finalPrice = BASE_PRICE - discount;
    const msg = [
      `💜 *Demande Pass Membre — Jeux Dia VR*`,
      `👤 Nom : ${user.name}`,
      `📞 Téléphone : ${user.phone || "—"}`,
      promoResult ? `🎟️ Code promo : ${promoResult.code} (-${discount.toLocaleString()} CFA)` : null,
      `💰 Montant : ${finalPrice === 0 ? "GRATUIT" : `${finalPrice.toLocaleString()} CFA`}`,
      ``,
      `Veuillez vérifier le paiement Mixx et activer le membership.`,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/22893695463?text=${encodeURIComponent(msg)}`, "_blank");
  }

  async function handleConfirmMembership(targetUser) {
    try {
      const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("users")
        .update({ is_member: true, member_expiry: expiry, membership_pending: false })
        .eq("id", targetUser.id);
      if (error) { addToast(error.message, "error"); return; }
      await logAdminAction("ACTIVATE_MEMBERSHIP", "users", targetUser.id, { name: targetUser.full_name });
      await loadData(user);
      addToast(`✅ Membership activé — ${targetUser.full_name}`);
      track("membership_activated_admin", { user_id: targetUser.id });
      emailMembershipActivated({ email: targetUser.email, name: targetUser.full_name });
    } catch (err) {
      addToast(err?.message || "Erreur activation membership.", "error");
    }
  }

  async function handleRejectMembership(targetUser) {
    const { error } = await supabase
      .from("users")
      .update({ membership_pending: false })
      .eq("id", targetUser.id);
    if (error) { addToast(error.message, "error"); return; }
    await loadData(user);
    addToast(`Demande membership rejetée — ${targetUser.full_name}`, "error");
  }

  async function handleSaveUserEdit(form) {
    if (!editUser) return;

    const { error } = await supabase
      .from("users")
      .update(form)
      .eq("id", editUser.id);

    if (error) {
      addToast(error.message, "error");
      return;
    }

    await logAdminAction("EDIT_USER", "users", editUser.id, form);
    setEditUser(null);
    await loadData(user);
    addToast("Utilisateur mis à jour.");
  }

  const navItems = user?.isAdmin
    ? [
        { id: "admin", label: "Dashboard" },
        { id: "calendar", label: "Calendrier" },
        { id: "tournaments", label: "Tournois" },
      ]
    : [
        { id: "calendar", label: "Réserver" },
        { id: "events", label: "Événements" },
        { id: "tournaments", label: "Tournois" },
        { id: "membership", label: "Membership" },
        ...(user ? [{ id: "profile", label: "Profil" }] : []),
      ];

  const bookingConfirmData = useMemo(() => {
    if (!bookingDraft) return null;

    return {
      ...bookingDraft,
      amount: bookingDraft.amount,
    };
  }, [bookingDraft]);

  return (
    <ErrorBoundary>
      <div className="page">
        <GlobalStyle />

        <header className="header">
          <div className="container header-inner">
            <button
              type="button"
              className="logo-btn"
              onClick={() => {
                console.log("LOGO CLICK");
                setPage("calendar");
                resetUiState();
              }}
            >
              <img src={jdLogo} alt="Jeux Dia" />
            </button>

            <div className="nav">
              {navItems.map((item) => (
                <div
                  key={item.id}
                  className={`nav-item ${page === item.id ? "active" : ""}`}
                  onClick={() => setPage(item.id)}
                >
                  {item.label}
                </div>
              ))}

              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
                  <div
                    style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent2), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, cursor: "pointer", flexShrink: 0, color: "#000" }}
                    onClick={() => setPage(user.isAdmin ? "admin" : "profile")}
                    title={user.name}
                  >
                    {(user.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>Sortir</button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthModal(true);
                  }}
                >
                  Connexion
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="container main-content">
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div className="spinner" />
              <p className="muted">Chargement…</p>
            </div>
          )}
          {!loading && !user && page === "calendar" && (
            <div className="hero" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,245,212,0.08))", borderColor: "rgba(124,58,237,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span className="tag tag-cyan">OUVERT</span>
                <span className="muted" style={{ fontSize: 11, fontFamily: "monospace" }}>09:00 – 20:40 · 7j/7</span>
              </div>
              <h1 className="orbitron" style={{ fontSize: 30, lineHeight: 1.15, marginBottom: 10, marginTop: 0 }}>
                Vivez la réalité<br /><span className="accent">virtuelle</span> à Lomé
              </h1>
              <p className="muted" style={{ marginBottom: 20, fontSize: 15 }}>
                Réservez votre session VR en ligne. Payez par Mixx.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthModal(true);
                  }}
                >
                  Créer un compte →
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthModal(true);
                  }}
                >
                  Se connecter
                </button>
              </div>
            </div>
          )}

          {!loading && page === "calendar" && (
            <CalendarView
              user={user}
              bookings={bookings}
              addToast={addToast}
              onOpenBooking={setBookingDraft}
              onOpenBlock={(dateStr, time) => setBlockDraft({ dateStr, time })}
              onOpenAdminSlot={(dateStr, time) => setAdminSlotDraft({ dateStr, time })}
            />
          )}

          {!loading && page === "events" && (
            <EventsPage user={user} onSubmit={handleSubmitEvent} />
          )}

          {!loading && page === "tournaments" && (
            <TournamentsPage user={user} />
          )}

          {!loading && page === "membership" && (
            <MembershipPage user={user} onActivate={handleActivateMembership} />
          )}

          {!loading && page === "profile" && user && <ProfilePage user={user} bookings={bookings} onCancel={handleCancelBooking} onReschedule={setRescheduleDraft} onSaveProfile={handleSaveProfile} onChangePassword={() => setResetModal(true)} />}

          {!loading && page === "admin" && user?.isAdmin && (
            <AdminDashboard
              users={rawUsers}
              bookings={bookings}
              logs={logs}
              eventBookings={eventBookings}
              onEditUser={setEditUser}
              onUnblock={handleUnblock}
              onConfirmPayment={handleConfirmPayment}
              onRejectPayment={handleRejectPayment}
              onAdminCancel={handleAdminCancelBooking}
              onConfirmEvent={handleConfirmEvent}
              onCancelEvent={handleCancelEvent}
              onConfirmMembership={handleConfirmMembership}
              onRejectMembership={handleRejectMembership}
            />
          )}
        </main>

        {!user && (
          <div
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(13,18,32,0.95)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "center",
            }}
            className="bottom-cta"
          >
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setAuthMode("login");
                setAuthModal(true);
              }}
            >
              Se connecter
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setAuthMode("register");
                setAuthModal(true);
              }}
            >
              Créer un compte
            </button>
          </div>
        )}

        {authModal && (
          <AuthModal
            mode={authMode}
            onClose={() => setAuthModal(false)}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onForgotPassword={() => {
              setAuthModal(false);
              setForgotModal(true);
            }}
            onGoogleLogin={handleGoogleLogin}
          />
        )}

        {forgotModal && (
          <ForgotPasswordModal
            onClose={() => setForgotModal(false)}
            onSubmit={handleForgotPassword}
          />
        )}

        {resetModal && (
          <ResetPasswordModal
            onClose={() => setResetModal(false)}
            onSubmit={handleResetPassword}
          />
        )}

        {membershipPayModal && (
          <MembershipPayModal
            onClose={() => setMembershipPayModal(false)}
            onConfirm={handleMembershipPayConfirm}
          />
        )}

        {bookingConfirmData && (
          <BookModal
            booking={bookingConfirmData}
            isMember={user?.memberStatus === "active"}
            user={user}
            onClose={() => setBookingDraft(null)}
            onConfirm={confirmBooking}
          />
        )}

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

        {adminSlotDraft && (
          <AdminSlotModal
            dateStr={adminSlotDraft.dateStr}
            time={adminSlotDraft.time}
            onClose={() => setAdminSlotDraft(null)}
            onBlock={(reason) => { const slot = adminSlotDraft; setAdminSlotDraft(null); confirmBlock(reason, slot); }}
            onBook={handleAdminBookOverride}
          />
        )}

        {rescheduleDraft && (
          <RescheduleModal
            booking={rescheduleDraft}
            bookings={bookings}
            onClose={() => setRescheduleDraft(null)}
            onConfirm={handleReschedule}
          />
        )}

        <Toasts items={toasts} />
      </div>
    </ErrorBoundary>
  );
}