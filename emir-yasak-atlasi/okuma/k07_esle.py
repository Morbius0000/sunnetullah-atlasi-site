"""Konu 7: k07_kayit.tsv -> veri/konu07.json. Kural sırası önemlidir (ilk eşleşen kazanır). Eşlenmeyen kimlik kalırsa durur.
Alanlar konu 8/9 ile aynı; ek olarak her kayıtta `tur` (yasak | emir | sonuc | tanim)."""
import json, re, sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / 'tarama'))
from ortak import body, yn  # noqa: E402

DAVRANIS = [
    ('temiz_helal', 'Yiyecek ve içecek', 'Temiz ve helal yemek: emirler ve helal kılınanlar'),
    ('les_kan_domuz', 'Yiyecek ve içecek', 'Leş, kan, domuz eti, Allah\'tan başkası adına kesilen; Allah\'ın adı anılan ve anılmayan hayvan'),
    ('sarap_kumar', 'Yiyecek ve içecek', 'Şarap/uyuşturucu ve kumar'),
    ('av_ihram', 'Yiyecek ve içecek', 'Av: helal olan ve ihramda yasak olan'),
    ('nikah_haram', 'Evlilik', 'Evlenilmesi haram kılınanlar (yakınlar, evli kadınlar, müşrikler, zani)'),
    ('evlilik_hukumleri', 'Evlilik', 'Helal kılınan evlilikler ve evlilik emirleri (çok eşlilik, Kitap ehlinin kadınları, evlendirme, zıhar)'),
    ('esle_bosanma', 'Evlilik', 'Eşle ilişki, boşanma ve iddet hükümleri'),
    ('haram_kilma_yetkisi', 'Haram kılma ve helal sayma', 'Allah\'ın helal ve haram kılması; kendiliğinden haramlaştırmanın yasağı'),
    ('israilogullari_haram', 'Haram kılma ve helal sayma', 'İsrailoğullarına haram kılınanlar'),
]
DNAME = {k for k, _, _ in DAVRANIS}

KURAL = [
    (r'^(les_kan|allah_adi_anilan)', 'les_kan_domuz'),
    (r'^sarap', 'sarap_kumar'),
    (r'^av_', 'av_ihram'),
    (r'^israilogullari', 'israilogullari_haram'),
    (r'^(kendi_haram|allahin_haram)', 'haram_kilma_yetkisi'),
    (r'^(nikah_haram|musrikle|zani_ile)', 'nikah_haram'),
    (r'^(hayiz|oruc_gecesi|bosanma)', 'esle_bosanma'),
    (r'^(cok_esli|evlendirme|nikah_bulamayan|ehlikitap|peygamberin_evlilik|zihar)', 'evlilik_hukumleri'),
    (r'^(temiz_ve_helal|temiz_ve_pis|yeme_icme|rizikta|evlerden)', 'temiz_helal'),
]


def esle(raw, tur):
    for p, k in KURAL:
        if re.search(p, raw):
            return k
    return None


rows = []
for line in (HERE / 'k07_kayit.tsv').read_text(encoding='utf8').splitlines():
    if not line.strip() or line.startswith('#'):
        continue
    f = line.split('\t') + [''] * 8
    rows.append(dict(blok=f[0], ham=f[1], nitelik_ayet=f[2], odul_ayet=f[3], odul=('yok' if f[4] == '-' else f[4]), derece=f[5], not_=f[6], tur=f[7]))

bad = [r for r in rows if esle(r['ham'], r['tur']) is None]
if bad:
    print('EŞLENMEYEN:', sorted({(r['ham'], r['tur']) for r in bad}))
    sys.exit(1)


def ref2(r):
    s, a = map(int, r.split(':'))
    return s, a


grup = defaultdict(list)
for r in rows:
    grup[esle(r['ham'], r['tur'])].append(r)
DER = {'✓': 3, '→': 2, '?': 1}
out = []
for k, g, e in DAVRANIS:
    rs = grup.get(k, [])
    if not rs:
        print('BOŞ:', k)
        continue
    seen = {}
    for r in rs:
        key = (r['nitelik_ayet'], r['odul_ayet'], r['odul'], r['tur'])
        if key not in seen or DER[r['derece']] > DER[seen[key]['derece']]:
            seen[key] = r
    kay = sorted(seen.values(), key=lambda r: (ref2(r['nitelik_ayet']), ref2(r['odul_ayet'])))
    out.append(dict(
        id=k, grup=g, etiket=e, ayet_sayisi=len({r['nitelik_ayet'] for r in kay}),
        kayitlar=[dict(blok=r['blok'], nitelik_ayet=r['nitelik_ayet'], odul_ayet=r['odul_ayet'], odul=r['odul'],
                       derece=r['derece'], tur=r['tur'], ham=r['ham'], not_=r['not_']) for r in kay]))
refs = sorted({x for r in rows for x in (r['nitelik_ayet'], r['odul_ayet']) if re.match(r'^\d+:\d+$', x)}, key=ref2)
ayet = {x: dict(ar=body[ref2(x)], tr=yn.get(ref2(x), '')) for x in refs}
veri = dict(konu=7, baslik='Helal ve haram', nitelikler=out, ayetler=ayet,
            istatistik=dict(kayit=sum(len(n['kayitlar']) for n in out), ayet=len(refs), derece={d: sum(1 for r in rows if r['derece'] == d) for d in DER},
                            tur={t: sum(1 for r in rows if r['tur'] == t) for t in ('emir', 'yasak', 'sonuc', 'tanim')}))
(HERE.parent / 'veri').mkdir(exist_ok=True)
(HERE.parent / 'veri' / 'konu07.json').write_text(json.dumps(veri, ensure_ascii=False, indent=0), encoding='utf8')
for n in out:
    print(f"{n['grup']:30} {n['id']:22} ayet={n['ayet_sayisi']:3} kayit={len(n['kayitlar']):3}")
print(veri['istatistik'])
