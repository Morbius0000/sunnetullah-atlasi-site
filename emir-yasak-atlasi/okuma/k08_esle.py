"""Konu 8: ham okuma kayıtlarını (k08_kayit.tsv) kanonik niteliklere eşler ve veri/konu08.json üretir.
Kural sırası önemlidir: ilk eşleşen kural kazanır. Eşlenmeyen kimlik kalırsa betik durur."""
import json, re, sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / 'tarama'))
from ortak import body, yn  # noqa: E402

# (kanonik_id, grup, etiket)
NITELIK = [
    ('iman', 'İnanç', 'İman (Allah\'a, ahirete, meleklere, kitaplara, elçilere)'),
    ('ahirete_yakin', 'İnanç', 'Ahirete kesin inanç, hesabı/din gününü doğrulamak'),
    ('tevhid', 'İnanç', 'Şirk koşmamak, tâğuttan kaçınmak, dini Allah\'a özgülemek'),
    ('teslimiyet', 'İnanç', 'Allah\'a teslim olmak, "Rabbimiz Allah" deyip dosdoğru durmak'),
    ('takva', 'Kalp', 'Takva (korunup sakınmak)'),
    ('hasyet', 'Kalp', 'Rabden korkmak / haşyet (görmeden, makamından, azabından)'),
    ('husu_inabe', 'Kalp', 'Huşû, ihbat, Allah\'a yönelmek (inabe), selim kalp'),
    ('tezkiye', 'Kalp', 'Nefsi arındırmak, nefsi hevadan alıkoymak'),
    ('tevekkul', 'Kalp', 'Tevekkül'),
    ('sabir', 'Kalp', 'Sabır ve sebat'),
    ('sukur', 'Kalp', 'Şükür'),
    ('umit', 'Kalp', 'Rahmetten ümit kesmemek, korku ve ümitle yönelmek'),
    ('salih_amel', 'Amel', 'Salih amel (iyi, düzeltici iş)'),
    ('hasene', 'Amel', 'İyilik (hasene) getirmek, hayırlarda öne geçmek'),
    ('namaz', 'İbadet', 'Namaz (kılmak, korumak, gece ibadeti, rükû-secde)'),
    ('zikir', 'İbadet', 'Allah\'ı anmak (zikir, tesbih, hamd)'),
    ('dua_istigfar', 'İbadet', 'Dua ve istiğfar (seher vakti dahil)'),
    ('tevbe', 'İbadet', 'Tevbe ve günahta ısrar etmemek'),
    ('oruc', 'İbadet', 'Oruç'),
    ('vahye_uymak', 'İbadet', 'Vahyi dinlemek, okumak, ona sarılmak ve uymak'),
    ('itaat', 'İbadet', 'Allah\'a ve elçiye itaat, gönülden boyun eğiş (kunut)'),
    ('seyahat', 'İbadet', 'Dolaşma / yolculuk (es-sâihûn; anlamı tartışmalı)'),
    ('infak', 'Mal', 'İnfak, sadaka, karz-ı hasen'),
    ('zekat', 'Mal', 'Zekât'),
    ('ihtiyac_sahibine_vermek', 'Mal', 'Yakına, yetime, yoksula, esire, yolcuya vermek; köle azadı'),
    ('infak_ahlaki', 'Mal', 'Başa kakmadan, Allah rızası için, ölçülü vermek; cimrilikten korunmak'),
    ('ahde_vefa', 'Ahlak', 'Ahde, emanete, adağa, bey\'ate vefa'),
    ('sidk', 'Ahlak', 'Doğruluk, dosdoğru şahitlik, yalana şahit olmamak'),
    ('iffet', 'Ahlak', 'İffet (ırzı korumak, zina etmemek, bakışları kısmak)'),
    ('affetmek', 'Ahlak', 'Affetmek, öfkeyi yutmak, kötülüğü iyilikle savmak'),
    ('tevazu', 'Ahlak', 'Tevazu, büyüklenmemek'),
    ('bos_soz', 'Ahlak', 'Boş sözden (lağv) yüz çevirmek'),
    ('ihsan', 'Ahlak', 'İhsan (güzel davranmak)'),
    ('islah', 'Ahlak', 'Islah, bozgunculuk yapmamak'),
    ('marufu_emir', 'Toplum', 'İyiliği emretmek, kötülükten sakındırmak, hakkı ve sabrı tavsiye'),
    ('anne_baba', 'Toplum', 'Anne babaya iyilik, akrabalık bağını gözetmek (sıla)'),
    ('adalet', 'Toplum', 'Adalet ve haksız yere cana kıymamak'),
    ('sura_dayanisma', 'Toplum', 'Şûra, zulme karşı dayanışma, meclislerde yer açmak, iyiliğe aracılık (şefâat-i hasene)'),
    ('kebair', 'Toplum', 'Büyük günahlardan ve çirkinliklerden kaçınmak'),
    ('hicret', 'Allah yolunda', 'Hicret ve yurdundan çıkarılmaya katlanmak'),
    ('cihad', 'Allah yolunda', 'Allah yolunda malla-canla mücadele, yardım, zahmete katlanmak'),
    ('allah_yolunda_olum', 'Allah yolunda', 'Allah yolunda ölmek / öldürülmek'),
    ('velayet', 'Allah yolunda', 'Allah\'ı her şeyden çok sevmek; Allah düşmanlarını dost edinmemek; mü\'minleri sevmek'),
    ('ahireti_istemek', 'Yönelim', 'Ahireti ve Allah\'ın rızasını istemek'),
    ('ilim', 'Yönelim', 'İlim ve ilimde derinleşmek'),
    ('salah', 'Yönelim', 'Salih olmak (salih kişi), salih aile bağı'),
    ('sonuc_tanimi', 'Sonuç tanımları', 'Nitelik değil, kurtulanların adı (mizanı ağır basan, kitabı sağdan verilen vb.)'),
    ('red', 'Reddedilen dayanaklar', 'Kur\'an\'ın geçersiz saydığı dayanaklar (soy, grup, kuruntu, mal-evlat)'),
]
KURAL = [
    (r'^RED:|_RED$', 'red'),
    (r'^(mizan_agir|kitabi_sagdan|saadet|husna_takdiri|mukarrebun|sabikun|ashab_yemin|temiz_olarak_olmek|ateşten_uzak)', 'sonuc_tanimi'),
    (r'^(hasene|hayirlarda_yarismak)', 'hasene'),
    (r'^siyahat', 'seyahat'),
    (r'^(ahirete_yakin|din_gununu_tasdik|hesaba_kavusacagini|husnayi_tasdik)', 'ahirete_yakin'),
    (r'^(sirk_kosmamak|ibadette_sirk|taguttan|sirkten|imani_zulumle|ihlas)', 'tevhid'),
    (r'^(islam|teslimiyet|ihsan_ve_teslimiyet|inabe_ve_teslim|rabbimiz_allah|istikamet)', 'teslimiyet'),
    (r'^(rabden|gaybde|rabbin_makamindan|allahin_makamindan|rabbin_azabindan|kotu_gunden|ailede_|rabbinden_korkmak|allah_anilinca|ahiretten_korkup|allahtan_haşyet|allaha_saygi)', 'hasyet'),
    (r'^(husu|namazda_husu|ihbat|munib|evvab|inabe|kalb_selim|mutmain|allah_zikrine_kalbin|hafiz)', 'husu_inabe'),
    (r'^(tezkiye|nefsi_arindirmak|nefsi_hevadan|temizlik)', 'tezkiye'),
    (r'^(tevekkul|iman_ve_tevekkul)', 'tevekkul'),
    (r'^(sabir|sinanmada_sabir|musibette|sebat_ve_istigfar|murabata|allah_rizasi_icin_sabir|cihad_ve_sabir)', 'sabir'),
    (r'^(sukur|iman_ve_sukur)', 'sukur'),
    (r'^(rahmetten_umit|korku_ve_umitle)', 'umit'),
    (r'^(takva|gucu_yettigince_takva|iman_takva_ihsan)', 'takva'),
    (r'^(salih_amel|amel$|baki_salihat|iman_salih_amel|onceden_gonderilen|cennet_icin_calismak|sa_y|ebrar_cabasi|cinsiyetten|guzel_soz_salih_amel|sukur_ve_salih|sukur_salih_amel)', 'salih_amel'),
    (r'^(namaz|ruku_secde|gece_|ayetlerle_secde|rabbin_adini_anip|ibadet$|mescit_imari|ailesine_namaz|kuran_okumak_namaz)', 'namaz'),
    (r'^(zikir|allahin_nimetlerini|hamd|cuma_|sebat_ve_zikir)', 'zikir'),
    (r'^(istigfar|seherde_istigfar|dua$|cehennemden_siginma|iman_ve_magfiret|onceki_muminlere_dua|aile_icin_dua)', 'dua_istigfar'),
    (r'^(tevbe|nasuh_tevbe|gunahta_|salah_ve_tevbe)', 'tevbe'),
    (r'^oruc', 'oruc'),
    (r'^(kurani_dinlemek|kitabi_okumak|kitaba_|zikre_uymak|sozu_dinleyip|indirilenin_en_guzeline|ayetlere_kor|hidayete_|rabbin_cagrisina|ogutlenene|isittik|vahye_iman|ayetleri_satmamak|ayetlerle_iman_artmasi|hududullahi)', 'vahye_uymak'),
    (r'^(itaat|kunut|dinlemek_itaat|resule_iman_destek|allah_yoluna_uymak|allah_rizasina_uymak|resulun_yaninda|elcilere_uymaya)', 'itaat'),
    (r'^(zekat|allah_rizasi_icin_zekat)', 'zekat'),
    (r'^(mali_yakinlara|akrabaya_|malda_isteyen|yoksul_yetim|aclik_gununde|akabe_kole|borcluya|borcu_bagislamak)', 'ihtiyac_sahibine_vermek'),
    (r'^(basa_kakmamak|allah_rizasi_icin|infaki_kurbet|arinmak_icin_mal|infakta_itidal|nefsin_cimrilig|ürpererek_vermek|muhacirleri_sevmek_isar)', 'infak_ahlaki'),
    (r'^(infak|hasat_hakkini|gizli_|bollukta|karz_hasen|sadaka$|iman_ve_infak|vermek_ve_takva|fetihten_once)', 'infak'),
    (r'^(ahde_vefa|misaki|emanet_ve_ahde|nezre_vefa|bey_ate)', 'ahde_vefa'),
    (r'^(sidk|dogruyu_getirmek|sahitligi|yalana_sahitlik)', 'sidk'),
    (r'^(iffet|harama_bakmamak|bakislari_kisma|zina_etmemek)', 'iffet'),
    (r'^(affetmek|insanlari_affetmek|ofke|guzel_soz_affetme|sabir_ve_bagislama|kotulugu_iyilikle|cahillere_selam)', 'affetmek'),
    (r'^(tevazu|kibirlenmemek|ustunluk_taslamamak)', 'tevazu'),
    (r'^(lagvden|bos_soz)', 'bos_soz'),
    (r'^(ihsan|ahiret_yurdunu_aramak_ihsan)', 'ihsan'),
    (r'^(islah|bozgunculuk|fesat_istememek|sadaka_maruf_islah|tevbe_islah)', 'islah'),
    (r'^(marufu|hayra_cagri|iman_sabri|hakki_tavsiye|sabri_tavsiye|allaha_cagri|aralarinda_merhamet)', 'marufu_emir'),
    (r'^(anne_babaya|takva_ve_anne_babaya)', 'anne_baba'),
    (r'^(adalet|haksiz_yere_cana)', 'adalet'),
    (r'^(sura|zulme_karsi|meclislerde|iyilige_aracilik)', 'sura_dayanisma'),
    (r'^(kebair|icki_kumar)', 'kebair'),
    (r'^(hicret|zulme_ugradiktan|yurdundan|oncu_olmak|allah_yolunda_hicret)', 'hicret'),
    (r'^yaraya_ragmen', 'itaat'),
    (r'^(cihad|mal_ve_canla|allah_yolunda_savas|takva_vesile|allah_yolunda_zahmet|allah_yolunda_eziyet|barindirma|allaha_yardim)', 'cihad'),
    (r'^(fisebilillah_olum|allah_yolunda_olum|allah_yolunda_oldurulme)', 'allah_yolunda_olum'),
    (r'^(allah_dusmanlariyla|allahi_her_seyden)', 'velayet'),
    (r'^(ahiret_sevabini|ahireti_istemek|ahiret_ekinini|allahi_resulu_ahireti|yarina_ne)', 'ahireti_istemek'),
    (r'^(ilimde|iman_ve_ilim)', 'ilim'),
    (r'^(salah|salih_akrabalar|salih_ebeveyn|zurriyet|islah_ehli)', 'salah'),
    (r'^(iman|gayba_iman|ayetlere_iman|resule_iman|onceki_kitap|hakki_isitince|iman_peygamberle|iman_ve_zikirle|iman_ve_zulumden|iffet_ve_tasdik)', 'iman'),
]
# Bazı birleşik kayıtlar birden fazla niteliğe bölünür (ilk kanonik + ekler)
BOL = {
    'kalpte_hayir': ['iman'], 'ebrar_olmak': ['salih_amel'],
    'tevbe_iman': ['tevbe', 'iman'], 'tevbe_iman_salih_amel': ['tevbe', 'iman', 'salih_amel'],
    'iman_takva_ihsan': ['iman', 'takva', 'ihsan'], 'kitaba_uymak_takva': ['vahye_uymak', 'takva'],
    'mescit_imari_iman_namaz_zekat': ['iman', 'namaz', 'zekat'], 'kuran_okumak_namaz_zekat_karz_hasen': ['vahye_uymak', 'namaz', 'zekat', 'infak'],
    'ihlas_namaz_zekat': ['tevhid', 'namaz', 'zekat'], 'iman_ve_infak': ['iman', 'infak'], 'iman_ve_sukur': ['iman', 'sukur'],
    'iman_salih_amel': ['iman', 'salih_amel'], 'salih_amel_iman_ile': ['salih_amel', 'iman'], 'iman_salih_amel_ve_kurana_iman': ['iman', 'salih_amel'],
    'ruku_secde_ibadet_hayir': ['namaz', 'salih_amel'], 'iman_ve_ilim': ['iman', 'ilim'], 'hicret_ve_nusret': ['hicret', 'cihad'],
    'takva_vesile_cihad': ['takva', 'cihad'], 'sebat_ve_zikir': ['sabir', 'zikir'], 'sabir_ve_inabe': ['sabir', 'husu_inabe'],
    'istikamet_ve_istigfar': ['teslimiyet', 'dua_istigfar'], 'istigfar_ve_tevbe': ['dua_istigfar', 'tevbe'], 'salah_ve_tevbe': ['salah', 'tevbe'],
    'takva_ve_anne_babaya_iyilik': ['takva', 'anne_baba'], 'sukur_salih_amel_inabe_teslim': ['sukur', 'salih_amel', 'husu_inabe', 'teslimiyet'],
    'sukur_ve_salih_amel': ['sukur', 'salih_amel'], 'allaha_cagri_salih_amel_teslim': ['marufu_emir', 'salih_amel', 'teslimiyet'],
    'iman_ve_tevekkul': ['iman', 'tevekkul'], 'iman_sabri_ve_merhameti_tavsiye': ['iman', 'marufu_emir'], 'vermek_ve_takva': ['infak', 'takva'],
    'affetmek_islah': ['affetmek', 'islah'], 'sadaka_maruf_islah': ['infak', 'marufu_emir', 'islah'], 'tevbe_islah': ['tevbe', 'islah'],
    'iman_resullere_ve_destek': ['iman', 'itaat'], 'resule_iman_destek_nura_uymak': ['iman', 'itaat', 'vahye_uymak'],
    'allaha_saygi_ve_takva': ['hasyet', 'takva'], 'kunut_itaat': ['itaat'], 'aralarinda_merhamet_ruku_secde': ['marufu_emir', 'namaz'],
    'iman_ihsan_ruhbanlik_RED': ['iman'], 'iffet_ve_tasdik': ['iffet', 'iman'], 'harama_bakmamak_iffet': ['iffet'], 'bakislari_kisma_iffet': ['iffet'], 'temizlik_iffet': ['tezkiye', 'iffet'],
    'iman_ve_zulumden_uzaklasma': ['iman'], 'iman_ve_magfiret_dilemek': ['iman', 'dua_istigfar'], 'gunahta_allahi_anip_istigfar': ['zikir', 'dua_istigfar'], 'gece_az_uyumak': ['namaz'],
    'allah_yolunda_hicret_olum': ['hicret', 'allah_yolunda_olum'], 'zulme_ugradiktan_sonra_hicret': ['hicret'],
    'ahiret_yurdunu_aramak_ihsan': ['ahireti_istemek', 'ihsan'], 'muhacirleri_sevmek_isar': ['velayet', 'infak_ahlaki'],
    'ahireti_istemek_ve_cabalamak': ['ahireti_istemek', 'salih_amel'], 'allahi_resulu_ahireti_istemek': ['ahireti_istemek', 'itaat'],
    'kurani_dinlemek': ['vahye_uymak'], 'allaha_sarilmak': ['teslimiyet'], 'allahin_birlestirilmesini_emrettigini_ulastirmak': ['anne_baba'],
    'allahin_hurmetlerine_saygi': ['takva'], 'yuz_agarmasi_imanda_kalmak': ['iman'], 'mal_ve_canla_cihad': ['cihad'], 'namaz_ve_devamlilik': ['namaz'],
}
NAD = {k: (g, e) for k, g, e in NITELIK}
def esle(raw):
    if raw in BOL: return BOL[raw]
    for p, k in KURAL:
        if re.search(p, raw): return [k]
    return None

rows = []
for line in (HERE / 'k08_kayit.tsv').read_text(encoding='utf8').splitlines():
    if not line.strip() or line.startswith('#'): continue
    f = line.split('\t') + [''] * 7
    rows.append(dict(blok=f[0], ham=f[1], nitelik_ayet=f[2], odul_ayet=f[3], odul=f[4], derece=f[5], not_=f[6]))
eksik = sorted({r['ham'] for r in rows if esle(r['ham']) is None})
if eksik:
    print('EŞLENMEYEN:', eksik); sys.exit(1)

def ref2(r):
    s, a = map(int, r.split(':')); return s, a
grup = defaultdict(list)
for r in rows:
    for k in esle(r['ham']):
        grup[k].append(r)
DER = {'✓': 3, '→': 2, '?': 1}
out = []
for k, g, e in NITELIK:
    rs = grup.get(k, [])
    if not rs: continue
    # aynı (nitelik_ayet, odul_ayet) tekrarlarını birleştir
    seen = {}
    for r in rs:
        key = (r['nitelik_ayet'], r['odul_ayet'])
        if key not in seen or DER[r['derece']] > DER[seen[key]['derece']]: seen[key] = r
    kay = sorted(seen.values(), key=lambda r: ref2(r['nitelik_ayet']))
    out.append(dict(id=k, grup=g, etiket=e,
                    ayet_sayisi=len({r['nitelik_ayet'] for r in kay}),
                    cennet_sayisi=len({r['nitelik_ayet'] for r in kay if r['odul'] == 'cennet'}),
                    kayitlar=[dict(blok=r['blok'], nitelik_ayet=r['nitelik_ayet'], odul_ayet=r['odul_ayet'], odul=r['odul'],
                                   derece=r['derece'], ham=r['ham'], not_=r['not_']) for r in kay]))
refs = sorted({x for r in rows for x in (r['nitelik_ayet'], r['odul_ayet']) if re.match(r'^\d+:\d+$', x)}, key=ref2)
ayet = {x: dict(ar=body[ref2(x)], tr=yn.get(ref2(x), '')) for x in refs}
veri = dict(konu=8, baslik='Cennete (ve Allah\'ın ödülüne) götüren nitelikler', nitelikler=out, ayetler=ayet,
            istatistik=dict(kayit=len(rows), ayet=len(refs), derece={d: sum(1 for r in rows if r['derece'] == d) for d in DER}))
(HERE.parent / 'veri').mkdir(exist_ok=True)
(HERE.parent / 'veri' / 'konu08.json').write_text(json.dumps(veri, ensure_ascii=False, indent=0), encoding='utf8')
for n in out: print(f"{n['grup']:16} {n['id']:24} ayet={n['ayet_sayisi']:3} cennet={n['cennet_sayisi']:3}")
print(veri['istatistik'])
