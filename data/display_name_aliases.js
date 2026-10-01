/* Sünnetullah Atlas — display_name_aliases.js
   Elle düzenlenebilir, isteğe bağlı UI-görünüm-adı haritası.
   Araştırma kaydındaki "isim" alanını ASLA değiştirmez; yalnızca site
   arayüzünde gösterilecek daha doğal bir ad varsa buraya eklenir.

   Kural: bir giriş yalnızca ilgili kaydın kendi "isim", "ozet" ve "detay"
   alanlarının desteklediği anlamla birebir uyumluysa eklenebilir. Yeni bir
   Kur'an yorumu veya anlam çıkarımı oluşturmaz. Emin olunmayan durumda bu
   dosyaya HİÇBİR ŞEY eklenmez; site orijinal "isim" alanını gösterir.

   Biçim: { "top_XXXX": "Kullanıcıya gösterilecek ad" }

   Aşağıdaki 6 giriş, günlük Türkçede sert/yanlış anlaşılabilecek veya
   kelimesi kelimesine çeviri hissi veren kaynak adlar için, ilgili kaydın
   kendi özet alanıyla birebir uyumlu, kullanıcı onaylı düzeltmelerdir.
   Diğer tüm kayıtlar orijinal araştırma adıyla gösterilmeye devam eder. */
window.ATLAS_DISPLAY_NAME_ALIASES = {
  // Kaynak: "Allah'ın rızasını kazanmak için kendini satanlar"
  // Özet: "Allah'ın rızasını kazanmak için kendini feda eden insanlar."
  "top_0060": "Allah rızası için kendini feda edenler",

  // Kaynak: "Her bir insan topluluğu (pınarlar)"
  // Özet: "Taştan fışkıran pınarlardan her birinin kendi içme yerini bildiği gruplar."
  "top_0016": "Her biri kendi pınarını bilen topluluklar",

  // Kaynak: "Tahminciler (el-harrâsûn, 51:10-14)"
  // Özet: "Çelişkili söz içinde olan, ... tahminciler."
  "top_0534": "Bilgisizce tahmin yürütenler",

  // Kaynak: "Sözü hoşa gidip yeryüzünde bozgunculuk yapan kimse"
  // Özet: "Dünya hayatına dair sözü hoşa giden, ... bozgunculuğa koşan kimse."
  "top_0059": "Görünüşte hoş konuşup bozgunculuk yapan kimse",

  // Kaynak: "Şüphe içinde oynayanlar (44:9)"
  // Özet: "Şüphe içinde oyalanan; ..."
  "top_0504": "Şüphe içinde oyalananlar",

  // Kaynak: "Dalıp oynayan yalanlayıcılar (52:11-12)"
  // Özet: "... boş şeylere dalıp oynayan, cehennem ateşine itilen yalanlayıcılar."
  "top_0536": "Boş şeylere dalıp oynayan yalanlayıcılar",
};
