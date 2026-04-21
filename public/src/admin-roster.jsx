// Admin — Roster (parents & guiders)
const { useState: useStateR, useEffect: useEffectR } = React;

function AdminRoster({ state, setState, initialAction }) {
  const [tab, setTab] = useStateR('parents');
  const [editing, setEditing] = useStateR(initialAction === 'new-parent' ? { kind: 'parent' } : null);
  const [query, setQuery] = useStateR('');
  const [users, setUsers] = useStateR([]);
  const toast = useToast();

  const reloadUsers = () => fetch('/api/users').then(r => r.json()).then(setUsers).catch(() => {});
  useEffectR(() => { reloadUsers(); }, []);

  const people = tab === 'parents' ? state.parents : state.guiders;
  const filtered = people.filter(p => !query || p.name.toLowerCase().includes(query.toLowerCase()));

  const save = (person) => {
    setState(s => {
      const key = tab === 'parents' ? 'parents' : 'guiders';
      const idx = s[key].findIndex(x => x.id === person.id);
      if (idx >= 0) {
        const arr = [...s[key]]; arr[idx] = { ...arr[idx], ...person };
        return { ...s, [key]: arr };
      } else {
        const id = (tab === 'parents' ? 'p' : 'g') + (s[key].length+1) + Math.random().toString(36).slice(2,4);
        const avatar = person.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
        return { ...s, [key]: [...s[key], { ...person, id, avatar, role: tab === 'parents' ? 'parent' : 'guider', children: person.children || [] }] };
      }
    });
    setEditing(null);
    toast('Saved');
  };

  const remove = (p) => {
    if (!confirm(`Remove ${p.name}?`)) return;
    setState(s => {
      const key = tab === 'parents' ? 'parents' : 'guiders';
      return { ...s, [key]: s[key].filter(x => x.id !== p.id) };
    });
  };

  return (
    <div>
      <div className="row between" style={{ marginBottom: 'var(--s-5)' }}>
        <div className="btn-group">
          <button className={tab==='parents'?'active':''} onClick={() => setTab('parents')}><IconUsers size={14}/> Parents · {state.parents.length}</button>
          <button className={tab==='guiders'?'active':''} onClick={() => setTab('guiders')}><IconCompass size={14}/> Guiders · {state.guiders.length}</button>
        </div>
        <div className="row gap-2">
          <div className="searchbar"><IconSearch size={15} /><input placeholder={`Search ${tab}…`} value={query} onChange={e=>setQuery(e.target.value)} /></div>
          <button className="btn primary" onClick={() => setEditing({ kind: tab === 'parents' ? 'parent' : 'guider' })}><IconPlus size={16}/> Add {tab === 'parents' ? 'parent' : 'guider'}</button>
        </div>
      </div>

      <div className="card flush">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              {tab === 'parents' ? <th>Children</th> : <th>Role</th>}
              <th>Contact</th>
              <th>Login account</th>
              <th>Events</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const eventCount = state.events.filter(ev => (tab === 'parents' ? ev.assigned : ev.assignedGuiders).includes(p.id)).length;
              const account = users.find(u => u.personId === p.id);
              return (
                <tr key={p.id}>
                  <td><div className="row gap-2"><Avatar name={p.name} tone={tab==='parents'?'brand':'ink'} /><span style={{ fontWeight: 500 }}>{p.name}</span></div></td>
                  {tab === 'parents' ? (
                    <td>{p.children.map(c => <span key={c.id} className="chip outline" style={{ marginRight: 4 }}>{c.name} · {c.patrol}</span>)}</td>
                  ) : (
                    <td>{p.title}</td>
                  )}
                  <td>
                    <div style={{ fontSize: 13 }}>{p.email}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{p.phone}</div>
                  </td>
                  <td>
                    {account
                      ? <span className="chip brand" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{account.email}</span>
                      : <span className="chip muted" style={{ fontSize: 11 }}>No account</span>}
                  </td>
                  <td>{eventCount}</td>
                  <td>
                    <div className="row gap-1">
                      <button className="icon-btn" onClick={() => setEditing({ ...p, kind: tab === 'parents' ? 'parent' : 'guider' })}><IconEdit size={15}/></button>
                      <button className="icon-btn" onClick={() => remove(p)}><IconTrash size={15}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <PersonEditor
          person={editing}
          state={state}
          users={users}
          onSave={save}
          onClose={() => setEditing(null)}
          onUsersChange={reloadUsers}
        />
      )}
    </div>
  );
}

function PersonEditor({ person, state, users, onSave, onClose, onUsersChange }) {
  const isParent = person.kind === 'parent';
  const [draft, setDraft] = useStateR({ name: '', email: '', phone: '', title: '', children: [], ...person });
  const update = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const updateChild = (i, k, v) => setDraft(d => { const c = [...d.children]; c[i] = { ...c[i], [k]: v }; return { ...d, children: c }; });
  const addChild = () => setDraft(d => ({ ...d, children: [...d.children, { id: 'c'+Math.random().toString(36).slice(2,6), name: '', patrol: 'Robin' }] }));
  const removeChild = (i) => setDraft(d => ({ ...d, children: d.children.filter((_,idx) => idx !== i) }));

  const account = person.id ? users.find(u => u.personId === person.id) : null;
  const [loginEmail, setLoginEmail] = useStateR(draft.email || '');
  const [loginPassword, setLoginPassword] = useStateR('guides2026');
  const [creatingAccount, setCreatingAccount] = useStateR(false);
  const [editingLoginEmail, setEditingLoginEmail] = useStateR(false);
  const [newLoginEmail, setNewLoginEmail] = useStateR(account?.email || '');
  const [resettingPassword, setResettingPassword] = useStateR(false);
  const [newPassword, setNewPassword] = useStateR('');
  const toast = useToast();

  const createAccount = async () => {
    if (!loginEmail || !loginEmail.includes('@')) { toast('Enter a valid email'); return; }
    if (!loginPassword || loginPassword.length < 6) { toast('Password must be at least 6 characters'); return; }
    const res = await fetch('/api/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword, role: isParent ? 'parent' : 'admin', personId: person.id }),
    });
    if (!res.ok) { const d = await res.json(); toast(d.error || 'Failed'); return; }
    toast('Account created'); setCreatingAccount(false); onUsersChange();
  };

  const updateLoginEmail = async () => {
    if (!newLoginEmail || !newLoginEmail.includes('@')) { toast('Enter a valid email'); return; }
    const res = await fetch(`/api/users/${account.id}/email`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newLoginEmail }),
    });
    if (!res.ok) { const d = await res.json(); toast(d.error || 'Failed'); return; }
    toast('Login email updated'); setEditingLoginEmail(false); onUsersChange();
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast('Password must be at least 6 characters'); return; }
    const res = await fetch(`/api/users/${account.id}/password`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    if (!res.ok) { toast('Failed to reset password'); return; }
    toast('Password updated'); setResettingPassword(false); setNewPassword('');
  };

  const deleteAccount = async () => {
    if (!confirm(`Remove login account for ${draft.name}? They will no longer be able to sign in.`)) return;
    await fetch(`/api/users/${account.id}`, { method: 'DELETE' });
    toast('Account removed'); onUsersChange();
  };

  return (
    <Modal open={true} onClose={onClose} size="md" title={person.id ? `Edit ${isParent?'parent':'guider'}` : `Add ${isParent?'parent':'guider'}`}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => onSave(draft)}>Save</button></>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="field-row" style={{ gridColumn: '1 / -1' }}><label className="label">Full name</label><input className="input" value={draft.name} onChange={e => update('name', e.target.value)} /></div>
        <div className="field-row"><label className="label">Contact email</label><input className="input" value={draft.email} onChange={e => update('email', e.target.value)} /></div>
        <div className="field-row"><label className="label">Phone</label><input className="input" value={draft.phone} onChange={e => update('phone', e.target.value)} /></div>
        {!isParent && (
          <div className="field-row" style={{ gridColumn: '1 / -1' }}><label className="label">Role title</label><input className="input" value={draft.title} onChange={e => update('title', e.target.value)} placeholder="Unit Guider, Guider, Guider in Training…" /></div>
        )}
        {isParent && (
          <div style={{ gridColumn: '1 / -1', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <div className="row between" style={{ marginBottom: 10 }}>
              <div className="section-h" style={{ marginBottom: 0 }}>Children</div>
              <button className="btn sm" onClick={addChild}><IconPlus size={13}/> Add child</button>
            </div>
            <div className="stack gap-2">
              {draft.children.map((c, i) => (
                <div key={c.id} className="row gap-2">
                  <input className="input" style={{ flex: 2 }} placeholder="Child's name" value={c.name} onChange={e => updateChild(i, 'name', e.target.value)} />
                  <select className="select" style={{ flex: 1 }} value={c.patrol} onChange={e => updateChild(i, 'patrol', e.target.value)}>
                    {['Robin','Fox','Owl','Maple','Pine'].map(p => <option key={p}>{p}</option>)}
                  </select>
                  <button className="icon-btn" onClick={() => removeChild(i)}><IconTrash size={15}/></button>
                </div>
              ))}
              {draft.children.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No children added yet.</div>}
            </div>
          </div>
        )}

        {person.id && (
          <div style={{ gridColumn: '1 / -1', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <div className="section-h" style={{ marginBottom: 10 }}>Login account</div>
            {account ? (
              <div className="stack gap-2">
                {editingLoginEmail ? (
                  <div className="row gap-2">
                    <input className="input" style={{ flex: 1 }} type="email" value={newLoginEmail} onChange={e => setNewLoginEmail(e.target.value)} autoFocus />
                    <button className="btn sm primary" onClick={updateLoginEmail}>Save</button>
                    <button className="btn sm" onClick={() => setEditingLoginEmail(false)}>Cancel</button>
                  </div>
                ) : (
                  <div className="row between" style={{ alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{account.email}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{account.role === 'admin' ? 'Admin access' : 'Parent access'}</div>
                    </div>
                    <div className="row gap-1">
                      <button className="btn sm" onClick={() => { setEditingLoginEmail(true); setNewLoginEmail(account.email); }}>Edit email</button>
                      <button className="btn sm" onClick={() => setResettingPassword(v => !v)}>Reset password</button>
                      <button className="icon-btn" onClick={deleteAccount}><IconTrash size={14}/></button>
                    </div>
                  </div>
                )}
                {resettingPassword && (
                  <div className="row gap-2">
                    <input className="input" style={{ flex: 1 }} type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min. 6 chars)" autoFocus />
                    <button className="btn sm primary" onClick={resetPassword}>Set password</button>
                    <button className="btn sm" onClick={() => { setResettingPassword(false); setNewPassword(''); }}>Cancel</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="stack gap-2">
                <div className="muted" style={{ fontSize: 13 }}>No login account — create one to allow this person to sign in.</div>
                {creatingAccount ? (
                  <div className="stack gap-2">
                    <div className="row gap-2">
                      <input className="input" style={{ flex: 1 }} type="email" placeholder="Login email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} autoFocus />
                      <input className="input" style={{ flex: 1 }} type="text" placeholder="Initial password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                    </div>
                    <div className="row gap-1">
                      <button className="btn sm primary" onClick={createAccount}>Create account</button>
                      <button className="btn sm" onClick={() => setCreatingAccount(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn sm" onClick={() => { setCreatingAccount(true); setLoginEmail(draft.email || ''); setLoginPassword('guides2026'); }}>
                    <IconPlus size={13}/> Create login account
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

Object.assign(window, { AdminRoster });
