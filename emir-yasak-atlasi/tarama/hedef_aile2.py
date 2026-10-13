"""Konu 2 hedef ayetleri: aile ve toplum emirleri (anne-baba, akraba, yetim, yoksul/miskin/yolcu, komşu) - Arapça sözlük, ayet düzeyinde."""
import json, re
from collections import Counter
from ortak import body, toks, ref
def fold(w): return re.sub('[أإآٱ]','ا',w).replace('ؤ','و').replace('ئ','ى').replace('ي','ى').replace('ة','ه')
PF = r'(?:و|ف|ب|ل|ك|ال|لل|ولل|وال|فال|بال|وب|ول|فل|فب|وبال|س|وس)?'
TOK = {
 'anne_baba': r'(?:والدىن|ولدىن|ولدىه|ولدىك|ولدت|ولدتك|ولدتى|والدى|والدىك|والدته|والدتى|والدتك|والده|ابوىه|ابوىك|ابواه|ابوى|والد|والدت|والدا|امك|امهت|امهتكم|امهتهم)$',
 'akraba': r'(?:الارحام|ارحام|ارحامكم|القربى|قربى|الاقربىن|اقربىن|اقربون|الاقربون|قرباه|قربتهم)$',
 'yetim': r'(?:ىتىم|ىتىما|اليتىم|ىتامى|اليتامى|ىتىمىن|ىتمى)$',
 'yoksul': r'(?:مسكىن|مساكىن|المسكىن|المساكىن|مسكىنا|فقراء|الفقراء|فقىر|الفقىر|السائل|سائل|المحروم|للسائل)$',
 'yolcu': r'(?:السبىل)$',
 'komsu': r'(?:الجار|جار|الجنب|جنب|بالجنب)$',
}
PAT = {k: re.compile('^' + fold(PF) + fold(v)[:-2] + 'ا?)$') for k, v in TOK.items()}
hits = {}
for k in sorted(body):
    tl = [fold(n) for _, n in toks(*k)]
    h = {}
    for i, w in enumerate(tl):
        for n, p in PAT.items():
            if p.search(w):
                if n == 'yolcu' and not (i > 0 and tl[i-1] in ('ابن', 'وابن', 'ابنا')): continue
                if n == 'komsu' and w.endswith('جنب') and not w.startswith(('ال', 'ب')) and w != 'جار': continue
                h.setdefault(n, []).append(w)
    if h: hits[ref(k)] = h
json.dump(hits, open('out/hedef_aile2.json','w'), ensure_ascii=False)
print(len(hits), dict(Counter(n for v in hits.values() for n in v)))
