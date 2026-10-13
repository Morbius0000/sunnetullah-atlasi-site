"""Konu 6 ikinci geçiş (mekanik): davranış ayetinde (veya ±1 komşuda) başlığın Arapça kökü var mı? Ayrıca tarama kapsamı."""
import json, re, sys
sys.path.insert(0, '../tarama')
from ortak import toks
from k06_esle import rows, esle

def fold(w):
    return re.sub('[أإآٱ]', 'ا', w).replace('ؤ', 'و').replace('ئ', 'ى').replace('ي', 'ى').replace('ة', 'ه')

KOK = {
    'allaha_iftira': r'افتر|كذب|افك|قول|تقولو|ظلم|فرى|بهتن|علم|حرم|حلل|زعم|ظن|خرص|ولد|ثلث|وحى|نزل',
    'insana_iftira': r'افك|بهتن|افتر|اثم|يرم|يرمو|اذى|يؤذون|يؤذو|اتهام|ظن|بريء|اكتسب|خطيء|خطيئه|برىء|ارجف|مرجف|يرجف|بغ|كذب|مريم',
    'hak_gizleme': r'كتم|لبس|حق|باطل|شهد|شهاده|ظل|صدور',
    'yalan_soz': r'افاك|اثيم|كذب|زور|افك|لغو|حلف|حلاف|يمين|ايمن|خوض|نميم|خرص|وهم|فتنه|لهو|ظنون',
    'alay_lakap': r'هزء|حطم|سخر|هزو|استهز|لمز|همز|قوم|نبز|القب|لقب|يلمز|هماز|مهين|مشاء|لغو|ضحك|يضحك',
    'gibet_zan': r'ظن|تجسس|يغتب|غيب|اغتاب|تغتاب',
    'kibir': r'كبر|استكبر|تصعر|مرحا|مشى|تمش|فخور|مختال|علو|يستكبر|بطر|تعلو|عتو|ظلم|متكبر|مختال|مرح|مستكبر|ظهر|ختر',
    'simarma_ovunme': r'فخر|فرح|مرح|بطر|رياء|رئاء|يراءون|تفرحو|فخور|تفخر|زكى|يزكون|تزكو|من|امن|يحمد|يفرح|مختال|بغ|بغى|فرحو|فرحون',
    'israf': r'سرف|مسرف|تبذير|تبذر|مبذر|بسط|غل|مغلول|قتر|يقتر',
    'soz_edebi': r'لغو|قول|لين|قوال|نهر|اف|صوت|ترفع|اصوات|اغضض|تقل|تقولو|تقولن|راعن|انظرن|اموات|لست|مومن|غدا|غد|شاى|جهر|تخافت|ظهر|احسن|خفض|معروف|فاء|سلام|نجو|سر',
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
H = json.load(open('../tarama/out/hedef_yasak6.json'))
ref = {r['nitelik_ayet'] for r in rows} | {r['odul_ayet'] for r in rows}
keys = list(H.keys()) if isinstance(H, dict) else [h['ref'] if isinstance(h, dict) else h for h in H]
eksik = [k for k in keys if k not in ref]
print('hedef:', len(keys), 'kayıt dışı:', len(eksik))
json.dump(eksik, open('/tmp/claude-0/-home-claude/a9cf4c8b-f15e-5164-b4b2-8f0fd27cb07c/scratchpad/k06_eksik.json', 'w'))
print(' '.join(eksik[:400]))
