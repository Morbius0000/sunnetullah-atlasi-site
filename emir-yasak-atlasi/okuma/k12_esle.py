"""Konu 12: k12_kayit.tsv -> veri/konu12.json. Kural sırası önemlidir (ilk eşleşen kazanır). Eşlenmeyen kimlik kalırsa durur.
Alanlar konu 8/9 ile aynı; ek olarak her kayıtta `tur` (yasak | emir | sonuc | tanim)."""
import json, re, sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / 'tarama'))
from ortak import body, yn  # noqa: E402

DAVRANIS = [
    ('kebair', 'Büyük günah ve fâhişe', 'Kebâir: günahın büyükleri, büyük günah ve onlardan kaçınmanın karşılığı'),
    ('fahsa', 'Büyük günah ve fâhişe', 'Fahşâ ve fevâhiş: Kur\'an\'ın fâhişe diye adlandırdığı işler'),
    ('lemem', 'Büyük günah ve fâhişe', 'Lemem: küçük sürçmeler'),
    ('ism', 'İsm, zenb ve hatîe', 'İsm: günah olarak adlandırılan işler ve karşılığı'),
    ('zenb', 'İsm, zenb ve hatîe', 'Zenb ve günahlar yüzünden gelen karşılıklar; bağışlanma'),
    ('hatia', 'İsm, zenb ve hatîe', 'Hatîe ve hata'),
    ('fisk', 'Fısk ve bağy', 'Fısk ve fâsıklar: kimlere fâsık denir, karşılığı'),
    ('bagy', 'Fısk ve bağy', 'Bağy: haksız yere saldırganlık ve azgınlık'),
    ('munker', 'Münker', 'Münker (kötülük) ve ondan sakındırmak'),
]
DNAME = {k for k, _, _ in DAVRANIS}

KURAL = [(r'^' + k + '$', k) for k, _, _ in DAVRANIS]


def esle(raw, tur):
    for p, k in KURAL:
        if re.search(p, raw):
            return k
    return None


rows = []
for line in (HERE / 'k12_kayit.tsv').read_text(encoding='utf8').splitlines():
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
veri = dict(konu=12, baslik='Günah sınıfları', nitelikler=out, ayetler=ayet,
            istatistik=dict(kayit=sum(len(n['kayitlar']) for n in out), ayet=len(refs), derece={d: sum(1 for r in rows if r['derece'] == d) for d in DER},
                            tur={t: sum(1 for r in rows if r['tur'] == t) for t in ('emir', 'yasak', 'sonuc', 'tanim')}))
(HERE.parent / 'veri').mkdir(exist_ok=True)
(HERE.parent / 'veri' / 'konu12.json').write_text(json.dumps(veri, ensure_ascii=False, indent=0), encoding='utf8')
for n in out:
    print(f"{n['grup']:30} {n['id']:22} ayet={n['ayet_sayisi']:3} kayit={len(n['kayitlar']):3}")
print(veri['istatistik'])
