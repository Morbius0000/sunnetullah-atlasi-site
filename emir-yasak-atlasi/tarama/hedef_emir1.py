"""Konu 1 hedef ayetleri: temel emirler (kulluk, adalet ve ihsan, ahde vefa, emanet, doğruluk) - Arapça sözlük, ayet düzeyinde."""
import json, re
from collections import Counter
from ortak import body, toks, ref
def fold(w): return re.sub('[أإآٱ]','ا',w).replace('ؤ','و').replace('ئ','ى').replace('ي','ى').replace('ة','ه')
PF = r'(?:و|ف|ب|ل|ك|ال|لل|ولل|وال|فال|بال|وب|ول|فل|فب|وبال|س|وس)?'
TOK = {
 'kulluk': r'(?:اعبدو|اعبد|اعبدون|اعبدنى|فاعبد|اعبده|فاعبدوه|فاعبدون|فاعبدنى|ليعبدو|يعبدو|تعبدو)$',
 'adalet': r'(?:عدل|اعدلو|تعدلو|يعدل|بالعدل|العدل|القسط|قسط|اقسطو|قوامين|اقسط|بالقسط|قسطاس|ميزان|اقيمو)$',
 'ihsan': r'(?:احسن|احسنو|احسان|الاحسان|بالاحسان|محسن|المحسنين|تحسنو|احسانا|يحسن|احسنوا)$',
 'ahd': r'(?:اوفو|اوف|فاوفو|اوفوا|بالعهد|عهد|عهدكم|عهدتم|عاهدتم|ميثق|ميثقكم|ينقضو|تنقضو|نقض|نكث|ينكثو|تنكثو|عقود|بالعقود|يوفون|يوفو|اوفى|وفى|يفو)$',
 'emanet': r'(?:امنت|الامنت|امانتكم|امنتهم|امنته|امانه|امنه|يودى|تودو|ادى|اودى|تؤدو|يؤدو|ؤدوا|ادو|وليؤد)$',
 'sidk': r'(?:صدق|اصدقو|صدقو|الصدقين|صدقين|صدقا|سديدا|الصدق|صادق|صدقت|صدقوا|قولو|قولا|يقولو|تقولو|بالصدق|بالحق|الحق)$',
}
PAT = {k: re.compile('^' + fold(PF) + fold(v)[:-2] + 'ا?)$') for k, v in TOK.items()}
hits = {}
for k in sorted(body):
    t = [fold(n) for _, n in toks(*k)]
    h = {}
    for w in t:
        for n, p in PAT.items():
            if p.search(w): h.setdefault(n, []).append(w)
    if h: hits[ref(k)] = h
json.dump(hits, open('out/hedef_emir1_tum.json','w'), ensure_ascii=False)
G = {'kulluk','ahd','emanet','adalet','ihsan'}
g = {k: v for k, v in hits.items() if any(x in G for x in v) or ('sidk' in v and any(y in ('سديدا','اصدقو','الصدقين','صدقين','بالصدق') or y.startswith('قولو') for y in map(fold,v['sidk'])))}
json.dump(g, open('out/hedef_emir1.json','w'), ensure_ascii=False)
print(len(hits), len(g), dict(Counter(n for v in g.values() for n in v)))
