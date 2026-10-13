"""Konu 6: k06_kayit.tsv -> veri/konu06.json. Kural sırası önemlidir (ilk eşleşen kazanır). Eşlenmeyen kimlik kalırsa durur.
Alanlar konu 8/9 ile aynı; ek olarak her kayıtta `tur` (yasak | emir | sonuc | tanim)."""
import json, re, sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / 'tarama'))
from ortak import body, yn  # noqa: E402

DAVRANIS = [
    ('allaha_iftira', 'Yalan ve iftira', 'Allah\'a ve vahye iftira; Allah hakkında bilgisiz ve gerçek dışı söz söylemek'),
    ('insana_iftira', 'Yalan ve iftira', 'İnsanlara iftira, suçsuzu itham, çirkin haber yayma ve incitme'),
    ('hak_gizleme', 'Yalan ve iftira', 'Hakkı batılla karıştırıp gizlemek, tanıklığı saklamak, yalan tanıklığa ortak olmak'),
    ('yalan_soz', 'Yalan ve iftira', 'Yalan söz, yalan yemin, düzenbazlık'),
    ('alay_lakap', 'Alay ve çekiştirme', 'Alay, laf atma, lakap takma, ayıplama'),
    ('gibet_zan', 'Alay ve çekiştirme', 'Gıybet, kötü zan ve casusluk'),
    ('kibir', 'Kibir ve övünme', 'Kibir, büyüklük taslama, kasılıp yürümek'),
    ('simarma_ovunme', 'Kibir ve övünme', 'Şımarma, övünme, gösteriş, kendini aklama ve başa kakma'),
    ('israf', 'İsraf', 'İsraf ve saçıp savurma (cimrilik ile savurganlık arası denge)'),
    ('soz_edebi', 'Söz ve ses edebi', 'Güzel söz emri, yasak sözler ve ses edebi'),
]
DNAME = {k for k, _, _ in DAVRANIS}

KURAL = [
    (r'^israf', 'israf'),
    (r'^(allaha_iftira|allah_hakkinda|kurana_iftira)', 'allaha_iftira'),
    (r'^(suclu_olmayani|ifk_olayi|iftira_uydurmama|cirkin_haber|meryem_aleyhine|allah_ve_resulu_incitme|iftiraci_gunahkar)', 'insana_iftira'),
    (r'^(hakki_batilla|kitabi_gizleme|taniklik_gizleme|yalan_tanikliga)', 'hak_gizleme'),
    (r'^(yalan_soz|yalanci_duzenbaz|yemini_kalkan)', 'yalan_soz'),
    (r'^(alay|arkadan_cekistirme|lakap|cok_yemin)', 'alay_lakap'),
    (r'^zan_casusluk', 'gibet_zan'),
    (r'^(kibir|kulluktan_cekinip|kasilip|kendini_begenmislik)', 'kibir'),
    (r'^(karun|simarik|simarma|yapmadigiyla|gosteris|kendini_aklama|minnet)', 'simarma_ovunme'),
    (r'^(bos_soz|guzel_soz|sovme_yasagi|ana_babaya_soz|rai_na|sehit_icin|selam_verene|yarin_yapacagim|fisildasma|bilgisiz_soz|peygamber_sesinin|ses_ve_yuruyus|zihar)', 'soz_edebi'),
]


def esle(raw, tur):
    for p, k in KURAL:
        if re.search(p, raw):
            return k
    return None


rows = []
for line in (HERE / 'k06_kayit.tsv').read_text(encoding='utf8').splitlines():
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
veri = dict(konu=6, baslik='Söz ve davranış yasakları', nitelikler=out, ayetler=ayet,
            istatistik=dict(kayit=sum(len(n['kayitlar']) for n in out), ayet=len(refs), derece={d: sum(1 for r in rows if r['derece'] == d) for d in DER},
                            tur={t: sum(1 for r in rows if r['tur'] == t) for t in ('emir', 'yasak', 'sonuc', 'tanim')}))
(HERE.parent / 'veri').mkdir(exist_ok=True)
(HERE.parent / 'veri' / 'konu06.json').write_text(json.dumps(veri, ensure_ascii=False, indent=0), encoding='utf8')
for n in out:
    print(f"{n['grup']:30} {n['id']:22} ayet={n['ayet_sayisi']:3} kayit={len(n['kayitlar']):3}")
print(veri['istatistik'])
