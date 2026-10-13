// Emir, Yasak ve Karşılık Atlası sayfasını üretir: node emir-yasak-atlasi/build.mjs
// Sayfa elle düzenlenmez. Konu verisi veri/konuNN.json dosyalarından gelir ve tarayıcıda açılan konuya göre yüklenir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { konular, gruplar, odulAdi as odulAdi0 } from './konular.mjs';
import { genel, konu01, konu02, konu03, konu04, konu05, konu06, konu07, konu08, konu09, konu10, konu11, konu12 } from './metin.mjs';
import { cezaAdi, cezaTur, cezaTurAdi } from './ceza.mjs';
import { sureAdlari } from './sure-adlari.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const VERSION = 'v1.1.0';
const DATE = '13 Ekim 2026';
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const odulAdi = { ...odulAdi0, ...cezaAdi };
// --- Veri denetimi ---
const hazir = konular.filter(k => k.hazir);
const ozet = {};
for (const k of hazir) {
  const file = path.join(dir, `veri/konu${String(k.no).padStart(2, '0')}.json`);
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const n of d.nitelikler) {
    if (!n.kayitlar.length) throw new Error(`Boş nitelik: ${n.id}`);
    for (const r of n.kayitlar) {
      for (const ref of [r.nitelik_ayet, r.odul_ayet]) {
        if (!/^\d+:\d+$/.test(ref)) throw new Error(`Geçersiz ayet: ${ref}`);
        if (!d.ayetler[ref] || !d.ayetler[ref].ar || !d.ayetler[ref].tr) throw new Error(`Metin eksik: ${ref}`);
        if (!sureAdlari[Number(ref.split(':')[0])]) throw new Error(`Sure adı yok: ${ref}`);
      }
      if (!['✓', '→', '?'].includes(r.derece)) throw new Error(`Derece: ${r.derece}`);
      if (!(r.odul in odulAdi)) throw new Error(`Ödül adı yok: ${r.odul}`);
    }
  }
  const by = Object.fromEntries(d.nitelikler.map(n => [n.id, n]));
  const genelOzet = { nitelik: d.nitelikler.filter(n => !['red', 'sonuc_tanimi'].includes(n.id)).length, kayit: d.istatistik.kayit, ayet: d.istatistik.ayet, derece: d.istatistik.derece };
  if (k.no === 4) {
    const tur = {};
    for (const n of d.nitelikler) for (const r of n.kayitlar) (tur[r.tur] ||= new Set()).add(r.nitelik_ayet);
    const karsilikli = new Set(d.nitelikler.flatMap(n => n.kayitlar.filter(r => r.odul !== 'yok').map(r => r.nitelik_ayet)));
    const d9 = JSON.parse(fs.readFileSync(path.join(dir, 'veri/konu09.json'), 'utf8'));
    ozet[k.no] = {
      ...genelOzet, yasak: tur.yasak.size, emir: tur.emir.size, sirk: by.sirk.ayet_sayisi, cocuk: by.cocuk_isnadi.ayet_sayisi,
      yalan: by.ayetleri_yalanlama.ayet_sayisi, karsilikli: karsilikli.size, konu9_yalan: d9.nitelikler.find(x => x.id === 'ayetleri_yalanlama').ayet_sayisi,
    };
  } else if (k.no === 5) {
    const nar = new Set(d.nitelikler.flatMap(n => n.kayitlar.filter(r => cezaTur[r.odul] === 'nar').map(r => r.nitelik_ayet)));
    const tur = {};
    for (const n of d.nitelikler) for (const r of n.kayitlar) (tur[r.tur] ||= new Set()).add(r.nitelik_ayet);
    const karsilikli = new Set(d.nitelikler.flatMap(n => n.kayitlar.filter(r => r.odul !== 'yok').map(r => r.nitelik_ayet)));
    const grup = g => new Set(d.nitelikler.filter(n => n.grup === g).flatMap(n => n.kayitlar.map(r => r.nitelik_ayet))).size;
    ozet[k.no] = {
      ...genelOzet, yasak: tur.yasak.size, emir: tur.emir.size, can: grup('Can'), namus: grup('Namus'), mal: grup('Mal'),
      olcu: by.olcu_tarti.ayet_sayisi, fahsa: by.fahsa.ayet_sayisi, oldurme: by.haksiz_oldurme.ayet_sayisi, karsilikli: karsilikli.size, nar: nar.size,
    };
  } else if (k.no === 6) {
    const nar = new Set(d.nitelikler.flatMap(n => n.kayitlar.filter(r => cezaTur[r.odul] === 'nar').map(r => r.nitelik_ayet)));
    const tur = {};
    for (const n of d.nitelikler) for (const r of n.kayitlar) (tur[r.tur] ||= new Set()).add(r.nitelik_ayet);
    const karsilikli = new Set(d.nitelikler.flatMap(n => n.kayitlar.filter(r => r.odul !== 'yok').map(r => r.nitelik_ayet)));
    const sev = new Set(d.nitelikler.flatMap(n => n.kayitlar.filter(r => r.odul === 'sevilmeme').map(r => r.nitelik_ayet)));
    const grup = g => new Set(d.nitelikler.filter(n => n.grup === g).flatMap(n => n.kayitlar.map(r => r.nitelik_ayet))).size;
    ozet[k.no] = {
      ...genelOzet, yasak: tur.yasak.size, emir: tur.emir.size, yalan: grup('Yalan ve iftira'), alay: grup('Alay ve çekiştirme'),
      kibir: grup('Kibir ve övünme'), israf: grup('İsraf'), soz: grup('Söz ve ses edebi'), karsilikli: karsilikli.size, nar: nar.size, sevilmeme: sev.size,
    };
  } else if (k.no === 1) {
    const tur = {};
    for (const n of d.nitelikler) for (const r of n.kayitlar) (tur[r.tur] ||= new Set()).add(r.nitelik_ayet);
    const karsilikli = new Set(d.nitelikler.flatMap(n => n.kayitlar.filter(r => r.odul !== 'yok').map(r => r.nitelik_ayet)));
    const grup = g => new Set(d.nitelikler.filter(n => n.grup === g).flatMap(n => n.kayitlar.map(r => r.nitelik_ayet))).size;
    ozet[k.no] = {
      ...genelOzet, yasak: tur.yasak.size, emir: tur.emir.size, kulluk: grup('Kulluk'), adalet: grup('Adalet ve ihsan'),
      soz: grup('Söz ve emanet'), karsilikli: karsilikli.size,
    };
  } else if (k.no === 2) {
    const tur = {};
    for (const n of d.nitelikler) for (const r of n.kayitlar) (tur[r.tur] ||= new Set()).add(r.nitelik_ayet);
    const karsilikli = new Set(d.nitelikler.flatMap(n => n.kayitlar.filter(r => r.odul !== 'yok').map(r => r.nitelik_ayet)));
    const grup = g => new Set(d.nitelikler.filter(n => n.grup === g).flatMap(n => n.kayitlar.map(r => r.nitelik_ayet))).size;
    ozet[k.no] = {
      ...genelOzet, yasak: tur.yasak.size, emir: tur.emir.size, aile: grup('Anne-baba ve akraba'), zayif: grup('Yetim, yoksul ve yolcu'),
      komsu: grup('Komşu ve yakın çevre'), karsilikli: karsilikli.size,
    };
  } else if (k.no === 3) {
    const tur = {};
    for (const n of d.nitelikler) for (const r of n.kayitlar) (tur[r.tur] ||= new Set()).add(r.nitelik_ayet);
    const karsilikli = new Set(d.nitelikler.flatMap(n => n.kayitlar.filter(r => r.odul !== 'yok').map(r => r.nitelik_ayet)));
    const grup = g => new Set(d.nitelikler.filter(n => n.grup === g).flatMap(n => n.kayitlar.map(r => r.nitelik_ayet))).size;
    ozet[k.no] = {
      ...genelOzet, yasak: tur.yasak.size, emir: tur.emir.size, infak: grup('İnfak ve sadaka'), zekat: grup('Zekât'),
      cimri: grup('Cimrilik ve biriktirme'), karsilikli: karsilikli.size,
    };
  } else if (k.no === 7) {
    const tur = {};
    for (const n of d.nitelikler) for (const r of n.kayitlar) (tur[r.tur] ||= new Set()).add(r.nitelik_ayet);
    const karsilikli = new Set(d.nitelikler.flatMap(n => n.kayitlar.filter(r => r.odul !== 'yok').map(r => r.nitelik_ayet)));
    const grup = g => new Set(d.nitelikler.filter(n => n.grup === g).flatMap(n => n.kayitlar.map(r => r.nitelik_ayet))).size;
    ozet[k.no] = {
      ...genelOzet, yasak: tur.yasak.size, emir: tur.emir.size, yiyecek: grup('Yiyecek ve içecek'), evlilik: grup('Evlilik'),
      haram: grup('Haram kılma ve helal sayma'), karsilikli: karsilikli.size,
    };
  } else if (k.no === 8) {
    const set = id => new Set((by[id]?.kayitlar || []).map(r => r.nitelik_ayet));
    const iman = set('iman'), salih = set('salih_amel');
    ozet[k.no] = {
      ...genelOzet, imanSalih: [...iman].filter(x => salih.has(x)).length, iman: by.iman.ayet_sayisi, salih: by.salih_amel.ayet_sayisi,
      takva: by.takva.ayet_sayisi, sabir: by.sabir.ayet_sayisi, ihsan: by.ihsan.ayet_sayisi,
      namaz: by.namaz.ayet_sayisi, infak: by.infak.ayet_sayisi,
    };
  } else if (k.no === 9) {
    const nar = new Set(d.nitelikler.flatMap(n => n.kayitlar.filter(r => cezaTur[r.odul] === 'nar').map(r => r.nitelik_ayet)));
    ozet[k.no] = {
      ...genelOzet, kufur: by.kufur.ayet_sayisi, yalan: by.ayetleri_yalanlama.ayet_sayisi, zulum: by.zulum.ayet_sayisi, sirk: by.sirk.ayet_sayisi,
      kibir: by.kibir.ayet_sayisi, yuz: by.yuz_cevirme.ayet_sayisi, genel: by.genel_adlandirma.ayet_sayisi, nar: nar.size,
    };
  } else if (k.no === 10) {
    const karsilikli = new Set(d.nitelikler.flatMap(n => n.kayitlar.filter(r => r.odul !== 'yok').map(r => r.nitelik_ayet)));
    const grup = g => new Set(d.nitelikler.filter(n => n.grup === g).flatMap(n => n.kayitlar.map(r => r.nitelik_ayet))).size;
    ozet[k.no] = {
      ...genelOzet, tevbe: grup('Tövbe'), bagis: by.bagislanmaz.ayet_sayisi, olcu: grup('Ölçü ve adalet'), derece_g: grup('Derece ve sorumluluk'),
      zerre: by.zerre.ayet_sayisi, zulum: by.zulum_yok.ayet_sayisi, sorumluluk: by.sorumluluk.ayet_sayisi, bosa: by.amel_bosa.ayet_sayisi, karsilikli: karsilikli.size,
    };
  } else if (k.no === 11) {
    const karsilikli = new Set(d.nitelikler.flatMap(n => n.kayitlar.filter(r => r.odul !== 'yok').map(r => r.nitelik_ayet)));
    const tur = {};
    for (const n of d.nitelikler) for (const r of n.kayitlar) (tur[r.tur] ||= new Set()).add(r.nitelik_ayet);
    ozet[k.no] = {
      ...genelOzet, sever: by.sever.ayet_sayisi, sevmez: by.sevmez.ayet_sayisi, insan: by.insan_sever.ayet_sayisi, vedud: by.vedud.ayet_sayisi,
      yasak: tur.yasak.size, emir: tur.emir.size, karsilikli: karsilikli.size,
    };
  } else if (k.no === 12) {
    const karsilikli = new Set(d.nitelikler.flatMap(n => n.kayitlar.filter(r => r.odul !== 'yok').map(r => r.nitelik_ayet)));
    const tur = {};
    for (const n of d.nitelikler) for (const r of n.kayitlar) (tur[r.tur] ||= new Set()).add(r.nitelik_ayet);
    ozet[k.no] = {
      ...genelOzet, kebair: by.kebair.ayet_sayisi, fahsa: by.fahsa.ayet_sayisi, ism: by.ism.ayet_sayisi, zenb: by.zenb.ayet_sayisi,
      fisk: by.fisk.ayet_sayisi, bagy: by.bagy.ayet_sayisi, munker: by.munker.ayet_sayisi, hatia: by.hatia.ayet_sayisi,
      yasak: tur.yasak.size, emir: tur.emir.size, karsilikli: karsilikli.size,
    };
  }
}
const hedefDosya = { 3: 'tarama/out/hedef_mal3.json', 2: 'tarama/out/hedef_aile2.json', 1: 'tarama/out/hedef_emir1.json', 7: 'tarama/out/hedef_yasak7.json', 6: 'tarama/out/hedef_yasak6.json', 5: 'tarama/out/hedef_yasak5.json', 4: 'tarama/out/hedef_yasak4.json', 8: 'tarama/out/hedef_odul.json', 9: 'tarama/out/hedef_ceza_tum.json', 10: 'tarama/out/hedef_kural10.json', 11: 'tarama/out/hedef_sevgi11.json', 12: 'tarama/out/hedef_gunah12.json' };
const blokDosya = { 3: 'okuma/k03_bloklar.txt.json', 2: 'okuma/k02_bloklar.txt.json', 1: 'okuma/k01_bloklar.txt.json', 7: 'okuma/k07_bloklar.txt.json', 6: 'okuma/k06_bloklar.txt.json', 5: 'okuma/k05_bloklar.txt.json', 4: ['okuma/k04_bloklar.txt.json', 'okuma/k04b_bloklar.txt.json'], 8: 'okuma/k08_bloklar.txt.json', 9: 'okuma/k09_bloklar.txt.json', 10: 'okuma/k10_bloklar.txt.json', 11: 'okuma/k11_bloklar.txt.json', 12: 'okuma/k12_bloklar.txt.json' };
const vars = {};
for (const k of hazir) {
  const bl = [].concat(blokDosya[k.no]).flatMap(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  const oku = new Set(bl.flatMap(x => Array.from({ length: x[2] - x[1] + 1 }, (_, i) => x[0] + ':' + (x[1] + i))));
  vars[k.no] = { ...ozet[k.no], hedef: Object.keys(JSON.parse(fs.readFileSync(path.join(dir, hedefDosya[k.no]), 'utf8'))).length, blok: bl.length, okunan: k.no === 1 || k.no === 2 || k.no === 3 || k.no === 4 || k.no === 5 || k.no === 6 || k.no === 7 || k.no === 10 || k.no === 11 || k.no === 12 ? oku.size : bl.reduce((t, x) => t + x[2] - x[1] + 1, 0) };
}
const corpus = fs.readFileSync(path.join(dir, '../data/quran-uthmani-tanzil-v1.1.txt'), 'utf8');
const cs = corpus.indexOf('# PLEASE DO NOT REMOVE');
if (cs < 0) throw new Error('Tanzil telif bildirimi bulunamadı.');
const telif = corpus.slice(cs).split('\n').map(l => l.trimEnd()).join('\n').trim();
const doldur = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => { if (!(k in v)) throw new Error('Yer tutucu: ' + k); return v[k]; });

const yaz = (t, v) => ({ ...t, kisa: t.kisa.map(s => doldur(s, v)), kapsam: t.kapsam.map(s => doldur(s, v)) });
const meta = { konular, gruplar, odulAdi, odulTur: cezaTur, turAdi: cezaTurAdi, sure: sureAdlari, metin: { 1: yaz(konu01, vars[1]), 2: yaz(konu02, vars[2]), 3: yaz(konu03, vars[3]), 4: yaz(konu04, vars[4]), 5: yaz(konu05, vars[5]), 6: yaz(konu06, vars[6]), 7: yaz(konu07, vars[7]), 8: yaz(konu08, vars[8]), 9: yaz(konu09, vars[9]), 10: yaz(konu10, vars[10]), 11: yaz(konu11, vars[11]), 12: yaz(konu12, vars[12]) }, ozet };
const css = fs.readFileSync(path.join(dir, 'src/style.css'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'src/app.js'), 'utf8');
const logo = `<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="var(--accent)"/><path d="M9 22V10h8M9 16h6M19 10l4 6-4 6" fill="none" stroke="var(--on-accent)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(genel.baslik)}</title>
<meta name="description" content="${esc(genel.altbaslik)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${css}</style>
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<a class="skip" href="#ana">İçeriğe geç</a>
<header class="top"><div class="wrap">
  <a class="brand" href="./">${logo}<span>${esc(genel.baslik)}</span></a>
  <div class="tools">
    <span class="fs"><button class="btn" data-fs="-1" aria-label="Yazıyı küçült">A−</button><span class="fs-val" id="fsval">100%</span><button class="btn" data-fs="1" aria-label="Yazıyı büyüt">A+</button></span>
    <a class="btn" href="../">Atlas ana sayfa</a>
  </div>
</div></header>
<nav class="tabbar" aria-label="Konular"><div class="wrap"><div class="tablist" id="tabs" role="tablist"></div></div></nav>
<main id="ana" class="wrap">
  <section class="hero">
    <p class="kicker">${esc(VERSION)} · ${esc(DATE)}</p>
    <h1>${esc(genel.baslik)}</h1>
    <p class="lead">${esc(genel.altbaslik)}</p>
    <details class="method"><summary>Yöntem ve kanıt dereceleri</summary><ul>${genel.yontem.map(s => `<li>${esc(s)}</li>`).join('')}</ul></details>
  </section>
  <div id="konu" aria-live="polite"><noscript><p class="notice">Bu sayfanın konu içerikleri JavaScript ile yüklenir. Ham veriye <a href="veri/konu01.json">veri/konu01.json</a>, <a href="veri/konu02.json">veri/konu02.json</a>, <a href="veri/konu03.json">veri/konu03.json</a>, <a href="veri/konu04.json">veri/konu04.json</a>, <a href="veri/konu05.json">veri/konu05.json</a>, <a href="veri/konu06.json">veri/konu06.json</a>, <a href="veri/konu07.json">veri/konu07.json</a>, <a href="veri/konu08.json">veri/konu08.json</a>, <a href="veri/konu09.json">veri/konu09.json</a>, <a href="veri/konu10.json">veri/konu10.json</a>, <a href="veri/konu11.json">veri/konu11.json</a> ve <a href="veri/konu12.json">veri/konu12.json</a> dosyalarından ulaşabilirsiniz.</p></noscript></div>
</main>
<footer class="foot"><div class="wrap">
  <p><b>Kaynaklar.</b> Arapça metin: Tanzil Projesi, Uthmani metni v1.1 (Hafs), tanzil.net, Creative Commons Attribution 3.0. Metin değiştirilmeden kullanılmıştır. Türkçe meal: Prof. Dr. Yaşar Nuri Öztürk, <i>Kur'an Meali</i>. Yalnız sayfada gösterilen ayetlerin meali kullanılmıştır.</p>
  <details class="lic"><summary>Tanzil telif bildirimi</summary><pre>${esc(telif)}</pre></details>
  <p class="muted">Tarama ve okuma betikleri: <code>emir-yasak-atlasi/tarama/</code> ve <code>okuma/</code>. Kayıtların tamamı <code>okuma/k01_kayit.tsv</code>, <code>okuma/k02_kayit.tsv</code>, <code>okuma/k03_kayit.tsv</code>, <code>okuma/k04_kayit.tsv</code>, <code>okuma/k05_kayit.tsv</code>, <code>okuma/k06_kayit.tsv</code>, <code>okuma/k07_kayit.tsv</code>, <code>okuma/k08_kayit.tsv</code>, <code>okuma/k09_kayit.tsv</code>, <code>okuma/k10_kayit.tsv</code>, <code>okuma/k11_kayit.tsv</code> ve <code>okuma/k12_kayit.tsv</code> dosyalarındadır; her satır kendi ayet numarasıyla doğrulanabilir.</p>
</div></footer>
<script id="meta" type="application/json">${JSON.stringify(meta).replaceAll('<', '\\u003c')}</script>
<script>${js}</script>
</body>
</html>
`;
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log('index.html yazıldı:', (html.length / 1024).toFixed(1), 'KB; özet:', JSON.stringify(ozet));
