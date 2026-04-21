// Admin — Messages (cross-event inbox) & Settings
const { useState: useStateMS, useRef: useRefMS } = React;

function AdminMessages({ state, setState }) {
  const [selectedThread, setSelectedThread] = useStateMS(null);
  const [reply, setReply] = useStateMS('');
  const toast = useToast();

  // Build threads: one per (eventId, thread-kind-or-dm-participant)
  const threads = [];
  const dmMap = {};
  state.messages.forEach(m => {
    if (m.thread === 'dm') {
      const otherId = m.from === state.currentUser.id ? m.to : m.from;
      const key = `dm:${m.eventId}:${otherId}`;
      if (!dmMap[key]) dmMap[key] = { key, kind: 'dm', eventId: m.eventId, with: otherId, messages: [] };
      dmMap[key].messages.push(m);
    }
  });
  Object.values(dmMap).forEach(t => threads.push(t));
  const eventMap = {};
  state.messages.filter(m => m.thread === 'event').forEach(m => {
    const key = `event:${m.eventId}`;
    if (!eventMap[key]) eventMap[key] = { key, kind: 'event', eventId: m.eventId, messages: [] };
    eventMap[key].messages.push(m);
  });
  Object.values(eventMap).forEach(t => threads.push(t));

  threads.forEach(t => t.messages.sort((a,b) => a.at.localeCompare(b.at)));
  threads.sort((a,b) => (b.messages[b.messages.length-1]?.at || '').localeCompare(a.messages[a.messages.length-1]?.at || ''));

  const active = threads.find(t => t.key === selectedThread) || threads[0];

  const sendReply = () => {
    if (!reply.trim() || !active) return;
    const msg = {
      id: 'm' + Math.random().toString(36).slice(2,8),
      eventId: active.eventId, thread: active.kind,
      from: state.currentUser.id, to: active.kind === 'dm' ? active.with : undefined,
      body: reply.trim(), at: new Date().toISOString(),
    };
    setState(s => ({ ...s, messages: [...s.messages, msg] }));
    setReply(''); toast('Reply sent');
  };

  return (
    <div className="card flush" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 600, overflow: 'hidden' }}>
      <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
        {threads.map(t => {
          const ev = state.events.find(e => e.id === t.eventId);
          const last = t.messages[t.messages.length - 1];
          const lastSender = state.guiders.find(g => g.id === last?.from) || state.parents.find(p => p.id === last?.from);
          const other = t.kind === 'dm' ? state.parents.find(p => p.id === t.with) : null;
          return (
            <button key={t.key} onClick={() => setSelectedThread(t.key)} style={{ display: 'flex', gap: 10, padding: 14, borderBottom: '1px solid var(--border)', width: '100%', textAlign: 'left', background: (active?.key === t.key) ? 'var(--brand-50)' : 'var(--bg-raised)', border: 0, borderRadius: 0, cursor: 'pointer', borderRight: (active?.key === t.key) ? '3px solid var(--brand-600)' : 0 }}>
              <Avatar name={t.kind === 'dm' ? other?.name : ev?.title} tone={t.kind === 'dm' ? 'brand' : 'ink'} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="row between">
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.kind === 'dm' ? other?.name : ev?.title}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{formatDate(last?.at)}</div>
                </div>
                <div className="muted truncate" style={{ fontSize: 11, marginBottom: 2 }}>{t.kind === 'dm' ? `Private · ${ev?.title}` : 'Event thread'}</div>
                <div className="truncate" style={{ fontSize: 12, color: 'var(--ink-600)' }}>{lastSender?.name}: {last?.body}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {active ? (
          <>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600 }}>
                {active.kind === 'dm' ? state.parents.find(p => p.id === active.with)?.name : state.events.find(e=>e.id===active.eventId)?.title}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {active.kind === 'dm' ? `Private conversation · ${state.events.find(e=>e.id===active.eventId)?.title}` : 'Event thread — visible to all assigned families'}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
              <div className="message-list">
                {active.messages.map(m => {
                  const isMe = m.from === state.currentUser.id;
                  const sender = state.guiders.find(g => g.id === m.from) || state.parents.find(p => p.id === m.from);
                  return (
                    <div key={m.id} className={`msg ${isMe ? 'me' : ''}`}>
                      {!isMe && <Avatar name={sender?.name} size="sm" tone={state.guiders.find(g => g.id === m.from) ? 'ink' : 'brand'} />}
                      <div style={{ maxWidth: '72%' }}>
                        <div className="bubble">{m.body}</div>
                        <div className="meta">{sender?.name} · {formatDate(m.at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input className="input" placeholder="Type a reply…" value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReply()} />
              <button className="btn primary" onClick={sendReply}><IconSend size={14}/> Send</button>
            </div>
          </>
        ) : (
          <div className="empty"><div className="icon-wrap"><IconMessageCircle/></div><h3>No messages yet</h3></div>
        )}
      </div>
    </div>
  );
}

function AdminSettings({ state, setState }) {
  const [g, setG] = useStateMS(state.group);
  const toast = useToast();
  const update = (k, v) => setG(prev => ({ ...prev, [k]: v }));
  const save = () => { setState(s => ({ ...s, group: g })); toast('Settings saved'); };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--s-5)' }}>
      <div className="stack gap-5">
        <div className="card">
          <div className="section-h">Group identity</div>
          <div className="field-row"><label className="label">Group name</label><input className="input" value={g.name} onChange={e=>update('name',e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="field-row"><label className="label">Unit</label><input className="input" value={g.unit} onChange={e=>update('unit',e.target.value)} /></div>
            <div className="field-row"><label className="label">District</label><input className="input" value={g.district} onChange={e=>update('district',e.target.value)} /></div>
            <div className="field-row"><label className="label">Region / council</label><input className="input" value={g.region} onChange={e=>update('region',e.target.value)} /></div>
            <div className="field-row"><label className="label">Contact email</label><input className="input" value={g.contactEmail} onChange={e=>update('contactEmail',e.target.value)} /></div>
            <div className="field-row"><label className="label">Meeting day/time</label><input className="input" value={g.meetingDay} onChange={e=>update('meetingDay',e.target.value)} /></div>
            <div className="field-row"><label className="label">Meeting location</label><input className="input" value={g.meetingLocation} onChange={e=>update('meetingLocation',e.target.value)} /></div>
          </div>
        </div>

        <div className="card">
          <div className="section-h">Notifications</div>
          <div className="stack gap-3">
            <label className="row gap-3" style={{ padding: 12, background: 'var(--cream-50)', borderRadius: 'var(--r-md)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <div><div style={{ fontWeight: 500, fontSize: 14 }}>Email parents when new events are created</div><div className="muted" style={{ fontSize: 12 }}>Ask before sending — confirmation screen on event creation.</div></div>
            </label>
            <label className="row gap-3" style={{ padding: 12, background: 'var(--cream-50)', borderRadius: 'var(--r-md)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <div><div style={{ fontWeight: 500, fontSize: 14 }}>Weekly digest for unpaid balances</div><div className="muted" style={{ fontSize: 12 }}>Sent Sunday evenings summarizing outstanding amounts.</div></div>
            </label>
            <label className="row gap-3" style={{ padding: 12, background: 'var(--cream-50)', borderRadius: 'var(--r-md)', cursor: 'pointer' }}>
              <input type="checkbox" />
              <div><div style={{ fontWeight: 500, fontSize: 14 }}>Reminder 3 days before deposit due dates</div><div className="muted" style={{ fontSize: 12 }}>Auto-sends a gentle reminder to unpaid families.</div></div>
            </label>
          </div>
        </div>

        <div className="card">
          <div className="section-h">Payment methods accepted</div>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            {['E-transfer','Cash','Cheque','PayPal'].map(m => <span key={m} className="chip brand">{m}</span>)}
            <button className="btn sm"><IconPlus size={13}/> Add</button>
          </div>
          <p className="help" style={{ marginTop: 12 }}>Online payments via the portal are coming soon. For now, record payments manually after receiving them.</p>
        </div>
      </div>

      <div className="stack gap-4">
        <div className="card">
          <div className="section-h">Group logo</div>
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <div style={{ width: 100, height: 100, borderRadius: 20, background: 'linear-gradient(145deg, var(--brand-500), var(--brand-700))', color: 'var(--cream-50)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, boxShadow: 'var(--sh-md)' }}>
              {g.logoInitials}
            </div>
          </div>
          <div className="field-row"><label className="label">Logo initials</label><input className="input" maxLength={3} value={g.logoInitials} onChange={e=>update('logoInitials',e.target.value)} /></div>
          <button className="btn" style={{ width: '100%' }}><IconUpload size={14}/> Upload custom logo</button>
          <p className="help">Square PNG, 200×200 or larger.</p>
        </div>

        <div className="card">
          <div className="section-h">Portal URL</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, background: 'var(--cream-100)', padding: '10px 12px', borderRadius: 'var(--r-md)', color: 'var(--ink-700)', wordBreak: 'break-all' }}>
            portal.3rdmaplewood.ca
          </div>
          <p className="help" style={{ marginTop: 10 }}>Share with parents so they can log in to check balances.</p>
        </div>

        <div className="card">
          <div className="section-h">Danger zone</div>
          <button className="btn danger-ghost" onClick={() => { if (confirm('Reset all data to defaults?')) { resetState(); location.reload(); }}}><IconTrash size={14} /> Reset demo data</button>
        </div>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <UserAccounts state={state} />
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <BackupRestore state={state} setState={setState} />
      </div>

      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn" onClick={() => setG(state.group)}>Discard</button>
        <button className="btn primary" onClick={save}>Save changes</button>
      </div>
    </div>
  );
}

function UserAccounts({ state }) {
  const { useState: useStateUA, useEffect: useEffectUA } = React;
  const [users, setUsers] = useStateUA([]);
  const [adding, setAdding] = useStateUA(false);
  const [newEmail, setNewEmail] = useStateUA('');
  const [newPerson, setNewPerson] = useStateUA('');
  const [newRole, setNewRole] = useStateUA('parent');
  const [newPassword, setNewPassword] = useStateUA('guides2026');
  const [resetTarget, setResetTarget] = useStateUA(null);
  const [resetPw, setResetPw] = useStateUA('');
  const [editEmailTarget, setEditEmailTarget] = useStateUA(null);
  const [newEmailVal, setNewEmailVal] = useStateUA('');
  const toast = useToast();

  const load = () => fetch('/api/users').then(r=>r.json()).then(setUsers).catch(()=>{});
  useEffectUA(() => { load(); }, []);

  const people = [
    ...state.guiders.map(g => ({ ...g, kind: 'admin' })),
    ...state.parents.map(p => ({ ...p, kind: 'parent' })),
  ];
  const personOptions = people.filter(p => !users.find(u => u.personId === p.id));

  const createUser = async () => {
    if (!newEmail || !newPerson) { toast('Fill in all fields'); return; }
    const res = await fetch('/api/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole, personId: newPerson }),
    });
    if (!res.ok) { const d = await res.json(); toast(d.error || 'Failed'); return; }
    toast('Account created'); setAdding(false); setNewEmail(''); setNewPerson(''); setNewPassword('guides2026'); load();
  };

  const deleteUser = async (id) => {
    if (!confirm('Remove this login account?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    toast('Account removed'); load();
  };

  const resetPassword = async () => {
    if (!resetPw || resetPw.length < 6) { toast('Password must be at least 6 characters'); return; }
    const res = await fetch(`/api/users/${resetTarget.id}/password`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetPw }),
    });
    if (!res.ok) { toast('Failed to reset'); return; }
    toast('Password updated'); setResetTarget(null); setResetPw('');
  };

  const personName = (personId) => people.find(p => p.id === personId)?.name || personId;

  return (
    <div className="card flush">
      <div className="card-header">
        <h3>Login accounts</h3>
        <button className="btn sm primary" onClick={() => setAdding(true)}><IconPlus size={13}/> Create account</button>
      </div>
      <table className="table">
        <thead>
          <tr><th>Person</th><th>Email</th><th>Role</th><th></th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td><span style={{ fontWeight: 500 }}>{personName(u.personId)}</span></td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{u.email}</td>
              <td>{u.role === 'admin' ? <span className="chip brand">Admin</span> : <span className="chip muted">Parent</span>}</td>
              <td>
                <div className="row gap-1">
                  <button className="btn sm" onClick={() => { setEditEmailTarget(u); setNewEmailVal(u.email); }}>Edit email</button>
                  <button className="btn sm" onClick={() => { setResetTarget(u); setResetPw(''); }}>Reset password</button>
                  <button className="icon-btn" onClick={() => deleteUser(u.id)}><IconTrash size={14}/></button>
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={4} className="empty" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No accounts yet.</td></tr>
          )}
        </tbody>
      </table>
      <div className="card-footer">
        <span className="muted" style={{ fontSize: 13 }}>Default password on first run: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>guides2026</code></span>
      </div>

      {adding && (
        <Modal open={true} onClose={() => setAdding(false)} size="sm" title="Create login account"
          footer={<><button className="btn" onClick={() => setAdding(false)}>Cancel</button><button className="btn primary" onClick={createUser}>Create account</button></>}>
          <div className="stack gap-4">
            <div className="field-row">
              <label className="label">Person</label>
              <select className="select" value={newPerson} onChange={e => { setNewPerson(e.target.value); const p = people.find(x=>x.id===e.target.value); if(p) { setNewRole(p.kind === 'admin' ? 'admin' : 'parent'); setNewEmail(p.email||''); } }}>
                <option value="">— select —</option>
                {personOptions.map(p => <option key={p.id} value={p.id}>{p.name} ({p.kind})</option>)}
              </select>
            </div>
            <div className="field-row">
              <label className="label">Email (login)</label>
              <input className="input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            </div>
            <div className="field-row">
              <label className="label">Role</label>
              <div className="row gap-2">
                <button className={`btn sm ${newRole==='admin'?'primary':''}`} onClick={() => setNewRole('admin')}>Admin</button>
                <button className={`btn sm ${newRole==='parent'?'primary':''}`} onClick={() => setNewRole('parent')}>Parent</button>
              </div>
            </div>
            <div className="field-row">
              <label className="label">Initial password</label>
              <input className="input" type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
          </div>
        </Modal>
      )}

      {editEmailTarget && (
        <Modal open={true} onClose={() => setEditEmailTarget(null)} size="sm" title={`Change login email — ${personName(editEmailTarget.personId)}`}
          footer={<><button className="btn" onClick={() => setEditEmailTarget(null)}>Cancel</button><button className="btn primary" onClick={async () => {
            if (!newEmailVal || !newEmailVal.includes('@')) { toast('Enter a valid email'); return; }
            const res = await fetch(`/api/users/${editEmailTarget.id}/email`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: newEmailVal }),
            });
            if (!res.ok) { const d = await res.json(); toast(d.error || 'Failed'); return; }
            toast('Login email updated'); setEditEmailTarget(null); load();
          }}>Save</button></>}>
          <div className="field-row">
            <label className="label">New login email</label>
            <input className="input" type="email" value={newEmailVal} onChange={e => setNewEmailVal(e.target.value)} autoFocus />
            <div className="help">This is the email address used to sign in.</div>
          </div>
        </Modal>
      )}

      {resetTarget && (
        <Modal open={true} onClose={() => setResetTarget(null)} size="sm" title={`Reset password — ${personName(resetTarget.personId)}`}
          footer={<><button className="btn" onClick={() => setResetTarget(null)}>Cancel</button><button className="btn primary" onClick={resetPassword}>Save new password</button></>}>
          <div className="field-row">
            <label className="label">New password</label>
            <input className="input" type="text" value={resetPw} onChange={e => setResetPw(e.target.value)} placeholder="At least 6 characters" autoFocus />
          </div>
        </Modal>
      )}
    </div>
  );
}

function BackupRestore({ state, setState }) {
  const fileRef = useRefMS(null);
  const toast = useToast();

  const doBackup = () => {
    const payload = {
      __meta: { kind: 'girlguides-backup', version: 1, exportedAt: new Date().toISOString() },
      state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `girlguides-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Backup downloaded', { tone: 'success' });
  };

  const doRestore = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const incoming = parsed.state || parsed;
        if (!incoming || typeof incoming !== 'object' || !Array.isArray(incoming.events) || !Array.isArray(incoming.parents) || !Array.isArray(incoming.payments)) {
          toast('That doesn\u2019t look like a valid backup file.', { tone: 'error' });
          return;
        }
        if (!confirm('Restore this backup? It will replace ALL current data and settings.')) return;
        setState(s => ({ ...incoming, currentUser: s.currentUser }));
        toast('Backup restored', { tone: 'success' });
      } catch (e) {
        toast('Couldn\u2019t read that file — is it a valid JSON backup?', { tone: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const counts = {
    events: state.events.length,
    parents: state.parents.length,
    guiders: state.guiders.length,
    payments: state.payments.length,
    messages: (state.messages || []).length,
  };

  return (
    <div className="card">
      <div className="section-h">Backup &amp; restore</div>
      <p className="help" style={{ marginTop: -4, marginBottom: 16 }}>Export everything to a JSON file, or replace all data with a previous backup. Includes events, payments, families, guiders, messages, documents &amp; group settings.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--s-3)', marginBottom: 'var(--s-4)' }}>
        {[
          { k: 'Events', v: counts.events },
          { k: 'Parents', v: counts.parents },
          { k: 'Guiders', v: counts.guiders },
          { k: 'Payments', v: counts.payments },
          { k: 'Messages', v: counts.messages },
        ].map(s => (
          <div key={s.k} style={{ padding: '10px 14px', background: 'var(--cream-50)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
            <div className="muted" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>{s.k}</div>
            <div className="num" style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, marginTop: 2 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={doBackup}><IconDownload size={15} /> Download backup</button>
        <button className="btn" onClick={() => fileRef.current?.click()}><IconUpload size={15} /> Restore from file…</button>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) doRestore(f);
          e.target.value = '';
        }} />
      </div>
    </div>
  );
}

Object.assign(window, { AdminMessages, AdminSettings, BackupRestore });
