(() => {
  'use strict';
  const M = JSON.parse(document.getElementById('meta').textContent);
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const refAd = r => { const [s, a] = r.split(':'); return `${M.sure[+s]} ${a}`; };
  const MK = { '✓': ['', '✓', 'Ayette yazılı'], '→': ['c', '→', 'Çıkarım'], '?': ['a', '?', 'Açık'] };
  const NEG = new Set(['cennet_haram', 'cennete_giremez', 'azap', '-']);
  const cache = {};

  // Yazı boyutu
  let fs = parseFloat(store.get('eya-fs')) || 1;
  const setFs = v => { fs = Math.min(1.4, Math.max(0.85, Math.round(v * 20) / 20)); document.documentElement.style.setProperty('--fs', fs); $('#fsval').textContent = Math.round(fs * 100) + '%'; store.set('eya-fs', fs); };
  setFs(fs);
  document.querySelectorAll('[data-fs]').forEach(b => b.addEventListener('click', () => setFs(fs + 0.05 * +b.dataset.fs)));

  // Sekmeler: 0 = genel bakış, 1..12 konular
  const tabs = $('#tabs');
  const tabBtn = (id, n, ad, off) => `<button class="tab${off ? ' off' : ''}" role="tab" id="tab-${id}" data-k="${id}" aria-selected="false"><span class="n">${n}</span>${esc(ad)}</button>`;
  tabs.innerHTML = tabBtn(0, '◎', 'Genel bakış') + M.konular.map(k => tabBtn(k.no, k.no, k.ad, !k.hazir)).join('');
  tabs.addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) go(+b.dataset.k); });

  const host = $('#konu');
  function go(no, push = true) {
    tabs.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', String(+t.dataset.k === no)));
    $(`#tab-${no}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (push) history.replaceState(null, '', no ? `#konu-${no}` : '#');
    if (!no) return overview();
    const k = M.konular.find(x => x.no === no);
    if (!k.hazir) return soon(k);
    host.innerHTML = '<p class="muted panel">Yükleniyor…</p>';
    const f = `veri/konu${String(no).padStart(2, '0')}.json`;
    (cache[no] ? Promise.resolve(cache[no]) : fetch(f).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }))
      .then(d => { cache[no] = d; render(k, d); })
      .catch(err => { host.innerHTML = `<div class="panel"><p class="notice">Veri yüklenemedi (${esc(err.message)}). Sayfayı yenileyin ya da <a href="${f}">${f}</a> dosyasını açın.</p></div>`; });
  }

  function overview() {
    host.innerHTML = `<section class="panel"><h2>Konular</h2><p class="muted">12 konunun durumu. Hazır olanlar açılır; diğerleri sırayla eklenecek.</p>` +
      M.gruplar.map(g => `<p class="grp">${esc(g.ad)}</p><div class="tgrid">` + M.konular.filter(k => k.grup === g.id).map(k =>
        `<button class="tcard${k.hazir ? ' ok' : ''}" data-k="${k.no}"><span class="tn">Konu ${k.no}</span><b>${esc(k.ad)}</b><span class="s">${esc(k.ozet)}</span><span class="st">${k.hazir ? 'Hazır' : 'Hazırlanıyor'}</span></button>`).join('') + '</div>').join('') + '</section>';
    host.querySelectorAll('.tcard').forEach(c => c.addEventListener('click', () => go(+c.dataset.k)));
  }
  function soon(k) {
    host.innerHTML = `<section class="panel soon"><p class="kicker">Konu ${k.no}</p><h2>${esc(k.ad)}</h2><p class="lead">${esc(k.ozet)}</p><p class="notice">Bu konu henüz hazırlanıyor. Tarama tamamlandı; ayetler okunup sınıflandırıldıkça burada yayımlanacak.</p></section>`;
  }

  function render(k, d) {
    const T = M.metin[k.no], O = M.ozet[k.no], V = k.vurgu;
    const hit = r => V.alan === 'kayit_tur' ? V.deger.includes(r.tur) : V.alan === 'tur' ? M.odulTur[r.odul] === V.deger : r.odul === V.deger;
    const neg = [9, 4, 5, 6, 7].includes(k.no), tk = [1, 2, 4, 5, 6, 7].includes(k.no);
    const TUR = { yasak: 'Yasak', emir: 'Emir', sonuc: 'Sonuç', tanim: 'Tanım' };
    const grps = [...new Set(d.nitelikler.map(n => n.grup))];
    const max = Math.max(...d.nitelikler.map(n => n.ayet_sayisi));
    host.innerHTML = `<section class="panel">
      <p class="kicker">Konu ${k.no}</p><h2>${esc(k.ad)}</h2><p class="lead">${esc(T.giris)}</p>
      <div class="card answer"><h3 style="margin-bottom:10px">Kısa cevap</h3><ul>${T.kisa.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        <div class="stats"><div class="stat"><b>${O.nitelik}</b><span>${neg ? 'davranış başlığı' : 'nitelik başlığı'}</span></div><div class="stat"><b>${O.kayit}</b><span>okuma kaydı</span></div><div class="stat"><b>${O.ayet}</b><span>gösterilen ayet</span></div><div class="stat"><b>${O.derece['✓']}</b><span>✓ ayette yazılı</span></div><div class="stat"><b>${O.derece['→'] + O.derece['?']}</b><span>→ çıkarım / ? açık</span></div></div>
        <div class="legend">${Object.values(MK).map(([c, s, t]) => `<span><i class="mk ${c}">${s}</i>${t}</span>`).join('')}</div></div>
      <div class="finder"><label>${neg ? 'Davranış' : 'Nitelik'} ya da ayet ara<input id="q" type="search" placeholder="${neg ? (k.no === 4 ? 'ör. ortak koşma, yasak, 2:22, Nûh' : k.no === 5 ? 'ör. ribâ, zina, yetim, 4:29, Şuayb' : k.no === 6 ? 'ör. iftira, alay, gıybet, 49:11, israf' : k.no === 7 ? 'ör. domuz, şarap, 4:23, av, nikâh' : 'ör. kibir, zulüm, 2:6, Hûd') : (k.no === 2 ? 'ör. anne-baba, yetim, miskin, 4:36, komşu' : k.no === 1 ? 'ör. kulluk, adalet, ahit, 4:58, emanet' : 'ör. sabır, infak, 23:5, Furkân')}" autocomplete="off"></label><button class="btn" id="clr" type="button">Temizle</button></div>
      <div class="chips" id="gchips"><button class="chip" aria-pressed="true" data-g="">Tümü</button>${grps.map(g => `<button class="chip" aria-pressed="false" data-g="${esc(g)}">${esc(g)} <span class="k">${d.nitelikler.filter(n => n.grup === g).length}</span></button>`).join('')}</div>
      <div class="chips"><button class="chip gold" id="onlyc" aria-pressed="false">${esc(V.ad)}</button><button class="chip" id="onlyy" aria-pressed="false">Yalnız ✓ ayette yazılı</button><button class="chip" id="openall" aria-pressed="false">Hepsini aç</button></div>
      <p id="count" role="status"></p><div id="list"></div>
      <details class="card scope"><summary><b>Kapsam, yöntem ve sınırlar</b></summary><ul style="margin-top:10px">${T.kapsam.map(s => `<li>${esc(s)}</li>`).join('')}</ul></details>
    </section>`;
    const st = { q: '', g: '', c: false, y: false };
    const list = $('#list');
    const norm = s => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '');
    function draw() {
      const q = norm(st.q.trim());
      let shown = 0, recs = 0, html = '', lastG = null;
      for (const n of d.nitelikler) {
        if (st.g && n.grup !== st.g) continue;
        let rs = n.kayitlar.filter(r => (!st.c || hit(r)) && (!st.y || r.derece === '✓'));
        if (q) {
          const hitN = norm(n.etiket + ' ' + n.id).includes(q);
          rs = rs.filter(r => hitN || [r.nitelik_ayet, r.odul_ayet, refAd(r.nitelik_ayet), refAd(r.odul_ayet), M.odulAdi[r.odul], r.not_, r.ham, TUR[r.tur]].some(x => norm(x || '').includes(q)));
        }
        if (!rs.length) continue;
        shown++; recs += rs.length;
        if (n.grup !== lastG) { html += `<p class="grp">${esc(n.grup)}</p>`; lastG = n.grup; }
        const ay = new Set(rs.map(r => r.nitelik_ayet)).size, cn = new Set(rs.filter(hit).map(r => r.nitelik_ayet)).size;
        html += `<details class="nit${n.id === 'red' ? ' red' : ''}"${q || st.open ? ' open' : ''}><summary><h3>${esc(n.etiket)}</h3><span class="cnt"><b>${ay}</b> ayet · ${cn} ${esc(V.sayim)}</span><span class="bar"><i style="width:${Math.max(3, Math.round(100 * n.ayet_sayisi / max))}%"></i></span></summary><ul class="rec">` +
          rs.map(r => { const [mc, ms, mt] = MK[r.derece]; const same = r.nitelik_ayet === r.odul_ayet;
            return `<li><i class="mk ${mc}" title="${mt}">${ms}</i><div><span class="refs">${tk ? `<span class="tur t-${r.tur}">${TUR[r.tur]}</span>` : ''}<button class="ref" data-r="${r.nitelik_ayet}" aria-expanded="false">${esc(refAd(r.nitelik_ayet))}</button>${same ? '' : `<span class="arrow">→</span><button class="ref" data-r="${r.odul_ayet}" aria-expanded="false">${esc(refAd(r.odul_ayet))}</button>`}${tk && r.odul === 'yok' ? '' : `<span class="odul${!neg && r.odul === 'cennet' ? ' cennet' : ''}${neg || NEG.has(r.odul) ? ' neg' : ''}${neg && hit(r) ? ' nar' : ''}"${neg ? ` title="${esc(M.turAdi[M.odulTur[r.odul]] || '')}"` : ''}>${esc(M.odulAdi[r.odul] || r.odul)}</span>`}</span>${r.not_ ? `<span class="not">${esc(r.not_)}</span>` : ''}<span class="ham">${r.blok.startsWith('EK') ? '<b>Ek okuma</b> · ' : ''}kayıt: ${esc(r.ham)} · ${esc(r.blok)}</span></div></li>`; }).join('') + '</ul></details>';
      }
      list.innerHTML = html || '<p class="empty">Bu süzgeçle eşleşen kayıt yok.</p>';
      $('#count').textContent = `${shown} ${neg ? 'davranış' : 'nitelik'}, ${recs} kayıt gösteriliyor.`;
    }
    list.addEventListener('click', e => {
      const b = e.target.closest('.ref'); if (!b) return;
      const li = b.closest('li'), r = b.dataset.r, open = b.getAttribute('aria-expanded') === 'true';
      li.querySelectorAll('.ref').forEach(x => x.setAttribute('aria-expanded', 'false'));
      li.querySelector('.ayet')?.remove();
      if (open) return;
      b.setAttribute('aria-expanded', 'true');
      const a = d.ayetler[r];
      li.insertAdjacentHTML('beforeend', `<div class="ayet"><p class="ar" lang="ar">${esc(a.ar)}</p><p class="tr">${esc(a.tr)}</p><p class="src">${esc(refAd(r))} (${r}) · Yaşar Nuri Öztürk meali</p></div>`);
    });
    let t; $('#q').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { st.q = e.target.value; draw(); }, 120); });
    $('#clr').addEventListener('click', () => { $('#q').value = ''; st.q = ''; draw(); });
    $('#gchips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; st.g = b.dataset.g; $('#gchips').querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === b))); draw(); });
    const tog = (id, key) => $(id).addEventListener('click', e => { st[key] = !st[key]; e.currentTarget.setAttribute('aria-pressed', String(st[key])); draw(); });
    tog('#onlyc', 'c'); tog('#onlyy', 'y'); tog('#openall', 'open');
    draw();
  }

  const m = location.hash.match(/konu-(\d+)/);
  go(m ? +m[1] : 8, false);
})();
