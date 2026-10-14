# ATLAS DENETİMİ — TALİMAT

GÖREV: Kur'an'ın Arapça metnine dayalı bir veri tablosunu SATIR SATIR denetle. Her satırı tek tek okuyacaksın; örnekleme, özetleme, "benzerleri de aynıdır" demek YASAK.

ELİNDEKİ DOSYALAR: Bu klasördeki parti1…parti4 CSV dosyaları (toplam 1.315 satır). Hepsini sırayla, kesintisiz işle; her parti için ayrı çıktı üret. Her satır bir "kayıt"tır: bir DAVRANIŞ ayeti (davranis_ayet / davranis_arapca) ile ona bağlanan KARŞILIK ayeti (karsilik_ayet / karsilik_arapca), karşılık kodu ve adı (karsilik_kodu / karsilik_adi), bağ derecesi (derece), kayıt türü (tur) ve kısa not (kayit_notu). Meal sütunları yalnız okuma kolaylığıdır; hakem ARAPÇA LAFIZDIR.

KAYNAK KURALI (bağlayıcı): Yalnızca Kur'an'ın Arapça lafzı ve bağlamı esas alınır. Hadis, rivayet, israiliyat, "tefsirde şöyle bilinir", mezhep görüşü, sebeb-i nüzul KULLANILMAZ. Bir bulgunu ayetin kendi lafzından/yakın bağlamından gösteremiyorsan yazma.

ATLASIN KURALLARI (bunlara göre denetle):
1) derece ✓ = karşılık, davranışın sahibine ayetin kendi lafzıyla (zamir, "işte onlar", aynı fiil öznesi) bağlanıyor. derece → = çıkarım: karşılık başka bir gruba/sıfata bağlı (kâfirler, zalimler, muhsinler, muttakîler vb.) ve davranışla bağı bağlamla kuruluyor, ya da benzetme/alıntılanan söz yoluyla geliyor. derece ? = davranış ayette adlandırılmamış, yalnızca bağlam. "?" bir hata işareti DEĞİL, "davranış adlandırılmamış" demektir; bunu hata diye bildirme.
2) karsilik_kodu / karsilik_adi, karşılık ayetindeki KELİMENİN kendisine uymalı (ör. "elîm" azap ≠ "azîm" azap; "gurfe" ≠ "cennet"; "makt" ≠ "gazap"). Ayet bir şeyi adıyla söylemiyorsa ad ayete eklenmemeli.
3) Karşılık ayeti, kodlanan karşılığı gerçekten içermeli. İçermiyorsa doğru ayeti göster. Ayette açıkça yazılı bir karşılık kayıttan atlanmışsa bunu "eksik karşılık" olarak bildir.
4) tur: emir = Allah'ın doğrudan emri; yasak = doğrudan yasak; sonuc = bir davranışın sonucunu bildiren haber; tanim = bir kişi/grubun niteliğini tarif eden ya da aktarılan (bildirilen) emir/söz. Aynı cümle iki kayıtta farklı türle kodlanmışsa bildir.
5) kayit_notu ayette olmayan ayrıntı içermemeli (meal yorumu, eklenmiş sebep, sayı, mekân vb.).
6) Aynı ayet/ifade başka kayıtlarda farklı kodlanmışsa (tutarsızlık), bu partide gördüklerini bildir.

SORUN TÜRÜ HARFLERİ:
a = Başlık/davranış uyuşmazlığı (davranış ayeti, kayıt başlığındaki davranışı söylemiyor)
b = Davranış–karşılık bağı/derece (zamir yok, karşılık başka gruba bağlı, ✓/→/? yanlış)
c = Karşılık kodu/adı lafza uymuyor, karşılık ayeti yanlış ya da ayette yazılı karşılık eksik
d = Not/meal: nota ayette olmayan ayrıntı girmiş ya da not Arapçayla çelişiyor
e = Derece ayrıca: ✓ olması gerekirken → (veya tersi) — b'den ayrı saymak istersen
f = Tür (emir/yasak/sonuc/tanim) yanlış
g = Kayıtlar arası tutarsızlık
h = Diğer (açıkla)

ÇIKTI (tek bir "sonuc.zip" içinde, parti başına bir dosya: okuma_parti1.csv … okuma_parti4.csv)
Her dosyada girdideki HER SATIR İÇİN bir satır olacak (satır sayısı birebir aynı). Kolonlar:
id, satir_sha256, kontrol_notu, bulgu_var (evet/hayir), sorun_turu (a–h; birden fazlaysa virgülle), ayetin_gercek_lafzi (bulgu varsa: ilgili Arapça ifade + kısa Türkçe), onerilen_duzeltme, guven (yuksek/orta/dusuk)
- satir_sha256: girdideki değeri Python ile okuyup AYNEN geri yaz (elle yazma). Satırı gerçekten okuduğunun kanıtıdır.
- kontrol_notu: o satırda neye baktığını 1 cümleyle yaz; boş bırakma, hepsine aynı kalıp cümleyi yapıştırma.
- bulgu_var=hayir ise sorun_turu/onerilen_duzeltme boş kalabilir.
Başka dosya üretme (özet/kapsam dosyasını ben kendim hesaplarım).

ÇALIŞMA DÜZENİ (önemli — kullanıcıya soru sorma, onay bekleme):
- Dosyaları parti sırasıyla ve 40–60 satırlık dilimlerle işle; bir dilimi bitirmeden sonrakine geçme. Tüm 4 partiyi bitirene kadar kendiliğinden devam et.
- Kendi belleğinden ayet yazma; Arapçayı dosyadaki davranis_arapca / karsilik_arapca sütunundan al. Metin yoksa "metin yok" yaz.
- Emin değilsen bulgu_var=hayir yaz, kontrol_notu'na şüphe notu düş, guven=dusuk ver; zorla bulgu üretme. Amaç bulgu sayısı değil doğruluktur.
- Sınıra/zaman aşımına takılırsan o ana kadar bitenleri sonuc.zip'e koy ve tek cümleyle "X partisi, Y id'sine kadar bitti" de; kullanıcı "devam" yazınca kaldığın yerden sürdür.
