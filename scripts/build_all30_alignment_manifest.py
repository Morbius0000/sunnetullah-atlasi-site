#!/usr/bin/env python3
import urllib.request, json, pathlib, time, html, re

BASE="https://kuran.diyanet.gov.tr/mushaf_v2/qurandm/pagedata"
UA={"User-Agent":"Mozilla/5.0 AtlasAll30/1.0","Referer":"https://kuran.diyanet.gov.tr/mushaf_v2"}

root=pathlib.Path(".")
target=json.loads((root/"data/atlas_target_keys.json").read_text(encoding="utf-8"))
diyanet=json.loads((root/"data/diyanet_atlas_5246.json").read_text(encoding="utf-8"))
sources=json.loads((root/"data/mazlum_kiper_cuz_sources.json").read_text(encoding="utf-8"))

target_keys=set(target["keys"])
assert len(target_keys)==5246
assert set(diyanet["verses"])==target_keys
assert sources["count"]==30 and len(sources["sources"])==30
assert all(sources["sources"][str(i)]["verified"] for i in range(1,31))

def fetch_json(url, attempts=5):
    last=None
    for i in range(attempts):
        try:
            req=urllib.request.Request(url,headers=UA)
            with urllib.request.urlopen(req,timeout=40) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            last=e
            time.sleep(0.5*(i+1))
    raise last

def parse_range(a):
    sure=int(a["SureId"])
    ayet_id=int(a["AyetId"])
    num=str(a.get("AyetNumber") or ayet_id).strip()
    m=re.fullmatch(r"(\d+)\s*-\s*(\d+)",num)
    if m:
        s,e=map(int,m.groups())
    else:
        m2=re.search(r"\d+",num)
        s=e=int(m2.group(0)) if m2 else ayet_id
    if s>e:
        raise RuntimeError(f"bad range {sure}:{num}")
    return sure,s,e,re.sub(r"\s+","",num)

units_by_cuz={str(i):[] for i in range(1,31)}
seen=set()
api_pages=0
for pid in range(604):
    j=fetch_json(BASE+f"?id={pid}&itf=0&iml=1&iqr=1&ml=1&ql=7&iar=0")
    if j.get("PageNo")!=pid+1:
        raise RuntimeError(f"page mismatch {pid} -> {j.get('PageNo')}")
    cuz=int(j.get("CuzNo") or 0)
    if not (1<=cuz<=30):
        raise RuntimeError(f"bad cüz {cuz} on page {pid+1}")
    api_pages+=1
    for a in (j.get("MealAyats") or []):
        if not a.get("AyetVisible",True):
            continue
        txt=html.unescape(re.sub(r"\s+"," ",a.get("AyetText") or "")).strip()
        if not txt:
            continue
        sure,s,e,num=parse_range(a)
        uid=f"{cuz}:{sure}:{s}-{e}:{pid+1}"
        signature=(cuz,sure,s,e,txt)
        if signature in seen:
            continue
        seen.add(signature)
        keys=[f"{sure}:{ay}" for ay in range(s,e+1)]
        units_by_cuz[str(cuz)].append({
            "id":uid,"sure_no":sure,"start_ayet":s,"end_ayet":e,
            "ayet_range":num,"text":txt,"page":pid+1,"keys":keys
        })
    time.sleep(0.015)

nas_text=None
for k in ("114:1","114:4","114:6"):
    v=diyanet["verses"].get(k)
    if v and v.get("diyanet_grup")=="1-6":
        nas_text=v["diyanet_tr"]
        break
if nas_text:
    u30=[u for u in units_by_cuz["30"] if u["sure_no"]!=114]
    u30.append({
        "id":"30:114:1-6:605-html","sure_no":114,"start_ayet":1,"end_ayet":6,
        "ayet_range":"1-6","text":nas_text,"page":605,
        "keys":[f"114:{i}" for i in range(1,7)],
        "source_override":"official-diyanet-html"
    })
    units_by_cuz["30"]=u30

for c in units_by_cuz:
    units_by_cuz[c].sort(key=lambda u:(u["page"],u["sure_no"],u["start_ayet"],u["end_ayet"]))

key_to_unit={}
duplicates=[]
for c in range(1,31):
    for u in units_by_cuz[str(c)]:
        u["target_keys"]=[]
        for k in u["keys"]:
            if k not in target_keys:
                continue
            if k in key_to_unit:
                duplicates.append((k,key_to_unit[k],u["id"]))
            key_to_unit[k]=u["id"]
            u["target_keys"].append(k)

if duplicates:
    raise RuntimeError("target key appears in multiple official units: "+repr(duplicates[:20]))

missing=sorted(target_keys-set(key_to_unit))
if missing:
    raise RuntimeError("target keys missing from all-30 manifest: "+repr(missing[:50]))

unit_index={u["id"]:u for c in units_by_cuz.values() for u in c}
text_mismatch=[]
for k in target["keys"]:
    u=unit_index[key_to_unit[k]]
    if u["text"]!=diyanet["verses"][k]["diyanet_tr"]:
        text_mismatch.append((k,u["id"],u["text"],diyanet["verses"][k]["diyanet_tr"]))
if text_mismatch:
    raise RuntimeError("manifest/Diyanet target text mismatch: "+repr(text_mismatch[:10]))

target_counts={}
for c in range(1,31):
    target_counts[str(c)]=sum(len(u["target_keys"]) for u in units_by_cuz[str(c)])

manifest={
    "version":"atlas-all30-alignment-manifest-v1",
    "target_source_blob_sha":target["source_blob_sha"],
    "target_count":len(target_keys),
    "meal_source_id":"diyanet-isleri-baskanligi-meali-1",
    "voice":"Mazlum Kiper",
    "api_pages":api_pages,
    "target_counts_by_cuz":target_counts,
    "key_to_unit":key_to_unit,
    "sources":{str(i):{
        "audio_src":sources["sources"][str(i)]["audio_src"],
        "verified":sources["sources"][str(i)]["verified"],
        "meal_source_id":sources["sources"][str(i)]["meal_source_id"]
    } for i in range(1,31)},
    "units_by_cuz":units_by_cuz
}
out=root/"data/all30_alignment_manifest.json"
out.write_text(json.dumps(manifest,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
print("ALL30_MANIFEST_PASS",json.dumps({
    "target_count":manifest["target_count"],
    "unit_count":sum(len(x) for x in units_by_cuz.values()),
    "target_counts_by_cuz":target_counts
},ensure_ascii=False))
