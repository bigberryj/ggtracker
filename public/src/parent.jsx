// Parent portal — Dashboard, Events, Detail, History, Messages
const { useState: useStateP, useMemo: useMemoP } = React;

function ParentApp({ state, setState, tweaks, page, setPage, selected, setSelected }) {
  const me = state.parents.find(p => p.id === state.currentUser.id);
  if (!me) return <div className="empty">Parent not found.</div>;

  if (page === 'event' && selected) {
    return <ParentEventDetail state={state} setState={setState} me={me} eventId={selected} onBack={() => { setPage('events'); setSelected(null); }} />;
  }
  if (page === 'events') return <ParentEvents state={state} me={me} tweaks={tweaks} onOpen={(id) => { setPage('event'); setSelected(id); }} />;
  if (page === 'history') return <ParentHistory state={state} me={me} />;
  if (page === 'messages') return <ParentMessages state={state} setState={setState} me={me} />;
  return <ParentDashboard state={state} me={me} onOpen={(id) => { setPage('event'); setSelected(id); }} onPage={setPage} />;
}

function ParentDashboard({ state, me, onOpen, onPage }) {
  const myPayments = state.payments.filter(p => p.parentId === me.id);
  const outstanding = myPayments.filter(p => state.events.find(e=>e.id===p.eventId)?.status === 'upcoming' && p.paid < p.amount);
  const totalOwed = outstanding.reduce((s,p) => s + (p.amount - p.paid), 0);
  const upcoming = state.events.filter(e => e.status === 'upcoming' && e.assigned.includes(me.id)).sort((a,b) => a.date.localeCompare(b.date));
  const nextEvent = upcoming[0];
  const nextPayment = outstanding.slice().sort((a,b) => {
    const aDue = state.events.find(e=>e.id===a.eventId)?.depositDue || state.events.find(e=>e.id===a.eventId)?.balanceDue || '9999';
    const bDue = state.events.find(e=>e.id===b.eventId)?.depositDue || state.events.find(e=>e.id===b.eventId)?.balanceDue || '9999';
    return aDue.localeCompare(bDue);
  })[0];

  return (
    <div className="stack gap-6">
      <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'linear-gradient(135deg, var(--brand-100), var(--cream-100) 70%)', border: '1px solid var(--brand-200)' }}>
        <div style={{ padding: '28px 32px' }}>
          <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>Welcome back,</div>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>{me.name.split(' ')[0]}</h1>
          <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
            {me.children.map(c => (
              <div key={c.id} className="row gap-2" style={{ padding: '6px 12px 6px 6px', background: 'rgba(255,255,255,.7)', borderRadius: 999, border: '1px solid var(--border)' }}>
                <Avatar name={c.name} size="sm" tone="ink" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{c.name}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{c.patrol} patrol</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-4)' }}>
        <div className="card">
          <div className="section-h">You owe</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em', color: totalOwed > 0 ? 'var(--ink-900)' : 'var(--sage-700)' }}>
            ${totalOwed.toFixed(0)}
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {outstanding.length === 0 ? 'All caught up — thank you!' : `Across ${outstanding.length} event${outstanding.length===1?'':'s'}`}
          </div>
          {nextPayment && (() => {
            const ev = state.events.find(e=>e.id===nextPayment.eventId);
            const due = ev?.depositDue || ev?.balanceDue;
            const du = due ? daysUntil(due) : null;
            return (
              <div style={{ marginTop: 18, padding: 12, background: 'var(--cream-50)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: 4 }}>Next due</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{ev?.title}</div>
                <div className="row between" style={{ marginTop: 6 }}>
                  <div className="muted" style={{ fontSize: 13 }}>{due ? formatDate(due) : 'no due date'} {du != null && du >= 0 && du < 14 && `· in ${du}d`}</div>
                  <div className="num" style={{ fontWeight: 600 }}>${nextPayment.amount - nextPayment.paid}</div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="card">
          <div className="section-h">Next up</div>
          {nextEvent ? (
            <div onClick={() => onOpen(nextEvent.id)} style={{ cursor: 'pointer' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, marginBottom: 8, letterSpacing: '-0.015em' }}>{nextEvent.title}</div>
              <div className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>
                <div className="row gap-2" style={{ marginBottom: 3 }}><IconCalendar size={14} /> {formatDateLong(nextEvent.date)}</div>
                <div className="row gap-2"><IconMapPin size={14} /> {nextEvent.location}</div>
              </div>
              {(() => {
                const myP = myPayments.filter(p => p.eventId === nextEvent.id);
                return myP.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {myP.map(p => <StatusChip key={p.id} status={p.status} />)}
                  </div>
                );
              })()}
            </div>
          ) : <div className="muted">No upcoming events.</div>}
        </div>
      </div>

      <div className="card flush">
        <div className="card-header">
          <h3>All upcoming events</h3>
          <button className="btn ghost sm" onClick={() => onPage('events')}>View all <IconChevronRight size={14} /></button>
        </div>
        <div className="stack">
          {upcoming.slice(0, 4).map(ev => {
            const myP = myPayments.filter(p => p.eventId === ev.id);
            const totalOwe = myP.reduce((s,p) => s + (p.amount - p.paid), 0);
            return (
              <div key={ev.id} onClick={() => onOpen(ev.id)} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: 16, alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ textAlign: 'center', padding: '7px 0', background: ev.color === 'sage' ? 'var(--sage-100)' : ev.color === 'honey' ? 'var(--honey-100)' : 'var(--terra-100)', color: ev.color === 'sage' ? 'var(--sage-800)' : ev.color === 'honey' ? 'var(--honey-700)' : 'var(--terra-700)', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase' }}>{new Date(ev.date+'T00:00:00').toLocaleDateString('en-CA',{month:'short'})}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, lineHeight: 1 }}>{new Date(ev.date+'T00:00:00').getDate()}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{ev.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{formatDate(ev.date)} · {ev.location}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {totalOwe > 0 ? <div><div className="num" style={{ fontWeight: 600 }}>${totalOwe} owed</div><div className="muted" style={{ fontSize: 11 }}>{myP.map(p=>p.status).join(', ')}</div></div> : <span className="chip sage"><IconCheck size={11}/> Paid</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ParentEvents({ state, me, tweaks, onOpen }) {
  const myEvents = state.events.filter(e => e.assigned.includes(me.id)).sort((a,b) => a.date.localeCompare(b.date));
  const upcoming = myEvents.filter(e => e.status === 'upcoming');
  const past = myEvents.filter(e => e.status === 'past');
  const [view, setView] = useStateP(tweaks.parentView || 'list');

  const Switcher = (
    <div className="btn-group" style={{ marginBottom: 'var(--s-4)' }}>
      <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><IconGrid size={13}/> Cards</button>
      <button className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')}><IconList size={13}/> Timeline</button>
      <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}><IconCalendar size={13}/> Calendar</button>
    </div>
  );

  if (view === 'calendar') {
    return <>{Switcher}<ParentCalendar events={myEvents} payments={state.payments.filter(p => p.parentId === me.id)} onOpen={onOpen} /></>;
  }

  if (view === 'timeline') {
    return (
      <>
      {Switcher}
      <div className="card" style={{ padding: '24px 28px' }}>
        <h2 style={{ marginBottom: 20 }}>Upcoming</h2>
        <div className="timeline">
          {upcoming.map(ev => {
            const myP = state.payments.filter(p => p.parentId === me.id && p.eventId === ev.id);
            const owe = myP.reduce((s,p) => s + (p.amount - p.paid), 0);
            return (
              <div key={ev.id} className="timeline-item" data-state="upcoming" onClick={() => onOpen(ev.id)} style={{ cursor: 'pointer' }}>
                <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: 4 }}>{formatDateLong(ev.date)}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{ev.title}</div>
                <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>{ev.location}</div>
                <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                  {myP.map(p => <StatusChip key={p.id} status={p.status} />)}
                  {owe > 0 && <span className="chip outline num">${owe} owed</span>}
                </div>
              </div>
            );
          })}
        </div>
        {past.length > 0 && <>
          <h2 style={{ marginTop: 32, marginBottom: 20 }}>Past</h2>
          <div className="timeline">
            {past.map(ev => (
              <div key={ev.id} className="timeline-item" data-state="past" onClick={() => onOpen(ev.id)} style={{ cursor: 'pointer' }}>
                <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: 4 }}>{formatDateLong(ev.date)}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>{ev.title}</div>
              </div>
            ))}
          </div>
        </>}
      </div>
      </>
    );
  }

  return (
    <>
    {Switcher}
    <div className="stack gap-5">
      <h2>Upcoming</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--s-4)' }}>
        {upcoming.map(ev => {
          const myP = state.payments.filter(p => p.parentId === me.id && p.eventId === ev.id);
          const owe = myP.reduce((s,p) => s + (p.amount - p.paid), 0);
          return (
            <EventCard key={ev.id} event={ev} onClick={() => onOpen(ev.id)} stats={
              <>
                {myP.length > 0 && <StatusChip status={myP[0].status} />}
                {owe > 0 && <span className="num" style={{ fontWeight: 600, fontSize: 13 }}>${owe}</span>}
                {owe === 0 && myP.length > 0 && <span className="chip sage"><IconCheck size={11}/> Paid</span>}
              </>
            } />
          );
        })}
      </div>
      {past.length > 0 && <>
        <h2 style={{ marginTop: 'var(--s-5)' }}>Past events</h2>
        <div className="card flush">
          {past.map(ev => (
            <div key={ev.id} onClick={() => onOpen(ev.id)} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
              <IconCalendar size={16} style={{ color: 'var(--ink-400)' }} />
              <div className="grow"><div style={{ fontWeight: 500 }}>{ev.title}</div><div className="muted" style={{ fontSize: 12 }}>{formatDate(ev.date, {year:true})}</div></div>
              <span className="chip muted">Past</span>
            </div>
          ))}
        </div>
      </>}
    </div>
    </>
  );
}

function ParentEventDetail({ state, setState, me, eventId, onBack }) {
  const event = state.events.find(e => e.id === eventId);
  const [tab, setTab] = useStateP('overview');
  const [message, setMessage] = useStateP('');
  const [dmMessage, setDmMessage] = useStateP('');
  const toast = useToast();

  if (!event) return <div>Event not found.</div>;

  const myP = state.payments.filter(p => p.parentId === me.id && p.eventId === eventId);
  const publicDocs = event.docs.filter(d => d.public);
  const eventMsgs = state.messages.filter(m => m.eventId === eventId && m.thread === 'event');
  const leaderForDm = event.assignedGuiders[0] || state.guiders[0]?.id;
  const dmMsgs = state.messages.filter(m => m.eventId === eventId && m.thread === 'dm' && (
    (m.from === me.id && m.to === leaderForDm) || (m.from === leaderForDm && m.to === me.id)
  ));

  const updateRsvp = async (payment, rsvp) => {
    setState(s => ({ ...s, payments: s.payments.map(p => p.id === payment.id ? { ...p, rsvp } : p) }));
    try { await apiPutRsvp(payment.id, rsvp); } catch(e) { console.warn('RSVP save failed', e); }
    toast(`RSVP updated`);
  };
  const postMessage = async () => {
    if (!message.trim()) return;
    const body = message.trim();
    setMessage('');
    try {
      const msg = await apiPostMessage({ eventId, thread: 'event', body });
      setState(s => ({ ...s, messages: [...s.messages, msg] }));
      toast('Posted');
    } catch(e) { toast('Failed to post message'); }
  };
  const sendDm = async () => {
    if (!dmMessage.trim()) return;
    const body = dmMessage.trim();
    setDmMessage('');
    try {
      const msg = await apiPostMessage({ eventId, thread: 'dm', to: leaderForDm, body });
      setState(s => ({ ...s, messages: [...s.messages, msg] }));
      toast('Message sent');
    } catch(e) { toast('Failed to send message'); }
  };

  return (
    <div>
      <div className="row between" style={{ marginBottom: 'var(--s-4)', alignItems: 'center' }}>
        <button className="btn sm" onClick={onBack}><IconChevronLeft size={14}/> Back</button>
        <button className="btn sm" onClick={() => printEventParent(event, me, state)}><IconPrinter size={14}/> Print</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--s-5)' }}>
        <div style={{ padding: '24px 28px', background: event.color === 'sage' ? 'var(--sage-50)' : event.color === 'honey' ? 'var(--honey-100)' : 'var(--terra-100)' }}>
          <h1 style={{ marginBottom: 10 }}>{event.title}</h1>
          <div className="row gap-4 muted" style={{ fontSize: 14, flexWrap: 'wrap' }}>
            <span className="row gap-1"><IconCalendar size={14} /> {formatDateLong(event.date)}</span>
            <span className="row gap-1"><IconMapPin size={14} /> {event.location}</span>
            {event.price > 0 && <span className="row gap-1"><IconWallet size={14} /> ${event.price}</span>}
          </div>
        </div>

        {myP.length > 0 && (
          <div style={{ padding: '18px 28px', borderTop: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
            <div className="row between" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Your balance</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, marginTop: 4 }}>
                  {myP.reduce((s,p) => s+p.paid, 0) === myP.reduce((s,p) => s+p.amount, 0)
                    ? <span style={{ color: 'var(--sage-700)' }}>Paid in full</span>
                    : <>${(myP.reduce((s,p)=>s+p.amount,0) - myP.reduce((s,p)=>s+p.paid,0))} <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>of ${myP.reduce((s,p)=>s+p.amount,0)}</span></>}
                </div>
              </div>
              <div className="stack gap-2">
                {myP.map(p => {
                  const child = me.children.find(c => c.id === p.childId);
                  return (
                    <div key={p.id} className="row gap-3" style={{ padding: '8px 14px', background: 'var(--cream-50)', borderRadius: 999, border: '1px solid var(--border)' }}>
                      <Avatar name={child?.name} size="sm" tone="ink" />
                      <div style={{ fontSize: 13 }}><span style={{ fontWeight: 600 }}>{child?.name}</span><span className="muted"> — paid <span className="num">${p.paid}</span> of <span className="num">${p.amount}</span></span></div>
                      <StatusChip status={p.status} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="tabs">
        <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
        <button className={`tab ${tab==='rsvp'?'active':''}`} onClick={()=>setTab('rsvp')}>RSVP</button>
        <button className={`tab ${tab==='docs'?'active':''}`} onClick={()=>setTab('docs')}>Documents · {publicDocs.length}</button>
        <button className={`tab ${tab==='thread'?'active':''}`} onClick={()=>setTab('thread')}>Thread · {eventMsgs.length}</button>
        <button className={`tab ${tab==='private'?'active':''}`} onClick={()=>setTab('private')}>Message leaders</button>
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--s-5)' }}>
          <div className="stack gap-4">
            <div className="card"><div className="section-h">About this event</div><p style={{ fontSize: 14.5, lineHeight: 1.7 }}>{event.description || 'No description.'}</p></div>
            {event.directions && <div className="card"><div className="section-h">Getting there</div><p style={{ fontSize: 14.5, lineHeight: 1.7 }}>{event.directions}</p></div>}
            {event.price > 0 && (
              <div className="card">
                <div className="section-h">How to pay</div>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, marginBottom: 12 }}>E-transfer to <a href="#">{state.group.contactEmail}</a>, cash or cheque to a leader at the next meeting. Online payment coming soon.</p>
                <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                  {['E-transfer','Cash','Cheque'].map(m => <span key={m} className="chip brand">{m}</span>)}
                </div>
              </div>
            )}
          </div>
          <div className="stack gap-4">
            {(event.depositDue || event.balanceDue) && (
              <div className="card">
                <div className="section-h">Key dates</div>
                <div className="stack gap-3">
                  {event.depositDue && <div><div className="muted" style={{ fontSize: 12 }}>Deposit due</div><div style={{ fontWeight: 600 }}>{formatDateLong(event.depositDue)}</div></div>}
                  {event.balanceDue && <div><div className="muted" style={{ fontSize: 12 }}>Balance due</div><div style={{ fontWeight: 600 }}>{formatDateLong(event.balanceDue)}</div></div>}
                </div>
              </div>
            )}
            <div className="card">
              <div className="section-h">Your leaders</div>
              <div className="stack gap-2">
                {event.assignedGuiders.map(gid => {
                  const g = state.guiders.find(x => x.id === gid);
                  return g && <div key={gid} className="row gap-2"><Avatar name={g.name} size="sm" tone="ink" /><div><div style={{ fontSize: 13, fontWeight: 500 }}>{g.name}</div><div className="muted" style={{ fontSize: 11 }}>{g.title}</div></div></div>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'rsvp' && (
        <div className="card">
          <div className="section-h">Will your children attend?</div>
          <div className="stack gap-3" style={{ marginTop: 12 }}>
            {myP.map(p => {
              const child = me.children.find(c => c.id === p.childId);
              return (
                <div key={p.id} className="row between" style={{ padding: 14, background: 'var(--cream-50)', borderRadius: 'var(--r-md)' }}>
                  <div className="row gap-3"><Avatar name={child?.name} /> <div><div style={{ fontWeight: 600 }}>{child?.name}</div><div className="muted" style={{ fontSize: 12 }}>{child?.patrol} patrol</div></div></div>
                  <div className="row gap-2">
                    <button className={`btn sm ${p.rsvp === 'yes' ? 'primary' : ''}`} onClick={() => updateRsvp(p, 'yes')}><IconCheck size={13}/> Going</button>
                    <button className={`btn sm ${p.rsvp === 'maybe' ? 'primary' : ''}`} onClick={() => updateRsvp(p, 'maybe')}>Maybe</button>
                    <button className={`btn sm ${p.rsvp === 'no' ? 'primary' : ''}`} onClick={() => updateRsvp(p, 'no')}><IconX size={13}/> Can't go</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'docs' && (
        <div className="card flush">
          {publicDocs.length === 0 ? (
            <div className="empty"><div className="icon-wrap"><IconFileText/></div><h3>No documents shared yet</h3><p>Leaders haven't posted any documents for this event.</p></div>
          ) : publicDocs.map(d => (
            <div key={d.id} className="doc-row">
              <div className="ic"><IconFileText size={16} /></div>
              <div className="grow"><div style={{ fontWeight: 500 }}>{d.name}</div><div className="meta">{d.size}</div></div>
              <button className="btn sm"><IconDownload size={14}/> Download</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'thread' && (
        <div className="card flush">
          <div style={{ padding: '0 var(--card-p)', maxHeight: 420, overflowY: 'auto' }}>
            <div className="message-list">
              {eventMsgs.map(m => {
                const isMe = m.from === me.id;
                const sender = state.guiders.find(g => g.id === m.from) || state.parents.find(p => p.id === m.from);
                return (
                  <div key={m.id} className={`msg ${isMe ? 'me' : ''}`}>
                    {!isMe && <Avatar name={sender?.name} size="sm" tone={state.guiders.find(g=>g.id===m.from) ? 'ink' : 'brand'} />}
                    <div><div className="bubble">{m.body}</div><div className="meta">{sender?.name} · {formatDate(m.at)}</div></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ padding: 'var(--card-p)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input className="input" placeholder="Post a question for everyone…" value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && postMessage()} />
            <button className="btn primary" onClick={postMessage}><IconSend size={14}/> Post</button>
          </div>
        </div>
      )}

      {tab === 'private' && (
        <div className="card flush">
          <div className="card-header">
            <div>
              <h3>Private message to leaders</h3>
              <div className="muted" style={{ fontSize: 12 }}>Only you and the event leaders will see this thread.</div>
            </div>
          </div>
          <div style={{ padding: '0 var(--card-p)', maxHeight: 420, overflowY: 'auto' }}>
            <div className="message-list">
              {dmMsgs.length === 0 && <div className="empty" style={{ padding: 30 }}><div className="muted" style={{ fontSize: 13 }}>No private messages yet.</div></div>}
              {dmMsgs.map(m => {
                const isMe = m.from === me.id;
                const sender = state.guiders.find(g => g.id === m.from) || state.parents.find(p => p.id === m.from);
                return (
                  <div key={m.id} className={`msg ${isMe ? 'me' : ''}`}>
                    {!isMe && <Avatar name={sender?.name} size="sm" tone="ink" />}
                    <div><div className="bubble">{m.body}</div><div className="meta">{sender?.name} · {formatDate(m.at)}</div></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ padding: 'var(--card-p)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input className="input" placeholder="Message the leaders privately…" value={dmMessage} onChange={e=>setDmMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendDm()} />
            <button className="btn primary" onClick={sendDm}><IconSend size={14}/> Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ParentHistory({ state, me }) {
  const myPayments = state.payments.filter(p => p.parentId === me.id && p.paid > 0).sort((a,b) => (b.paidDate||'').localeCompare(a.paidDate||''));
  const outstanding = state.payments.filter(p => p.parentId === me.id && p.paid < p.amount && state.events.find(e=>e.id===p.eventId)?.status === 'upcoming');
  const totalPaid = myPayments.reduce((s,p) => s+p.paid, 0);
  const totalOwed = outstanding.reduce((s,p) => s + (p.amount - p.paid), 0);

  return (
    <div className="stack gap-5">
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat"><div className="stat-label">Paid this season</div><div className="stat-value num">${totalPaid.toFixed(0)}</div></div>
        <div className="stat"><div className="stat-label">Outstanding</div><div className="stat-value num">${totalOwed.toFixed(0)}</div></div>
        <div className="stat"><div className="stat-label">Events</div><div className="stat-value">{new Set(state.payments.filter(p=>p.parentId===me.id).map(p=>p.eventId)).size}</div></div>
      </div>

      {outstanding.length > 0 && (
        <div className="card flush">
          <div className="card-header"><h3>What you owe</h3></div>
          <table className="table">
            <thead><tr><th>Event</th><th>Child</th><th>Amount</th><th>Paid</th><th>Remaining</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              {outstanding.map(p => {
                const ev = state.events.find(e => e.id === p.eventId);
                const child = me.children.find(c => c.id === p.childId);
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{ev?.title}</td>
                    <td>{child?.name}</td>
                    <td className="num">${p.amount}</td>
                    <td className="num">${p.paid}</td>
                    <td className="num" style={{ fontWeight: 600 }}>${p.amount - p.paid}</td>
                    <td>{ev?.depositDue ? formatDate(ev.depositDue) : ev?.balanceDue ? formatDate(ev.balanceDue) : '—'}</td>
                    <td><StatusChip status={p.status}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="card flush">
        <div className="card-header"><h3>Payment history</h3><button className="btn sm"><IconPrinter size={14}/> Print</button></div>
        <table className="table">
          <thead><tr><th>Date</th><th>Event</th><th>Child</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
          <tbody>
            {myPayments.map(p => {
              const ev = state.events.find(e => e.id === p.eventId);
              const child = me.children.find(c => c.id === p.childId);
              return (
                <tr key={p.id}>
                  <td>{formatDate(p.paidDate, { year: true })}</td>
                  <td style={{ fontWeight: 500 }}>{ev?.title}</td>
                  <td>{child?.name}</td>
                  <td className="num" style={{ fontWeight: 600 }}>${p.paid}</td>
                  <td className="muted" style={{ fontSize: 13 }}>{p.lastMethod || 'e-transfer'}</td>
                  <td><StatusChip status={p.status}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ParentMessages({ state, setState, me }) {
  const [selected, setSelected] = useStateP(null);
  const [reply, setReply] = useStateP('');
  const toast = useToast();

  // Threads I'm in: events I'm assigned to, plus DMs I've sent/received
  const myEvents = state.events.filter(e => e.assigned.includes(me.id));
  const threads = [];
  myEvents.forEach(ev => {
    const msgs = state.messages.filter(m => m.eventId === ev.id && m.thread === 'event');
    if (msgs.length > 0) threads.push({ key: `event:${ev.id}`, kind: 'event', eventId: ev.id, messages: msgs.slice().sort((a,b)=>a.at.localeCompare(b.at)) });
    const dm = state.messages.filter(m => m.eventId === ev.id && m.thread === 'dm' && (m.from === me.id || m.to === me.id));
    if (dm.length > 0) threads.push({ key: `dm:${ev.id}`, kind: 'dm', eventId: ev.id, messages: dm.slice().sort((a,b)=>a.at.localeCompare(b.at)) });
  });
  threads.sort((a,b) => (b.messages[b.messages.length-1]?.at||'').localeCompare(a.messages[a.messages.length-1]?.at||''));
  const active = threads.find(t => t.key === selected) || threads[0];

  const send = async () => {
    if (!reply.trim() || !active) return;
    const leader = state.events.find(e=>e.id===active.eventId)?.assignedGuiders[0];
    const body = reply.trim();
    setReply('');
    try {
      const msg = await apiPostMessage({
        eventId: active.eventId, thread: active.kind,
        to: active.kind === 'dm' ? leader : undefined,
        body,
      });
      setState(s => ({ ...s, messages: [...s.messages, msg] }));
      toast('Sent');
    } catch(e) { toast('Failed to send'); }
  };

  return (
    <div className="card flush" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 560, overflow: 'hidden' }}>
      <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
        {threads.map(t => {
          const ev = state.events.find(e => e.id === t.eventId);
          const last = t.messages[t.messages.length - 1];
          const sender = state.guiders.find(g => g.id === last?.from) || state.parents.find(p => p.id === last?.from);
          return (
            <button key={t.key} onClick={() => setSelected(t.key)} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 14, borderBottom: '1px solid var(--border)', width: '100%', textAlign: 'left', background: (active?.key === t.key) ? 'var(--brand-50)' : 'var(--bg-raised)', border: 0, borderRadius: 0, cursor: 'pointer' }}>
              <div className="row between"><div style={{ fontWeight: 600, fontSize: 13 }}>{ev?.title}</div><div className="muted" style={{ fontSize: 11 }}>{formatDate(last?.at)}</div></div>
              <div className="muted" style={{ fontSize: 11 }}>{t.kind === 'dm' ? 'Private with leaders' : 'Event thread'}</div>
              <div className="truncate" style={{ fontSize: 12, color: 'var(--ink-600)', marginTop: 4 }}>{sender?.name}: {last?.body}</div>
            </button>
          );
        })}
        {threads.length === 0 && <div className="empty" style={{ padding: 30 }}><div className="muted" style={{ fontSize: 13 }}>No conversations yet.</div></div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {active ? (
          <>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600 }}>{state.events.find(e=>e.id===active.eventId)?.title}</div>
              <div className="muted" style={{ fontSize: 12 }}>{active.kind === 'dm' ? 'Private conversation with event leaders' : 'Event thread'}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
              <div className="message-list">
                {active.messages.map(m => {
                  const isMe = m.from === me.id;
                  const sender = state.guiders.find(g => g.id === m.from) || state.parents.find(p => p.id === m.from);
                  return (
                    <div key={m.id} className={`msg ${isMe ? 'me' : ''}`}>
                      {!isMe && <Avatar name={sender?.name} size="sm" tone={state.guiders.find(g=>g.id===m.from) ? 'ink' : 'brand'} />}
                      <div><div className="bubble">{m.body}</div><div className="meta">{sender?.name} · {formatDate(m.at)}</div></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input className="input" placeholder="Type a reply…" value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
              <button className="btn primary" onClick={send}><IconSend size={14}/> Send</button>
            </div>
          </>
        ) : <div className="empty"><div className="icon-wrap"><IconMessageCircle/></div><h3>Select a conversation</h3></div>}
      </div>
    </div>
  );
}

Object.assign(window, { ParentApp });
