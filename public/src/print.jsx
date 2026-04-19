// Print helpers — open a fresh window, render tailored markup, print, close.

function printHtml(title, bodyHtml, opts = {}) {
  const { landscape = false } = opts;
  const w = window.open('', '_blank', 'width=1100,height=800');
  if (!w) { alert('Please allow popups to print.'); return; }
  w.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</title>
<style>
  @page { size: ${landscape ? 'letter landscape' : 'letter portrait'}; margin: ${landscape ? '0.4in' : '0.6in'}; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.45; }
  body { padding: ${landscape ? '0' : '0'}; }
  h1 { font-size: 22pt; font-weight: 600; margin: 0 0 4pt; letter-spacing: -0.01em; }
  h2 { font-size: 14pt; font-weight: 600; margin: 18pt 0 6pt; border-bottom: 1px solid #ddd; padding-bottom: 4pt; }
  h3 { font-size: 11pt; font-weight: 600; margin: 10pt 0 4pt; text-transform: uppercase; letter-spacing: 0.06em; color: #666; }
  p { margin: 0 0 6pt; }
  .muted { color: #666; }
  .row { display: flex; gap: 18pt; flex-wrap: wrap; }
  .meta { display: flex; gap: 20pt; flex-wrap: wrap; font-size: 10.5pt; color: #555; margin-top: 4pt; }
  .header-band { border-bottom: 2px solid #2d4a3a; padding-bottom: 10pt; margin-bottom: 14pt; display: flex; justify-content: space-between; align-items: flex-end; }
  .brand { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.08em; color: #888; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  th, td { text-align: left; padding: 6pt 8pt; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  th { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.05em; color: #666; border-bottom: 1.5px solid #bbb; font-weight: 600; }
  .num { font-variant-numeric: tabular-nums; }
  .r { text-align: right; }
  .chip { display: inline-block; padding: 1pt 6pt; border-radius: 3pt; font-size: 9pt; font-weight: 500; background: #f0f0f0; color: #333; }
  .chip.paid { background: #d9e8dd; color: #2d5a3d; }
  .chip.partial { background: #fce8c6; color: #7a5200; }
  .chip.unpaid { background: #f5e0d9; color: #8a3520; }
  .box { border: 1px solid #ddd; border-radius: 4pt; padding: 10pt 12pt; margin-bottom: 8pt; }
  ul { margin: 4pt 0 6pt 16pt; padding: 0; }
  li { margin-bottom: 2pt; }
  .footer { margin-top: 18pt; padding-top: 8pt; border-top: 1px solid #ddd; font-size: 8.5pt; color: #888; display: flex; justify-content: space-between; }

  /* --- calendar --- */
  .cal { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .cal th { text-align: center; font-size: 9pt; padding: 4pt; border: 1px solid #ccc; background: #f4f2ed; }
  .cal td { border: 1px solid #ccc; vertical-align: top; height: 1.05in; padding: 3pt 4pt; }
  .cal td.other { background: #fafaf7; color: #aaa; }
  .cal .daynum { font-weight: 600; font-size: 10pt; }
  .cal .ev { display: block; font-size: 8pt; padding: 1.5pt 4pt; border-radius: 2pt; margin-top: 2pt; background: #e8f0e8; border-left: 3px solid #5a8a6a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cal .ev.honey { background: #fcefd0; border-left-color: #c9922e; }
  .cal .ev.terracotta { background: #f5dfd4; border-left-color: #b35a3b; }
  .cal .more { font-size: 8pt; color: #888; }
</style>
</head>
<body>
${bodyHtml}
<script>
  window.onload = () => { setTimeout(() => { window.focus(); window.print(); }, 120); };
  window.onafterprint = () => window.close();
</script>
</body>
</html>`);
  w.document.close();
}

function esc(s) { return String(s ?? '').replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])); }
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// --- Event printout (admin view) ---
function printEventAdmin(event, state) {
  const payments = state.payments.filter(p => p.eventId === event.id);
  const collected = payments.reduce((s,p) => s+p.paid, 0);
  const total = payments.reduce((s,p) => s+p.amount, 0);
  const guiders = (event.assignedGuiders || []).map(id => state.guiders.find(g => g.id === id)).filter(Boolean);

  const rows = payments.map(p => {
    const parent = state.parents.find(pa => pa.id === p.parentId);
    const child = parent?.children.find(c => c.id === p.childId);
    const chipCls = p.status === 'fully-paid' ? 'paid' : p.status === 'partial' || p.status === 'deposit-paid' ? 'partial' : 'unpaid';
    return `<tr>
      <td>${esc(parent?.name || '—')}</td>
      <td>${esc(child?.name || '—')}</td>
      <td class="num r">$${p.amount}</td>
      <td class="num r">$${p.paid}</td>
      <td class="num r">$${p.amount - p.paid}</td>
      <td><span class="chip ${chipCls}">${esc((p.status || '').replace('-', ' '))}</span></td>
      <td>${esc(p.rsvp || '—')}</td>
    </tr>`;
  }).join('');

  const body = `
    <div class="header-band">
      <div>
        <div class="brand">${esc(state.group?.name || 'Girl Guides')} · Event summary</div>
        <h1>${esc(event.title)}</h1>
        <div class="meta">
          <span>📅 ${esc(fmtDate(event.date))}${event.endDate ? ' – ' + esc(fmtDate(event.endDate)) : ''}</span>
          <span>📍 ${esc(event.location || '—')}</span>
          ${event.price > 0 ? `<span>💰 $${event.price}${event.deposit ? ' ($' + event.deposit + ' deposit)' : ''}</span>` : '<span>Free</span>'}
          <span>👥 ${event.assigned.length} families</span>
        </div>
      </div>
      <div class="num r" style="text-align:right">
        <div style="font-size:9pt;color:#888;text-transform:uppercase;letter-spacing:.06em">Collected</div>
        <div style="font-size:20pt;font-weight:600">$${collected} <span style="color:#aaa;font-size:12pt;font-weight:400">/ $${total}</span></div>
      </div>
    </div>

    ${event.description ? `<h2>Description</h2><p>${esc(event.description)}</p>` : ''}

    <div class="row">
      ${event.depositDue ? `<div><h3>Deposit due</h3><p>${esc(fmtDate(event.depositDue))}</p></div>` : ''}
      ${event.balanceDue ? `<div><h3>Balance due</h3><p>${esc(fmtDate(event.balanceDue))}</p></div>` : ''}
      ${guiders.length ? `<div><h3>Guiders</h3><p>${guiders.map(g => esc(g.name)).join(', ')}</p></div>` : ''}
    </div>

    ${event.packingList?.length ? `<h2>Packing list</h2><ul>${event.packingList.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${event.docs?.length ? `<h2>Documents</h2><ul>${event.docs.map(d => `<li>${esc(d.name)} ${d.public ? '<span class="chip">public</span>' : '<span class="chip">admin</span>'}</li>`).join('')}</ul>` : ''}

    <h2>Payments by family</h2>
    <table>
      <thead><tr><th>Family</th><th>Child</th><th class="r">Amount</th><th class="r">Paid</th><th class="r">Owing</th><th>Status</th><th>RSVP</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7" class="muted">No families assigned yet.</td></tr>'}</tbody>
    </table>

    <div class="footer">
      <span>${esc(state.group?.name || '')} · ${esc(state.group?.unit || '')}</span>
      <span>Printed ${new Date().toLocaleDateString('en-CA', { year:'numeric', month:'short', day:'numeric' })}</span>
    </div>
  `;
  printHtml(`${event.title} — Event summary`, body);
}

// --- Event printout (parent view) ---
function printEventParent(event, me, state) {
  const myP = state.payments.filter(p => p.parentId === me.id && p.eventId === event.id);
  const publicDocs = (event.docs || []).filter(d => d.public);
  const owing = myP.reduce((s,p) => s+(p.amount - p.paid), 0);
  const paid = myP.reduce((s,p) => s+p.paid, 0);
  const totalAmt = myP.reduce((s,p) => s+p.amount, 0);

  const payRows = myP.map(p => {
    const child = me.children.find(c => c.id === p.childId);
    const chipCls = p.status === 'fully-paid' ? 'paid' : p.status === 'partial' || p.status === 'deposit-paid' ? 'partial' : 'unpaid';
    return `<tr>
      <td>${esc(child?.name || '—')}</td>
      <td class="num r">$${p.amount}</td>
      <td class="num r">$${p.paid}</td>
      <td class="num r">$${p.amount - p.paid}</td>
      <td><span class="chip ${chipCls}">${esc((p.status || '').replace('-', ' '))}</span></td>
      <td>${p.paidDate ? esc(fmtDate(p.paidDate)) : '—'}</td>
    </tr>`;
  }).join('');

  const body = `
    <div class="header-band">
      <div>
        <div class="brand">${esc(state.group?.name || 'Girl Guides')} · Event details</div>
        <h1>${esc(event.title)}</h1>
        <div class="meta">
          <span>📅 ${esc(fmtDate(event.date))}${event.endDate ? ' – ' + esc(fmtDate(event.endDate)) : ''}</span>
          <span>📍 ${esc(event.location || '—')}</span>
          ${event.price > 0 ? `<span>💰 $${event.price}</span>` : '<span>Free</span>'}
        </div>
      </div>
      ${totalAmt > 0 ? `<div class="num r" style="text-align:right">
        <div style="font-size:9pt;color:#888;text-transform:uppercase;letter-spacing:.06em">Your balance</div>
        <div style="font-size:20pt;font-weight:600">${owing === 0 ? '<span style="color:#2d5a3d">Paid in full</span>' : '$' + owing + ' <span style="color:#aaa;font-size:12pt;font-weight:400">of $' + totalAmt + '</span>'}</div>
      </div>` : ''}
    </div>

    ${event.description ? `<h2>About this event</h2><p>${esc(event.description)}</p>` : ''}

    <div class="row">
      ${event.depositDue ? `<div><h3>Deposit due</h3><p>${esc(fmtDate(event.depositDue))}</p></div>` : ''}
      ${event.balanceDue ? `<div><h3>Balance due</h3><p>${esc(fmtDate(event.balanceDue))}</p></div>` : ''}
      ${event.directions ? `<div style="flex:1;min-width:200pt"><h3>Directions</h3><p>${esc(event.directions)}</p></div>` : ''}
    </div>

    ${event.packingList?.length ? `<h2>What to bring</h2><ul>${event.packingList.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${publicDocs.length ? `<h2>Documents</h2><ul>${publicDocs.map(d => `<li>${esc(d.name)}</li>`).join('')}</ul>` : ''}

    ${myP.length ? `<h2>Your payment details</h2>
    <table>
      <thead><tr><th>Child</th><th class="r">Amount</th><th class="r">Paid</th><th class="r">Owing</th><th>Status</th><th>Last payment</th></tr></thead>
      <tbody>${payRows}</tbody>
    </table>` : ''}

    <div class="footer">
      <span>${esc(me.name)} · ${esc(state.group?.name || '')}</span>
      <span>Printed ${new Date().toLocaleDateString('en-CA', { year:'numeric', month:'short', day:'numeric' })}</span>
    </div>
  `;
  printHtml(`${event.title} — Details`, body);
}

// --- Calendar printout (landscape, 1 page) ---
function printCalendar(year, month, events, options = {}) {
  // options: { title, subtitle, payments, mode: 'parent' | 'admin', me }
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ day: prevMonthDays - startWeekday + 1 + i, other: true, date: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ day: d, other: false, date: dateStr });
  }
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - startWeekday + 1, other: true, date: null });

  const eventsByDate = {};
  events.forEach(ev => {
    const start = ev.date;
    const end = ev.endDate || ev.date;
    let cur = new Date(start + 'T00:00:00');
    const last = new Date(end + 'T00:00:00');
    while (cur <= last) {
      const key = cur.toISOString().slice(0,10);
      (eventsByDate[key] = eventsByDate[key] || []).push(ev);
      cur.setDate(cur.getDate() + 1);
    }
  });

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Pick how many events fit per cell (landscape letter with 6 rows is generous)
  const rowCount = cells.length / 7;
  const evPerCell = rowCount === 6 ? 3 : 4;

  const cellHtml = cells.map((c, i) => {
    const dayEvents = c.date ? (eventsByDate[c.date] || []) : [];
    const evHtml = dayEvents.slice(0, evPerCell).map(ev => {
      const cls = ev.color === 'honey' ? 'honey' : ev.color === 'terracotta' ? 'terracotta' : '';
      return `<span class="ev ${cls}">${esc(ev.title)}</span>`;
    }).join('');
    const moreHtml = dayEvents.length > evPerCell ? `<span class="more">+${dayEvents.length - evPerCell} more</span>` : '';
    return `<td class="${c.other ? 'other' : ''}"><div class="daynum">${c.day}</div>${evHtml}${moreHtml}</td>`;
  }).join('');

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push('<tr>' + Array.from({length:7}, (_, j) => {
      const c = cells[i+j];
      const dayEvents = c.date ? (eventsByDate[c.date] || []) : [];
      const evHtml = dayEvents.slice(0, evPerCell).map(ev => {
        const cls = ev.color === 'honey' ? 'honey' : ev.color === 'terracotta' ? 'terracotta' : '';
        return `<span class="ev ${cls}">${esc(ev.title)}</span>`;
      }).join('');
      const moreHtml = dayEvents.length > evPerCell ? `<span class="more">+${dayEvents.length - evPerCell} more</span>` : '';
      return `<td class="${c.other ? 'other' : ''}"><div class="daynum">${c.day}</div>${evHtml}${moreHtml}</td>`;
    }).join('') + '</tr>');
  }

  const body = `
    <div class="header-band" style="padding-bottom:6pt;margin-bottom:8pt">
      <div>
        <div class="brand">${esc(options.title || 'Calendar')}</div>
        <h1 style="font-size:18pt">${esc(monthLabel)}</h1>
      </div>
      <div class="muted" style="font-size:9pt">${options.subtitle ? esc(options.subtitle) + ' · ' : ''}Printed ${new Date().toLocaleDateString('en-CA', { year:'numeric', month:'short', day:'numeric' })}</div>
    </div>
    <table class="cal">
      <thead><tr>${weekdays.map(d => `<th>${d}</th>`).join('')}</tr></thead>
      <tbody>${weeks.join('')}</tbody>
    </table>
  `;
  printHtml(`${monthLabel} — Calendar`, body, { landscape: true });
}

Object.assign(window, { printEventAdmin, printEventParent, printCalendar });
