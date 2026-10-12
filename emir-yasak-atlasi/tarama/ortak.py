"""Emir-Yasak-Karşılık Atlası: ortak veri yükleyici.
Arapça: Tanzil Uthmani v1.1 (Hafs). Meal: Yaşar Nuri Öztürk (özel depodan, YN_MEAL ortam değişkeni; bu dosyalar yayımlanmaz).
"""
import json, os, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
SRC = Path(os.environ.get('TANZIL', ROOT / 'data/quran-uthmani-tanzil-v1.1.txt'))
YN = Path(os.environ.get('YN_MEAL', '/home/claude/sunnetullah-matrisi/data/turkce_anlam/kaynaklar/yasar_nuri_ozturk_meal.json'))
verses = {}
for line in SRC.read_text(encoding='utf8').splitlines():
    if re.match(r'^\d+\|\d+\|', line):
        s, a, t = line.split('|', 2); verses[(int(s), int(a))] = t
BASMALA = verses[(1, 1)]
def _L(c):
    o = ord(c); return (0x0621 <= o <= 0x063A) or (0x0641 <= o <= 0x064A) or o == 0x0671
def norm(tok): return ''.join(c for c in tok if _L(c)).replace('ٱ', 'ا')
body = {}
for (s, a), t in verses.items():
    tk = t.split()
    if a == 1 and s != 1 and norm(' '.join(tk[:4])) == norm(BASMALA): body[(s, a)] = ' '.join(tk[4:])
    else: body[(s, a)] = t
yn = {}
if YN.exists():
    for r in json.loads(YN.read_text(encoding='utf8'))['kayitlar']:
        yn[(r['sure_no'], r['ayet_no'])] = r['meal_tr']
def toks(s, a): return [(w, norm(w)) for w in body[(s, a)].split() if norm(w)]
def ref(k): return f'{k[0]}:{k[1]}'
