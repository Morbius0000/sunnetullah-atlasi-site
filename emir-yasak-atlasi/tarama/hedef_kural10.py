"""Konu 10 hedef ayetleri: karşılığın kuralları (zerre, tövbe, bağışlanma sınırı, derece, misli, sorumluluk, zulüm yok, kat kat, amelin boşa çıkması)."""
import json, re
from collections import Counter
from ortak import body, toks, ref
def fold(w): return re.sub('[أإآٱ]','ا',w).replace('ؤ','و').replace('ئ','ى').replace('ي','ى').replace('ة','ه')
PF = r'(?:و|ف|ب|ل|ك|ال|لل|ولل|وال|فال|بال|وب|ول|فل|فب|وبال|س|وس)?'
TOK = {
 'zerre': r'(?:ذره|ذرت|مثقال|مثقالا|بمثقال|مثقل)$',
 'tevbe': r'(?:تاب|تابوا|ىتوب|ىتوبوا|توبه|التوبه|توبوا|تتوبوا|متابا|التوبىن|تىبون|فتابوا|ىتب|فتب|تواب|التواب|توابا|توابىن|التوابىن|التوب|توبا|تابا|تائبىن|التىبون|التىب|تائب|ىتوبون|اناب|انابوا|ىنىب|منىب|منىبىن|تاب)$',
 'derece': r'(?:درجت|درجه|الدرجت|درجتهم|درجات|ىستوى|ىستوون|ىستوىان|تستوى|ىستو|سوى|افمن)$',
 'kat': r'(?:ىضعف|ىضعفه|ضعفىن|اضعافا|مضعفه|فىضعفه|لىضعفه|ضعفا|اضعاف|ضعف|ىضعفها|ىضعفوا|تضعف|فىضعفه)$',
 'bosa': r'(?:حبطت|ىحبط|احبط|فاحبط|ىحبطن|فىحبط|لىحبطن|حبط|احبطت)$',
 'sorumluluk': r'(?:تزر|وازره|ىزر|وزر|وزرا|اوزارهم|اوزار|اوزارا|ىحملو|لىحملن|رهىن|رهىنه)$',
 'zulumyok': r'(?:فتىلا|نقىرا|قطمىر|ىظلمون|تظلمون|ىظلم|تظلم|ظلما|هضما)$',
}
PF2 = r'(?:و|ف|ل|ب|ال|وال|فال|لل|س|وس)?'
PAT = {k: re.compile('^' + fold(PF2 if k == 'tevbe' else PF) + fold(v)[:-2] + 'ا?)$') for k, v in TOK.items()}
hits = {}
for k in sorted(body):
    tl = [fold(n) for _, n in toks(*k)]
    h = {}
    for i, w in enumerate(tl):
        for n, p in PAT.items():
            if p.search(w):
                if n == 'zulumyok' and w.endswith(('ىظلمون','تظلمون','ىظلم','تظلم')) and not (i > 0 and tl[i-1] in ('لا','ولا','فلا','لن','وهم')): continue
                if n == 'sorumluluk' and w.endswith(('ىحملو','لىحملن')): continue
                if n == 'derece' and w in ('سوى','افمن'): continue
                h.setdefault(n, []).append(w)
    # misli: seyyie + misl
    if any(re.match(fold(r'^(?:ب|ف|و)?(?:مثلها|امثالها|مثلهما|مثلهم)$'), w) for w in tl) and any(re.match(fold(r'^(?:ب|ف|و|ال)?(?:سىىه|سىىت|سىئه|سىئت|حسنه|الحسنه|بالحسنه|الحسنت|السىىت|جزاء|ىجزى|فلا)$'), w) for w in tl):
        h.setdefault('misli', []).append('misl')
    # magfiret siniri
    for i, w in enumerate(tl):
        if re.match(fold(r'^(?:ب|ف|و|ل)?(?:ىغفر|ىغفرها|لىغفر)$'), w) and i > 0 and tl[i-1] in ('لا','لن','ان','ولا','فلن'):
            h.setdefault('magfiret_siniri', []).append(w)
    if h: hits[ref(k)] = h
json.dump(hits, open('out/hedef_kural10_tum.json','w'), ensure_ascii=False)
print(len(hits), dict(Counter(n for v in hits.values() for n in v)))
