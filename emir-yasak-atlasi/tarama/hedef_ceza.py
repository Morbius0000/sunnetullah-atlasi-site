"""Konu 9 hedef ayetleri: ahiret/dünya cezasını, ateşi ya da azabı adlandıran ayetler (sözlük). Okuma için bağlam blokları üretir."""
import json, re, sys
from ortak import body, toks, ref
def fold(w): return re.sub('[أإآ]','ا',w).replace('ؤ','و').replace('ئ','ى').replace('ي','ى').replace('ة','ه')
P = r'(?:[وفبل]|ول|وب|فب|ال|وال|فال|بال|لل|ولل)?'
PAT = {
 'nar': r'^(?:[وفبل]|ال|وال|فال|بال|لل|ولل|ول)?(?:نار|نارا|نارى|ناركم|نارهم|نارها|ناره|نارين)$',
 'cehennem': r'جهنم', 'cahim': r'جحيم', 'saqar': r'^(?:[وف]?)(?:سقر)$|^سقر', 'saer': r'سعير', 'lazza': r'^لظى$', 'hutama': r'حطم', 'haviye': r'هاويه', 'sicin': r'سجين', 'sair2':r'^(?:[وف]?ال)?سعر$',
 'azap': r'^(?:[وفبل]|ول|وب|فب|ال|وال|فال|بال)?عذاب|^(?:[وف]?)(?:ي|ن|ت)?عذب|^(?:[وف]?)(?:لنعذب|لتعذب|ليعذب|فيعذب|يعذبهم|يعذبكم|نعذبهم|عذبهم|عذبه|عذبنه|يعذبه|تعذبهم)',
 'ikab': r'عقاب|^(?:[وف]?)عاقب|عاقبتم|فعقبتم', 'ceza': r'^(?:[وفبل]|ول)?(?:جزاو|جزء|جزاء|جزيهم|نجزى|يجزى|تجزى|نجزيه|يجزيهم|تجزون|تجزون|فجزاو|جزينهم|جزينه|وجزيهم)',
 'sliy': r'يصلى|يصلون|اصلى|نصلى|نصليه|صليا|يصلها|سيصلى|سيصلون|ليصلون|اصلوها|مصل|صالوا|صالو|تصلى|يصلونها|يصلونه|صلوها',
 'vakud': r'وقود', 'zakkum': r'زقوم', 'gislin': r'غسلين', 'hamim': r'حميم', 'sadid': r'صديد', 'dari': r'ضريع',
 'hizy': r'خزى|يخزى|مخزى|اخزيته', 'hevan': r'^(?:[وف]?ال)?هون$|^مهين|^مهينا$', 'elim': r'^(?:[وف]?ال)?اليم$|^اليما$', 'husran': r'خسر|خسرو', 'ilmak':r'^(?:[وف]?ل?)?(?:ال)?نكال$|نكل', 'lanet': r'لعن|لعنه', 'gazab': r'غضب', 'mesven': r'مثوى', 'khlud': r'خلدين|خلدا|خلد',
 'ihlak': r'اهلك|مهلك|هلك|يهلك|لنهلك|فاهلك|فاهلكنهم|اهلكنهم|اهلكنا|اهلكتهم',
 'ebed_harman':r'^(?:[وف]?ال)?(?:حرام|محروم)$',
 'ciza_ahiret': r'^(?:ال)?مقامعه$|مقمعون',
 'iraz': r'^(?:[وف]?ال)?(?:بئس|وبئس)$|بئس',
 'zalim_ahd': r'^(?:[وف]?ال)?جهل',
}
PAT = {k: re.compile(fold(v)) for k, v in PAT.items()}
hits = {}
for k in sorted(body):
    t = [fold(n) for _, n in toks(*k)]
    h = {}
    for w in t:
        for n, p in PAT.items():
            if p.search(w): h.setdefault(n, []).append(w)
    if h: hits[ref(k)] = h
json.dump(hits, open('out/hedef_ceza_tum.json','w'), ensure_ascii=False)
from collections import Counter
c = Counter(n for v in hits.values() for n in v)
print(len(hits), dict(c))
