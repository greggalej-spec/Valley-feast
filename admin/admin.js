/* ============================================================
   Valley Feast — Staff Studio
   Menu manager · Flyer studio · Printed menu · Invoices · Settings
   ============================================================ */

(function () {
  let state = VFStore.load();
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 2400);
  }

  function persist(msg) {
    VFStore.save(state);
    renderMenu();
    fillDishSelects();
    if (msg) toast(msg);
  }

  const money = v => VFStore.money(v, state.settings);

  /* ============================================================
     View switching
     ============================================================ */
  $$('.adm-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.adm-nav button').forEach(b => b.classList.toggle('is-active', b === btn));
      $$('.adm-view').forEach(v => v.classList.remove('is-active'));
      $('#view-' + btn.dataset.view).classList.add('is-active');
      if (btn.dataset.view === 'flyer') drawFlyer();
      if (btn.dataset.view === 'print') renderMenuDoc();
      if (btn.dataset.view === 'invoices') { renderInvoiceDoc(); renderSavedInvoices(); }
      if (btn.dataset.view === 'settings') renderSettings();
    });
  });

  /* ============================================================
     Publish / reset
     ============================================================ */
  $('#publishBtn').addEventListener('click', () => {
    const { body, version } = VFStore.exportFile(state);
    const blob = new Blob([body], { type: 'text/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'menu-data.js';
    a.click();
    URL.revokeObjectURL(a.href);
    state.version = version;
    VFStore.save(state);
    toast('Downloaded menu-data.js (v' + version + ') — replace data/menu-data.js to publish');
  });

  $('#resetDraft').addEventListener('click', () => {
    if (!confirm('Throw away all local edits and go back to the published menu?')) return;
    VFStore.reset();
    state = VFStore.load();
    renderMenu(); fillDishSelects(); renderSettings();
    toast('Back to the published menu');
  });

  /* ============================================================
     Menu manager
     ============================================================ */
  let activeCat = 'all';
  let editingId = null;   /* item id being edited, or '__new__' */

  function catName(id) { return (state.categories.find(c => c.id === id) || {}).name || id; }

  function renderPills() {
    const pills = [{ id: 'all', name: 'Everything' }, ...VFStore.sortedCategories(state)];
    $('#catPills').innerHTML = pills.map(c =>
      `<button data-cat="${esc(c.id)}" class="${c.id === activeCat ? 'is-active' : ''}">${esc(c.name)}</button>`).join('');
    $$('#catPills button').forEach(b => b.addEventListener('click', () => {
      activeCat = b.dataset.cat; editingId = null; renderMenu();
    }));
  }

  const TAGS = ['veg', 'spicy', 'seafood', 'popular'];
  const chipCls = { veg: 'chip--veg', spicy: 'chip--spicy', seafood: 'chip--seafood', popular: 'chip--popular' };
  const chipLabel = { veg: 'veg', spicy: 'pepper', seafood: 'seafood', popular: 'favourite' };

  function editorHTML(item) {
    const i = item || { name: '', price: null, desc: '', category: activeCat === 'all' ? (state.categories[0] || {}).id : activeCat, tags: [], available: true };
    return `
    <div class="item-editor" data-editor>
      <div class="grid3">
        <div class="field"><label>Dish name</label><input data-f="name" value="${esc(i.name)}" placeholder="Curried duck"></div>
        <div class="field"><label>Price (${esc(state.settings.currency || '$')}) — empty = priced daily</label><input data-f="price" inputmode="decimal" value="${i.price ?? ''}" placeholder="30"></div>
        <div class="field"><label>Category</label>
          <select data-f="category">${VFStore.sortedCategories(state).map(c =>
            `<option value="${esc(c.id)}" ${c.id === i.category ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field"><label>Description</label><textarea data-f="desc" rows="2" placeholder="One appetising line.">${esc(i.desc || '')}</textarea></div>
      <div class="tag-checks">
        ${TAGS.map(t => `<label><input type="checkbox" data-tag="${t}" ${(i.tags || []).includes(t) ? 'checked' : ''}> ${chipLabel[t]}</label>`).join('')}
      </div>
      <div class="item-editor__actions">
        <button class="btn btn--ghost" data-act="cancel">Cancel</button>
        <button class="btn" data-act="save">Save dish</button>
      </div>
    </div>`;
  }

  function rowHTML(i) {
    const priceHtml = i.price != null
      ? `<span class="item-row__price">${money(i.price)}</span>`
      : `<span class="item-row__price is-daily">priced daily</span>`;
    return `
    <li class="item-row ${i.available === false ? 'is-off' : ''}" draggable="true" data-id="${esc(i.id)}">
      <span class="grip" title="Drag to reorder">
        <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor"><circle cx="4" cy="4" r="1.6"/><circle cx="10" cy="4" r="1.6"/><circle cx="4" cy="9" r="1.6"/><circle cx="10" cy="9" r="1.6"/><circle cx="4" cy="14" r="1.6"/><circle cx="10" cy="14" r="1.6"/></svg>
      </span>
      <div class="item-row__info">
        <div class="item-row__name">${esc(i.name)}
          ${activeCat === 'all' ? `<span class="chip" style="background:var(--green-mist); color:var(--green-mid)">${esc(catName(i.category))}</span>` : ''}
          ${(i.tags || []).map(t => `<span class="chip ${chipCls[t]}">${chipLabel[t]}</span>`).join('')}
        </div>
        ${i.desc ? `<div class="item-row__desc">${esc(i.desc)}</div>` : ''}
      </div>
      ${priceHtml}
      <label class="switch" title="${i.available === false ? 'Off the menu' : 'On the menu'}">
        <input type="checkbox" data-avail ${i.available === false ? '' : 'checked'}>
        <span class="track"></span>
      </label>
      <div class="row-actions">
        <button class="icon-btn" data-edit title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 20h4L20 8l-4-4L4 16v4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
        </button>
        <button class="icon-btn icon-btn--danger" data-del title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </li>`;
  }

  function visibleItems() {
    const items = activeCat === 'all'
      ? [...state.items].sort((a, b) => a.category.localeCompare(b.category) || (a.order || 0) - (b.order || 0))
      : state.items.filter(i => i.category === activeCat).sort((a, b) => (a.order || 0) - (b.order || 0));
    return items;
  }

  function renderMenu() {
    renderPills();
    const list = $('#itemList');
    let html = '';
    if (editingId === '__new__') html += `<li style="display:block">${editorHTML(null)}</li>`;
    for (const i of visibleItems()) {
      if (editingId === i.id) html += `<li style="display:block">${editorHTML(i)}</li>`;
      else html += rowHTML(i);
    }
    if (!html) html = `<li style="padding: var(--sp-xl); color: var(--ink-faint)">Nothing here yet — add your first dish.</li>`;
    list.innerHTML = html;
    wireRows();
    renderCatManager();
  }

  function wireRows() {
    const list = $('#itemList');

    $$('[data-editor]', list).forEach(ed => {
      ed.querySelector('[data-act="cancel"]').addEventListener('click', () => { editingId = null; renderMenu(); });
      ed.querySelector('[data-act="save"]').addEventListener('click', () => {
        const get = f => ed.querySelector(`[data-f="${f}"]`).value.trim();
        const name = get('name');
        if (!name) { toast('Give the dish a name'); return; }
        const priceRaw = get('price').replace(/[^\d.]/g, '');
        const price = priceRaw === '' ? null : Number(priceRaw);
        const tags = TAGS.filter(t => ed.querySelector(`[data-tag="${t}"]`).checked);
        const cat = get('category');
        if (editingId === '__new__') {
          const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('dish-' + Date.now());
          const order = Math.max(0, ...state.items.filter(i => i.category === cat).map(i => i.order || 0)) + 1;
          state.items.push({ id: state.items.some(i => i.id === id) ? id + '-' + Date.now().toString(36) : id, category: cat, name, price, desc: get('desc'), tags, available: true, order });
        } else {
          const item = state.items.find(i => i.id === editingId);
          if (item) {
            if (item.category !== cat) item.order = Math.max(0, ...state.items.filter(i => i.category === cat).map(i => i.order || 0)) + 1;
            Object.assign(item, { name, price, desc: get('desc'), tags, category: cat });
          }
        }
        editingId = null;
        persist('Saved — live on this device');
      });
    });

    $$('.item-row', list).forEach(row => {
      const id = row.dataset.id;
      row.querySelector('[data-edit]').addEventListener('click', () => { editingId = id; renderMenu(); });
      row.querySelector('[data-del]').addEventListener('click', () => {
        const item = state.items.find(i => i.id === id);
        if (!confirm(`Delete “${item?.name}” from the menu?`)) return;
        state.items = state.items.filter(i => i.id !== id);
        persist('Deleted');
      });
      row.querySelector('[data-avail]').addEventListener('change', (e) => {
        const item = state.items.find(i => i.id === id);
        if (item) { item.available = e.target.checked; persist(e.target.checked ? 'Back on the menu' : 'Off the menu for now'); }
      });

      /* drag reorder (within the same category view) */
      row.addEventListener('dragstart', e => {
        row.classList.add('is-dragging');
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragend', () => row.classList.remove('is-dragging'));
      row.addEventListener('dragover', e => { e.preventDefault(); row.classList.add('is-dragover'); });
      row.addEventListener('dragleave', () => row.classList.remove('is-dragover'));
      row.addEventListener('drop', e => {
        e.preventDefault();
        row.classList.remove('is-dragover');
        const fromId = e.dataTransfer.getData('text/plain');
        if (!fromId || fromId === id) return;
        const from = state.items.find(i => i.id === fromId);
        const to = state.items.find(i => i.id === id);
        if (!from || !to || from.category !== to.category) { toast('Drag within one category (switch to its tab)'); return; }
        const siblings = state.items.filter(i => i.category === from.category).sort((a, b) => (a.order || 0) - (b.order || 0));
        const reordered = siblings.filter(i => i.id !== fromId);
        reordered.splice(reordered.findIndex(i => i.id === id), 0, from);
        reordered.forEach((i, idx) => i.order = idx + 1);
        persist('Reordered');
      });
    });
  }

  $('#addItemBtn').addEventListener('click', () => { editingId = '__new__'; renderMenu(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---- category manager ---- */
  function renderCatManager() {
    const cats = VFStore.sortedCategories(state);
    $('#catManager').innerHTML = cats.map((c, idx) => `
      <div class="cat-row" data-cat-id="${esc(c.id)}">
        <div class="ord">
          <button class="icon-btn" data-up ${idx === 0 ? 'disabled style="opacity:.25"' : ''} title="Move up"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 14l6-6 6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="icon-btn" data-down ${idx === cats.length - 1 ? 'disabled style="opacity:.25"' : ''} title="Move down"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 10l6 6 6-6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
        <input value="${esc(c.name)}" data-cname aria-label="Category name">
        <input class="cat-note" value="${esc(c.note || '')}" data-cnote placeholder="Tag-line shown under the section name" aria-label="Category note">
        <button class="icon-btn icon-btn--danger" data-cdel title="Delete category"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></button>
      </div>`).join('');

    $$('#catManager .cat-row').forEach(rowEl => {
      const cid = rowEl.dataset.catId;
      const cat = state.categories.find(c => c.id === cid);
      rowEl.querySelector('[data-cname]').addEventListener('change', e => { cat.name = e.target.value.trim() || cat.name; persist('Renamed'); });
      rowEl.querySelector('[data-cnote]').addEventListener('change', e => { cat.note = e.target.value.trim(); persist('Saved'); });
      rowEl.querySelector('[data-up]').addEventListener('click', () => moveCat(cid, -1));
      rowEl.querySelector('[data-down]').addEventListener('click', () => moveCat(cid, 1));
      rowEl.querySelector('[data-cdel]').addEventListener('click', () => {
        const count = state.items.filter(i => i.category === cid).length;
        if (count) { toast(`Move or delete its ${count} dishes first`); return; }
        if (!confirm(`Delete the “${cat.name}” category?`)) return;
        state.categories = state.categories.filter(c => c.id !== cid);
        if (activeCat === cid) activeCat = 'all';
        persist('Category deleted');
      });
    });
  }

  function moveCat(cid, dir) {
    const cats = VFStore.sortedCategories(state);
    const idx = cats.findIndex(c => c.id === cid);
    const swap = cats[idx + dir];
    if (!swap) return;
    const a = cats[idx].order; cats[idx].order = swap.order; swap.order = a;
    persist('Reordered');
  }

  $('#addCatBtn').addEventListener('click', () => {
    const name = prompt('Name for the new category?');
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('cat-' + Date.now());
    state.categories.push({ id, name: name.trim(), note: '', img: 'assets/img/hero-spread.jpg', order: Math.max(0, ...state.categories.map(c => c.order || 0)) + 1 });
    persist('Category added');
  });

  /* ============================================================
     Flyer studio
     ============================================================ */
  const PALETTES = [
    { name: 'Antilles Forest', bg: '#22402c', deep: '#16291d', cream: '#f0ecd9', accent: '#e9b949' },
    { name: 'Tropical Sun', bg: '#a34a17', deep: '#6e2f0c', cream: '#faf0dd', accent: '#f5d05e' },
    { name: 'Midnight Feast', bg: '#131f18', deep: '#0a120d', cream: '#e7e3d2', accent: '#d98b2b' }
  ];
  const BACKDROPS = ['flyer-bg', 'buss-up-shut', 'pelau', 'curry-crab', 'hero-spread', 'corn-soup', 'pholourie', 'catering-spread'];
  const flyer = { w: 1080, h: 1350, palette: 0, backdrop: 'flyer-bg' };
  const imgCache = {};

  function loadImg(src) {
    return imgCache[src] || (imgCache[src] = new Promise(res => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    }));
  }

  function emblemDataURI(color) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="${color}">
      <circle cx="50" cy="50" r="46" stroke-width="2"/><circle cx="50" cy="50" r="42.5" stroke-width="2"/>
      <path d="M9.5 60.5 L23 45 L32.5 33 L38 39.5 L52.5 19.5 L63 38 L69 32 L90.5 55" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="M45 33 l3.5 3.5 l3.5 -3.5 l3.5 3.5 l3.5 -3.5" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="M8.5 62.5 C 26 58, 46 63, 62 74 M91.5 62.5 C 74 58, 54 63, 38 74" stroke-width="2.1" stroke-linecap="round"/>
      <g transform="translate(48 66) rotate(-42)"><ellipse cx="0" cy="-17" rx="7.8" ry="10.6" stroke-width="2.6"/><path d="M0 -6.4 V 26.5" stroke-width="2.8" stroke-linecap="round"/></g>
      <g transform="translate(52.5 66) rotate(42)"><path d="M0 -5 L-7.4 -14.5 M0 -5 L7.4 -14.5" stroke-width="2.3" stroke-linecap="round"/><path d="M-7.4 -14.5 L-9.4 -25 M-2.5 -16 L-3.1 -27.5 M2.5 -16 L3.1 -27.5 M7.4 -14.5 L9.4 -25" stroke-width="2.1" stroke-linecap="round"/><path d="M0 -5 V 26.5" stroke-width="2.8" stroke-linecap="round"/></g>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function wrapText(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  async function drawFlyer() {
    const canvas = $('#flyerCanvas');
    canvas.width = flyer.w; canvas.height = flyer.h;
    const ctx = canvas.getContext('2d');
    const P = PALETTES[flyer.palette];
    const W = flyer.w, H = flyer.h;

    await document.fonts.load('400 90px "Young Serif"');
    await document.fonts.load('700 40px "Karla"');

    /* backdrop */
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, W, H);
    const photo = flyer.backdrop === 'none' ? null : await loadImg('../assets/img/' + flyer.backdrop + '.jpg');
    if (photo) {
      const scale = Math.max(W / photo.width, H / photo.height);
      const dw = photo.width * scale, dh = photo.height * scale;
      ctx.drawImage(photo, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }
    /* tint + legibility gradient */
    let g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, P.deep + 'e6');
    g.addColorStop(0.34, P.deep + '55');
    g.addColorStop(0.62, P.deep + '99');
    g.addColorStop(1, P.deep + 'f2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const isStory = H > 1600;
    let y = isStory ? 210 : 150;

    /* emblem */
    const emblem = await loadImg(emblemDataURI(P.cream));
    const esize = isStory ? 240 : 210;
    if (emblem) ctx.drawImage(emblem, cx - esize / 2, y - esize / 2, esize, esize);
    y += esize / 2 + 40;

    /* brand line */
    ctx.textAlign = 'center';
    ctx.fillStyle = P.cream;
    ctx.font = '400 52px "Young Serif"';
    ctx.fillText(state.settings.name || 'Valley Feast', cx, y);
    y += 34;
    ctx.font = '700 22px "Karla"';
    ctx.letterSpacing = '10px';
    ctx.fillStyle = P.accent;
    ctx.fillText(('KITCHEN & CATERING'), cx + 5, y);
    ctx.letterSpacing = '0px';

    /* kicker */
    y = isStory ? H * 0.46 : H * 0.5;
    const kicker = ($('#flyerKicker').value || "Today's Special").toUpperCase();
    ctx.font = '800 30px "Karla"';
    ctx.letterSpacing = '8px';
    ctx.fillStyle = P.accent;
    ctx.fillText(kicker, cx + 4, y);
    ctx.letterSpacing = '0px';
    y += 30;

    /* dish name */
    const name = $('#flyerName').value || 'Pick a dish';
    ctx.fillStyle = P.cream;
    let size = isStory ? 96 : 84;
    ctx.font = `400 ${size}px "Young Serif"`;
    let lines = wrapText(ctx, name, W - 180);
    while (lines.length > 3 && size > 54) {
      size -= 8;
      ctx.font = `400 ${size}px "Young Serif"`;
      lines = wrapText(ctx, name, W - 180);
    }
    for (const line of lines) { y += size * 1.08; ctx.fillText(line, cx, y); }

    /* description */
    const desc = $('#flyerDesc').value.trim();
    if (desc) {
      y += 56;
      ctx.font = '500 30px "Karla"';
      ctx.fillStyle = P.cream + 'd9';
      for (const line of wrapText(ctx, desc, W - 300)) { ctx.fillText(line, cx, y); y += 42; }
      y -= 42;
    }

    /* price roundel */
    const priceRaw = $('#flyerPrice').value.replace(/[^\d.]/g, '');
    if (priceRaw) {
      y += 110;
      const label = (state.settings.currency || '$') + priceRaw;
      ctx.font = '400 56px "Young Serif"';
      const tw = ctx.measureText(label).width;
      const pw = tw + 96, ph = 108, px = cx - pw / 2, py = y - ph / 2;
      ctx.strokeStyle = P.accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 54);
      ctx.stroke();
      ctx.fillStyle = P.accent;
      ctx.fillText(label, cx, y + 20);
      y += ph / 2;
    }

    /* footer */
    ctx.font = '700 26px "Karla"';
    ctx.fillStyle = P.cream;
    const S = state.settings;
    const footer = [S.phone, S.addressShort || S.address].filter(Boolean).join('   ·   ');
    ctx.fillText(footer, cx, H - (isStory ? 110 : 84));
    ctx.font = '500 21px "Karla"';
    ctx.fillStyle = P.cream + 'a6';
    ctx.fillText((S.tagline || '').replace(/\.$/, ''), cx, H - (isStory ? 68 : 44));
  }

  function fillDishSelects() {
    const opts = VFStore.sortedCategories(state).map(c =>
      `<optgroup label="${esc(c.name)}">` +
      VFStore.itemsFor(state, c.id, true).map(i => `<option value="${esc(i.id)}">${esc(i.name)}</option>`).join('') +
      '</optgroup>').join('');
    $('#flyerDish').innerHTML = '<option value="">— pick a dish —</option>' + opts;
    $('#invAddFromMenu').innerHTML = '<option value="">Add from menu…</option>' + opts;
  }

  $('#flyerDish').addEventListener('change', e => {
    const item = state.items.find(i => i.id === e.target.value);
    if (!item) return;
    $('#flyerName').value = item.name;
    $('#flyerDesc').value = item.desc || '';
    $('#flyerPrice').value = item.price ?? '';
    drawFlyer();
  });
  ['flyerKicker', 'flyerName', 'flyerDesc', 'flyerPrice'].forEach(id =>
    $('#' + id).addEventListener('input', debounce(drawFlyer, 350)));

  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  $$('#flyerFormat button').forEach(b => b.addEventListener('click', () => {
    $$('#flyerFormat button').forEach(x => x.classList.toggle('is-active', x === b));
    flyer.w = +b.dataset.w; flyer.h = +b.dataset.h;
    drawFlyer();
  }));

  $('#flyerPalette').innerHTML = PALETTES.map((p, i) =>
    `<button data-p="${i}" class="${i === 0 ? 'is-active' : ''}" title="${p.name}" style="background: linear-gradient(135deg, ${p.bg} 55%, ${p.accent} 55%)"></button>`).join('');
  $$('#flyerPalette button').forEach(b => b.addEventListener('click', () => {
    $$('#flyerPalette button').forEach(x => x.classList.toggle('is-active', x === b));
    flyer.palette = +b.dataset.p;
    drawFlyer();
  }));

  $('#flyerBackdrops').innerHTML =
    BACKDROPS.map(n => `<button data-b="${n}" class="${n === flyer.backdrop ? 'is-active' : ''}" title="${n}"><img src="../assets/img/${n}.jpg" alt=""></button>`).join('') +
    `<button data-b="none" title="No photo" style="display:grid;place-items:center;background:var(--green-mist);color:var(--ink-faint);font-size:11px;font-weight:700">none</button>`;
  $$('#flyerBackdrops button').forEach(b => b.addEventListener('click', () => {
    $$('#flyerBackdrops button').forEach(x => x.classList.toggle('is-active', x === b));
    flyer.backdrop = b.dataset.b;
    drawFlyer();
  }));

  $('#flyerDownload').addEventListener('click', () => {
    drawFlyer().then(() => {
      $('#flyerCanvas').toBlob(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'valley-feast-flyer-' + new Date().toISOString().slice(0, 10) + '.png';
        a.click();
        URL.revokeObjectURL(a.href);
        toast('Flyer downloaded');
      }, 'image/png');
    });
  });

  /* ============================================================
     Printed menu
     ============================================================ */
  function docEmblem(cls) {
    return `<div class="doc__markrow"><svg width="72" height="72" viewBox="0 0 100 100" fill="none" stroke="currentColor">
      <circle cx="50" cy="50" r="46" stroke-width="2"/><circle cx="50" cy="50" r="42.5" stroke-width="2"/>
      <path d="M9.5 60.5 L23 45 L32.5 33 L38 39.5 L52.5 19.5 L63 38 L69 32 L90.5 55" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="M45 33 l3.5 3.5 l3.5 -3.5 l3.5 3.5 l3.5 -3.5" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="M8.5 62.5 C 26 58, 46 63, 62 74 M91.5 62.5 C 74 58, 54 63, 38 74" stroke-width="2.1" stroke-linecap="round"/>
      <g transform="translate(48 66) rotate(-42)"><ellipse cx="0" cy="-17" rx="7.8" ry="10.6" stroke-width="2.6"/><path d="M0 -6.4 V 26.5" stroke-width="2.8" stroke-linecap="round"/></g>
      <g transform="translate(52.5 66) rotate(42)"><path d="M0 -5 L-7.4 -14.5 M0 -5 L7.4 -14.5" stroke-width="2.3" stroke-linecap="round"/><path d="M-7.4 -14.5 L-9.4 -25 M-2.5 -16 L-3.1 -27.5 M2.5 -16 L3.1 -27.5 M7.4 -14.5 L9.4 -25" stroke-width="2.1" stroke-linecap="round"/><path d="M0 -5 V 26.5" stroke-width="2.8" stroke-linecap="round"/></g>
    </svg></div>`;
  }

  function renderMenuDoc() {
    const S = state.settings;
    const showDesc = $('#printDescs').checked;
    $('#menuDoc').innerHTML = `
      <div class="doc__mast">
        ${docEmblem()}
        <h1>${esc(S.name || 'Valley Feast')}</h1>
        <div class="doc__tag">${esc($('#printSubtitle').value)}</div>
      </div>
      <div class="doc__cols">
        ${VFStore.sortedCategories(state).map(cat => {
          const items = VFStore.itemsFor(state, cat.id);
          if (!items.length) return '';
          return `<div class="doc__cat">
            <h2>${esc(cat.name)}</h2>
            ${cat.note ? `<div class="catnote">${esc(cat.note)}</div>` : ''}
            ${items.map(i => `
              <div class="doc__item">
                <div class="r"><span class="n">${esc(i.name)}</span><span class="dots"></span>
                  ${i.price != null ? `<span class="p">${money(i.price)}</span>` : `<span class="p daily">priced daily</span>`}
                </div>
                ${showDesc && i.desc ? `<div class="d">${esc(i.desc)}</div>` : ''}
              </div>`).join('')}
          </div>`;
        }).join('')}
      </div>
      <div class="doc__foot">
        <strong>${esc(S.phone || '')}</strong> · ${esc(S.address || '')}<br>
        ${esc(S.tagline || '')} All prices in TTD.
      </div>`;
  }
  $('#printSubtitle').addEventListener('input', debounce(renderMenuDoc, 300));
  $('#printDescs').addEventListener('change', renderMenuDoc);
  $('#printMenuBtn').addEventListener('click', () => {
    renderMenuDoc();
    printView('view-print');
  });

  function printView(id) {
    const v = $('#' + id);
    v.classList.add('is-print');
    const done = () => { v.classList.remove('is-print'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
  }

  /* ============================================================
     Invoices
     ============================================================ */
  const INV_KEY = 'vf-invoices-v1';
  let inv = newInvoice();

  function loadInvoices() { try { return JSON.parse(localStorage.getItem(INV_KEY)) || []; } catch { return []; } }
  function saveInvoices(list) { localStorage.setItem(INV_KEY, JSON.stringify(list)); }

  function nextInvoiceNo() {
    const year = new Date().getFullYear();
    const list = loadInvoices();
    const seq = list.filter(i => i.no.includes(String(year))).length + 1;
    return `VF-${year}-${String(seq).padStart(3, '0')}`;
  }

  function newInvoice() {
    return { no: null, customer: '', phone: '', date: '', lines: [], delivery: 0, discount: 0, deposit: 0, notes: 'Deposit locks in your date. Balance due on delivery.', created: null };
  }

  function invTotals(i) {
    const sub = i.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);
    const total = sub + (Number(i.delivery) || 0) - (Number(i.discount) || 0);
    return { sub, total, due: total - (Number(i.deposit) || 0) };
  }

  function renderInvLines() {
    $('#invLines').innerHTML = inv.lines.map((l, idx) => `
      <div class="line-item" data-idx="${idx}">
        <input data-lf="name" value="${esc(l.name)}" placeholder="Item">
        <input data-lf="qty" inputmode="numeric" value="${esc(l.qty)}" placeholder="Qty">
        <input data-lf="price" inputmode="decimal" value="${esc(l.price)}" placeholder="Each">
        <button class="icon-btn icon-btn--danger" data-ldel title="Remove"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>
      </div>`).join('') || '<p style="color:var(--ink-faint); font-size: var(--text-sm)">No items yet — add from the menu below.</p>';
    $$('#invLines .line-item').forEach(rowEl => {
      const idx = +rowEl.dataset.idx;
      $$('[data-lf]', rowEl).forEach(inp => inp.addEventListener('input', () => {
        inv.lines[idx][inp.dataset.lf] = inp.value;
        renderInvoiceDoc();
      }));
      rowEl.querySelector('[data-ldel]').addEventListener('click', () => {
        inv.lines.splice(idx, 1);
        renderInvLines(); renderInvoiceDoc();
      });
    });
  }

  function renderInvoiceDoc() {
    const S = state.settings;
    const t = invTotals(inv);
    const no = inv.no || nextInvoiceNo();
    const dateStr = new Date().toLocaleDateString('en-TT', { year: 'numeric', month: 'long', day: 'numeric' });
    $('#invDoc').innerHTML = `
      <div class="inv-head">
        <div>
          <div style="color: var(--green-deep)">${docEmblem()}</div>
          <h1>Invoice</h1>
          <div style="font-family: var(--font-body); font-weight:800; color: var(--spice-deep); margin-top:4px">${esc(no)}</div>
        </div>
        <div class="from">
          <strong>${esc(S.fullName || S.name || '')}</strong><br>
          ${esc(S.address || '')}<br>
          ${esc(S.phone || '')}<br>
          ${esc(S.email || '')}
        </div>
      </div>
      <div class="inv-meta">
        <div><strong>Billed to</strong>${esc(inv.customer || '—')}${inv.phone ? '<br>' + esc(inv.phone) : ''}</div>
        <div><strong>Invoice date</strong>${dateStr}</div>
        ${inv.date ? `<div><strong>Event date</strong>${esc(inv.date)}</div>` : ''}
      </div>
      <table class="inv-table">
        <thead><tr><th>Item</th><th>Qty</th><th>Each</th><th>Amount</th></tr></thead>
        <tbody>
          ${inv.lines.map(l => `<tr>
            <td class="item-n">${esc(l.name || '—')}</td>
            <td>${esc(l.qty || 0)}</td>
            <td>${money(Number(l.price) || 0)}</td>
            <td>${money((Number(l.qty) || 0) * (Number(l.price) || 0))}</td>
          </tr>`).join('') || '<tr><td colspan="4" style="color:#999">No items</td></tr>'}
        </tbody>
      </table>
      <div class="inv-totals">
        <div class="row"><span>Subtotal</span><span>${money(t.sub)}</span></div>
        ${Number(inv.delivery) ? `<div class="row"><span>Delivery</span><span>${money(inv.delivery)}</span></div>` : ''}
        ${Number(inv.discount) ? `<div class="row"><span>Discount</span><span>−${money(inv.discount)}</span></div>` : ''}
        <div class="row total"><span>Total</span><span>${money(t.total)}</span></div>
        ${Number(inv.deposit) ? `<div class="row"><span>Deposit paid</span><span>−${money(inv.deposit)}</span></div>
        <div class="row due"><span>Balance due</span><span>${money(t.due)}</span></div>` : ''}
      </div>
      ${inv.notes ? `<div class="inv-note">${esc(inv.notes)}</div>` : ''}`;
  }

  ['invCustomer', 'invPhone', 'invDate', 'invDelivery', 'invDiscount', 'invDeposit', 'invNotes'].forEach(id => {
    $('#' + id).addEventListener('input', () => {
      inv.customer = $('#invCustomer').value;
      inv.phone = $('#invPhone').value;
      inv.date = $('#invDate').value;
      inv.delivery = $('#invDelivery').value;
      inv.discount = $('#invDiscount').value;
      inv.deposit = $('#invDeposit').value;
      inv.notes = $('#invNotes').value;
      renderInvoiceDoc();
    });
  });

  $('#invAddFromMenu').addEventListener('change', e => {
    const item = state.items.find(i => i.id === e.target.value);
    if (item) {
      inv.lines.push({ name: item.name, qty: 1, price: item.price ?? '' });
      renderInvLines(); renderInvoiceDoc();
    }
    e.target.value = '';
  });
  $('#invAddCustom').addEventListener('click', () => {
    inv.lines.push({ name: '', qty: 1, price: '' });
    renderInvLines(); renderInvoiceDoc();
  });

  $('#invNew').addEventListener('click', () => {
    inv = newInvoice();
    ['invCustomer', 'invPhone', 'invDate', 'invDelivery', 'invDiscount', 'invDeposit'].forEach(id => $('#' + id).value = '');
    $('#invNotes').value = inv.notes;
    renderInvLines(); renderInvoiceDoc();
  });

  $('#invSave').addEventListener('click', () => {
    if (!inv.lines.length) { toast('Add at least one line item'); return; }
    if (!inv.no) inv.no = nextInvoiceNo();
    inv.created = inv.created || new Date().toISOString();
    const list = loadInvoices().filter(i => i.no !== inv.no);
    list.unshift(structuredClone(inv));
    saveInvoices(list);
    renderSavedInvoices();
    renderInvoiceDoc();
    toast('Invoice ' + inv.no + ' saved');
  });

  $('#invPrint').addEventListener('click', () => { renderInvoiceDoc(); printView('view-invoices'); });

  function renderSavedInvoices() {
    const list = loadInvoices();
    $('#invSaved').innerHTML = list.map(i => {
      const t = invTotals(i);
      return `<li data-no="${esc(i.no)}">
        <span class="no">${esc(i.no)}</span>
        <span class="who">${esc(i.customer || '—')}</span>
        <span class="amt">${money(t.total)}</span>
        <button class="icon-btn" data-open title="Open"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <button class="icon-btn icon-btn--danger" data-idel title="Delete"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></button>
      </li>`;
    }).join('') || '<li style="color:var(--ink-faint)">No saved invoices yet.</li>';
    $$('#invSaved li[data-no]').forEach(li => {
      const no = li.dataset.no;
      li.querySelector('[data-open]')?.addEventListener('click', () => {
        const found = loadInvoices().find(i => i.no === no);
        if (!found) return;
        inv = structuredClone(found);
        $('#invCustomer').value = inv.customer || '';
        $('#invPhone').value = inv.phone || '';
        $('#invDate').value = inv.date || '';
        $('#invDelivery').value = inv.delivery || '';
        $('#invDiscount').value = inv.discount || '';
        $('#invDeposit').value = inv.deposit || '';
        $('#invNotes').value = inv.notes || '';
        renderInvLines(); renderInvoiceDoc();
        toast('Opened ' + no);
      });
      li.querySelector('[data-idel]')?.addEventListener('click', () => {
        if (!confirm('Delete invoice ' + no + '?')) return;
        saveInvoices(loadInvoices().filter(i => i.no !== no));
        renderSavedInvoices();
      });
    });
  }

  /* ============================================================
     Settings
     ============================================================ */
  const SETTING_FIELDS = [
    ['name', 'Business name'], ['fullName', 'Full legal name'],
    ['tagline', 'Tagline'], ['blurb', 'Short intro (site + footer)', 'wide', 'textarea'],
    ['phone', 'Phone (display)'], ['whatsapp', 'WhatsApp number (digits only)'],
    ['email', 'Email'], ['addressShort', 'Short location'],
    ['address', 'Full address', 'wide'],
    ['cateringNote', 'Catering blurb', 'wide', 'textarea'],
    ['currency', 'Currency prefix'], ['facebook', 'Facebook URL'], ['instagram', 'Instagram URL']
  ];

  function renderSettings() {
    const S = state.settings;
    $('#settingsGrid').innerHTML = SETTING_FIELDS.map(([key, label, wide, kind]) => `
      <div class="adm-field ${wide === 'wide' ? 'wide' : ''}">
        <label for="set-${key}">${esc(label)}</label>
        ${kind === 'textarea'
          ? `<textarea id="set-${key}" data-set="${key}">${esc(S[key] || '')}</textarea>`
          : `<input id="set-${key}" data-set="${key}" value="${esc(S[key] || '')}">`}
      </div>`).join('') + `
      <div class="adm-field wide">
        <label>Opening hours</label>
        <div style="display:grid; gap: var(--sp-xs)">
          ${(S.hours || []).map((h, i) => `
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--sp-xs)">
            <input data-hd="${i}" value="${esc(h.d)}" aria-label="Days">
            <input data-hh="${i}" value="${esc(h.h)}" aria-label="Hours">
          </div>`).join('')}
        </div>
      </div>`;
  }

  $('#settingsSave').addEventListener('click', () => {
    $$('#settingsGrid [data-set]').forEach(inp => { state.settings[inp.dataset.set] = inp.value.trim(); });
    (state.settings.hours || []).forEach((h, i) => {
      const d = $(`#settingsGrid [data-hd="${i}"]`), hh = $(`#settingsGrid [data-hh="${i}"]`);
      if (d) h.d = d.value.trim();
      if (hh) h.h = hh.value.trim();
    });
    persist('Settings saved — Publish to make them live');
    renderSettings();
  });

  /* ============================================================
     Boot
     ============================================================ */
  renderMenu();
  fillDishSelects();
  renderSettings();
  renderInvLines();
  renderInvoiceDoc();
  renderMenuDoc();
  document.fonts.ready.then(drawFlyer);
})();
