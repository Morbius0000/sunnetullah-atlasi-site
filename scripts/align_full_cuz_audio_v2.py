#!/usr/bin/env python3
import os, json, re, urllib.request, pathlib, unicodedata, subprocess, shutil, statistics, html, time
import numpy as np
from rapidfuzz.distance import Levenshtein
from faster_whisper import WhisperModel

CUZ=int(os.environ.get("CUZ","1"))
if not 1 <= CUZ <= 30:
    raise SystemExit("CUZ must be 1..30")

ROOT=pathlib.Path(".")
SOURCES=json.loads((ROOT/"data/mazlum_kiper_cuz_sources.json").read_text(encoding="utf-8"))
SOURCE=SOURCES["sources"][str(CUZ)]
if not SOURCE.get("verified"):
    raise SystemExit(f"unverified Mazlum Kiper source for cüz {CUZ}")

def norm_word(s):
    s=unicodedata.normalize("NFKD",str(s)).casefold()
    s="".join(ch for ch in s if not unicodedata.combining(ch))
    s=s.replace("ı","i").replace("ş","s").replace("ç","c").replace("ğ","g").replace("ö","o").replace("ü","u")
    return re.sub(r"[^a-z0-9]+","",s)

def text_tokens(s):
    out=[]
    for tok in re.findall(r"[\wÇĞİÖŞÜçğıöşüÂâÎîÛû’']+",str(s),flags=re.UNICODE):
        n=norm_word(tok)
        if n:
            out.append(n)
    return out

def fetch_json(url,attempts=5):
    last=None
    for i in range(attempts):
        try:
            req=urllib.request.Request(url,headers={
                "User-Agent":"Mozilla/5.0 AtlasFullCuzAudioV2/2.0",
                "Referer":"https://kuran.diyanet.gov.tr/mushaf_v2",
            })
            with urllib.request.urlopen(req,timeout=45) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            last=e
            time.sleep(0.6*(i+1))
    raise last

def parse_range(a):
    sure=int(a["SureId"])
    ayet_id=int(a["AyetId"])
    number=str(a.get("AyetNumber") or ayet_id).strip()
    m=re.fullmatch(r"(\d+)\s*-\s*(\d+)",number)
    if m:
        start,end=map(int,m.groups())
    else:
        m2=re.search(r"\d+",number)
        start=end=int(m2.group(0)) if m2 else ayet_id
    if start>end:
        raise SystemExit(f"bad Diyanet range {sure}:{number}")
    return sure,start,end,number

# Official current Diyanet source. We align every visible meal unit in the cüz,
# not only Atlas-selected verses.
if CUZ==1:
    page_start,page_end=1,21
elif CUZ==30:
    page_start,page_end=582,604
else:
    page_start=2+(CUZ-1)*20
    page_end=page_start+19

BASE="https://kuran.diyanet.gov.tr/mushaf_v2/qurandm/pagedata"
units=[]
quran_keys=set()
seen=set()
for page_no in range(page_start,page_end+1):
    j=fetch_json(BASE+f"?id={page_no-1}&itf=0&iml=1&iqr=1&ml=1&ql=7&iar=0")
    if int(j.get("PageNo") or 0)!=page_no:
        raise SystemExit(f"page mismatch {page_no}: {j.get('PageNo')}")
    for a in (j.get("QuranAyats") or []):
        quran_keys.add(f"{int(a['SureId'])}:{int(a['AyetId'])}")
    for row_index,a in enumerate(j.get("MealAyats") or []):
        if not a.get("AyetVisible",True):
            continue
        txt=html.unescape(re.sub(r"\s+"," ",str(a.get("AyetText") or ""))).strip()
        if not txt:
            continue
        sure,start,end,number=parse_range(a)
        sig=(sure,start,end,txt)
        if sig in seen:
            continue
        seen.add(sig)
        keys=[f"{sure}:{ay}" for ay in range(start,end+1)]
        units.append({
            "id":f"{sure}:{start}-{end}:p{page_no}:r{row_index}",
            "sure_no":sure,
            "start_ayet":start,
            "end_ayet":end,
            "range":number,
            "page":page_no,
            "text":txt,
            "keys":keys,
        })

# Official pagedata omits the final Nâs verses. For cüz 30 replace any partial
# Nâs row with Diyanet's own canonical HTML 1-6 meal block.
if CUZ==30:
    nas_url="https://kuran.diyanet.gov.tr/mushaf/kuran-meal-1/nas-suresi-114/ayet-1/diyanet-isleri-baskanligi-meali-1"
    req=urllib.request.Request(nas_url,headers={"User-Agent":"Mozilla/5.0 AtlasFullCuzAudioV2/2.0"})
    with urllib.request.urlopen(req,timeout=45) as rr:
        raw_html=rr.read().decode("utf-8","replace")
    pat=re.compile(r"""<h3[^>]*class=["']spH3["'][^>]*>\s*(\d+(?:\s*-\s*\d+)?)\s*\.\s*Meal\s*</h3>.*?<span[^>]*class=["']mealViewFullText["'][^>]*>(.*?)</span>""",re.I|re.S)
    parsed=[]
    for number,body in pat.findall(raw_html):
        txt=html.unescape(re.sub(r"<[^>]+>"," ",body))
        txt=re.sub(r"\s+"," ",txt).strip()
        parsed.append((re.sub(r"\s+","",number),txt))
    nas=[txt for number,txt in parsed if number=="1-6" and txt]
    if not nas:
        raise SystemExit("official Nâs 1-6 meal block not found")
    units=[u for u in units if u["sure_no"]!=114]
    units.append({
        "id":"114:1-6:p605:official-html",
        "sure_no":114,
        "start_ayet":1,
        "end_ayet":6,
        "range":"1-6",
        "page":605,
        "text":nas[-1],
        "keys":[f"114:{i}" for i in range(1,7)],
    })
    quran_keys.update(f"114:{i}" for i in range(1,7))

units.sort(key=lambda u:(u["page"],u["sure_no"],u["start_ayet"]))
expanded_keys=[]
for u in units:
    expanded_keys.extend(u["keys"])
expanded_set=set(expanded_keys)
if not quran_keys.issubset(expanded_set):
    missing=sorted(quran_keys-expanded_set)
    raise SystemExit("official visible meal units do not cover cüz Quran keys: "+repr(missing[:50]))

# Guard the known cüz-1 boundary used as calibration truth.
if CUZ==1:
    if len(quran_keys)!=148 or "1:1" not in quran_keys or "2:141" not in quran_keys:
        raise SystemExit(f"unexpected cüz1 Quran boundary: {len(quran_keys)}")

expected=[]
spans={}
for u in units:
    toks=text_tokens(u["text"])
    a=len(expected)
    expected.extend(toks)
    b=len(expected)
    spans[u["id"]]=(a,b)

audio=pathlib.Path(f"/tmp/atlas-cuz-{CUZ:02d}.mp3")
local=os.environ.get("AUDIO_FILE")
if local:
    p=pathlib.Path(local)
    if not p.is_file():
        raise SystemExit(f"AUDIO_FILE not found: {p}")
    shutil.copyfile(p,audio)
else:
    req=urllib.request.Request(SOURCE["audio_src"],headers={"User-Agent":"Mozilla/5.0 AtlasFullCuzAudioV2/2.0"})
    with urllib.request.urlopen(req,timeout=120) as r, audio.open("wb") as f:
        while True:
            chunk=r.read(1024*1024)
            if not chunk:
                break
            f.write(chunk)
if audio.stat().st_size < 5_000_000:
    raise SystemExit(f"audio unexpectedly small: {audio.stat().st_size}")

pcm=pathlib.Path(f"/tmp/atlas-cuz-{CUZ:02d}.f32")
subprocess.run([
    "ffmpeg","-nostdin","-loglevel","error","-y","-i",str(audio),
    "-ac","1","-ar","16000","-f","f32le",str(pcm)
],check=True)
samples=np.fromfile(pcm,dtype=np.float32)
duration=len(samples)/16000.0
if duration < 900:
    raise SystemExit(f"audio unexpectedly short: {duration}")

model=WhisperModel("small",device="cpu",compute_type="int8",cpu_threads=4)
segments,info=model.transcribe(
    samples,language="tr",beam_size=5,word_timestamps=True,
    vad_filter=True,condition_on_previous_text=True
)
asr=[]
seg_count=0
for seg in segments:
    seg_count+=1
    for w in (seg.words or []):
        n=norm_word(w.word)
        if n:
            asr.append({
                "n":n,"raw":str(w.word),
                "s":float(w.start),"e":float(w.end),
                "p":float(w.probability or 0),
            })
asr_tokens=[w["n"] for w in asr]
if not asr_tokens:
    raise SystemExit("no ASR words")

ops=Levenshtein.opcodes(expected,asr_tokens)
exact={}
paired={}
for op in ops:
    if op.tag=="equal":
        for j in range(op.src_end-op.src_start):
            exact[op.src_start+j]=op.dest_start+j
            paired[op.src_start+j]=op.dest_start+j
    elif op.tag=="replace":
        sl=op.src_end-op.src_start
        dl=op.dest_end-op.dest_start
        if sl and dl:
            for j in range(sl):
                pos=min(dl-1,max(0,int((j+0.5)*dl/sl)))
                paired[op.src_start+j]=op.dest_start+pos

edit=Levenshtein.distance(expected,asr_tokens)
global_exact=len(exact)/max(1,len(expected))
global_similarity=1-edit/max(1,len(expected),len(asr_tokens))

def snap_low_energy(center,radius=0.24):
    center=max(0.0,min(duration,float(center)))
    lo=max(0.0,center-radius)
    hi=min(duration,center+radius)
    if hi-lo < 0.08:
        return center
    win=max(1,int(0.08*16000))
    step=max(1,int(0.02*16000))
    s0=int(lo*16000); s1=int(hi*16000)
    best=(float("inf"),float("inf"),center)
    for pos in range(s0,max(s0+1,s1-win+1),step):
        x=samples[pos:pos+win]
        if len(x)<win:
            break
        rms=float(np.mean(x*x))
        t=(pos+win/2)/16000.0
        cand=(rms,abs(t-center),t)
        if cand<best:
            best=cand
    return best[2]

raw={}
unresolved=[]
for u in units:
    uid=u["id"]
    a,b=spans[uid]
    ex=[(i,exact[i]) for i in range(a,b) if i in exact]
    pr=[(i,paired[i]) for i in range(a,b) if i in paired]
    anchor=ex if ex else pr
    expected_n=b-a
    if not anchor:
        raw[uid]={
            "status":"UNRESOLVED","expected_tokens":expected_n,
            "exact_tokens":0,"exact_coverage":0.0,"paired_coverage":0.0,
        }
        unresolved.append(uid)
        continue
    first_e,first_a=anchor[0]
    last_e,last_a=anchor[-1]
    if len(anchor)>=2 and last_e>first_e and asr[last_a]["e"]>asr[first_a]["s"]:
        rate=(asr[last_a]["e"]-asr[first_a]["s"])/(last_e-first_e+1)
    else:
        rate=0.36
    rate=max(0.16,min(1.10,rate))
    leading=max(0,first_e-a)
    trailing=max(0,(b-1)-last_e)
    rs=max(0.0,asr[first_a]["s"]-leading*rate-0.06)
    re_=min(duration,asr[last_a]["e"]+trailing*rate+0.08)
    raw[uid]={
        "status":"ANCHORED",
        "raw_start":rs,"raw_end":re_,
        "expected_tokens":expected_n,
        "exact_tokens":len(ex),
        "exact_coverage":len(ex)/max(1,expected_n),
        "paired_coverage":len(pr)/max(1,expected_n),
        "first_asr_index":first_a,"last_asr_index":last_a,
    }

# Keep unresolved units visible as failures, but interpolate a monotonic interval
# so the report can still be inspected.
for i,u in enumerate(units):
    uid=u["id"]
    if raw[uid]["status"]!="UNRESOLVED":
        continue
    prev_i=next((j for j in range(i-1,-1,-1) if raw[units[j]["id"]]["status"]!="UNRESOLVED"),None)
    next_i=next((j for j in range(i+1,len(units)) if raw[units[j]["id"]]["status"]!="UNRESOLVED"),None)
    if prev_i is not None and next_i is not None:
        left=raw[units[prev_i]["id"]]["raw_end"]
        right=raw[units[next_i]["id"]]["raw_start"]
        slots=next_i-prev_i-1
        width=max(0.20,(right-left)/max(1,slots))
        off=i-prev_i-1
        raw[uid]["raw_start"]=left+off*width
        raw[uid]["raw_end"]=left+(off+1)*width
    elif prev_i is not None:
        left=raw[units[prev_i]["id"]]["raw_end"]
        raw[uid]["raw_start"]=left
        raw[uid]["raw_end"]=min(duration,left+0.6)
    elif next_i is not None:
        right=raw[units[next_i]["id"]]["raw_start"]
        raw[uid]["raw_end"]=right
        raw[uid]["raw_start"]=max(0.0,right-0.6)

boundaries=[]
for left_u,right_u in zip(units,units[1:]):
    L=raw[left_u["id"]]; R=raw[right_u["id"]]
    l=float(L.get("raw_end",0.0)); r=float(R.get("raw_start",l))
    boundaries.append(snap_low_energy((l+r)/2.0,0.22))
for i in range(1,len(boundaries)):
    if boundaries[i] <= boundaries[i-1]+0.02:
        boundaries[i]=boundaries[i-1]+0.02

first_start=snap_low_energy(float(raw[units[0]["id"]].get("raw_start",0.0)),0.20)
last_end=snap_low_energy(float(raw[units[-1]["id"]].get("raw_end",duration)),0.20)
if boundaries:
    first_start=min(first_start,boundaries[0]-0.02)
    last_end=max(last_end,boundaries[-1]+0.02)
first_start=max(0.0,first_start)
last_end=min(duration,last_end)

def window_tokens(start,end):
    out=[]
    for w in asr:
        mid=(w["s"]+w["e"])/2.0
        if start <= mid < end:
            out.append(w["n"])
    return out

unit_records={}
low=[]
invalid=[]
reverse=[]
previous_start=-1.0
for i,u in enumerate(units):
    uid=u["id"]
    start=first_start if i==0 else boundaries[i-1]
    end=last_end if i==len(units)-1 else boundaries[i]
    if end<=start:
        invalid.append(uid)
        end=start+0.02
    if start<previous_start:
        reverse.append(uid)
    previous_start=start
    a,b=spans[uid]
    exp=expected[a:b]
    got=window_tokens(start,end)
    dist=Levenshtein.distance(exp,got)
    sim=1-dist/max(1,len(exp),len(got))
    r=raw[uid]
    exact_cov=float(r.get("exact_coverage",0.0))
    paired_cov=float(r.get("paired_coverage",0.0))
    exact_n=int(r.get("exact_tokens",0))
    n=len(exp)
    verified=(r["status"]!="UNRESOLVED")
    if n<=3:
        verified=verified and exact_n>=1 and sim>=0.25
    elif n<=8:
        verified=verified and exact_n>=2 and exact_cov>=0.20 and paired_cov>=0.55 and sim>=0.35
    else:
        verified=verified and exact_n>=3 and exact_cov>=0.20 and paired_cov>=0.55 and sim>=0.40
    status="VERIFIED" if verified else ("UNRESOLVED" if r["status"]=="UNRESOLVED" else "LOW_CONFIDENCE")
    if status!="VERIFIED":
        low.append(uid)
    unit_records[uid]={
        "status":status,
        "audio_start":round(start,3),"audio_end":round(end,3),
        "expected_tokens":n,"asr_window_tokens":len(got),
        "exact_tokens":exact_n,
        "exact_coverage":round(exact_cov,6),
        "paired_coverage":round(paired_cov,6),
        "window_similarity":round(sim,6),
        "raw_start":round(float(r.get("raw_start",start)),3),
        "raw_end":round(float(r.get("raw_end",end)),3),
        "keys":u["keys"],
        "range":u["range"],
        "text":u["text"],
    }

verse_records={}
for u in units:
    rec=unit_records[u["id"]]
    for key in u["keys"]:
        verse_records[key]={
            "unit_id":u["id"],
            "status":rec["status"],
            "audio_start":rec["audio_start"],
            "audio_end":rec["audio_end"],
            "range":u["range"],
            "exact_coverage":rec["exact_coverage"],
            "paired_coverage":rec["paired_coverage"],
            "window_similarity":rec["window_similarity"],
        }

def percentile(vals,p):
    if not vals:
        return None
    x=sorted(float(v) for v in vals)
    if len(x)==1:
        return x[0]
    k=(len(x)-1)*p
    f=int(np.floor(k)); c=int(np.ceil(k))
    if f==c:
        return x[f]
    return x[f]*(c-k)+x[c]*(k-f)

calibration={
    "available":False,"count":0,
    "median_start_error_sec":None,"p90_start_error_sec":None,
    "median_end_error_sec":None,"p90_end_error_sec":None,
    "max_start_error_sec":None,"max_end_error_sec":None,
}
if CUZ==1 and (ROOT/"data/verse_enrichment_cuz01.js").exists():
    node=r"""
    global.window={};
    require('./data/verse_enrichment_cuz01.js');
    process.stdout.write(JSON.stringify(window.ATLAS_VERSE_ENRICHMENT.verses));
    """
    existing=json.loads(subprocess.check_output(["node","-e",node],text=True))
    se=[]; ee=[]; rows=[]
    for key,new in verse_records.items():
        old=existing.get(key)
        if not old or not old.get("audio_verified"):
            continue
        if not isinstance(old.get("audio_start"),(int,float)) or not isinstance(old.get("audio_end"),(int,float)):
            continue
        a=abs(float(new["audio_start"])-float(old["audio_start"]))
        b=abs(float(new["audio_end"])-float(old["audio_end"]))
        se.append(a); ee.append(b)
        rows.append({"key":key,"start_error":round(a,3),"end_error":round(b,3)})
    calibration={
        "available":True,
        "count":len(se),
        "median_start_error_sec":round(statistics.median(se),3) if se else None,
        "p90_start_error_sec":round(percentile(se,0.90),3) if se else None,
        "median_end_error_sec":round(statistics.median(ee),3) if ee else None,
        "p90_end_error_sec":round(percentile(ee,0.90),3) if ee else None,
        "max_start_error_sec":round(max(se),3) if se else None,
        "max_end_error_sec":round(max(ee),3) if ee else None,
        "worst":sorted(rows,key=lambda x:max(x["start_error"],x["end_error"]),reverse=True)[:20],
    }

out={
    "version":"atlas-full-cuz-audio-alignment-v2-official-diyanet",
    "cuz":CUZ,
    "source_policy":"official current Diyanet visible full-cüz meal units first; Atlas targets projected only after alignment",
    "official_source":"https://kuran.diyanet.gov.tr/mushaf_v2/qurandm/pagedata",
    "page_start":page_start,"page_end":page_end,
    "quran_key_count":len(quran_keys),
    "expanded_meal_key_count":len(expanded_set),
    "meal_unit_count":len(units),
    "first_key":sorted(quran_keys,key=lambda k:(int(k.split(":")[0]),int(k.split(":")[1])))[0],
    "last_key":sorted(quran_keys,key=lambda k:(int(k.split(":")[0]),int(k.split(":")[1])))[-1],
    "audio_src":SOURCE["audio_src"],
    "audio_duration_sec":round(duration,3),
    "audio_bytes":audio.stat().st_size,
    "model":"faster-whisper-small-int8",
    "expected_tokens":len(expected),
    "asr_tokens":len(asr_tokens),
    "asr_segments":seg_count,
    "global_exact_token_coverage":round(global_exact,6),
    "global_edit_similarity":round(global_similarity,6),
    "unresolved_unit_count":len(unresolved),
    "low_or_unresolved_unit_count":len(low),
    "invalid_time_count":len(invalid),
    "reverse_time_count":len(reverse),
    "unresolved_units":unresolved,
    "low_or_unresolved_units":low,
    "calibration":calibration,
    "units":unit_records,
    "verses":verse_records,
}
path=ROOT/"out"/f"full-cuz-v2-{CUZ:02d}.json"
path.parent.mkdir(exist_ok=True)
path.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("FULL_CUZ_V2",json.dumps({
    "cuz":CUZ,
    "quran_keys":len(quran_keys),
    "expanded_meal_keys":len(expanded_set),
    "meal_units":len(units),
    "global_exact":out["global_exact_token_coverage"],
    "global_similarity":out["global_edit_similarity"],
    "unresolved_units":out["unresolved_unit_count"],
    "low_units":out["low_or_unresolved_unit_count"],
    "calibration":calibration,
},ensure_ascii=False))
