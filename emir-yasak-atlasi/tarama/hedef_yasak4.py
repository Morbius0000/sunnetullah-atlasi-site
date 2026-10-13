"""Konu 4 hedef ayetleri: şirk ve ayetleri yalanlama ile ilgili yasak/emir ve kınama ayetleri (Arapça sözlük)."""
import json, re
from ortak import body, toks, ref
def fold(w): return re.sub('[أإآٱ]','ا',w).replace('ؤ','و').replace('ئ','ى').replace('ي','ى').replace('ة','ه')
NEG = re.compile(fold(r'^(?:و|ف)?(?:لا|ان لا)$'))
PAT = {
 'serik': r'شرك|شركا|شريك|اشرك|مشرك',
 'nehiy_dua': r'^(?:و|ف)?(?:تدع|تدعو|تجعل|تجعلو|تتخذ|تتخذو|تعبد|تعبدو|تسجد|تتبع|تتبعو|تطع|تطيعو|تتولو|تنسبو|تضربو|تقولو|تكذبو|تتعبد|تشرك|تشركو|تكونن|تكن)ا?$',
 'ilah': r'اله|الهه|ءالهه|الها',
 'veled': r'ولد|بنات|بنين|صحبه',
 'tevhid': r'وحده|وحد|احد$',
 'yalanlama': r'كذب|كذبو|يكذب|مكذب|تكذب|كذاب',
 'ayet': r'^(?:و|ف|ب|ل)?(?:ايت|ءايت|ايات|ايتنا|ايتى|ايته)',
 'inkar': r'كفر|جحد|ينكر|نكر',
}
PAT = {k: re.compile(fold(v)) for k, v in PAT.items()}
hits = {}
for k in sorted(body):
    t = [fold(n) for _, n in toks(*k)]
    h = {}
    for i, w in enumerate(t):
        for n, p in PAT.items():
            if p.search(w):
                if n == 'nehiy_dua' and not (i > 0 and NEG.match(t[i-1]) or NEG.match(w.split()[0])): continue
                h.setdefault(n, []).append(w)
    if h: hits[ref(k)] = h
json.dump(hits, open('out/hedef_yasak4_tum.json','w'), ensure_ascii=False)
from collections import Counter
print(len(hits), dict(Counter(n for v in hits.values() for n in v)))
# güçlü: serik/nehiy_dua/ilah+olumsuz/veled/yalanlama+ayet
guclu = {k: v for k, v in hits.items() if 'serik' in v or 'nehiy_dua' in v or ('yalanlama' in v and 'ayet' in v) or ('veled' in v) or ('ilah' in v and 'tevhid' in v)}
json.dump(guclu, open('out/hedef_yasak4.json','w'), ensure_ascii=False)
print('guclu', len(guclu))
