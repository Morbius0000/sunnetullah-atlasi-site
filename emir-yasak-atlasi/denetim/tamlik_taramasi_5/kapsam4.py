import re,collections,json
exec(open('/tmp/claude-0/-home-claude/a9cf4c8b-f15e-5164-b4b2-8f0fd27cb07c/scratchpad/kapsam.py').read().split('KW=')[0])
done=set()
for f in ('adaylar.json','adaylar2.json'):
    done|=set(tuple(map(int,r.split(':'))) for r,_ in json.load(open('/tmp/claude-0/-home-claude/a9cf4c8b-f15e-5164-b4b2-8f0fd27cb07c/scratchpad/'+f)))
def toks(t): return [re.sub(r'^(و|ف)','',w) for w in t.split()]
P={'odul':r'^(ل)?(ال)?(مفاز|مفازا|حدائق|نزلا|نزل|درجات|درجه|غرف|الغرفه|نعيم|ثواب|ثوابا|يرزقون|طوبي|رضوان|مقام|اعين|يشاءون|حسنه|الطيبات|ماب|مابا|عقبي)$',
 'ceza':r'^(ل)?(ال)?(مثوي|مثواهم|مهاد|المهاد|مصير|المصير|ذله|الذله|صغار|حميم|غساق|زقوم|سلاسل|اغلال|حسره|حسرات|رجس|الرجس|مقت|مقتا|تبار|تبارا|خاب|يخيب|بيس|بئس|سوء|السوء|سيئات|ساء|يصلي|يصلون|سيصلي|سيصلون|اصلوها|صلي)$'}
cand=collections.OrderedDict()
for key,t in Q.items():
    if key in cov or key in done: continue
    hits=[k for k,p in P.items() if any(re.search(p,w) for w in toks(t))]
    if hits: cand[key]=hits
print('aday',len(cand),collections.Counter(x for v in cand.values() for x in v).most_common())
json.dump([[f'{s}:{a}',h] for (s,a),h in cand.items()],open('/tmp/claude-0/-home-claude/a9cf4c8b-f15e-5164-b4b2-8f0fd27cb07c/scratchpad/adaylar3.json','w'))
