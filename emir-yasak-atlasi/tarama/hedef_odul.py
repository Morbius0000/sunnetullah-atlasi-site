"""Konu 8 hedef ayetleri: ahiret ödülünü adlandıran ayetler (sözlük). Okuma için bağlam blokları üretir."""
import json, re, sys
from ortak import body, yn, toks, ref
def fold(w): return re.sub('[أإآ]','ا',w).replace('ؤ','و').replace('ئ','ى').replace('ي','ى').replace('ة','ه')
PAT = [r'^[وفبل]?(?:ال)?جن(?:ه|ات|ت|تين|تان|ته|تهم|تى|تك|تنا)$', r'فردوس', r'^(?:[وف])?عدن$', r'رضون', r'^(?:[وف]?ال)?فوز$',
       r'^(?:[وف]?ال)?غرف', r'^درجت', r'^(?:[وف]?ل?ال)?حسنى$', r'^(?:[وف]?ال)?مأوى$|^(?:[وف]?ال)?ماوى$', r'^(?:[وف]?ال)?نعيم$', r'^عليين$|^عليون$', r'^زلفى$', r'^(?:ال)?طوبى$', r'^[وف]?(?:ال)?مفلحون$|^[وف]?(?:ال)?مفلحين$|^[وف]?(?:قد)?افلح$|^تفلحون$|^يفلحون$', r'^[وف]?(?:س)?[ين]دخل(?:هم|ه|كم|ها|ن)', r'^[وف]?ادخلو', r'^مدخلا$', r'^[وف]?(?:ل)?(?:ال)?اجر(?:ا|هم|ه|كم|ها|هن)?$', r'^[وف]?اجور', r'^ثواب', r'^[وف]?مغفر', r'^[وف]?(?:ب|ل)?(?:ال)?رحم[ته]', r'^[وف]?بشر(?:ى|ا)?$|^[وف]?بشرهم$|^يبشر|^[وف]?بشرىهم|^البشرى$']
PAT = [re.compile(p) for p in PAT]
AJR = re.compile(r'^[وف]?(?:ل)?(?:ال)?اجر(?:ا|هم|ه|كم|ها|هن)?$')
QAL = re.compile(r'^(?:عظيم|عظيما|كبير|كبيرا|كريم|كريما|حسن|حسنا|غير|ممنون|العظيم|الكبير)$')
hits = {}
for k in sorted(body):
    t = [fold(n) for _, n in toks(*k)]
    h = [w for w in t if any(p.search(w) for p in PAT)]
    if h: hits[ref(k)] = h
json.dump(hits, open('out/hedef_odul.json','w'), ensure_ascii=False)
print(len(hits))
