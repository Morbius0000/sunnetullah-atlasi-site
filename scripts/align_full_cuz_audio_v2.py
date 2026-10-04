#!/usr/bin/env python3
import os, json, re, urllib.request, pathlib, unicodedata, subprocess, shutil, statistics
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

def fetch_json(url,timeout=90):
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 AtlasFullCuzAudioV2/1.0"})
    with urllib.request.urlopen(req,timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))

# Full 6,236-verse Diyanet source, not the sparse Atlas target subset.
api=fetch_json("https://api.alquran.cloud/v1/quran/tr.diyanet")
if api.get("code")!=200 or not (api.get("data") or {}).get("surahs"):
    raise SystemExit("bad full Diyanet API payload")

full=[]
for s in api["data"]["surahs"]:
    sure=int(s["number"])
    for a in s["ayahs"]:
        full.append({
            "key":f"{sure}:{int(a['numberInSurah'])}",
            "sure_no":sure,
            "ayet_no":int(a["numberInSurah"]),
            "juz":int(a.get("juz") or 0),
            "text":str(a.get("text") or "").strip(),
        })
if len(full)!=6236:
    raise SystemExit(f"full Diyanet key count != 6236: {len(full)}")
if len({x["key"] for x in full})!=6236:
    raise SystemExit("duplicate full Diyanet keys")

verses=[x for x in full if x["juz"]==CUZ]
if not verses:
    raise SystemExit(f"no full Diyanet verses for cüz {CUZ}")

expected=[]
spans={}
for v in verses:
    toks=text_tokens(v["text"])
    a=len(expected)
    expected.extend(toks)
    b=len(expected)
    spans[v["key"]]=(a,b)

# Download the exact Mazlum Kiper cüz MP3 used by the site.
audio=pathlib.Path(f"/tmp/atlas-cuz-{CUZ:02d}.mp3")
local=os.environ.get("AUDIO_FILE")
if local:
    p=pathlib.Path(local)
    if not p.is_file():
        raise SystemExit(f"AUDIO_FILE not found: {p}")
    shutil.copyfile(p,audio)
else:
    req=urllib.request.Request(SOURCE["audio_src"],headers={"User-Agent":"Mozilla/5.0 AtlasFullCuzAudioV2/1.0"})
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
    samples,
    language="tr",
    beam_size=5,
    word_timestamps=True,
    vad_filter=True,
    condition_on_previous_text=True,
)
asr=[]
seg_count=0
for seg in segments:
    seg_count+=1
    for w in (seg.words or []):
        n=norm_word(w.word)
        if n:
            asr.append({
                "n":n,
                "raw":str(w.word),
                "s":float(w.start),
                "e":float(w.end),
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

def snap_low_energy(center,radius=0.28):
    center=max(0.0,min(duration,float(center)))
    lo=max(0.0,center-radius)
    hi=min(duration,center+radius)
    if hi-lo < 0.08:
        return center
    win=max(1,int(0.08*16000))
    step=max(1,int(0.02*16000))
    s0=int(lo*16000)
    s1=int(hi*16000)
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
for v in verses:
    key=v["key"]
    a,b=spans[key]
    ex=[(i,exact[i]) for i in range(a,b) if i in exact]
    pr=[(i,paired[i]) for i in range(a,b) if i in paired]
    anchor=ex if ex else pr
    expected_n=b-a
    if not anchor:
        raw[key]={
            "status":"UNRESOLVED",
            "expected_tokens":expected_n,
            "exact_tokens":0,
            "exact_coverage":0.0,
            "paired_coverage":0.0,
        }
        unresolved.append(key)
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
    raw[key]={
        "status":"ANCHORED",
        "raw_start":rs,
        "raw_end":re_,
        "expected_tokens":expected_n,
        "exact_tokens":len(ex),
        "exact_coverage":len(ex)/max(1,expected_n),
        "paired_coverage":len(pr)/max(1,expected_n),
        "first_asr_index":first_a,
        "last_asr_index":last_a,
    }

# Fill any unresolved raw interval by monotonic interpolation between nearest
# resolved neighbors. It remains marked unresolved and cannot pass QA.
for i,v in enumerate(verses):
    key=v["key"]
    if raw[key]["status"]!="UNRESOLVED":
        continue
    prev_i=next((j for j in range(i-1,-1,-1) if raw[verses[j]["key"]]["status"]!="UNRESOLVED"),None)
    next_i=next((j for j in range(i+1,len(verses)) if raw[verses[j]["key"]]["status"]!="UNRESOLVED"),None)
    if prev_i is not None and next_i is not None:
        left=raw[verses[prev_i]["key"]]["raw_end"]
        right=raw[verses[next_i]["key"]]["raw_start"]
        n=next_i-prev_i-1
        slot=max(0.20,(right-left)/max(1,n))
        offset=i-prev_i-1
        raw[key]["raw_start"]=left+offset*slot
        raw[key]["raw_end"]=left+(offset+1)*slot
    elif prev_i is not None:
        left=raw[verses[prev_i]["key"]]["raw_end"]
        raw[key]["raw_start"]=left
        raw[key]["raw_end"]=min(duration,left+0.6)
    elif next_i is not None:
        right=raw[verses[next_i]["key"]]["raw_start"]
        raw[key]["raw_end"]=right
        raw[key]["raw_start"]=max(0.0,right-0.6)

# One shared monotonic boundary per adjacent verse. This prevents overlapping
# or reordered verse clips.
boundaries=[]
for left_v,right_v in zip(verses,verses[1:]):
    L=raw[left_v["key"]]
    R=raw[right_v["key"]]
    l=float(L.get("raw_end",0.0))
    r=float(R.get("raw_start",l))
    center=(l+r)/2.0
    boundaries.append(snap_low_energy(center,0.24))

# Enforce strictly nondecreasing internal boundaries without moving by more
# than a few milliseconds when ASR anchors land on the same word.
for i in range(1,len(boundaries)):
    if boundaries[i] <= boundaries[i-1]+0.02:
        boundaries[i]=boundaries[i-1]+0.02

first_start=snap_low_energy(float(raw[verses[0]["key"]].get("raw_start",0.0)),0.22)
last_end=snap_low_energy(float(raw[verses[-1]["key"]].get("raw_end",duration)),0.22)
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

records={}
low=[]
invalid=[]
reverse=[]
previous_start=-1.0
for i,v in enumerate(verses):
    key=v["key"]
    start=first_start if i==0 else boundaries[i-1]
    end=last_end if i==len(verses)-1 else boundaries[i]
    if end <= start:
        invalid.append(key)
        end=start+0.02
    if start < previous_start:
        reverse.append(key)
    previous_start=start
    a,b=spans[key]
    exp=expected[a:b]
    got=window_tokens(start,end)
    win_dist=Levenshtein.distance(exp,got)
    win_sim=1-win_dist/max(1,len(exp),len(got))
    r=raw[key]
    exact_cov=float(r.get("exact_coverage",0.0))
    paired_cov=float(r.get("paired_coverage",0.0))
    exact_n=int(r.get("exact_tokens",0))
    n=len(exp)
    verified=(r["status"]!="UNRESOLVED")
    if n<=3:
        verified=verified and exact_n>=1 and win_sim>=0.25
    elif n<=8:
        verified=verified and exact_n>=2 and exact_cov>=0.20 and paired_cov>=0.55 and win_sim>=0.35
    else:
        verified=verified and exact_n>=3 and exact_cov>=0.20 and paired_cov>=0.55 and win_sim>=0.40
    status="VERIFIED" if verified else ("UNRESOLVED" if r["status"]=="UNRESOLVED" else "LOW_CONFIDENCE")
    if status!="VERIFIED":
        low.append(key)
    records[key]={
        "status":status,
        "audio_start":round(start,3),
        "audio_end":round(end,3),
        "expected_tokens":n,
        "asr_window_tokens":len(got),
        "exact_tokens":exact_n,
        "exact_coverage":round(exact_cov,6),
        "paired_coverage":round(paired_cov,6),
        "window_similarity":round(win_sim,6),
        "raw_start":round(float(r.get("raw_start",start)),3),
        "raw_end":round(float(r.get("raw_end",end)),3),
    }

def percentile(vals,p):
    if not vals:
        return None
    x=sorted(float(v) for v in vals)
    if len(x)==1:
        return x[0]
    k=(len(x)-1)*p
    f=int(np.floor(k))
    c=int(np.ceil(k))
    if f==c:
        return x[f]
    return x[f]*(c-k)+x[c]*(k-f)

calibration={
    "available":False,
    "count":0,
    "median_start_error_sec":None,
    "p90_start_error_sec":None,
    "median_end_error_sec":None,
    "p90_end_error_sec":None,
    "max_start_error_sec":None,
    "max_end_error_sec":None,
}
if CUZ==1 and (ROOT/"data/verse_enrichment_cuz01.js").exists():
    node=r"""
    global.window={};
    require('./data/verse_enrichment_cuz01.js');
    process.stdout.write(JSON.stringify(window.ATLAS_VERSE_ENRICHMENT.verses));
    """
    existing=json.loads(subprocess.check_output(["node","-e",node],text=True))
    se=[]
    ee=[]
    rows=[]
    for key,new in records.items():
        old=existing.get(key)
        if not old or not old.get("audio_verified"):
            continue
        # Grouped Diyanet rows intentionally share a larger block. Calibration
        # uses only individually represented rows.
        if old.get("diyanet_grup"):
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
    "version":"atlas-full-cuz-audio-alignment-v2-calibration",
    "cuz":CUZ,
    "source_policy":"FULL Diyanet cüz transcript first; Atlas targets projected only after alignment",
    "diyanet_full_key_count":len(full),
    "cuz_verse_count":len(verses),
    "cuz_first_key":verses[0]["key"],
    "cuz_last_key":verses[-1]["key"],
    "audio_src":SOURCE["audio_src"],
    "audio_duration_sec":round(duration,3),
    "audio_bytes":audio.stat().st_size,
    "model":"faster-whisper-small-int8",
    "expected_tokens":len(expected),
    "asr_tokens":len(asr_tokens),
    "asr_segments":seg_count,
    "global_exact_token_coverage":round(global_exact,6),
    "global_edit_similarity":round(global_similarity,6),
    "unresolved_verse_count":len(unresolved),
    "low_or_unresolved_verse_count":len(low),
    "invalid_time_count":len(invalid),
    "reverse_time_count":len(reverse),
    "unresolved_verses":unresolved,
    "low_or_unresolved_verses":low,
    "calibration":calibration,
    "verses":records,
}
path=ROOT/"out"/f"full-cuz-v2-{CUZ:02d}.json"
path.parent.mkdir(exist_ok=True)
path.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("FULL_CUZ_V2",json.dumps({
    "cuz":CUZ,
    "verse_count":len(verses),
    "global_exact":out["global_exact_token_coverage"],
    "global_similarity":out["global_edit_similarity"],
    "unresolved":out["unresolved_verse_count"],
    "low":out["low_or_unresolved_verse_count"],
    "calibration":calibration,
},ensure_ascii=False))
