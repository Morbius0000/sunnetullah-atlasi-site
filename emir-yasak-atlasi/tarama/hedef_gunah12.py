"""Konu 12 hedef ayetleri: günah sınıfları (kebâir, fahşâ, lemem, ism, fısk, hatîe, zenb, münker, bağy, sûe) ve zulüm (yalnız başka işaretle birlikte)."""
import json, re
from collections import Counter
from ortak import body, toks, ref
def fold(w): return re.sub('[أإآٱ]','ا',w).replace('ؤ','و').replace('ئ','ى').replace('ي','ى').replace('ة','ه')
PF = r'(?:و|ف|ب|ل|ك|ال|لل|ولل|وال|فال|بال|وب|ول|فل|فب|وبال|س|وس)?'
TOK = {
 'kebair': r'(?:كباىر|كبائر|كبىره|لكبىره)$',
 'fahsa': r'(?:فحشه|فحشاء|الفحشاء|فاحشه|الفاحشه|فواحش|الفواحش|ىفحش|فحشا)$',
 'lemem': r'(?:اللمم|لمم)$',
 'ism': r'(?:اثم|الاثم|اثما|اثمهما|اثمه|اثىم|اثىما|الاثىم|اثمك|اثمى|اثمهم|ىاثم|اثمكم|اثام|اثاما|اثمهن|اثمها|اثامه|اثمين)$',
 'fisk': r'(?:فسق|فسقوا|فاسق|فاسقا|فاسقىن|الفاسقىن|فسوق|الفسوق|فسقت|الفاسق|فسقا|فسقه|فسقتم|ىفسقون|ىفسق|تفسق|تفسقوا|الفسقىن|الفسقون|فسقون|فسقىن|فاسقون|الفاسقون|فسقتم|وفسقوا)$',
 'hatia': r'(?:خطىىه|خطاىا|خطىىت|خطىىتهم|خطىىاتكم|خطىىتكم|خطىىاتهم|خطىىاتنا|خطئ|خطا|خاطىىن|خاطىه|خاطئه|خطىىته|خطىىاتكم|خطاىاكم|خطاىاهم|خطىىاتنا|خطىىاتهم|خطىاتهم)$',
 'zenb': r'(?:ذنب|ذنوب|ذنبه|ذنبك|ذنبها|ذنوبهم|ذنوبنا|ذنوبكم|ذنوبه|بذنوبهم|بذنبه|بذنوبكم|ذنبهم|ذنبا|ذنوبا|لذنبك|ذنبكم|ذنبى)$',
 'munker': r'(?:منكر|المنكر|منكرا|للمنكر|بالمنكر|المنكرات)$',
 'bagy': r'(?:بغى|البغى|الباغىن|باغ|ىبغون|بغىا|بغىكم|بغىهم|فبغى|ببغىهم)$',
 'zulm': r'(?:ظلم|ظلمو|ظلمت|ظلمنا|ظلموا|ظالم|ظالمىن|الظالمىن|الظالم|ظلما|ظلمه|ظالمه|ىظلم|ظلام|ظلوم|الظلم)$',
 'sue': r'(?:سوء|السوء|سوءا|سوءه|سىىه|السىىه|سىىت|السىىت|سىىاتكم|سىىاتهم|سىىاتنا|سىىاتهم|سىىاته|سىىاتها|سىىئه|سىىئت)$',
}
PAT = {k: re.compile('^' + fold(PF) + fold(v)[:-2] + 'ا?)$') for k, v in TOK.items()}
hits = {}
for k in sorted(body):
    tl = [fold(n) for _, n in toks(*k)]
    h = {}
    for i, w in enumerate(tl):
        for n, p in PAT.items():
            if p.search(w): h.setdefault(n, []).append(w)
    # 'kabir' + ism/zenb/vizr bitişikliği
    for i, w in enumerate(tl):
        if re.match(fold(r'^(?:ال)?كبىر(?:ا)?$'), w) and any(re.match(fold(r'^(?:و|ف|ب|ل|ال)?(?:اثم|الاثم|ذنب|وزر|خطا|ظلم|اثما)$'), x) for x in tl[max(0,i-2):i+3]):
            h.setdefault('kebair', []).append('kabir+ism')
    h.pop('sue', None); h.pop('zulm', None)
    if h: hits[ref(k)] = h
json.dump(hits, open('out/hedef_gunah12_tum.json','w'), ensure_ascii=False)
print(len(hits), dict(Counter(n for v in hits.values() for n in v)))
for n in ('kebair','fahsa','lemem','ism','fisk','hatia','zenb','munker','bagy','sue'):
    print(n, Counter(w for v in hits.values() for w in v.get(n,[])).most_common(12))
