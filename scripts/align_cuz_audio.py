#!/usr/bin/env python3
import os, json, re, urllib.request, pathlib, unicodedata, subprocess, shutil
import numpy as np
from rapidfuzz.distance import Levenshtein
from faster_whisper import WhisperModel

CUZ=int(os.environ["CUZ"])
if not (1 <= CUZ <= 30):
    raise SystemExit("bad CUZ")

root=pathlib.Path(".")
manifest=json.loads((root/"data/all30_alignment_manifest.json").read_text(encoding="utf-8"))
units=manifest["units_by_cuz"][str(CUZ)]
source=manifest["sources"][str(CUZ)]
if not source["verified"]:
    raise SystemExit(f"unverified source cüz {CUZ}")
audio_url=source["audio_src"]

def norm_word(s):
    s=unicodedata.normalize("NFKD",str(s)).casefold()
    s="".join(ch for ch in s if not unicodedata.combining(ch))
    s=s.replace("ı","i").replace("ş","s").replace("ç","c").replace("ğ","g").replace("ö","o").replace("ü","u")
    return re.sub(r"[^a-z0-9]+","",s)

mp3=pathlib.Path(f"/tmp/cuz{CUZ:02d}.source")
local_audio=os.environ.get("AUDIO_FILE")
if local_audio:
    source_path=pathlib.Path(local_audio)
    if not source_path.is_file():
        raise SystemExit(f"local audio not found: {source_path}")
    shutil.copyfile(source_path,mp3)
else:
    req=urllib.request.Request(audio_url,headers={"User-Agent":"Mozilla/5.0 AtlasAll30/1.0"})
    with urllib.request.urlopen(req,timeout=90) as r, mp3.open("wb") as f:
        while True:
            b=r.read(1024*1024)
            if not b: break
            f.write(b)
if mp3.stat().st_size < 5_000_000:
    raise SystemExit(f"audio unexpectedly small cüz {CUZ}: {mp3.stat().st_size}")

pcm=pathlib.Path(f"/tmp/cuz{CUZ:02d}.f32")
subprocess.run([
    "ffmpeg","-nostdin","-loglevel","error","-y","-i",str(mp3),
    "-ac","1","-ar","16000","-f","f32le",str(pcm)
],check=True)
samples=np.fromfile(pcm,dtype=np.float32)
duration=len(samples)/16000.0
if duration < 900:
    raise SystemExit(f"audio unexpectedly short cüz {CUZ}: {duration}")

exp_tokens=[]
unit_spans={}
for u in units:
    toks=[]
    for tok in re.findall(r"[\wÇĞİÖŞÜçğıöşüÂâÎîÛû’']+",u["text"],flags=re.UNICODE):
        n=norm_word(tok)
        if n: toks.append(n)
    a=len(exp_tokens); exp_tokens.extend(toks); b=len(exp_tokens)
    unit_spans[u["id"]]=(a,b)

model=WhisperModel("small",device="cpu",compute_type="int8",cpu_threads=4)
segs,info=model.transcribe(
    samples,language="tr",beam_size=5,word_timestamps=True,
    vad_filter=True,condition_on_previous_text=True
)
asr=[]
seg_count=0
for seg in segs:
    seg_count+=1
    for w in (seg.words or []):
        n=norm_word(w.word)
        if n:
            asr.append({"n":n,"raw":w.word,"s":float(w.start),"e":float(w.end),"p":float(w.probability or 0)})
asr_tokens=[w["n"] for w in asr]
if not asr_tokens:
    raise SystemExit(f"no ASR tokens cüz {CUZ}")

opcodes=Levenshtein.opcodes(exp_tokens,asr_tokens)
exact={}
paired={}
for op in opcodes:
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

edit_distance=Levenshtein.distance(exp_tokens,asr_tokens)
global_exact=len(exact)/max(1,len(exp_tokens))
global_similarity=1-edit_distance/max(1,len(exp_tokens),len(asr_tokens))

def snap_low_energy(center, radius=0.45):
    center=max(0.0,min(duration,center))
    lo=max(0.0,center-radius); hi=min(duration,center+radius)
    if hi-lo < 0.08:
        return center
    win=max(1,int(0.08*16000)); step=max(1,int(0.02*16000))
    s0=int(lo*16000); s1=int(hi*16000)
    best=(float("inf"),float("inf"),center)
    for s in range(s0,max(s0+1,s1-win+1),step):
        x=samples[s:s+win]
        if len(x)<win: break
        rms=float(np.mean(x*x))
        t=(s+win/2)/16000.0
        cand=(rms,abs(t-center),t)
        if cand<best: best=cand
    return best[2]

aligned={}
low_target=[]
unresolved_target=[]
for u in units:
    uid=u["id"]
    a,b=unit_spans[uid]
    ex=[(i,exact[i]) for i in range(a,b) if i in exact]
    pr=[(i,paired[i]) for i in range(a,b) if i in paired]
    expected=b-a
    exact_cov=len(ex)/max(1,expected)
    paired_cov=len(pr)/max(1,expected)
    anchor=ex if ex else pr
    if not anchor:
        rec={
            "unit_id":uid,"status":"UNRESOLVED","expected_tokens":expected,
            "exact_tokens":0,"exact_coverage":0.0,"paired_coverage":0.0
        }
        aligned[uid]=rec
        if u["target_keys"]: unresolved_target.append(uid)
        continue

    first_e,first_a=anchor[0]
    last_e,last_a=anchor[-1]
    if len(anchor)>=2 and last_e>first_e and asr[last_a]["e"]>asr[first_a]["s"]:
        rate=(asr[last_a]["e"]-asr[first_a]["s"])/(last_e-first_e+1)
    else:
        rate=duration/max(1,len(asr_tokens))
    rate=max(0.16,min(1.10,rate))
    leading=max(0,first_e-a)
    trailing=max(0,(b-1)-last_e)
    raw_start=max(0.0,asr[first_a]["s"]-leading*rate-0.12)
    raw_end=min(duration,asr[last_a]["e"]+trailing*rate+0.18)
    start=snap_low_energy(raw_start,0.35)
    end=snap_low_energy(raw_end,0.35)
    if end<=start+0.10:
        start=raw_start; end=max(start+0.20,raw_end)

    if expected<=3:
        verified=len(ex)>=1
    elif expected<=8:
        verified=len(ex)>=2 and exact_cov>=0.25
    else:
        verified=len(ex)>=3 and exact_cov>=0.25
    if paired_cov<0.55:
        verified=False

    rec={
        "unit_id":uid,"status":"VERIFIED" if verified else "LOW_CONFIDENCE",
        "audio_start":round(start,3),"audio_end":round(end,3),
        "raw_start":round(raw_start,3),"raw_end":round(raw_end,3),
        "expected_tokens":expected,"exact_tokens":len(ex),
        "exact_coverage":round(exact_cov,6),"paired_coverage":round(paired_cov,6),
        "leading_unmatched_tokens":leading,"trailing_unmatched_tokens":trailing,
        "first_asr_index":first_a,"last_asr_index":last_a,
        "target_key_count":len(u["target_keys"])
    }
    aligned[uid]=rec
    if u["target_keys"] and not verified:
        low_target.append(uid)

target_units=[u for u in units if u["target_keys"]]
target_keys=sum(len(u["target_keys"]) for u in target_units)
ordered_target_alignments=[]
invalid_time_units=[]
for u in target_units:
    rec=aligned[u["id"]]
    if rec.get("status")=="UNRESOLVED":
        continue
    start=float(rec["audio_start"]); end=float(rec["audio_end"])
    if not (end>start>=0 and end<=duration+0.5):
        invalid_time_units.append(u["id"])
    ordered_target_alignments.append((u["id"],start,end))

reverse_time_units=[]
severe_overlap_units=[]
max_overlap=0.0
for previous,current in zip(ordered_target_alignments,ordered_target_alignments[1:]):
    if current[1] < previous[1]:
        reverse_time_units.append(current[0])
    overlap=max(0.0,previous[2]-current[1])
    max_overlap=max(max_overlap,overlap)
    if overlap>1.0:
        severe_overlap_units.append(current[0])

locked_target_policy=str(manifest.get("source_policy") or "").startswith("locked Atlas targets only")
gate_policy="locked-target-exact-v1" if locked_target_policy else "full-cuz-similarity-v1"
status="PASS"
if locked_target_policy:
    # The source audio contains the full cüz while the expected sequence contains
    # only the locked Atlas subset. Inserted non-target verses legitimately lower
    # global edit similarity, so exact target coverage and per-unit gates are the
    # valid measures here.
    if (global_exact < 0.85 or low_target or unresolved_target or
            invalid_time_units or reverse_time_units or severe_overlap_units):
        status="FAIL"
elif global_exact < 0.68 or global_similarity < 0.65 or unresolved_target:
    status="FAIL"

out={
    "version":"atlas-cuz-audio-alignment-v1",
    "status":status,
    "cuz":CUZ,
    "audio_src":audio_url,
    "audio_bytes":mp3.stat().st_size,
    "audio_duration_sec":round(duration,3),
    "model":"faster-whisper-small-int8",
    "algorithm":"rapidfuzz-global-monotonic-v1+edge-extrapolation+low-energy-snap",
    "gate_policy":gate_policy,
    "expected_tokens":len(exp_tokens),
    "asr_words":len(asr_tokens),
    "asr_segments":seg_count,
    "global_edit_distance":edit_distance,
    "global_edit_similarity":round(global_similarity,6),
    "global_exact_token_coverage":round(global_exact,6),
    "unit_count":len(units),
    "target_unit_count":len(target_units),
    "target_key_count":target_keys,
    "low_confidence_target_units":low_target,
    "unresolved_target_units":unresolved_target,
    "invalid_time_units":invalid_time_units,
    "reverse_time_units":reverse_time_units,
    "severe_overlap_units":severe_overlap_units,
    "max_adjacent_overlap_sec":round(max_overlap,3),
    "units":aligned
}
outdir=root/"out"
outdir.mkdir(exist_ok=True)
path=outdir/f"cuz{CUZ:02d}.json"
path.write_text(json.dumps(out,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
print("CUZ_ALIGNMENT",json.dumps({
    "cuz":CUZ,"status":status,"global_exact":out["global_exact_token_coverage"],
    "global_similarity":out["global_edit_similarity"],"target_keys":target_keys,
    "low_target_units":len(low_target),"unresolved_target_units":len(unresolved_target)
},ensure_ascii=False))
if status!="PASS":
    raise SystemExit(f"gross alignment failure cüz {CUZ}")
