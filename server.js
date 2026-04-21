require('dotenv').config();
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
app.use(cors({ credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use(session({
  store: new PgSession({ pool: db.pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'dev-secret-please-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'lax' : false,
  },
}));

app.use(express.static(path.join(__dirname, 'public')));

// ── Auth middleware ───────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: 'Not authenticated' });
  if (req.session.userRole !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await db.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userPersonId = user.personId;

    res.json({ role: user.role, personId: user.personId, email: user.email });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    role: req.session.userRole,
    personId: req.session.userPersonId,
  });
});

// ── State endpoints ───────────────────────────────────────────────────────────

app.get('/api/state', requireAuth, async (req, res) => {
  try {
    const state = await db.getState();
    const { userRole, userPersonId } = req.session;

    if (userRole === 'admin') {
      return res.json({ data: { ...state, currentUser: { role: 'admin', id: userPersonId } } });
    }

    // Parent: filter to only their data
    const pid = userPersonId;
    const myEventIds = new Set(state.events.filter(e => e.assigned.includes(pid)).map(e => e.id));
    const filtered = {
      ...state,
      currentUser: { role: 'parent', id: pid },
      parents: state.parents.filter(p => p.id === pid),
      payments: state.payments.filter(p => p.parentId === pid),
      messages: state.messages.filter(m =>
        myEventIds.has(m.eventId) &&
        (m.thread === 'event' || m.from === pid || m.to === pid)
      ),
    };
    res.json({ data: filtered });
  } catch (err) {
    console.error('GET /api/state error:', err);
    res.status(500).json({ error: 'Failed to load state' });
  }
});

app.put('/api/state', requireAdmin, async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'Missing data' });
    await db.setState(data);
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/state error:', err);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

// ── Parent-specific write endpoints ──────────────────────────────────────────

// Post a message to an event thread or DM
app.post('/api/messages', requireAuth, async (req, res) => {
  try {
    const { eventId, thread, to, body } = req.body;
    if (!eventId || !thread || !body?.trim()) {
      return res.status(400).json({ error: 'eventId, thread, and body are required' });
    }
    const state = await db.getState();
    const event = state.events.find(e => e.id === eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Parents can only post to events they are assigned to
    if (req.session.userRole === 'parent' && !event.assigned.includes(req.session.userPersonId)) {
      return res.status(403).json({ error: 'Not assigned to this event' });
    }

    const msg = {
      id: 'm' + Math.random().toString(36).slice(2, 8),
      eventId, thread,
      from: req.session.userPersonId,
      ...(to ? { to } : {}),
      body: body.trim(),
      at: new Date().toISOString(),
    };
    state.messages.push(msg);
    await db.setState(state);
    res.json({ msg });
  } catch (err) {
    console.error('POST /api/messages error:', err);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

// Update RSVP for a payment
app.put('/api/rsvp/:paymentId', requireAuth, async (req, res) => {
  try {
    const { rsvp } = req.body;
    if (!rsvp) return res.status(400).json({ error: 'rsvp value required' });

    const state = await db.getState();
    const idx = state.payments.findIndex(p => p.id === req.params.paymentId);
    if (idx === -1) return res.status(404).json({ error: 'Payment not found' });

    // Parents can only update their own payments
    if (req.session.userRole === 'parent' && state.payments[idx].parentId !== req.session.userPersonId) {
      return res.status(403).json({ error: 'Not your payment' });
    }

    state.payments[idx] = { ...state.payments[idx], rsvp };
    await db.setState(state);
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/rsvp error:', err);
    res.status(500).json({ error: 'Failed to update RSVP' });
  }
});

// ── User account management (admin only) ─────────────────────────────────────

app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    res.json(await db.listUsers());
  } catch (err) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

app.post('/api/users', requireAdmin, async (req, res) => {
  try {
    const { email, password, role, personId } = req.body;
    if (!email || !password || !role || !personId) {
      return res.status(400).json({ error: 'email, password, role, and personId required' });
    }
    const user = await db.createUser({ email, password, role, personId });
    res.json(user);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id/password', requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    await db.updateUserPassword(req.params.id, password);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  try {
    await db.deleteUser(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ── SPA fallback ──────────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Boot ──────────────────────────────────────────────────────────────────────

async function boot() {
  await db.initDB();
  await db.initUsers();
  app.listen(PORT, () => {
    console.log(`Meadowlark running on http://localhost:${PORT}`);
  });
}

boot().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
