"""Konu 6 hedef ayetleri: söz ve davranış yasakları (yalan, iftira, alay, gıybet, kibir, israf) - Arapça sözlük, ayet düzeyinde."""
import json, re
from collections import Counter
from ortak import body, toks, ref
def fold(w): return re.sub('[أإآٱ]','ا',w).replace('ؤ','و').replace('ئ','ى').replace('ي','ى').replace('ة','ه')
PF = r'(?:و|ف|ب|ل|ك|ال|لل|ولل|وال|فال|بال|وب|ول|فل|فب|وبال)?'
NEG = re.compile('^' + fold(r'(?:و|ف)?(?:لا|ان لا|ولا|الا)$'))
TOK = {
 'zur': r'(?:زور)', 'ifk': r'(?:افك|افاك|افتر|بهتن|بهت)', 'lumaz': r'(?:لمز|يلمز|لمزه)', 'hamz': r'(?:همز|همزه|هماز)',
 'nabz': r'(?:تنابز|القب)', 'sukhr': r'(?:سخر|يسخر|تسخر|سخرو|استهز|هزو)', 'ghayb': r'(?:يغتب|غيبه)', 'tajassus': r'(?:تجسس|تجسسو)',
 'nemime': r'(?:نميم|مشاء|حلاف|مهين)', 'kibir': r'(?:تصعر|مرحا|مختال|فخور|فخر|يفخر|تفرح|بطر)',
 'israf': r'(?:سرف|اسراف|تسرفو|تبذر|مبذر|بذر)', 'basit': r'(?:البسط)',
 'zan': r'(?:ظن)', 'jahr': r'(?:تجهر|يجهر|الجهر|اغضض|اصوت|صوت)', 'lagv': r'(?:تقف)', 'kizb': r'(?:كذب|تكذب|كاذب|كذاب)',
 'soz_fiil': r'(?:تقولو|تقل|يقل|تقولن)', 'ule': r'(?:تستكبرو|تخونو|تؤذو|تاذو|تلبسو|تكتمو|تمنو|تفخر|تمش|تلمزو|تعلو|تغلو)',
}
PAT = {k: re.compile('^' + fold(PF) + fold(v)) for k, v in TOK.items()}
hits = {}
for k in sorted(body):
    t = [fold(n) for _, n in toks(*k)]
    h = {}
    for i, w in enumerate(t):
        for n, p in PAT.items():
            if p.search(w): h.setdefault(n, []).append(w)
        if i > 0 and NEG.match(t[i-1]):
            for n in ('soz_fiil', 'ule', 'jahr', 'sukhr', 'israf', 'kibir', 'zan', 'lagv'):
                if PAT[n].search(w): h.setdefault('nehiy_' + n, []).append(w)
    if h: hits[ref(k)] = h
json.dump(hits, open('out/hedef_yasak6_tum.json','w'), ensure_ascii=False)
def guclu(h):
    return any(x in h for x in ('zur','ifk','lumaz','hamz','nabz','ghayb','tajassus','nemime','kibir','israf','basit')) or any(x.startswith('nehiy_') for x in h) or ('sukhr' in h and ('قوم' in ''.join(h.get('sukhr',[])) or True) and False)
g = {k: v for k, v in hits.items() if guclu(v)}
json.dump(g, open('out/hedef_yasak6.json','w'), ensure_ascii=False)
print(len(hits), len(g), dict(Counter(n for v in g.values() for n in v)))
