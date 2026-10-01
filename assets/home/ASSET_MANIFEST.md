# Sünnetullah Atlası — Ana Sayfa Level 2 Asset Manifesti

> **Durum (v1, 2026-10-01):** A01–A10 tamamı `sunnetullah_level2_assets_v1.zip`
> paketiyle teslim alındı ve aşağıdaki klasörlere yerleştirildi; ilgili
> selectorlar `site/app/css/app.css` içinde gerçek dosya yollarına
> (`url(...)`) bağlandı. Bu tablo artık hem sözleşme hem de güncel
> bağlama kaydı olarak görev yapar — ileride bir asset güncellenirse
> yalnızca ilgili dosya değiştirilmesi yeterlidir, selector/kod
> değişikliği gerekmez.

Asset eksik kalan bir slot olursa CSS tabanlı placeholder (gradient/glow/
geometrik şekil) devreye girer; 404 görsel ikonu görünmez (çünkü hepsi
`<img>` değil, CSS `background-image` olarak bağlanır).

## Genel kurallar

- Format önceliği: **WebP** (fallback: PNG). Şeffaflık gerekiyorsa PNG/WebP,
  gerekmiyorsa JPEG de kabul edilir.
- Dosya adları aşağıdaki id'lerle birebir eşleşmeli (örn. `A01_hero_quran_closed.webp`).
- Görsel yerleştirildikten sonra ilgili CSS custom property
  (`--asset-*`) veya `background-image` yolu, dosyayı klasöre koymanız
  yeterli olacak şekilde `site/app/css/app.css` içinde zaten tanımlıdır;
  yalnızca gerçek dosya adını `url(...)` içine yazmanız gerekir
  (bkz. "Bağlama" sütunu).

| ID  | Asset                     | Dosya (yerleşti)                                              | Gerçek boyut   | Kullanıldığı selector / bağlama |
|-----|---------------------------|----------------------------------------------------------------|----------------|----------------------------------|
| A01 | hero_quran_closed         | `quran/A01_hero_quran_closed.webp`                             | 640×800 px     | `.quran-book-closed` — `background-image: url("../assets/home/quran/A01_hero_quran_closed.webp")` |
| A02 | hero_quran_open           | `quran/A02_hero_quran_open.webp`                                | 640×800 px     | `.quran-book-open` — `background-image: url("../assets/home/quran/A02_hero_quran_open.webp")` |
| A03 | hero_quran_page_glow      | `quran/A03_hero_quran_page_glow.webp`                           | 400×600 px     | `.quran-page-light` — ikinci `background-image` katmanı (cyan gradient üstte, `screen` blend) |
| A04 | hero_background           | `backgrounds/A04_hero_background.webp`                          | 2400×1600 px   | `.home-hero-section` — son `background` katmanı (mevcut radial/linear gradient'lerin altında, `cover`) |
| A05 | holo_panel_kavimler       | `holograms/A05_holo_panel_kavimler.webp`                        | 240×120 px     | `.holo-panel.p-kavimler` — `background-image` (koyulaştırma gradient'i + görsel) |
| A06 | holo_panel_olaylar        | `holograms/A06_holo_panel_olaylar.webp`                         | 240×120 px     | `.holo-panel.p-olaylar` — `background-image` (koyulaştırma gradient'i + görsel) |
| A07 | holo_panel_ayet           | `holograms/A07_holo_panel_ayet.webp`                            | 240×120 px     | `.holo-panel.p-ayetler` — `background-image` (koyulaştırma gradient'i + görsel) |
| A08 | card_kavimler             | `cards/A08_card_kavimler.webp`                                  | 720×480 px     | `#home-card-kavimler` — `background-image` (koyulaştırma gradient'i + görsel) |
| A09 | card_olaylar              | `cards/A09_card_olaylar.webp`                                   | 720×480 px     | `#home-card-olaylar` — `background-image` (koyulaştırma gradient'i + görsel) |
| A10 | card_ayet_baglantilari    | `cards/A10_card_ayet_baglantilari.webp`                         | 720×480 px     | `#home-card-ayetler` — `background-image` (koyulaştırma gradient'i + görsel) |

## Klasör yapısı

```
site/app/assets/home/
  quran/         # A01, A02, A03
  backgrounds/   # A04
  holograms/     # A05, A06, A07
  cards/         # A08, A09, A10
  icons/         # (ileride) header/menü ikonları için ayrılmış, şu an boş
```

## Notlar

- A01/A02 teslim alınan sürümde kapakta okunabilir/uydurma Arapça metin
  yoktur (geometrik rozet), açık sayfalar dekoratif/metinsiz bırakılmıştır;
  bu kural ileride asset güncellenirse de geçerlidir.
- Bir asset ileride güncellenirse yalnızca aynı dosya adıyla ilgili
  klasöre yeniden yazılması yeterlidir; CSS değişikliği gerekmez. Dosya
  adı değişecekse ilgili `url(...)` yolu da güncellenmelidir.
- Asset boyutları hedefle birebir eşleşiyor; tamamı `background-size:
  cover` veya `contain` ile responsive şekilde ölçekleniyor.
