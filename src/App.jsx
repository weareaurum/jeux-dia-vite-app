import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import logoImg from "./assets/jdlo.png";

const TIME_SLOTS = [
  "09:00","09:20","09:40","10:00","10:20","10:40","11:00","11:20","11:40",
  "12:00","12:20","12:40","13:00","13:20","13:40","14:00","14:20","14:40",
  "15:00","15:20","15:40","16:00","16:20","16:40","17:00","17:20","17:40",
  "18:00","18:20","18:40","19:00","19:20","19:40","20:00"
];

const DURATIONS = [
  { label: "15 min", minutes: 15, slots: 1, price: 1000 },
  { label: "1 heure", minutes: 60, slots: 4, price: 3000 },
];

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

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
        width: min(100%, 900px);
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

      .nav-item.active {
        color: var(--accent);
        background: rgba(0,245,212,0.08);
      }

      .btn {
        border: none;
        border-radius: 10px;
        padding: 11px 18px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .btn-primary {
        background: var(--accent);
        color: #000;
      }

      .btn-ghost {
        background: transparent;
        color: var(--accent);
        border: 1px solid var(--accent);
      }

      .btn-danger {
        background: var(--danger);
        color: white;
      }

      .btn-purple {
        background: var(--accent2);
        color: white;
      }

      .btn-sm {
        padding: 8px 12px;
        font-size: 12px;
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

      @media (max-width: 700px) {
        .grid-2, .grid-3 { grid-template-columns: 1fr; }
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

function makeUser(row) {
  const now = new Date();
  const expiry = row?.member_expiry ? new Date(row.member_expiry) : null;
  const active = !!row?.is_member && expiry && expiry > now;
  const expired = !!row?.is_member && expiry && expiry <= now;

  return {
    id: row.id,
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
    isPrimary: i === 0,
    amount: i === 0 ? row.price || 0 : 0,
    durationLabel: minutes >= 60 ? "1 heure" : "15 min",
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
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <div className="logo-btn" style={{ width: 110, height: 110, cursor: "default" }}>
          <img src={logoImg} alt="Jeux Dia" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button className={`btn ${tab === "login" ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1 }} onClick={() => setTab("login")}>
          Connexion
        </button>
        <button className={`btn ${tab === "register" ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1 }} onClick={() => setTab("register")}>
          Inscription
        </button>
      </div>

      {tab === "login" ? (
        <>
          <div style={{ display: "grid", gap: 12 }}>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </div>

          <div style={{ marginTop: 10, marginBottom: 16 }}>
            <button
              className="btn"
              style={{ background: "none", color: "var(--accent)", padding: 0 }}
              onClick={onForgotPassword}
            >
              Mot de passe oublié ?
            </button>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <button className="btn btn-primary" onClick={() => onLogin(form)}>
              Se connecter →
            </button>
            <button className="btn btn-ghost" onClick={onGoogleLogin}>
              Continuer avec Google
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "grid", gap: 12 }}>
            <input
              placeholder="Nom complet"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
            <input
              placeholder="Téléphone"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => onRegister(form)}>
              Créer mon compte →
            </button>
            <button className="btn btn-ghost" onClick={onGoogleLogin}>
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
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
          Annuler
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSubmit(email)}>
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
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
          Fermer
        </button>
        <button
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

function BookModal({ booking, isMember, onClose, onConfirm }) {
  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginTop: 0 }}>
        {isMember ? "Réservation Membre" : "Confirmer la réservation"}
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
        <div className="list-row" style={{ borderBottom: "none" }}>
          <span className="muted">Montant</span>
          <strong>{isMember ? "0 CFA" : formatCFA(booking.amount)}</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
          Annuler
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={onConfirm}>
          Confirmer
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
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
          Annuler
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave(form)}>
          Sauvegarder
        </button>
      </div>
    </Modal>
  );
}

function CalendarView({ user, bookings, onOpenBooking, onOpenBlock, addToast }) {
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
      if (status.type === "available") onOpenBlock(dateStr, time);
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
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset((v) => v - 1)}>
            ← Semaine précédente
          </button>
          <div className="muted">
            {MONTHS[weekDates[0].getMonth()]} {weekDates[0].getFullYear()}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset((v) => v + 1)}>
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
              <div className="orbitron" style={{ fontWeight: 700, fontSize: 22, marginBottom: 6 }}>{d.label}</div>
              <div style={{ color: user?.memberStatus === "active" ? "#6ee7b7" : "#fcd34d", fontWeight: 700 }}>
                {user?.memberStatus === "active" ? "0 CFA ✦" : formatCFA(d.price)}
              </div>
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
            <p style={{ fontWeight: 700, color: "#fcd34d" }}>10,000 CFA</p>
            {user ? (
              <button className="btn btn-purple" onClick={onActivate}>
                Activer le Pass Membre
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

function ProfilePage({ user, bookings }) {
  const mine = bookings.filter(
    (b) =>
      b.phone === user?.phone &&
      b.isPrimary &&
      (b.type === "booked" || b.type === "member")
  );

  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{user?.name}</h2>
        <div className="muted">{user?.email}</div>
        <div className="muted">{user?.phone}</div>
        {user?.memberStatus === "active" && (
          <div style={{ marginTop: 10 }}>
            <span className="tag tag-green">MEMBRE ACTIF</span>
          </div>
        )}
      </div>

      <div className="card">
        <strong>Mes réservations</strong>
        {mine.length === 0 ? (
          <p className="muted">Aucune réservation.</p>
        ) : (
          mine.map((b) => (
            <div key={b.id} className="list-row">
              <div>
                <div>{b.dateStr} à {b.time}</div>
                <div className="muted" style={{ fontSize: 12 }}>{b.durationLabel}</div>
              </div>
              <div>{b.type === "member" ? "0 CFA" : formatCFA(b.amount)}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function AdminDashboard({ users, bookings, logs, onEditUser, onUnblock }) {
  const today = toDateStr(new Date());
  const todayBookings = bookings.filter((b) => b.dateStr === today && b.isPrimary && (b.type === "booked" || b.type === "member"));
  const blocked = bookings.filter((b) => b.type === "blocked" && b.isPrimary);

  return (
    <>
      <div className="grid-3">
        <div className="card">
          <div className="muted">Utilisateurs</div>
          <div className="orbitron" style={{ fontSize: 28, fontWeight: 700 }}>{users.length}</div>
        </div>
        <div className="card">
          <div className="muted">Réservations du jour</div>
          <div className="orbitron" style={{ fontSize: 28, fontWeight: 700 }}>{todayBookings.length}</div>
        </div>
        <div className="card">
          <div className="muted">Créneaux bloqués</div>
          <div className="orbitron" style={{ fontSize: 28, fontWeight: 700 }}>{blocked.length}</div>
        </div>
      </div>

      <div className="card">
        <strong>Utilisateurs</strong>
        {users.map((u) => (
          <div key={u.id} className="list-row">
            <div>
              <div>{u.full_name || "—"}</div>
              <div className="muted" style={{ fontSize: 12 }}>{u.email || "—"} · {u.phone || "—"}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className={`tag ${u.role === "admin" ? "tag-purple" : u.is_member ? "tag-green" : "tag-amber"}`}>
                {u.role === "admin" ? "ADMIN" : u.is_member ? "MEMBRE" : "CLIENT"}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => onEditUser(u)}>
                Modifier
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <strong>Créneaux bloqués</strong>
        {blocked.length === 0 ? (
          <p className="muted">Aucun créneau bloqué.</p>
        ) : (
          blocked.map((b) => (
            <div key={b.id} className="list-row">
              <div>
                <div>{b.dateStr} à {b.time}</div>
                <div className="muted" style={{ fontSize: 12 }}>{b.reason || "Bloqué"}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onUnblock(b)}>
                Débloquer
              </button>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <strong>Journal admin</strong>
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

export default function App() {
  const [page, setPage] = useState("calendar");
  const [user, setUser] = useState(null);
  const [rawUsers, setRawUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [authModal, setAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [forgotModal, setForgotModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [bookingDraft, setBookingDraft] = useState(null);
  const [blockDraft, setBlockDraft] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const loadData = useCallback(async (currentUser = null) => {
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("start_time", { ascending: true });

    const { data: blockedData, error: blockedError } = await supabase
      .from("blocked_slots")
      .select("*")
      .order("start_time", { ascending: true });

    if (bookingsError || blockedError) {
      const realError =
  bookingsError?.message ||
  blockedError?.message ||
  "Erreur Supabase";

console.error("LOAD DATA ERROR", {
  bookingsError,
  blockedError,
  currentUser,
});

addToast(realError, "error");
      return;
    }

    const bookingItems = (bookingsData || []).flatMap(expandBookingRow);
    const blockedItems = (blockedData || []).flatMap(expandBlockedRow);
    setBookings([...bookingItems, ...blockedItems]);

    if (currentUser?.isAdmin) {
      const { data: usersData } = await supabase.from("users").select("*").order("created_at", { ascending: false });
      const { data: logsData } = await supabase.from("admin_activity_logs").select("*").order("created_at", { ascending: false });
      setRawUsers(usersData || []);
      setLogs(logsData || []);
    } else {
      setRawUsers([]);
      setLogs([]);
    }
  }, [addToast]);

  const ensureUserProfile = useCallback(async (authUser) => {
    if (!authUser?.id) return null;

    const { data: existing, error: existingError } = await supabase
  .from("users")
  .select("*")
  .eq("id", authUser.id)
  .maybeSingle();

if (existingError) {
  console.error("ENSURE USER PROFILE READ ERROR", existingError);
}

    if (existing) return existing;

    const { data: inserted, error: insertedError } = await supabase
  .from("users")
  .insert({
    id: authUser.id,
    full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Utilisateur",
    email: authUser.email || "",
    phone: authUser.user_metadata?.phone || "",
    role: "customer",
    is_member: false,
  })
  .select()
  .single();

if (insertedError) {
  console.error("ENSURE USER PROFILE INSERT ERROR", insertedError);
}

    return inserted || null;
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const authUser = data?.session?.user;

    if (!authUser) {
      setUser(null);
      await loadData(null);
      return;
    }

    const row = await ensureUserProfile(authUser);
    if (row) {
      const built = makeUser(row);
      setUser(built);
      await loadData(built);
    }
  }, [ensureUserProfile, loadData]);

  useEffect(() => {
    loadCurrentUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event) => {
      await loadCurrentUser();
      if (event === "PASSWORD_RECOVERY") {
        setResetModal(true);
      }
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, [loadCurrentUser]);

  async function logAdminAction(actionType, targetTable, targetId, details = {}) {
    if (!user?.isAdmin) return;
    await supabase.from("admin_activity_logs").insert({
      admin_user_id: user.id,
      admin_name: user.name,
      action_type: actionType,
      target_table: targetTable,
      target_id: targetId ? String(targetId) : null,
      details,
    });
  }

  async function handleLogin(form) {
  console.log("LOGIN CLICKED", form);

  const { error, data } = await supabase.auth.signInWithPassword({
    email: form.email,
    password: form.password,
  });

  console.log("LOGIN RESULT", { error, data });

  if (error) {
    addToast(error.message, "error");
    return;
  }

  const row = await ensureUserProfile(data.user);
  const built = makeUser(row);
  setUser(built);
  setAuthModal(false);
  setPage(built.isAdmin ? "admin" : "calendar");
  await loadData(built);
  addToast("Connexion réussie.");
}
  
  async function handleRegister(form) {
  console.log("REGISTER CLICKED", form);

  if (!form.name || !form.phone || !form.email || !form.password) {
    addToast("Remplissez tous les champs.", "error");
    return;
  }

  const { error, data } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
    options: {
      data: {
        full_name: form.name,
        phone: form.phone,
      },
      emailRedirectTo: "https://jeux-dia-vite-app.vercel.app",
    },
  });

  console.log("REGISTER RESULT", { error, data });

  if (error) {
    addToast(error.message, "error");
    return;
  }

  if (data.user) {
    await supabase.from("users").upsert({
      id: data.user.id,
      full_name: form.name,
      phone: form.phone,
      email: form.email,
      role: "customer",
      is_member: false,
    });
  }

  setAuthModal(false);
  addToast("Compte créé. Vérifiez votre email si confirmation activée.");
}

  async function handleForgotPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://jeux-dia-vite-app.vercel.app",
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
        redirectTo: "https://jeux-dia-vite-app.vercel.app",
      },
    });

    if (error) addToast(error.message, "error");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setPage("calendar");
    addToast("Déconnecté.", "info");
  }

  async function confirmBooking() {
    if (!bookingDraft || !user) return;

    const start = combineDateAndTime(bookingDraft.dateStr, bookingDraft.time);
    const end = addMinutes(start, bookingDraft.durationMinutes);

    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      customer_name: user.name,
      phone: user.phone,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration: bookingDraft.durationMinutes,
      price: bookingDraft.amount,
      status: "confirmed",
    });

    if (error) {
      addToast(error.message, "error");
      return;
    }

    setBookingDraft(null);
    await loadData(user);
    addToast("Réservation confirmée.");
  }

  async function confirmBlock(reason) {
    if (!blockDraft || !user?.isAdmin) return;

    const start = combineDateAndTime(blockDraft.dateStr, blockDraft.time);
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
      addToast(error.message, "error");
      return;
    }

    await logAdminAction("BLOCK_SLOT", "blocked_slots", data?.id, {
      dateStr: blockDraft.dateStr,
      time: blockDraft.time,
      reason,
    });

    setBlockDraft(null);
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

  async function handleActivateMembership() {
    if (!user) return;

    const expiry = addMinutes(new Date(), 30 * 24 * 60).toISOString();

    const { data, error } = await supabase
      .from("users")
      .update({ is_member: true, member_expiry: expiry })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      addToast(error.message, "error");
      return;
    }

    const built = makeUser(data);
    setUser(built);
    await loadData(built);
    addToast("Membership activé.");
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
      ]
    : [
        { id: "calendar", label: "Réserver" },
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
    <div className="page">
      <GlobalStyle />

      <header className="header">
        <div className="container header-inner">
          <button className="logo-btn" onClick={() => setPage("calendar")}>
            <img src={logoImg} alt="Jeux Dia" />
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
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Sortir
              </button>
            ) : (
              <button
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

      <main className="container" style={{ paddingTop: 24, paddingBottom: 90 }}>
        {!user && page === "calendar" && (
          <div className="hero">
            <div className="tag tag-cyan">OUVERT</div>
            <h1 className="orbitron" style={{ fontSize: 34, lineHeight: 1.1, marginBottom: 10 }}>
              Vivez la réalité <span className="accent">virtuelle</span> à Lomé
            </h1>
            <p className="muted" style={{ marginBottom: 18 }}>
              Réservez votre session VR en ligne.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setAuthMode("register");
                  setAuthModal(true);
                }}
              >
                Créer un compte →
              </button>
              <button
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

        {page === "calendar" && (
          <CalendarView
            user={user}
            bookings={bookings}
            addToast={addToast}
            onOpenBooking={setBookingDraft}
            onOpenBlock={(dateStr, time) => setBlockDraft({ dateStr, time })}
          />
        )}

        {page === "membership" && (
          <MembershipPage user={user} onActivate={handleActivateMembership} />
        )}

        {page === "profile" && user && <ProfilePage user={user} bookings={bookings} />}

        {page === "admin" && user?.isAdmin && (
          <AdminDashboard
            users={rawUsers}
            bookings={bookings}
            logs={logs}
            onEditUser={setEditUser}
            onUnblock={handleUnblock}
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
            padding: 14,
            display: "flex",
            gap: 10,
            justifyContent: "center",
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => {
              setAuthMode("login");
              setAuthModal(true);
            }}
          >
            Se connecter
          </button>
          <button
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

      {bookingConfirmData && (
        <BookModal
          booking={bookingConfirmData}
          isMember={user?.memberStatus === "active"}
          onClose={() => setBookingDraft(null)}
          onConfirm={confirmBooking}
        />
      )}

      {blockDraft && (
        <Modal onClose={() => setBlockDraft(null)}>
          <h3 style={{ marginTop: 0 }}>Bloquer ce créneau</h3>
          <p className="muted">
            {blockDraft.dateStr} à {blockDraft.time}
          </p>
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            <button className="btn btn-danger" onClick={() => confirmBlock("Maintenance")}>
              Maintenance
            </button>
            <button className="btn btn-danger" onClick={() => confirmBlock("Événement privé")}>
              Événement privé
            </button>
            <button className="btn btn-danger" onClick={() => confirmBlock("Nettoyage")}>
              Nettoyage
            </button>
            <button className="btn btn-ghost" onClick={() => setBlockDraft(null)}>
              Annuler
            </button>
          </div>
        </Modal>
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
  );
}