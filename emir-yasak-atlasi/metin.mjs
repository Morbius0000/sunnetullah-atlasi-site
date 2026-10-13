// Atlasın yazılı metinleri. Sayılar build.mjs tarafından veriden hesaplanıp {ad} yer tutucularına konur.
export const genel = {
  baslik: 'Emir, Yasak ve Karşılık Atlası',
  altbaslik: 'Kur\'an\'da Allah\'ın emrettikleri, yasakladıkları ve bunların karşılığı: yalnızca Kur\'an metnine dayanan, ayet ayet kaynak gösteren bir çalışma.',
  yontem: [
    'Kaynak yalnızca Kur\'an\'dır. Hadis, rivayet, mezhep görüşü ve tefsir kanıt olarak kullanılmaz.',
    'Arapça metin: Tanzil Uthmani (Hafs), 6236 ayet. Türkçe meal: Yaşar Nuri Öztürk.',
    'Her kayıt, niteliğin geçtiği ayeti ve ödülün söylendiği ayeti ayrı ayrı gösterir. Bunlar aynı ayet de olabilir, aynı pasajda art arda gelen ayetler de.',
    'Kanıt derecesi: ✓ Ayette yazılı (bağ cümlede ya da "işte onlar" gibi bir gönderme ile açıkça kurulur), → Çıkarım (bağ bağlamdan çıkarılır), ? Açık (nitelik ya da bağ metinden belirlenemez).',
  ],
};
export const konu08 = {
  giris: 'Bu bölüm, Kur\'an\'ın cennete, ecre, felaha, mağfirete ya da rahmete bağladığı nitelikleri toplar. "Cennete götüren" ifadesi geniş tutulmuştur: ödül adı cennet olmasa da (ecir, felah, rahmet, mağfiret) Allah\'ın vaat ettiği karşılık sayılmıştır. Yalnız cenneti görmek için "Yalnız cennet" düğmesini kullanın.',
  kisa: [
    'İncelenen ayetlerde ödüle en sık bağlanan nitelik imandır ({iman} ayet). İkinci sırada salih amel gelir ({salih} ayet). İkisi {imanSalih} ayette aynı cümlede birlikte geçer.',
    'Bunları takva ({takva} ayet), namaz ({namaz}), infak ({infak}), sabır ({sabir}) ve ihsan ({ihsan}) izler.',
    'Kur\'an bazı dayanakları açıkça geçersiz sayar: soy ya da grup aidiyeti (Bakara 111-112, Mâide 18), kuruntu (Nisâ 123, Meâric 38), mal ve evlat (Sebe\' 37). Allah\'a ortak koşana cennetin haram kılındığı da açıkça söylenir (Mâide 72).',
    'Bazı ayetler nitelik vermeden yalnız sonucu adlandırır: mizanı ağır basan, kitabı sağından verilen, "mutluluğa erdirilenler". Bunlar "Sonuç tanımları" başlığında ayrıca gösterilmiştir.',
  ],
  kapsam: [
    'Hedef ayetler: ödülü adlandıran {hedef} ayet. Kullanılan Arapça işaretler: cennet ve çoğulu, firdevs, adn, rıdvân, fevz, gurfe, derecât, hüsnâ, me\'vâ, naîm, illiyyûn, zülfâ, tûbâ, felah kalıpları, idhâl ("sokar/girin"), ecir, ecr, sevap, mağfiret, rahmet, büşrâ.',
    'Her hedef ayet, önceki 4 ve sonraki 3 ayetle birlikte okundu: {blok} pasaj, {okunan} ayet. Nitelikleri daha önce başlayan uzun pasajlar (Furkân 63-76, Meâric 19-35, İnsân 5-22, Zâriyât 15-19) ayrıca tam okundu.',
    'Hedef listesinde olmayan, sonradan eklenen pasajlar: Beled 11-18, Leyl 5-7 ve 17-21, Kâria 6-7, Asr 1-3, Mü\'minûn 57-61, İnsân 22. Bunların kayıtları "Ek okuma" etiketiyle gösterilir.',
    'İkinci kontrol: her kayıtta niteliğin Arapça kökü nitelik ayetinde aranır. Kökü bulunmayan kayıtlar tek tek yeniden okundu. İkisi "→ Çıkarım" derecesine indirildi: sınanmaya katlanmayı sabır sayan Bakara 214 ve "tayyib" kelimesini iffet olarak okuyan Nûr 26.',
    'Bilinen sınırlar: kıssalardaki dünyevî kurtuluşlar ayrı ödül türüyle işaretlendi ama ahiret ödülüyle karıştırılmadı. Kelime bazlı taramanın kaçırdığı ayet olabilir. Örnekleme tahminine göre ilgili ayetlerin yaklaşık yüzde 3-5\'i taramanın dışında kalmış olabilir.',
  ],
};
export const konu09 = {
  giris: 'Bu bölüm, Kur\'an\'ın ateşe, azaba, helâke, gazaba ya da kayba bağladığı tutum ve davranışları toplar. Karşılık yalnız cehennem değildir: dünyada gelen helâk ve cezalar, mühür vurulması, amellerin boşa çıkması gibi karşılıklar da dahildir ve türüyle işaretlenmiştir. Yalnız ateşe bağlananları görmek için "Yalnız cehennem/ateş" düğmesini kullanın. Bu sayfa Kur\'an\'ın ne söylediğini gösterir; kimsenin âkıbeti hakkında hüküm vermez.',
  kisa: [
    'Karşılığa en sık bağlanan tutum küfür ve inkârdır ({kufur} ayet). Ardından ayetleri ve resulleri yalanlamak gelir ({yalan} ayet). Zulüm ({zulum}), şirk ({sirk}), ayetlerden yüz çevirme ({yuz}) ve kibir ({kibir}) bunları izler.',
    'Bazı ayetler davranışı adlandırmadan yalnızca "günah", "kötülük", "fısk" gibi genel adlarla karşılığı bağlar ({genel} ayet). Bunlar "Davranışı adlandırılmayanlar" başlığında ayrı gösterilir.',
    'Davranışı içeren {nar} ayette karşılık açıkça ateş ya da cehennemdir. Kalanlar azap, helâk, gazap, lanet, mühür, amellerin boşa gitmesi gibi başka karşılıklara bağlanır.',
    'Bir davranış birden çok başlığa girebilir (örneğin hem yalanlama hem kibir). Böyle bir ayet her başlıkta ayrı sayılır; başlıkların ayet sayıları toplanıp tek bir toplam gibi okunmamalıdır.',
  ],
  kapsam: [
    'Hedef ayetler: karşılık bildiren {hedef} ayet. Kullanılan Arapça işaretler: nâr, cehennem ve adları (sakar, saîr, cahîm, hutame, hâviye, siccîn), azap ve ıkâb, ceza kalıpları, yakılma, zakkûm, gislîn, hamîm, hızy, hüsran, helâk, bi\'se. Gazap, lanet ve mühür gibi karşılıklar bu listede yoktur; bunlar yalnızca bağlam okumasında rastlandıkça kayda alındı, bu yüzden bu türde eksik kalmış olabilir.',
    'Her hedef ayet, önceki 4 ve sonraki 3 ayetle birlikte okundu: {blok} pasaj, {okunan} ayet. Bunlara ek olarak, güçlü işaretleri bulunmadığı için bu pasajların dışında kalan 70 zayıf işaretli ayet ayrıca okundu.',
    'İkinci kontrol: her kayıtta davranışın Arapça kökü davranış ayetinde (gerekirse bir önceki ya da sonraki ayette) mekanik olarak arandı. Bulunamayanlar tek tek yeniden okundu; birkaç kaydın başlığı düzeltildi, dört kayıt "→ Çıkarım" derecesine indirildi (Tevbe 95, Hicr 31, Tâhâ 96, Kamer 44). Karşılık ayetinde sözcük listesine girmeyen ifadeler (ör. "yakaladık", "kökünü kestik") elle okunarak doğrulandı.',
    'Hedef listesinde olup hiçbir kayda girmeyen ayetler gözden geçirildi: çoğu karşılığı anlatan ama davranışı söylemeyen ya da dua ve kıssa anlatısı olan ayetlerdir. Bu geçişte iki eksik bulunup eklendi (Şuarâ 156, Haşr 11-15).',
    'Bilinen sınırlar: Kur\'an bazen davranışı hiç adlandırmaz; bu durumda kayıt genel başlıkta ya da "? Açık" derecesiyle durur. Dünyadaki helâk ile âhiret karşılığı ayrı türlerle işaretlendi, ama bir ayet bazen ikisini birden anar. Kelime bazlı tarama bir ayeti kaçırmış olabilir. Tövbe, bağışlanma ve "dilerse" ifadeleri ayrı bir konuya (Konu 10) bırakılmıştır; burada bir davranışa bağlanan karşılık kesin ve genel bir hüküm olarak okunmamalıdır.',
  ],
};

export const konu01 = {
  giris: 'Bu bölüm, Kur\'an\'ın en temel buyruklarını toplar: yalnız Allah\'a kulluk, adalet ve ihsan, ahde ve yemine vefa, emanete sahip çıkmak ve doğruluk. Her kaydın türü işaretlidir: Emir (doğrudan buyruk), Yasak (doğrudan nehiy), Sonuç (davranış ve karşılığı birlikte) ve Tanım (bir davranışın övgüyle ya da kınamayla anlatılması, emir olarak verilmesi ya da bir elçinin kavmine söylemesi). Bu sayfa Kur\'an\'ın ne söylediğini gösterir; kimsenin âkıbeti hakkında hüküm vermez.',
  kisa: [
    'Doğrudan emir olarak yazılanlar {emir} ayettedir; doğrudan yasak olarak yazılanlar {yasak} ayettedir. Başlıca emir: "Allah\'a kulluk edin, O\'na hiçbir şeyi ortak koşmayın" (Nisâ 36); adalet ve ihsan emri Nahl 90\'dadır; emanetlerin ehline verilmesi ve adaletle hükmedilmesi Nisâ 58\'dedir; ahde vefa Mâide 1, En\'âm 152 ve İsrâ 34\'tedir.',
    'Kulluk başlığı {kulluk} ayette, adalet ve ihsan başlıkları {adalet} ayette, söz, emanet ve doğruluk başlıkları {soz} ayette işlenir. Resullerin kavmine ilk sözü olarak aktarılan "Allah\'a kulluk edin" cümlesi Nûh, Hûd, Sâlih ve Şuayb anlatılarında ayrı ayrı kayıtlıdır.',
    'Ayette karşılığı da bildirilen kayıtlar {karsilikli} ayettedir. Ayet karşılık yazmıyorsa bu sayfa da karşılık yazmaz; örneğin güzel davrananların ödülünün yitirilmeyeceği (Hûd 115, Yûsuf 90), adil davrananların sevildiği (Hucurât 9, Mümtehine 8) ve ahdi bozanlara lanet olduğu (Ra\'d 25) bildirilir.',
    'Bu bölüm Konu 8 (cennete götüren nitelikler) ile, Konu 5 (ölçü-tartı, yetim malı), Konu 6 (israf, söz edebi) ve Konu 2 (anne-baba ve akrabaya iyilik) ile kısmen örtüşür. Sayılar toplanıp tek bir toplam gibi okunmamalıdır.',
  ],
  kapsam: [
    'Hedef ayetler: Arapça metinde şu kalıplar arandı: abd (kulluk/ibadet), adl ve kıst (adalet), ihsan ve muhsin, ahd, vefâ ve ikfâ, emâne, sıdk (doğruluk). Tarama {hedef} ayet verdi.',
    'Hedef ayetler önceki ve sonraki ayetlerle birlikte bloklar halinde okundu ({blok} pasaj, {okunan} ayet). Okumadan sonra kök kontrolü bütün Kur\'an\'da ayrıca yapıldı; bu kontrol "Allah\'a kulluk edin" cümlesi geçen ve ilk okumada kayda geçmeyen ayetleri ortaya çıkardı, bunlar eklendi. Hedef listesinde olup hiçbir kayda girmeyen ayetler gözden geçirildi; çoğu kök olarak geçen ama konuyla ilgisiz ya da yalnızca kıssa anlatan ayetlerdir.',
    'İkinci kontrol: her kayıtta davranışın Arapça kökü davranış ayetinde (gerekirse yanındaki ayette) mekanik olarak arandı; kökü ahd olmayan üç kayıt (Bakara 63 ve Mâide 7: mîsâk; Muhammed 21: sıdk) "verilen söz" anlamıyla elle doğrulandı.',
    'Kapsam dışı bırakılanlar: ölçü ve tartıda hile (Konu 5), anne-baba, akraba, yetim ve komşuya iyilik (Konu 2), infak ve zekât (Konu 3), şükür ve sabır emirleri (Konu 8). "İhsan" kaydı yalnızca güzel davranma ve güzel davrananların karşılığını içerir.',
    'Bilinen sınırlar: Kur\'an\'da "ibadet" kelimesi yalnız Allah\'a değil, tapılan başka şeylere de kullanılır; bu sayfa yalnız Allah\'a kulluk emrini, başkasına kulluğun yasağını ve bu kulluğa dair tanım kayıtlarını verir. Yanlış anlaşılmasın diye tanım kayıtlarının türü ayrıca işaretlidir.',
  ],
};

export const konu04 = {
  giris: 'Bu bölüm, Allah\'a ortak koşmak ve ayetleri yalanlamak hakkında Kur\'an\'ın doğrudan emirlerini ve yasaklarını, bu iki tutumun ayette nasıl adlandırıldığını ve ayetin kendisinde bildirilen karşılıkları toplar. Her kaydın türü işaretlidir: Yasak (doğrudan nehiy), Emir (doğrudan buyruk), Sonuç (tutum ile karşılığı ya da kınama aynı yerde) ve Tanım (tutumun nasıl adlandırıldığı ya da tarif edildiği). Bu sayfa Kur\'an\'ın ne söylediğini gösterir; kimsenin âkıbeti hakkında hüküm vermez.',
  kisa: [
    'Doğrudan yasak olarak yazılanlar {yasak} ayettedir: Allah\'a ortak koşmama, O\'ndan başkasına kulluk etmeme ve yakarmama, iki ilah edinmeme, Şeytana kulluk etmeme gibi. Doğrudan emir olarak yazılanlar {emir} ayettedir; bunların büyük kısmı resullerin kavimlerine ortak çağrısıdır: "Allah\'a kulluk edin, sizin O\'ndan başka ilahınız yok."',
    'Şirk başlığı {sirk} ayette, Allah\'a çocuk, kız ya da üçleme isnadı {cocuk} ayette, ayetleri ve resulleri yalanlamak {yalan} ayette işlenir. Ayette karşılığı da bildirilen kayıtlar {karsilikli} ayettedir; kalanlar yalnızca emir, yasak ya da tarif verir ve karşılık söylemez.',
    'Şirkin ayette yazılı karşılıkları şunlardır: ateş ve azap, amellerin boşa çıkması, Allah\'ın mağfiret etmemesi, cennetin haram kılınması, kıyamette ortakların yardım edememesi. Her biri yalnızca kendi ayetinde söylendiği kadarıyla kaydedildi.',
    'Ayetleri yalanlamanın karşılıkları Konu 9\'da çok daha geniş bir kayıtla verilir ({konu9_yalan} ayet). Bu bölümde ise yalanlamanın hangi ayetlerde bu adla ve şirkle birlikte geçtiği, ona karşı yasak ve karşılık gösterilir. İki bölümün sayıları toplanmamalıdır.',
  ],
  kapsam: [
    'Hedef ayetler: şirk ve ortak koşma kökleri (şirk, şerîk, müşrik), "ilah/kulluk/yakarma" ile birlikte olumsuz emir kalıpları (lâ + tec\'al, ted\'u, ta\'bud, tettehiz ve benzerleri), ayetleri yalanlama kalıpları. Tarama {hedef} ayet verdi.',
    'Bu ayetlerin 223\'ü önceki 1 ve sonraki 2 ayetle birlikte bloklar halinde okundu ({blok} pasaj, {okunan} ayet). Kalan 149 ayet tek tek, meâlleri ve bir sonraki ayetle okundu. Hedef listesinde olup hiçbir kayda girmeyen 214 ayetin hepsi ayrıca gözden geçirildi; çoğu miras, evlilik, savaş, kıssa ya da başka konudaki ayetlerdir ve bu bölüme alınmadı.',
    'İkinci kontrol: her kayıtta tutumun Arapça kökü (şirk, ilah, kulluk, yakarma, yalanlama vb.) davranış ayetinde, gerekirse yanındaki ayette mekanik olarak arandı. Eksik çıkan yoktu; iki kayıtta kök yalnızca komşu ayette bulundu. Dört kayıt "→ Çıkarım" derecesinde bırakıldı (Kehf 42, Rûm 42, Nahl 35, En\'âm 64).',
    'Kapsam dışı bırakılanlar: müşriklerle ilişkiyi düzenleyen hükümler (müşrik kadınla evlilik, ahit ve savaş hükümleri, Mescid-i Haram\'a yaklaşma) ve Ehlikitap\'a yönelik hükümler. Bunlar şirkin tanımını değil, toplumsal hükmü anlatır ve ayrı bir konuya aittir. Küfür ve nankörlüğün genel karşılıkları da burada değil Konu 9\'dadır.',
    'Bilinen sınırlar: Kur\'an çoğu zaman ilahlık isnadını, çocuk edinmeyi ve yakarmayı aynı cümlede anar; bu yüzden bazı ayetler birden çok başlıkta sayılabilir ve başlıkların ayet sayıları toplanıp tek toplam gibi okunmamalıdır. Tövbe ve bağışlanma ayrı bir konuya (Konu 10) bırakıldı. Kelime ve kalıp bazlı tarama bir ayeti kaçırmış olabilir.',
  ],
};

export const konu05 = {
  giris: 'Bu bölüm, Kur\'an\'ın can, namus ve mal konusundaki doğrudan emirlerini ve yasaklarını, bunlara bağladığı karşılıkları ve davranışın ayette nasıl adlandırıldığını toplar. Her kaydın türü işaretlidir: Yasak (doğrudan nehiy), Emir (doğrudan buyruk ya da ceza hükmü), Sonuç (davranış ve karşılığı birlikte) ve Tanım (davranışın nasıl adlandırıldığı ya da tarif edildiği). Bu sayfa Kur\'an\'ın ne söylediğini gösterir; kimsenin âkıbeti hakkında hüküm vermez.',
  kisa: [
    'Doğrudan yasak olarak yazılanlar {yasak} ayettedir; doğrudan emir ya da ceza hükmü olarak yazılanlar {emir} ayettedir. Başlıca yasaklar: haksız yere can almamak, çocukları öldürmemek, zinaya yaklaşmamak, fevâhişten uzak durmak, yetimin malına yaklaşmamak, ribâ yememek, mallarını bâtıl yolla yememek ve ölçüde tartıda hile yapmamak.',
    'Can başlığı {can} ayette, namus başlığı {namus} ayette, mal başlığı {mal} ayette işlenir. Ayet sayısı en yüksek başlıklar: fahşâ ve fevâhiş ({fahsa}), haksız öldürme ({oldurme}) ve ölçü ile tartı ({olcu}).',
    'Ayette karşılığı da bildirilen kayıtlar {karsilikli} ayettedir; bunların {nar} ayetinde karşılık açıkça ateştir. Ayette hükmün yanında cezası da yazılan davranışlar: hırsızlık (el kesme), zina (yüz celde), iffetli kadına iftira (seksen celde) ve kısas. Ayet karşılık yazmıyorsa bu sayfa da karşılık yazmaz.',
    'Bu bölüm Konu 9 ile ve Konu 4 ile kısmen örtüşür (ör. Furkân 68 hem ortak koşmayı, hem öldürmeyi, hem zinayı birlikte sayar). Sayılar toplanıp tek bir toplam gibi okunmamalıdır.',
  ],
  kapsam: [
    'Hedef ayetler: Arapça metinde şu kalıplar arandı: katl ve türevleri (olumsuz emir kalıpları, nefs, nebî, evlât ile birlikte geçenler), kısas ve diyet, vead, zinâ, fahşâ ve fevâhiş, kazf (rem\'y ve muhsanât), sirka, ribâ, yetim ile mâl, mâl ile bâtıl ve ekl, kîl, mîzân, tatfîf, buhs, gulûl, rüşvet (idlâ), suht ve kenz. Tarama {hedef} ayet verdi.',
    'Hedef ayetlerin 172\'si önceki 1 ve sonraki 2 ayetle birlikte bloklar halinde okundu ({blok} pasaj, {okunan} ayet). Sonradan bulunan 4 ayet (A\'râf 33, Nahl 59, Şûrâ 37, Necm 32) ve fark edilen birkaç ek ayet (Mü\'minûn 5, Nûr 30-31, Meâric 29, Fecr 17-20) ayrıca okundu. Hedef listesinde olup hiçbir kayda girmeyen 97 ayet gözden geçirildi; çoğu savaş, kıssa, yemek hükmü, evlilik ya da başka konudaki ayetlerdir.',
    'İkinci kontrol: her kayıtta davranışın Arapça kökü davranış ayetinde (gerekirse yanındaki ayette) mekanik olarak arandı; eksik çıkan yoktu. Kontrolün işaret ettiği Şuayb kıssası kayıtları (A\'râf 85, Hûd 85, Şuarâ 183) "insanların eşyasını eksik göstermeyin" (tebhasû) sözünü içerdiği için bâtıl mal yeme başlığından ölçü ve tartı başlığına alındı.',
    'Kapsam dışı bırakılanlar: savaş ve çarpışma hükümleri (kıtâl), savaş ve bozgunculukla ilgili ceza ayeti (Mâide 33), yeme-içme ve evlilikte haram kılınanlar (Konu 7), israf ve cimrilik (Konu 6), hayız ve itikâfta cinsel temas hükümleri, Yûsuf kıssasındaki hırsızlık anlatısı ve Hızır kıssasındaki öldürme olayı.',
    'Bilinen sınırlar: Bakara 188, Nisâ 29 gibi ayetlerde "mallarınızı aranızda bâtıl yolla yemeyin" ifadesindeki malın kime ait olduğu (kendi malınız ya da birbirinizin mallarınız) lafızdan kesin ayrılmaz. Nisâ 29\'daki "lâ taktulû enfüsekum" kendinizi ya da birbirinizi öldürmeyin anlamına gelebilir; sayfadaki Yaşar Nuri meali bunu "kendi canlarınıza kıymayın" ve 30. ayette "intihar" diye vermiştir, Arapça lafız bunu tek anlamlı yapmaz. Nisâ 15\'teki "el-fâhişe" lafzı için meal yorumlu bir karşılık kullanır; kayıt Arapça lafza dayanır. Tövbe ve bağışlanma ayrı bir konuya (Konu 10) bırakıldı.',
  ],
};

export const konu06 = {
  giris: 'Bu bölüm, Kur\'an\'ın söz ve davranış yasaklarını (yalan ve iftira, alay ve çekiştirme, kibir ve övünme, israf) ve söz edebine dair emirleri toplar. Her kaydın türü işaretlidir: Yasak (doğrudan nehiy), Emir (doğrudan buyruk), Sonuç (davranış ve karşılığı birlikte) ve Tanım (davranışın nasıl adlandırıldığı ya da kimlerin nitelendiği). Bu sayfa Kur\'an\'ın ne söylediğini gösterir; kimsenin âkıbeti hakkında hüküm vermez.',
  kisa: [
    'Doğrudan yasak olarak yazılanlar {yasak} ayettedir; doğrudan emir olarak yazılanlar {emir} ayettedir. Başlıca yasaklar: Allah\'a iftira etmemek ve bilmediğini Allah hakkında söylememek, tanıklığı gizlememek, alay etmemek, lakap takmamak, gıybet etmemek, kötü zan ve casusluktan sakınmak, kasılıp yürümemek, şımarmamak ve israf etmemek.',
    'Başlıklar: yalan ve iftira {yalan} ayette, alay ve çekiştirme {alay} ayette, kibir ve övünme {kibir} ayette, israf {israf} ayette, söz ve ses edebi {soz} ayette işlenir.',
    'Ayette karşılığı da bildirilen kayıtlar {karsilikli} ayettedir; bunların {nar} ayetinde karşılık açıkça ateştir. "Allah sevmez" ifadesi (sevilmeme) {sevilmeme} ayette ayrı bir karşılık olarak yazıldı: böbürlenenler, şımaranlar, israf edenler. Ayet karşılık yazmıyorsa bu sayfa da karşılık yazmaz.',
    'Bu bölüm Konu 9 ile (yalanlama, iftira, kibir, alay) ve Konu 5 ile (kazf, fahşâ) kısmen örtüşür. Sayılar toplanıp tek bir toplam gibi okunmamalıdır.',
  ],
  kapsam: [
    'Hedef ayetler: Arapça metinde şu kalıplar arandı: zûr, ifk ve iftirâ, buht, lemz ve hemz, tenâbüz, sühriye ve istihzâ, gıybet, tecessüs, kibir ve kasılıp yürümek (merah, tasa\'ur, ihtiyâl, fahr), isrâf ve tebzîr, ayrıca "demeyin", "söylemeyin", "yükseltmeyin", "sesinizi", "zandan sakının" gibi söz yasağı kalıpları. Tarama {hedef} ayet verdi.',
    'Hedef ayetler önceki 1 ve sonraki 2 ayetle birlikte bloklar halinde okundu ({blok} pasaj, {okunan} ayet). İkinci kontrolde Arapça kök (isrâf, sühriye, lağv) bütün Kur\'an\'da ayrıca arandı; bu kontrol Furkân 67, Şuarâ 151, Mâide 57 ve alay sonucunu bildiren birkaç ayeti ortaya çıkardı, bunlar okunup eklendi. Hedef listesinde olup hiçbir kayda girmeyen 55 ayet gözden geçirildi; çoğu kıssa, şirk ya da Kur\'an\'a "uydurdu" denmesi ile ilgili ayetlerdir.',
    'Üçüncü kontrol: her kayıtta davranışın Arapça kökü davranış ayetinde (gerekirse yanındaki ayette) mekanik olarak arandı; eksik çıkan yoktu.',
    'Kapsam dışı bırakılanlar: kâfirlerin Kur\'an\'a ya da peygambere "uydurdu", "şair" demesi (Konu 9), cimrilik ve infak (Konu 3), emanete hıyanet (Konu 5), yeme-içme ve evlilikte haram kılınanlar (Konu 7), kıssalarda "müsrif" kelimesinin geçtiği Lût, Firavun ve Yâsîn kavmi ayetleri (kelime orada haddi aşma anlamındadır).',
    'Bilinen sınırlar: "el-müsrifîn" kelimesi bazı ayetlerde mal savurganlığını, bazılarında genel olarak haddi aşmayı anlatır. Şuarâ 151, Tâhâ 127 ve Mü\'min 43 bu yüzden → (çıkarım) olarak işaretlendi. Allah\'a iftira, yalanlama ve şirk ile iç içe geçtiği için Konu 4 ile de örtüşür. Gıybet tek bir ayette (Hucurât 12) ayrıca adlandırılır; bu sayfada diğer çekiştirme ayetleri "alay ve çekiştirme" başlığındadır. Tövbe ve bağışlanma ayrı bir konuya (Konu 10) bırakıldı.',
  ],
};

export const konu07 = {
  giris: 'Bu bölüm, Kur\'an\'ın yiyecek-içecek ve evlilik konusunda helal ve haram kıldığı şeyleri, helal ve temiz yemeye dair emirleri, evlilikte yasakları ve Allah\'ın izni olmadan helal-haram koymanın yasağını toplar. Her kaydın türü işaretlidir: Yasak (doğrudan nehiy ya da haram kılma), Emir (doğrudan buyruk ya da izin), Sonuç (davranış ve karşılığı birlikte) ve Tanım (hükmün kapsamı, gerekçesi ya da tarihî anlatısı). Bu sayfa Kur\'an\'ın ne söylediğini gösterir; kimsenin âkıbeti hakkında hüküm vermez.',
  kisa: [
    'Doğrudan yasak olarak yazılanlar {yasak} ayettedir; doğrudan emir olarak yazılanlar {emir} ayettedir. Yiyecekte açıkça haram kılınanlar: leş (ölü hayvan), akıtılmış kan, domuz eti, Allah\'tan başkası adına kesilen ve Allah\'ın adı anılmayan hayvan; ayrıca şarap/uyuşturucu ve kumar için "uzak durun" buyruğu vardır. İhramlıyken kara avı yasaktır, deniz avı helaldir.',
    'Yiyecek ve içecek başlığı {yiyecek} ayette, evlilik başlığı {evlilik} ayette, haram kılma yetkisi başlığı {haram} ayette işlenir. Evlilikte haram kılınanlar Nisâ 22-24\'te sayılır; müşriklerle evlilik (Bakara 221), zina eden ile nikâh (Nûr 3) ve mümin kadın ile kâfir erkek (Mümtehine 10) ayrıca yasaklanır.',
    'Ayette karşılığı da bildirilen kayıtlar {karsilikli} ayettedir. Başlıca karşılık, Allah\'ın izni olmadan "şu helaldir, şu haramdır" diyenlerin Allah\'a iftira etmiş sayılmasıdır (Nahl 116-117, En\'âm 138-140). Ayet karşılık yazmıyorsa bu sayfa da karşılık yazmaz.',
    'Bu bölüm Konu 6 ile (Allah\'a iftira), Konu 5 ile (ribâ, yetim malı) ve Konu 4 ile (şirk) kısmen örtüşür. Sayılar toplanıp tek bir toplam gibi okunmamalıdır.',
  ],
  kapsam: [
    'Hedef ayetler: Arapça metinde şu kalıplar arandı: hrm (haram kılma ve türevleri), hll (helal kılma ve türevleri), tayyib ve habîs, meyte, dem, hınzîr, ihlâl, munhanika ve mevkûze, nusub ve ezlâm, hamr ve meysir, sayd, nikâh ve muharremât (ümmehât, benât, ahavât, amât, hâlât, rabâib, halâil, muhsanât), bahîre ve sâibe. Tarama {hedef} ayet verdi.',
    'Hedef ayetler önceki ve sonraki 1 ayetle birlikte bloklar halinde okundu ({blok} pasaj, {okunan} ayet). Kök kontrolünde haram, helal, tayyib, habîs ve rics kökleri bütün Kur\'an\'da ayrıca arandı; bu kontrol Bakara 275, Nisâ 19 ve Kasas 12 gibi ayetleri ortaya çıkardı, bunlar eklendi. Hedef listesinde olup hiçbir kayda girmeyen 101 ayet gözden geçirildi; çoğu Mescid-i Harâm, haram aylar, kâfirlerin pisliği gibi başka anlamlarda geçen kelimeler ve infak, yetim, cennet nimetleri ile ilgili ayetlerdir.',
    'İkinci kontrol: her kayıtta davranışın Arapça kökü davranış ayetinde (gerekirse yanındaki ayette) mekanik olarak arandı; eksik çıkan yoktu.',
    'Kapsam dışı bırakılanlar: Mescid-i Harâm, haram aylar ve hac hükümleri (hac ve savaş konuları), cennet halkına ya da kâfirlere "haram kılınan" ahiret nimetleri (A\'râf 50), ribâ ve yetim malı (Konu 5), infakta kötü malı vermeme (Konu 3), müşriklerin "pisliği" gibi mecazî kullanımlar.',
    'Bilinen sınırlar: Bakara 219\'da şarap ve kumar için "büyük günah" denir, doğrudan "haram kıldı" denmez; Mâide 90-91 "uzak durun" buyruğunu ve gerekçesini verir. Nahl 67\'de "sarhoş edici içecek" ile "güzel rızık" birlikte anılır, hüküm yazılmaz. Mâide 5 ve Nisâ 24\'teki bazı şartlar (mehir, iffet, zina etmeme) kayıtta hükmün parçası olarak tutuldu. Peygamber\'e özgü evlilik hükümleri (Ahzâb 50, 52) ayrı işaretlendi. Boşanma ve iddet hükümlerinin tamamı bu sayfada yoktur; yalnız helal, haram ve yasak kalıbıyla yazılanlar alındı.',
  ],
};
