// Main app shell — role switcher, nav, routing

const { useState: useStateA, useEffect: useEffectA } = React;

function App({ initialState }) {
  const [state, setStateRaw] = useStateA(() => initialState || loadState() || {});
  const { tweaks, setTweaks, visible, setVisible } = useTweaks();
  const [page, setPage] = useStateA(() => {
    try { return localStorage.getItem('gg_page') || 'dashboard'; } catch(e) { return 'dashboard'; }
  });
  const [selected, setSelected] = useStateA(null);
  const [initialAction, setInitialAction] = useStateA(null);

  const setState = (updater) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveState(next);
      return next;
    });
  };

  useEffectA(() => { try { localStorage.setItem('gg_page', page); } catch(e){} }, [page]);

  const navigate = (to, id = null, action = null) => {
    if (to === 'event') { setSelected(id); setPage('event'); }
    else { setSelected(null); setPage(to); setInitialAction(action); setTimeout(() => setInitialAction(null), 100); }
  };

  const switchRole = (role, id) => {
    setStateRaw(prev => {
      const next = { ...prev, currentUser: { role, id } };
      saveState(next);
      return next;
    });
    setPage('dashboard');
    setSelected(null);
  };

  const isAdmin = state.currentUser.role === 'admin';
  const currentPerson = isAdmin
    ? state.guiders.find(g => g.id === state.currentUser.id)
    : state.parents.find(p => p.id === state.currentUser.id);

  return (
    <ToastProvider>
      <div className="app" data-nav={tweaks.nav === 'top' ? 'top' : 'side'}>
        {tweaks.nav === 'top' ? (
          <TopNav state={state} isAdmin={isAdmin} page={page} navigate={navigate} currentPerson={currentPerson} />
        ) : (
          <Sidebar state={state} isAdmin={isAdmin} page={page} navigate={navigate} currentPerson={currentPerson} />
        )}

        <div className="main">
          <PageHeader page={page} selected={selected} state={state} isAdmin={isAdmin} navigate={navigate} />
          <div className="content">
            {isAdmin ? (
              <>
                {page === 'dashboard' && <AdminDashboard state={state} setState={setState} navigate={navigate} />}
                {page === 'events' && <AdminEvents state={state} setState={setState} navigate={navigate} tweaks={tweaks} initialAction={initialAction} />}
                {page === 'event' && <AdminEventDetail state={state} setState={setState} eventId={selected} navigate={navigate} />}
                {page === 'roster' && <AdminRoster state={state} setState={setState} initialAction={initialAction} />}
                {page === 'messages' && <AdminMessages state={state} setState={setState} />}
                {page === 'settings' && <AdminSettings state={state} setState={setState} />}
              </>
            ) : (
              <ParentApp state={state} setState={setState} tweaks={tweaks} page={page} setPage={setPage} selected={selected} setSelected={setSelected} />
            )}
          </div>
        </div>

        <RoleSwitcher state={state} switchRole={switchRole} />
        <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} visible={visible} onClose={() => setVisible(false)} />
        {!visible && (
          <button
            onClick={() => setVisible(true)}
            style={{ position: 'fixed', right: 14, bottom: 14, zIndex: 50, padding: '9px 14px', borderRadius: 999, background: 'var(--ink-900)', color: 'var(--cream-50)', border: 0, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', boxShadow: 'var(--sh-md)', display: 'flex', alignItems: 'center', gap: 6 }}
            title="Open tweaks"
          >
            <IconSparkles size={14} /> Tweaks
          </button>
        )}
      </div>
    </ToastProvider>
  );
}

const ADMIN_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: IconHome },
  { id: 'events', label: 'Events', icon: IconCalendar },
  { id: 'roster', label: 'Roster', icon: IconUsers },
  { id: 'messages', label: 'Messages', icon: IconMessageCircle },
  { id: 'settings', label: 'Settings', icon: IconSettings },
];
const PARENT_NAV = [
  { id: 'dashboard', label: 'Home', icon: IconHome },
  { id: 'events', label: 'Events', icon: IconCalendar },
  { id: 'history', label: 'Balance & history', icon: IconWallet },
  { id: 'messages', label: 'Messages', icon: IconMessageCircle },
];

function Sidebar({ state, isAdmin, page, navigate, currentPerson }) {
  const items = isAdmin ? ADMIN_NAV : PARENT_NAV;
  const counts = {
    events: state.events.filter(e => e.status === 'upcoming').length,
    messages: isAdmin ? state.messages.length : state.messages.filter(m => state.events.find(e => e.id === m.eventId && e.assigned.includes(state.currentUser.id))).length,
    roster: state.parents.length + state.guiders.length,
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">{state.group.logoInitials}</div>
        <div className="brand-text">
          <div className="name">{state.group.name}</div>
          <div className="sub">{state.group.unit}</div>
        </div>
      </div>

      <div className="nav-section">
        <div className="label">{isAdmin ? 'Admin' : 'Portal'}</div>
        {items.map(it => {
          const Icon = it.icon;
          const active = page === it.id || (it.id === 'events' && page === 'event');
          return (
            <button key={it.id} className={`nav-item ${active ? 'active' : ''}`} onClick={() => navigate(it.id)}>
              <Icon size={18} />
              {it.label}
              {counts[it.id] > 0 && <span className="count">{counts[it.id]}</span>}
            </button>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <Avatar name={currentPerson?.name} tone={isAdmin ? 'ink' : 'brand'} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }} className="truncate">{currentPerson?.name}</div>
          <div className="muted truncate" style={{ fontSize: 11 }}>{isAdmin ? currentPerson?.title : 'Parent'}</div>
        </div>
        <button className="icon-btn" title="Sign out"><IconLogOut size={15} /></button>
      </div>
    </aside>
  );
}

function TopNav({ state, isAdmin, page, navigate, currentPerson }) {
  const items = isAdmin ? ADMIN_NAV : PARENT_NAV;
  return (
    <div className="topbar">
      <div className="brand">
        <div className="logo">{state.group.logoInitials}</div>
        <div className="brand-text">
          <div className="name">{state.group.name}</div>
        </div>
      </div>
      <div className="topbar-nav">
        {items.map(it => {
          const Icon = it.icon;
          const active = page === it.id || (it.id === 'events' && page === 'event');
          return (
            <button key={it.id} className={`nav-item ${active ? 'active' : ''}`} onClick={() => navigate(it.id)}>
              <Icon size={16} /> {it.label}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div className="row gap-3">
        <button className="icon-btn"><IconBell size={18} /></button>
        <Avatar name={currentPerson?.name} tone={isAdmin ? 'ink' : 'brand'} />
      </div>
    </div>
  );
}

function PageHeader({ page, selected, state, isAdmin, navigate }) {
  const titles = isAdmin ? {
    dashboard: { t: 'Good morning, Karen', s: "Here's what's happening across the unit this week." },
    events: { t: 'Events', s: 'Manage trips, camps and meetings. Assign families, set prices, track payments.' },
    roster: { t: 'Roster', s: 'Parents, children and fellow guiders.' },
    messages: { t: 'Messages', s: 'Conversations across all events.' },
    settings: { t: 'Group settings', s: 'Branding, notifications and payment preferences.' },
    event: { t: 'Event details', s: '' },
  } : {
    dashboard: { t: '', s: '' },
    events: { t: 'Events', s: 'All upcoming and past events you or your children are signed up for.' },
    history: { t: 'Balance & history', s: 'A running record of what you owe and what you\'ve paid.' },
    messages: { t: 'Messages', s: 'Conversations with leaders and other families.' },
    event: { t: '', s: '' },
  };
  const info = titles[page] || { t: '', s: '' };
  if (!info.t && !info.s && page !== 'dashboard') return null;
  if (page === 'event') return null;
  if (!isAdmin && page === 'dashboard') return null;

  return (
    <div className="main-header">
      <div className="titleblock">
        <h1>{info.t}</h1>
        {info.s && <div className="lede">{info.s}</div>}
      </div>
      <div className="header-actions">
        {isAdmin && page === 'dashboard' && (
          <>
            <div className="searchbar"><IconSearch size={15} /><input placeholder="Search anything…" /></div>
            <button className="icon-btn"><IconBell size={18} /></button>
          </>
        )}
      </div>
    </div>
  );
}

function RoleSwitcher({ state, switchRole }) {
  const isAdmin = state.currentUser.role === 'admin';
  const [showParents, setShowParents] = useStateA(false);
  const currentParent = state.parents.find(p => p.id === state.currentUser.id);

  return (
    <div className="role-switcher">
      <span className="label-sm">Viewing as</span>
      <button className={isAdmin ? 'active' : ''} onClick={() => switchRole('admin', 'g1')}>
        <IconCompass size={12} /> Admin
      </button>
      <div style={{ position: 'relative' }}>
        <button className={!isAdmin ? 'active' : ''} onClick={() => setShowParents(v => !v)}>
          <IconUsers size={12} /> {isAdmin ? 'Parent' : (currentParent?.name.split(' ')[0] || 'Parent')} <IconChevronDown size={10} />
        </button>
        {showParents && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', boxShadow: 'var(--sh-md)', minWidth: 220, padding: 4, zIndex: 100 }}>
            {state.parents.map(p => (
              <button key={p.id} className="nav-item" style={{ padding: '7px 10px' }} onClick={() => { switchRole('parent', p.id); setShowParents(false); }}>
                <Avatar name={p.name} size="sm" /> <span style={{ fontWeight: 500 }}>{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

initApp();
