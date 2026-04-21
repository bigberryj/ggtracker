// Main app shell — role switcher, nav, routing

const { useState: useStateA, useEffect: useEffectA } = React;

function App({ initialState, authUser, onLogout }) {
  const [state, setStateRaw] = useStateA(() => initialState || {});
  const { tweaks, setTweaks, visible, setVisible } = useTweaks();
  const [page, setPage] = useStateA(() => {
    try { return localStorage.getItem('gg_page') || 'dashboard'; } catch(e) { return 'dashboard'; }
  });
  const [selected, setSelected] = useStateA(null);
  const [initialAction, setInitialAction] = useStateA(null);

  // Sync role to global so saveState knows not to PUT for parents
  useEffectA(() => { window.__currentUserRole = state.currentUser?.role; }, [state.currentUser?.role]);

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

  // Admin-only: preview the app as a specific parent (client-side only, no re-fetch)
  const switchRole = (role, id) => {
    setStateRaw(prev => {
      const next = { ...prev, currentUser: { role, id } };
      // Don't persist this switch — it's just a preview
      return next;
    });
    setPage('dashboard');
    setSelected(null);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    try { localStorage.removeItem('gg_payment_tracker_v1'); } catch(e) {}
    onLogout();
  };

  const isAdmin = state.currentUser?.role === 'admin';
  // When admin is previewing a parent, use the full guider list from state
  const realAdminId = authUser?.personId;
  const currentPerson = isAdmin
    ? (state.guiders?.find(g => g.id === state.currentUser.id) || state.guiders?.find(g => g.id === realAdminId))
    : state.parents?.find(p => p.id === state.currentUser.id);

  const pageHeaderName = isAdmin
    ? (currentPerson?.name?.split(' ')[0] || 'there')
    : '';

  return (
    <ToastProvider>
      <div className="app" data-nav={tweaks.nav === 'top' ? 'top' : 'side'}>
        {tweaks.nav === 'top' ? (
          <TopNav state={state} isAdmin={isAdmin} page={page} navigate={navigate} currentPerson={currentPerson} onLogout={handleLogout} />
        ) : (
          <Sidebar state={state} isAdmin={isAdmin} page={page} navigate={navigate} currentPerson={currentPerson} onLogout={handleLogout} />
        )}

        <div className="main">
          <PageHeader page={page} selected={selected} state={state} isAdmin={isAdmin} navigate={navigate} adminName={pageHeaderName} />
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

        {/* Admins can preview as any parent — shown as a discreet "Preview" bar */}
        {authUser?.role === 'admin' && (
          <RoleSwitcher state={state} switchRole={switchRole} realAdminId={realAdminId} />
        )}

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

function Sidebar({ state, isAdmin, page, navigate, currentPerson, onLogout }) {
  const items = isAdmin ? ADMIN_NAV : PARENT_NAV;
  const counts = {
    events: state.events?.filter(e => e.status === 'upcoming').length || 0,
    messages: state.messages?.length || 0,
    roster: (state.parents?.length || 0) + (state.guiders?.length || 0),
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">{state.group?.logoInitials}</div>
        <div className="brand-text">
          <div className="name">{state.group?.name}</div>
          <div className="sub">{state.group?.unit}</div>
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
        <button className="icon-btn" title="Sign out" onClick={onLogout}><IconLogOut size={15} /></button>
      </div>
    </aside>
  );
}

function TopNav({ state, isAdmin, page, navigate, currentPerson, onLogout }) {
  const items = isAdmin ? ADMIN_NAV : PARENT_NAV;
  return (
    <div className="topbar">
      <div className="brand">
        <div className="logo">{state.group?.logoInitials}</div>
        <div className="brand-text">
          <div className="name">{state.group?.name}</div>
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
        <button className="icon-btn" title="Sign out" onClick={onLogout}><IconLogOut size={15} /></button>
      </div>
    </div>
  );
}

function PageHeader({ page, selected, state, isAdmin, navigate, adminName }) {
  const titles = isAdmin ? {
    dashboard: { t: `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}${adminName ? ', ' + adminName : ''}`, s: "Here's what's happening across the unit this week." },
    events: { t: 'Events', s: 'Manage trips, camps and meetings. Assign families, set prices, track payments.' },
    roster: { t: 'Roster', s: 'Parents, children and fellow guiders.' },
    messages: { t: 'Messages', s: 'Conversations across all events.' },
    settings: { t: 'Group settings', s: 'Branding, notifications, user accounts and payment preferences.' },
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

// Admin-only: preview the app as a parent. Shown as a discreet banner.
function RoleSwitcher({ state, switchRole, realAdminId }) {
  const isAdmin = state.currentUser?.role === 'admin';
  const [showParents, setShowParents] = useStateA(false);
  const currentParent = state.parents?.find(p => p.id === state.currentUser?.id);

  return (
    <div className="role-switcher">
      <span className="label-sm">Preview as</span>
      <button className={isAdmin ? 'active' : ''} onClick={() => switchRole('admin', realAdminId)}>
        <IconCompass size={12} /> Admin
      </button>
      <div style={{ position: 'relative' }}>
        <button className={!isAdmin ? 'active' : ''} onClick={() => setShowParents(v => !v)}>
          <IconUsers size={12} /> {isAdmin ? 'Parent' : (currentParent?.name.split(' ')[0] || 'Parent')} <IconChevronDown size={10} />
        </button>
        {showParents && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', boxShadow: 'var(--sh-md)', minWidth: 220, padding: 4, zIndex: 100 }}>
            {state.parents?.map(p => (
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

// ── Login screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useStateA('');
  const [password, setPassword] = useStateA('');
  const [error, setError] = useStateA('');
  const [loading, setLoading] = useStateA(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      onLogin(data);
    } catch (e) {
      setError('Could not connect to server. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--cream-50)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'var(--font-body)',
    }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
            background: 'linear-gradient(145deg, var(--brand-500), var(--brand-700))',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
            boxShadow: 'var(--sh-md)',
          }}>GG</div>
          <h1 style={{ fontSize: 26, marginBottom: 6 }}>Meadowlark</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Sign in to your account</p>
        </div>

        <form onSubmit={submit} style={{
          background: 'var(--bg-raised)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)', padding: 28, boxShadow: 'var(--sh-md)',
        }}>
          {error && (
            <div style={{
              background: 'var(--terra-100)', border: '1px solid var(--terra-200)',
              color: 'var(--terra-700)', borderRadius: 'var(--r-md)',
              padding: '10px 14px', fontSize: 14, marginBottom: 16,
            }}>{error}</div>
          )}
          <div className="field-row" style={{ marginBottom: 16 }}>
            <label className="label">Email address</label>
            <input
              className="input" type="email" value={email} autoFocus required
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="field-row" style={{ marginBottom: 20 }}>
            <label className="label">Password</label>
            <input
              className="input" type="password" value={password} required
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            className="btn primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '10px 16px' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
          Contact your group admin if you need access.
        </p>
      </div>
    </div>
  );
}

// ── Root — manages auth state and bootstraps the app ─────────────────────────

function Root() {
  const [authUser, setAuthUser] = useStateA(null);
  const [appState, setAppState] = useStateA(null);
  const [status, setStatus] = useStateA('loading'); // loading | login | ready

  const boot = async (user) => {
    try {
      window.__currentUserRole = user.role;
      const state = await fetchState();
      setAuthUser(user);
      setAppState(state);
      setStatus('ready');
    } catch (e) {
      setStatus('login');
    }
  };

  useEffectA(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(user => {
        if (user) boot(user);
        else setStatus('login');
      })
      .catch(() => setStatus('login'));
  }, []);

  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 16,
        fontFamily: 'var(--font-body)', color: 'var(--text-muted)',
        background: 'var(--cream-50)',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(145deg, var(--brand-500), var(--brand-700))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
        }}>GG</div>
        <div style={{ fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (status === 'login') {
    return <LoginScreen onLogin={(user) => boot(user)} />;
  }

  return (
    <App
      initialState={appState}
      authUser={authUser}
      onLogout={() => { setAuthUser(null); setAppState(null); setStatus('login'); }}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
