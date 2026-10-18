import re,collections,json
exec(open('/tmp/claude-0/-home-claude/a9cf4c8b-f15e-5164-b4b2-8f0fd27cb07c/scratchpad/kapsam.py').read().split('KW=')[0])
done=set(tuple(map(int,r.split(':'))) for r,_ in json.load(open('/tmp/claude-0/-home-claude/a9cf4c8b-f15e-5164-b4b2-8f0fd27cb07c/scratchpad/adaylar.json')))
def toks(t): return [re.sub(r'^(و|ف)','',w) for w in t.split()]
P={'ceza':r'^(ل)?(ال)?(جزاء|جزاوه|نجزي|يجزي|يجزون|تجزون|جزيناهم|جزيناه|نجزيه|يجزيهم|ليجزي|سيجزيهم)','necat':r'^(نجينا|نجيناه|نجيناهم|انجينا|انجيناه|انجيناهم|ننجي|فننجي|ينجي|نجي)','ahz':r'^(اخذته|اخذتهم|اخذناه|اخذهم|اخذنا|اخذ|ياخذهم|اخذه)$',
 'afet':r'^(ال)?(صيحه|رجفه|حاصب|خسفنا|قرده|رجز|رجزا|نكال|نكالا|طوفان|صاعقه|الصاعقه|دمدم|دمر|تتبير|تبارا)','ikab':r'^(ال)?(عقاب|عقابي|انتقمنا|منتقمون|ينتقم)','riza':r'^(رضوان|رضي|رضوا|يرضاه)$','tevbe':r'^(يتوب|تاب|يتب)','kefaret':r'^(نكفر|يكفر|كفرنا|لاكفرن|كفر)$',
 'husna':r'^(ال)?(حسني|زياده|زلفي)$','nimet':r'^(رزق|رزقا)$','sefaat':r'^(شفاعه|شفيع)'}
cand=collections.OrderedDict()
for key,t in Q.items():
    if key in cov or key in done: continue
    hits=[k for k,p in P.items() if any(re.search(p,w) for w in toks(t))]
    if hits: cand[key]=hits
print('aday',len(cand),collections.Counter(x for v in cand.values() for x in v).most_common())
json.dump([[f'{s}:{a}',h] for (s,a),h in cand.items()],open('/tmp/claude-0/-home-claude/a9cf4c8b-f15e-5164-b4b2-8f0fd27cb07c/scratchpad/adaylar2.json','w'))
