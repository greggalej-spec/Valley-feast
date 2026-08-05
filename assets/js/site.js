/* ============================================================
   Valley Feast — public site behaviour
   ============================================================ */

(function () {
  const data = VFStore.load();
  const S = data.settings;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- header ---------- */
  const header = document.getElementById('siteHeader');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
  }
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- settings → DOM ---------- */
  document.querySelectorAll('[data-vf]').forEach(el => {
    const v = S[el.dataset.vf];
    if (v) el.textContent = v;
  });
  const hrefs = {
    tel: 'tel:' + String(S.phone || '').replace(/[^+\d]/g, ''),
    whatsapp: 'https://wa.me/' + String(S.whatsapp || '').replace(/\D/g, ''),
    mailto: 'mailto:' + (S.email || ''),
    facebook: S.facebook || '#',
    instagram: S.instagram || '#'
  };
  document.querySelectorAll('[data-vf-href]').forEach(el => {
    el.href = hrefs[el.dataset.vfHref] || '#';
  });
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- live prices on curated cards ---------- */
  document.querySelectorAll('[data-price-for]').forEach(el => {
    const item = data.items.find(i => i.id === el.dataset.priceFor);
    if (!item) return;
    const m = VFStore.money(item.price, S);
    el.textContent = m || 'priced daily';
  });

  /* ---------- ticker ---------- */
  const track = document.getElementById('tickerTrack');
  if (track) {
    const names = data.items.filter(i => i.tags?.includes('popular')).map(i => i.name);
    const list = names.length ? names : data.items.slice(0, 8).map(i => i.name);
    const seq = list.map(n => `<span>${esc(n)} <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style="opacity:.7"><circle cx="5" cy="5" r="2.4"/></svg></span>`).join('');
    track.innerHTML = seq + seq; /* duplicated for the seamless loop */
  }

  /* ---------- hours ---------- */
  const ledger = document.getElementById('hoursLedger');
  if (ledger && Array.isArray(S.hours)) {
    ledger.innerHTML = S.hours.map(r =>
      `<li><span class="d">${esc(r.d)}</span><span class="dots"></span><span class="h">${esc(r.h)}</span></li>`).join('');
  }

  /* ============================================================
     Menu page
     ============================================================ */
  const menuRoot = document.getElementById('menuRoot');
  if (menuRoot) {
    const cats = VFStore.sortedCategories(data);
    const tagChip = t => ({
      veg: '<span class="chip chip--veg">veg</span>',
      spicy: '<span class="chip chip--spicy">pepper</span>',
      seafood: '<span class="chip chip--seafood">seafood</span>',
      popular: '<span class="chip chip--popular">favourite</span>'
    }[t] || '');

    menuRoot.innerHTML = cats.map(cat => {
      const items = VFStore.itemsFor(data, cat.id);
      if (!items.length) return '';
      return `
      <section class="menu-section" id="${cat.id}" data-cat-section>
        <div class="wrap">
          <header class="menu-section__head reveal">
            <img class="menu-section__img" src="${esc(cat.img)}" alt="" loading="lazy">
            <div>
              <h2>${esc(cat.name)}</h2>
              ${cat.note ? `<p>${esc(cat.note)}</p>` : ''}
            </div>
          </header>
          <ul class="ledger menu-grid--cols">
            ${items.map(i => `
            <li data-tags="${(i.tags || []).join(' ')}">
              <div class="ledger__row">
                <span class="ledger__name">${esc(i.name)}</span>
                <span class="ledger__dots"></span>
                ${i.price != null
                  ? `<span class="ledger__price">${VFStore.money(i.price, S)}</span>`
                  : `<span class="ledger__price ledger__price--daily">priced daily</span>`}
              </div>
              ${(i.desc || (i.tags || []).length) ? `
              <div class="ledger__meta">
                ${i.desc ? `<span class="ledger__desc">${esc(i.desc)}</span>` : ''}
                ${(i.tags || []).map(tagChip).join('')}
              </div>` : ''}
            </li>`).join('')}
          </ul>
        </div>
      </section>`;
    }).join('');

    /* category pills */
    const pills = document.getElementById('menuCats');
    if (pills) {
      pills.innerHTML = cats.map(c => `<a href="#${esc(c.id)}" data-cat-link="${esc(c.id)}">${esc(c.name)}</a>`).join('');
    }

    /* re-observe new reveals */
    menuRoot.querySelectorAll('.reveal').forEach(el => io.observe(el));

    /* scrollspy */
    const links = [...document.querySelectorAll('[data-cat-link]')];
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          links.forEach(l => l.classList.toggle('is-active', l.dataset.catLink === e.target.id));
        }
      }
    }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('[data-cat-section]').forEach(s => spy.observe(s));

    /* dietary filters */
    let active = null;
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        active = active === btn.dataset.filter ? null : btn.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach(b =>
          b.classList.toggle('is-on', b.dataset.filter === active));
        document.querySelectorAll('.ledger li').forEach(li => {
          const tags = (li.dataset.tags || '').split(' ');
          li.classList.toggle('is-hidden', !!active && !tags.includes(active));
        });
      });
    });
  }

  /* ============================================================
     Catering page — quote request via WhatsApp / email
     ============================================================ */
  const quoteForm = document.getElementById('quoteForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const f = new FormData(quoteForm);
      const lines = [
        'Catering request — Valley Feast',
        '',
        'Name: ' + (f.get('name') || '—'),
        'Phone: ' + (f.get('phone') || '—'),
        'Event date: ' + (f.get('date') || '—'),
        'Guests: ' + (f.get('guests') || '—'),
        'Event type: ' + (f.get('type') || '—'),
        '',
        'Details: ' + (f.get('details') || '—')
      ].join('\n');
      const via = ev.submitter?.dataset.via;
      if (via === 'whatsapp' && S.whatsapp) {
        open('https://wa.me/' + String(S.whatsapp).replace(/\D/g, '') + '?text=' + encodeURIComponent(lines), '_blank');
      } else {
        location.href = 'mailto:' + (S.email || '') +
          '?subject=' + encodeURIComponent('Catering request — ' + (f.get('name') || '')) +
          '&body=' + encodeURIComponent(lines);
      }
      const note = document.getElementById('quoteSent');
      if (note) { note.hidden = false; }
    });
  }
})();
