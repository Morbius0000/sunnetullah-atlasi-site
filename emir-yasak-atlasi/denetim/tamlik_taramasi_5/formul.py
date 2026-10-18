import re
exec(open('/tmp/claude-0/-home-claude/a9cf4c8b-f15e-5164-b4b2-8f0fd27cb07c/scratchpad/kapsam.py').read().split('KW=')[0])
F={'yahdi':r'لا يهدي|لم يكن الله ليغفر|لا يصلح|لا يحب|يحب|ما للظالمين من|لا يستوي|ليس لهم في الاخره|حبطت|بئس|ساء ما|لهم البشري|يبدل الله|سنوتيه|يوت(يه|يهم)|يدخله|يدخلهم|ندخله|سندخلهم|اعد|اعتدنا|وعد الله'}
for (s,a),t in Q.items():
    if (s,a) in cov: continue
    m=re.findall(F['yahdi'],t)
    if m: print(f'{s}:{a}',sorted(set(m)),'|',t[:150])
