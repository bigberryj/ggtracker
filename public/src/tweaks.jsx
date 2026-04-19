// Tweaks panel + host integration
const { useState: useStateT, useEffect: useEffectT } = React;

const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "sage",
  "density": "comfortable",
  "eventLayout": "cards",
  "nav": "side",
  "parentView": "list",
  "typography": "grotesk"
}/*EDITMODE-END*/;

const ACCENTS = [
  { id: 'sage',       label: 'Sage',       color: 'oklch(0.46 0.085 156)' },
  { id: 'teal',       label: 'Teal',       color: 'oklch(0.46 0.1 206)' },
  { id: 'terracotta', label: 'Terracotta', color: 'oklch(0.55 0.13 30)' },
  { id: 'navy',       label: 'Navy',       color: 'oklch(0.38 0.1 258)' },
];

function applyTweaks(t) {
  const root = document.documentElement;
  root.setAttribute('data-accent', t.accent);
  root.setAttribute('data-density', t.density);
  root.setAttribute('data-type', t.typography);
}

function TweaksPanel({ tweaks, setTweaks, visible, onClose }) {
  if (!visible) return null;
  const update = (key, value) => {
    const next = { ...tweaks, [key]: value };
    setTweaks(next);
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: value } }, '*'); } catch(e){}
  };
  return (
    <div className="tweaks-panel">
      <header>
        <h3>Tweaks</h3>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><IconX size={16} /></button>
      </header>
      <div className="tweaks-body">
        <div className="tweak-row">
          <div className="label">Accent</div>
          <div className="swatch-row">
            {ACCENTS.map(a => (
              <button
                key={a.id}
                className={`swatch ${tweaks.accent === a.id ? 'active' : ''}`}
                style={{ background: a.color }}
                title={a.label}
                onClick={() => update('accent', a.id)}
              />
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <div className="label">Density</div>
          <div className="tweak-options">
            {['comfortable','dense'].map(v => (
              <button key={v} className={`tweak-btn ${tweaks.density === v ? 'active' : ''}`} onClick={() => update('density', v)}>{v[0].toUpperCase()+v.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <div className="label">Typography</div>
          <div className="tweak-options">
            {[{id:'grotesk',label:'Grotesk'},{id:'serif',label:'Serif'},{id:'mono-accent',label:'Mono'}].map(v => (
              <button key={v.id} className={`tweak-btn ${tweaks.typography === v.id ? 'active' : ''}`} onClick={() => update('typography', v.id)}>{v.label}</button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <div className="label">Navigation</div>
          <div className="tweak-options">
            <button className={`tweak-btn ${tweaks.nav === 'side' ? 'active' : ''}`} onClick={() => update('nav', 'side')}>Sidebar</button>
            <button className={`tweak-btn ${tweaks.nav === 'top' ? 'active' : ''}`} onClick={() => update('nav', 'top')}>Top bar</button>
          </div>
        </div>
        <div className="tweak-row">
          <div className="label">Event list (admin)</div>
          <div className="tweak-options">
            <button className={`tweak-btn ${tweaks.eventLayout === 'cards' ? 'active' : ''}`} onClick={() => update('eventLayout', 'cards')}>Cards</button>
            <button className={`tweak-btn ${tweaks.eventLayout === 'table' ? 'active' : ''}`} onClick={() => update('eventLayout', 'table')}>Table</button>
          </div>
        </div>
        <div className="tweak-row">
          <div className="label">Parent portal</div>
          <div className="tweak-options">
            <button className={`tweak-btn ${tweaks.parentView === 'list' ? 'active' : ''}`} onClick={() => update('parentView', 'list')}>List</button>
            <button className={`tweak-btn ${tweaks.parentView === 'timeline' ? 'active' : ''}`} onClick={() => update('parentView', 'timeline')}>Timeline</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function useTweaks() {
  const [tweaks, setTweaks] = useStateT(() => {
    try {
      const saved = localStorage.getItem('gg_tweaks');
      if (saved) return { ...DEFAULT_TWEAKS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_TWEAKS;
  });
  const [visible, setVisible] = useStateT(false);

  useEffectT(() => { applyTweaks(tweaks); try { localStorage.setItem('gg_tweaks', JSON.stringify(tweaks)); } catch(e){} }, [tweaks]);

  useEffectT(() => {
    const onMsg = (e) => {
      const d = e.data;
      if (!d) return;
      if (d.type === '__activate_edit_mode') setVisible(true);
      if (d.type === '__deactivate_edit_mode') setVisible(false);
    };
    window.addEventListener('message', onMsg);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch(e){}
    return () => window.removeEventListener('message', onMsg);
  }, []);

  return { tweaks, setTweaks, visible, setVisible };
}

Object.assign(window, { TweaksPanel, useTweaks, applyTweaks, ACCENTS });
