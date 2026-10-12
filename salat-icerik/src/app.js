(() => {
  'use strict';
  const d = document;
  const root = d.documentElement;
  root.classList.add('js');

  /*SEARCH-START*/
  // Aramada kullanılan eş anlamlılar: okuyucunun yazdığı kelime, sayfadaki kelimelere bağlanır.
  const SYN = {
    namaz: ['salat'], abdest: ['yikay', 'meshed', 'temizlik'], teyemmum: ['teyemmum', 'zemine yonel'],
    gusul: ['cunup', 'yikanin', 'arinin'], ezan: ['cagri', 'cagir'], cemaat: ['birlikte', 'grup', 'topluca'],
    kible: ['kible', 'mescid-i haram'], kiyam: ['ayakta', 'kiyam'], vakit: ['vakit', 'fecr', 'isa', 'gunduz'],
    sabah: ['sabah', 'fecr'], dua: ['dua', 'yalvar', 'dile'], hutbe: ['cuma'], rekat: ['rekat']
  };
  function fold(value) {
    return String(value).toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/ı/g, 'i').replace(/['’`ʼ]/g, '').replace(/\s+/g, ' ').trim();
  }
  function parseQuery(value, textOnly) {
    const full = fold(value);
    if (!full) return null;
    if (!textOnly) {
      const key = full.match(/^(\d{1,3})\s*[:.]\s*(\d{1,3})$/);
      if (key) return { type: 'key', key: key[1] + ':' + key[2] };
      if (/^[^\d]+ \d{1,3}$/.test(full)) return { type: 'title', full };
    }
    const tokens = full.split(' ').map(t => {
      let alts = SYN[t];
      if (!alts) {
        for (const k of Object.keys(SYN)) {
          if (t.length > k.length && t.startsWith(k)) { alts = SYN[k]; break; }
        }
      }
      return alts ? alts.concat(t) : [t];
    });
    return { type: 'text', full, tokens };
  }
  function cardMatches(card, q) {
    if (!q) return true;
    if (q.type === 'key') return card.key === q.key;
    if (q.type === 'title') return fold(card.title) === q.full;
    const hay = fold(card.title + ' ' + card.text);
    return q.tokens.every(alts => alts.some(a => hay.includes(a)));
  }
  /*SEARCH-END*/

  const $ = (s, el = d) => el.querySelector(s);
  const $$ = (s, el = d) => Array.from(el.querySelectorAll(s));
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const smooth = reduce ? 'auto' : 'smooth';

  // Sekme çubuğunun yüksekliği: kaydırınca başlıkların çubuğun altında kalmaması için
  const bar = $('.tabbar');
  const setBar = () => { if (bar) root.style.setProperty('--bar-h', bar.offsetHeight + 'px'); };
  setBar();
  window.addEventListener('resize', setBar);

  // Sekmeler
  const tabs = $$('[role="tab"]');
  const panels = tabs.map(t => d.getElementById(t.getAttribute('aria-controls')));
  let activeTab = 'ozet';
  function showTab(id, focus) {
    tabs.forEach((t, i) => {
      const on = t.dataset.tab === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
      if (on && focus) t.focus();
      if (on && t.parentElement.scrollWidth > t.parentElement.clientWidth) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    activeTab = id;
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => go('#' + t.dataset.tab));
    t.addEventListener('keydown', e => {
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); go('#' + tabs[j].dataset.tab, true); }
    });
  });

  // Konular ve arama
  const list = $('#topic-list');
  const sections = list ? $$('.topic', list) : [];
  const chips = $$('.chip[data-topic]');
  const search = $('#search');
  const count = $('#count');
  const empty = $('#empty');
  const cards = $$('.verse-card');
  const data = new Map(cards.map(c => [c, {
    key: c.dataset.key,
    title: $('h3', c).textContent,
    text: (c.dataset.topicTitle || '') + ' ' + c.textContent
  }]));
  let current = sections.length ? sections[0].dataset.topic : 'all';

  function render() {
    if (!list) return;
    const value = search ? search.value : '';
    let q = parseQuery(value);
    let n = 0;
    const run = () => {
      n = 0;
      sections.forEach(s => {
        let v = 0;
        $$('.verse-card', s).forEach(c => {
          const ok = cardMatches(data.get(c), q);
          c.hidden = !ok;
          if (ok) v++;
        });
        s.hidden = v === 0;
        n += v;
      });
    };
    if (q) {
      run();
      if (n === 0 && q.type === 'title') { q = parseQuery(value, true); run(); }
      list.classList.add('searching');
      chips.forEach(c => c.setAttribute('aria-pressed', 'false'));
      count.textContent = n ? 'Arama sonucu: ' + n + ' ayet' : '';
      empty.hidden = n !== 0;
    } else {
      list.classList.remove('searching');
      sections.forEach(s => {
        const on = current === 'all' || s.dataset.topic === current;
        s.hidden = !on;
        const inner = $$('.verse-card', s);
        inner.forEach(c => { c.hidden = false; });
        if (on) n += inner.length;
      });
      chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.topic === current)));
      const sec = sections.find(s => s.dataset.topic === current);
      count.textContent = (current === 'all' || !sec ? 'Bütün konular' : sec.dataset.title) + ' · ' + n + ' ayet gösteriliyor';
      empty.hidden = true;
    }
  }
  chips.forEach(chip => chip.addEventListener('click', () => {
    current = chip.dataset.topic;
    if (search) search.value = '';
    render();
    history.replaceState(null, '', current === 'all' ? '#konular' : '#konu-' + current);
  }));
  if (search) search.addEventListener('input', render);
  const resetBtn = $('#reset');
  if (resetBtn) resetBtn.addEventListener('click', () => { search.value = ''; render(); search.focus(); });

  // Adres (#...) yönetimi
  function scrollToEl(el, block) {
    requestAnimationFrame(() => el.scrollIntoView({ block, behavior: smooth }));
  }
  function scrollToPanelTop() {
    if (!bar) return;
    const y = bar.getBoundingClientRect().top + window.scrollY;
    if (window.scrollY > y) window.scrollTo({ top: y, behavior: smooth });
  }
  function flash(el) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 2000);
  }
  function route(hash, focus) {
    let id = '';
    try { id = decodeURIComponent(String(hash || '').replace(/^#/, '')); } catch (e) { id = ''; }
    const el = id ? d.getElementById(id) : null;
    if (!el) { showTab(activeTab, focus); return; }
    if (el.classList.contains('panel')) { showTab(id, focus); scrollToPanelTop(); return; }
    if (el.classList.contains('topic')) {
      if (search) search.value = '';
      current = el.dataset.topic; render(); showTab('konular');
      scrollToEl(el, 'start'); return;
    }
    if (el.classList.contains('verse-card')) {
      if (search) search.value = '';
      current = el.closest('.topic').dataset.topic; render(); showTab('konular');
      el.classList.add('in');
      scrollToEl(el, 'start'); flash(el); return;
    }
    const panel = el.closest('.panel');
    if (panel) showTab(panel.id);
    scrollToEl(el, 'start');
  }
  function go(hash, focus) {
    if (location.hash !== hash) history.pushState(null, '', hash);
    route(hash, focus);
  }
  window.addEventListener('popstate', () => route(location.hash));

  // Kopyalama
  function fallbackCopy(text) {
    const t = d.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    d.body.appendChild(t); t.select();
    let ok = false;
    try { ok = d.execCommand('copy'); } catch (e) { ok = false; }
    t.remove();
    return ok;
  }
  function copyCard(btn) {
    const card = btn.closest('.verse-card');
    if (!card) return;
    const mode = list ? list.dataset.meal : 'both';
    const parts = [$('h3', card).textContent, $('.arabic', card).textContent];
    if (mode !== 'yn') parts.push('Çalışma meali: ' + $('.meal-text', card).textContent);
    if (mode !== 'cal' && $('.yn-text', card)) parts.push('Yaşar Nuri Öztürk meali: ' + $('.yn-text', card).textContent);
    const text = parts.join('\n');
    const label = btn.dataset.label || btn.textContent;
    btn.dataset.label = label;
    const done = ok => { btn.textContent = ok ? 'Kopyalandı' : 'Kopyalanamadı'; setTimeout(() => { btn.textContent = label; }, 1600); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => done(true), () => done(fallbackCopy(text)));
    else done(fallbackCopy(text));
  }

  // Meal seçimi: ikisi de, çalışma meali, Yaşar Nuri
  const mealButtons = $$('.ms[data-meal]');
  function setMeal(mode, save) {
    if (!list || !['both', 'cal', 'yn'].includes(mode)) return;
    list.dataset.meal = mode;
    mealButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.meal === mode)));
    if (save) { try { localStorage.setItem('salat-icerik-meal', mode); } catch (e) { /* tarayıcı depolamaya izin vermiyor */ } }
  }
  mealButtons.forEach(b => b.addEventListener('click', () => setMeal(b.dataset.meal, true)));
  try { const m = localStorage.getItem('salat-icerik-meal'); if (m) setMeal(m, false); } catch (e) { /* tarayıcı depolamaya izin vermiyor */ }

  // Yazı boyutu
  const sizes = [0.9, 1, 1.12, 1.25, 1.4];
  let fi = 1;
  try { const s = localStorage.getItem('salat-icerik-yazi'); if (s !== null && sizes[Number(s)] !== undefined) fi = Number(s); } catch (e) { /* tarayıcı depolamaya izin vermiyor */ }
  function applyFs() {
    root.style.setProperty('--fs', String(sizes[fi]));
    const out = $('#fs-val');
    if (out) out.textContent = Math.round(sizes[fi] * 100) + '%';
  }
  function setFs(delta) {
    fi = Math.max(0, Math.min(sizes.length - 1, fi + delta));
    applyFs();
    try { localStorage.setItem('salat-icerik-yazi', String(fi)); } catch (e) { /* tarayıcı depolamaya izin vermiyor */ }
  }
  applyFs();

  // Tek tıklama dinleyicisi: iç bağlantılar, kopyalama, yazı boyutu
  d.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (a) {
      const h = a.getAttribute('href');
      if (h.length > 1 && d.getElementById(h.slice(1))) { e.preventDefault(); go(h); }
      return;
    }
    const b = e.target.closest('.copy');
    if (b) { copyCard(b); return; }
    const f = e.target.closest('[data-fs]');
    if (f) setFs(Number(f.dataset.fs));
  });

  // Belirme hareketi
  let io = null;
  if (!reduce && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -5% 0px', threshold: 0.01 });
  }
  $$('.reveal').forEach(el => { if (io) io.observe(el); else el.classList.add('in'); });

  render();
  route(location.hash || '#ozet');
})();
