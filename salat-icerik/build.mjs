// Salâtın İçeriği Atlası sayfasını üretir: node salat-icerik/build.mjs
// İçerik content.mjs içindedir; görünüm src/style.css ve src/app.js içindedir.
// Sayfa elle değil, bu dosyayla üretilir; index.html'deki elle düzeltmeler bir sonraki üretimde kaybolur.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { names, meals, notes, topics, answer, openQuestions, openNote, ynNotes } from './content.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const corpusPath = path.join(dir, '../data/quran-uthmani-tanzil-v1.1.txt');
const corpus = fs.readFileSync(corpusPath, 'utf8');
const verses = new Map(corpus.split(/\r?\n/).filter(line => /^\d+\|\d+\|/.test(line)).map(line => {
  const [s, a, ...rest] = line.split('|');
  return [`${s}:${a}`, rest.join('|')];
}));
if (verses.size !== 6236) throw new Error("Kur'ân metni 6236 ayet olmalı.");
const sha = crypto.createHash('sha256').update(corpus).digest('hex');
const copyrightStart = corpus.indexOf('# PLEASE DO NOT REMOVE');
if (copyrightStart < 0) throw new Error('Tanzil telif bildirimi bulunamadı.');
const copyright = corpus.slice(copyrightStart).split('\n').map(line => line.trimEnd()).join('\n');

const css = fs.readFileSync(path.join(dir, 'src/style.css'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'src/app.js'), 'utf8');
const VERSION = 'v0.5.1';
const DATE = '12 Ekim 2026';
const BASMALA = verses.get('1:1'); // Fâtiha 1: besmelenin kaynak metindeki harfi harfine yazımı

const esc = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const suraOf = key => Number(key.split(':')[0]);
const ref = key => `${names[suraOf(key)]} ${key.split(':')[1]}`;
const cid = key => `ayet-${key.replace(':', '-')}`;

// Denetim: her ayet bir kez, tam Arapça, tam meal, bilinen sure adı.
const allKeys = topics.flatMap(t => t.keys);
const keySet = new Set(allKeys);
if (keySet.size !== allKeys.length) {
  const seen = new Set();
  const dup = allKeys.filter(k => seen.has(k) || !seen.add(k));
  throw new Error('Tekrarlanan ayet: ' + dup.join(', '));
}
for (const key of allKeys) {
  if (!verses.has(key)) throw new Error(`Arapça metin yok: ${key}`);
  if (!meals[key]) throw new Error(`Meal yok: ${key}`);
  if (!names[suraOf(key)]) throw new Error(`Sure adı yok: ${key}`);
  if (/\.\.\.|…/.test(meals[key])) throw new Error(`Kesilmiş meal: ${key}`);
}
for (const key of Object.keys(meals)) if (!keySet.has(key)) throw new Error(`Kullanılmayan meal: ${key}`);
for (const key of Object.keys(notes)) if (!keySet.has(key)) throw new Error(`Kullanılmayan not: ${key}`);
const ynDoc = JSON.parse(fs.readFileSync(path.join(dir, 'yasar-nuri-meal.json'), 'utf8'));
const yn = ynDoc.ayetler;
for (const key of allKeys) {
  if (!yn[key] || !yn[key].trim()) throw new Error(`Yaşar Nuri meali yok: ${key}`);
  if (!Array.isArray(ynNotes[key]) || !ynNotes[key].length) throw new Error(`Meal ile Arapça notu yok: ${key}`);
}
for (const key of Object.keys(yn)) if (!keySet.has(key)) throw new Error(`Kullanılmayan Yaşar Nuri meali: ${key}`);
for (const key of Object.keys(ynNotes)) if (!keySet.has(key)) throw new Error(`Kullanılmayan karşılaştırma notu: ${key}`);
const topicOf = new Map();
topics.forEach(t => t.keys.forEach(k => topicOf.set(k, t)));
const N = allKeys.length;

const link = key => {
  if (!keySet.has(key)) throw new Error(`Bağlantı hedefi yok: ${key}`);
  return `<a href="#${cid(key)}">${esc(ref(key))}</a>`;
};
const refs = keys => keys.map(link).join(', ');
const VAKIT = '<a href="../salat-vakit/">Vakit Atlası</a>';
// [[2:43,2:45]] → bağlantılar; [[vakit]] → Vakit Atlası bağlantısı.
const topicLink = id => {
  const t = topics.find(x => x.id === id);
  if (!t) throw new Error(`Konu yok: ${id}`);
  return `<a href="#konu-${t.id}">${esc(t.title)}</a>`;
};
// [[#esneklik]] → konu bağlantısı.
const rich = text => esc(text).replace(/\[\[([^\]]+)\]\]/g, (_, list) =>
  list === 'vakit' ? VAKIT : list.startsWith('#') ? topicLink(list.slice(1)) : list.split(',').map(k => link(k.trim())).join(', '));

const MK = { y: ['✓', 'Ayette yazılı'], c: ['→', 'Çıkarım'], a: ['?', 'Açık'] };
const mk = level => `<span class="mk ${level}" role="img" aria-label="${MK[level][1]}">${MK[level][0]}</span>`;
const legend = () => `<p class="legend">${['y', 'c', 'a'].map(l => `<span>${mk(l)} ${MK[l][1]}</span>`).join('')}</p>`;

// Yaşar Nuri meali ve karşılaştırma satırı
const CMP = {
  u: ['✓', 'Uyumlu'],
  e: ['+', 'Açıklayıcı ekleme'],
  t: ['≈', 'Çeviri tercihi'],
  f: ['≠', 'Anlam farkı']
};
const cmpChip = type => `<span class="cmp-chip c-${type}"><span aria-hidden="true">${CMP[type][0]}</span> ${CMP[type][1]}</span>`;
function ynBlock(key) {
  const items = ynNotes[key];
  for (const [type] of items) if (!CMP[type]) throw new Error(`Bilinmeyen karşılaştırma türü: ${key} ${type}`);
  let body;
  if (items.length === 1 && items[0][0] === 'u') {
    body = `<p class="cmp cmp-u"><span class="cmp-label">Meal ile Arapça:</span> ${cmpChip('u')}${items[0][1] ? ' ' + rich(items[0][1]) : ''}</p>`;
  } else {
    if (items.some(([type]) => type === 'u')) throw new Error(`“Uyumlu” başka türlerle karışık olamaz: ${key}`);
    body = `<div class="cmp cmp-list"><p class="cmp-label">Meal ile Arapça:</p><ul>${items.map(([type, text]) => `<li>${cmpChip(type)} ${rich(text)}</li>`).join('')}</ul></div>`;
  }
  return `<div class="yn m-yn"><p class="meal-yn"><span class="meal-label">Yaşar Nuri Öztürk meali</span><span class="yn-text">${esc(yn[key])}</span></p>
${body}</div>`;
}
const cmpCount = type => allKeys.filter(k => ynNotes[k].some(([t]) => t === type)).length;

// Ayet kartı
function card(key) {
  const topic = topicOf.get(key);
  let arabic = verses.get(key);
  let basmala = '';
  if (arabic.startsWith(BASMALA + ' ')) {
    arabic = arabic.slice(BASMALA.length + 1);
    basmala = `<p class="basmala" lang="ar" dir="rtl">${esc(BASMALA)}</p><p class="basmala-note">Sure başındaki besmele: “Rahmân ve Rahîm Allah'ın adıyla.” Ayet numarasına dahil değildir.</p>`;
  }
  return `<article class="verse-card reveal" id="${cid(key)}" data-key="${key}" data-topic-title="${esc(topic.title)}">
<div class="vc-head"><h3>${esc(ref(key))}</h3><div class="vc-tools"><button type="button" class="btn copy" aria-label="${esc(ref(key))} ayetini kopyala">Kopyala</button><a class="btn source-link" href="https://tanzil.net/#${key}" target="_blank" rel="noopener">Tanzil'de aç</a></div></div>
${basmala}<p class="arabic" lang="ar" dir="rtl">${esc(arabic)}</p>
<p class="meal m-cal"><span class="meal-label">Tam çalışma meali</span><span class="meal-text">${esc(meals[key])}</span></p>
${ynBlock(key)}
${notes[key] ? `<p class="reading-note"><strong>Okuma notu:</strong> ${rich(notes[key])}</p>` : ''}
</article>`;
}

// Çizimler
let stagger = 0;
const sbox = (level, title, sub, keys = []) => `<div class="sbox ${level}" style="--i:${stagger++}">${mk(level)}<div><b>${esc(title)}</b>${sub ? `<span class="sub">${esc(sub)}</span>` : ''}${keys.length ? `<span class="refs">${refs(keys)}</span>` : ''}</div></div>`;

function sceneFig() {
  stagger = 0;
  return `<figure class="fig reveal" aria-labelledby="sahne-h">
<div class="fig-head"><h2 id="sahne-h">Ayetlerde salât sahnesi: önce, içinde, sonra</h2><p class="fig-sub">Kutuların rengi ve işareti kanıt derecesini gösterir.</p></div>
<div class="scene">
<div class="phase"><h3><span class="pn">1</span> Önce</h3>
${sbox('y', 'Bilinç', 'ne söylediğini bilmek', ['4:43'])}
${sbox('y', 'Temizlik', 'yüz, eller, baş, ayaklar', ['5:6'])}
${sbox('y', 'Su yoksa', 'temiz zemin; yüz ve eller', ['4:43', '5:6'])}
${sbox('y', 'Çağrı', 'salâta ve cumaya çağrı', ['5:58', '62:9'])}
</div>
<div class="flow" aria-hidden="true">→</div>
<div class="phase mid"><h3><span class="pn">2</span> İçinde</h3><p class="ph-note">Bu kutuların sırası ayetlerde verilmez.</p>
<div class="mid-grid">
${sbox('y', 'Ayakta durma', 'salât ederken ayakta', ['3:39', '2:238'])}
${sbox('y', 'Secde', 'salât sahnesinde', ['4:102'])}
${sbox('c', 'Rükû', 'salât emriyle yan yana', ['2:43', '5:55'])}
${sbox('y', 'Ses', 'ne yüksek ne gizli', ['17:110'])}
${sbox('c', 'Söz', 'ne söylediğini bilmek', ['4:43'])}
${sbox('c', 'Yön', 'Mescid-i Harâm', ['2:144', '10:87'])}
${sbox('y', 'Huşû', 'salâtın içinde', ['23:2'])}
</div></div>
<div class="flow" aria-hidden="true">→</div>
<div class="phase"><h3><span class="pn">3</span> Sonra</h3>
${sbox('y', "Allah'ı anma", 'ayakta, oturarak, yan yatarak', ['4:103'])}
${sbox('y', 'Cumada dağılma', "Allah'ın lütfunu arama", ['62:10'])}
</div>
</div>
<div class="band">
${sbox('y', 'Zor koşulda kolaylık', 'yaya ya da binek üzerinde; salâttan kısaltma', ['2:239', '4:101'])}
${sbox('y', 'Okumada ölçü: kolayınıza gelen', '“Kur\'an\'dan kolayınıza geleni okuyun”', ['73:20'])}
${sbox('a', 'Bölüm (rekât) sayısı', 'ayette yazmaz; Nisâ 102 için araştırma notu Konular sekmesinde', ['4:102'])}
${sbox('a', 'Ayetlerde yazmayanlar', 'hareketlerin sırası · el ve oturuş biçimi · salât içindeki dua metni')}
</div>
${legend()}
</figure>`;
}

function wuduFig() {
  const verse = verses.get('5:6');
  const W = {
    wash: 'فَٱغْسِلُوا۟', faces: 'وُجُوهَكُمْ', hands: 'وَأَيْدِيَكُمْ', elbows: 'إِلَى ٱلْمَرَافِقِ',
    wipe: 'وَٱمْسَحُوا۟', heads: 'بِرُءُوسِكُمْ', feet: 'وَأَرْجُلَكُمْ', ankles: 'إِلَى ٱلْكَعْبَيْنِ'
  };
  for (const word of Object.values(W)) if (!verse.includes(word)) throw new Error('Mâide 6 kelimesi kaynakta yok: ' + word);
  stagger = 0;
  const w = (ar, tr, cls = '', kase = '') => `<span class="w ${cls}" style="--i:${stagger++}"><span class="ar" lang="ar" dir="rtl">${esc(ar)}</span><span class="tr">${esc(tr)}</span>${kase ? `<span class="case ${kase}">${kase === 'ustun' ? 'üstün' : 'esre'}</span>` : ''}</span>`;
  const arr = '<span class="arr" aria-hidden="true">→</span>';
  return `<figure class="fig reveal" aria-labelledby="mesh-h">
<div class="fig-head"><h3 id="mesh-h">Mâide 6: Ayaklar hangi emre bağlı?</h3><p class="fig-sub">Kelimenin son harekesi ve cümledeki yeri iki ayrı okumaya imkân verir.</p></div>
<div class="wudu">
<div class="sent">${w(W.wash, 'Yıkayın', 'verb')}${arr}${w(W.faces, 'yüzlerinizi', '', 'ustun')}${w(W.hands, 've ellerinizi', '', 'ustun')}${w(W.elbows, 'dirseklere kadar')}</div>
<div class="sent">${w(W.wipe, 'Meshedin', 'verb')}${arr}${w(W.heads, 'başlarınızı', '', 'esre')}</div>
<div class="sent"><span class="w q" style="--i:${stagger++}"><span class="tr">Hangi emir?</span></span>${arr}${w(W.feet, 've ayaklarınızı', '', 'ustun')}${w(W.ankles, 'topuklara kadar')}</div>
</div>
<div class="opts">
<div class="opt"><h4>${mk('c')} Okuma A: ayaklar → yıkayın</h4><p>Dayanağı: “ayaklarınızı” kelimesi, “yüzlerinizi” ve “ellerinizi” gibi üstünle biter; eller ve ayaklar için benzer sınırlar verilir (dirseklere kadar, topuklara kadar).</p></div>
<div class="opt"><h4>${mk('c')} Okuma B: ayaklar → meshedin</h4><p>Dayanağı: ayaklar, başlardan hemen sonra gelir. “Başlarınızı” esreyle bitse de cümlede nesne yerindedir; üstünlü bir kelime bu yere bağlanabilir (Arapçada bilinen bir yapı).</p></div>
</div>
<p class="fig-foot"><b>Sonuç:</b> İki okuma da dilce mümkündür; bu sayfa birini seçmez. Su bulunamazsa yalnız yüz ve eller meshedilir; ayaklar anılmaz. ${refs(['4:43', '5:6'])}</p>
</figure>`;
}

function secdeFig() {
  return `<figure class="fig reveal" aria-labelledby="secde-h">
<div class="fig-head"><h3 id="secde-h">Secde ve rükû kelimeleri ne anlatıyor?</h3><p class="fig-sub">Üst sıradaki üç kutu ayette yazılı kullanımlardır.</p></div>
<div class="sec">
<div class="col"><h4>${mk('y')} Secde: bedenle yere kapanma</h4><ul>
<li>“Kendilerine okunduğunda çeneleri üzerine secde ederek kapanırlar.” ${refs(['17:107'])}</li>
<li>“Ağlayarak çeneleri üzerine kapanırlar.” ${refs(['17:109'])}</li></ul></div>
<div class="col"><h4>${mk('y')} Secde: bütün varlıkların boyun eğişi</h4><ul>
<li>Göklerde ve yerde olanlar, güneş, ay, yıldızlar, dağlar, ağaçlar ve canlılar Allah'a secde eder. ${refs(['22:18'])}</li></ul></div>
<div class="col"><h4>${mk('y')} Rükû: yere kapanarak</h4><ul>
<li>Dâvûd “rükû ederek yere kapandı.” ${refs(['38:24'])}</li></ul></div>
<p class="sec-foot">${mk('c')}<span><b>Çıkarım:</b> Salât sahnesindeki secde, bedenle yere kapanma anlamıyla uyumludur: grup secde eder, sonra arkaya geçer. ${refs(['4:102'])}</span></p>
<p class="sec-foot a">${mk('a')}<span><b>Açık:</b> Rükûnun tam beden biçimi (eğilmek mi, yere kapanmak mı) ayetlerde tarif edilmez.</span></p>
</div>
</figure>`;
}

function condFig() {
  stagger = 0;
  const row = (sit, rule, keys, extra) => `<div class="cond" style="--i:${stagger++}"><span class="sit">${esc(sit)}</span><span class="arr" aria-hidden="true">→</span><span class="rule">${esc(rule)}${extra ? ` <em>${esc(extra)}</em>` : ''}<span class="refs">${refs(keys)}</span></span></div>`;
  return `<figure class="fig reveal" aria-labelledby="kosul-h">
<div class="fig-head"><h3 id="kosul-h">Hangi durumda ne denir?</h3><p class="fig-sub">Koşul ağırlaştıkça salât bırakılmaz, hafifletilir.</p></div>
<div class="conds">
${row('Güvendeyken', 'Salâtı ikame edin (olağan hâl).', ['4:103'])}
${row('Korku varken', 'Yaya olarak ya da binek üzerinde.', ['2:239'])}
${row('Yolculuk ve saldırı korkusu', 'Salâttan kısaltmakta günah yoktur.', ['4:101'], 'Ne kadar kısaltılacağı yazmaz.')}
${row('Savaş ortamında topluluk', 'İki grup nöbetleşir; silah ve tedbir alınır.', ['4:102'])}
${row('Salât bitince', 'Ayakta, oturarak, yan yatarak Allah anılır.', ['4:103'])}
</div>
</figure>`;
}

function usageFig() {
  stagger = 0;
  const u = (who, to, quote, keys, main) => `<div class="u${main ? ' main' : ''}" style="--i:${stagger++}"><div class="who">${esc(who)} <span class="to">→ ${esc(to)}</span></div><q>${esc(quote)}</q><span class="refs">${refs(keys)}</span></div>`;
  return `<figure class="fig reveal" aria-labelledby="kullanim-h">
<div class="fig-head"><h3 id="kullanim-h">Salât kelimesi kimler için kullanılıyor?</h3><p class="fig-sub">Hepsi ayette yazılı kullanımlardır. Bu sayfanın asıl konusu ilk kutudur.</p></div>
<div class="usage">
${u('İnsan', 'Allah için', 'Beni anmak için salâtı ikame et.', ['20:14', '2:238'], true)}
${u('Allah ve melekler', 'müminler ve peygamber için', 'Sizi karanlıklardan aydınlığa çıkarmak için üzerinize salât eden, O ve melekleridir.', ['33:43', '33:56', '2:157'])}
${u('Elçi', 'insanlar için', 'Üzerlerine salât et; senin salâtın onlar için huzurdur.', ['9:103', '9:99'])}
${u('Her varlık', 'kendi salâtı', 'Her biri kendi salâtını ve tesbîhini bilmiştir.', ['24:41'])}
${u('Bir yapının adı', 'salavât', "Savâmi', biya', salavât ve mescitler yıkılırdı.", ['22:40'])}
${u('Eleştirilen uygulama', 'evin yanında', 'Onların evin yanındaki salâtı, mükâ ve tasdiyeden başka bir şey değildi.', ['8:35'])}
<div class="u-strip">${mk('c')}<span><b>Çıkarım (dil yapısı):</b> Nûr 41'de salât ile tesbîh “ve” ile ayrı ayrı anılır; en doğal okumada ayet ikisini özdeş saymaz. Aralarında ortak bir alan olup olmadığı ayrı bir sorudur. ${refs(['24:41', '24:36'])}</span></div>
</div>
</figure>`;
}

function rekatFig() {
  stagger = 0;
  const cell = (cls, text, quote) => `<span class="tl-cell ${cls}" role="cell" style="--i:${stagger++}">${esc(text)}${quote ? `<small>“${esc(quote)}”</small>` : ''}</span>`;
  const row = (who, a, b) => `<div class="tl-row" role="row"><span class="tl-who" role="rowheader">${esc(who)}</span>${a}${b}</div>`;
  return `<figure class="fig reveal" aria-labelledby="rekat-h">
<div class="fig-head"><h3 id="rekat-h">Nisâ 102: Korku salâtında sıra</h3><p class="fig-sub">Sıra ayette yazılıdır; bölümleri saymak bir araştırma notudur.</p></div>
<div class="tl" role="table" aria-label="Nisâ 102'ye göre korku salâtında elçinin ve iki grubun sırası">
<div class="tl-row tl-head" role="row"><span role="columnheader"><span class="sr">Kim</span></span><span role="columnheader">1. bölüm <em>(çıkarım)</em></span><span role="columnheader">2. bölüm <em>(çıkarım)</em></span></div>
${row('Elçi', cell('pray', 'Onlar için salâtı ikame eder', ''), cell('pray', 'Salâta devam eder', ''))}
${row('1. grup', cell('pray', 'Elçiyle kalkar, secde eder', 'Secde edince arkanızda olsunlar'), cell('guard', 'Arkada nöbette, silahlı', ''))}
${row('2. grup', cell('guard', 'Nöbette, silahlı', ''), cell('pray', 'Gelir, elçiyle salât eder', 'Salât etmemiş diğer grup gelsin'))}
</div>
<div class="tl-foot">
<p class="sec-foot y">${mk('y')}<span><b>Ayette yazılı:</b> grupların sırası; “secde edince arkanızda olsunlar” emri; ikinci grubun “salât etmemiş” diye anılması. ${refs(['4:102'])}</span></p>
<p class="sec-foot">${mk('c')}<span><b>Dil yapısı:</b> “Arkanızda olsunlar” fiilinin öznesi en doğal okumada secde eden gruptur: secde eden grup arkaya geçer.</span></p>
<p class="sec-foot">${mk('c')}<span><b>Hitap:</b> Nisâ 102'de elçiye tekil (“sen”, “seninle”), Nisâ 101 ve 103'te müminlere çoğul hitap edilir. Çoğul hitap elçiyi dışarıda bırakmaz. ${refs(['4:101', '4:103'])}</span></p>
<div class="branch" aria-label="Araştırma notu: elçi kısaltmadıysa ya da kısalttıysa olağan salât">
<p class="branch-lab">${mk('c')}<span><b>Araştırma notu:</b> elçinin salâtı en az iki bölümse, olağan salât için iki durum vardır</span></p>
<div class="branch-row"><div class="branch-box"><b>Elçi kısaltmadıysa</b><span>olağan salât = iki bölüm</span></div><div class="branch-box"><b>Elçi kısalttıysa</b><span>olağan salât = ikiden fazla bölüm</span></div></div>
<div class="branch-result"><b>İki durumda da: olağan salât en az iki bölüm.</b> <span>Dayandığı iki varsayım: elçi iki grupla aynı salâtı sürdürür; her grubun katıldığı kısım bir bölümdür. Korku için anılan tek değişiklik kısaltmadır. ${refs(['4:102', '4:101'])}</span></div>
<p class="branch-weak"><b>Daha zayıf kısım:</b> korkuda kişi başına bir bölüm. Birinci grubun o bölümle salâtını tamamlamış sayılmasına dayanır; ayette açıkça yazmaz.</p>
</div>
<p class="sec-foot a">${mk('a')}<span><b>Açık:</b> Ayette “rekât” kelimesi ve bir sayı geçmez; birinci grubun kalanı sonradan tamamlayıp tamamlamadığı yazmaz. Bu yüzden araştırma notu kesin değildir.</span></p>
</div>
</figure>`;
}

function esneklikFig() {
  stagger = 0;
  const edge = (text, key) => `<span class="edge-chip" style="--i:${stagger++}">${esc(text)} <span class="refs">${refs([key])}</span></span>`;
  const item = (level, text, keys) => `<li style="--i:${stagger++}">${mk(level)}<span>${esc(text)} <span class="refs">${refs(keys)}</span></span></li>`;
  return `<figure class="fig reveal" aria-labelledby="esneklik-h">
<div class="fig-head"><h3 id="esneklik-h">Yazılı sınırlar ve metni verilmeyen alan</h3><p class="fig-sub">Dış çerçeve ayette yazılı sınırlardır; iç alanda sabit bir metin verilmez.</p></div>
<div class="frame">
<p class="frame-lab">${mk('y')} Ayette yazılı sınırlar</p>
<div class="frame-edge">${edge('Ne söylediğini bilmek', '4:43')}${edge('Orta ses', '17:110')}${edge('Huşû', '23:2')}${edge('Allah\'ı anmak', '20:14')}</div>
<div class="frame-core">
<p class="frame-lab">Sabit metni verilmeyen alan</p>
<ul class="core-list">
${item('y', 'Kur\'an\'dan okunacak kısım: “kolayınıza gelen”', ['73:20'])}
${item('y', 'Allah\'a hangi güzel isimle çağrılacağı', ['17:110'])}
${item('c', 'Dua ve övgü: kişinin kendi sözleriyle (araştırma notu)', ['2:186', '17:110'])}
</ul>
</div>
</div>
${legend()}
</figure>`;
}

const graphics = { hazirlik: wuduFig, kelime: secdeFig, korku: () => rekatFig() + condFig(), ayrim: usageFig, esneklik: esneklikFig };

function levels(t) {
  const li = s => `<li>${rich(s)}</li>`;
  const TAG = { dil: 'dil yapısı', baglam: 'birlikte okuma', olasi: 'araştırma notu' };
  const cli = ([kind, s]) => { if (!TAG[kind]) throw new Error('Bilinmeyen çıkarım türü: ' + kind); return `<li><span class="tag ${kind}">${TAG[kind]}</span>${rich(s)}</li>`; };
  return `<div class="levels">
<div class="lv y"><h3>${mk('y')} Ayette yazılı</h3><ul>${t.y.map(li).join('')}</ul></div>
<div class="lv c"><h3>${mk('c')} Çıkarım</h3><ul>${t.c.map(cli).join('')}</ul></div>
<div class="lv a"><h3>${mk('a')} Açık kalan</h3><ul>${t.a.map(li).join('')}</ul></div>
</div>`;
}

function topicSection(t, i) {
  const prev = topics[i - 1];
  const next = topics[i + 1];
  return `<section class="topic" id="konu-${t.id}" data-topic="${t.id}" data-title="${esc(t.title)}" aria-labelledby="h-${t.id}">
<div class="topic-intro">
<p class="t-kicker">Konu ${i + 1} / ${topics.length} · ${t.keys.length} ayet</p>
<h2 id="h-${t.id}">${esc(t.title)}</h2>
<p class="t-sum">${esc(t.summary)}</p>
${levels(t)}
${graphics[t.id] ? graphics[t.id]() : ''}
</div>
<h3 class="cards-title">Tam ayetler ve tam mealler</h3>
<div class="verse-list">
${t.keys.map(card).join('\n')}
</div>
<nav class="tnav" aria-label="Konular arasında geçiş">${prev ? `<a class="btn" href="#konu-${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn" href="#konu-${next.id}">${esc(next.title)} →</a>` : ''}</nav>
</section>`;
}

const ilist = items => `<ul class="ilist">${items.map(x => `<li>${rich(x)}</li>`).join('')}</ul>`;
const answerBox = `<section class="answer reveal" aria-labelledby="cevap-h">
<h2 id="cevap-h">Kısa cevap</h2>
<p class="big">Kur'an salâtın <strong>neden</strong> kılındığını ve <strong>nasıl hazırlanılacağını</strong> anlatır; <strong>ayakta durma, secde ve ses ölçüsünü</strong> salât sahnelerinde açıkça verir. Rükû ve kıble, salâtla birlikte okunarak bağlanır. Okumada ölçü <strong>“Kur'an'dan kolayınıza geleni okuyun”</strong> sözüdür. <strong>Rekât sayısını, hareketlerin sırasını ve salât içinde söylenecek sabit bir dua metnini ayrıntılı bir tarif olarak vermez.</strong> Bu boşluklar hakkındaki olası okumalar (bölüm sayısı, dua ve övgüde serbestlik) Konular sekmesinde varsayımlarıyla birlikte araştırma notu olarak verilir.</p>
<div class="rows">
<div class="row y"><span class="lab">${mk('y')} Ayette yazılı</span>${ilist(answer.y)}</div>
<div class="row c"><span class="lab">${mk('c')} Çıkarım</span>${ilist(answer.c)}</div>
<div class="row a"><span class="lab">${mk('a')} Açık</span>${ilist(answer.a)}</div>
</div>
</section>`;

const topicCards = `<div class="tgrid">${topics.map((t, i) => `<a class="tcard reveal" href="#konu-${t.id}"><span class="tn">Konu ${i + 1}</span><b>${esc(t.title)}</b><span class="s">${esc(t.short)}</span><span class="cnt">${t.keys.length} ayet →</span></a>`).join('')}</div>`;

const logo = `<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><rect width="30" height="30" rx="8" fill="var(--accent)"/><path d="M8 20.5h14" stroke="var(--on-accent)" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="13" r="4.2" fill="none" stroke="var(--on-accent)" stroke-width="2"/></svg>`;

const tabsDef = [['ozet', 'Özet'], ['konular', 'Konular<span class="long"> ve ayetler</span>'], ['acik', 'Açık sorular'], ['yontem', 'Yöntem<span class="long"> ve kaynak</span>']];

const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kur'ân'da Salâtın İçeriği Atlası ${VERSION}</title>
<meta name="description" content="Kur'an salâtın içeriği hakkında ne söylüyor, ne söylemiyor? Amaç, hazırlık, kıble, ayakta durma, rükû, secde, okuma ve ses, birlikte salât ve zor koşullar: ${N} ayet, tam Arapça metin ve tam Türkçe mealle.">
<meta name="theme-color" content="#17604a">
<meta property="og:title" content="Kur'ân'da Salâtın İçeriği Atlası">
<meta property="og:description" content="Kur'an salâtın içeriği hakkında ne söylüyor, ne söylemiyor? ${N} ayet, tam Arapça metin ve tam Türkçe mealle.">
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
${css}</style></head><body>
<a class="skip" href="#ana">İçeriğe geç</a>
<header class="top"><div class="wrap"><a class="brand" href="./">${logo}<span>Salâtın İçeriği Atlası</span></a><div class="tools"><span class="fs" role="group" aria-label="Yazı boyutu"><button class="btn" type="button" data-fs="-1" aria-label="Yazıyı küçült">A−</button><span id="fs-val" class="fs-val">100%</span><button class="btn" type="button" data-fs="1" aria-label="Yazıyı büyüt">A+</button></span><a class="btn" href="../salat-vakit/">Vakit Atlası →</a></div></div></header>
<nav class="tabbar" aria-label="Sayfa bölümleri"><div class="wrap"><div class="tablist" role="tablist">
${tabsDef.map(([id, label], i) => `<button class="tab" type="button" role="tab" id="tab-${id}" data-tab="${id}" aria-controls="${id}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}><span class="n">${i + 1}</span><span class="lbl">${label}</span></button>`).join('\n')}
</div></div></nav>
<main id="ana"><div class="wrap">

<section class="panel" id="ozet" role="tabpanel" aria-labelledby="tab-ozet">
<p class="kicker">${VERSION} · Araştırma taslağı · Yalnız Kur'an metni</p>
<h1>Kur'an salâtın içeriği hakkında ne söylüyor?</h1>
<p class="lead">Salâtın amacı, hazırlığı, yönü, bedenle yapılan kısımları, okuma ve ses, birlikte kılınması ve zor koşullardaki kolaylık. ${N} ayet, tam Arapça metin ve tam Türkçe mealle.</p>
${answerBox}
${sceneFig()}
<section aria-labelledby="konular-h"><div class="fig-head"><h2 id="konular-h">${topics.length} konu</h2><p class="fig-sub">Bir konuya tıklayın: özeti ve bütün ayetleri açılır.</p></div>
${topicCards}
</section>
<p class="notice" style="margin-top:22px">Bu sayfa bir fetva ya da uygulama kılavuzu değildir. Kaç vakit sorusu ayrı ${VAKIT}'nda incelenir.</p>
</section>

<section class="panel" id="konular" role="tabpanel" aria-labelledby="tab-konular">
<h2>Konular ve ayetler</h2>
<p class="muted">Bir konu seçin ya da arayın. Arama bütün konularda yapılır.</p>
<div class="finder"><label for="search">Ayet ya da kelime ara<input id="search" type="search" placeholder="namaz, abdest, secde, Bakara 238" autocomplete="off" enterkeyhint="search"></label><button type="button" class="btn" id="reset">Temizle</button></div>
<div class="chips" role="group" aria-label="Konu seç"><button type="button" class="chip" data-topic="all" aria-pressed="false">Hepsi <span class="k">${N}</span></button>${topics.map((t, i) => `<button type="button" class="chip" data-topic="${t.id}" aria-pressed="${i === 0}">${i + 1}. ${esc(t.title)} <span class="k">${t.keys.length}</span></button>`).join('')}</div>
<div class="mealsel" role="group" aria-label="Gösterilecek meal"><span class="ms-lab">Gösterilen meal:</span><button type="button" class="chip ms" data-meal="both" aria-pressed="true">İkisi de</button><button type="button" class="chip ms" data-meal="cal" aria-pressed="false">Çalışma meali</button><button type="button" class="chip ms" data-meal="yn" aria-pressed="false">Yaşar Nuri</button></div>
<p id="count" role="status" aria-live="polite"></p>
<div id="empty" class="empty" hidden><strong>Sonuç bulunamadı.</strong> Başka bir kelime deneyin: namaz, abdest, secde, kıble, Bakara 238.</div>
<noscript><p class="notice">Arama ve konu seçimi için JavaScript gerekir; bütün konular ve ayetler aşağıda tam olarak okunabilir.</p></noscript>
<div id="topic-list" data-meal="both">
${topics.map(topicSection).join('\n')}
</div>
</section>

<section class="panel" id="acik" role="tabpanel" aria-labelledby="tab-acik">
<h2>Açık sorular</h2>
<p class="lead">Bunlar incelenen ayetlerde yazmayan ya da ayetlerle kapanmayan konulardır. “Açık” demek “Kur'an'da kesinlikle yok” demek değildir; “bu çalışmada ayetlerle kapanmadı” demektir.</p>
<p class="notice">${rich(openNote)}</p>
<ul class="oq">${openQuestions.map(q => `<li class="reveal"><h3>${mk('a')} ${esc(q.t)}</h3><p>${rich(q.d)}</p></li>`).join('')}</ul>
</section>

<section class="panel" id="yontem" role="tabpanel" aria-labelledby="tab-yontem">
<h2>Yöntem ve kaynak</h2>
<h3>Kanıt dereceleri</h3>
<div class="grades">
<div class="grade y"><b>${mk('y')} Ayette yazılı</b><span>Ayetin kendi sözlerinde açıkça bulunan bilgi. Örnek: “Secde ettiklerinde arkanızda olsunlar.” ${link('4:102')}</span></div>
<div class="grade c"><b>${mk('c')} Çıkarım · dil yapısı</b><span>Arapça kelimenin son harekesinden, bağlaçtan ya da cümle yapısından çıkan sonuç. Örnek: anmanın ardından salâtın gelmesi (“fe” bağlacı). ${link('87:15')}</span></div>
<div class="grade c"><b>${mk('c')} Çıkarım · araştırma notu</b><span>Birden çok varsayıma dayanan, başka okumalara da açık sonuç. Varsayımları yanında yazılır; ana sonuç olarak sunulmaz. Örnek: Nisâ 102'den bölüm sayısı. ${link('4:102')}</span></div>
<div class="grade c"><b>${mk('c')} Çıkarım · birlikte okuma</b><span>Birden çok ayeti ve kime söylendiklerini birlikte okuyarak kurulan bağlantı. Örnek: rükûnun salâtın içindeki yeri. ${link('2:43')}</span></div>
<div class="grade a"><b>${mk('a')} Açık</b><span>Bu çalışmada ayetlerle kapanmayan konu. Örnek: rekât sayısı.</span></div>
</div>
<h3>Kurallar</h3>
<ul class="method">
<li><strong>Yalnız Kur'an.</strong> Hadis, tefsir, mezhep, gelenek ya da dış sözlük kanıt olarak kullanılmaz.</li>
<li><strong>Arapça metin.</strong> Tanzil'in Resm-i Osmânî imlâsıyla (Hz. Osman mushafının yazımı; Uthmani) yazılmış metninden harfi harfine alınır; değiştirilmez.</li>
<li><strong>Besmele.</strong> Bazı surelerin başındaki besmele, kaynak dosyada o surenin ilk ayetiyle aynı satırdadır. Burada sure başlığı olarak ayrı gösterilir; ayet numarasına dahil değildir.</li>
<li><strong>Türkçe mealler.</strong> Her ayette iki meal vardır. <em>Tam çalışma meali</em>: bu proje için yapay zekâ yardımıyla (ChatGPT ve Claude) hazırlanmış, Arapçaya yakın tutulmuş meal; yayımlanmış bir mealden alınmadı ve bir Arapça uzmanı tarafından ayrıca okunmadı. <em>Yaşar Nuri Öztürk meali</em>: ${esc(ynDoc.kaynak)}. Metin olduğu gibi alınır; yalnız iki PDF aktarım hatası düzeltildi (Fetih 29, Nisâ 102). Konular sekmesinde hangi mealin gösterileceği seçilebilir.</li>
<li><strong>Meal ile Arapça.</strong> Yaşar Nuri mealinin her ayetteki durumu dört türle gösterilir; bir ayette birden çok tür olabilir. <em>✓ Uyumlu</em>: meal Arapçanın anlamını korur (${cmpCount('u')} ayet). <em>+ Açıklayıcı ekleme</em>: meal Arapçada olmayan bir söz ekler (${cmpCount('e')} ayet). <em>≈ Çeviri tercihi</em>: Arapça kelime birden çok anlama gelebilir; meal birini ya da yorum içeren bir karşılığı seçer (${cmpCount('t')} ayet). <em>≠ Anlam farkı</em>: meal ayetin söylediğini değiştirir; özne ya da kapsam değişir veya Arapçada olmayan bir biçim eklenir (${cmpCount('f')} ayet). Mealin genel tercihleri her ayette tekrar edilmez: ibadet anlamındaki “salât” için “namaz”, “ikame et” için “kıl”, “sâlih/sâlihât” için “hayra ve barışa yönelik” der ve Allah'ın isimlerine kısa açıklamalar ekler.</li>
<li><strong>Köşeli ayraç [ ].</strong> Çevirmenin eklediği kelime ya da açık bırakılan iki okuma.</li>
<li><strong>“İkame etmek”.</strong> Salâtı ayakta tutmak, dosdoğru yerine getirmek. Mealde Arapçadaki gibi bırakıldı.</li>
<li><strong>Ayet gösterimi.</strong> “Bakara 43”: Bakara suresinin 43. ayeti.</li>
</ul>
<h3>Kapsam</h3>
<p>${N} ayet, ${topics.length} konu. Bu bir seçkidir; salât, rükû, secde, okuma ve temizlikle ilgili bütün kullanımların tam dökümü değildir. Bu yüzden “Kur'an hiçbir yerde söylemez” demiyoruz; “incelenen ayetlerde yazmaz” diyoruz.</p>
<details><summary>Teknik bilgi</summary>
<p>Arapça kaynak: <a href="https://tanzil.net/" target="_blank" rel="noopener">Tanzil</a> Uthmani metni, sürüm 1.1, 6236 ayet. Depodaki dosya: data/quran-uthmani-tanzil-v1.1.txt.</p>
<p>Dosyanın parmak izi (SHA-256): <span class="mono">${sha}</span>. Dosyada tek harf değişse bu kod da değişir; böylece metnin değişmediği denetlenebilir.</p>
<p>Otomatik denetim: ${N} ayetin her birinde Arapça metin kaynak dosyayla harfi harfine karşılaştırılır; her ayetin tam meali vardır; sayfadaki bütün iç bağlantıların hedefi vardır.</p>
<details><summary>Tanzil kaynak bildirimi</summary><pre>${esc(copyright)}</pre></details>
</details>
<details><summary>Sürüm notları</summary><p><strong>${VERSION}</strong> (bağımsız denetimden sonra)</p><ul>
<li>Dua ve övgüde serbestlik, ayette yazılı bir sonuç olarak değil, varsayımları yazılı bir araştırma notu olarak verildi; Kısa cevaptan çıkarıldı.</li>
<li>Nisâ 102'den bölüm sayısı okuması Kısa cevaptan çıkarıldı; üç varsayımıyla birlikte araştırma notu oldu.</li>
<li>Mâide 6: yıkama ve mesh okumaları eşit biçimde, dil çözümlemeleriyle verildi; tercih açık bırakıldı.</li>
<li>Nûr 41: “ve” bağlacından iki kavramın özdeş olmadığı çıkarıldı; aralarında ortak alan bulunup bulunmadığı açık bırakıldı.</li>
<li>İsrâ 78: sabah okumasının “ikame et” emrine bağlanması ile salâtın içinde yapılması ayrıldı; ikincisi yorum olarak işaretlendi.</li>
<li>Meal ile Arapça: tek “fark var” etiketi yerine dört tür (uyumlu, açıklayıcı ekleme, çeviri tercihi, anlam farkı).</li>
<li>v0.5.1: Nisâ 102 araştırma notu iki kısma ayrıldı. “Olağan salât en az iki bölüm” kısmının elçinin kısaltıp kısaltmadığına bağlı olmadığı gösterildi; Nisâ 101–103'teki tekil ve çoğul hitap eklendi.</li>
</ul>
<p><strong>v0.4</strong></p><ul>
<li>Yaşar Nuri Öztürk meali eklendi; her ayete “Meal ile Arapça” karşılaştırması yazıldı.</li>
<li>Konular sekmesinde meal seçimi: ikisi de, çalışma meali, Yaşar Nuri.</li>
<li>Nisâ 102 çizimi eklendi.</li>
<li>Yeni konu: Verilmeyen ayrıntılar ve esneklik. Mâide 101, Bakara 186 ve Hac 78 eklendi.</li>
</ul>
<p><strong>v0.3</strong></p><ul>
<li>Sayfa dört sekmeye ayrıldı; konular tek tek seçilerek okunur.</li>
<li>Her konunun başına “Ayette yazılı / Çıkarım / Açık kalan” kutuları eklendi.</li>
<li>Beş açıklayıcı çizim eklendi: salât sahnesi, Mâide 6, salât kelimesinin kullanımları, zor koşullar, secde kelimesi.</li>
<li>20 ayet eklendi: Bakara 153 ve 177, Yûnus 87, A'lâ 14 ve 15, A'râf 204, 205 ve 206, İsrâ 107, 108 ve 109, Hac 18 ve 40, Sâd 24, Âl-i İmrân 113, Furkân 64, Zümer 9, Hûd 87, Nûr 41, Tevbe 99.</li>
<li>Düzeltilen mealler: Müzzemmil 7 (Türkçe hatası), Müzzemmil 5, Nisâ 101 (“salâttan kısaltma”), Hûd 114, İsrâ 110, Bakara 143.</li>
<li>Mâide 6 notu Arapçadaki hareke bilgisiyle yeniden yazıldı; İsrâ 78'deki sabah okumasının kanıt derecesi “dil yapısı” olarak düzeltildi.</li>
<li>Besmele ayetten ayrıldı; Arapça yazı tipi eklendi; aramada “namaz, abdest, ezan” gibi kelimeler de çalışır.</li>
</ul></details>
</section>

</div></main>
<footer class="foot"><div class="wrap"><p>Salâtın İçeriği Atlası ${VERSION} · ${DATE}. <a href="../salat-vakit/">Kur'ân Salât ve Vakit Atlası</a> ayrı bir araştırma olarak korunur.</p></div></footer>
<script>
${js}</script>
</body></html>
`;

fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log(JSON.stringify({ surum: VERSION, ayet: N, konu: topics.length, bayt: Buffer.byteLength(html), kaynakSha256: sha }));
