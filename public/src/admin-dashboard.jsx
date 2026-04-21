// Admin — Dashboard
const { useMemo: useMemoAD, useState: useStateAD } = React;

function AdminDashboard({ state, setState, navigate }) {
  const [showPaymentFlow, setShowPaymentFlow] = useStateAD(false);
  const stats = useMemoAD(() => {
    const upcoming = state.events.filter(e => e.status === 'upcoming');
    const totalOwed = state.payments
      .filter(p => {
        const ev = state.events.find(e => e.id === p.eventId);
        return ev && ev.status === 'upcoming' && (p.status === 'unpaid' || p.status === 'partial' || p.status === 'deposit-paid' || p.status === 'overdue');
      })
      .reduce((sum, p) => sum + (p.amount - p.paid), 0);
    const collected = state.payments.reduce((s, p) => s + p.paid, 0);
    const overdue = state.payments.filter(p => p.status === 'overdue').length;
    return { upcomingCount: upcoming.length, totalOwed, collected, overdue };
  }, [state]);

  const upcomingEvents = state.events.filter(e => e.status === 'upcoming').sort((a,b) => a.date.localeCompare(b.date)).slice(0, 3);

  const recentPayments = state.payments
    .filter(p => p.paidDate)
    .sort((a,b) => (b.paidDate || '').localeCompare(a.paidDate || ''))
    .slice(0, 6);

  const needsAttention = state.payments
    .filter(p => p.status === 'overdue' || (p.status === 'unpaid' && state.events.find(e => e.id === p.eventId)?.depositDue && daysUntil(state.events.find(e => e.id === p.eventId).depositDue) < 7));

  return (
    <React.Fragment>
    <div className="stack gap-6">
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">Upcoming events</div>
          <div className="stat-value">{stats.upcomingCount}</div>
          <div className="stat-sub">Next: {upcomingEvents[0] ? formatDate(upcomingEvents[0].date) : '—'}</div>
          <div className="stat-icon"><IconCalendar size={22} /></div>
        </div>
        <div className="stat">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value num">${stats.totalOwed.toFixed(0)}</div>
          <div className="stat-sub">across {state.payments.filter(p => p.amount > p.paid && state.events.find(e=>e.id===p.eventId)?.status==='upcoming').length} balances</div>
          <div className="stat-icon"><IconWallet size={22} /></div>
        </div>
        <div className="stat">
          <div className="stat-label">Collected this season</div>
          <div className="stat-value num">${stats.collected.toFixed(0)}</div>
          <div className="stat-sub">across {state.payments.filter(p=>p.paid>0).length} payments</div>
          <div className="stat-icon"><IconPiggyBank size={22} /></div>
        </div>
        <div className="stat">
          <div className="stat-label">Needs attention</div>
          <div className="stat-value" style={{ color: stats.overdue > 0 ? 'var(--terra-600)' : undefined }}>{needsAttention.length}</div>
          <div className="stat-sub">{stats.overdue} overdue · {needsAttention.length - stats.overdue} at-risk</div>
          <div className="stat-icon"><IconAlertCircle size={22} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'var(--s-5)' }}>
        <div className="card flush">
          <div className="card-header">
            <h3>Upcoming events</h3>
            <button className="btn ghost sm" onClick={() => navigate('events')}>View all <IconChevronRight size={14} /></button>
          </div>
          <div className="stack" style={{ padding: '4px 0' }}>
            {upcomingEvents.map(ev => {
              const ps = state.payments.filter(p => p.eventId === ev.id);
              const paidCount = ps.filter(p => p.status === 'fully-paid').length;
              const pct = ps.length ? Math.round((paidCount / ps.length) * 100) : 0;
              return (
                <div key={ev.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 16, alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('event', ev.id)}>
                  <div style={{ textAlign: 'center', padding: '6px 0', background: 'var(--brand-100)', color: 'var(--brand-800)', borderRadius: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: .05, textTransform: 'uppercase' }}>{new Date(ev.date+'T00:00:00').toLocaleDateString('en-CA',{month:'short'})}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, lineHeight: 1 }}>{new Date(ev.date+'T00:00:00').getDate()}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--ink-900)', marginBottom: 3 }}>{ev.title}</div>
                    <div className="row gap-3 muted" style={{ fontSize: 12 }}>
                      {ev.price > 0 && <span>${ev.price}</span>}
                      {ps.length > 0 && <span>{paidCount}/{ps.length} fully paid</span>}
                      {ev.assigned.length > 0 && <span>{ev.assigned.length} families</span>}
                    </div>
                  </div>
                  {ev.price > 0 && (
                    <div style={{ width: 100 }}>
                      <div className="progress"><div style={{ width: pct + '%' }}/></div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{pct}%</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card flush">
          <div className="card-header">
            <h3>Needs attention</h3>
            <span className="chip terracotta">{needsAttention.length}</span>
          </div>
          <div className="stack">
            {needsAttention.length === 0 && (
              <div className="empty" style={{ padding: 24 }}>
                <div className="icon-wrap"><IconCheck /></div>
                <h3>All caught up</h3>
                <p className="muted" style={{ fontSize: 13 }}>No overdue or at-risk payments.</p>
              </div>
            )}
            {needsAttention.slice(0, 5).map(p => {
              const parent = state.parents.find(pa => pa.id === p.parentId);
              const ev = state.events.find(e => e.id === p.eventId);
              const child = parent?.children.find(c => c.id === p.childId);
              return (
                <div key={p.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar name={parent?.name} tone={p.status === 'overdue' ? 'terra' : 'honey'} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{parent?.name}</div>
                    <div className="muted truncate" style={{ fontSize: 12 }}>
                      {child?.name} · {ev?.title} · <span className="num">${p.amount - p.paid}</span> owed
                    </div>
                  </div>
                  <StatusChip status={p.status} />
                </div>
              );
            })}
          </div>
          {needsAttention.length > 0 && (
            <div className="card-footer">
              <span className="muted" style={{ fontSize: 13 }}>Send a gentle nudge?</span>
              <button className="btn sm" onClick={() => navigate('events')}><IconMail size={14} /> Send reminders</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-5)' }}>
        <div className="card flush">
          <div className="card-header"><h3>Recent payments</h3></div>
          <div className="stack">
            {recentPayments.map(p => {
              const parent = state.parents.find(pa => pa.id === p.parentId);
              const ev = state.events.find(e => e.id === p.eventId);
              return (
                <div key={p.id} style={{ padding: '11px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar name={parent?.name} size="sm" />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14 }}><span style={{ fontWeight: 600 }}>{parent?.name}</span> <span className="muted">paid</span> <span className="num" style={{ fontWeight: 600 }}>${p.paid}</span></div>
                    <div className="muted truncate" style={{ fontSize: 12 }}>{ev?.title} · {formatDate(p.paidDate)}</div>
                  </div>
                  <StatusChip status={p.status} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="card flush">
          <div className="card-header">
            <h3>Quick actions</h3>
          </div>
          <div className="card-body stack gap-3">
            <QuickAction icon={<IconWallet />} title="Record a payment" desc="Pick event, choose families, apply deposits or full payments" onClick={() => setShowPaymentFlow(true)} highlight />
            <QuickAction icon={<IconPlus />} title="Create an event" desc="Set price, deposit, assign families" onClick={() => navigate('events', null, 'new')} />
            <QuickAction icon={<IconUsers />} title="Add a parent" desc="Create login, link children" onClick={() => navigate('roster', null, 'new-parent')} />
            <QuickAction icon={<IconMail />} title="Send event email" desc="Notify assigned families" onClick={() => navigate('events')} />
            <QuickAction icon={<IconFileDown />} title="Export balances (CSV)" desc="For bookkeeping" onClick={() => {}} />
          </div>
        </div>
      </div>
    </div>

    {showPaymentFlow && (
      <RecordPaymentFlowModal state={state} setState={setState} onClose={() => setShowPaymentFlow(false)} />
    )}
    </React.Fragment>
  );
}

function QuickAction({ icon, title, desc, onClick, highlight }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: highlight ? 'var(--brand-50)' : 'var(--cream-50)', border: `1px solid ${highlight ? 'var(--brand-200)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: highlight ? 'var(--brand-600)' : 'var(--brand-100)', color: highlight ? 'white' : 'var(--brand-700)', display: 'grid', placeItems: 'center' }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-900)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      <IconChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--ink-400)' }} />
    </button>
  );
}

Object.assign(window, { AdminDashboard });
