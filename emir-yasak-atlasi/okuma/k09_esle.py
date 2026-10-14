"""Konu 9: ham okuma kayıtlarını (k09_kayit.tsv) kanonik davranış başlıklarına ve ceza türlerine eşler,
veri/konu09.json üretir. Kural sırası önemlidir: ilk eşleşen kural kazanır. Eşlenmeyen kimlik kalırsa betik durur.
Alan adları konu 8 ile aynıdır (nitelik_ayet = davranışın geçtiği ayet, odul_ayet = karşılığın söylendiği ayet,
odul = ceza kodu) ki site aynı kodla çizsin; görünen adlar konular.mjs içindeki cezaAdi / cezaTur'dan gelir."""
import json, re, sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / 'tarama'))
from ortak import body, yn  # noqa: E402

# (kanonik_id, grup, etiket)
DAVRANIS = [
    ('kufur', 'İnanç', 'Küfür: Allah\'ı, vahyi ya da hakkı inkâr etmek; imandan sonra dönmek'),
    ('sirk', 'İnanç', 'Şirk: Allah\'tan başkasına kulluk etmek, ilahlık iddiası, tâğut, put ve veli edinmek'),
    ('nifak', 'İnanç', 'İkiyüzlülük (nifak)'),
    ('ahiret_inkar', 'İnanç', 'Ahireti, kıyameti, hesabı ve Allah\'a kavuşmayı inkâr etmek ya da ummamak'),
    ('allaha_iftira', 'İnanç', 'Allah\'a iftira etmek, yalan isnat etmek; helal-haram uydurmak'),
    ('allah_hakkinda_yanlis', 'İnanç', 'Allah hakkında kötü zan beslemek, yanlış söz söylemek, O\'nun tuzağından emin olmak'),
    ('suphe', 'İnanç', 'Şüphe ve kuşku içinde kalmak'),
    ('ayetleri_yalanlama', 'Vahiy ve resuller', 'Ayetleri, kitabı ve resulleri yalanlamak, ayetlere karşı çıkmak'),
    ('alay', 'Vahiy ve resuller', 'Ayetlerle, resullerle ve müminlerle alay etmek'),
    ('yuz_cevirme', 'Vahiy ve resuller', 'Zikirden, ayetlerden ve uyarıdan yüz çevirmek; gaflet, unutmak'),
    ('allah_yolundan_alikoyma', 'Vahiy ve resuller', 'Allah yolundan ve mescitten alıkoymak; insanları saptırmak'),
    ('resule_isyan', 'Vahiy ve resuller', 'Allah\'a ve resulüne isyan etmek, karşı gelmek, resulü incitmek'),
    ('kibir', 'Tutum ve kalp', 'Kibir, büyüklenmek, böbürlenmek, zorbalık'),
    ('azginlik', 'Tutum ve kalp', 'Azgınlık, haddi aşmak, yasakları çiğnemek'),
    ('nankorluk', 'Tutum ve kalp', 'Nankörlük, nimete karşı şükretmemek'),
    ('seytana_uyma', 'Tutum ve kalp', 'Şeytana uymak, kulluk etmek, onu veli edinmek'),
    ('dunya_sevgisi', 'Tutum ve kalp', 'Dünyayı ahirete tercih etmek, servetle şımarmak, israf'),
    ('heva_atalar', 'Tutum ve kalp', 'Hevasına, ataların yoluna ve zorbalara körü körüne uymak'),
    ('zulum', 'Toplum', 'Zulüm (başkasına, kendi nefsine, ayetlere)'),
    ('fesat', 'Toplum', 'Fesat, bozgunculuk, saldırı, akrabalık bağını kesmek, tefrika'),
    ('iftira_yalan', 'Toplum', 'İftira, yalan, ifk, hıyanet'),
    ('kafirleri_dost_edinme', 'Toplum', 'Allah düşmanlarını dost edinmek, onlara boyun eğmek'),
    ('can', 'Can, namus, mal', 'Haksız yere öldürmek, işkence etmek; peygambere eza'),
    ('namus', 'Can, namus, mal', 'Zina, fuhuş, edepsizlik, Lût kavminin fiili'),
    ('mal', 'Can, namus, mal', 'Ribâ, haksız yolla mal yemek, yetim malı, cimrilik, ölçüde hile, hırsızlık'),
    ('ihtiyac_sahibini_ihmal', 'Can, namus, mal', 'Yoksulu doyurmamak, yetimi itip kakmak, yardıma engel olmak'),
    ('vahyi_tahrif', 'Ehlikitap ve ahit', 'Vahyi gizlemek, satmak, sözleri yerinden oynatmak; nimeti değiştirmek'),
    ('ahdi_bozma', 'Ehlikitap ve ahit', 'Ahdi, yemini ve sözü bozmak; sözünden dönmek'),
    ('tovbeyi_erteleme', 'Ehlikitap ve ahit', 'Tövbeyi ölüme ya da azabı görmeye bırakmak'),
    ('savastan_kacma', 'Allah yolu', 'Seferden geri kalmak, savaştan kaçmak, hicret etmemek'),
    ('ibadet_ihmal', 'İbadet', 'Namazı terk etmek, namazda gaflet, riya, kıyıdan ibadet; ibadetten ve secdeden kaçınmak'),
    ('genel_adlandirma', 'Davranışı adlandırılmayanlar', 'Genel adlandırma: günah, suç, kötülük, fısk, sapıklık, hata'),
    ('sonuc_tanimi', 'Davranışı adlandırılmayanlar', 'Davranış söylenmeden sonuçla tanımlananlar: tartıları hafif gelenler, adıyla anılanlar'),
    ('ilke', 'Karşılık ilkeleri', 'Davranış değil, karşılığın işleyiş ilkesi (ör. uyarı gelmeden helâk yok)'),
]
DNAME = {k for k, _, _ in DAVRANIS}

BOL = {
    'siddete_dusku_bedbaht': ['genel_adlandirma'], 'en_bedbaht': ['genel_adlandirma'], 'calisip_yorulan_yuzler': ['sonuc_tanimi'],
    'atesi_yalanlama': ['ahiret_inkar'], 'galip_topluluk_iddiasi': ['kibir'], 'esir_ve_dunyalik_isteme': ['dunya_sevgisi'],
    'gecimde_simarma': ['dunya_sevgisi'], 'mal_ve_evladin_fayda_vermemesi': ['nifak'], 'hicret_etmeyip_nefse_zulmetme': ['savastan_kacma'],
    'red_sayili_gun': ['allah_hakkinda_yanlis'], 'soy_iddiasi': ['allah_hakkinda_yanlis'],
    'haddi_asma_zulum': ['azginlik'], 'nankorluk_inatcilik': ['nankorluk', 'azginlik'],
    'allaha_hosa_gitmeyen_isnat': ['allaha_iftira'], 'rahmana_karsi_isyan': ['azginlik'],
    'azginlik_ve_zulum': ['azginlik'], 'yalanlama_isyan_ilahlik_iddiasi': ['ayetleri_yalanlama', 'azginlik'],
    'boşa_calisma': ['genel_adlandirma'], 'bos_lakirdiya_dalma': ['alay'],
    'ayetleri_ve_ahireti_inkar': ['ayetleri_yalanlama', 'ahiret_inkar'],
    'ayetleri_ve_ahireti_yalanlama': ['ayetleri_yalanlama', 'ahiret_inkar'],
    'ayetleri_ve_likaullahi_inkar': ['ayetleri_yalanlama', 'ahiret_inkar'],
    'sirk_nankorluk': ['sirk', 'nankorluk'], 'yuz_cevirme_nankorluk': ['yuz_cevirme', 'nankorluk'],
    'nankorluk_ve_ahireti_inkar': ['nankorluk', 'ahiret_inkar'], 
    'kufur_ve_ayetleri_yalanlama': ['kufur', 'ayetleri_yalanlama'], 'kufur_ve_ikiyuzluluk': ['kufur', 'nifak'],
    'zulum_ve_azginlik': ['zulum', 'azginlik'], 'zulum_ve_bobürlenme': ['zulum', 'kibir'],
    'ayetleri_yalanlama_ve_kibir': ['ayetleri_yalanlama', 'kibir'],
    'kibir_azginlik': ['kibir', 'azginlik'], 'kibir_inkar_iblis': ['kibir', 'kufur'],
    'haksiz_buyukluk_ve_ayetlere_karsi_cikma': ['kibir', 'ayetleri_yalanlama'], 'haksiz_buyukluk_ve_gercege_ters_dusme': ['kibir', 'kufur'],
    'buyukluk_ve_suc': ['kibir', 'genel_adlandirma'], 'haksiz_sevinc_ve_kibir': ['dunya_sevgisi', 'kibir'],
    'allaha_iftira_ile_rizki_haramlastirma': ['allaha_iftira'], 'allaha_iftira_ve_zulum': ['allaha_iftira', 'zulum'],
    'allaha_iftira_helal_haram': ['allaha_iftira'], 'allaha_yalan_duzme_hakki_yalanlama': ['allaha_iftira', 'ayetleri_yalanlama'],
    'duzenbazlik_ve_sirke_cagirma': ['sirk', 'iftira_yalan'], 
    'yuz_cevirme_ve_resule_iftira': ['yuz_cevirme', 'ayetleri_yalanlama'], 'azginlik_ve_emirden_cikma': ['azginlik', 'resule_isyan'],
    'isyan_ve_fesad': ['azginlik', 'fesat'], 'savas_ve_fesad': ['fesat'], 'ayetleri_dinleyip_kibirle_inat': ['kibir', 'yuz_cevirme'],
    'ayetlerden_kibirle_yuz_cevirme': ['kibir', 'yuz_cevirme'], 'kibirle_arka_donme': ['kibir', 'yuz_cevirme'],
    'kibirle_ibadetten_uzaklasma': ['kibir', 'ibadet_ihmal'], 'secde_etmeme_kibir': ['kibir'],
    'kurani_dinleyip_secde_etmeme': ['yuz_cevirme', 'ibadet_ihmal'], 'firavuna_itaat_fisk': ['heva_atalar', 'genel_adlandirma'],
    'servette_sismanlik_fisk': ['dunya_sevgisi', 'genel_adlandirma'], 'servet_ve_refahla_simarma': ['dunya_sevgisi'],
    'ikiyuzlu_yemin': ['nifak', 'iftira_yalan'], 'ayetlerde_kanitsiz_mucadele': ['ayetleri_yalanlama', 'kibir'],
    'allah_yolundan_saptirma_alay': ['allah_yolundan_alikoyma', 'alay'], 'yemini_kalkan_edinip_allah_yolundan_alikoyma': ['ahdi_bozma', 'allah_yolundan_alikoyma'],
    'yuz_cevirme_savastan': ['savastan_kacma', 'yuz_cevirme'], 'tevella_yuz_cevirme': ['kafirleri_dost_edinme', 'yuz_cevirme'],
    'dusmanlikta_yardimlasma': ['fesat'], 'gunah_dusmanlik_resule_isyan_fisildasmasi': ['fesat', 'resule_isyan'],
    'firavuna_itaat': ['heva_atalar'], 'olum_aninda_iman': ['tovbeyi_erteleme'], 'sert_azabi_gorunce_iman': ['tovbeyi_erteleme'],
    'tovbeyi_olume_birakma': ['tovbeyi_erteleme'], 'azap_kalkinca_sozden_donme': ['ahdi_bozma'], 'eski_haline_donme': ['ahdi_bozma'],
    'hidayet_belli_olduktan_sonra_donme': ['kufur', 'seytana_uyma'], 'seytanin_susledigi_amel': ['seytana_uyma'],
    'mal_ve_evlada_guvenme_ateş': ['dunya_sevgisi'], 'mal_ve_evladin_zikirden_alikoymasi': ['dunya_sevgisi', 'yuz_cevirme'],
    'esine_hiyanet_nuh_lut_karilari': ['iftira_yalan'], 'esmada_sapma': ['allah_hakkinda_yanlis'],
    'dini_yalan_sayma': ['ahiret_inkar'], 'sozu_degistirme': ['vahyi_tahrif'],
    'baska_din_arama': ['kufur'], 'davetciye_uymama': ['resule_isyan'], 'dinde_izinsiz_yasalastirma': ['allaha_iftira'],
    'ebu_leheb_davranisi_belirtilmemis': ['sonuc_tanimi'], 'mizan_hafif': ['sonuc_tanimi'], 'ilke_uyarisiz_helak_yok': ['ilke'],
    'imana_cagriya_inkar': ['kufur'], 'koruklugu_hidayete_tercih': ['kufur'], 'kazandiklarinin_kalp_pasi': ['genel_adlandirma'],
    'kurani_buyu_ve_insan_sozu_sayma': ['ayetleri_yalanlama'], 'hayri_engelleme': ['ihtiyac_sahibini_ihmal'],
    'cirkin_haber_yayma': ['fesat'], 'ogutten_kacinma_bedbaht': ['yuz_cevirme'], 'kuskuyla_oynayip_oyalanma': ['suphe'],
    'allaha_ve_resulune_iman_etmeme': ['kufur'], 'zorbaya_uyma': ['heva_atalar'], 'sukretmeme_inanmama': ['nankorluk'],
    'esirden_fidye_alma': ['dunya_sevgisi'], 'tuzak_kurma': ['fesat'], 'buyuk_hile': ['fesat'], 'kotuluk_icin_tuzak': ['fesat'],
    'kotuluk_tuzagi': ['fesat'], 
    'deve_boğazlama': ['azginlik'], 'deve_kesme': ['azginlik'], 'deveye_zarar': ['azginlik'], 'deveyi_kesme': ['azginlik'],
}

KURAL = [
    (r'^(nifak|munafik|ikiyuzlu|ikiyuzluluk)', 'nifak'),
    (r'^(ahirete_|ahireti_|ahirette_|likaullah|kiyameti|din_gununu|red_sayili|rabbi_inkar_diriligi|rabbe_kavusmayi|allaha_kavusmayi|kuskuyla_oynayip)', 'ahiret_inkar'),
    (r'^(allaha_iftira|allaha_yalan|allaha_resule_yalan)', 'allaha_iftira'),
    (r'^(allah_hakkinda|allaha_fakir|allaha_hosa|allaha_yanlis|cirkin_sani|allahin_tuzagindan|allah_hakkinda_tartisma)', 'allah_hakkinda_yanlis'),
    (r'^(suphe|suphecilik|kuskuya|zikirden_suphe)', 'suphe'),
    (r'^(allah_yolundan|mescid|mescit|zarar_mescidi|saptirma|insanlari_sapitma|ayetlerden_uzak|allah_yolundan_alikoyma)', 'allah_yolundan_alikoyma'),
    (r'^(allah_ve_resulu_incitme|allaha_resule_karsi|allaha_ve_resulune|resule_isyan|resule_karsi|resulun_emrine|resulu_yurttan|isyan_tecavuz|isyan_hudut|isyan$|rabbe_isyan|rahmana_karsi_isyan|peygambere_eza)', 'resule_isyan'),
    (r'^(alay|ayetle_alay|ayetlerle_alay|ayetlere_direnme_ve_alay|azabi_alay|peygamberle_alay|resullerle_alay|mumine_laf_atma_alay|ayetleri_ve_resulleri_eglence|dini_oyun_eglence|ayetleri_egl|arkadan_cekistirme)', 'alay'),
    (r'^(zikirden|ayetlerden|ayetleri_unutma|ogutleri_unutma|zikri_unutma|zikre_|kurandan_alikoyma|yuz_cevirme|sirt_cevirme|kalp_goz_kulak|allahi_unutma|rabbin_cagrisina|ayetleri_tanimama|gaflet|kurani_dinlememe|ayetlere_inanmama)', 'yuz_cevirme'),
    (r'^(ayetleri_|ayetlere_|ayetlerde_|ayetle_|kitabi_|resulleri_|resulu_yalanlama|kariayi|uyari|yalanlama|hakki_yalanlama|indirilene|resule_inanmama|resuller_arasi|iman_etmeme_kitabi|sueybi_yalanlama|batila_iman|nimete_bogulmus|sukretmeme_inanmama|ayetleri_inkar|peygamber_arasi|allahin_indirdigini|gercekleri_hukumsuz)', 'ayetleri_yalanlama'),
    (r'^(tagut|teslis|put_edinme|sirk|ilahlik|allahtan_baska|allaha_kulluktan|veli_edinme|allaha_ortak)', 'sirk'),
    (r'^(seytan|seytani)', 'seytana_uyma'),
    (r'^(kibir|zorbalik|zorbaya|yenilmezlik|gurur|yapmadigiyla|soy_iddiasi|tevhide_karsi_kibir)', 'kibir'),
    (r'^(azginlik|yasaklari_asma|avlanma_hududu|ihramda_av|sinir_tanimama|siddete_dusku|buyruktan_yan)', 'azginlik'),
    (r'^(nankorluk|nimete_nankorluk|nimeti_ilme_baglama|tersine_gitme|nimeti_degistirme)', 'nankorluk'),
    (r'^(dunya|israf|servet|mal_biriktirme|mal_yigma|mirasi_yeme|cogalma|boşa_calisma)', 'dunya_sevgisi'),
    (r'^(heva|hevasini|atalara|buyuklere_itaat|kafirlere_boyun|zalime_meyletme)', 'heva_atalar'),
    (r'^(kafirleri_dost|gazap_edilen|savasan_dusman)', 'kafirleri_dost_edinme'),
    (r'^(zulum|nefse_zulum|ayetlere_zulum|haksizliga_sapma|insanlara_zulum|zorbalik)', 'zulum'),
    (r'^(seferden|savastan|hicret_etmeme|yuz_cevirme_savastan)', 'savastan_kacma'),
    (r'^(fesad|fesat|bozgunu|sila_kesme|tefrika|fitne|munkeri|yol_kesme|tecavuz_kisas|kotuluk_kusatma)', 'fesat'),
    (r'^(iftira|ifk|yalan|duzenbaz|hiyanet|iffetli|muminleri_haksiz|vahyi_hasetle)', 'iftira_yalan'),
    (r'^(adam_oldurme|haksiz_oldurme|peygamber_oldurme|adaleti_emredeni|kendi_canina|ilimsiz_evlat|muminlere_iskence|esirden_fidye|peygambere_tuzak|ibrahime_tuzak|tuzak_kurma|kotuluk_icin_tuzak|kotuluk_tuzagi|buyuk_hile)', 'can'),
    (r'^(zina|fahsa|erkeklere_gitme|misafirlere|edepsizlig|acik_edepsizlik)', 'namus'),
    (r'^(riba|batil_yolla|yetim_mali|cimrilik|olcude|hirsizlik|sadaka_sozunu|riya_infak|kenz)', 'mal'),
    (r'^(yoksulu|yetimi_itip|kamu_hakkina|maunu|dini_yalan)', 'ihtiyac_sahibini_ihmal'),
    (r'^(vahyi_|kelimeleri_kaydirma|sozu_degistirme|ayetleri_yalanlama_tevrati)', 'vahyi_tahrif'),
    (r'^(ahdi_|yemini_hile|yalana_yemin|sozden|eski_haline)', 'ahdi_bozma'),
    (r'^(namaz|riya$|kiyidan_ibadet|bos_lakirdiya)', 'ibadet_ihmal'),
    (r'^(gunah|suc_isleme|kotuluk|fisk|fucur|hata_gunah|sapiklik|ogutten_kacinma|kismen_inkar|iman_sonra|imandan_sonra|irtidad|kufur|imani_kufurle|imanla_kufur|allaha_inanmama|indirilene_inanmama|cirkin|iman_etmeme)', 'kufur'),
]
GENEL = r'^(gunah|suc_isleme|kotuluk|fisk|fucur|hata_gunah|sapiklik|kotuluk_|fisk_sapkinlik)'


def esle(raw):
    if raw in BOL:
        return BOL[raw]
    if re.match(GENEL, raw):
        return ['genel_adlandirma']
    for p, k in KURAL:
        if re.search(p, raw):
            return [k]
    return None


rows = []
for line in (HERE / 'k09_kayit.tsv').read_text(encoding='utf8').splitlines():
    if not line.strip() or line.startswith('#'):
        continue
    f = line.split('\t') + [''] * 7
    rows.append(dict(blok=f[0], ham=f[1], nitelik_ayet=f[2], odul_ayet=f[3], odul=f[4], derece=f[5], not_=f[6]))

eksik = sorted({r['ham'] for r in rows if esle(r['ham']) is None})
if eksik:
    print('EŞLENMEYEN:', eksik)
    sys.exit(1)
yanlis = sorted({k for r in rows for k in esle(r['ham']) if k not in DNAME})
if yanlis:
    print('TANIMSIZ KANONİK:', yanlis)
    sys.exit(1)


def ref2(r):
    s, a = map(int, r.split(':'))
    return s, a


grup = defaultdict(list)
for r in rows:
    for k in esle(r['ham']):
        grup[k].append(r)
DER = {'✓': 3, '→': 2, '?': 1}
out = []
for k, g, e in DAVRANIS:
    rs = grup.get(k, [])
    if not rs:
        print('BOŞ:', k)
        continue
    # aynı (davranış ayeti, ceza ayeti, ceza) üçlüsünü birleştir; en yüksek derece kalır
    seen = {}
    for r in rs:
        key = (r['nitelik_ayet'], r['odul_ayet'], r['odul'])
        if key not in seen or DER[r['derece']] > DER[seen[key]['derece']]:
            seen[key] = r
    kay = sorted(seen.values(), key=lambda r: (ref2(r['nitelik_ayet']), ref2(r['odul_ayet'])))
    out.append(dict(
        id=k, grup=g, etiket=e,
        ayet_sayisi=len({r['nitelik_ayet'] for r in kay}),
        kayitlar=[dict(blok=r['blok'], nitelik_ayet=r['nitelik_ayet'], odul_ayet=r['odul_ayet'], odul=r['odul'],
                       derece=r['derece'], ham=r['ham'], not_=r['not_']) for r in kay]))
refs = sorted({x for r in rows for x in (r['nitelik_ayet'], r['odul_ayet']) if re.match(r'^\d+:\d+$', x)}, key=ref2)
ayet = {x: dict(ar=body[ref2(x)], tr=yn.get(ref2(x), '')) for x in refs}
veri = dict(konu=9, baslik='Cehenneme ve azaba götüren davranışlar', nitelikler=out, ayetler=ayet,
            istatistik=dict(kayit=len(rows), ayet=len(refs), derece={d: sum(1 for r in rows if r['derece'] == d) for d in DER}))
(HERE.parent / 'veri').mkdir(exist_ok=True)
(HERE.parent / 'veri' / 'konu09.json').write_text(json.dumps(veri, ensure_ascii=False, indent=0), encoding='utf8')
for n in out:
    print(f"{n['grup']:30} {n['id']:24} ayet={n['ayet_sayisi']:3} kayit={len(n['kayitlar']):3}")
print(veri['istatistik'])
