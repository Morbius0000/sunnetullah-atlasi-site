"""Konu 7 hedef ayetleri: helal ve haram (yiyecek-içecek, evlilik, av, zenginlik/süs) - Arapça sözlük, ayet düzeyinde."""
import json, re
from collections import Counter
from ortak import body, toks, ref
def fold(w): return re.sub('[أإآٱ]','ا',w).replace('ؤ','و').replace('ئ','ى').replace('ي','ى').replace('ة','ه')
PF = r'(?:و|ف|ب|ل|ك|ال|لل|ولل|وال|فال|بال|وب|ول|فل|فب|وبال|س|وس)?'
TOK = {
 'haram': r'(?:حرم|حرمت|حرمنا|حرمه|تحرمو|يحرمو|حرمو|محرم|حرام|حرمات|محرمه|يحرمون|تحرم|حرمها|حرمته)',
 'hall': r'(?:احل|احلت|احلو|يحل|تحل|حلال|حلالا|يحلونه|تحلو|احلل|يحلو|حلئل|حل)$',
 'tayyib': r'(?:طيب|طيبت|الطيبت|خبيث|الخبيث|خبائث|الخبئث)',
 'meyte': r'(?:ميته|الميته|ميتا|الميتة|ميتة)',
 'dem': r'(?:الدم|دما)', 'hinzir': r'(?:خنزير)', 'ihlal': r'(?:اهل)$',
 'mutaredde': r'(?:منخنقه|موقوذه|متردي|نطيحه|اكل السبع|ذكيتم|النصب|تستقسمو|ازلم)',
 'zebh': r'(?:ذبح|ذكر اسم|يذكر|تاكلو|فكلو|كلو|اكلو)',
 'sayd': r'(?:صيد|الصيد|صيدا)',
 'khamr': r'(?:خمر|الخمر|ميسر|الميسر|انصاب|ازلم|سكر|سكرى|سكارى|رجس)',
 'nikah': r'(?:تنكحو|ينكحن|انكحو|نكح|نكاح|امهتكم|بناتكم|اخوتكم|عمتكم|خلتكم|ربئبكم|حلئل|محصنت|المحصنت|تجمعو|الاختين|اختين|ازوج|ازواج|ءابائكم|اباءكم|مشركت|مشرك|فتيتكم|اجور|نسائكم|حلئلكم|رضعنكم|اخوتكم من الرضعه)',
 'tilavet': r'(?:بحيره|سائبه|وصيله|حام)', 'zinet': r'(?:زينه|زينت|الزينه)',
 'yiyecek': r'(?:اطعمه|طعام|يطعمه|طاعم)',
}
PAT = {k: re.compile('^' + fold(PF) + fold(v)) for k, v in TOK.items()}
hits = {}
for k in sorted(body):
    t = [fold(n) for _, n in toks(*k)]
    h = {}
    for w in t:
        for n, p in PAT.items():
            if p.search(w): h.setdefault(n, []).append(w)
    if h: hits[ref(k)] = h
json.dump(hits, open('out/hedef_yasak7_tum.json','w'), ensure_ascii=False)
def guclu(h):
    if 'haram' in h or 'hall' in h or 'tayyib' in h or 'meyte' in h or 'hinzir' in h or 'mutaredde' in h or 'khamr' in h or 'tilavet' in h or 'sayd' in h: return True
    if 'nikah' in h and ('nikah' in h): return len(set(h['nikah'])) >= 1 and any(re.search(fold('تنكحو|ينكحن|انكحو|نكح|نكاح|امهتكم|بناتكم|عمتكم|خلتكم|ربئبكم|الاختين|محصنت|حلئل'), w) for w in h['nikah'])
    if 'dem' in h and 'zebh' in h: return True
    return False
g = {k: v for k, v in hits.items() if guclu(v)}
json.dump(g, open('out/hedef_yasak7.json','w'), ensure_ascii=False)
print(len(hits), len(g), dict(Counter(n for v in g.values() for n in v)))
