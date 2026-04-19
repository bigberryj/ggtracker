// Admin — Event detail view
const { useState: useStateED } = React;

function AdminEventDetail({ state, setState, eventId, navigate }) {
  const event = state.events.find(e => e.id === eventId);
  const [tab, setTab] = useStateED('payments');
  const [recordingPayment, setRecordingPayment] = useStateED(null);
  const [messageText, setMessageText] = useStateED('');
  const [bulkReminding, setBulkReminding] = useStateED(false);
  const toast = useToast();

  if (!event) return <div className="empty">Event not found. <button className="btn" onClick={() => navigate('events')}>Back</button></div>;

  const payments = state.payments.filter(p => p.eventId === eventId);
  const total = payments.reduce((s,p) => s+p.amount, 0);
  const collected = payments.reduce((s,p) => s+p.paid, 0);
  const pct = total > 0 ? Math.round((collected/total)*100) : 0;

  const eventMessages = state.messages.filter(m => m.eventId === eventId && m.thread === 'event');

  const recordPayment = (payment, amount, method) => {
    setState(s => {
      const payments = s.payments.map(p => {
        if (p.id !== payment.id) return p;
        const newPaid = p.paid + amount;
        let status;
        if (newPaid >= p.amount) status = 'fully-paid';
        else if (event.deposit && newPaid >= event.deposit) status = newPaid > event.deposit ? 'partial' : 'deposit-paid';
        else if (newPaid > 0) status = 'partial';
        else status = 'unpaid';
        return { ...p, paid: newPaid, status, paidDate: '2026-04-18', lastMethod: method };
      });
      return { ...s, payments };
    });
    setRecordingPayment(null);
    toast(`Recorded $${amount} payment`);
  };

  const sendBulkReminder = () => {
    toast(`Reminder sent to ${payments.filter(p => p.status !== 'fully-paid').length} families`);
    setBulkReminding(false);
  };

  const postMessage = () => {
    if (!messageText.trim()) return;
    setState(s => ({ ...s, messages: [...s.messages, {
      id: 'm' + Math.random().toString(36).slice(2,8),
      eventId, thread: 'event', from: s.currentUser.id,
      body: messageText.trim(), at: new Date().toISOString(),
    }] }));
    setMessageText('');
    toast('Message posted');
  };

  const toggleDocPublic = (docId) => {
    setState(s => ({ ...s, events: s.events.map(ev => ev.id !== eventId ? ev : { ...ev, docs: ev.docs.map(d => d.id === docId ? { ...d, public: !d.public } : d) }) }));
  };
  const removeDoc = (docId) => {
    setState(s => ({ ...s, events: s.events.map(ev => ev.id !== eventId ? ev : { ...ev, docs: ev.docs.filter(d => d.id !== docId) }) }));
  };
  const addDoc = () => {
    const name = prompt('Document name (e.g. "Permission slip.pdf")');
    if (!name) return;
    setState(s => ({ ...s, events: s.events.map(ev => ev.id !== eventId ? ev : { ...ev, docs: [...ev.docs, { id: 'd'+Math.random().toString(36).slice(2,6), name, size: Math.floor(Math.random()*400+50)+' KB', public: true }] }) }));
    toast('Document added');
  };

  return (
    <div>
      <div className="row gap-3" style={{ marginBottom: 'var(--s-4)' }}>
        <button className="btn sm" onClick={() => navigate('events')}><IconChevronLeft size={14} /> All events</button>
      </div>

      <div className="card" style={{ marginBottom: 'var(--s-5)', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--card-p)', background: event.color === 'sage' ? 'var(--sage-50)' : event.color === 'honey' ? 'var(--honey-100)' : 'var(--terra-100)', borderBottom: '1px solid var(--border)' }}>
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ marginBottom: 6 }}>{event.title}</h1>
              <div className="row gap-4 muted" style={{ fontSize: 14, flexWrap: 'wrap' }}>
                <span className="row gap-1"><IconCalendar size={14} /> {formatDateLong(event.date)}</span>
                <span className="row gap-1"><IconMapPin size={14} /> {event.location}</span>
                {event.price > 0 && <span className="row gap-1"><IconWallet size={14} /> ${event.price}{event.deposit ? ` ($${event.deposit} deposit)` : ''}</span>}
                <span className="row gap-1"><IconUsers size={14} /> {event.assigned.length} families</span>
              </div>
            </div>
            <div className="row gap-2">
              <button className="btn" onClick={() => printEventAdmin(event, state)}><IconPrinter size={14} /> Print</button>
              <button className="btn"><IconMail size={14} /> Email families</button>
              <button className="btn primary"><IconEdit size={14} /> Edit event</button>
            </div>
          </div>
          {event.price > 0 && (
            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', fontWeight: 600 }}>Collected</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600 }}>${collected} <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>/ ${total}</span></div>
                <div className="progress" style={{ marginTop: 6 }}><div style={{ width: pct+'%' }}/></div>
              </div>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', fontWeight: 600 }}>Fully paid</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600 }}>{payments.filter(p=>p.status==='fully-paid').length} <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>/ {payments.length}</span></div>
              </div>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', fontWeight: 600 }}>Outstanding</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600 }}>${total - collected}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', fontWeight: 600 }}>RSVPs</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600 }}>{payments.filter(p=>p.rsvp==='yes').length} <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>yes</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab==='payments'?'active':''}`} onClick={()=>setTab('payments')}>Payments · {payments.length}</button>
        <button className={`tab ${tab==='details'?'active':''}`} onClick={()=>setTab('details')}>Details</button>
        <button className={`tab ${tab==='docs'?'active':''}`} onClick={()=>setTab('docs')}>Documents · {event.docs.length}</button>
        <button className={`tab ${tab==='messages'?'active':''}`} onClick={()=>setTab('messages')}>Thread · {eventMessages.length}</button>
      </div>

      {tab === 'payments' && (
        <div className="card flush">
          <div className="card-header">
            <div className="row gap-3">
              <h3>Payments by family</h3>
              <span className="chip muted">{payments.length}</span>
            </div>
            <div className="row gap-2">
              <button className="btn sm"><IconFileDown size={14} /> Export</button>
              <button className="btn sm" onClick={() => setBulkReminding(true)}><IconMail size={14} /> Remind unpaid</button>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr><th>Family</th><th>Child</th><th>RSVP</th><th>Amount</th><th>Paid</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const parent = state.parents.find(pa => pa.id === p.parentId);
                const child = parent?.children.find(c => c.id === p.childId);
                return (
                  <tr key={p.id}>
                    <td><div className="row gap-2"><Avatar name={parent?.name} size="sm" /> <span style={{ fontWeight: 500 }}>{parent?.name}</span></div></td>
                    <td>{child?.name} <span className="muted" style={{ fontSize: 12 }}>· {child?.patrol}</span></td>
                    <td>
                      {p.rsvp === 'yes' && <span className="chip sage"><IconCheck size={11}/> Going</span>}
                      {p.rsvp === 'maybe' && <span className="chip honey">Maybe</span>}
                      {p.rsvp === 'no' && <span className="chip terracotta">No</span>}
                      {(!p.rsvp || p.rsvp === 'pending') && <span className="chip muted">Pending</span>}
                    </td>
                    <td className="num">${p.amount}{p.customDeposit != null && <div className="muted" style={{ fontSize: 11 }}>dep: ${p.customDeposit}</div>}</td>
                    <td className="num">${p.paid}</td>
                    <td><StatusChip status={p.status} /></td>
                    <td>
                      {p.status !== 'fully-paid' && p.amount > 0 ? (
                        <button className="btn sm" onClick={() => setRecordingPayment(p)}>Record</button>
                      ) : <span className="muted" style={{ fontSize: 13 }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--s-5)' }}>
          <div className="stack gap-4">
            <div className="card">
              <div className="section-h">Description</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-700)' }}>{event.description || <span className="muted">No description.</span>}</p>
            </div>
            {event.directions && (
              <div className="card">
                <div className="section-h">Directions</div>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-700)' }}>{event.directions}</p>
              </div>
            )}
            <div className="card">
              <div className="section-h">Assigned families ({event.assigned.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {event.assigned.map(pid => {
                  const p = state.parents.find(x => x.id === pid);
                  return p && <span key={pid} className="chip outline"><Avatar name={p.name} size="sm" /> {p.name}</span>;
                })}
              </div>
            </div>
          </div>
          <div className="stack gap-4">
            <div className="card">
              <div className="section-h">Logistics</div>
              <div className="stack gap-2" style={{ fontSize: 14 }}>
                <div className="row between"><span className="muted">Date</span> <span>{formatDate(event.date)}</span></div>
                {event.endDate && <div className="row between"><span className="muted">Ends</span> <span>{formatDate(event.endDate)}</span></div>}
                <div className="row between"><span className="muted">Price</span> <span className="num">${event.price || 0}</span></div>
                {event.deposit > 0 && <div className="row between"><span className="muted">Deposit</span> <span className="num">${event.deposit}</span></div>}
                {event.depositDue && <div className="row between"><span className="muted">Deposit due</span> <span>{formatDate(event.depositDue)}</span></div>}
                {event.balanceDue && <div className="row between"><span className="muted">Balance due</span> <span>{formatDate(event.balanceDue)}</span></div>}
                <div className="row between"><span className="muted">Capacity</span> <span>{event.capacity}</span></div>
              </div>
            </div>
            <div className="card">
              <div className="section-h">Assigned guiders</div>
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

      {tab === 'docs' && (
        <div className="card flush">
          <div className="card-header">
            <h3>Documents</h3>
            <button className="btn sm primary" onClick={addDoc}><IconUpload size={14} /> Upload</button>
          </div>
          {event.docs.length === 0 ? (
            <div className="empty"><div className="icon-wrap"><IconFileText /></div><h3>No documents yet</h3><p>Upload permission slips, packing lists, or medical forms.</p></div>
          ) : event.docs.map(d => (
            <div key={d.id} className="doc-row">
              <div className="ic"><IconFileText size={16} /></div>
              <div className="grow">
                <div style={{ fontWeight: 500 }}>{d.name}</div>
                <div className="meta">{d.size}</div>
              </div>
              {d.public ? <span className="chip sage">Public</span> : <span className="chip muted">Internal</span>}
              <button className="btn sm" onClick={() => toggleDocPublic(d.id)}>{d.public ? 'Make internal' : 'Make public'}</button>
              <button className="icon-btn"><IconDownload size={16} /></button>
              <button className="icon-btn" onClick={() => removeDoc(d.id)}><IconTrash size={16} /></button>
            </div>
          ))}
          <div className="card-footer">
            <span className="muted" style={{ fontSize: 13 }}>Public docs are visible to assigned parents. Internal docs are leader-only.</span>
          </div>
        </div>
      )}

      {tab === 'messages' && (
        <div className="card flush">
          <div className="card-header"><h3>Event thread</h3><span className="muted" style={{ fontSize: 13 }}>Visible to all assigned families + guiders</span></div>
          <div style={{ padding: '0 var(--card-p)', maxHeight: 480, overflowY: 'auto' }}>
            <div className="message-list">
              {eventMessages.map(m => {
                const isMe = m.from === state.currentUser.id;
                const sender = state.guiders.find(g => g.id === m.from) || state.parents.find(p => p.id === m.from);
                return (
                  <div key={m.id} className={`msg ${isMe ? 'me' : ''}`}>
                    {!isMe && <Avatar name={sender?.name} size="sm" tone={state.guiders.find(g=>g.id===m.from) ? 'ink' : 'brand'} />}
                    <div style={{ maxWidth: '72%' }}>
                      <div className="bubble">{m.body}</div>
                      <div className="meta">{sender?.name} · {formatDate(m.at)} {new Date(m.at).toLocaleTimeString('en-CA',{hour:'numeric',minute:'2-digit'})}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ padding: 'var(--card-p)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input className="input" placeholder="Post to the event thread…" value={messageText} onChange={e=>setMessageText(e.target.value)} onKeyDown={e => e.key === 'Enter' && postMessage()} />
            <button className="btn primary" onClick={postMessage}><IconSend size={14} /> Post</button>
          </div>
        </div>
      )}

      {recordingPayment && <RecordPaymentModal payment={recordingPayment} event={event} parent={state.parents.find(p=>p.id===recordingPayment.parentId)} onSave={recordPayment} onClose={() => setRecordingPayment(null)} />}

      <Modal open={bulkReminding} onClose={() => setBulkReminding(false)} size="md" title="Send payment reminder"
        footer={<><button className="btn" onClick={() => setBulkReminding(false)}>Cancel</button><button className="btn primary" onClick={sendBulkReminder}><IconSend size={14} /> Send to {payments.filter(p => p.status !== 'fully-paid').length}</button></>}>
        <div className="stack gap-4">
          <p>Send a friendly payment reminder to <strong>{payments.filter(p => p.status !== 'fully-paid').length} families</strong> with outstanding balances on {event.title}.</p>
          <div className="field-row"><label className="label">Subject</label><input className="input" defaultValue={`Friendly reminder: ${event.title} balance`} /></div>
          <div className="field-row"><label className="label">Message</label><textarea className="textarea" rows={5} defaultValue={`Hi,\n\nJust a gentle reminder that payment for "${event.title}" is still outstanding. You can pay via e-transfer or log in to the portal to see your balance.\n\nNo worries if this is a bad time — just reach out.\n\n— The Guiders`} /></div>
        </div>
      </Modal>
    </div>
  );
}

function RecordPaymentModal({ payment, event, parent, onSave, onClose }) {
  const owing = payment.amount - payment.paid;
  const [amount, setAmount] = useStateED(owing);
  const [method, setMethod] = useStateED('e-transfer');
  return (
    <Modal open={true} onClose={onClose} size="sm" title="Record payment"
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => onSave(payment, Number(amount), method)}><IconCheck size={14} /> Record ${amount}</button></>}>
      <div className="stack gap-4">
        <div className="row gap-3" style={{ padding: 12, background: 'var(--cream-50)', borderRadius: 'var(--r-md)' }}>
          <Avatar name={parent?.name} />
          <div>
            <div style={{ fontWeight: 600 }}>{parent?.name}</div>
            <div className="muted" style={{ fontSize: 13 }}>{event.title} · Owing <span className="num">${owing}</span> of ${payment.amount}</div>
          </div>
        </div>
        <div className="field-row"><label className="label">Amount</label><input className="input num" type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
        <div className="field-row">
          <label className="label">Method</label>
          <div className="row gap-2">
            {['e-transfer','cash','cheque'].map(m => (
              <button key={m} className={`btn sm ${method === m ? 'primary' : ''}`} onClick={() => setMethod(m)}>{m}</button>
            ))}
          </div>
        </div>
        <div className="field-row"><label className="label">Note (optional)</label><input className="input" placeholder="e.g. Covers deposit" /></div>
      </div>
    </Modal>
  );
}

Object.assign(window, { AdminEventDetail });
