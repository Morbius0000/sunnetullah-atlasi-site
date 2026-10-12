"""Tarama B: Yaşar Nuri mealindeki Türkçe kalıplarla bağımsız ikinci tarama (Tarama A'dan ayrı kelime listesi)."""
import sys, json, re, collections
sys.path.insert(0, '.')
from ortak import *
def tr(s):  # Türkçe küçük harf
    return s.replace('İ', 'i').replace('I', 'ı').lower()
Y = lambda *a: re.compile('|'.join(a))
FAM = {
 'tr_yasak': Y(r'\w+(?:ma|me)(?:yın|yin|yınız|yiniz)\b', r'\byasak\w*', r'\bharam\w*', r'\bhaksız\w*', r'\bsakın\b', r'\bgünah\w*', r'\bsuç\w*', r'\bkabahat\w*', r'\bfuhuş\w*', r'\bfahişe\w*', r'\bzulm\w*|\bzulüm\w*|\bzalim\w*|\bzâlim\w*', r'\bkötülük\w*', r'\bfesat\w*', r'\bhaddi aş\w*|\bsınırı aş\w*|\bazg\w*|\bsapık\w*|\bsapmış\w*'),
 'tr_emir': Y(r'\bemr\w*', r'\bemir\w*', r'\bemret\w*', r'\bbuyur\w*', r'\bfarz\w*', r'\byazıldı\b|\byazılmıştır\b', r'\bvasiyet\w*', r'\bgerekir\b|\bgerekmektedir\b|\bşarttır\b', r'\bhelal\w*', r'\bsorumlu\w*', r'\bkulluk edin\b|\bibadet edin\b|\bverin\b|\byapın\b|\bedin\b|\bkılın\b|\buyun\b|\bitaat edin\b|\binanın\b|\biman edin\b|\bbağışlayın\b|\bbırakın\b|\binfak edin\b|\byiyin\b|\bödeyin\b|\bsabredin\b|\bzikredin\b|\banın\b|\btövbe edin\b|\bdönün\b|\bkoruyun\b|\bolun\b|\bsakının\b|\bgöz önünde bulundurun\b'),
 'tr_ibadet_ahlak': Y(r'\bnamaz\w*', r'\bzekât\w*|\bzekat\w*', r'\boruç\w*', r'\bhac\b|\bhacc\w*|\bumre\w*', r'\binfak\w*', r'\bsadaka\w*', r'\byetim\w*', r'\byoksul\w*|\bfakir\w*|\bmiskin\w*', r'\bşükret\w*', r'\bsabr\w*|\bsabret\w*', r'\badalet\w*|\badil\w*', r'\bdoğru\w*', r'\byalan\w*', r'\bhak\b|\bhaksız\w*', r'\bsalih\w*|\bsâlih\w*', r'\binkâr\w*|\binkar\w*', r'\byalanla\w*', r'\bhesap\w*', r'\bmizan\w*|\bterazi\w*', r'\bahiret\w*', r'\bkıyamet\w*|\bkıyam\w*', r'\bhatırlat\w*|\böğüt\w*', r'\bdin günü\b', r'\büzerinde sorumlu\w*', r'\bsorumlu\w*', r'\bayrıcalık\w*', r'\bsakınca\w*|\bgünah yok\w*|\bgüçlük\w*|\bkolaylık\w*|\bzorluk\w*'),
 'tr_cennet': Y(r'\bcennet\w*', r'\bfirdevs\w*', r'\badn\b', r'\bnimet\w*', r'\bölümsüz\w*', r'\bebed[iî]\w*', r'\bmutlu\w*', r'\bkurtul\w*'),
 'tr_cehennem': Y(r'\bcehennem\w*', r'\bateş\w*', r'\bazap\w*', r'\bazâb\w*', r'\byakıcı\w*', r'\balevli\w*', r'\bsaîr\b|\bsair\b|\bsakar\b|\bhutame\b|\bcahîm\b|\bcahim\b', r'\bkavrulacak\w*|\byanacak\w*|\byakılacak\w*', r'\blaneti?\w*|\blanet\w*', r'\bhüsran\w*'),
 'tr_karsilik': Y(r'\bmükâfat\w*', r'\becir\w*', r'\bkarşılı[kğ]\w*', r'\bceza\w*', r'\bödül\w*', r'\bbağışla\w*', r'\bmağfiret\w*', r'\baffet\w*', r'\brızası\w*|\brıza\w*', r'\bsever\b|\bsevmez\b|\bsevdiği\w*|\bsevmediği\w*|\bsevmiş\w*', r'\bgazab\w*', r'\bboşa git\w*', r'\bkazandığı\w*|\bişlediği\w*|\byaptıkları\w*', r'\btövbe\w*', r'\bzerre\w*'),
}
def run():
    out = {}
    for k in sorted(verses):
        if k == (1, 1): continue
        t = tr(yn[k]); hit = {}
        for f, rx in FAM.items():
            m = [x.group(0) for x in rx.finditer(t)]
            if m: hit[f] = m[:6]
        if hit: out[ref(k)] = hit
    return out
if __name__ == '__main__':
    out = run(); json.dump(out, open('out/tarama_b.json', 'w', encoding='utf8'), ensure_ascii=False)
    c = collections.Counter(f for v in out.values() for f in v)
    print('ayet (en az bir aile):', len(out))
    for f, n in c.most_common(): print(f'  {f:14} {n}')
    a = json.load(open('out/tarama_a.json', encoding='utf8'))
    A, B = set(a), set(out)
    print('A:', len(A), ' B:', len(B), ' A∩B:', len(A & B), ' yalnız A:', len(A - B), ' yalnız B:', len(B - A), ' A∪B:', len(A | B), ' hiçbiri:', 6235 - len(A | B))
