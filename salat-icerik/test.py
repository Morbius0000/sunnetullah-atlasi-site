"""Salâtın İçeriği Atlası için yapı ve metin denetimi.

Çalıştırma: python3 salat-icerik/test.py  (önce: node salat-icerik/build.mjs)
Gerekenler: Python lxml paketi ve Node.js.
"""
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
for line in (ROOT.parent / "data/quran-uthmani-tanzil-v1.1.txt").read_text(encoding="utf8").splitlines():
    if re.match(r"^\d+\|\d+\|", line):
        sura, aya, text = line.split("|", 2)
        corpus[f"{sura}:{aya}"] = text
assert len(corpus) == 6236, "Kaynak dosya 6236 ayet olmalı"
yn = json.loads((ROOT / "yasar-nuri-meal.json").read_text(encoding="utf8"))["ayetler"]
BASMALA = corpus["1:1"]  # Fâtiha 1: besmelenin kaynak metindeki yazımı

cards = document.xpath('//article[contains(concat(" ", normalize-space(@class), " "), " verse-card ")]')
topics = document.xpath('//section[@class="topic"]')
panels = document.xpath('//section[contains(concat(" ", normalize-space(@class), " "), " panel ")]')
assert len(cards) == 137, f"Ayet kartı sayısı: {len(cards)}"
assert len(topics) == 12, f"Konu sayısı: {len(topics)}"
assert [p.get("id") for p in panels] == ["ozet", "konular", "acik", "yontem"], "Sekme panelleri"

ids = document.xpath("//@id")
assert len(ids) == len(set(ids)), "Tekrarlanan HTML kimliği"

keys = set()
basmala_cards = 0
for card in cards:
    key = card.get("data-key")
    assert key not in keys, f"Tekrarlanan ayet: {key}"
    keys.add(key)
    arabic = card.xpath('.//p[@class="arabic"]')
    assert len(arabic) == 1, key
    assert arabic[0].get("lang") == "ar" and arabic[0].get("dir") == "rtl", key
    basmala = card.xpath('.//p[@class="basmala"]')
    full = corpus[key]
    if full.startswith(BASMALA + " "):
        basmala_cards += 1
        assert len(basmala) == 1 and basmala[0].text_content() == BASMALA, f"Besmele ayrı gösterilmeli: {key}"
        assert arabic[0].text_content() == full[len(BASMALA) + 1:], f"Arapça metin kaynakla aynı değil: {key}"
    else:
        assert not basmala, key
        assert arabic[0].text_content() == full, f"Arapça metin kaynakla aynı değil: {key}"
    title = card.xpath(".//h3")[0].text_content()
    assert not re.search(r"\d+:\d+", title), title
    assert title.endswith(" " + key.split(":")[1]), title
    meal = card.xpath('.//span[@class="meal-text"]')[0].text_content()
    assert len(meal) > 10, f"Meal eksik: {key}"
    assert not re.search(r"\.\.\.|…", meal), f"Kesilmiş meal: {key}"
    assert card.xpath('.//a[contains(@class, "source-link")]')[0].get("href") == f"https://tanzil.net/#{key}", key
    yn_text = card.xpath('.//span[@class="yn-text"]')
    assert len(yn_text) == 1 and yn_text[0].text_content() == yn[key], f"Yaşar Nuri meali kaynakla aynı değil: {key}"
    cmp = card.xpath('.//*[contains(concat(" ", normalize-space(@class), " "), " cmp ")]')
    assert len(cmp) == 1 and "Meal ile Arapça" in cmp[0].text_content(), f"Meal ile Arapça satırı yok: {key}"

for anchor in document.xpath('//a[starts-with(@href, "#")]'):
    assert anchor.get("href")[1:] in ids, f"Hedefi olmayan bağlantı: {anchor.get('href')}"

passages = [(2, 142, 150), (23, 1, 11), (62, 9, 11), (70, 19, 35), (73, 1, 8), (96, 9, 19), (107, 1, 7),
            (17, 107, 109), (7, 204, 206), (87, 14, 15), (2, 155, 157), (22, 77, 78)]
for sura, start, end in passages:
    for aya in range(start, end + 1):
        assert f"{sura}:{aya}" in keys, f"Pasaj eksik: {sura}:{aya}"
core = ["2:43", "2:115", "2:125", "2:153", "2:177", "2:238", "2:239", "3:39", "3:43", "3:113", "4:43", "4:101",
        "4:102", "4:103", "5:6", "9:99", "10:87", "11:87", "17:78", "17:110", "20:14", "22:18", "22:26", "22:40",
        "22:77", "24:36", "24:37", "24:41", "24:58", "25:64", "29:45", "38:24", "39:9", "48:29", "73:20",
        "5:101", "2:186", "22:78"]
for key in core:
    assert key in keys, f"Eksik çekirdek ayet: {key}"

visible = " ".join(document.xpath("//body//text()[not(ancestor::script) and not(ancestor::style)]"))
assert not re.search(r"\b\d+:\d+\b", visible), "Görünen çıplak ayet numarası"
assert not re.search(r"[āūīʿḥṣḍṭẓ]|\b(?:DIRECT|OPEN|D2)\b", visible), "Standart dışı etiket ya da yazım"

scripts = document.xpath("//script/text()")
assert len(scripts) == 1, "Tek bir betik olmalı"
subprocess.run(["node", "--check"], input=scripts[0], text=True, check=True, capture_output=True)
payload = {
    "script": scripts[0],
    "cards": [{"key": c.get("data-key"), "title": c.xpath(".//h3")[0].text_content(),
               "text": (c.get("data-topic-title") or "") + " " + c.text_content()} for c in cards],
}
controls = subprocess.run(["node", str(ROOT / "test-controls.mjs")], input=json.dumps(payload), text=True,
                          check=True, capture_output=True)
print(json.dumps({
    "ayet": len(cards), "konu": len(topics), "sekme": len(panels),
    "arapca_kaynakla_ayni": len(cards), "yasar_nuri_kaynakla_ayni": len(cards), "besmele_ayri": basmala_cards,
    "eksik_baglanti": 0, "gorunen_ciplak_numara": 0,
    "arama_testleri": json.loads(controls.stdout),
}, ensure_ascii=False))
