"""Konu 7 ikinci geçiş (mekanik): davranış ayetinde (veya ±1 komşuda) başlığın Arapça kökü var mı? Ayrıca tarama kapsamı."""
import json, re, sys
sys.path.insert(0, '../tarama')
from ortak import toks
from k07_esle import rows, esle

def fold(w):
    return re.sub('[أإآٱ]', 'ا', w).replace('ؤ', 'و').replace('ئ', 'ى').replace('ي', 'ى').replace('ة', 'ه')

KOK = {
    'temiz_helal': r'طيب|حلل|حلا|احل|كلو|اكل|يطعم|طعام|رزق|رزقكم|غنم|ثمر|فكهه|خبيث|خبث|اطعمه|اكلو|بيوت',
    'les_kan_domuz': r'ميت|دم|خنزير|اهل|حرم|يذكر|ذكر|منخنقه|موقوذه|متردي|نطيحه|نصب|ذكيتم|السبع|اكل|تاكلو|فسق|لغير',
    'sarap_kumar': r'خمر|ميسر|سكر|سكرى|رجس|انصاب|ازلم|سكارى',
    'av_ihram': r'صيد|حرم|بحر|تقتلو|قتل|احل|حل|طعام|متاعا|الصيد',
    'nikah_haram': r'حرم|تنكحو|نكح|ينكح|امهت|ازوج|محصنت|مشرك|زان|تمسكو|ترجعو|حل|ءابا',
    'evlilik_hukumleri': r'نكح|انكحو|مثنى|ازوج|محصنت|طعام|حل|احل|اتو|اجور|ظهر|ظهرون|ادعو|ابائهم|ءابائهم|اياما|ايمى|تعدلو|ءاتيتمو|فتيتكم',
    'esle_bosanma': r'حل|حرم|نساءكم|لباس|تقربو|يطهرن|طلق|بينه|تحل|ترث|عدت|عده|تعتد|فاءو|اشهر|تربص|قروء|ينكحن|عضل|عزمتم|تعزمو|ترثو|تعضلو|يرثن|رفث|خيط',
    'haram_kilma_yetkisi': r'حرم|حلل|احل|تحرمو|يحرم|حلال|حرام|بحيره|سائبه|وصيله|حام|تحلو|زينه|طيب|رزق|ربو|بيع|خلق|فرى|كذب|اذن|رجس|شهد|ءالذكرين|ذكرين|انثيين|حمل|وصكم|حول',
    'israilogullari_haram': r'حرم|هادو|ظفر|شحوم|طيب|اسرءيل|يهود|حرمنا|حل',
}
sorun, kom = [], []
for r in rows:
    s, a = map(int, r['nitelik_ayet'].split(':'))
    metin = ' '.join(fold(n) for _, n in toks(s, a))
    komsu = metin
    for d in (-1, 1):
        try:
            komsu += ' ' + ' '.join(fold(n) for _, n in toks(s, a + d))
        except Exception:
            pass
    k = esle(r['ham'], r['tur'])
    if not re.search(fold(KOK[k]), metin):
        (kom if re.search(fold(KOK[k]), komsu) else sorun).append((k, r['nitelik_ayet'], r['blok'], r['ham']))
print('kök yok:', len(sorun), '| komşuda:', len(kom))
for x in sorun:
    print(*x, sep=' | ')
# kapsam: güçlü hedef ayetlerden hiçbir kayıtta (davranış ya da karşılık ayeti olarak) geçmeyenler
H = json.load(open('../tarama/out/hedef_yasak7.json'))
ref = {r['nitelik_ayet'] for r in rows} | {r['odul_ayet'] for r in rows}
keys = list(H.keys()) if isinstance(H, dict) else [h['ref'] if isinstance(h, dict) else h for h in H]
eksik = [k for k in keys if k not in ref]
print('hedef:', len(keys), 'kayıt dışı:', len(eksik))
json.dump(eksik, open('/tmp/claude-0/-home-claude/a9cf4c8b-f15e-5164-b4b2-8f0fd27cb07c/scratchpad/k07_eksik.json', 'w'))
print(' '.join(eksik[:400]))
