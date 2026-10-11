import json
import re
import subprocess
import sys
from pathlib import Path

from lxml import html

ROOT = Path(__file__).resolve().parent
PAGE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "index.html"
document = html.parse(str(PAGE))
corpus = {}
for line in (ROOT.parent / "data/quran-uthmani-tanzil-v1.1.txt").read_text().splitlines():
    if re.match(r"^\d+\|\d+\|", line):
        sura, aya, text = line.split("|", 2)
        corpus[f"{sura}:{aya}"] = text
assert len(corpus) == 6236
cards = document.xpath('//article[@class="verse-card"]')
topics = document.xpath('//section[@class="topic"]')
assert len(cards) == 114 and len(topics) == 10
ids = document.xpath('//@id')
assert len(ids) == len(set(ids)), "Tekrarlanan HTML kimliği"
keys = set()
for card in cards:
    key = card.get("data-key")
    assert key not in keys, f"Tekrarlanan ayet: {key}"
    keys.add(key)
    arabic = card.xpath('.//p[@class="arabic"]')
    assert len(arabic) == 1 and arabic[0].text_content() == corpus[key], key
    assert arabic[0].get("lang") == "ar" and arabic[0].get("dir") == "rtl"
    title = card.xpath('./h3')[0].text_content()
    assert not re.search(r"\d+:\d+", title), title
    assert title.endswith(" " + key.split(":")[1]), title
    meal = card.xpath('.//p[@class="meal"]')[0].text_content()
    assert meal.startswith("Tam çalışma meali") and len(meal) > 30
    assert not re.search(r"\.\.\.|…", meal), key
    if corpus[key].startswith("بِسْمِ"):
        assert "Rahmân ve Rahîm Allah'ın adıyla." in meal, key
    assert card.xpath('.//a[@class="source-link"]')[0].get("href") == f"https://tanzil.net/#{key}"
for anchor in document.xpath('//a[starts-with(@href,"#")]'):
    assert anchor.get("href")[1:] in ids, anchor.get("href")
for sura, start, end in [(2, 142, 150), (23, 1, 11), (62, 9, 11), (70, 19, 35), (73, 1, 8), (96, 9, 19), (107, 1, 7)]:
    assert all(f"{sura}:{aya}" in keys for aya in range(start, end + 1))
for key in ["2:43", "2:115", "2:125", "2:238", "2:239", "3:39", "3:43", "4:43", "4:101", "4:102", "4:103", "5:6", "17:78", "17:110", "20:14", "22:26", "22:77", "24:36", "24:37", "29:45", "48:29", "73:20"]:
    assert key in keys, f"Eksik çekirdek: {key}"
visible = " ".join(document.xpath('//body//text()[not(ancestor::script) and not(ancestor::style)]'))
assert not re.search(r"\b\d+:\d+\b", visible), "Görünen çıplak ayet numarası"
assert not re.search(r"[āūʿ]|\b(?:DIRECT|OPEN|D2)\b", visible), "Standart dışı etiket/yazım"
scripts = document.xpath('//script/text()')
assert len(scripts) == 1
subprocess.run(["node", "--check"], input=scripts[0], text=True, check=True, capture_output=True)
payload = {
    "script": scripts[0],
    "topics": [{"id": t.get("id"), "title": t.xpath('./div[@class="topic-head"]/h2')[0].text_content(),
        "cards": [{"id": c.get("id"), "key": c.get("data-key"), "text": c.text_content()} for c in t.xpath('.//article[@class="verse-card"]')]} for t in topics],
    "anchors": [a.get("href") for a in document.xpath('//a[starts-with(@href,"#")]')],
}
controls = subprocess.run(["node", str(ROOT / "test-controls.mjs")], input=json.dumps(payload), text=True, check=True, capture_output=True)
print(json.dumps({"ayet": len(cards), "tam_arapca_eslesmesi": len(cards), "tam_calisma_meali": len(cards), "konu": len(topics), "eksik_baglanti": 0, "gorunen_ciplak_numara": 0, "arayuz_testleri": json.loads(controls.stdout)}, ensure_ascii=False))
