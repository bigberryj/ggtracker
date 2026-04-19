// Shared Calendar component used by both admin and parent views
const { useState: useStateCal, useMemo: useMemoCal } = React;

function MonthCalendar({ events, payments, onOpen, mode = 'parent' }) {
  // mode: 'parent' (shows balance/status chips) or 'admin' (shows paid-fraction)
  const [cursor, setCursor] = useStateCal(() => new Date('2026-04-18T00:00:00'));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Build 6 weeks grid
  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ day: prevMonthDays - startWeekday + 1 + i, other: true, date: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ day: d, other: false, date: dateStr });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) cells.push({ day: cells.length - daysInMonth - startWeekday + 1, other: true, date: null });

  const eventsByDate = useMemoCal(() => {
    const m = {};
    events.forEach(ev => {
      const start = ev.date;
      const end = ev.endDate || ev.date;
      let cur = new Date(start + 'T00:00:00');
      const last = new Date(end + 'T00:00:00');
      while (cur <= last) {
        const key = cur.toISOString().slice(0, 10);
        (m[key] = m[key] || []).push(ev);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return m;
  }, [events]);

  const today = '2026-04-18';
  const monthEvents = events.filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getFullYear() === year && d.getMonth() === month;
  }).sort((a,b) => a.date.localeCompare(b.date));

  const eventTone = (ev) => ev.color === 'honey' ? { bg: 'var(--honey-100)', fg: 'var(--honey-700)', bar: 'var(--honey-500)' }
    : ev.color === 'terracotta' ? { bg: 'var(--terra-100)', fg: 'var(--terra-700)', bar: 'var(--terra-500)' }
    : { bg: 'var(--brand-100)', fg: 'var(--brand-800)', bar: 'var(--brand-600)' };

  return (
    <div className="stack gap-4">
      <div className="card flush" style={{ overflow: 'hidden' }}>
        <div className="card-header">
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <button className="icon-btn" onClick={() => setCursor(new Date(year, month - 1, 1))}><IconChevronLeft size={18}/></button>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, minWidth: 180, textAlign: 'center' }}>{monthLabel}</h3>
            <button className="icon-btn" onClick={() => setCursor(new Date(year, month + 1, 1))}><IconChevronRight size={18}/></button>
          </div>
          <div className="row gap-2">
            <button className="btn sm" onClick={() => printCalendar(year, month, events, { title: mode === 'admin' ? 'All events' : 'My events', payments, mode })}><IconPrinter size={13}/> Print</button>
            <button className="btn sm" onClick={() => setCursor(new Date('2026-04-18T00:00:00'))}>Today</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid var(--border)' }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', background: 'var(--cream-50)' }}>{d}</div>
          ))}
          {cells.map((c, i) => {
            const isToday = c.date === today;
            const dayEvents = c.date ? (eventsByDate[c.date] || []) : [];
            return (
              <div key={i} style={{
                minHeight: 104,
                padding: 6,
                borderBottom: '1px solid var(--border)',
                borderRight: (i % 7 === 6) ? 0 : '1px solid var(--border)',
                background: c.other ? 'var(--cream-50)' : 'var(--bg-raised)',
                opacity: c.other ? 0.45 : 1,
                display: 'flex', flexDirection: 'column', gap: 3
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 600,
                  color: isToday ? 'var(--cream-50)' : 'var(--ink-700)',
                  background: isToday ? 'var(--brand-700)' : 'transparent',
                  width: 22, height: 22, borderRadius: '50%',
                  display: 'grid', placeItems: 'center',
                  alignSelf: 'flex-start',
                  marginBottom: 2,
                }}>{c.day}</div>
                {dayEvents.slice(0, 3).map(ev => {
                  const tone = eventTone(ev);
                  let badge = null;
                  if (mode === 'parent' && payments) {
                    const myP = payments.filter(p => p.eventId === ev.id);
                    const owe = myP.reduce((s,p) => s + (p.amount - p.paid), 0);
                    if (owe > 0) badge = <span className="num" style={{ fontSize: 10, fontWeight: 700 }}>${owe}</span>;
                    else if (myP.length > 0) badge = <IconCheck size={10} />;
                  } else if (mode === 'admin' && payments) {
                    const ps = payments.filter(p => p.eventId === ev.id);
                    if (ps.length > 0) {
                      const paid = ps.filter(p => p.status === 'fully-paid').length;
                      badge = <span style={{ fontSize: 10, fontWeight: 700 }}>{paid}/{ps.length}</span>;
                    }
                  }
                  return (
                    <button key={ev.id} onClick={() => onOpen(ev.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '3px 6px',
                        background: tone.bg,
                        color: tone.fg,
                        borderLeft: `3px solid ${tone.bar}`,
                        borderRadius: 4,
                        fontSize: 11, fontWeight: 600,
                        border: 0, cursor: 'pointer', textAlign: 'left',
                        fontFamily: 'inherit',
                        minWidth: 0,
                      }}>
                      <span className="truncate" style={{ flex: 1, minWidth: 0 }}>{ev.title}</span>
                      {badge}
                    </button>
                  );
                })}
                {dayEvents.length > 3 && <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '0 6px' }}>+{dayEvents.length - 3} more</div>}
              </div>
            );
          })}
        </div>
      </div>

      {monthEvents.length > 0 && (
        <div className="card flush">
          <div className="card-header"><h3>Events in {cursor.toLocaleDateString('en-CA', {month:'long'})}</h3></div>
          <div className="stack">
            {monthEvents.map(ev => {
              const tone = eventTone(ev);
              return (
                <div key={ev.id} onClick={() => onOpen(ev.id)} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '46px 1fr auto', gap: 14, alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ textAlign: 'center', padding: '4px 0', background: tone.bg, color: tone.fg, borderRadius: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase' }}>{new Date(ev.date+'T00:00:00').toLocaleDateString('en-CA',{month:'short'})}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, lineHeight: 1 }}>{new Date(ev.date+'T00:00:00').getDate()}</div>
                  </div>
                  <div><div style={{ fontWeight: 600 }}>{ev.title}</div><div className="muted" style={{ fontSize: 12 }}>{ev.location}</div></div>
                  <IconChevronRight size={16} style={{ color: 'var(--ink-400)' }}/>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ParentCalendar({ events, payments, onOpen }) {
  return <MonthCalendar events={events} payments={payments} onOpen={onOpen} mode="parent" />;
}

Object.assign(window, { MonthCalendar, ParentCalendar });
