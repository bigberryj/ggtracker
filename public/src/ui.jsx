// Shared primitives: Modal, Toast, Avatar helpers, EventStatus

const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;

// --- Toast context ---
const ToastCtx = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (msg, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, ...opts }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), opts.duration || 2800);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-host">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <IconCheck size={14} /> {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => useContext(ToastCtx);

// --- Modal ---
function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`} role="dialog" aria-modal="true">
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="icon-btn" onClick={onClose} aria-label="Close"><IconX /></button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// --- Avatar helper ---
function Avatar({ name, initials, size = 'md', tone = 'brand' }) {
  const ini = initials || (name ? name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() : '?');
  const cls = `avatar ${size !== 'md' ? size : ''} ${tone === 'brand' ? '' : tone}`;
  return <div className={cls}>{ini}</div>;
}

// --- Payment status chip ---
function StatusChip({ status, size = 'md' }) {
  const meta = paymentStatusMeta(status);
  return (
    <span className={`chip ${meta.color}`}>
      <span className="dot" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

// --- EventCard visual ---
function EventCard({ event, onClick, stats }) {
  const d = new Date(event.date + 'T00:00:00');
  const monthShort = d.toLocaleDateString('en-CA', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  const du = daysUntil(event.date);
  return (
    <div className="event-card" data-color={event.color || 'sage'} onClick={onClick}>
      <div className="event-date-strip">
        <span>{monthShort} {day}{event.endDate ? '–'+new Date(event.endDate+'T00:00:00').getDate() : ''} · {d.getFullYear()}</span>
        {du != null && du >= 0 && du < 30 && <span>in {du} days</span>}
        {du != null && du < 0 && <span>past</span>}
      </div>
      <div className="event-body">
        <h3>{event.title}</h3>
        <div className="event-meta">
          <div className="row"><IconMapPin size={14} /> <span className="truncate">{event.location}</span></div>
          {event.price > 0 && <div className="row"><IconWallet size={14} /> ${event.price}{event.deposit ? ` · $${event.deposit} deposit` : ''}</div>}
        </div>
        {stats && (
          <div className="event-foot">
            {stats}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Detail sidebar / drawer ---
function Drawer({ open, onClose, children, width = 620 }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ padding: 0, alignItems: 'stretch', justifyContent: 'flex-end' }}>
      <div style={{ background: 'var(--bg-raised)', width, maxWidth: '100vw', height: '100vh', overflow: 'auto', boxShadow: 'var(--sh-lg)', animation: 'slide-in 180ms cubic-bezier(.2,.8,.2,1)' }}>
        {children}
      </div>
      <style>{`@keyframes slide-in { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}

Object.assign(window, {
  ToastProvider, useToast, Modal, Avatar, StatusChip, EventCard, Drawer,
});
