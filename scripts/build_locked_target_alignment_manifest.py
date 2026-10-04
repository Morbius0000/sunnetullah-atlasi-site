#!/usr/bin/env python3
"""Build the audio-alignment manifest from the locked 5,246 Atlas targets.

This deliberately does not fetch or add Quran verses. It groups only the
already QA-passed official Diyanet target records and assigns them to the
standard 604-page cüz boundaries recorded in diyanet_source_page.
"""

import json
import pathlib
import re


ROOT = pathlib.Path(".")
TARGET_PATH = ROOT / "data/atlas_target_keys.json"
DIYANET_PATH = ROOT / "data/diyanet_atlas_5246.json"
SOURCES_PATH = ROOT / "data/mazlum_kiper_cuz_sources.json"
OUTPUT_PATH = ROOT / "data/all30_alignment_manifest.json"


def page_to_cuz(page):
    # Mushaf pages: cüz 1 = 1-21, cüz 2 = 22-41, ...; page 605 is
    # the official HTML override for Nâs and belongs to cüz 30.
    return min(30, max(1, ((int(page) - 2) // 20) + 1))


target = json.loads(TARGET_PATH.read_text(encoding="utf-8"))
diyanet = json.loads(DIYANET_PATH.read_text(encoding="utf-8"))
sources = json.loads(SOURCES_PATH.read_text(encoding="utf-8"))

keys = target["keys"]
assert len(keys) == 5246
assert set(keys) == set(diyanet["verses"])
assert sources["count"] == 30 and len(sources["sources"]) == 30

units_by_cuz = {str(i): [] for i in range(1, 31)}
groups = {}

for key in keys:
    sure_no, ayet_no = map(int, key.split(":"))
    record = diyanet["verses"][key]
    page = int(record["diyanet_source_page"])
    text = record["diyanet_tr"].strip()
    ayet_range = str(record.get("diyanet_ayet_araligi") or ayet_no).strip()
    cuz = page_to_cuz(page)
    signature = (cuz, page, sure_no, ayet_range, text)
    group = groups.setdefault(signature, {
        "cuz": cuz,
        "page": page,
        "sure_no": sure_no,
        "ayet_range": ayet_range,
        "text": text,
        "keys": [],
    })
    group["keys"].append(key)

for group in groups.values():
    nums = sorted(int(k.split(":")[1]) for k in group["keys"])
    range_match = re.fullmatch(r"(\d+)\s*-\s*(\d+)", group["ayet_range"])
    if range_match:
        start_ayet, end_ayet = map(int, range_match.groups())
    else:
        start_ayet = end_ayet = nums[0]
    if any(n < start_ayet or n > end_ayet for n in nums):
        raise SystemExit(f"target key outside official Diyanet group: {group}")
    uid = (
        f"{group['cuz']}:{group['sure_no']}:{start_ayet}-{end_ayet}:"
        f"{group['page']}:locked"
    )
    units_by_cuz[str(group["cuz"])].append({
        "id": uid,
        "sure_no": group["sure_no"],
        "start_ayet": start_ayet,
        "end_ayet": end_ayet,
        "ayet_range": group["ayet_range"],
        "text": group["text"],
        "page": group["page"],
        "keys": group["keys"],
        "target_keys": group["keys"],
        "source_override": "locked-diyanet-atlas-5246",
    })

for units in units_by_cuz.values():
    units.sort(key=lambda u: (u["page"], u["sure_no"], u["start_ayet"]))

key_to_unit = {}
for units in units_by_cuz.values():
    for unit in units:
        for key in unit["target_keys"]:
            if key in key_to_unit:
                raise SystemExit(f"duplicate target key: {key}")
            key_to_unit[key] = unit["id"]

if set(key_to_unit) != set(keys):
    raise SystemExit("locked target coverage mismatch")

target_counts = {
    str(cuz): sum(len(u["target_keys"]) for u in units_by_cuz[str(cuz)])
    for cuz in range(1, 31)
}

manifest = {
    "version": "atlas-locked-target-alignment-manifest-v1",
    "target_source_blob_sha": target["source_blob_sha"],
    "target_count": len(keys),
    "meal_source_id": "diyanet-isleri-baskanligi-meali-1",
    "voice": "Mazlum Kiper",
    "source_policy": "locked Atlas targets only; no verse additions or removals",
    "target_counts_by_cuz": target_counts,
    "key_to_unit": key_to_unit,
    "sources": {
        str(i): {
            "audio_src": sources["sources"][str(i)]["audio_src"],
            "verified": sources["sources"][str(i)]["verified"],
            "meal_source_id": sources["sources"][str(i)]["meal_source_id"],
        }
        for i in range(1, 31)
    },
    "units_by_cuz": units_by_cuz,
}

OUTPUT_PATH.write_text(
    json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n",
    encoding="utf-8",
)

print(json.dumps({
    "status": "PASS",
    "target_count": len(key_to_unit),
    "unit_count": sum(len(v) for v in units_by_cuz.values()),
    "target_counts_by_cuz": target_counts,
}, ensure_ascii=False))
