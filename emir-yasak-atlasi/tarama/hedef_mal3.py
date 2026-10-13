"""Konu 3 hedef ayetleri: mal ve infak (infak, zekât, sadaka, karz-ı hasen, cimrilik, kenz) - Arapça sözlük, ayet düzeyinde."""
import json, re
from collections import Counter
from ortak import body, toks, ref
def fold(w): return re.sub('[أإآٱ]','ا',w).replace('ؤ','و').replace('ئ','ى').replace('ي','ى').replace('ة','ه')
PF = r'(?:و|ف|ب|ل|ك|ال|لل|ولل|وال|فال|بال|وب|ول|فل|فب|وبال|س|وس)?'
TOK = {
 'infak': r'(?:ا?نفق\w*|[ىتن]نفق\w*|نفقه|نفقت\w*|نفقتهم|نفقتكم|ننفق|ىنفق\w*|تنفق\w*|انفاق\w*|منفق\w*)$',
 'zekat': r'(?:زكوه|زكوتهم|زكوتكم|زكوت)$',
 'sadaka': r'(?:صدقه|صدقت|صدقتكم|صدقتهم|صدقتها|ىصدقوا|تصدقوا|تصدق|تصدقن|تصدقت|المصدقىن|المصدقت|مصدقىن|متصدق|صدقتى)$',
 'karz': r'(?:قرضا|ىقرض|ىقرضو|اقرضو|اقرضوا|المقرضىن|المقرضت|ىقرضون)$',
 'bukhl': r'(?:ىبخلون|بخل|بخلوا|بخىل|البخل|ببخل|ىبخل|شح|الشح|شحىحه|ببخلهم|تبخلون|البخل)$',
 'kenz': r'(?:ىكنزون|كنزتم|كنزوا|تكنزون)$',
}
PAT = {k: re.compile('^' + fold(PF) + fold(v)[:-2] + 'ا?)$') for k, v in TOK.items()}
hits = {}
for k in sorted(body):
    tl = [fold(n) for _, n in toks(*k)]
    h = {}
    for w in tl:
        for n, p in PAT.items():
            if p.search(w): h.setdefault(n, []).append(w)
    if h: hits[ref(k)] = h
json.dump(hits, open('out/hedef_mal3.json','w'), ensure_ascii=False)
print(len(hits), dict(Counter(n for v in hits.values() for n in v)))
