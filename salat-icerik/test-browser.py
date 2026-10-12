"""Salâtın İçeriği Atlası için tarayıcı denetimi (isteğe bağlı).

Çalıştırma: python3 salat-icerik/test-browser.py
Gerekenler: Python playwright paketi ve Chromium. Playwright yoksa test atlanır.
Dış bağlantılar (yazı tipleri) engellenir; yalnız sayfanın kendisi sınanır.
"""
import json
import pathlib
import sys

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print(json.dumps({"atlandi": "playwright kurulu değil"}, ensure_ascii=False))
    sys.exit(0)

PAGE = pathlib.Path(__file__).resolve().parent / "index.html"
URL = PAGE.as_uri()
results = {}


def local_only(route):
    if route.request.url.startswith("file:"):
        route.continue_()
    else:
        route.abort()


with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for width in (1280, 390, 320):
        page = browser.new_page(viewport={"width": width, "height": 850})
        page.route("**/*", local_only)
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: m.type == "error" and "net::" not in m.text and errors.append(m.text))
        page.goto(URL)
        overflow = lambda: page.evaluate("document.documentElement.scrollWidth - innerWidth")
        visible_panels = lambda: page.evaluate("[...document.querySelectorAll('.panel')].filter(p => !p.hidden).map(p => p.id)")

        assert visible_panels() == ["ozet"], visible_panels()
        assert overflow() <= 0, f"{width}: yatay taşma (özet)"
        page.click("#tab-konular")
        assert visible_panels() == ["konular"]
        page.click('.chip[data-topic="hazirlik"]')
        assert "3 ayet" in page.inner_text("#count")
        assert overflow() <= 0, f"{width}: yatay taşma (konular)"
        page.fill("#search", "namaz")
        assert page.evaluate("[...document.querySelectorAll('.verse-card')].filter(c => !c.hidden).length") > 60
        page.fill("#search", "ZZZX")
        assert page.evaluate("!document.getElementById('empty').hidden")
        page.click("#reset")
        page.click("#tab-ozet")
        page.click('.answer a[href="#ayet-4-103"]')
        page.wait_for_timeout(700)
        jump = page.evaluate("""(() => { const c = document.getElementById('ayet-4-103'); const r = c.getBoundingClientRect();
            return [!c.hidden, !document.getElementById('konular').hidden, r.top >= 0 && r.top < innerHeight]; })()""")
        assert jump == [True, True, True], jump
        page.go_back()
        page.wait_for_timeout(300)
        assert visible_panels() == ["ozet"], "Geri tuşu özet sekmesine dönmeli"
        page.click('[data-fs="1"]')
        assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--fs').trim()") == "1.12"
        page.click('[data-fs="-1"]')
        for tab in ("acik", "yontem"):
            page.click(f"#tab-{tab}")
            assert visible_panels() == [tab]
            assert overflow() <= 0, f"{width}: yatay taşma ({tab})"
        page.goto(URL + "#ayet-24-41")
        page.wait_for_timeout(700)
        assert page.evaluate("document.querySelector('.chip[aria-pressed=true]').dataset.topic") == "ayrim"
        page.goto(URL + "#konu-korku")
        page.wait_for_timeout(700)
        top = page.evaluate("Math.round(document.getElementById('konu-korku').getBoundingClientRect().top)")
        bar = page.evaluate("Math.round(document.querySelector('.tabbar').getBoundingClientRect().bottom)")
        assert top >= bar - 8, f"{width}: konu başlığı sekme çubuğunun altında kalıyor ({top} < {bar})"
        assert not errors, errors
        results[width] = "geçti"
        page.close()

    page = browser.new_page(java_script_enabled=False)
    page.route("**/*", local_only)
    page.goto(URL)
    shown = page.evaluate("[...document.querySelectorAll('.verse-card')].filter(c => getComputedStyle(c).display !== 'none').length")
    assert shown == 134, f"JavaScript kapalıyken görünen ayet: {shown}"
    results["javascript_kapali"] = "134 ayet görünür"
    browser.close()

print(json.dumps(results, ensure_ascii=False))
