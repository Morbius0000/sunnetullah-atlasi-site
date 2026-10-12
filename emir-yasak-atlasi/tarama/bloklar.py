import json, sys
from ortak import body, yn
hed = json.load(open(sys.argv[1])); geri, ileri = int(sys.argv[2]), int(sys.argv[3]); out = sys.argv[4]
mx = {}
for (s, a) in body: mx[s] = max(mx.get(s, 0), a)
tg = sorted(tuple(map(int, k.split(':'))) for k in hed)
bl = []
for s, a in tg:
    lo, hi = max(1, a - geri), min(mx[s], a + ileri)
    if bl and bl[-1][0] == s and lo <= bl[-1][2] + 1: bl[-1][2] = max(bl[-1][2], hi); bl[-1][3].append(a)
    else: bl.append([s, lo, hi, [a]])
print('blok', len(bl), 'ayet', sum(h - l + 1 for _, l, h, _ in bl))
L = []
for i, (s, lo, hi, t) in enumerate(bl):
    L.append(f'## B{i+1:03d} {s}:{lo}-{hi} hedef={",".join(map(str,t))}')
    for a in range(lo, hi + 1):
        L.append((f"*{s}:{a} {body[(s,a)]}\n   " if a in t else f" {s}:{a} ") + yn.get((s,a),""))
open(out, 'w').write('\n'.join(L)); json.dump(bl, open(out + '.json', 'w'))
