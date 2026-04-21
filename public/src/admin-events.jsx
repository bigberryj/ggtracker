// Admin — Events list & detail & form
const { useState: useStateE, useMemo: useMemoE } = React;

function AdminEvents({ state, setState, navigate, tweaks, initialAction }) {
  const [query, setQuery] = useStateE('');
  const [filter, setFilter] = useStateE('upcoming'); // upcoming | past | all
  const [view, setView] = useStateE('list'); // list | calendar
  const [editing, setEditing] = useStateE(initialAction === 'new' ? {} : null);
  const [showPaymentFlow, setShowPaymentFlow] = useStateE(false);

  const events = useMemoE(() => {
    return state.events.filter(e => {
      if (filter !== 'all' && e.status !== filter) return false;
      if (query && !e.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    }).sort((a,b) => a.date.localeCompare(b.date));
  }, [state.events, query, filter]);

  const onSave = (ev) => {
    setState(s => {
      const existingIdx = s.events.findIndex(x => x.id === ev.id);
      let events;
      if (existingIdx >= 0) { events = [...s.events]; events[existingIdx] = { ...s.events[existingIdx], ...ev }; }
      else {
        const id = 'e' + (s.events.length + 1) + Math.random().toString(36).slice(2,5);
        const newEv = { id, status: 'upcoming', color: 'sage', docs: [], assigned: [], assignedGuiders: [], ...ev };
        // Auto-generate payment records for assigned parents
        const newPayments = (newEv.assigned || []).flatMap(pid => {
          const parent = s.parents.find(p => p.id === pid);
          if (!parent) return [];
          return parent.children.map(c => ({
            id: 'pay' + Math.random().toString(36).slice(2,8),
            parentId: pid, eventId: id, childId: c.id,
            amount: newEv.price || 0, paid: 0,
            status: newEv.price > 0 ? 'unpaid' : 'fully-paid',
            rsvp: 'pending',
          }));
        });
        events = [...s.events, newEv];
        return { ...s, events, payments: [...s.payments, ...newPayments] };
      }
      return { ...s, events };
    });
    setEditing(null);
  };

  const onDelete = (ev) => {
    if (!confirm(`Delete "${ev.title}"?`)) return;
    setState(s => ({ ...s, events: s.events.filter(e => e.id !== ev.id), payments: s.payments.filter(p => p.eventId !== ev.id) }));
  };

  return (
    <div>
      <div className="row between" style={{ marginBottom: 'var(--s-5)', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
        <div className="row gap-3">
          <div className="btn-group">
            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><IconList size={13}/> List</button>
            <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}><IconCalendar size={13}/> Calendar</button>
          </div>
          {view === 'list' && (
            <>
              <div className="btn-group">
                {['upcoming','past','all'].map(f => (
                  <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f[0].toUpperCase()+f.slice(1)}</button>
                ))}
              </div>
              <div className="searchbar" style={{ minWidth: 240 }}>
                <IconSearch size={15} />
            <input placeholder="Search events…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
            </>
          )}
        </div>
        <div className="row gap-2">
          <button className="btn" onClick={() => {}}><IconFileDown size={14} /> Export CSV</button>
          <button className="btn" onClick={() => setShowPaymentFlow(true)}><IconWallet size={14} /> Record payment</button>
          <button className="btn primary" onClick={() => setEditing({})}><IconPlus size={16} /> New event</button>
        </div>
      </div>

      {view === 'calendar' && (
        <MonthCalendar
          events={state.events}
          payments={state.payments}
          onOpen={(id) => navigate('event', id)}
          mode="admin"
        />
      )}

      {view === 'list' && events.length === 0 && (
        <div className="card"><div className="empty">
          <div className="icon-wrap"><IconCalendar /></div>
          <h3>No events yet</h3>
          <p>Create your first event to start assigning families and tracking payments.</p>
          <button className="btn primary" style={{ marginTop: 16 }} onClick={() => setEditing({})}><IconPlus size={16} /> New event</button>
        </div></div>
      )}

      {view === 'list' && tweaks.eventLayout === 'cards' && events.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--s-4)' }}>
          {events.map(ev => {
            const ps = state.payments.filter(p => p.eventId === ev.id);
            const paidCount = ps.filter(p => p.status === 'fully-paid').length;
            const collected = ps.reduce((s,p) => s+p.paid, 0);
            const total = ps.reduce((s,p) => s+p.amount, 0);
            return (
              <EventCard key={ev.id} event={ev} onClick={() => navigate('event', ev.id)}
                stats={
                  <>
                    <div className="row gap-2">
                      <IconUsers size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: 13 }}>{ev.assigned.length} families</span>
                    </div>
                    <div className="row gap-2" style={{ marginLeft: 'auto' }}>
                      {ev.price > 0 ? (
                        <div className="row gap-2">
                          <span className="num" style={{ fontSize: 13, fontWeight: 600 }}>${collected}</span>
                          <span className="muted" style={{ fontSize: 12 }}>/ ${total}</span>
                        </div>
                      ) : <span className="chip muted">Free</span>}
                      <button className="icon-btn" style={{ padding: 4 }} onClick={(e) => { e.stopPropagation(); setEditing(ev); }} title="Edit event">
                        <IconEdit size={14} />
                      </button>
                    </div>
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {view === 'list' && tweaks.eventLayout === 'table' && events.length > 0 && (
        <div className="card flush">
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Families</th>
                <th>Price</th>
                <th>Collected</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => {
                const ps = state.payments.filter(p => p.eventId === ev.id);
                const paidCount = ps.filter(p => p.status === 'fully-paid').length;
                const collected = ps.reduce((s,p) => s+p.paid, 0);
                const total = ps.reduce((s,p) => s+p.amount, 0);
                const pct = total > 0 ? Math.round((collected/total)*100) : 0;
                return (
                  <tr key={ev.id} className="clickable" onClick={() => navigate('event', ev.id)}>
                    <td><div style={{ fontWeight: 600 }}>{ev.title}</div><div className="muted" style={{ fontSize: 12 }}>{ev.location}</div></td>
                    <td>{formatDate(ev.date)}</td>
                    <td>{ev.assigned.length}</td>
                    <td>{ev.price > 0 ? <span className="num">${ev.price}</span> : <span className="muted">Free</span>}</td>
                    <td>
                      {total > 0 ? (
                        <div style={{ width: 120 }}>
                          <div className="num" style={{ fontSize: 13 }}>${collected} / ${total}</div>
                          <div className="progress" style={{ marginTop: 4 }}><div style={{ width: pct+'%' }}/></div>
                        </div>
                      ) : <span className="muted">—</span>}
                    </td>
                    <td>{ev.status === 'upcoming' ? <span className="chip brand">Upcoming</span> : <span className="chip muted">Past</span>}</td>
                    <td><button className="icon-btn" onClick={(e)=>{e.stopPropagation();setEditing(ev);}}><IconEdit size={16} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && <EventEditor event={editing} state={state} onSave={onSave} onClose={() => setEditing(null)} onDelete={onDelete} />}
      {showPaymentFlow && <RecordPaymentFlowModal state={state} setState={setState} onClose={() => setShowPaymentFlow(false)} />}
    </div>
  );
}

function EventEditor({ event, state, onSave, onClose, onDelete }) {
  const isNew = !event.id;
  const [draft, setDraft] = useStateE({
    title: '', date: '', location: '', description: '', directions: '',
    price: 0, deposit: 0, depositDue: '', balanceDue: '', capacity: 20,
    assigned: [], assignedGuiders: [], color: 'sage', sendEmail: true,
    ...event,
  });
  const [confirmEmail, setConfirmEmail] = useStateE(false);
  const toast = useToast();

  const update = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const toggleAssigned = (pid) => update('assigned', draft.assigned.includes(pid) ? draft.assigned.filter(x=>x!==pid) : [...draft.assigned, pid]);
  const toggleGuider = (gid) => update('assignedGuiders', draft.assignedGuiders.includes(gid) ? draft.assignedGuiders.filter(x=>x!==gid) : [...draft.assignedGuiders, gid]);

  const handleSave = () => {
    if (!draft.title || !draft.date) { toast('Title and date are required'); return; }
    if (isNew && draft.assigned.length > 0 && draft.sendEmail && !confirmEmail) {
      setConfirmEmail(true);
      return;
    }
    onSave(draft);
    toast(isNew ? (draft.sendEmail && draft.assigned.length ? `Event created — email sent to ${draft.assigned.length} families` : 'Event created') : 'Event updated');
  };

  return (
    <Modal open={true} onClose={onClose} size="lg" title={isNew ? 'New event' : 'Edit event'} footer={
      <>
        {!isNew && <button className="btn danger-ghost" onClick={() => onDelete(draft)}><IconTrash size={14} /> Delete</button>}
        <div style={{ flex: 1 }} />
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={handleSave}>{isNew ? 'Create event' : 'Save changes'}</button>
      </>
    }>
      {confirmEmail ? (
        <div className="stack gap-4">
          <div className="row gap-3" style={{ padding: 14, background: 'var(--brand-100)', borderRadius: 'var(--r-md)' }}>
            <IconMail /> <div><strong>Send notification email?</strong> <div className="muted" style={{ fontSize: 13 }}>{draft.assigned.length} families will be emailed about "{draft.title}".</div></div>
          </div>
          <div className="field-row">
            <label className="label">Email subject</label>
            <input className="input" defaultValue={`New event: ${draft.title}`} />
          </div>
          <div className="field-row">
            <label className="label">Message to families</label>
            <textarea className="textarea" defaultValue={`Hi families,\n\nWe've just posted "${draft.title}" on ${formatDateLong(draft.date)}. Log in to the portal to RSVP and see details.\n\n— The Guiders`} rows={5} />
          </div>
          <div className="row gap-2">
            <button className="btn" onClick={() => { setConfirmEmail(false); }}>Back</button>
            <button className="btn ghost" onClick={() => { setConfirmEmail(false); update('sendEmail', false); onSave({...draft, sendEmail: false}); }}>Skip email</button>
            <div style={{ flex: 1 }} />
            <button className="btn primary" onClick={() => { onSave(draft); }}><IconSend size={14} /> Send & create</button>
          </div>
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="field-row"><label className="label">Event title</label><input className="input" value={draft.title} onChange={e => update('title', e.target.value)} placeholder="Winter Camp at Camp Woolsey" /></div>
        </div>
        <div className="field-row"><label className="label">Start date</label><input className="input" type="date" value={draft.date} onChange={e => update('date', e.target.value)} /></div>
        <div className="field-row"><label className="label">End date (if multi-day)</label><input className="input" type="date" value={draft.endDate || ''} onChange={e => update('endDate', e.target.value)} /></div>
        <div style={{ gridColumn: '1 / -1' }} className="field-row"><label className="label">Location</label><input className="input" value={draft.location} onChange={e => update('location', e.target.value)} placeholder="Maplewood Community Hall" /></div>
        <div style={{ gridColumn: '1 / -1' }} className="field-row"><label className="label">Description</label><textarea className="textarea" value={draft.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="What will happen, what to expect…" /></div>
        <div style={{ gridColumn: '1 / -1' }} className="field-row"><label className="label">Directions (optional)</label><textarea className="textarea" value={draft.directions} onChange={e => update('directions', e.target.value)} rows={2} placeholder="How to get there, parking, carpools…" /></div>

        <div style={{ gridColumn: '1 / -1', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          <div className="section-h">Pricing</div>
        </div>
        <div className="field-row"><label className="label">Total price per girl</label><input className="input num" type="number" value={draft.price} onChange={e => update('price', Number(e.target.value))} /></div>
        <div className="field-row"><label className="label">Deposit (optional)</label><input className="input num" type="number" value={draft.deposit} onChange={e => update('deposit', Number(e.target.value))} /></div>
        <div className="field-row"><label className="label">Deposit due</label><input className="input" type="date" value={draft.depositDue || ''} onChange={e => update('depositDue', e.target.value)} /></div>
        <div className="field-row"><label className="label">Balance due</label><input className="input" type="date" value={draft.balanceDue || ''} onChange={e => update('balanceDue', e.target.value)} /></div>

        <div style={{ gridColumn: '1 / -1', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          <div className="section-h">Assign families ({draft.assigned.length} selected)</div>
          <div className="row gap-2" style={{ marginBottom: 10 }}>
            <button className="btn sm" onClick={() => update('assigned', state.parents.map(p=>p.id))}>Select all</button>
            <button className="btn sm" onClick={() => update('assigned', [])}>Clear</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {state.parents.map(p => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: draft.assigned.includes(p.id) ? 'var(--brand-100)' : 'var(--cream-50)', cursor: 'pointer', border: '1px solid transparent' }}>
                <input type="checkbox" checked={draft.assigned.includes(p.id)} onChange={() => toggleAssigned(p.id)} />
                <Avatar name={p.name} size="sm" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div className="muted truncate" style={{ fontSize: 11 }}>{p.children.map(c=>c.name).join(', ')}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <div className="section-h">Assign guiders</div>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            {state.guiders.map(g => (
              <label key={g.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: draft.assignedGuiders.includes(g.id) ? 'var(--brand-100)' : 'var(--cream-50)', cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={draft.assignedGuiders.includes(g.id)} onChange={() => toggleGuider(g.id)} />
                {g.name}
              </label>
            ))}
          </div>
        </div>

        {isNew && draft.assigned.length > 0 && (
          <div style={{ gridColumn: '1 / -1', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <label className="row gap-3" style={{ padding: 12, background: 'var(--cream-50)', borderRadius: 'var(--r-md)', cursor: 'pointer' }}>
              <input type="checkbox" checked={draft.sendEmail} onChange={e => update('sendEmail', e.target.checked)} />
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>Email assigned families about this event</div><div className="muted" style={{ fontSize: 12 }}>Sends a notification with RSVP link. You'll confirm before sending.</div></div>
            </label>
          </div>
        )}
      </div>
      )}
    </Modal>
  );
}

Object.assign(window, { AdminEvents, EventEditor });
