// Admin — Roster (parents & guiders)
const { useState: useStateR } = React;

function AdminRoster({ state, setState, initialAction }) {
  const [tab, setTab] = useStateR('parents');
  const [editing, setEditing] = useStateR(initialAction === 'new-parent' ? { kind: 'parent' } : null);
  const [query, setQuery] = useStateR('');
  const toast = useToast();

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
              <th>Events</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const eventCount = state.events.filter(ev => (tab === 'parents' ? ev.assigned : ev.assignedGuiders).includes(p.id)).length;
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

      {editing && <PersonEditor person={editing} state={state} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

function PersonEditor({ person, state, onSave, onClose }) {
  const isParent = person.kind === 'parent';
  const [draft, setDraft] = useStateR({ name: '', email: '', phone: '', title: '', children: [], ...person });
  const update = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const updateChild = (i, k, v) => setDraft(d => { const c = [...d.children]; c[i] = { ...c[i], [k]: v }; return { ...d, children: c }; });
  const addChild = () => setDraft(d => ({ ...d, children: [...d.children, { id: 'c'+Math.random().toString(36).slice(2,6), name: '', patrol: 'Robin' }] }));
  const removeChild = (i) => setDraft(d => ({ ...d, children: d.children.filter((_,idx) => idx !== i) }));

  return (
    <Modal open={true} onClose={onClose} size="md" title={person.id ? `Edit ${isParent?'parent':'guider'}` : `Add ${isParent?'parent':'guider'}`}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => onSave(draft)}>Save</button></>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="field-row" style={{ gridColumn: '1 / -1' }}><label className="label">Full name</label><input className="input" value={draft.name} onChange={e => update('name', e.target.value)} /></div>
        <div className="field-row"><label className="label">Email</label><input className="input" value={draft.email} onChange={e => update('email', e.target.value)} /></div>
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
      </div>
    </Modal>
  );
}

Object.assign(window, { AdminRoster });
