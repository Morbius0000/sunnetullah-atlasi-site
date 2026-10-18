import re,collections,json
exec(open('/tmp/claude-0/-home-claude/a9cf4c8b-f15e-5164-b4b2-8f0fd27cb07c/scratchpad/kapsam.py').read().split('KW=')[0])
def toks(t): return [re.sub(r'^(و|ف)','',w) for w in t.split()]
P={'cennet':r'^(ب|ل)?(ال)?(جنات|جنه|جنتين|جنتان|فردوس)','ecir':r'^(ب|ل)?(ال)?(اجر|اجور)(هم|كم|ه|ها|ا|ي|نا)?$','magfiret':r'^(ل)?(ال)?(مغفره|يغفر|نغفر|غفر|اغفر|تغفر)','felah':r'^(ال)?(مفلح|يفلح|افلح|تفلحون|فلاح)','fevz':r'^(ال)?(فوز|فاز|فايز)','rahmet':r'^(ب|ل)?(ال)?(رحمه|رحمت|يرحم|ترحمون|لنرحمن)',
 'azap':r'^(ب|ل)?(ال)?(عذاب|يعذب|نعذب|عذبنا|اعذب|معذب)','nar':r'^(ب|ل)?(ال)?(نار|جهنم|جحيم|سعير|سقر|لظي|حطمه|هاويه)','lanet':r'^(ل)?(ال)?(لعن|لعنه|لعنت|يلعن|ملعون)','gazab':r'^(ال)?(غضب|مغضوب)','husran':r'^(ال)?(خاسر|خسر|خسران)','helak':r'^(اهلكنا|اهلكناهم|اهلكت|اخذناهم|اخذهم|اغرقنا|اغرقناهم|دمرنا|دمرناهم|فاخذتهم)','hizy':r'^(ال)?(خزي|يخزي|مخزي|اخزي)','vay':r'^(ويل|ويلكم|ويلنا|ويلتنا|ويلتي)$','sevgi':r'^(يحب|يحبهم|يحبون)$','mujde':r'^(بشر|يبشر|بشري|بشرناه|بشرهم|مبشر|ابشر|بشروا|تبشرون)'}
cand=collections.OrderedDict()
for key,t in Q.items():
    if key in cov: continue
    T=toks(t); hits=[k for k,p in P.items() if any(re.search(p,w) for w in T)]
    if k:=None: pass
    if hits: cand[key]=hits
# drop mujde-only where token is literal بشر (human)
c2={}
for key,h in cand.items():
    T=toks(Q[key])
    if h==['mujde'] and all(re.search(r'^(ال)?بشر(ا|ين|ان)?$',w) for w in T if re.search(P['mujde'],w)): continue
    c2[key]=h
print('aday',len(c2)); print(collections.Counter(x for v in c2.values() for x in v).most_common())
json.dump([[f'{s}:{a}',h] for (s,a),h in c2.items()],open('/tmp/claude-0/-home-claude/a9cf4c8b-f15e-5164-b4b2-8f0fd27cb07c/scratchpad/adaylar.json','w'))
