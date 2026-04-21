// Admin — Event detail view
const { useState: useStateED } = React;

function AdminEventDetail({ state, setState, eventId, navigate }) {
  const event = state.events.find(e => e.id === eventId);
  const [tab, setTab] = useStateED('payments');
  const [recordingPayment, setRecordingPayment] = useStateED(null);
  const [bulkRecording, setBulkRecording] = useStateED(false);
  const [editingDeposit, setEditingDeposit] = useStateED(null);
  const [messageText, setMessageText] = useStateED('');
  const [bulkReminding, setBulkReminding] = useStateED(false);
  const [editing, setEditing] = useStateED(false);
  const toast = useToast();

  const onSave = (ev) => {
    setState(s => {
      const idx = s.events.findIndex(x => x.id === ev.id);
      if (idx < 0) return s;
      const events = [...s.events];
      events[idx] = { ...s.events[idx], ...ev };
      return { ...s, events };
    });
    setEditing(false);
    toast('Event updated');
  };

  const onDelete = (ev) => {
    if (!confirm(`Delete "${ev.title}"?`)) return;
    setState(s => ({ ...s, events: s.events.filter(e => e.id !== ev.id), payments: s.payments.filter(p => p.eventId !== ev.id) }));
    navigate('events');
  };

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
        return { ...p, paid: newPaid, status, paidDate: today(), lastMethod: method };
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
              <button className="btn primary" onClick={() => setEditing(true)}><IconEdit size={14} /> Edit event</button>
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
              {event.price > 0 && <button className="btn sm primary" onClick={() => setBulkRecording(true)}><IconPlus size={14} /> Bulk record</button>}
              <button className="btn sm" onClick={() => setBulkReminding(true)}><IconMail size={14} /> Remind unpaid</button>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr><th>Family</th><th>Child</th><th>RSVP</th><th>Deposit req.</th><th>Amount</th><th>Paid</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const parent = state.parents.find(pa => pa.id === p.parentId);
                const child = parent?.children.find(c => c.id === p.childId);
                const depositReq = p.customDeposit != null ? p.customDeposit : (event.deposit || 0);
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
                    <td>
                      {event.deposit > 0 ? (
                        <div className="row gap-1">
                          <span className="num" style={{ fontSize: 13 }}>${depositReq}</span>
                          {p.customDeposit != null && <span className="chip honey" style={{ fontSize: 11 }}>custom</span>}
                          <button className="icon-btn" style={{ padding: 3 }} title="Set custom deposit" onClick={() => setEditingDeposit({ ...p, _depositInput: depositReq })}>
                            <IconEdit size={12} />
                          </button>
                        </div>
                      ) : <span className="muted" style={{ fontSize: 13 }}>—</span>}
                    </td>
                    <td className="num">${p.amount}</td>
                    <td className="num">${p.paid}</td>
                    <td><StatusChip status={p.status} /></td>
                    <td>
                      <div className="row gap-1">
                        {p.status !== 'fully-paid' && p.amount > 0 ? (
                          <button className="btn sm" onClick={() => setRecordingPayment(p)}>Record</button>
                        ) : <span className="muted" style={{ fontSize: 13 }}>—</span>}
                      </div>
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

      {editing && <EventEditor event={event} state={state} onSave={onSave} onClose={() => setEditing(false)} onDelete={onDelete} />}

      {editingDeposit && (
        <Modal open={true} onClose={() => setEditingDeposit(null)} size="sm" title="Set custom deposit"
          footer={<>
            <button className="btn danger-ghost" onClick={() => {
              setState(s => ({ ...s, payments: s.payments.map(p => p.id === editingDeposit.id ? { ...p, customDeposit: null } : p) }));
              setEditingDeposit(null); toast('Deposit reset to event default');
            }}>Reset to default</button>
            <div style={{ flex: 1 }} />
            <button className="btn" onClick={() => setEditingDeposit(null)}>Cancel</button>
            <button className="btn primary" onClick={() => {
              const val = Number(editingDeposit._depositInput);
              setState(s => ({ ...s, payments: s.payments.map(p => p.id === editingDeposit.id ? { ...p, customDeposit: val } : p) }));
              setEditingDeposit(null); toast(`Deposit set to $${val}`);
            }}>Save</button>
          </>}>
          <div className="stack gap-3">
            <p style={{ fontSize: 14, color: 'var(--ink-700)' }}>
              Override the deposit amount for <strong>{state.parents.find(p=>p.id===editingDeposit.parentId)?.name}</strong>.
              The event default is <strong>${event.deposit}</strong>.
            </p>
            <div className="field-row">
              <label className="label">Custom deposit amount</label>
              <input className="input num" type="number" min="0" value={editingDeposit._depositInput}
                onChange={e => setEditingDeposit(d => ({ ...d, _depositInput: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}

      {bulkRecording && (
        <BulkRecordModal
          payments={payments} event={event} state={state}
          onSave={(updates) => {
            setState(s => {
              const updated = s.payments.map(p => {
                const u = updates.find(x => x.id === p.id);
                if (!u) return p;
                const newPaid = p.paid + u.amount;
                let status;
                const dep = p.customDeposit != null ? p.customDeposit : (event.deposit || 0);
                if (newPaid >= p.amount) status = 'fully-paid';
                else if (dep && newPaid >= dep) status = newPaid > dep ? 'partial' : 'deposit-paid';
                else if (newPaid > 0) status = 'partial';
                else status = 'unpaid';
                return { ...p, paid: newPaid, status, paidDate: today(), lastMethod: u.method };
              });
              return { ...s, payments: updated };
            });
            setBulkRecording(false);
            toast(`Recorded payments for ${updates.length} families`);
          }}
          onClose={() => setBulkRecording(false)}
        />
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

function BulkRecordModal({ payments, event, state, onSave, onClose }) {
  const unpaid = payments.filter(p => p.status !== 'fully-paid' && p.amount > 0);
  const [selected, setSelected] = useStateED(() => new Set(unpaid.map(p => p.id)));
  const [mode, setMode] = useStateED('deposit'); // deposit | full | custom
  const [customAmt, setCustomAmt] = useStateED(event.deposit || '');
  const [method, setMethod] = useStateED('e-transfer');
  const toast = useToast();

  const getAmount = (p) => {
    if (mode === 'deposit') return (p.customDeposit != null ? p.customDeposit : (event.deposit || 0));
    if (mode === 'full') return p.amount - p.paid;
    return Number(customAmt) || 0;
  };

  const handleSave = () => {
    const updates = [...selected].map(id => {
      const p = payments.find(x => x.id === id);
      return { id, amount: getAmount(p), method };
    }).filter(u => u.amount > 0);
    if (!updates.length) { toast('No payments to record'); return; }
    onSave(updates);
  };

  return (
    <Modal open={true} onClose={onClose} size="md" title="Bulk record payments"
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={handleSave}><IconCheck size={14}/> Record for {selected.size} families</button></>}>
      <div className="stack gap-5">
        <div>
          <div className="section-h">Amount to record</div>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            {event.deposit > 0 && <button className={`btn sm ${mode==='deposit'?'primary':''}`} onClick={() => setMode('deposit')}>Deposit only (${event.deposit})</button>}
            <button className={`btn sm ${mode==='full'?'primary':''}`} onClick={() => setMode('full')}>Full remaining balance</button>
            <button className={`btn sm ${mode==='custom'?'primary':''}`} onClick={() => setMode('custom')}>Custom amount</button>
          </div>
          {mode === 'custom' && (
            <div className="field-row" style={{ marginTop: 10, maxWidth: 180 }}>
              <label className="label">Amount per family</label>
              <input className="input num" type="number" value={customAmt} onChange={e => setCustomAmt(e.target.value)} />
            </div>
          )}
        </div>

        <div>
          <div className="section-h">Payment method</div>
          <div className="row gap-2">
            {['e-transfer','cash','cheque'].map(m => (
              <button key={m} className={`btn sm ${method===m?'primary':''}`} onClick={() => setMethod(m)}>{m}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="row between" style={{ marginBottom: 8 }}>
            <div className="section-h" style={{ marginBottom: 0 }}>Families ({unpaid.length} unpaid)</div>
            <div className="row gap-2">
              <button className="btn sm" onClick={() => setSelected(new Set(unpaid.map(p=>p.id)))}>All</button>
              <button className="btn sm" onClick={() => setSelected(new Set())}>None</button>
            </div>
          </div>
          <div className="stack gap-1">
            {unpaid.map(p => {
              const parent = state.parents.find(pa => pa.id === p.parentId);
              const child = parent?.children.find(c => c.id === p.childId);
              const amt = getAmount(p);
              return (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 'var(--r-md)', background: selected.has(p.id) ? 'var(--brand-50)' : 'var(--cream-50)', cursor: 'pointer', border: '1px solid var(--border)' }}>
                  <input type="checkbox" checked={selected.has(p.id)} onChange={e => {
                    const next = new Set(selected);
                    e.target.checked ? next.add(p.id) : next.delete(p.id);
                    setSelected(next);
                  }} />
                  <Avatar name={parent?.name} size="sm" />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{parent?.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{child?.name} · {p.status} · ${p.paid} paid of ${p.amount}</div>
                  </div>
                  <span className="num" style={{ fontWeight: 600, fontSize: 14, color: 'var(--brand-700)' }}>+${amt}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
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

function RecordPaymentFlowModal({ state, setState, onClose, initialEventId }) {
  // All hooks at the very top — no useMemo, no inline sub-components
  const [step, setStep] = useStateED(initialEventId ? 2 : 1);
  const [selectedEventId, setSelectedEventId] = useStateED(initialEventId || null);
  const [selectedIds, setSelectedIds] = useStateED([]);
  const [mode, setMode] = useStateED('full');
  const [customAmounts, setCustomAmounts] = useStateED({});
  const [method, setMethod] = useStateED('e-transfer');
  const toast = useToast();

  // Derived values — plain computation, no hooks
  const event = state.events.find(e => e.id === selectedEventId) || null;
  const eventPayments = event ? state.payments.filter(p => p.eventId === event.id) : [];

  // Build family groups: [ { parent, childPayments: [...] } ]
  const familyGroups = [];
  const seenParents = new Set();
  for (var fi = 0; fi < eventPayments.length; fi++) {
    var fp = eventPayments[fi];
    if (!seenParents.has(fp.parentId)) {
      seenParents.add(fp.parentId);
      var fparent = state.parents.find(function(pa) { return pa.id === fp.parentId; }) || null;
      var fchildren = eventPayments.filter(function(x) { return x.parentId === fp.parentId; });
      familyGroups.push({ parent: fparent, childPayments: fchildren });
    }
  }

  const selectedSet = new Set(selectedIds);

  const getAmount = (p) => {
    if (!p) return 0;
    if (mode === 'deposit') {
      const dep = p.customDeposit != null ? p.customDeposit : (event ? event.deposit || 0 : 0);
      return Math.max(0, dep - p.paid);
    }
    if (mode === 'full') return Math.max(0, p.amount - p.paid);
    return Math.max(0, Number(customAmounts[p.id] != null ? customAmounts[p.id] : (p.amount - p.paid)));
  };

  const toggleFamily = (childPayments) => {
    const ids = childPayments.map(p => p.id);
    const allSel = ids.every(id => selectedSet.has(id));
    if (allSel) {
      setSelectedIds(selectedIds.filter(id => !ids.includes(id)));
    } else {
      const toAdd = ids.filter(id => !selectedSet.has(id));
      setSelectedIds(selectedIds.concat(toAdd));
    }
  };

  const toggleChild = (id) => {
    if (selectedSet.has(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds(selectedIds.concat([id]));
    }
  };

  const selectEvent = (id) => {
    setSelectedEventId(id);
    setSelectedIds([]);
    setCustomAmounts({});
    setMode(state.events.find(e => e.id === id) && state.events.find(e => e.id === id).deposit > 0 ? 'deposit' : 'full');
  };

  const totalToRecord = selectedIds.reduce((sum, id) => {
    const p = eventPayments.find(x => x.id === id);
    return sum + getAmount(p);
  }, 0);

  const handleConfirm = () => {
    const updates = selectedIds.map(id => {
      const p = eventPayments.find(x => x.id === id);
      return { id, amount: getAmount(p), method };
    }).filter(u => u.amount > 0);
    if (!updates.length) { toast('No amounts to record — balances may already be met'); return; }
    setState(s => {
      const updated = s.payments.map(p => {
        const u = updates.find(x => x.id === p.id);
        if (!u) return p;
        const newPaid = p.paid + u.amount;
        const dep = p.customDeposit != null ? p.customDeposit : (event ? event.deposit || 0 : 0);
        let status;
        if (newPaid >= p.amount) status = 'fully-paid';
        else if (dep && newPaid >= dep) status = newPaid > dep ? 'partial' : 'deposit-paid';
        else if (newPaid > 0) status = 'partial';
        else status = 'unpaid';
        return { ...p, paid: newPaid, status, paidDate: today(), lastMethod: u.method };
      });
      return { ...s, payments: updated };
    });
    toast('Recorded ' + updates.length + ' payment' + (updates.length !== 1 ? 's' : '') + ' — $' + totalToRecord + ' total');
    onClose();
  };

  const paidEvents = state.events.filter(e => e.price > 0).sort((a,b) => a.date.localeCompare(b.date));
  const sel = selectedIds.length;

  // Stepper bar — inlined JSX, no sub-component
  const stepLabels = ['Choose event', 'Select children', 'Confirm'];
  const stepperBar = (
    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:20, flexWrap:'wrap' }}>
      {stepLabels.map((l, i) => {
        const n = i + 1;
        return (
          <React.Fragment key={n}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background: step >= n ? 'var(--brand-600)' : 'var(--ink-200)', color:'white', display:'grid', placeItems:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{n}</div>
              <span style={{ fontSize:13, color: step >= n ? 'var(--ink-900)' : 'var(--text-muted)', fontWeight: step === n ? 600 : 400 }}>{l}</span>
            </div>
            {i < 2 && <div style={{ width:18, height:1, background:'var(--border)', flexShrink:0 }}/>}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <Modal open={true} onClose={onClose} size="lg" title="Record a payment"
      footer={
        step === 1 ? (
          <><button className="btn" onClick={onClose}>Cancel</button><div style={{flex:1}}/><button className="btn primary" disabled={!selectedEventId} onClick={() => setStep(2)}>Next: Select children →</button></>
        ) : step === 2 ? (
          <><button className="btn" onClick={() => setStep(1)}>← Back</button><div style={{flex:1}}/><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={sel === 0} onClick={() => setStep(3)}>Next: Confirm ({sel} child{sel !== 1 ? 'ren' : ''}) →</button></>
        ) : (
          <><button className="btn" onClick={() => setStep(2)}>← Back</button><div style={{flex:1}}/><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={handleConfirm}><IconCheck size={14}/> Record ${totalToRecord}</button></>
        )
      }>
      {stepperBar}

      {step === 1 && (
        <div className="stack gap-2">
          {paidEvents.length === 0 && <div className="empty muted">No paid events found.</div>}
          {paidEvents.map(ev => {
            const ps = state.payments.filter(p => p.eventId === ev.id);
            const paidCount = ps.filter(p => p.status === 'fully-paid').length;
            const outstanding = ps.length - paidCount;
            return (
              <label key={ev.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderRadius:'var(--r-md)', cursor:'pointer', background: selectedEventId===ev.id ? 'var(--brand-50)' : 'var(--cream-50)', border:'1px solid ' + (selectedEventId===ev.id ? 'var(--brand-300)' : 'var(--border)') }}>
                <input type="radio" name="rpf-event" checked={selectedEventId===ev.id} onChange={() => selectEvent(ev.id)} />
                <div style={{ textAlign:'center', minWidth:38 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:'var(--text-muted)' }}>{new Date(ev.date+'T00:00:00').toLocaleDateString('en-CA',{month:'short'})}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, lineHeight:1 }}>{new Date(ev.date+'T00:00:00').getDate()}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{ev.title}</div>
                  <div className="muted" style={{ fontSize:12 }}>
                    ${ev.price} per child{ev.deposit ? ' · $' + ev.deposit + ' deposit' : ''} · {paidCount}/{ps.length} fully paid{outstanding > 0 ? ' · ' + outstanding + ' outstanding' : ''}
                  </div>
                </div>
                {ev.status==='upcoming' ? <span className="chip brand">Upcoming</span> : <span className="chip muted">Past</span>}
              </label>
            );
          })}
        </div>
      )}

      {step === 2 && event && (
        <div className="stack gap-4">
          <div style={{ padding:'10px 14px', background:'var(--brand-50)', borderRadius:'var(--r-md)', border:'1px solid var(--brand-200)' }}>
            <span style={{ fontWeight:600 }}>{event.title}</span>
            <span className="muted" style={{ fontSize:13 }}> · {formatDateLong(event.date)} · ${event.price}{event.deposit ? ' ($' + event.deposit + ' deposit)' : ''}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div className="section-h" style={{ marginBottom:0 }}>Families &amp; children attending</div>
            <div className="row gap-2">
              <button className="btn sm" onClick={() => setSelectedIds(eventPayments.filter(p => p.status !== 'fully-paid').map(p => p.id))}>All unpaid</button>
              <button className="btn sm" onClick={() => setSelectedIds(eventPayments.map(p => p.id))}>All</button>
              <button className="btn sm" onClick={() => setSelectedIds([])}>None</button>
            </div>
          </div>
          {familyGroups.length === 0 ? (
            <div className="muted" style={{ fontSize:14 }}>No payment records found for this event. Payments are created automatically when families are assigned to an event.</div>
          ) : (
            <div className="stack gap-3">
              {familyGroups.map((group) => {
                const par = group.parent;
                const fps = group.childPayments;
                const allSel = fps.length > 0 && fps.every(p => selectedSet.has(p.id));
                const someSel = fps.some(p => selectedSet.has(p.id));
                return (
                  <div key={par ? par.id : fps[0].parentId} style={{ border:'1px solid var(--border)', borderRadius:'var(--r-md)', overflow:'hidden' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background: allSel ? 'var(--brand-50)' : someSel ? 'var(--cream-50)' : 'var(--cream-50)' }}>
                      <input type="checkbox" checked={allSel}
                        ref={function(el) { if (el) el.indeterminate = someSel && !allSel; }}
                        onChange={() => toggleFamily(fps)} style={{ cursor:'pointer' }} />
                      <Avatar name={par ? par.name : fps[0].parentId} size="sm" />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:14 }}>{par ? par.name : fps[0].parentId}</div>
                        <div className="muted" style={{ fontSize:12 }}>{fps.length} child{fps.length!==1?'ren':''} attending · {fps.filter(p=>p.status==='fully-paid').length} fully paid</div>
                      </div>
                    </div>
                    {fps.map(p => {
                      const child = par && par.children ? par.children.find(c => c.id === p.childId) : null;
                      const dep = p.customDeposit != null ? p.customDeposit : (event.deposit || 0);
                      return (
                        <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 14px 8px 46px', background: selectedSet.has(p.id) ? 'var(--brand-50)' : 'white', borderTop:'1px solid var(--border)' }}>
                          <input type="checkbox" checked={selectedSet.has(p.id)} onChange={() => toggleChild(p.id)} style={{ cursor:'pointer' }} />
                          <div style={{ flex:1 }}>
                            <span style={{ fontSize:13, fontWeight:500 }}>{child ? child.name : p.childId}</span>
                            {child && <span className="muted" style={{ fontSize:12 }}> · {child.patrol}</span>}
                          </div>
                          {dep > 0 && <span className="muted" style={{ fontSize:11 }}>${dep} deposit{p.customDeposit!=null?' (custom)':''}</span>}
                          <span className="muted" style={{ fontSize:11 }}>${p.paid}/${p.amount}</span>
                          <StatusChip status={p.status} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === 3 && event && (
        <div className="stack gap-5">
          <div style={{ padding:'10px 14px', background:'var(--brand-50)', borderRadius:'var(--r-md)', border:'1px solid var(--brand-200)' }}>
            <span style={{ fontWeight:600 }}>{event.title}</span>
            <span className="muted" style={{ fontSize:13 }}> · {sel} child{sel!==1?'ren':''} selected</span>
          </div>

          <div>
            <div className="section-h">Amount to record</div>
            <div className="row gap-2" style={{ flexWrap:'wrap' }}>
              {event.deposit > 0 && <button className={'btn sm ' + (mode==='deposit'?'primary':'')} onClick={() => setMode('deposit')}>Deposit per child</button>}
              <button className={'btn sm ' + (mode==='full'?'primary':'')} onClick={() => setMode('full')}>Full remaining balance</button>
              <button className={'btn sm ' + (mode==='custom'?'primary':'')} onClick={() => setMode('custom')}>Custom per child</button>
            </div>
            {mode==='deposit' && event.deposit > 0 && <div className="muted" style={{ fontSize:13, marginTop:8 }}>Records the remaining deposit for each child (${event.deposit} default; custom per child where set).</div>}
          </div>

          <div>
            <div className="section-h">Payment method</div>
            <div className="row gap-2">
              {['e-transfer','cash','cheque'].map(m => (
                <button key={m} className={'btn sm ' + (method===m?'primary':'')} onClick={() => setMethod(m)}>{m}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="section-h">Summary — {sel} child{sel!==1?'ren':''}</div>
            <div className="stack gap-1">
              {selectedIds.map(id => {
                const p = eventPayments.find(x => x.id === id);
                const par = p ? (state.parents.find(pa => pa.id === p.parentId) || null) : null;
                const child = par && par.children ? par.children.find(c => c.id === (p ? p.childId : null)) : null;
                const amt = getAmount(p);
                return (
                  <div key={id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px', borderRadius:'var(--r-md)', background:'var(--cream-50)', border:'1px solid var(--border)' }}>
                    <Avatar name={par ? par.name : '?'} size="sm" />
                    <div style={{ flex:1 }}>
                      <span style={{ fontSize:13, fontWeight:600 }}>{par ? par.name : '?'}</span>
                      <span style={{ fontSize:13 }}>{child ? ' · ' + child.name : ''}</span>
                      {child && <span className="muted" style={{ fontSize:12 }}> ({child.patrol})</span>}
                      <div className="muted" style={{ fontSize:11 }}>${p ? p.paid : 0} paid · ${p ? p.amount - p.paid : 0} remaining</div>
                    </div>
                    {mode==='custom' ? (
                      <input className="input num" type="number" min="0" style={{ width:80, padding:'4px 8px' }}
                        value={customAmounts[id] != null ? customAmounts[id] : (p ? p.amount - p.paid : 0)}
                        onChange={e => setCustomAmounts(function(a) { var n = Object.assign({}, a); n[id] = e.target.value; return n; })} />
                    ) : (
                      <span className="num" style={{ fontWeight:700, fontSize:15, color: amt > 0 ? 'var(--brand-700)' : 'var(--text-muted)' }}>
                        {amt > 0 ? '+$' + amt : '—'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {mode !== 'custom' && totalToRecord > 0 && (
              <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:12, gap:8, alignItems:'center', borderTop:'1px solid var(--border)', marginTop:8 }}>
                <span className="muted" style={{ fontSize:13 }}>Total to record:</span>
                <span className="num" style={{ fontWeight:700, fontSize:18, color:'var(--brand-700)' }}>${totalToRecord}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

Object.assign(window, { AdminEventDetail, RecordPaymentFlowModal });
