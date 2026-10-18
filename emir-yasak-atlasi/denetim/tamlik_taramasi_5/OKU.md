# Tamlık taraması (5. tur, 19 Ekim 2026)

Amaç: atlasın hiçbir kaydına girmemiş ama bir davranışa karşılığı lafzen bağlayan ayetleri bulmak.

1. Atlastaki bütün kayıtların davranış ve karşılık ayetleri toplandı (1.910 ayet).
2. Geri kalan ayetler harekesi kaldırılmış Tanzil metninde üç kelime listesi ve bir kalıp listesiyle tarandı
   (betikler: `kapsam2.py`, `kapsam3.py`, `kapsam4.py`, `formul.py`): 300 + 127 + 97 aday ve kalıp taramasının bulduğu ayetler.
3. Her aday Arapça metinden tek tek okundu. Alınmayanlar: peygamberin ücret istemediğini söylediği ayetler, dualar,
   davranışı adlandırılmayan kıssa ayetleri, yaratılış ve nimet ayetleri, yan ayeti zaten kayıtta olan devam cümleleri.
4. Alınan 169 kayıt `eklenen_kayitlar.tsv` dosyasındadır (75 ödül / Konu 8, 94 ceza / Konu 9; blok kodu `EK05`).
   Derece, tür ve lafız kuralları önceki turlardaki gibi uygulandı.

Yeni karşılık kodları: Konu 8: sekine, fetih, galibiyet, zulfa, naim, illiyyin, ravda. Konu 9: tufan, icl_sevgisi, oldurulme, aglama,
allahtan_kopma, rics, kotu_sabah, evla, nasiye, onlardan_sayilma, dagitilma. Yeni davranış başlığı: sihir.
Ayrıca konular.mjs'deki yinelenen `azaptan_korunma` anahtarı ve ceza.mjs'deki yinelenen `celde_100` satırı kaldırıldı.
