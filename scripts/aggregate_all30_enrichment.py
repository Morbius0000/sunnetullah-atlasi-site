#!/usr/bin/env python3
import json, pathlib, glob, subprocess

root=pathlib.Path(".")
target=json.loads((root/"data/atlas_target_keys.json").read_text(encoding="utf-8"))
diyanet=json.loads((root/"data/diyanet_atlas_5246.json").read_text(encoding="utf-8"))
manifest=json.loads((root/"data/all30_alignment_manifest.json").read_text(encoding="utf-8"))
target_keys=target["keys"]
assert len(target_keys)==5246
assert manifest["target_count"]==5246
assert manifest["target_source_blob_sha"]==target["source_blob_sha"]

unit_index={}
unit_cuz={}
for c,units in manifest["units_by_cuz"].items():
    for u in units:
        unit_index[u["id"]]=u
        unit_cuz[u["id"]]=int(c)

alignments={}
cuz_reports={}
for p in sorted(glob.glob("artifacts/**/cuz*.json",recursive=True)+glob.glob("artifacts/cuz*.json")):
    data=json.loads(pathlib.Path(p).read_text(encoding="utf-8"))
    c=int(data["cuz"])
    if c in alignments:
        continue
    alignments[c]=data["units"]
    cuz_reports[str(c)]={k:data[k] for k in [
        "status","audio_duration_sec","global_edit_similarity","global_exact_token_coverage",
        "unit_count","target_unit_count","target_key_count","low_confidence_target_units",
        "unresolved_target_units"
    ]}
missing_cuz=[c for c in range(2,31) if c not in alignments]
if missing_cuz:
    raise SystemExit("Missing alignment artifacts: "+repr(missing_cuz))

node=r"""
global.window={};
require('./data/verse_enrichment_pilot.js');
require('./data/verse_enrichment_cuz01.js');
process.stdout.write(JSON.stringify(window.ATLAS_VERSE_ENRICHMENT.verses));
"""
existing=json.loads(subprocess.check_output(["node","-e",node],text=True))

generated={}
missing=[]
low=[]
source_lock_fail=[]
cuz1_count=0
generated_count=0

for k in target_keys:
    uid=manifest["key_to_unit"][k]
    u=unit_index[uid]
    c=unit_cuz[uid]
    d=diyanet["verses"][k]
    if u["text"]!=d["diyanet_tr"]:
        raise SystemExit(f"Diyanet text drift {k}")

    if c==1:
        e=existing.get(k)
        if not e or not e.get("diyanet_tr") or not e.get("audio_verified"):
            missing.append(k)
            continue
        if e["diyanet_tr"]!=d["diyanet_tr"]:
            raise SystemExit(f"cüz1 Diyanet mismatch {k}")
        if e.get("meal_source_id")!=e.get("audio_meal_source_id"):
            source_lock_fail.append(k)
        cuz1_count+=1
        continue

    a=alignments[c].get(uid)
    if not a or a.get("status")=="UNRESOLVED":
        missing.append(k)
        continue
    if a.get("status")!="VERIFIED":
        low.append((k,c,uid,a.get("status"),a.get("exact_coverage"),a.get("paired_coverage")))
        continue

    rec={
        "sure_no":int(k.split(":")[0]),
        "ayet_no":int(k.split(":")[1]),
        "diyanet_tr":d["diyanet_tr"],
        "diyanet_kaynagi":"Diyanet İşleri Başkanlığı Meali",
        "diyanet_grup":d.get("diyanet_grup") or "",
        "diyanet_source_page":d.get("diyanet_source_page"),
        "meal_source_id":"diyanet-isleri-baskanligi-meali-1",
        "audio_meal_source_id":"diyanet-isleri-baskanligi-meali-1",
        "audio_src":manifest["sources"][str(c)]["audio_src"],
        "audio_start":float(a["audio_start"]),
        "audio_end":float(a["audio_end"]),
        "audio_verified":True,
        "audio_voice":"Mazlum Kiper",
        "audio_cuz":c,
        "audio_grup":d.get("diyanet_grup") or "",
        "alignment_method":"rapidfuzz-global-monotonic-v1+edge-extrapolation+low-energy-snap",
        "alignment_exact_coverage":a.get("exact_coverage"),
        "alignment_paired_coverage":a.get("paired_coverage")
    }
    if not (rec["audio_end"]>rec["audio_start"]>=0):
        missing.append(k)
        continue
    if rec["meal_source_id"]!=rec["audio_meal_source_id"]:
        source_lock_fail.append(k)
    generated[k]=rec
    generated_count+=1

print("AGG_COUNTS",json.dumps({
    "target":len(target_keys),"cuz1_existing":cuz1_count,"generated_cuz2_30":generated_count,
    "missing":len(missing),"low":len(low),"source_lock_fail":len(source_lock_fail)
},ensure_ascii=False))
if missing:
    print("MISSING_SAMPLE",missing[:50])
if low:
    print("LOW_SAMPLE",low[:50])
if source_lock_fail:
    print("SOURCE_LOCK_SAMPLE",source_lock_fail[:50])

if missing or low or source_lock_fail:
    raise SystemExit("All-30 target gate failed; no site layer written")
if cuz1_count+generated_count!=5246:
    raise SystemExit(f"target total mismatch {cuz1_count}+{generated_count}")

payload={
    "version":"atlas-all30-enrichment-v1",
    "scope":"Exact Atlas target keys in cüz 2-30; verified cüz 1 layer preserved",
    "status":"verified-all30",
    "target_count":5246,
    "cuz1_preserved_target_count":cuz1_count,
    "generated_target_count":generated_count,
    "voice":"Mazlum Kiper",
    "meal_source_id":"diyanet-isleri-baskanligi-meali-1",
    "verses":generated
}
js="// Generated all-30 enrichment. Canonical Atlas research data is NOT modified.\n"
js+="(function () {\n"
js+="  var root = window.ATLAS_VERSE_ENRICHMENT = window.ATLAS_VERSE_ENRICHMENT || { verses: {} };\n"
js+="  root.verses = root.verses || {};\n"
js+="  var layer = "+json.dumps(payload,ensure_ascii=False,separators=(",",":"))+";\n"
js+="  Object.keys(layer.verses).forEach(function (k) { root.verses[k] = layer.verses[k]; });\n"
js+="  root.all30 = { version: layer.version, status: layer.status, target_count: layer.target_count, generated_target_count: layer.generated_target_count, cuz1_preserved_target_count: layer.cuz1_preserved_target_count };\n"
js+="}());\n"
(root/"data/verse_enrichment_all30.js").write_text(js,encoding="utf-8")

qa={
    "status":"PASS",
    "target_count":5246,
    "target_source_blob_sha":target["source_blob_sha"],
    "cuz1_preserved_target_count":cuz1_count,
    "generated_cuz2_30_target_count":generated_count,
    "missing_target_count":0,
    "low_confidence_target_count":0,
    "source_lock_fail_count":0,
    "canonical_atlas_files_modified":False,
    "voice":"Mazlum Kiper",
    "meal_source_id":"diyanet-isleri-baskanligi-meali-1",
    "cuz_reports":cuz_reports
}
(root/"data/all30_audio_qa.json").write_text(json.dumps(qa,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("ALL30_AGGREGATE_PASS")
