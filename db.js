const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
    ? { rejectUnauthorized: false }
    : false,
});

const defaultState = {
  group: {
    name: '3rd Maplewood Guides',
    unit: 'Guides (ages 9-11)',
    district: 'Pine Valley District',
    region: 'Ontario Council',
    meetingDay: 'Tuesdays, 6:30pm',
    meetingLocation: 'Maplewood Community Hall',
    contactEmail: 'leaders@3rdmaplewood.ca',
    logoInitials: '3M',
    logoColor: 'sage',
  },
  parents: [
    { id: 'p1', name: 'Rachel Okonkwo', email: 'rachel.o@email.com', phone: '(416) 555-0142', role: 'parent', children: [{ id: 'c1', name: 'Amara Okonkwo', patrol: 'Robin' }], avatar: 'RO' },
    { id: 'p2', name: 'Jen Bellavia', email: 'j.bellavia@email.com', phone: '(416) 555-0178', role: 'parent', children: [{ id: 'c2', name: 'Sofia Bellavia', patrol: 'Fox' }, { id: 'c3', name: 'Lucia Bellavia', patrol: 'Owl' }], avatar: 'JB' },
    { id: 'p3', name: 'David Kaur', email: 'd.kaur@email.com', phone: '(416) 555-0191', role: 'parent', children: [{ id: 'c4', name: 'Priya Kaur', patrol: 'Robin' }], avatar: 'DK' },
    { id: 'p4', name: 'Melissa Turner', email: 'mturner@email.com', phone: '(416) 555-0203', role: 'parent', children: [{ id: 'c5', name: 'Hazel Turner', patrol: 'Owl' }], avatar: 'MT' },
    { id: 'p5', name: 'Aaron Silverstein', email: 'a.silver@email.com', phone: '(416) 555-0217', role: 'parent', children: [{ id: 'c6', name: 'Ruby Silverstein', patrol: 'Fox' }], avatar: 'AS' },
    { id: 'p6', name: 'Nadia Patel', email: 'n.patel@email.com', phone: '(416) 555-0229', role: 'parent', children: [{ id: 'c7', name: 'Zara Patel', patrol: 'Robin' }], avatar: 'NP' },
    { id: 'p7', name: 'Chris Donovan', email: 'cdonovan@email.com', phone: '(416) 555-0241', role: 'parent', children: [{ id: 'c8', name: 'Eleanor Donovan', patrol: 'Fox' }], avatar: 'CD' },
    { id: 'p8', name: 'Sam Whitfield', email: 's.whitfield@email.com', phone: '(416) 555-0256', role: 'parent', children: [{ id: 'c9', name: 'Iris Whitfield', patrol: 'Owl' }], avatar: 'SW' },
  ],
  guiders: [
    { id: 'g1', name: 'Karen Marchetti', email: 'karen.m@3rdmaplewood.ca', phone: '(416) 555-0100', role: 'guider', title: 'Unit Guider (Barn Owl)', avatar: 'KM' },
    { id: 'g2', name: 'Priya Shah', email: 'priya.s@3rdmaplewood.ca', phone: '(416) 555-0101', role: 'guider', title: 'Guider (Red Fox)', avatar: 'PS' },
    { id: 'g3', name: 'Linda Hemsworth', email: 'linda.h@3rdmaplewood.ca', phone: '(416) 555-0102', role: 'guider', title: 'Guider in Training (Snowy Owl)', avatar: 'LH' },
  ],
  events: [
    {
      id: 'e1', title: 'Winter Camp at Camp Woolsey', date: '2026-05-08', endDate: '2026-05-10',
      location: 'Camp Woolsey, 4421 Pine Ridge Rd',
      directions: 'Take Hwy 400 north to exit 117. Follow Pine Ridge Rd east for 8km. Camp entrance on the left past the covered bridge.',
      description: 'Our annual overnight camp with hiking, campfire cooking, and the lantern ceremony. Girls earn the Outdoor Adventurer badge. Bus leaves from the hall Friday 4pm, returns Sunday 2pm.',
      price: 145, deposit: 45, depositDue: '2026-04-25', balanceDue: '2026-05-01', capacity: 24,
      assigned: ['p1','p2','p3','p4','p5','p6','p7','p8'], assignedGuiders: ['g1','g2'],
      sendEmail: true, status: 'upcoming', color: 'sage',
      docs: [
        { id: 'd1', name: 'Permission slip.pdf', public: true, size: '412 KB' },
        { id: 'd2', name: 'Packing list.pdf', public: true, size: '180 KB' },
        { id: 'd3', name: 'Medical form.pdf', public: true, size: '240 KB' },
        { id: 'd4', name: 'Leader schedule.docx', public: false, size: '92 KB' },
      ],
    },
    {
      id: 'e2', title: 'Cookie Delivery Day', date: '2026-04-26',
      location: 'Maplewood Community Hall',
      description: 'Pickup for spring cookie orders. Each girl collects her pre-sold boxes. Parents - please bring a bin or tote for transport.',
      price: 0, deposit: 0, capacity: 30,
      assigned: ['p1','p2','p3','p4','p5','p6','p7','p8'], assignedGuiders: ['g1','g2','g3'],
      status: 'upcoming', color: 'honey',
      docs: [{ id: 'd5', name: 'Pickup schedule.pdf', public: true, size: '68 KB' }],
    },
    {
      id: 'e3', title: 'Museum of Nature Field Trip', date: '2026-05-22',
      location: 'Canadian Museum of Nature, 240 McLeod St',
      directions: 'Carpool from the hall at 8:45am. Parking garage on Metcalfe St. We meet inside by the Blue Whale.',
      description: 'Curator-led tour of the fossil gallery plus hands-on workshop in the water lab. Lunch at the museum cafe - pack or buy.',
      price: 28, deposit: 0, balanceDue: '2026-05-15', capacity: 20,
      assigned: ['p1','p2','p3','p5','p6','p7'], assignedGuiders: ['g1','g3'],
      status: 'upcoming', color: 'terracotta',
      docs: [{ id: 'd6', name: 'Waiver form.pdf', public: true, size: '110 KB' }],
    },
    {
      id: 'e4', title: 'Enrollment Ceremony & Potluck', date: '2026-06-10',
      location: 'Maplewood Community Hall',
      description: 'Welcome our new Guides with the candle ceremony. Families bring a dish to share (A-M main, N-Z dessert).',
      price: 0, deposit: 0, capacity: 60,
      assigned: ['p1','p2','p3','p4','p5','p6','p7','p8'], assignedGuiders: ['g1','g2','g3'],
      status: 'upcoming', color: 'sage', docs: [],
    },
    {
      id: 'e5', title: 'Spring Hike at Rattlesnake Point', date: '2026-03-14',
      location: 'Rattlesnake Point Conservation Area',
      description: 'Moderate 5km loop hike. Girls worked on map and compass skills.',
      price: 12, deposit: 0, capacity: 20,
      assigned: ['p1','p2','p3','p4','p5','p6','p7','p8'], assignedGuiders: ['g1','g2'],
      status: 'past', color: 'sage', docs: [],
    },
  ],
  payments: [
    { id: 'pay1', parentId: 'p1', eventId: 'e1', childId: 'c1', amount: 145, paid: 145, status: 'fully-paid', paidDate: '2026-04-14', customDeposit: null, rsvp: 'yes' },
    { id: 'pay2', parentId: 'p2', eventId: 'e1', childId: 'c2', amount: 145, paid: 45, status: 'deposit-paid', paidDate: '2026-04-08', customDeposit: null, rsvp: 'yes' },
    { id: 'pay2b', parentId: 'p2', eventId: 'e1', childId: 'c3', amount: 145, paid: 90, status: 'partial', paidDate: '2026-04-08', customDeposit: null, rsvp: 'yes' },
    { id: 'pay3', parentId: 'p3', eventId: 'e1', childId: 'c4', amount: 145, paid: 0, status: 'unpaid', paidDate: null, customDeposit: 20, rsvp: 'yes', note: 'Reduced deposit arranged with Karen' },
    { id: 'pay4', parentId: 'p4', eventId: 'e1', childId: 'c5', amount: 145, paid: 45, status: 'deposit-paid', paidDate: '2026-04-11', customDeposit: null, rsvp: 'yes' },
    { id: 'pay5', parentId: 'p5', eventId: 'e1', childId: 'c6', amount: 145, paid: 0, status: 'overdue', paidDate: null, customDeposit: null, rsvp: 'maybe' },
    { id: 'pay6', parentId: 'p6', eventId: 'e1', childId: 'c7', amount: 145, paid: 145, status: 'fully-paid', paidDate: '2026-04-02', customDeposit: null, rsvp: 'yes' },
    { id: 'pay7', parentId: 'p7', eventId: 'e1', childId: 'c8', amount: 145, paid: 45, status: 'deposit-paid', paidDate: '2026-04-18', customDeposit: null, rsvp: 'yes' },
    { id: 'pay8', parentId: 'p8', eventId: 'e1', childId: 'c9', amount: 145, paid: 0, status: 'unpaid', paidDate: null, customDeposit: null, rsvp: 'pending' },
    { id: 'pay9', parentId: 'p1', eventId: 'e3', childId: 'c1', amount: 28, paid: 28, status: 'fully-paid', paidDate: '2026-04-10', rsvp: 'yes' },
    { id: 'pay10', parentId: 'p2', eventId: 'e3', childId: 'c2', amount: 28, paid: 0, status: 'unpaid', rsvp: 'yes' },
    { id: 'pay10b', parentId: 'p2', eventId: 'e3', childId: 'c3', amount: 28, paid: 0, status: 'unpaid', rsvp: 'yes' },
    { id: 'pay11', parentId: 'p3', eventId: 'e3', childId: 'c4', amount: 28, paid: 28, status: 'fully-paid', paidDate: '2026-04-12', rsvp: 'yes' },
    { id: 'pay12', parentId: 'p5', eventId: 'e3', childId: 'c6', amount: 28, paid: 0, status: 'unpaid', rsvp: 'maybe' },
    { id: 'pay13', parentId: 'p6', eventId: 'e3', childId: 'c7', amount: 28, paid: 28, status: 'fully-paid', paidDate: '2026-04-04', rsvp: 'yes' },
    { id: 'pay14', parentId: 'p7', eventId: 'e3', childId: 'c8', amount: 28, paid: 14, status: 'partial', paidDate: '2026-04-15', rsvp: 'yes' },
    { id: 'pay15', parentId: 'p1', eventId: 'e5', childId: 'c1', amount: 12, paid: 12, status: 'fully-paid', paidDate: '2026-03-05', rsvp: 'yes' },
    { id: 'pay16', parentId: 'p2', eventId: 'e5', childId: 'c2', amount: 12, paid: 12, status: 'fully-paid', paidDate: '2026-03-06', rsvp: 'yes' },
    { id: 'pay16b', parentId: 'p2', eventId: 'e5', childId: 'c3', amount: 12, paid: 12, status: 'fully-paid', paidDate: '2026-03-06', rsvp: 'yes' },
    { id: 'pay17', parentId: 'p3', eventId: 'e5', childId: 'c4', amount: 12, paid: 12, status: 'fully-paid', paidDate: '2026-03-08', rsvp: 'yes' },
  ],
  messages: [
    { id: 'm1', eventId: 'e1', thread: 'event', from: 'g1', body: 'Hi everyone! Just a reminder that deposits are due Apr 25. Let me know if you have any questions about the packing list.', at: '2026-04-12T10:20:00' },
    { id: 'm2', eventId: 'e1', thread: 'event', from: 'p2', body: 'Quick one — is there room for an EpiPen in the first aid? Sofia has a nut allergy.', at: '2026-04-12T14:05:00' },
    { id: 'm3', eventId: 'e1', thread: 'event', from: 'g1', body: "Yes absolutely. I'll flag it on the medical form and chat with you at drop-off.", at: '2026-04-12T14:42:00' },
    { id: 'm4', eventId: 'e1', thread: 'event', from: 'p4', body: 'Does Hazel need to bring her own headlamp or will those be provided?', at: '2026-04-15T19:11:00' },
    { id: 'm5', eventId: 'e1', thread: 'event', from: 'g2', body: "Bring one if you have it! We have spares but they're well-loved.", at: '2026-04-15T20:02:00' },
    { id: 'm6', eventId: 'e1', thread: 'dm', from: 'p3', to: 'g1', body: 'Hi Karen, is it possible to do a reduced deposit this month? Things are tight.', at: '2026-04-05T09:15:00' },
    { id: 'm7', eventId: 'e1', thread: 'dm', from: 'g1', to: 'p3', body: "Absolutely David — let's do $20 now and the rest split over two payments. No problem at all.", at: '2026-04-05T11:30:00' },
    { id: 'm8', eventId: 'e1', thread: 'dm', from: 'p3', to: 'g1', body: 'Thank you so much. Really appreciate it.', at: '2026-04-05T11:45:00' },
  ],
  currentUser: { role: 'admin', id: 'g1' },
};

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const { rows } = await pool.query('SELECT id FROM app_state WHERE id = 1');
  if (rows.length === 0) {
    await pool.query(
      'INSERT INTO app_state (id, data) VALUES (1, $1)',
      [JSON.stringify(defaultState)]
    );
    console.log('Database seeded with default data.');
  }
}

async function getState() {
  const { rows } = await pool.query('SELECT data FROM app_state WHERE id = 1');
  return rows[0]?.data ?? defaultState;
}

async function setState(data) {
  await pool.query(
    'INSERT INTO app_state (id, data, updated_at) VALUES (1, $1, NOW()) ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW()',
    [JSON.stringify(data)]
  );
}

// ── Users ────────────────────────────────────────────────────────────────────

async function initUsers() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'parent')),
      person_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const { rows } = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(rows[0].count) === 0) {
    await seedUsers();
  }
}

async function seedUsers() {
  const bcrypt = require('bcryptjs');
  const DEFAULT_PASSWORD = 'guides2026';
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const state = await getState();

  const toInsert = [
    ...state.guiders.map(g => ({ email: g.email, role: 'admin', personId: g.id })),
    ...state.parents.map(p => ({ email: p.email, role: 'parent', personId: p.id })),
  ];

  for (const u of toInsert) {
    await pool.query(
      'INSERT INTO users (email, password_hash, role, person_id) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      [u.email, hash, u.role, u.personId]
    );
  }

  console.log('\n── Default accounts created (password: guides2026) ─────────────');
  console.log('ADMINS (guiders):');
  state.guiders.forEach(g => console.log(`  ${g.email}`));
  console.log('PARENTS:');
  state.parents.forEach(p => console.log(`  ${p.email}`));
  console.log('────────────────────────────────────────────────────────────────\n');
}

async function getUserByEmail(email) {
  const { rows } = await pool.query(
    'SELECT id, email, password_hash AS "passwordHash", role, person_id AS "personId" FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  return rows[0] || null;
}

async function listUsers() {
  const { rows } = await pool.query(
    'SELECT id, email, role, person_id AS "personId", created_at AS "createdAt" FROM users ORDER BY role, email'
  );
  return rows;
}

async function createUser({ email, password, role, personId }) {
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash, role, person_id) VALUES ($1, $2, $3, $4) RETURNING id, email, role, person_id AS "personId"',
    [email.toLowerCase().trim(), hash, role, personId]
  );
  return rows[0];
}

async function updateUserPassword(id, newPassword) {
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, id]);
}

async function deleteUser(id) {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}

module.exports = {
  pool,
  initDB, getState, setState,
  initUsers, getUserByEmail, listUsers, createUser, updateUserPassword, deleteUser,
};
