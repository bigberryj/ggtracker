// Data layer — backed by PostgreSQL via /api/state
// localStorage is used as a read-through cache for instant initial render.

const STORAGE_KEY = 'gg_payment_tracker_v1';

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  if (!res.ok) throw new Error('Failed to fetch state');
  const { data } = await res.json();
  writeCache(data);
  return data;
}

async function pushState(state) {
  writeCache(state);
  try {
    await fetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: state }),
    });
  } catch (e) {
    console.warn('Failed to persist state to server:', e);
  }
}

// ── Public surface (mirrors original localStorage API) ────────────────────────

function loadState() {
  // Synchronous read from cache for immediate render; App will sync from API on mount.
  return readCache() || null;
}

function saveState(state) {
  pushState(state);
}

function resetState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  fetchState().catch(() => {});
}

// ── App bootstrap ─────────────────────────────────────────────────────────────
// Called by app.jsx instead of ReactDOM.createRoot directly.

function initApp() {
  const root = ReactDOM.createRoot(document.getElementById('root'));

  // Show a brief loading screen while we fetch fresh state from the server.
  // If there's a cached version we render immediately and update in background.
  const cached = readCache();
  if (cached) {
    root.render(<App initialState={cached} />);
    fetchState()
      .then(fresh => root.render(<App initialState={fresh} />))
      .catch(() => {});
  } else {
    root.render(
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 16,
        fontFamily: 'Public Sans, sans-serif', color: 'oklch(0.45 0.02 75)',
        background: 'oklch(0.985 0.008 85)',
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: 'linear-gradient(145deg, oklch(0.55 0.09 154), oklch(0.38 0.07 158))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 15,
        }}>GG</div>
        <div style={{ fontSize: 14 }}>Loading Meadowlark…</div>
      </div>
    );
    fetchState()
      .then(state => root.render(<App initialState={state} />))
      .catch(err => {
        console.error(err);
        root.render(<div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>
          Failed to connect to server. Please refresh.
        </div>);
      });
  }
}

Object.assign(window, {
  loadState, saveState, resetState, fetchState, pushState, initApp,
  paymentStatusMeta, formatDate, formatDateLong, formatMoney, daysUntil,
});
