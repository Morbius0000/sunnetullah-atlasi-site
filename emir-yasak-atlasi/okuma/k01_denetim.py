"""Konu 1 ikinci geçiş (mekanik): davranış ayetinde (veya ±1 komşuda) başlığın Arapça kökü var mı? Ayrıca tarama kapsamı."""
import json, re, sys
sys.path.insert(0, '../tarama')
from ortak import toks
from k01_esle import rows, esle

def fold(w):
    return re.sub('[أإآٱ]', 'ا', w).replace('ؤ', 'و').replace('ئ', 'ى').replace('ي', 'ى').replace('ة', 'ه')

KOK = {
    'kulluk': r'عبد|عبدو|عبادة|عبادت|يعبد|اعبد|نعبد|تعبد|ربب|سجد|دين|ابراهيم|طاع|خدم',
    'adalet': r'عدل|قسط|قسطاس|ميزن|ميزان|حكم|حكمت|شهد|شاهد|اقيم|حق',
    'ihsan': r'حسن|احسن|محسن|احسان|محسنين|جزاء|اجر|خير',
    'ahde_vefa': r'عهد|عقد|وفى|اوفو|نقض|ميثاق|يمين|ايمن|نذر|وعد|عاهد',
    'emanet': r'امن|امان|امانه|اتمن|ادى|يؤد',
    'dogruluk': r'صدق|صدق|صادق|صديق|صدقو|مصدق|قول|حق|جاء|يصدق',
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
H = json.load(open('../tarama/out/hedef_emir1.json'))
ref = {r['nitelik_ayet'] for r in rows} | {r['odul_ayet'] for r in rows}
keys = list(H.keys()) if isinstance(H, dict) else [h['ref'] if isinstance(h, dict) else h for h in H]
eksik = [k for k in keys if k not in ref]
print('hedef:', len(keys), 'kayıt dışı:', len(eksik))
json.dump(eksik, open('/tmp/claude-0/-home-claude/a9cf4c8b-f15e-5164-b4b2-8f0fd27cb07c/scratchpad/k01_eksik.json', 'w'))
print(' '.join(eksik[:400]))
