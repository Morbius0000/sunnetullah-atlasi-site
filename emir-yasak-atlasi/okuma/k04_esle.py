"""Konu 4: k04_kayit.tsv -> veri/konu04.json. Kural sırası önemlidir (ilk eşleşen kazanır). Eşlenmeyen kimlik kalırsa durur.
Alanlar konu 8/9 ile aynı; ek olarak her kayıtta `tur` (yasak | emir | sonuc | tanim)."""
import json, re, sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / 'tarama'))
from ortak import body, yn  # noqa: E402

DAVRANIS = [
    ('tevhid_emri', 'Emirler', 'Yalnız Allah\'a kulluk etme emri (resullerin ortak çağrısı dahil)'),
    ('ortak_kosma_yasagi', 'Yasaklar', 'Allah\'a ortak koşma, O\'ndan başkasına kulluk etme ve yakarma yasağı'),
    ('sirklilerle_iliski', 'Yasaklar', 'Şirke ve yalanlamaya sapanlara uymama, onlardan olmama, onlar için af dilememe'),
    ('sirk', 'Şirkin biçimleri ve sonuçları', 'Şirk: ortaklar koşmak, Allah\'ın dışında kulluk ve sefaat umudu, sonuçları'),
    ('cocuk_isnadi', 'Şirkin biçimleri ve sonuçları', 'Allah\'a çocuk isnadı, üçleme, Mesih\'e ve din adamlarına ilahlık/rablik pay etme, cinleri ortak koşma'),
    ('seytana_kulluk', 'Şirkin biçimleri ve sonuçları', 'Şeytana kulluk etmek, onu şirk aracı ve veli edinmek'),
    ('sirk_mazeret', 'Şirkin biçimleri ve sonuçları', 'Şirki kadere ve atalara bağlayarak mazeret göstermek'),
    ('sirk_donusu', 'Şirkin biçimleri ve sonuçları', 'Sıkıntıda Allah\'a yönelip kurtulunca ya da nimet görünce ortak koşmak'),
    ('ayetleri_yalanlama', 'Ayetleri yalanlama', 'Ayetleri, kitabı ve resulleri yalanlamak'),
]
DNAME = {k for k, _, _ in DAVRANIS}

KURAL = [
    (r'^(musriklerden_yuz_cevirme|sirke_bulasmislara)', 'sirklilerle_iliski'),
    (r'^(musrik|ibrahim_sirklilerden|sirke_bulas|sirke_sapan|sirkten_olma|sirkte_ana|ana_baba|atalarin|yalanlayanlara|ayetleri_yalanlayanlar)', 'sirklilerle_iliski'),
    (r'^(seytan|seytani)', 'seytana_kulluk'),
    (r'^(allah_hakkinda_gercek_disi|ucun_ucuncusu|allahin_oglu|allah_cocuk|allah_dogur|allahin_cocug|allahin_kizlari|allaha_kiz|allaha_cocuk|rahman_cocuk|allahin_kizlar|melekleri_peygamberleri|mesihe|hahamlari|cinleri_ortak)', 'cocuk_isnadi'),
    (r'^(sirk_kaderi|atalarin_sirk)', 'sirk_mazeret'),
    (r'^(gemide|nimet_|rahmet_tadinca|sirk_kurtulunca|allah_yalniz_cagrilinca|allaha_inanip_ortaklari)', 'sirk_donusu'),
    (r'^(ayetleri_|ayetlere_|kitabi_|resulleri_|firavun_ayet)', 'ayetleri_yalanlama'),
]
# tür bazlı varsayılan: emir -> tevhid_emri; yasak -> ortak_kosma_yasagi; sonuç/tanım -> sirk
VARSAYILAN = {'emir': 'tevhid_emri', 'yasak': 'ortak_kosma_yasagi', 'sonuc': 'sirk', 'tanim': 'sirk'}


def esle(raw, tur):
    for p, k in KURAL:
        if re.search(p, raw):
            return k
    return VARSAYILAN.get(tur)


rows = []
for line in (HERE / 'k04_kayit.tsv').read_text(encoding='utf8').splitlines():
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
veri = dict(konu=4, baslik='Şirk ve ayetleri yalanlama', nitelikler=out, ayetler=ayet,
            istatistik=dict(kayit=len(rows), ayet=len(refs), derece={d: sum(1 for r in rows if r['derece'] == d) for d in DER},
                            tur={t: sum(1 for r in rows if r['tur'] == t) for t in ('emir', 'yasak', 'sonuc', 'tanim')}))
(HERE.parent / 'veri').mkdir(exist_ok=True)
(HERE.parent / 'veri' / 'konu04.json').write_text(json.dumps(veri, ensure_ascii=False, indent=0), encoding='utf8')
for n in out:
    print(f"{n['grup']:30} {n['id']:22} ayet={n['ayet_sayisi']:3} kayit={len(n['kayitlar']):3}")
print(veri['istatistik'])
