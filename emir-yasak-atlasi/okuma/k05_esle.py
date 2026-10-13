"""Konu 5: k05_kayit.tsv -> veri/konu05.json. Kural sırası önemlidir (ilk eşleşen kazanır). Eşlenmeyen kimlik kalırsa durur.
Alanlar konu 8/9 ile aynı; ek olarak her kayıtta `tur` (yasak | emir | sonuc | tanim)."""
import json, re, sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / 'tarama'))
from ortak import body, yn  # noqa: E402

DAVRANIS = [
    ('haksiz_oldurme', 'Can', 'Haksız yere öldürmek ve can almak (mümini kasten öldürmek, kendi canına kıymak dahil)'),
    ('cocuk_oldurme', 'Can', 'Çocukları öldürmek: yoksulluk korkusu, kız çocuğunu gömmek, Firavun\'un erkek çocukları boğazlaması'),
    ('peygamber_oldurme', 'Can', 'Peygamberleri ve adaleti emredenleri haksız yere öldürmek'),
    ('kisas_diyet', 'Can', 'Kısas ve diyet'),
    ('zina', 'Namus', 'Zina ve fuhuş: yasaklar, cezalar ve karşılıklar'),
    ('kazf', 'Namus', 'İffetli kadına zina iftirası (kazf) ve eşe zina isnadı'),
    ('fahsa', 'Namus', 'Fahşâ, fevâhiş ve edepsizlik; Lût kavminin fiili'),
    ('irzi_koruma', 'Namus', 'Bakışı ve ırzı korumak'),
    ('riba', 'Mal', 'Ribâ'),
    ('yetim_mali', 'Mal', 'Yetimin malını yemek'),
    ('batil_mal', 'Mal', 'Malı haksız ve bâtıl yolla yemek, haram yemek'),
    ('hirsizlik_hiyanet', 'Mal', 'Hırsızlık ve kamu malından aşırmak'),
    ('olcu_tarti', 'Mal', 'Ölçüde ve tartıda hile'),
    ('kenz', 'Mal', 'Altın ve gümüşü yığıp Allah yolunda harcamamak'),
]
DNAME = {k for k, _, _ in DAVRANIS}

KURAL = [
    (r'^riba', 'riba'),
    (r'(olcu|tarti|terazi|mizan|insanlarin_esya|halkin_esyasini)', 'olcu_tarti'),
    (r'^(yetim|mirasi_toplayip)', 'yetim_mali'),
    (r'(hirsizlik|kamu_malindan)', 'hirsizlik_hiyanet'),
    (r'^altin_gumus', 'kenz'),
    (r'^(mallari_batil|halkin_mallarini|halkin_esyasini|insanlarin_esya|kadinlari_zorla|haram_yem|harami)', 'batil_mal'),
    (r'^(kisas|muminin_mumini_hata)', 'kisas_diyet'),
    (r'(cocuk|evlat|kiz_cocugunu|diri_diri)', 'cocuk_oldurme'),
    (r'^(haksiz_yere_peygamber|resulleri_old|haksiz_oldurme_ve_adaleti)', 'peygamber_oldurme'),
    (r'(kazf|zina_isnadi|iffetli)', 'kazf'),
    (r'^(irzi|bakislari)', 'irzi_koruma'),
    (r'(zina|evlilikte_fuhus|fahise_yapanlara|genc_kizlari)', 'zina'),
    (r'(fahsa|babanin_nikah|fevahis|edepsiz|cirkinlik|lut_kavmi|kotulukleri|yusuftan|gunahin_buyuk|peygamber_hanimlari|seytanin)', 'fahsa'),
    (r'(oldur|cana_kiy|kan_dokme|kendi_canlarini|mumini_kasten|kardesini|birbirini|haksiz_yere_kisi|haksiz_yere_can)', 'haksiz_oldurme'),
]


def esle(raw, tur):
    for p, k in KURAL:
        if re.search(p, raw):
            return k
    return None


rows = []
for line in (HERE / 'k05_kayit.tsv').read_text(encoding='utf8').splitlines():
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
veri = dict(konu=5, baslik='Can, namus ve mal yasakları', nitelikler=out, ayetler=ayet,
            istatistik=dict(kayit=len(rows), ayet=len(refs), derece={d: sum(1 for r in rows if r['derece'] == d) for d in DER},
                            tur={t: sum(1 for r in rows if r['tur'] == t) for t in ('emir', 'yasak', 'sonuc', 'tanim')}))
(HERE.parent / 'veri').mkdir(exist_ok=True)
(HERE.parent / 'veri' / 'konu05.json').write_text(json.dumps(veri, ensure_ascii=False, indent=0), encoding='utf8')
for n in out:
    print(f"{n['grup']:30} {n['id']:22} ayet={n['ayet_sayisi']:3} kayit={len(n['kayitlar']):3}")
print(veri['istatistik'])
