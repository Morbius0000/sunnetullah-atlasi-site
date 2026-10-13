"""Konu 11 hedef ayetleri: sevgi (hubb) kökü ve vedûd/vüdd. 'ىحب' (yuhibbu) + 'لا ىحب' ayrıca işaretlenir."""
import json, re
from collections import Counter
from ortak import body, toks, ref
def fold(w): return re.sub('[أإآٱ]','ا',w).replace('ؤ','و').replace('ئ','ى').replace('ي','ى').replace('ة','ه')
PF = r'(?:و|ف|ب|ل|ك|ال|لل|وال|فال|بال|وب|ول|فل|س|وس|ا)?'
YUH = re.compile('^' + fold(PF) + fold(r'(?:ىحب|ىحبه|ىحبهم|ىحبكم|ىحبكم|ىحبون|ىحبونه|ىحبونهم|تحبون|تحبونها|تحبوا|ىحبوا|ىحبها|نحب|احب|احبه|احبهم|احبوا|ىحببكم|احببت|احببتم)') + '$')
SEV = re.compile('^' + fold(PF) + fold(r'(?:احب|احبا|احباوه|احباؤه|احبوه|حبىب|حبىبه|محبه|حب|حبا|حبهم|حبه|ىحبب|حببت|حبب|ودود|الودود|ودا|وده|مودت|موده|المودت|ىود|ىودون|ود|وددتم|ودوا)') + '$')
hits = {}
for k in sorted(body):
    tl = [fold(n) for _, n in toks(*k)]
    h = {}
    for i, w in enumerate(tl):
        if YUH.match(w):
            neg = i > 0 and tl[i-1] in ('لا','ولا','فلا','لن','ما','لم')
            h.setdefault('lA_yuhibbu' if neg else 'yuhibbu', []).append(w)
        elif SEV.match(w):
            h.setdefault('diger', []).append(w)
    if h: hits[ref(k)] = h
json.dump(hits, open('out/hedef_sevgi11_tum.json','w'), ensure_ascii=False)
print(len(hits), dict(Counter(n for v in hits.values() for n in v)))
c = Counter(w for v in hits.values() for ws in v.values() for w in ws); print(c.most_common(60))
