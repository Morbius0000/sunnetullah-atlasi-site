/* Sünnetullah Atlas — app.js
   Framework-free vanilla JS. Reads window.ATLAS_DATA (see data/atlas_public.js).
   Hash-routed SPA, works over file://. */
(function () {
  "use strict";

  var DATA = window.ATLAS_DATA || { meta: {}, topluluklar: [], ayetler: {} };
  var TOP = DATA.topluluklar || [];
  var META = DATA.meta || {};
  var AYETLER = DATA.ayetler || {};
  var VERSE_ENRICHMENT = { verses: {} };
  var DIYANET_MEAL_URL = "data/diyanet_atlas_5246.json";

  function loadDiyanetMeal() {
    if (!window.fetch) return;
    fetch(DIYANET_MEAL_URL, { cache: "force-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("Diyanet meal HTTP " + res.status);
        return res.json();
      })
      .then(function (payload) {
        VERSE_ENRICHMENT = { verses: (payload && payload.verses) || {} };
        if (document.readyState !== "loading") route();
      })
      .catch(function (err) {
        if (window.console && console.warn) console.warn("Diyanet meal yüklenemedi:", err);
      });
  }

  var CATEGORY_LABELS = {
    A_tarihi: "Tarihî Kavimler",
    B_isimsiz: "İsimsiz Topluluklar",
    C_genel_grup: "Genel Gruplar",
    insan_disi: "İnsan Dışı Topluluklar",
  };

  var OUTCOME_BUCKETS = [
    { key: "uyari", label: "Uyarı" },
    { key: "suclama", label: "Suç / Davranış" },
    { key: "ceza", label: "Ceza" },
    { key: "helak", label: "Helâk" },
    { key: "kurtulus", label: "Kurtuluş" },
    { key: "nimet", label: "Nimet / Şükür" },
    { key: "mujde", label: "Müjde" },
    { key: "sinama", label: "Sınama" },
    { key: "af", label: "Af" },
    { key: "emir", label: "Emir" },
    { key: "diger", label: "Diğer" },
  ];

  var FEATURED_IDS = [
    "top_0197", "top_0200", "top_0203", "top_0206", "top_0013",
    "top_0012", "top_0209", "top_0428", "top_0604",
  ];

  var PAGE_SIZE = 30;

  // ---------------------------------------------------------------
  // Display-name layer (UI-only; never changes the research "isim" field)
  // ---------------------------------------------------------------
  // Elle düzenlenebilir küçük bir alias haritası: site/app/data/display_name_aliases.js
  // Yalnızca kayıt adı/özet/detay ile açıkça uyumlu, anlam değiştirmeyen daha
  // doğal bir kullanıcı-yüzü adı varsa buraya eklenir. Emin olunmayan her
  // durumda orijinal "isim" alanı aynen gösterilir.
  var DISPLAY_NAME_ALIASES = (window.ATLAS_DISPLAY_NAME_ALIASES || {});

  function displayName(t) {
    if (!t) return "";
    var alias = DISPLAY_NAME_ALIASES[t.id];
    return (alias && alias.trim()) ? alias : t.isim;
  }

  // ---------------------------------------------------------------
  // Utils
  // ---------------------------------------------------------------
  function trNorm(s) {
    if (!s) return "";
    s = String(s).toLowerCase();
    var map = { "â": "a", "û": "u", "î": "i", "ı": "i", "ö": "o", "ü": "u",
                "ş": "s", "ç": "c", "ğ": "g", "'": "", "’": "" };
    return s.replace(/[âûîıöüşçğ'’]/g, function (ch) { return map[ch] || ch; });
  }

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function catLabel(k) { return CATEGORY_LABELS[k] || k; }

  // ---------------------------------------------------------------
  // Data indices (built once)
  // ---------------------------------------------------------------
  var byId = {};
  TOP.forEach(function (t) { byId[t.id] = t; });

  var childrenOf = {}; // ust_topluluk_id -> [alt gruplar] (görsel hiyerarşi; veri ilişkisi değişmez)
  TOP.forEach(function (t) {
    if (!t.ust_topluluk_id) return;
    (childrenOf[t.ust_topluluk_id] = childrenOf[t.ust_topluluk_id] || []).push(t);
  });

  // Arama/liste sonuçlarında ana kayıtları alt gruplardan önce göster
  // (yalnızca görsel sıralama; veri ilişkisini değiştirmez).
  function mainRecordsFirst(arr) {
    return arr.slice().sort(function (a, b) {
      return (a.ust_topluluk_id ? 1 : 0) - (b.ust_topluluk_id ? 1 : 0);
    });
  }

  var categoryCounts = {};
  TOP.forEach(function (t) {
    categoryCounts[t.kategori] = (categoryCounts[t.kategori] || 0) + 1;
  });

  var eventsMap = {}; // olay_id -> {..., topluluk_ids:[], topluluk_names:[], review_pending_any}
  TOP.forEach(function (t) {
    (t.olaylar || []).forEach(function (o) {
      var e = eventsMap[o.id];
      if (!e) {
        e = eventsMap[o.id] = {
          id: o.id, baslik: o.baslik, olay_tipi: o.olay_tipi, ek_tipler: o.ek_tipler,
          kapsam: o.kapsam, ozet: o.ozet, detay: o.detay,
          ayette_belirtilen_sebep: o.ayette_belirtilen_sebep,
          durum: o.durum, tarama: o.tarama, verses: o.verses, taraflar: o.taraflar,
          topluluk_ids: [], topluluk_names: [], review_pending_any: false,
        };
        eventsMap[o.id] = e;
      }
      if (e.topluluk_ids.indexOf(t.id) === -1) {
        e.topluluk_ids.push(t.id);
        e.topluluk_names.push(displayName(t));
      }
      if (o.review_pending) e.review_pending_any = true;
    });
  });
  var allEvents = Object.keys(eventsMap).map(function (k) { return eventsMap[k]; });

  // search index (built lazily once, cheap enough at 607 + ~unique events)
  var searchIndex = null;
  function buildSearchIndex() {
    if (searchIndex) return searchIndex;
    searchIndex = [];
    TOP.forEach(function (t) {
      var names = [t.isim, displayName(t)].concat((t.alt_isimler || []).map(function (a) { return a.ifade; }));
      searchIndex.push({
        type: "topluluk", id: t.id, name: t.isim, kategori: t.kategori,
        norm: trNorm(names.filter(Boolean).join(" ") + " " + t.id + " " + catLabel(t.kategori)),
      });
    });
    allEvents.forEach(function (e) {
      searchIndex.push({
        type: "olay", id: e.id, name: e.baslik, norm: trNorm((e.baslik || "") + " " + e.id),
      });
    });
    return searchIndex;
  }

  var VERSE_REF_RE = /^\s*(\d{1,3})\s*[:.,]\s*(\d{1,3})\s*$/;

  function search(query) {
    var q = trNorm(query.trim());
    if (!q) return { verse: null, topluluklar: [], olaylar: [] };

    var m = query.trim().match(VERSE_REF_RE);
    if (m) {
      var sureNo = parseInt(m[1], 10), ayetNo = parseInt(m[2], 10);
      var hits = { topluluklar: [], olaylar: [] };
      TOP.forEach(function (t) {
        var cls = verseClassIn(t, sureNo, ayetNo);
        if (cls) hits.topluluklar.push({ topluluk: t, cls: cls });
      });
      allEvents.forEach(function (e) {
        if ((e.verses || []).some(function (v) { return v.sure_no === sureNo && v.ayet_no === ayetNo; })) {
          hits.olaylar.push(e);
        }
      });
      hits.topluluklar.sort(function (a, b) {
        return (a.topluluk.ust_topluluk_id ? 1 : 0) - (b.topluluk.ust_topluluk_id ? 1 : 0);
      });
      var verseInfo = AYETLER[sureNo + ":" + ayetNo] || null;
      return {
        verse: { sure_no: sureNo, ayet_no: ayetNo },
        verseInfo: verseInfo,
        topluluklar: hits.topluluklar, olaylar: hits.olaylar,
      };
    }

    var idx = buildSearchIndex();
    var topResults = [], olayResults = [];
    for (var i = 0; i < idx.length; i++) {
      var entry = idx[i];
      if (entry.norm.indexOf(q) === -1) continue;
      if (entry.type === "topluluk") topResults.push(byId[entry.id]);
      else olayResults.push(eventsMap[entry.id]);
      if (topResults.length >= 60 && olayResults.length >= 60) break;
    }
    return { verse: null, topluluklar: mainRecordsFirst(topResults), olaylar: olayResults };
  }

  function verseClassIn(t, sureNo, ayetNo) {
    if (t.direct_verses.some(function (v) { return v.sure_no === sureNo && v.ayet_no === ayetNo; })) return "DIRECT";
    if (t.context_verses.some(function (v) { return v.sure_no === sureNo && v.ayet_no === ayetNo; })) return "CONTEXT";
    if (t.indirect_verses.some(function (v) { return v.sure_no === sureNo && v.ayet_no === ayetNo; })) return "INDIRECT";
    return null;
  }

  // ---------------------------------------------------------------
  // Small render helpers
  // ---------------------------------------------------------------
  function draftBadge() {
    return '<span class="badge-draft">ÇİFT TARAMA TAMAMLANDI</span>';
  }
  function reviewBadge() {
    return '<span class="badge-review">İnceleme bekliyor</span>';
  }

  function toplulukCard(t) {
    return (
      '<a class="card top-card" href="#/topluluk/' + esc(t.id) + '">' +
        (t.ust_topluluk_id ? '<span class="pill subgroup">Alt grup</span>' : '') +
        '<div class="top-card-head">' +
          '<span class="top-name">' + esc(displayName(t)) + '</span>' +
          '<span class="top-cat">' + esc(catLabel(t.kategori)) + '</span>' +
        '</div>' +
        '<div class="top-counts">' +
          '<span class="pill">' + t.main_verse_count + ' ilgili ayet</span>' +
          (t.olaylar.length ? '<span class="pill gold">' + t.olaylar.length + ' olay</span>' : '') +
          (t.review_pending ? reviewBadge() : '') +
        '</div>' +
      '</a>'
    );
  }

  // ---------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------
  var app = document.getElementById("app");

  function renderHome() {
    var html = '';
    html += homeHeroHtml();

    html += '<div class="home-discover-grid section">' +
      homeDiscoverCard("home-card-kavimler", "#/atlas", "Kavimler",
        "Geçmiş toplumları ve Kur'an'daki anlatımlarını keşfet.", fmt(TOP.length) + " kayıt") +
      homeDiscoverCard("home-card-olaylar", "#/olaylar", "Olaylar",
        "Ayetlerde geçen olayları ve bağlantılarını incele.", fmt(allEvents.length) + " topluluk bağlantılı olay") +
      homeDiscoverCard("home-card-ayetler", "#/ara", "Ayet Bağlantıları",
        "Ayetler arasındaki bağları Atlas üzerinden takip et.", fmt(META.toplam_ayet || 6236) + " ayet") +
    '</div>';

    html += homeSearchHtml();

    html += '<div class="stat-grid section">' +
      statCard(fmt(META.toplam_sure || 114), "Sure") +
      statCard(fmt(META.toplam_ayet || 6236), "Ayet") +
      statCard(fmt(META.kayit_sayisi || TOP.length), "Topluluk") +
      statCard(fmt(META.olaylar_toplam_kayit || allEvents.length), "Toplam olay kaydı") +
      (META.turkce_meal_kapsami ? statCard(fmt(META.turkce_meal_kapsami), "Atlas hedef ayeti (" + esc(META.turkce_meal_kaynagi || "Yaşar Nuri Öztürk") + " meali)") : '') +
    '</div>';

    html += '<div class="section">' +
      '<h2 class="section-title">Kategorilere göre keşfet</h2>' +
      '<div class="cat-grid">' +
        Object.keys(CATEGORY_LABELS).map(function (k) {
          var n = categoryCounts[k] || 0;
          if (!n) return '';
          return '<a class="card cat-card" href="#/atlas/' + k + '">' +
            '<span class="cat-name">' + esc(CATEGORY_LABELS[k]) + '</span>' +
            '<span class="cat-count">' + n + ' kayıt</span>' +
          '</a>';
        }).join('') +
        '<a class="card cat-card" href="#/olaylar">' +
          '<span class="cat-name">Olaylar</span>' +
          '<span class="cat-count">' + allEvents.length + ' olay bağlantısı</span>' +
        '</a>' +
        '<a class="card cat-card" href="#/ara">' +
          '<span class="cat-name">Ayetler</span>' +
          '<span class="cat-count">sure:ayet ile ara (ör. 7:73)</span>' +
        '</a>' +
      '</div>' +
    '</div>';

    var featured = FEATURED_IDS.map(function (id) { return byId[id]; }).filter(Boolean);
    if (featured.length) {
      html += '<div class="section">' +
        '<h2 class="section-title">Öne çıkan kayıtlar</h2>' +
        '<div class="top-list">' + featured.map(toplulukCard).join('') + '</div>' +
      '</div>';
    }

    app.innerHTML = html;
    wireHomeSearch();
    wireHomeHero();
  }

  function homeHeroHtml() {
    return (
      '<section class="home-hero-section">' +
        '<div class="home-hero-inner">' +
          '<div class="home-hero-copy">' +
            '<p class="home-hero-kicker">KUR\'AN\'IN IŞIĞINDA İNSANLIK TARİHİ</p>' +
            '<h1 class="home-hero-title">Kur\'an\'daki<br>Topluluklar, Olaylar<br><em>ve Mesajlar</em></h1>' +
            '<p class="home-hero-desc">Geçmiş toplumları, olayları ve ayetler arasındaki bağlantıları tek bir Atlas üzerinde keşfedin.</p>' +
            '<div class="home-hero-ctas">' +
              '<a class="home-cta home-cta-primary" href="#/atlas">Atlası Keşfet</a>' +
            '</div>' +
          '</div>' +
          '<div class="home-quran-stage-wrap" aria-hidden="true">' +
            '<div class="home-quran-stage">' +
              '<div class="quran-glow-back"></div>' +
              '<div class="quran-book-closed"></div>' +
              '<div class="quran-book-open"></div>' +
              '<div class="quran-page-light"></div>' +
              '<div class="quran-holo-ring ring-1"></div>' +
              '<div class="quran-holo-ring ring-2"></div>' +
              '<div class="quran-particles"></div>' +
              '<div class="quran-hologram-panels">' +
                '<div class="holo-panel p-kavimler">Kavimler</div>' +
                '<div class="holo-panel p-olaylar">Olaylar</div>' +
                '<div class="holo-panel p-ayetler">Ayet Bağlantıları</div>' +
              '</div>' +
            '</div>' +
            '<div class="home-quran-stage-3d" id="home-quran-stage-3d"></div>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function homeDiscoverCard(id, href, title, desc, count) {
    return '<a class="home-discover-card" id="' + esc(id) + '" href="' + esc(href) + '">' +
      '<div class="hd-title">' + esc(title) + '</div>' +
      '<p class="hd-desc">' + esc(desc) + '</p>' +
      '<div class="hd-count">' + esc(count) + '</div>' +
    '</a>';
  }

  var REDUCE_MOTION_MQ = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  function wireHomeHero() {
    var stage = document.querySelector(".home-quran-stage-wrap");
    if (stage && REDUCE_MOTION_MQ && !REDUCE_MOTION_MQ.matches) {
      // Hover ile en fazla 2-3 derece hafif tepki; agresif tilt yok.
      var MAX_DEG = 2.5;
      stage.addEventListener("mousemove", function (e) {
        var r = stage.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        stage.style.setProperty("--tilt-x", (px * MAX_DEG * 2).toFixed(2) + "deg");
        stage.style.setProperty("--tilt-y", (-py * MAX_DEG * 2).toFixed(2) + "deg");
      });
      stage.addEventListener("mouseleave", function () {
        stage.style.setProperty("--tilt-x", "0deg");
        stage.style.setProperty("--tilt-y", "0deg");
      });
    }

    // Level 3 (Faz 1): yalnızca WebGL + geniş ekran + reduced-motion kapalıysa
    // dener; başarısız/uygunsuzsa Level 2 2D hero aynen görünür kalır.
    if (window.AtlasHome3D && stage) {
      var stage2d = stage.querySelector(".home-quran-stage");
      var stage3d = document.getElementById("home-quran-stage-3d");
      window.AtlasHome3D.mount(stage2d, stage3d, stage);
    }
  }

  function statCard(num, label) {
    return '<div class="card stat-card"><div class="stat-num">' + esc(num) + '</div>' +
      '<div class="stat-label">' + esc(label) + '</div></div>';
  }
  function fmt(n) { return Number(n).toLocaleString("tr-TR"); }

  function homeSearchHtml() {
    return '<div class="search-wrap">' +
      '<span class="search-icon" aria-hidden="true">⌕</span>' +
      '<input class="search-input" id="home-search" type="search" ' +
      'placeholder="Kavim, topluluk, olay veya ayet ara…" aria-label="Kavim, topluluk, olay veya ayet ara">' +
      '</div><div id="home-search-results"></div>';
  }

  function wireHomeSearch() {
    var input = document.getElementById("home-search");
    var results = document.getElementById("home-search-results");
    if (!input) return;
    var onInput = debounce(function () {
      var q = input.value.trim();
      if (!q) { results.innerHTML = ''; return; }
      var r = search(q);
      results.innerHTML = renderQuickResults(r, q);
    }, 250);
    input.addEventListener("input", onInput);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { location.hash = "#/ara/" + encodeURIComponent(input.value); }
    });
  }

  function renderQuickResults(r, q) {
    var items = [];
    if (r.verse) {
      items.push('<div class="search-meta">' + r.verse.sure_no + ':' + r.verse.ayet_no + ' için ' +
        r.topluluklar.length + ' topluluk, ' + r.olaylar.length + ' olay bağlantısı bulundu.</div>');
      r.topluluklar.slice(0, 6).forEach(function (h) {
        items.push(resultRow("topluluk", displayName(h.topluluk), catLabel(h.topluluk.kategori) + ' · ' + h.cls, "#/topluluk/" + h.topluluk.id));
      });
    } else {
      r.topluluklar.slice(0, 6).forEach(function (t) {
        items.push(resultRow("topluluk", displayName(t), catLabel(t.kategori), "#/topluluk/" + t.id));
      });
      r.olaylar.slice(0, 4).forEach(function (e) {
        items.push(resultRow("olay", e.baslik, (e.topluluk_names || []).slice(0, 2).join(", "), "#/topluluk/" + (e.topluluk_ids[0] || '')));
      });
    }
    if (!items.length) return '<div class="empty-state">"' + esc(q) + '" için sonuç bulunamadı.</div>';
    items.push('<a class="back-link" style="margin-top:10px;display:block;" href="#/ara/' + encodeURIComponent(q) + '">Tüm sonuçları gör →</a>');
    return '<div class="card" style="padding:4px 0;">' + items.join('') + '</div>';
  }

  function resultRow(kind, name, sub, href) {
    return '<a class="result-item" style="display:block;" href="' + href + '">' +
      '<div class="result-kind">' + (kind === "topluluk" ? "Topluluk" : "Olay") + '</div>' +
      '<div class="result-name">' + esc(name) + '</div>' +
      (sub ? '<div class="result-sub">' + esc(sub) + '</div>' : '') +
    '</a>';
  }

  // ---------- Atlas ----------
  var atlasState = { kategori: '', review: false, hasEvents: false, page: 1 };

  function renderAtlas(presetKategori) {
    atlasState.page = 1;
    if (presetKategori !== undefined) atlasState.kategori = presetKategori || '';
    var html = '';
    html += '<div class="page-head"><h1 class="detail-title">Atlas</h1>' +
      '<div class="page-head-count"><strong>' + TOP.length + '</strong> topluluk</div>' +
      '<p class="page-head-sub">Çift tarama sonucunda doğrulanan ' + TOP.length + ' topluluk kaydının tamamı. ' + draftBadge() + '</p></div>';

    html += '<div class="filter-bar" id="atlas-filters">';
    html += '<select class="filter-select" id="f-kategori" aria-label="Kategori filtrele">';
    html += '<option value="">Tüm kategoriler</option>';
    Object.keys(CATEGORY_LABELS).forEach(function (k) {
      if (!categoryCounts[k]) return;
      html += '<option value="' + k + '"' + (atlasState.kategori === k ? ' selected' : '') + '>' +
        esc(CATEGORY_LABELS[k]) + ' (' + categoryCounts[k] + ')</option>';
    });
    html += '</select>';
    if (META.review_queue_toplam) {
      html += '<button class="filter-chip" id="f-review" aria-pressed="' + atlasState.review + '">İnceleme bekleyenler</button>';
    }
    html += '<button class="filter-chip" id="f-events" aria-pressed="' + atlasState.hasEvents + '">Olay bağlantısı olanlar</button>';
    html += '</div>';

    html += '<div id="atlas-list" class="top-list"></div>';
    html += '<button class="load-more" id="atlas-more" type="button">Daha fazla göster</button>';
    html += '<div class="search-meta" id="atlas-count" style="margin-top:10px;"></div>';

    app.innerHTML = html;

    document.getElementById("f-kategori").addEventListener("change", function (e) {
      atlasState.kategori = e.target.value; atlasState.page = 1; paintAtlasList();
    });
    var fReview = document.getElementById("f-review");
    if (fReview) {
      fReview.addEventListener("click", function () {
        atlasState.review = !atlasState.review; atlasState.page = 1;
        this.setAttribute("aria-pressed", atlasState.review); paintAtlasList();
      });
    }
    document.getElementById("f-events").addEventListener("click", function () {
      atlasState.hasEvents = !atlasState.hasEvents; atlasState.page = 1;
      this.setAttribute("aria-pressed", atlasState.hasEvents); paintAtlasList();
    });
    document.getElementById("atlas-more").addEventListener("click", function () {
      atlasState.page += 1; paintAtlasList(true);
    });

    paintAtlasList();
  }

  function filteredAtlasRows() {
    var rows = TOP.filter(function (t) {
      if (atlasState.kategori && t.kategori !== atlasState.kategori) return false;
      if (atlasState.review && !t.review_pending) return false;
      if (atlasState.hasEvents && !t.olaylar.length) return false;
      return true;
    });
    return mainRecordsFirst(rows);
  }

  function paintAtlasList(append) {
    var rows = filteredAtlasRows();
    var upto = Math.min(rows.length, atlasState.page * PAGE_SIZE);
    var listEl = document.getElementById("atlas-list");
    if (!listEl) return;
    if (!append) listEl.innerHTML = '';
    var frag = document.createDocumentFragment();
    var start = append ? (atlasState.page - 1) * PAGE_SIZE : 0;
    for (var i = start; i < upto; i++) {
      frag.appendChild(el(toplulukCard(rows[i])));
    }
    listEl.appendChild(frag);
    var moreBtn = document.getElementById("atlas-more");
    moreBtn.style.display = upto >= rows.length ? "none" : "block";
    document.getElementById("atlas-count").textContent =
      rows.length + " kayıttan " + upto + " tanesi gösteriliyor.";
    if (!rows.length) listEl.innerHTML = '<div class="empty-state">Bu filtrelerle eşleşen kayıt yok.</div>';
  }

  // ---------- Olaylar ----------
  function renderOlaylar() {
    var sorted = allEvents.slice().sort(function (a, b) {
      return (a.baslik || '').localeCompare(b.baslik || '', 'tr');
    });
    var html = '<div class="page-head"><h1 class="detail-title">Olaylar</h1>' +
      '<div class="page-head-count"><strong>' + sorted.length + '</strong> topluluk bağlantılı olay</div>' +
      '<p class="page-head-sub">En az bir topluluğa bağlı ' + sorted.length + ' olay kaydı listelenir.' +
      ((META.olaylar_toplam_kayit || 0) > sorted.length
        ? ' Toplam ' + fmt(META.olaylar_toplam_kayit) + ' olay kaydından ' + (META.olaylar_toplam_kayit - sorted.length) + ' tanesi henüz bir topluluğa bağlanmadığı için bu listede yer almaz.'
        : '') + ' ' + draftBadge() + '</p></div>';
    html += '<div class="top-list">';
    sorted.forEach(function (e) {
      html += '<a class="card top-card" href="#/topluluk/' + esc(e.topluluk_ids[0] || '') + '">' +
        '<div class="top-card-head"><span class="top-name">' + esc(e.baslik) + '</span>' +
        (e.review_pending_any ? reviewBadge() : '') + '</div>' +
        '<div class="top-counts"><span class="pill neutral">' + esc(e.olay_tipi || '') + '</span>' +
        '<span class="pill gold">' + e.topluluk_ids.length + ' topluluk</span>' +
        '<span class="pill">' + (e.verses || []).length + ' ayet</span></div>' +
        '<div class="search-meta">' + esc((e.topluluk_names || []).slice(0, 3).join(', ')) + '</div>' +
      '</a>';
    });
    html += '</div>';
    app.innerHTML = html;
  }

  // ---------- Search page ----------
  function renderSearch(initialQuery) {
    var html = '<h1 class="detail-title" style="margin-bottom:10px;">Ara</h1>';
    html += homeSearchHtml();
    html += '<div id="search-results"></div>';
    app.innerHTML = html;
    var input = document.getElementById("home-search");
    var results = document.getElementById("search-results");
    input.value = initialQuery || '';

    function paint() {
      var q = input.value.trim();
      if (!q) { results.innerHTML = '<div class="empty-state">Aramak için bir kelime, id veya sure:ayet (ör. 7:73) yazın.</div>'; return; }
      var r = search(q);
      results.innerHTML = renderFullResults(r, q);
    }
    input.addEventListener("input", debounce(paint, 250));
    paint();
  }

  function renderFullResults(r, q) {
    var html = '';
    if (r.verse) {
      if (r.verseInfo) {
        html += verseItemHtml(r.verseInfo, null, null);
      }
      html += '<p class="search-meta">' + r.verse.sure_no + ':' + r.verse.ayet_no +
        ' — ' + r.topluluklar.length + ' topluluk, ' + r.olaylar.length + ' olay bağlantısı.</p>';
      if (r.topluluklar.length) {
        html += '<h2 class="section-title">Topluluklar</h2><div class="top-list">' +
          r.topluluklar.map(function (h) {
            return '<a class="card top-card" href="#/topluluk/' + h.topluluk.id + '">' +
              (h.topluluk.ust_topluluk_id ? '<span class="pill subgroup">Alt grup</span>' : '') +
              '<div class="top-card-head"><span class="top-name">' + esc(displayName(h.topluluk)) + '</span>' +
              '<span class="pill">' + h.cls + '</span></div></a>';
          }).join('') + '</div>';
      }
      if (r.olaylar.length) {
        html += '<h2 class="section-title">Olaylar</h2><div class="top-list">' +
          r.olaylar.map(function (e) {
            return '<a class="card top-card" href="#/topluluk/' + esc(e.topluluk_ids[0] || '') + '">' +
              '<div class="top-name">' + esc(e.baslik) + '</div></a>';
          }).join('') + '</div>';
      }
      if (!r.topluluklar.length && !r.olaylar.length) {
        html += '<div class="empty-state">Bu ayet için Atlas veri setinde bağlantılı kayıt bulunamadı.</div>';
      }
      return html;
    }
    if (!r.topluluklar.length && !r.olaylar.length) {
      return '<div class="empty-state">"' + esc(q) + '" için sonuç bulunamadı.</div>';
    }
    if (r.topluluklar.length) {
      html += '<h2 class="section-title">Topluluklar (' + r.topluluklar.length + ')</h2><div class="top-list">' +
        r.topluluklar.map(toplulukCard).join('') + '</div>';
    }
    if (r.olaylar.length) {
      html += '<h2 class="section-title">Olaylar (' + r.olaylar.length + ')</h2><div class="top-list">' +
        r.olaylar.map(function (e) {
          return '<a class="card top-card" href="#/topluluk/' + esc(e.topluluk_ids[0] || '') + '">' +
            '<div class="top-card-head"><span class="top-name">' + esc(e.baslik) + '</span>' +
            (e.review_pending_any ? reviewBadge() : '') + '</div>' +
            '<div class="search-meta">' + esc((e.topluluk_names || []).slice(0, 3).join(', ')) + '</div>' +
          '</a>';
        }).join('') + '</div>';
    }
    return html;
  }

  // ---------- Menu ----------
  function renderMenu() {
    var html = '<h1 class="detail-title" style="margin-bottom:10px;">Menü</h1>';
    html += '<div class="menu-list">';
    html += menuRow("#/", "Ana Sayfa", "İstatistikler, kategoriler, öne çıkan kayıtlar");
    html += menuRow("#/atlas", "Atlas", TOP.length + " topluluk kaydının tamamı");
    html += menuRow("#/olaylar", "Olaylar", allEvents.length + " topluluk bağlantılı olay kaydı");
    html += menuRow("#/ara", "Ara", "Kavim, topluluk, olay veya ayet ara");
    html += '</div>';
    html += '<h2 class="section-title" style="margin-top:24px;">Hakkında</h2>';
    html += '<div class="card about-block">' +
      '<p>' + esc((META['not'] || '').replace(' (Tarama 1 ve Tarama 2)', '')) + '</p>' +
      (META.review_queue_toplam
        ? '<p>İnceleme bekleyen olay-topluluk bağlantısı: <strong>' + (META.review_bekleyen_topluluk_sayisi || 0) +
          '</strong> topluluk kaydında, toplam <strong>' + (META.review_queue_toplam || 0) + '</strong> bağlantı.</p>'
        : '') +
      '<p>Atlas\'ın birincil Türkçe ayet meali Prof. Dr. Yaşar Nuri Öztürk mealidir. Diyanet İşleri Başkanlığı meali ikinci meal olarak ayrıca gösterilir.</p>' +
    '</div>';
    app.innerHTML = html;
  }
  function menuRow(href, name, desc) {
    return '<a class="card menu-item" href="' + href + '">' +
      '<div><div class="menu-name">' + esc(name) + '</div><div class="menu-desc">' + esc(desc) + '</div></div>' +
      '<span aria-hidden="true">›</span></a>';
  }

  // ---------- Detail ----------
  var detailTab = "genel";

  function renderDetail(id) {
    var t = byId[id];
    if (!t) {
      app.innerHTML = '<a class="back-link" href="#/atlas">← Atlas\'a dön</a>' +
        '<div class="empty-state">Kayıt bulunamadı: ' + esc(id) + '</div>';
      return;
    }
    detailTab = "genel";
    var html = '';
    html += '<a class="back-link" href="#/atlas">← Atlas\'a dön</a>';
    html += '<div class="detail-header">' +
      '<div class="detail-kicker">' + draftBadge() +
        (t.review_pending ? reviewBadge() : '') +
        '<span class="pill neutral">' + esc(catLabel(t.kategori)) + '</span>' +
      '</div>' +
      '<h1 class="detail-title">' + esc(displayName(t)) + '</h1>' +
      '<div class="detail-id">' + esc(t.id) + '</div>' +
      (t.ust_topluluk_id ? '<div class="detail-parent"><span class="pill subgroup">Alt grup</span> Ana kayıt: <a href="#/topluluk/' + esc(t.ust_topluluk_id) + '">' +
        esc(displayName(byId[t.ust_topluluk_id]) || t.ust_topluluk_isim || t.ust_topluluk_id) + '</a></div>' : '') +
      (t.alt_isimler.length ? '<div class="alt-names">Diğer adlandırmalar: ' +
        t.alt_isimler.map(function (a) { return esc(a.ifade); }).join(', ') + '</div>' : '') +
    '</div>';

    html += '<div class="tabbar" role="tablist">' +
      tabBtn("genel", "Genel Bakış") + tabBtn("ayetler", "Ayetler") +
      tabBtn("olaylar", "Olaylar (" + t.olaylar.length + ")") + tabBtn("sonuc", "Sonuç") +
    '</div>';

    html += '<div class="tab-panel active" data-panel="genel">' + panelGenel(t) + '</div>';
    html += '<div class="tab-panel" data-panel="ayetler">' + panelAyetler(t) + '</div>';
    html += '<div class="tab-panel" data-panel="olaylar">' + panelOlaylar(t) + '</div>';
    html += '<div class="tab-panel" data-panel="sonuc">' + panelSonuc(t) + '</div>';

    html += panelKaynak(t);

    app.innerHTML = html;

    Array.prototype.forEach.call(document.querySelectorAll(".tab-btn"), function (btn) {
      btn.addEventListener("click", function () {
        detailTab = btn.getAttribute("data-tab");
        Array.prototype.forEach.call(document.querySelectorAll(".tab-btn"), function (b) {
          b.classList.toggle("active", b === btn);
        });
        Array.prototype.forEach.call(document.querySelectorAll(".tab-panel"), function (p) {
          p.classList.toggle("active", p.getAttribute("data-panel") === detailTab);
        });
      });
    });
  }

  function tabBtn(key, label) {
    return '<button type="button" class="tab-btn' + (key === "genel" ? " active" : "") +
      '" data-tab="' + key + '" role="tab">' + esc(label) + '</button>';
  }

  function panelGenel(t) {
    var html = '';
    if (t.ozet) html += '<p>' + esc(t.ozet) + '</p>';
    if (t.detay) html += '<p style="color:var(--ink-soft);">' + esc(t.detay) + '</p>';
    if (!t.ozet && !t.detay) html += '<div class="outcome-empty">Atlas veri setinde bu topluluk için özet/detay metni bulunmuyor.</div>';

    html += '<div class="verse-summary">' +
      '<div class="verse-summary-main">' + t.main_verse_count + ' ilgili ayet</div>' +
      '<div class="verse-summary-sub">' + t.direct_count + ' doğrudan · ' + t.context_count + ' olay bağlamı' +
        (t.olaylar.length ? ' · ' + t.olaylar.length + ' olay' : '') + '</div>' +
      '<div class="verse-summary-indirect">Geniş bağlam: ' + t.indirect_count + '</div>' +
    '</div>';

    var kids = childrenOf[t.id] || [];
    if (kids.length) {
      html += '<div class="subgroup-list">' +
        '<div class="subsection-title">İlgili alt gruplar</div>' +
        kids.map(function (k) {
          return '<a class="subgroup-link" href="#/topluluk/' + esc(k.id) + '">' + esc(displayName(k)) + '</a>';
        }).join('') +
      '</div>';
    }
    return html;
  }

  function verseEnrichment(v) {
    var key = v.sure_no + ":" + v.ayet_no;
    return (VERSE_ENRICHMENT.verses && VERSE_ENRICHMENT.verses[key]) || null;
  }

  function verseTranslationHtml(v) {
    var e = verseEnrichment(v);
    var html = '';
    if (!v.meal_tr) {
      html += '<div class="verse-tr-slot" data-field="turkce_anlam">Türkçe meal bulunamadı.</div>';
    } else {
      html += '<div class="verse-translation" data-field="turkce_anlam">' + esc(v.meal_tr) + '</div>' +
        '<div class="verse-translation-source">Meal: ' + esc(v.meal_kaynagi || 'Yaşar Nuri Öztürk') + '</div>';
    }
    if (e && e.diyanet_tr) {
      html += '<div class="verse-translation verse-translation-diyanet" data-field="diyanet_meal">' + esc(e.diyanet_tr) + '</div>' +
        '<div class="verse-translation-source verse-translation-source-diyanet">Meal: ' + esc(e.diyanet_kaynagi || 'Diyanet İşleri Başkanlığı Meali') +
        (e.diyanet_grup ? ' · Ayet grubu ' + esc(e.diyanet_grup) : '') + '</div>';
      if (e.diyanet_grup && e.diyanet_grup.indexOf('-') !== -1) {
        html += '<div class="verse-enrichment-note">Diyanet metni bu ayet grubunu birleşik verir; metin yapay biçimde bölünmemiştir.</div>';
      }
    }
    return html;
  }

  function verseItemHtml(v, clsLabel, extraBadges) {
    return '<div class="verse-item">' +
      '<div class="verse-ref"><span>' + v.sure_no + ':' + v.ayet_no + '</span>' +
      (clsLabel ? '<span class="pill">' + clsLabel + '</span>' : '') +
      (extraBadges || '') + '</div>' +
      '<div class="verse-arabic" lang="ar" dir="rtl">' + esc(v.arapca) + '</div>' +
      verseTranslationHtml(v) +
    '</div>';
  }

  function panelAyetler(t) {
    var html = '';
    html += '<div class="subsection-title">Doğrudan</div>';
    html += t.direct_verses.length
      ? t.direct_verses.map(function (v) { return verseItemHtml(v, null, eventBadgeForVerse(t, v)); }).join('')
      : '<div class="outcome-empty">Atlas veri setinde bu topluluk için doğrudan ayet bağlantısı bulunmuyor.</div>';

    html += '<div class="subsection-title">Olay Bağlamı</div>';
    html += t.context_verses.length
      ? t.context_verses.map(function (v) { return verseItemHtml(v, null, eventBadgeForVerse(t, v)); }).join('')
      : '<div class="outcome-empty">Atlas veri setinde bu topluluk için olay bağlamı ayeti bulunmuyor.</div>';

    html += '<details class="collapse" style="margin-top:16px;">' +
      '<summary>İlgili / Geniş Bağlam (' + t.indirect_verses.length + ')</summary>' +
      '<div class="collapse-body">' +
      '<p class="search-meta" style="margin:0 0 8px;">Bu ayetler ana ayet sayısına dahil edilmez; yalnızca ortak kelime/kök veya geniş bağlam ilişkisi taşır.</p>' +
      (t.indirect_verses.length
        ? t.indirect_verses.map(function (v) { return verseItemHtml(v, null, null); }).join('')
        : '<div class="outcome-empty">Atlas veri setinde bu topluluk için dolaylı/geniş bağlam ayeti bulunmuyor.</div>') +
      '</div></details>';

    if (t.kaynak_baglantilari && t.kaynak_baglantilari.length) {
      html += '<div class="search-meta" style="margin-top:14px;">Sınıflandırma kaynağı: ' +
        t.kaynak_baglantilari.map(esc).join(', ') + '</div>';
    }
    return html;
  }

  function eventBadgeForVerse(t, v) {
    var hit = null;
    (t.olaylar || []).some(function (o) {
      if ((o.verses || []).some(function (ov) { return ov.sure_no === v.sure_no && ov.ayet_no === v.ayet_no; })) {
        hit = o; return true;
      }
      return false;
    });
    if (!hit) return '';
    return '<span class="pill gold">' + esc(hit.id) + '</span>' + (hit.review_pending ? reviewBadge() : '');
  }

  function verseKey(v) {
    return v.sure_no + ":" + v.ayet_no;
  }

  function completeVerse(v) {
    var full = AYETLER[verseKey(v)] || {};
    return {
      sure_no: v.sure_no,
      ayet_no: v.ayet_no,
      arapca: full.arapca || v.arapca || "",
      meal_tr: full.meal_tr || v.meal_tr || "",
      meal_kaynagi: full.meal_kaynagi || v.meal_kaynagi || "Yaşar Nuri Öztürk",
    };
  }

  function uniqueCompleteVerses(verses) {
    var seen = {};
    var out = [];
    (verses || []).forEach(function (v) {
      var key = verseKey(v);
      if (seen[key]) return;
      seen[key] = true;
      out.push(completeVerse(v));
    });
    return out;
  }

  function outcomeEventHtml(o, opts) {
    opts = opts || {};
    var verses = uniqueCompleteVerses(o.verses || []);
    var html = '<div class="outcome-event">';
    html += '<div class="outcome-event-title">• ' + esc(o.baslik) +
      (o.review_pending ? ' <span class="badge-review" style="margin-left:4px;">İnceleme bekliyor</span>' : '') +
      '</div>';
    if (opts.reason && o.ayette_belirtilen_sebep) {
      html += '<div class="event-body"><strong>Ayette belirtilen sebep:</strong> ' +
        esc(o.ayette_belirtilen_sebep) + '</div>';
    }
    if (verses.length) {
      html += '<div class="outcome-verses-title">Tam ayet metni ve meal</div>';
      html += verses.map(function (v) { return verseItemHtml(v, null, null); }).join('');
    } else {
      html += '<div class="outcome-empty">Bu sonuç maddesi için bağlı tam ayet kaydı bulunmuyor.</div>';
    }
    html += '</div>';
    return html;
  }

  function panelOlaylar(t) {
    if (!t.olaylar.length) {
      return '<div class="outcome-empty">Atlas veri setinde bu topluluğa bağlı olay kaydı bulunmuyor.</div>';
    }
    var seen = {};
    var html = '';
    t.olaylar.forEach(function (o) {
      if (seen[o.id]) return;
      seen[o.id] = true;
      html += '<div class="event-item">' +
        '<div class="event-head"><div><div class="event-title">' + esc(o.baslik) + '</div>' +
        '<div class="event-meta">' + esc(o.id) + ' · ' + esc(o.olay_tipi || '') +
        (o.kapsam ? ' · ' + esc(o.kapsam) : '') + '</div></div>' +
        (o.review_pending ? reviewBadge() : '') + '</div>' +
        (o.ozet ? '<div class="event-body">' + esc(o.ozet) + '</div>' : '') +
        (o.review_pending && o.review_gerekce
          ? '<div class="event-body" style="color:var(--warn);">İnceleme gerekçesi: ' + esc(o.review_gerekce) + '</div>' : '') +
        (o.taraflar && o.taraflar.length
          ? '<div class="event-parties">Taraflar: ' + o.taraflar.map(function (p) { return esc(p.ad || p.id); }).join(', ') + '</div>' : '') +
        (o.verses && o.verses.length
          ? '<details class="collapse" style="margin-top:8px;"><summary>Bağlı ayetler (' + o.verses.length + ')</summary>' +
            '<div class="collapse-body">' + o.verses.map(function (v) { return verseItemHtml(v, null, null); }).join('') + '</div></details>'
          : '') +
      '</div>';
    });
    return html;
  }

  function panelSonuc(t) {
    var html = '';
    var any = false;
    html += '<div class="outcome-note">Bu sekmede kısa sınıflandırma metinleriyle birlikte bağlı ayetler tam Arapça metin ve tam Türkçe meal olarak gösterilir.</div>';
    OUTCOME_BUCKETS.forEach(function (b) {
      var matches = t.olaylar.filter(function (o) {
        return o.olay_tipi === b.key || (o.ek_tipler || []).indexOf(b.key) !== -1;
      });
      html += '<div class="outcome-block"><div class="outcome-label">' + esc(b.label) + '</div>';
      if (matches.length) {
        any = true;
        html += matches.map(function (o) { return outcomeEventHtml(o); }).join('');
      } else {
        html += '<div class="outcome-empty">Bu sonuç kategorisinde kayıt yok; bu kayıt Kur\'an\'da geçmiyor anlamına gelmez.</div>';
      }
      html += '</div>';
    });
    var sebepler = t.olaylar.filter(function (o) { return o.ayette_belirtilen_sebep; });
    html += '<div class="outcome-block"><div class="outcome-label">Ayette Belirtilen Sebep</div>';
    if (sebepler.length) {
      any = true;
      html += sebepler.map(function (o) { return outcomeEventHtml(o, { reason: true }); }).join('');
    } else {
      html += '<div class="outcome-empty">Bu sonuç kategorisinde kayıt yok; bu kayıt Kur\'an\'da geçmiyor anlamına gelmez.</div>';
    }
    html += '</div>';
    return html;
  }

  function panelKaynak(t) {
    return '<details class="collapse" style="margin-top:20px;">' +
      '<summary>Kaynak ve veri</summary>' +
      '<div class="collapse-body source-panel-body">' +
      '<dl>' +
        '<dt>Kaynak kayıt adı</dt><dd>' + esc(t.isim) + '</dd>' +
        '<dt>Topluluk ID</dt><dd>' + esc(t.id) + '</dd>' +
        '<dt>Bağlı olay ID\'leri</dt><dd>' + (t.olaylar.length ? t.olaylar.map(function (o) { return esc(o.id); }).join(', ') : 'yok') + '</dd>' +
        '<dt>Sure:Ayet listesi (Doğrudan)</dt><dd>' + (t.direct_verses.map(function (v) { return v.sure_no + ':' + v.ayet_no; }).join(', ') || 'yok') + '</dd>' +
        '<dt>Sure:Ayet listesi (Olay Bağlamı)</dt><dd>' + (t.context_verses.map(function (v) { return v.sure_no + ':' + v.ayet_no; }).join(', ') || 'yok') + '</dd>' +
        '<dt>Sure:Ayet listesi (Dolaylı)</dt><dd>' + (t.indirect_verses.map(function (v) { return v.sure_no + ':' + v.ayet_no; }).join(', ') || 'yok') + '</dd>' +
        '<dt>Sayaç</dt><dd>Doğrudan ' + t.direct_count + ' · Bağlam ' + t.context_count + ' · Dolaylı ' + t.indirect_count + '</dd>' +
        '<dt>Durum</dt><dd>Çift Tarama Tamamlandı' + (t.review_pending ? ' · İnceleme bekleyen bağlantı var' : '') + '</dd>' +
      '</dl></div></details>';
  }

  // ---------------------------------------------------------------
  // Router
  // ---------------------------------------------------------------
  function renderDualar() {
    // Atlas kapsamında ayrı bir Dualar bölümü yok; eski bağlantılar ana sayfaya döner.
    location.replace("#/");
  }

  function setActiveNav(route) {
    Array.prototype.forEach.call(document.querySelectorAll(".bn-item, .topbar-nav a"), function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === route);
    });
  }

  var siteHeader = document.getElementById("site-header");
  function syncHeaderHeightVar() {
    if (!siteHeader) return;
    document.documentElement.style.setProperty("--header-h", siteHeader.getBoundingClientRect().height + "px");
  }
  syncHeaderHeightVar();
  window.addEventListener("resize", debounce(syncHeaderHeightVar, 150));

  function updateHeaderChrome(view) {
    if (!siteHeader) return;
    siteHeader.classList.toggle("site-header--on-hero", view === "home");
    siteHeader.classList.toggle("site-header--scrolled", view === "home" && window.scrollY > 40);
  }
  window.addEventListener("scroll", function () {
    if (siteHeader && siteHeader.classList.contains("site-header--on-hero")) {
      siteHeader.classList.toggle("site-header--scrolled", window.scrollY > 40);
    }
  }, { passive: true });

  function safeDecode(x) { try { return decodeURIComponent(x); } catch (e) { return x; } }

  function route() {
    var hash = location.hash.replace(/^#\/?/, "");
    var parts = hash.split("/").filter(Boolean);
    var view = parts[0] || "home";
    window.scrollTo(0, 0);
    app.focus();
    updateHeaderChrome(view);
    document.body.classList.toggle('view-inner', !(view === 'home' || !parts.length));

    if (view !== "home" && parts.length && window.AtlasHome3D) {
      // Ana sayfadan ayrılırken 3D sahneyi (varsa) kapat: GPU/bellek sızıntısı olmasın.
      window.AtlasHome3D.teardown();
    }

    if (view === "home" || !parts.length) { setActiveNav("home"); renderHome(); return; }
    if (view === "atlas") { setActiveNav("atlas"); renderAtlas(parts[1] ? safeDecode(parts[1]) : ''); return; }
    if (view === "ara") { setActiveNav("ara"); renderSearch(parts[1] ? safeDecode(parts[1]) : ''); return; }
    if (view === "menu") { setActiveNav("menu"); renderMenu(); return; }
    if (view === "olaylar") { setActiveNav("olaylar"); renderOlaylar(); return; }
    if (view === "dualar") { setActiveNav("dualar"); renderDualar(); return; }
    if (view === "topluluk") { setActiveNav(""); renderDetail(parts[1] || ''); return; }
    setActiveNav("home"); renderHome();
  }

  loadDiyanetMeal();

  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", route);
  if (document.readyState !== "loading") route();
})();
