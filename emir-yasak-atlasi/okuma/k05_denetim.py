"""Konu 5 ikinci geçiş (mekanik): davranış ayetinde (veya ±1 komşuda) başlığın Arapça kökü var mı? Ayrıca tarama kapsamı."""
import json, re, sys
sys.path.insert(0, '../tarama')
from ortak import toks
from k05_esle import rows, esle

def fold(w):
    return re.sub('[أإآٱ]', 'ا', w).replace('ؤ', 'و').replace('ئ', 'ى').replace('ي', 'ى').replace('ة', 'ه')

KOK = {
    'haksiz_oldurme': r'قتل|سفك|دماء|دمائكم|نفس|ذبح|اقتل|قاتل|قتلو|مقتول|قتلى|انفس|هلك|يقتل|عدو|اوتى',
    'cocuk_oldurme': r'قتل|ولد|اولد|وءد|موود|دسه|ذبح|يذبحون|ابناء|بنت|املق|خشيه|ابنائكم|يقتلون|سفه|نسى|وليد|حى|يستحيون',
    'peygamber_oldurme': r'قتل|نبى|نبين|رسول|يقتلون|اقتل|عدل|قسط|يامرون',
    'kisas_diyet': r'قصاص|قتل|قتلى|ديه|مسلمه|نفس|عين|حيو|قصص|تحرير|رقبه',
    'zina': r'زان|زن|فحش|فاحش|فوحش|فرج|بغاء|فتيت|احصن|حصن|ياتي|تقرب|يزن|بغي|اتين|فتح|سفح|محصن',
    'kazf': r'يرمون|محصن|زن|قذف|رمى|افك|ازوج|يرم|شهد|شهد|جلد|بهتن',
    'fahsa': r'فحش|فاحش|فوحش|فحشاء|منكر|ياتون|تاتون|رجال|ذكران|خبث|سوء|زن|اثم|شيطن|ازواج|لوط|عمل|نكاح|بغ|امر|نسى',
    'irzi_koruma': r'فرج|بصر|ابصر|فروج|حفظ|زين|خمر',
    'riba': r'ربو|ربا',
    'yetim_mali': r'يتم|يتمى|يتيم|اموال|مال|تراث|ارث|تاكلون|ياكلون|اكل|كمل|يوفو|حب',
    'batil_mal': r'مال|اموال|باطل|بطل|اكل|سحت|ارث|حرام|ظلم|اخذ|عضل|ياكلون|تاكلو|تاكلون|حرم|تدلو|اثم|تراث|رضى|ذكر|ربو|اكلون',
    'hirsizlik_hiyanet': r'سرق|سارق|غل|يغل|خون|خان|يغلل|عمل|قطع',
    'olcu_tarti': r'كيل|وزن|ميزان|مطفف|بخس|قسط|اوفو|تخسر|طغو|تبخس|كالو|وزنو|يطفف|اكتالو|قسطاس|اشياء',
    'kenz': r'كنز|ذهب|فضه|ينفق|يكنز',
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
H = json.load(open('../tarama/out/hedef_yasak5.json'))
ref = {r['nitelik_ayet'] for r in rows} | {r['odul_ayet'] for r in rows}
keys = list(H.keys()) if isinstance(H, dict) else [h['ref'] if isinstance(h, dict) else h for h in H]
eksik = [k for k in keys if k not in ref]
print('hedef:', len(keys), 'kayıt dışı:', len(eksik))
json.dump(eksik, open('/tmp/claude-0/-home-claude/a9cf4c8b-f15e-5164-b4b2-8f0fd27cb07c/scratchpad/k05_eksik.json', 'w'))
print(' '.join(eksik[:400]))
