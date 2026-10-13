"""Konu 5 hedef ayetleri: can, namus ve mal yasakları (Arapça sözlük, ayet düzeyinde)."""
import json, re
from collections import Counter
from ortak import body, toks, ref
def fold(w): return re.sub('[أإآٱ]','ا',w).replace('ؤ','و').replace('ئ','ى').replace('ي','ى').replace('ة','ه')
NEG = re.compile(fold(r'^(?:و|ف)?(?:لا|ان لا|ولا)$'))
QTL = re.compile(fold(r'^(?:و|ف|ل|ا)?(?:تقتل|يقتل|قتل|قتلو|قتلت|اقتل|نقتل|تقتلو|يقتلو|قتلتم|يقتلون|قتلوا)'))
PF = r'(?:و|ف|ب|ل|ك|ال|لل|ولل|وال|فال|بال|وب|ول|فل|فب|وبال|ولل)?'
TOK = {
 'qatl': r'(?:قتل|اقتل|يقتل|تقتل|نقتل|قاتل|يقاتل|مقتول|قتلو|قتلى)',
 'nafs': r'(?:نفس|انفس)',
 'ulad': r'(?:اولد|ولد)',
 'wad': r'(?:موءود|موود|املق|وءد|يدسه)',
 'nebi': r'(?:نبى|نبين|نبيين|نبييين)',
 'kisas': r'(?:قصاص|قتلى|ديه|مسلمه)',
 'zina': r'(?:زنى|زنا|زان|زنو|يزن|تزن)',
 'fahse': r'(?:فحش|فاحش|فواحش|فوحش|فحشاء)',
 'luth': r'(?:ياتون|تاتون|ذكران|رجال)',
 'kazf': r'(?:يرمون|ترمو|محصن)',
 'bagy': r'(?:بغاء|فتيت)',
 'sirk': r'(?:سرق|سارق|يسرق|تسرق)',
 'riba': r'(?:ربو|ربا)ا?$',
 'mal': r'(?:مال|اموال|امول)',
 'batil': r'(?:باطل|بطل)',
 'yetim': r'(?:يتم|يتمى|يتيم)',
 'olcu': r'(?:كيل|ميزان|مطفف|بخس|تبخس|مكيال|يطفف|وزن|قسطاس|اوفو|توفو)',
 'gulul': r'(?:يغل|يغلل)$',
 'rusvet': r'(?:تدلو|ادلو)',
 'suht': r'(?:سحت)',
 'kenz': r'(?:يكنز|كنز|تكنز)',
 'ekl': r'(?:ياكل|تاكل|ياكلو|تاكلو|اكل|ياكلون|تاكلون)',
 'israf': r'(?:تبذر|مبذر)',
 'sefk': r'(?:سفك|دماء|دمائكم|تسفكون|يسفك|ذبح|يذبح)',
}
PAT = {k: re.compile('^' + fold(PF) + fold(v) if not v.endswith('$') else '^' + fold(PF) + fold(v)) for k, v in TOK.items()}
hits = {}
for k in sorted(body):
    t = [fold(n) for _, n in toks(*k)]
    h = {}
    for i, w in enumerate(t):
        for n, p in PAT.items():
            if p.search(w): h.setdefault(n, []).append(w)
        if QTL.match(w) and i > 0 and NEG.match(t[i-1]): h.setdefault('qatl_nehiy', []).append(w)
        if i > 0 and NEG.match(t[i-1]) and re.match(fold(r'^(?:و|ف)?(?:تقرب|تاكل|ياكل|تبخس|تطفف|تنقص|تعثو|تسرق|تزن|يزن|تاتو|يرم)'), w): h.setdefault('nehiy_diger', []).append(w)
    if h: hits[ref(k)] = h
json.dump(hits, open('out/hedef_yasak5_tum.json','w'), ensure_ascii=False)
def A(h,*n): return all(x in h for x in n)
def guclu(h):
    return ('qatl_nehiy' in h or 'nehiy_diger' in h or A(h,'qatl','nafs') or A(h,'qatl','ulad') or A(h,'qatl','nebi') or 'kisas' in h or 'wad' in h
            or 'zina' in h or 'fahse' in h or 'kazf' in h or 'bagy' in h or 'sirk' in h or 'riba' in h or A(h,'ekl','batil') or A(h,'yetim','mal')
            or ('olcu' in h and any(re.search(fold('كيل|ميزان|مطفف|بخس|وزن|قسطاس'), x) for x in h['olcu'])) or 'gulul' in h or 'rusvet' in h or 'suht' in h or 'kenz' in h or 'sefk' in h)
g = {k: v for k, v in hits.items() if guclu(v)}
json.dump(g, open('out/hedef_yasak5.json','w'), ensure_ascii=False)
print(len(hits), len(g), dict(Counter(n for v in g.values() for n in v)))
