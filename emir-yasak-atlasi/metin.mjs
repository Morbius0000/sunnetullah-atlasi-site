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
