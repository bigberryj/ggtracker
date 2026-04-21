// Data layer — backed by PostgreSQL via /api/state
// localStorage is used as a read-through cache for instant initial render.

const STORAGE_KEY = 'gg_payment_tracker_v1';

// ── Helpers ───────────────────────────────────────────────────────────────────

function paymentStatusMeta(status) {
  const map = {
    'fully-paid':   { label: 'Fully paid',   color: 'sage',       dot: 'var(--sage-600)' },
    'deposit-paid': { label: 'Deposit paid', color: 'honey',      dot: 'var(--honey-500)' },
    'partial':      { label: 'Partial',      color: 'honey',      dot: 'var(--honey-600)' },
    'unpaid':       { label: 'Unpaid',       color: 'muted',      dot: 'var(--ink-400)' },
    'overdue':      { label: 'Overdue',      color: 'terracotta', dot: 'var(--terra-600)' },
    'refunded':     { label: 'Refunded',     color: 'muted',      dot: 'var(--ink-300)' },
  };
  return map[status] || map.unpaid;
}

function formatDate(iso, opts = {}) {
  if (!iso) return '';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: opts.year ? 'numeric' : undefined });
}

function formatDateLong(iso) {
  if (!iso) return '';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatMoney(n) {
  if (n == null) return '—';
  return '$' + n.toFixed(2).replace(/\.00$/, '');
}

function daysUntil(iso) {
  if (!iso) return null;
  const target = new Date(iso + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

function readCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function writeCache(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchState() {
  const res = await fetch('/api/state');
  if (res.status === 401) throw Object.assign(new Error('Unauthenticated'), { status: 401 });
  if (!res.ok) throw new Error('Failed to fetch state');
  const { data } = await res.json();
  writeCache(data);
  return data;
}

async function pushState(state) {
  writeCache(state);
  try {
    const res = await fetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: state }),
    });
    if (res.status === 401) {
      // Session expired — reload to show login
      window.location.reload();
    }
  } catch (e) {
    console.warn('Failed to persist state to server:', e);
  }
}

// ── Public surface ────────────────────────────────────────────────────────────

function loadState() {
  return readCache() || null;
}

// saveState is role-aware: admins push full state; parents update via specific endpoints
function saveState(state) {
  // __currentUserRole is set by the App component on mount and role change
  if (window.__currentUserRole !== 'parent') {
    pushState(state);
  } else {
    writeCache(state); // update local cache for immediate UI
  }
}

function resetState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

// Specific parent-safe API calls (bypass full state PUT)
async function apiPostMessage({ eventId, thread, to, body }) {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, thread, to, body }),
  });
  if (!res.ok) throw new Error('Failed to post message');
  return (await res.json()).msg;
}

async function apiPutRsvp(paymentId, rsvp) {
  const res = await fetch(`/api/rsvp/${paymentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rsvp }),
  });
  if (!res.ok) throw new Error('Failed to update RSVP');
}

Object.assign(window, {
  loadState, saveState, resetState, fetchState, pushState,
  apiPostMessage, apiPutRsvp, today,
  paymentStatusMeta, formatDate, formatDateLong, formatMoney, daysUntil,
});
