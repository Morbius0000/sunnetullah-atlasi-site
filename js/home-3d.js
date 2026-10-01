/* Sünnetullah Atlas — home-3d.js (Level 3, Faz 1)
   Ana sayfa hero'su için opsiyonel gerçek 3D/WebGL Kur'an sahnesi.
   Three.js'i YALNIZCA koşullar uygunsa (WebGL destekleniyor, azaltılmış
   hareket kapalı, yeterince geniş ekran) lazy-load eder; aksi halde hiç
   indirmez ve Level 2 2D hero aynen görünür kalır. Bu dosya kendisi
   küçüktür (bundle etkisi yok); ağır three.min.js yalnızca gerçekten
   mount edilecekse çekilir. */
(function () {
  "use strict";

  var THREE_SRC = "js/vendor/three.min.js";
  var MIN_WIDTH = 760; // bu genişliğin altında 3D hiç denenmez (tablet alt sınırı).

  var threeLoadPromise = null;
  var active = null; // şu an mount edilmiş sahnenin dispose() referansı
  var lastArgs = null; // { stage2dEl, stage3dEl, wrapEl } — canlı uygunluk kontrolü için saklanır
  var mountGeneration = 0; // her mount()/teardown()/uygunsuzluk ile artar; bekleyen (pending) yüklemeleri geçersiz kılar
  var mountPending = false; // o anki generation için bekleyen (THREE.js yükleniyor) bir mount var mı

  function supportsWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (c.getContext("webgl") || c.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  }

  // Telefon tespiti: tabletleri telefon SAYMAZ (tablet >=760px ise mevcut
  // davranış korunur). Önce standart userAgentData.mobile denenir (Chromium);
  // bu alan tabletlerde false döner. Yoksa UA string fallback'i kullanılır.
  function isPhoneDevice() {
    if (navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean") {
      return navigator.userAgentData.mobile;
    }
    var ua = navigator.userAgent || "";
    if (/iPad/i.test(ua)) return false; // iPad (modern Safari UA'sı "Macintosh" da dönebilir, ayrıca kontrol edilmez)
    if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return false; // Android tablet UA'sında "Mobile" bulunmaz
    return /iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  }

  function shouldAttempt() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (isPhoneDevice()) return false; // telefon: orientation ne olursa olsun 3D yok
    if (window.innerWidth < MIN_WIDTH) return false;
    if (!supportsWebGL()) return false;
    return true;
  }

  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threeLoadPromise) return threeLoadPromise;
    threeLoadPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = THREE_SRC;
      s.onload = function () {
        if (window.THREE) resolve(window.THREE);
        else reject(new Error("THREE global bulunamadı"));
      };
      s.onerror = function () {
        threeLoadPromise = null;
        reject(new Error("three.min.js yüklenemedi"));
      };
      document.head.appendChild(s);
    });
    return threeLoadPromise;
  }

  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }

  function buildScene(THREE, container, wrapEl) {
    var width = container.clientWidth || 440;
    var height = container.clientHeight || 440;

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(26, width / height, 0.1, 100);
    var baseCamX = 0, baseCamY = 2.85, baseCamZ = 7.4;
    var lookAtY = -0.2;
    camera.position.set(baseCamX, baseCamY, baseCamZ);
    camera.lookAt(0, lookAtY, 0);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = false; // performans: gölge haritası yok
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    // ---- Işıklar: Level 2 cyan/gold dili (kapağın lacivert/altın rengi
    // okunsun diye ambient biraz yükseltildi, nokta ışıklar kısıldı) ----
    var ambient = new THREE.AmbientLight(0x1c3348, 1.3);
    scene.add(ambient);

    var cyanLight = new THREE.PointLight(0x52d9ff, 1.1, 14, 2);
    cyanLight.position.set(-2.1, 2.0, 1.6);
    scene.add(cyanLight);

    var goldLight = new THREE.PointLight(0xd8b16a, 1.3, 14, 2);
    goldLight.position.set(2.0, -0.3, 1.9);
    scene.add(goldLight);

    var rimLight = new THREE.PointLight(0xa9ecff, 1.2, 12, 2);
    rimLight.position.set(0, 1.3, -2.2);
    scene.add(rimLight);

    // ---- Holografik platform (ince halka + zemin camı) — kitabın hemen
    // altında, aynı kare içinde kalacak ölçekte. Faz 2: kitap ana odak
    // noktası olsun diye halka biraz küçültüldü/soluklaştırıldı. ----
    var PLATFORM_Y = -0.62;
    var platformGeo = new THREE.TorusGeometry(0.95, 0.013, 8, 48);
    var platformMat = new THREE.MeshBasicMaterial({ color: 0x52d9ff, transparent: true, opacity: 0 });
    var platform = new THREE.Mesh(platformGeo, platformMat);
    platform.rotation.x = Math.PI / 2;
    platform.position.y = PLATFORM_Y;
    scene.add(platform);

    var platformGlowGeo = new THREE.CircleGeometry(0.88, 48);
    var platformGlowMat = new THREE.MeshBasicMaterial({ color: 0x0f2a3a, transparent: true, opacity: 0.28 });
    var platformGlow = new THREE.Mesh(platformGlowGeo, platformGlowMat);
    platformGlow.rotation.x = -Math.PI / 2;
    platformGlow.position.y = PLATFORM_Y - 0.01;
    scene.add(platformGlow);

    // =====================================================================
    // ---- Kitap grubu (Faz 2 — gerçek kitap menteşesi) ----
    // Gerçek sırt/gutter çizgisi x=0 boyunca VE Z doğrultusunda uzanır
    // (hinge axis = Z ekseni etrafında dönüş, yani rotation.z). Kitap iki
    // "yarım"dan oluşur:
    //   - staticHalf: hiç dönmez (yalnız çok hafif, isteğe bağlı karşı
    //     açı alır), x=[0, halfW] aralığında sabit kalır — açık durumda
    //     SAĞ sayfa.
    //   - movingHalf: üst kapak + kendi sayfa bloğu TEK RİJİT grup olarak
    //     x=0'daki sırt ekseni etrafında döner: kapalı (0°, sabit yarının
    //     ÜSTÜNDE çakışık) -> yarı açık (~90°, dikey) -> açık (~168°,
    //     x=[-halfW,0] aralığına geçmiş) — açık durumda SOL sayfa.
    // Kapalı kitap tek sayfa genişliğinde (halfW); açık kitap bu genişliğin
    // doğal biçimde ~iki katı (yaklaşık TOTAL_W). Okunabilir/uydurma Arapça
    // metin veya harici texture YOK — yalnızca procedural materyal +
    // geometrik (ince altın çerçeve + madalyon) süsleme.
    // =====================================================================
    var REST_Y = 0;
    var START_Y = -2.4;
    var bookGroup = new THREE.Group();
    bookGroup.position.y = START_Y;
    scene.add(bookGroup);

    var TOTAL_W = 1.04, bookD = 1.32;     // açık kitabın toplam genişliği / sayfa derinliği
    var halfW = TOTAL_W / 2;              // kapalı kitabın genişliği = tek sayfa eni
    var coverT = 0.028;                   // kapak kalınlığı (ince, gerçekçi deri kapak)
    var pageT = 0.16;                     // sayfa bloğu kalınlığı (kapaktan belirgin kalın)
    var gutterGap = 0.016;                // sırt/gutter çizgisinde (x=0) ince boşluk
    var pivotY = pageT / 2;               // dönüş ekseninin (ve sırtın) doğal "yığın ortası" yüksekliği

    var coverMat = new THREE.MeshStandardMaterial({
      color: 0x1d4f7a, metalness: 0.1, roughness: 0.55,
      emissive: 0x0e2c48, emissiveIntensity: 0.55,
    });
    var spineMat = new THREE.MeshStandardMaterial({
      color: 0x173f63, metalness: 0.12, roughness: 0.5,
      emissive: 0x0e2c48, emissiveIntensity: 0.55,
    });
    var goldMat = new THREE.MeshStandardMaterial({
      color: 0xcf9f52, metalness: 0.55, roughness: 0.32,
      emissive: 0x2a1d08, emissiveIntensity: 0.45,
    });
    var pageMat = new THREE.MeshStandardMaterial({
      color: 0xede0bd, metalness: 0.02, roughness: 0.88,
      emissive: 0x2a2010, emissiveIntensity: 0.12,
    });

    // İnce altın çerçeve + madalyon (procedural, texture/metin yok).
    // side=+1: kapak KAPALIYKEN kameraya dönük üst yüz (+Y).
    // side=-1: kapak AÇILINCA (sırt ekseni etrafında döndüğü için) kameraya
    // dönük kalan alt yüz. İkisi de eklenir ki kapak hem kapalı hem açık
    // durumda süslemeli görünsün.
    function addGoldOrnament(parent, w, d, side) {
      var margin = 0.065;
      var stripT = 0.018;
      var liftY = side * (coverT / 2 + 0.008);
      var hGeo = new THREE.BoxGeometry(w - margin * 2, stripT, 0.02);
      var vGeo = new THREE.BoxGeometry(0.02, stripT, d - margin * 2);
      var top = new THREE.Mesh(hGeo, goldMat);
      top.position.set(0, liftY, -(d / 2 - margin));
      parent.add(top);
      var bottom = new THREE.Mesh(hGeo, goldMat);
      bottom.position.set(0, liftY, d / 2 - margin);
      parent.add(bottom);
      var left = new THREE.Mesh(vGeo, goldMat);
      left.position.set(-(w / 2 - margin), liftY, 0);
      parent.add(left);
      var right = new THREE.Mesh(vGeo, goldMat);
      right.position.set(w / 2 - margin, liftY, 0);
      parent.add(right);
      // Merkez madalyon: düz sekizgen (octagon) — procedural, metinsiz.
      var medallionGeo = new THREE.CylinderGeometry(0.095, 0.095, stripT, 8);
      var medallion = new THREE.Mesh(medallionGeo, goldMat);
      medallion.position.set(0, liftY, 0);
      parent.add(medallion);
      var medallionRingGeo = new THREE.TorusGeometry(0.145, 0.01, 6, 8);
      var medallionRing = new THREE.Mesh(medallionRingGeo, goldMat);
      medallionRing.rotation.x = Math.PI / 2;
      medallionRing.position.set(0, liftY, 0);
      parent.add(medallionRing);
    }

    // Sırt (spine): yarım silindir, x=0'da Z doğrultusunda uzanır — gerçek
    // menteşe hattı. (CylinderGeometry'nin varsayılan ekseni Y'dir;
    // rotation.x = 90° ile ekseni Z'ye hizalar.)
    var spineRadius = pageT / 2 + coverT * 1.3;
    var spineGeo = new THREE.CylinderGeometry(spineRadius, spineRadius, bookD, 12, 1, false, Math.PI, Math.PI);
    var spine = new THREE.Mesh(spineGeo, spineMat);
    spine.rotation.x = Math.PI / 2;
    spine.rotation.y = Math.PI / 2;
    spine.position.set(0, pivotY, 0);
    bookGroup.add(spine);

    var pageMeshW = halfW - gutterGap;
    var pageGeo = new THREE.BoxGeometry(pageMeshW, pageT, bookD);
    var coverGeo = new THREE.BoxGeometry(pageMeshW, coverT, bookD);

    // ---- Sabit yarı (staticHalf): alt kapak + kendi sayfa bloğu.
    // Dönmez; yalnızca isteğe bağlı çok hafif karşı açı alır (gerçek bir
    // kitabın tam düz durmaması gibi). Açık durumda SAĞ sayfa olur. ----
    var staticHalf = new THREE.Group();
    staticHalf.position.set(0, pivotY, 0);
    bookGroup.add(staticHalf);

    var staticPage = new THREE.Mesh(pageGeo, pageMat);
    staticPage.position.set(halfW / 2, -pivotY, 0);
    staticHalf.add(staticPage);

    var bottomCover = new THREE.Mesh(coverGeo, coverMat);
    bottomCover.position.set(halfW / 2, -pivotY - pageT / 2 - coverT / 2, 0);
    staticHalf.add(bottomCover);

    // ---- Hareketli yarı (movingHalf): üst kapak + kendi sayfa bloğu TEK
    // rijit grup. Kapalı: sabit yarının ÜSTÜNDE çakışık (0°). Açılış: aynı
    // sırt ekseni (rotation.z) etrafında ~168°'ye döner, sabit yarının
    // SOLUNA geçerek SOL sayfayı oluşturur. ----
    var movingHalf = new THREE.Group();
    movingHalf.position.set(0, pivotY, 0);
    bookGroup.add(movingHalf);

    var movingPage = new THREE.Mesh(pageGeo, pageMat);
    movingPage.position.set(halfW / 2, pivotY, 0);
    movingHalf.add(movingPage);

    var topCover = new THREE.Mesh(coverGeo, coverMat);
    topCover.position.set(halfW / 2, pivotY + pageT / 2 + coverT / 2, 0);
    movingHalf.add(topCover);
    addGoldOrnament(topCover, pageMeshW, bookD, 1);  // kapalı durumda görünen üst yüz
    addGoldOrnament(topCover, pageMeshW, bookD, -1); // açık durumda kameraya bakan yüz

    // ---- Faz 3: sinematik cila (post-processing/bloom YOK; yalnızca
    // saydam additive geometri + materyal/ışık yoğunluğu animasyonu) ----
    // Gutter ışığı: sırt çizgisinde (x=0) Z boyunca uzanan 3 katmanlı yumuşak
    // cyan/altın şerit; açılma ilerledikçe belirir, sonra sakin seviyeye iner.
    var glowLayers = [];
    [[0.04, 0xfff1d0, 0.4], [0.1, 0xd8b16a, 0.16], [0.2, 0x52d9ff, 0.07]].forEach(function (c) {
      var m = new THREE.MeshBasicMaterial({
        color: c[1], transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      var g = new THREE.Mesh(new THREE.PlaneGeometry(c[0], bookD * 0.96), m);
      g.rotation.x = -Math.PI / 2;
      g.position.set(0, pivotY * 0.5 + 0.012, 0);
      bookGroup.add(g);
      glowLayers.push({ mat: m, max: c[2] });
    });
    var gutterLight = new THREE.PointLight(0xbff0ff, 0, 3.2, 2);
    gutterLight.position.set(0, 0.55, 0.1);
    bookGroup.add(gutterLight);

    // Çok az holografik partikül (14 nokta), kitabın yanlarında/arkasında.
    var PCOUNT = 14;
    var pPos = new Float32Array(PCOUNT * 3);
    var pSeed = [];
    for (var pi = 0; pi < PCOUNT; pi++) {
      var side = pi % 2 ? 1 : -1;
      var bx = side * (0.45 + Math.random() * 0.45);
      var by = 0.1 + Math.random() * 0.9;
      var bz = -0.2 - Math.random() * 0.7; // kitabın önüne gelmez
      pSeed.push({ x: bx, y: by, z: bz, ph: Math.random() * 6.28 });
      pPos[pi * 3] = bx; pPos[pi * 3 + 1] = by; pPos[pi * 3 + 2] = bz;
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    var pMat = new THREE.PointsMaterial({
      color: 0xa9ecff, size: 0.035, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    var particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    var pageEmissiveIdle = 0.12;
    renderer.render(scene, camera);

    // ---- Zamanlama: yükseliş -> kısa duraklama -> kapak açılışı -> idle.
    // Hareketli yarı tam 180° değil ~168°'ye döner (gerçek bir kitap gibi
    // hafif "V"); sabit yarı isteğe bağlı çok hafif (~-6°) karşı açıya yatar. ----
    var t0 = performance.now();
    var RISE_DELAY = 300, RISE_DUR = 1100;
    var OPEN_DELAY = 1800, OPEN_DUR = 1300; // RISE bitişi (1400) ile OPEN başlangıcı arasında ~400ms sakin duraklama
    var SETTLE = OPEN_DELAY + OPEN_DUR;
    var OPEN_ANGLE = Math.PI * (168 / 180);      // ~168° — hareketli yarı sabit yarının soluna geçer
    var STATIC_COUNTER_ANGLE = -Math.PI * (6 / 180); // ~-6° — sabit yarı çok hafif karşı açıya yatar

    // ---- Çok hafif hover/parallax ----
    var mouseTX = 0, mouseTY = 0, camTX = 0, camTY = 0;
    function onMouseMove(e) {
      var rect = container.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      mouseTX = px * 0.12;
      mouseTY = -py * 0.08;
    }
    function onMouseLeave() { mouseTX = 0; mouseTY = 0; }
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    // Render yalnızca sekme görünürken VE sahne viewport içindeyken çalışır.
    // İki durum ayrı tutulur: biri tek başına değişip diğeri hâlâ olumsuzsa
    // (ör. hero ekran dışındayken sekme tekrar görünür olursa) render
    // YENİDEN BAŞLAMAMALI.
    var tabVisible = !document.hidden;
    var isIntersecting = true; // IntersectionObserver desteklenmiyorsa varsayılan: görünür kabul et
    var running = true;
    var raf = null;

    function desiredRunning() { return tabVisible && isIntersecting; }

    function frame(now) {
      if (!running) return;
      var elapsed = now - t0;

      var riseP = clamp01((elapsed - RISE_DELAY) / RISE_DUR);
      bookGroup.position.y = START_Y + easeOutCubic(riseP) * (REST_Y - START_Y);

      var openP = clamp01((elapsed - OPEN_DELAY) / OPEN_DUR);
      var openEased = easeInOutCubic(openP);
      // Hareketli yarı: kapak+sayfa tek rijit grup olarak sırt (Z) ekseni
      // etrafında döner — kapalı (üst üste) -> dikey (~90°, yarı açık) ->
      // sabit yarının soluna geçmiş (~168°, açık spread).
      movingHalf.rotation.z = openEased * OPEN_ANGLE;
      // Sabit yarı neredeyse hareketsiz kalır; yalnızca çok hafif karşı
      // açıya yatar (gerçek bir kitabın tam düz durmaması gibi).
      staticHalf.rotation.z = openEased * STATIC_COUNTER_ANGLE;
      // Sırt (gutter, x=0) açık kitapta simetrik merkez olduğundan, kapalı
      // kitap (yalnızca x=[0,halfW] kaplar) kendi başına kadrajda sola
      // kaymış görünür. Açılış ilerledikçe bu kaymayı yumuşakça sıfırlayan
      // hafif bir X telafisi uygulanır: kapalıyken kitap merkezde, açık
      // spread'de ise doğal sırt merkezi (x=0) öne çıkar.
      bookGroup.position.x = -(halfW / 2) * (1 - openEased);

      // Faz 3 senkron ışık: open progress ile yükselir, bitince sakin idle'a iner.
      var peak = Math.sin(Math.min(1, openP) * Math.PI);          // 0→1→0 (açılış boyunca tek tepe)
      var settled = clamp01((elapsed - SETTLE) / 1200);           // 0→1 (bittikten sonra)
      var glowK = Math.max(openEased * 0.3, peak * 0.8) * (1 - settled * 0.55);
      for (var gi = 0; gi < glowLayers.length; gi++) glowLayers[gi].mat.opacity = glowLayers[gi].max * glowK;
      gutterLight.intensity = 0.7 * glowK;
      cyanLight.intensity = 1.1 + 0.1 * peak;
      goldLight.intensity = 1.3 + 0.4 * openEased * (1 - settled * 0.5);
      pageMat.emissiveIntensity = pageEmissiveIdle + 0.2 * openEased;   // sayfalar sıcak krem/altın ışık alır
      // Platform: kitap yükselirken belirir; açılışta kısa tek pulse.
      platformMat.opacity = 0.4 * easeOutCubic(riseP) * (1 + 0.35 * peak);
      // Partiküller açılışla belirir, çok yavaş süzülür.
      pMat.opacity = 0.55 * openEased;
      if (openEased > 0.01) {
        var pa = pGeo.attributes.position.array;
        var tt = now / 1000;
        for (var k = 0; k < PCOUNT; k++) {
          var sd = pSeed[k];
          pa[k * 3 + 1] = sd.y + Math.sin(tt * 0.4 + sd.ph) * 0.06;
          pa[k * 3] = sd.x + Math.cos(tt * 0.3 + sd.ph) * 0.03;
        }
        pGeo.attributes.position.needsUpdate = true;
      }

      if (elapsed > SETTLE) {
        var idle = (elapsed - SETTLE) / 1000;
        bookGroup.position.y = REST_Y + Math.sin(idle * 0.9) * 0.025;
        platform.rotation.z = idle * 0.06;
      }

      camTX += (mouseTX - camTX) * 0.06;
      camTY += (mouseTY - camTY) * 0.06;
      camera.position.x = baseCamX + camTX;
      camera.position.y = baseCamY + camTY;
      camera.lookAt(0, lookAtY, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    function pause() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }
    function resume() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }

    function syncRunning() {
      if (desiredRunning()) resume(); else pause();
    }

    function onVisibility() {
      tabVisible = !document.hidden;
      syncRunning();
    }
    document.addEventListener("visibilitychange", onVisibility);

    var io = null;
    if (window.IntersectionObserver) {
      io = new IntersectionObserver(function (entries) {
        var entry = entries[0];
        isIntersecting = !!(entry && entry.isIntersecting);
        syncRunning();
      }, { threshold: 0.05 });
      io.observe(container);
    }

    var resizeTimer = null;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var w = container.clientWidth || width;
        var h = container.clientHeight || height;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }, 120);
    }
    window.addEventListener("resize", onResize);

    function dispose() {
      pause();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      if (io) io.disconnect();
      clearTimeout(resizeTimer);

      scene.traverse(function (obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(function (m) { m.dispose(); });
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      if (wrapEl) wrapEl.classList.remove("mode-3d");
    }

    return { dispose: dispose };
  }

  // Yalnızca o anki 3D sahneyi söker; lastArgs'ı KORUR (ör. koşullar
  // tekrar uygun hale gelirse aynı elemanlara yeniden mount edilebilsin).
  function disposeActive() {
    if (active) {
      active.dispose(); // .mode-3d sınıfını da kaldırır
      active = null;
    }
  }

  // Bekleyen (THREE.js hâlâ yükleniyor) bir mount varsa geçersiz kılar:
  // generation'ı artırır (eski .then() callback'i kendini geçersiz bulur)
  // ve mountPending bayrağını sıfırlar (yeni bir deneme başlatılabilsin).
  function invalidatePending() {
    mountGeneration++;
    mountPending = false;
  }

  // Route değişiminde app.js'nin çağırdığı DIŞA AÇIK teardown: bekleyen
  // mount'u geçersiz kılar, sahneyi söker VE lastArgs'ı temizler (o
  // sayfanın DOM'u artık geçersiz; ana sayfaya dönüldüğünde wireHomeHero()
  // zaten yeni elemanlarla mount() çağıracak).
  function teardown() {
    invalidatePending();
    disposeActive();
    lastArgs = null;
  }

  // Aynı mount generation'ı için aynı anda yalnızca TEK bir bekleyen
  // (pending) yükleme olmasını garanti eder: zaten aktif bir sahne veya
  // bekleyen bir yükleme varsa yeni bir attemptMount no-op'tur.
  function attemptMount(args) {
    if (active || mountPending) return;
    var myGeneration = mountGeneration;
    mountPending = true;
    loadThree()
      .then(function (THREE) {
        // Yükleme tamamlanana kadar yeni bir mount()/teardown()/uygunluk
        // kaybı generation'ı artırmış olabilir — o zaman bu sonuç geçersizdir,
        // sahne OLUŞTURULMAZ (mountPending'e de dokunulmaz; güncel
        // generation'ın kendi durumu zaten ayrı yönetiliyor).
        if (myGeneration !== mountGeneration) return;
        mountPending = false;
        if (lastArgs !== args) return; // ekstra güvenlik: args artık güncel değil
        if (!document.body.contains(args.stage3dEl)) return;
        if (!shouldAttempt()) return;
        if (active) return; // aynı anda başka bir yol zaten mount etmiş olabilir
        active = buildScene(THREE, args.stage3dEl, args.wrapEl);
        args.wrapEl.classList.add("mode-3d");
      })
      .catch(function () {
        // Başarısız yükleme sonrası tekrar deneme mümkün olsun diye yalnızca
        // hâlâ güncel generation'daysak bayrağı sıfırla.
        if (myGeneration === mountGeneration) mountPending = false;
        // Sessizce Level 2 2D fallback'te kal.
      });
  }

  function mount(stage2dEl, stage3dEl, wrapEl) {
    invalidatePending(); // önceki (varsa) bekleyen mount'u geçersiz kıl
    disposeActive();
    if (!stage3dEl || !wrapEl) { lastArgs = null; return; }
    lastArgs = { stage2dEl: stage2dEl, stage3dEl: stage3dEl, wrapEl: wrapEl };
    if (!shouldAttempt()) return;
    attemptMount(lastArgs);
  }

  // ---- Canlı uygunluk takibi: reduced-motion değişir veya viewport/cihaz
  // koşulları artık uymazsa (resize, orientation) aktif sahneyi (veya
  // bekleyen bir mount'u) söker; koşullar tekrar uygun hale gelip hâlâ ana
  // sayfadaysak yeniden mount eder. Her çağrıda en fazla 1 attemptMount
  // tetiklenir (attemptMount zaten active/mountPending ise no-op'tur). ----
  function evaluateEligibility() {
    if (!lastArgs) return;
    if (!document.body.contains(lastArgs.stage3dEl)) { lastArgs = null; return; }
    var eligible = shouldAttempt();
    if (!eligible) {
      if (active || mountPending) {
        invalidatePending();
        disposeActive();
      }
      return;
    }
    if (!active && !mountPending) {
      attemptMount(lastArgs);
    }
  }

  var reducedMotionMql = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  if (reducedMotionMql) {
    if (reducedMotionMql.addEventListener) {
      reducedMotionMql.addEventListener("change", evaluateEligibility);
    } else if (reducedMotionMql.addListener) {
      reducedMotionMql.addListener(evaluateEligibility); // eski Safari
    }
  }

  var eligibilityResizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(eligibilityResizeTimer);
    eligibilityResizeTimer = setTimeout(evaluateEligibility, 150);
  });

  window.AtlasHome3D = { mount: mount, teardown: teardown, shouldAttempt: shouldAttempt };
})();
