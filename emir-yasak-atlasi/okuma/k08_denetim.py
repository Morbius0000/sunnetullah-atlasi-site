"""İkinci geçiş (mekanik): her kaydın nitelik ayetinde niteliğin Arapça kökü, ödül ayetinde ödül işareti var mı?"""
import json, re, sys
sys.path.insert(0, '../tarama')
from ortak import toks
from k08_esle import rows, esle
H = json.load(open('../tarama/out/hedef_odul.json'))
def fold(w): return re.sub('[أإآٱ]','ا',w).replace('ؤ','و').replace('ئ','ى').replace('ي','ى').replace('ة','ه')
KOK = {'iman': r'امن|ومن|صدق', 'salih_amel': r'صلح|صالح|عمل|سعى|سعي|اسلف', 'takva': r'تق|اتق|تقو|متق|تقى',
 'sabir': r'صا?بر', 'namaz': r'صلو|صل[ىي]|مصل|صلات|سجد|ركع|يقوم|قيم|قنت|تهجد|ليل|جنوب|يهجع', 'zekat': r'زكو|زكى', 'infak': r'نفق|صدق|قرض|يؤت|اتى|ءاتى|ات',
 'tevbe': r'تاب|توب', 'sukur': r'شكر', 'tevekkul': r'توكل', 'hicret': r'هاجر|هجر|اخرج', 'cihad': r'جهد|جاهد|قتل|قاتل|نصر|ءاو|اوو',
 'zikir': r'ذكر|سبح|حمد', 'dua_istigfar': r'استغفر|غفر|دعا|يدعو|دعو|ربنا', 'ihsan': r'حسن|محسن', 'iffet': r'فرو?ج|زن|ابصر|غض',
 'ahde_vefa': r'عهد|وف|امنت|ميثق|نذر|بايع', 'sidk': r'صدق|شهد|زور', 'hasyet': r'خش|خاف|خوف|رهب|وجل|شفق', 'itaat': r'طاع|طع|طيع|اتبع|استجاب|سمعنا|رسول|قنت|عزر'}
sorun = []
for r in rows:
    if not re.match(r'^\d+:\d+$', r['nitelik_ayet']): continue
    s, a = map(int, r['nitelik_ayet'].split(':'))
    metin = ' '.join(fold(n) for _, n in toks(s, a))
    for k in esle(r['ham']):
        if k in KOK and not re.search(KOK[k], metin):
            sorun.append(('kök_yok', k, r['nitelik_ayet'], r['blok'], r['ham']))
    if r['odul_ayet'] not in H and r['odul'] not in ('ovgu', '-', 'karsitlik'):
        sorun.append(('odul_isareti_yok', r['odul'], r['odul_ayet'], r['blok'], r['ham']))
print(len(sorun))
for x in sorun: print(*x, sep=' | ')
