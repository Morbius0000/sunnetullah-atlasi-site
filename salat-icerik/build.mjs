import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const corpusPath = path.join(dir, '../data/quran-uthmani-tanzil-v1.1.txt');
const corpus = fs.readFileSync(corpusPath, 'utf8');
const verses = new Map(corpus.split(/\r?\n/).filter(line => /^\d+\|\d+\|/.test(line)).map(line => {
  const [s, a, text] = line.split('|');
  return [`${s}:${a}`, text];
}));
if (verses.size !== 6236) throw new Error('Kur\'ân metni 6236 ayet olmalı.');
const names = {2:'Bakara',3:'Âl-i İmrân',4:'Nisâ',5:'Mâide',6:'En\'âm',7:'A\'râf',8:'Enfâl',9:'Tevbe',11:'Hûd',17:'İsrâ',19:'Meryem',20:'Tâhâ',22:'Hac',23:'Mü\'minûn',24:'Nûr',29:'Ankebût',33:'Ahzâb',48:'Fetih',62:'Cuma',70:'Meâric',73:'Müzzemmil',96:'Alak',107:'Mâûn'};
const ref = key => `${names[key.split(':')[0]]} ${key.split(':')[1]}`;
const escape = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const link = key => `<a href="#ayet-${key.replace(':','-')}">${escape(ref(key))}</a>`;
const refs = keys => keys.map(link).join(', ');

// Meals are editorial working translations, not quotations from a published translation.
const meals = {
  '2:43': 'Salâtı ikame edin, zekâtı verin ve rükû edenlerle birlikte rükû edin.',
  '2:45': 'Sabır ve salât ile yardım isteyin. Şüphesiz bu, huşû duyanlar dışında ağır gelir.',
  '2:46': 'Onlar, Rableriyle karşılaşacaklarını ve O\'na döneceklerini düşünenlerdir.',
  '2:115': 'Doğu da batı da Allah\'ındır. Nereye yönelirseniz Allah\'ın vechi oradadır. Şüphesiz Allah geniş imkân sahibidir, bilendir.',
  '2:125': 'Hani evi insanlar için bir dönüş yeri ve güven yeri kılmıştık. İbrâhim\'in makamından bir salât yeri edinin. İbrâhim ve İsmâil\'e, "Evimi tavaf edenler, orada kalanlar, rükû ve secde edenler için temiz tutun" diye ahit verdik.',
  '2:142': 'İnsanlardan aklı kıt olanlar, "Onları üzerinde bulundukları kıblelerinden ne çevirdi?" diyecekler. De ki: Doğu da batı da Allah\'ındır. O, dilediğini dosdoğru bir yola iletir.',
  '2:143': 'Böylece sizi orta bir topluluk kıldık ki insanlar üzerine tanıklar olasınız ve elçi de sizin üzerinize tanık olsun. Üzerinde bulunduğun kıbleyi, elçiye uyanı gerisin geri dönenden ayırt etmek için belirledik. Bu, Allah\'ın yol gösterdiği kimseler dışında gerçekten ağırdı. Allah imanınızı boşa çıkaracak değildir. Şüphesiz Allah insanlara çok şefkatli, çok merhametlidir.',
  '2:144': 'Yüzünü göğe çevirip durduğunu görüyoruz. Seni hoşnut olacağın bir kıbleye yönelteceğiz. Yüzünü Mescid-i Harâm yönüne çevir. Nerede olursanız olun yüzlerinizi onun yönüne çevirin. Kendilerine kitap verilenler bunun Rablerinden gelen gerçek olduğunu bilirler. Allah onların yaptıklarından habersiz değildir.',
  '2:145': 'Kendilerine kitap verilenlere her türlü ayeti getirsen de senin kıblene uymazlar. Sen de onların kıblesine uyacak değilsin. Onların bir kısmı da diğerinin kıblesine uymaz. Sana gelen bilgiden sonra onların arzularına uyarsan, o zaman kesinlikle zalimlerden olursun.',
  '2:146': 'Kendilerine kitap verdiklerimiz onu, oğullarını tanıdıkları gibi tanırlar. Onlardan bir topluluk, bile bile gerçeği gizler.',
  '2:147': 'Gerçek, Rabbindendir. Öyleyse kuşku duyanlardan olma.',
  '2:148': 'Herkesin yöneldiği bir yön vardır. Öyleyse hayırlarda yarışın. Nerede olursanız olun Allah sizi bir araya getirecektir. Şüphesiz Allah her şeye güç yetirendir.',
  '2:149': 'Nereden çıkarsan çık yüzünü Mescid-i Harâm yönüne çevir. Şüphesiz bu, Rabbinden gelen gerçektir. Allah yaptıklarınızdan habersiz değildir.',
  '2:150': 'Nereden çıkarsan çık yüzünü Mescid-i Harâm yönüne çevir. Nerede olursanız olun yüzlerinizi onun yönüne çevirin ki, içlerinden zulmedenler dışında insanların size karşı bir gerekçesi olmasın. Onlardan korkmayın, benden korkun. Üzerinizdeki nimetimi tamamlayayım ve yol bulasınız.',
  '2:155': 'Sizi biraz korku, açlık, mallardan, canlardan ve ürünlerden eksiltmeyle mutlaka sınayacağız. Sabredenleri müjdele.',
  '2:156': 'Onlar, kendilerine bir musibet geldiğinde, "Biz Allah\'a aidiz ve O\'na döneceğiz" derler.',
  '2:157': 'İşte onların üzerine Rablerinden salâtlar ve rahmet vardır. İşte onlar yol bulanlardır.',
  '2:238': 'Salâtları ve Salâtü\'l-Vustâ\'yı koruyun; Allah için gönülden boyun eğerek ayakta durun.',
  '2:239': 'Eğer korkarsanız yaya olarak veya binek üzerinde [salâtı yerine getirin]. Güvene kavuştuğunuzda, bilmediğiniz şeyleri size öğrettiği gibi Allah\'ı anın.',
  '3:39': 'O, mihrapta ayakta salât ederken melekler ona seslendiler: Allah sana, Allah\'tan bir kelimeyi doğrulayan, bir önder, hasûr ve iyilerden bir peygamber olan Yahyâ\'yı müjdeliyor.',
  '3:43': 'Ey Meryem! Rabbine gönülden boyun eğ; secde et ve rükû edenlerle birlikte rükû et.',
  '4:43': 'Ey iman edenler! Sarhoşken ne söylediğinizi bilinceye kadar salâta yaklaşmayın; cünüpken de, yol geçicileri olmanız dışında, yıkanıncaya kadar yaklaşmayın. Eğer hasta olur veya yolculukta bulunursanız yahut sizden biri tuvaletten gelirse veya kadınlarla temas etmişseniz ve su bulamazsanız, temiz bir zemine yönelin; yüzlerinizi ve ellerinizi meshedin. Şüphesiz Allah çok affedici, çok bağışlayıcıdır.',
  '4:101': 'Yeryüzünde yolculuğa çıktığınızda, inkâr edenlerin size kötülük etmesinden korkarsanız salâtı kısaltmanızda sizin için bir günah yoktur. Şüphesiz inkâr edenler sizin için apaçık bir düşmandır.',
  '4:102': 'Sen onların içinde olup onlar için salâtı ikame ettiğinde, onlardan bir grup seninle birlikte kalksın ve silahlarını alsınlar. Secde ettiklerinde arkanızda olsunlar. Salât etmemiş diğer grup gelsin; seninle birlikte salât etsinler; tedbirlerini ve silahlarını alsınlar. İnkâr edenler, silahlarınızdan ve eşyalarınızdan habersiz kalmanızı ve üzerinize tek bir hamleyle yüklenmeyi isterler. Yağmurdan bir eziyetiniz varsa veya hasta iseniz silahlarınızı bırakmanızda size günah yoktur; yine de tedbirinizi alın. Şüphesiz Allah inkâr edenler için alçaltıcı bir azap hazırlamıştır.',
  '4:103': 'Salâtı tamamladığınızda ayakta, oturarak ve yanlarınız üzerinde Allah\'ı anın. Güvene kavuştuğunuzda salâtı ikame edin. Şüphesiz salât, müminler üzerine vakitleri belirlenmiş bir yükümlülüktür.',
  '4:142': 'Münafıklar Allah\'ı aldatmaya çalışırlar; O da onları aldatandır. Salâta kalktıklarında üşenerek kalkarlar, insanlara gösteriş yaparlar ve Allah\'ı pek az anarlar.',
  '5:6': 'Ey iman edenler! Salâta kalktığınız zaman yüzlerinizi ve dirseklere kadar ellerinizi yıkayın; başlarınızı meshedin; ayaklarınızı da iki topuğa kadar [yıkayın / meshedin]. Eğer cünüp iseniz arının. Eğer hasta veya yolculukta iseniz yahut sizden biri tuvaletten gelirse veya kadınlarla temas etmişseniz ve su bulamazsanız, temiz bir zemine yönelin; ondan yüzlerinizi ve ellerinizi meshedin. Allah size bir güçlük çıkarmak istemez; fakat sizi arındırmak ve üzerinizdeki nimetini tamamlamak ister; umulur ki şükredersiniz.',
  '5:58': 'Salâta çağırdığınızda onu alay ve oyun konusu edinirler. Bu, onların aklını kullanmayan bir topluluk olmalarındandır.',
  '5:55': 'Sizin veliniz ancak Allah, elçisi ve iman edenlerdir; onlar salâtı ikame eder, zekâtı verir ve rükû ederler.',
  '6:162': 'De ki: Benim salâtım, ibadetim, hayatım ve ölümüm âlemlerin Rabbi Allah içindir.',
  '6:163': 'O\'nun ortağı yoktur. Bununla emrolundum ve ben teslim olanların ilkiyim.',
  '7:31': 'Ey Âdemoğulları! Her mescitte ziynetinizi alın. Yiyin, için; fakat israf etmeyin. Şüphesiz O, israf edenleri sevmez.',
  '8:35': 'Onların evin yanındaki salâtı, mükâ ve tasdiyeden başka bir şey değildi. İnkâr etmekte olduğunuz için azabı tadın.',
  '9:54': 'Harcamalarının onlardan kabul edilmesini engelleyen, Allah\'ı ve elçisini inkâr etmeleri, salâta ancak üşenerek gelmeleri ve ancak istemeye istemeye harcamalarıdır.',
  '9:83': 'Allah seni onlardan bir topluluğun yanına döndürür de onlar [seninle] çıkmak için izin isterlerse de ki: Benimle asla çıkmayacaksınız ve benimle bir düşmana karşı savaşmayacaksınız. Çünkü ilk seferinde oturup kalmaya razı oldunuz. Öyleyse geride kalanlarla birlikte oturun.',
  '9:84': 'Onlardan ölen hiçbirinin üzerine asla salât etme ve kabrinin başında durma. Çünkü onlar Allah\'ı ve elçisini inkâr ettiler ve yoldan çıkmış olarak öldüler.',
  '9:103': 'Onların mallarından, kendilerini arındıracağın ve temizleyeceğin bir sadaka al; üzerlerine salât et. Şüphesiz senin salâtın onlar için huzurdur. Allah işitendir, bilendir.',
  '11:114': 'Gündüzün iki tarafında ve gecenin yakın kesimlerinde salâtı ikame et. Şüphesiz iyilikler kötülükleri giderir. Bu, hatırlayanlar için bir hatırlatmadır.',
  '17:78': 'Güneşin dülûkünden gecenin ğasaqına kadar salâtı ikame et; bir de Kur\'ân\'el-fecr\'i. Şüphesiz Kur\'ân\'el-fecr tanık olunandır.',
  '17:79': 'Gecenin bir bölümünde onunla teheccüd et; senin için ek bir [ibadet] olarak. Umulur ki Rabbin seni övülmüş bir makama yükseltir.',
  '17:110': 'De ki: Allah diye çağırın veya Rahmân diye çağırın; hangisiyle çağırırsanız, en güzel isimler O\'nundur. Salâtında sesini yükseltme, onu kısma da; ikisi arasında bir yol ara.',
  '19:54': 'Kitapta İsmâil\'i de an. O, sözünde doğruydu; bir elçi ve peygamberdi.',
  '19:55': 'Ailesine salâtı ve zekâtı emrederdi; Rabbinin katında hoşnut olunan biriydi.',
  '19:59': 'Onlardan sonra salâtı zayi eden ve arzularına uyan bir nesil geldi. Onlar sapmanın karşılığıyla karşılaşacaklar.',
  '19:60': 'Ancak tövbe eden, iman eden ve iyi iş yapanlar başka; işte onlar cennete girerler ve hiçbir haksızlığa uğratılmazlar.',
  '20:14': 'Şüphesiz ben Allah\'ım. Benden başka ilâh yoktur. Bana kulluk et ve beni anmak için salâtı ikame et.',
  '20:132': 'Ailene salâtı emret ve onda sabırlı ol. Senden rızık istemiyoruz; biz seni rızıklandırıyoruz. Sonuç, sakınma bilinci içindir.',
  '22:26': 'Hani İbrâhim\'e evin yerini belirlemiştik: Bana hiçbir şeyi ortak koşma; evimi tavaf edenler, ayakta duranlar, rükû ve secde edenler için temiz tut.',
  '22:77': 'Ey iman edenler! Rükû edin, secde edin, Rabbinize kulluk edin ve hayır işleyin; umulur ki kurtuluşa erersiniz.',
  '23:1': 'Müminler gerçekten kurtuluşa ermiştir.',
  '23:2': 'Onlar, salâtlarında huşû duyanlardır.',
  '23:3': 'Onlar, boş söz ve işten yüz çevirenlerdir.',
  '23:4': 'Onlar, zekât için çalışanlardır.',
  '23:5': 'Onlar, mahrem yerlerini koruyanlardır.',
  '23:6': 'Eşleri veya sağ ellerinin sahip oldukları dışında; çünkü onlar [bu durumda] kınanmazlar.',
  '23:7': 'Kim bunun ötesini isterse, işte onlar sınırı aşanlardır.',
  '23:8': 'Onlar, emanetlerine ve ahitlerine riayet edenlerdir.',
  '23:9': 'Onlar, salâtlarını koruyanlardır.',
  '23:10': 'İşte onlar mirasçılardır.',
  '23:11': 'Firdevs\'e mirasçı olanlar; onlar orada kalıcıdırlar.',
  '24:36': 'Allah\'ın yükseltilmesine ve içlerinde adının anılmasına izin verdiği evlerde, sabah ve akşam O\'nu tesbîh ederler.',
  '24:37': 'Öyle erkekler ki ne ticaret ne alışveriş onları Allah\'ı anmaktan, salâtı ikame etmekten ve zekât vermekten alıkoyar. Kalplerin ve gözlerin altüst olacağı bir günden korkarlar.',
  '24:58': 'Ey iman edenler! Sağ ellerinizin sahip oldukları ve sizden henüz ergenliğe ulaşmamış olanlar, üç kez sizden izin istesinler: Salâtü\'l-Fecr\'den önce, öğle sıcağında giysilerinizi çıkardığınızda ve Salâtü\'l-İşâ\'dan sonra. Bunlar sizin için üç mahremiyet vaktidir. Bunların dışında size de onlara da bir günah yoktur; birbirinizin yanında dolaşır durursunuz. Allah ayetleri size böyle açıklar. Allah bilendir, hikmet sahibidir.',
  '29:45': 'Kitaptan sana vahyedileni oku ve salâtı ikame et. Şüphesiz salât, hayasızlıktan ve kötülükten alıkoyar. Allah\'ı anmak ise daha büyüktür. Allah yaptıklarınızı bilir.',
  '33:43': 'Sizi karanlıklardan aydınlığa çıkarmak için üzerinize salât eden, O ve melekleridir. O, müminlere karşı merhametlidir.',
  '33:56': 'Şüphesiz Allah ve melekleri peygambere salât ederler. Ey iman edenler! Siz de ona salât edin ve tam bir selâmla selâm verin.',
  '48:29': 'Muhammed Allah\'ın elçisidir. Onunla birlikte olanlar inkâr edenlere karşı çetin, kendi aralarında merhametlidirler. Onları, Allah\'tan lütuf ve hoşnutluk isteyerek rükû ve secde ederken görürsün. Belirtileri yüzlerinde secdenin etkisindendir. Bu, onların Tevrat\'taki tasviridir. İncil\'deki tasvirleri ise filizini çıkarıp onu güçlendiren, sonra kalınlaşarak gövdesi üzerinde duran ve ekicilerin hoşuna giden bir ekin gibidir; onlarla inkâr edenleri öfkelendirmek için. Allah, içlerinden iman eden ve iyi işler yapanlara bağışlanma ve büyük bir ödül vaat etmiştir.',
  '62:9': 'Ey iman edenler! Cuma günü salât için çağrıldığında Allah\'ı anmaya yönelin ve alışverişi bırakın. Eğer bilirseniz bu sizin için daha hayırlıdır.',
  '62:10': 'Salât tamamlandığında yeryüzüne dağılın, Allah\'ın lütfundan arayın ve Allah\'ı çok anın; umulur ki kurtuluşa erersiniz.',
  '62:11': 'Bir ticaret veya eğlence gördüklerinde ona yönelip dağıldılar ve seni ayakta bıraktılar. De ki: Allah\'ın katındaki, eğlenceden de ticaretten de daha hayırlıdır. Allah rızık verenlerin en hayırlısıdır.',
  '70:19': 'Şüphesiz insan çok sabırsız yaratılmıştır.',
  '70:20': 'Kendisine kötülük dokunduğunda sızlanır.',
  '70:21': 'Kendisine iyilik dokunduğunda onu esirger.',
  '70:22': 'Salât edenler dışında.',
  '70:23': 'Onlar, salâtlarını sürdürenlerdir.',
  '70:24': 'Onların mallarında belirli bir hak vardır.',
  '70:25': 'İsteyen ve yoksun kalan için.',
  '70:26': 'Onlar, hesap gününü doğrulayanlardır.',
  '70:27': 'Onlar, Rablerinin azabından kaygı duyanlardır.',
  '70:28': 'Çünkü Rablerinin azabından güvende olunmaz.',
  '70:29': 'Onlar, mahrem yerlerini koruyanlardır.',
  '70:30': 'Eşleri veya sağ ellerinin sahip oldukları dışında; çünkü onlar [bu durumda] kınanmazlar.',
  '70:31': 'Kim bunun ötesini isterse, işte onlar sınırı aşanlardır.',
  '70:32': 'Onlar, emanetlerine ve ahitlerine riayet edenlerdir.',
  '70:33': 'Onlar, tanıklıklarını yerine getirenlerdir.',
  '70:34': 'Onlar, salâtlarını koruyanlardır.',
  '70:35': 'İşte onlar, cennetlerde ağırlanırlar.',
  '73:1': 'Ey örtüsüne bürünen!',
  '73:2': 'Gecenin az bir bölümü dışında kalk.',
  '73:3': 'Yarısını, yahut ondan biraz azalt.',
  '73:4': 'Yahut ona biraz ekle; Kur\'ân\'ı düzenli ve tane tane oku.',
  '73:5': 'Şüphesiz biz sana ağır bir söz bırakacağız.',
  '73:6': 'Şüphesiz gece kalkışı, etki bakımından daha güçlü ve söz bakımından daha düzgündür.',
  '73:7': 'Şüphesiz gündüz senin için uzun bir uğraş vardır.',
  '73:8': 'Rabbinin adını an ve bütün yönelişinle O\'na yönel.',
  '73:20': 'Şüphesiz Rabbin, senin ve beraberindekilerden bir grubun gecenin üçte ikisine yakınını, yarısını ve üçte birini ayakta geçirdiğinizi bilir. Geceyi ve gündüzü Allah ölçüp belirler. Sizin bunu sayıp kuşatamayacağınızı bildi ve size yöneldi. Öyleyse Kur\'ân\'dan kolayınıza geleni okuyun. İçinizden hastalar olacağını, başkalarının Allah\'ın lütfundan aramak üzere yeryüzünde yolculuk edeceğini ve başkalarının Allah yolunda savaşacağını bildi. Öyleyse ondan kolayınıza geleni okuyun; salâtı ikame edin, zekâtı verin ve Allah\'a güzel bir borç verin. Kendiniz için önden gönderdiğiniz her hayrı Allah\'ın katında daha hayırlı ve ödülce daha büyük bulursunuz. Allah\'tan bağışlanma dileyin. Şüphesiz Allah çok bağışlayıcı, çok merhametlidir.',
  '96:9': 'Engelleyeni gördün mü?',
  '96:10': 'Bir kulu, salât ettiği zaman.',
  '96:11': 'Gördün mü, ya o doğru yol üzerindeyse?',
  '96:12': 'Veya sakınmayı emrediyorsa?',
  '96:13': 'Gördün mü, ya o yalanlıyor ve yüz çeviriyorsa?',
  '96:14': 'Allah\'ın gördüğünü bilmedi mi?',
  '96:15': 'Hayır! Vazgeçmezse onu mutlaka perçeminden yakalayıp sürükleyeceğiz.',
  '96:16': 'Yalancı, günahkâr bir perçemden.',
  '96:17': 'Haydi, kendi meclisini çağırsın.',
  '96:18': 'Biz de zebânileri çağıracağız.',
  '96:19': 'Hayır! Ona itaat etme; secde et ve yaklaş.',
  '107:1': 'Dini [hesap ve karşılığı] yalanlayanı gördün mü?',
  '107:2': 'İşte o, yetimi itip kakandır.',
  '107:3': 'Yoksulu doyurmaya teşvik etmez.',
  '107:4': 'Yazıklar olsun o salât edenlere!',
  '107:5': 'Onlar, salâtlarından gaflet içindedirler.',
  '107:6': 'Onlar, gösteriş yaparlar.',
  '107:7': 'Ve yardımı esirgerler.'
};

const topics = [
  { id:'amac', title:'Salâtın amacı', summary:'Allah\'ı anmak, kötülükten uzaklaşmak ve sabırla yardım istemek. Bunlar salâtın amacı ve hayatla bağlantısıdır; hareket sırası değildir.', grade:'Doğrudan lafız', keys:['20:14','29:45','2:45','2:46','6:162','6:163'], note:'Tâhâ 14, Mûsâ\'ya hitaptır; Ankebût 45 ve En\'âm 162–163 elçiye hitaptır. Bu hitaplardan bütün müminler için ortak amaç çıkarmak bağlam çıkarımıdır. Ankebût 45\'te okuma ve salât ayrı emirlerdir; yan yana bulunmaları, okumanın her salâtın içinde aynı biçimde zorunlu olduğunu tek başına kanıtlamaz.' },
  { id:'hazirlik', title:'Bilinç ve temizlik', summary:'Ne söylediğini bilme, suyla temizlik ve su bulunamadığında teyemmüm salâtla açıkça ilişkilidir. Genel mescit adabı ayrı değerlendirilir.', grade:'Doğrudan lafız', keys:['4:43','5:6','7:31'], note:'Nisâ 43\'ün "yol geçicileri" istisnası ile "kadınlarla temas" ifadesinin kapsamı bu çalışmada kesinleştirilmedi. Mâide 6\'daki ayak lafzının yıkama veya mesh emrine bağlanması da açıktır. A\'râf 31 mescit adabıdır; salâtın her ayrıntısı için tek başına bir kıyafet yönetmeliği vermez.' },
  { id:'yonelis', title:'Kıble ve yöneliş', summary:'Mescid-i Harâm yönüne dönme emri açıktır. Bu emrin salâtın yön düzeniyle ilişkisi, kıble pasajının bağlamından çıkarılır.', grade:'Bağlam çıkarımı', keys:['2:115',...Array.from({length:9},(_,i)=>`2:${142+i}`)], note:'Bakara 142–150 tam bir pasaj olarak verildi. Bakara 115, bütün yönlerin Allah\'a ait olduğunu söyler; bunu Bakara 144, 149 ve 150\'deki yön emrini kaldıran bir hüküm gibi kullanmıyoruz. Bakara 143\'teki "imanınızı" sözcüğünü mealde "namazınızı" diye değiştirmiyoruz. Bakara 146\'daki "onu" zamirinin göndergesi, lafızda ayrıca adlandırılmadığı için mealde tamamlanmadı.' },
  { id:'beden', title:'Ayakta duruş, rükû ve secde', summary:'Ayakta salât eden bir kişi açıkça anlatılır. Secde, korku salâtı sahnesinde yer alır. Rükû emirleri salât ve ibadet bağlamıyla ilişkilidir; tam hareket sırası ve tekrar sayısı ayrıca kanıt ister.', grade:'Doğrudan lafız / bağlam çıkarımı', keys:['2:43','2:238','3:39','3:43','2:125','5:55','22:26','22:77','48:29',...Array.from({length:11},(_,i)=>`96:${i+9}`)], note:'Âl-i İmrân 39 ayakta salâtı doğrudan anlatır; Nisâ 102 salât içinde secdeyi gösterir. Hac 77 genel ibadet emridir ve salât kelimesini içermez. Âl-i İmrân 43\'te secde rükûdan önce anılır; buradan zorunlu hareket sırası çıkarmıyoruz. Hac 26 ve Fetih 29\'un salât bağlantısı bağlam çıkarımıdır. Alak 9–19\'da salât edenin engellenmesi ve secde emri aynı sahnededir; yine ayrıntılı hareket tarifi verilmez.' },
  { id:'okuma', title:'Okuma, zikir ve ses', summary:'Salât bağlamında söylenen söz ve ses düzeyi bulunur. Kur\'ân\'el-fecr ve gece okuması ayrıca geçer. Hangi metnin her salâtta kaç kez okunacağı bu ayetlerde belirlenmez.', grade:'Doğrudan lafız / bağlam çıkarımı', keys:['17:78','17:79','17:110',...Array.from({length:8},(_,i)=>`73:${i+1}`),'73:20'], note:'İsrâ 110\'daki ses emri tekil muhataba yöneliktir; bütün salâtlara aynı ses kuralını genellemek bağlam çıkarımıdır. Müzzemmil 1–8 gece kalkışı ve okuma bağlamını gösterir. Müzzemmil 20\'de okuma ve salât ayrı emirlerdir; aynı ayette bulunmaları her salâta sabit bir okuma listesi veya miktarı eklemez. İsrâ 79\'daki "senin için" hitabını herkese zorunlu ek vakit saymıyoruz.' },
  { id:'topluluk', title:'Aile, birlikte salât ve cuma', summary:'Aileye salâtı emretme, salâta çağrı, cuma günü alışverişi bırakma ve salât bitince dağılma açıkça geçer. Korku salâtında iki grubun düzeni de toplu salâtı gösterir.', grade:'Doğrudan lafız', keys:['19:54','19:55','20:132','5:58','62:9','62:10','62:11'], note:'Cuma 9–11 kesilmeden verildi. Çağrı vardır; çağrının sabit sözleri, minare, hutbenin metni veya bütün günlük salâtların yalnız cemaatle geçerli olduğu bu pasajda yazmaz. Cuma 11\'de "ayakta" bulunmayı tek başına ayrıntılı bir hutbe düzeni diye sunmuyoruz. Meryem 54–55\'te İsmâil\'in ailesine salâtı emretmesi, Tâhâ 132\'de elçinin ailesine salâtı emretmesi ve kendisinin sabrı anlatılır.' },
  { id:'korku', title:'Yolculuk, korku ve salât sonrası', summary:'Korku hâlinde yaya veya binek üzerinde uygulama, yolculukla birlikte korku koşulunda kısaltma ve güvenlik için grupların yer değiştirmesi anlatılır. Salât sonrası zikir, salâtın içindeki duruşlarla karıştırılmaz.', grade:'Doğrudan lafız', keys:['2:239','4:101','4:102','4:103'], note:'Nisâ 101\'de yolculukla birlikte "korkarsanız" koşulu da vardır. Bu ayetten her yolculukta koşulsuz kısaltma sonucu çıkarmıyoruz; kısaltmanın miktarı da belirtilmez. Nisâ 102\'de grup değişimi anlatılır, rekât sayısı verilmez. Nisâ 103\'te ayakta, oturarak ve yanlar üzerinde zikir, salât tamamlandıktan sonradır; bu üç duruşu normal salâtın zorunlu sırası yapmıyoruz.' },
  { id:'ahlak', title:'Huşû, süreklilik ve ahlâk', summary:'Salâtı koruma ve sürdürme, huşû, gösterişten kaçınma ve başkalarının hakkını gözetme birlikte görünür. Salâtın dış biçimini, ahlâkî bağlamından koparmıyoruz.', grade:'Doğrudan lafız / bağlam çıkarımı', keys:[...Array.from({length:11},(_,i)=>`23:${i+1}`),'4:142','9:54','19:59','19:60',...Array.from({length:7},(_,i)=>`107:${i+1}`),...Array.from({length:17},(_,i)=>`70:${i+19}`)], note:'Mü\'minûn 1–11, Mâûn 1–7 ve Meâric 19–35 bütün pasaj olarak verildi. Böylece salâtla birlikte anılan yetim, yoksul, emanet, ahit ve tanıklık konuları dışarıda bırakılmadı. Meryem 59\'daki eleştiri, Meryem 60\'taki tövbe istisnasıyla birlikte verildi. Mâûn 5\'te eleştiri "salâtlarından" gaflettir; bunu yalnız salât sırasında akla gelen düşünceler diye daraltmıyoruz. Meâric 23\'te süreklilik vardır; kesintisiz fiziksel hareket veya belirli vakit sayısı sonucu çıkarmıyoruz.' },
  { id:'ayrim', title:'Her salât kullanımı aynı değildir', summary:'Allah\'ın ve meleklerin salâtı, bir kişinin başkaları üzerine salâtı ve insanın ikame ettiği salât aynı biçimde tarif edilmez. Tesbîh ve zikir de otomatik olarak salâtla eşitlenmez.', grade:'Bağlam çıkarımı', keys:['2:155','2:156','2:157','9:103','33:43','33:56','9:83','9:84','24:36','24:37','8:35'], note:'Bakara 155–157, Tevbe 103 ve Ahzâb 43, 56\'daki "üzerine salât" kullanımlarını hareketli ibadet biçimine dönüştürmüyoruz. Bu ifadeleri mealde doğrudan "destek" diye değiştirip anlamı kapatmıyoruz. Tevbe 83–84 belirli bir grup ve ölenler üzerine salât bağlamıdır; buradan günlük salât veya ayrıntılı cenaze uygulaması tarifi çıkarmıyoruz. Nûr 36–37 tesbîh, zikir ve salâtı ayrı ifadelerle verir; özdeşlik kurulmaz ama ilişkileri de reddedilmez. Enfâl 35\'te eleştirilen uygulamayı olumlu bir salât tarifi saymıyoruz.' },
  { id:'vakit-bagi', title:'Vakit ayetleriyle bağlantı', summary:'Bu sayfa salâtın içeriğine odaklanır. Vakit ayetleriyle bağ korunur; burada yeni bir vakit sayımı veya saat hesabı yapılmaz.', grade:'Doğrudan lafız / açık', keys:['11:114','24:58'], note:'Hûd 114\'te tarafeyi\'n-nehâr ve zülefen mine\'l-leyl vardır. Nûr 58\'de Salâtü\'l-Fecr ve Salâtü\'l-İşâ adları geçer; aynı ayetteki üç izin/mahremiyet aralığını üç salât adı diye sunmuyoruz. Fecr eşlemesi, dülûk, ğasaq ve saat sınırları için önceki Vakit Atlası ayrı kalır; onun ana sonucu bu güncellemeyle değiştirilmedi.' }
];

const notes = {
  '5:55':'"Ve hüm râkiûn" ifadesi, çalışma mealinde "ve rükû ederler" diye karşılandı; "rükû hâlindeyken" bağlantısı da ayrıca dil incelemesi ister. Bu ayetten zekâtın belli bir bedensel duruşta verilmesi zorunluluğunu çıkarmıyoruz.',
  '4:43':'Bilinç sınırı, ne söylendiğini bilmekle ifade edilir. Bu ayet, okunacak sabit bir metin listesi vermez. "Kadınlarla temas" ve "yol geçicileri" ifadelerinin ayrıntılı anlamı açıktır.',
  '5:6':'Önceki "ayaklarınızı temizleyin" ifadesi, yıkama/mesh bağlantısını gizliyordu. Köşeli ayraçta iki olası bağlantı gösterildi; ayet lafzının yerine belirsiz bir genel temizlik fiili konulmadı. Bu atlas iki okumadan birini kesinleştirmez.',
  '3:39':'Ayakta olma ile salât aynı sahnede doğrudan anlatılır. "Hasûr" için bu denetimde yeterli Kur\'ân içi anlam kanıtı kurulmadığından kelime korunmuştur; dış sözlük anlamı kanıt yapılmaz.',
  '17:78':'Kur\'ân\'el-fecr, fecr okuması olarak karşılanabilir; salât emriyle ilişkisi bağlam çıkarımıdır. Dülûk ve ğasaqın kesin astronomik sınırları burada kapatılmaz.',
  '17:79':'"Onunla" zamiri Arapça metinde ayrıca bir adla açılmadığı için mealde korunmuştur. "Teheccüd"ün tam uygulama biçimi için bu bölümde yeterli Kur\'ân içi kanıt yoktur.',
  '73:6':'"Gece kalkışı" ve "etki" karşılıkları çalışma çevirisinin anlam tercihleridir. Nâşie ve vat\'an ifadelerinin tam anlamı için burada eksiksiz Kur\'ân içi sözlükbilim kurulmuş değildir; bunlardan teknik salât kuralı çıkarmıyoruz.',
  '8:35':'Mükâ ve tasdiye lafızları korunmuştur. Bu iki lafza "ıslık" ve "el çırpma" anlamı verecek yeterli Kur\'ân içi karşılaştırma bu çalışmada yoktur; dış sözlük karşılığı kanıt yapılmaz.',
  '33:56':'Salât ve selâm emirleri vardır. Selâm/teslimiyet alanının ayrıntılı anlam ilişkisi ayrı bir Kur\'ân içi inceleme ister; buradan sabit bir salât içi formül çıkarmıyoruz.',
  '96:18':'Zebâniye lafzı çalışma mealinde korunmuştur. Kimlerin kastedildiğine ilişkin yeterli Kur\'ân içi kanıt bu bölümde kurulmadığından dış kaynakla tamamlanmaz.',
  '24:36':'Tesbîh zamanı dil verisidir; bu ayetteki sabah/akşam ifadeleri bağımsız bir salât sayımına katılmaz.',
  '24:58':'Üç sayısı izin istenecek mahremiyet zamanlarına aittir. Öğle aralığı burada bir salât adıyla verilmemiştir.'
};
const allKeys = topics.flatMap(t => t.keys);
if (new Set(allKeys).size !== allKeys.length) throw new Error('Tekrarlanan ayet var.');
for (const key of allKeys) {
  if (!verses.has(key) || !meals[key] || !names[key.split(':')[0]]) throw new Error(`Eksik içerik: ${key}`);
  if (/\.\.\.|…/.test(meals[key])) throw new Error(`Kesilmiş meal: ${key}`);
}
const basmala = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
function card(key) {
  const arabic = verses.get(key);
  const meal = (arabic.startsWith(basmala) ? 'Rahmân ve Rahîm Allah\'ın adıyla. ' : '') + meals[key];
  return `<article class="verse-card" id="ayet-${key.replace(':','-')}" data-key="${key}">
<h3>${escape(ref(key))}</h3>
<p class="arabic" lang="ar" dir="rtl">${escape(arabic)}</p>
<p class="meal"><strong>Tam çalışma meali</strong>${escape(meal)}</p>
${notes[key] ? `<p class="reading-note"><strong>Okuma notu:</strong> ${escape(notes[key])}</p>` : ''}
<a class="source-link" href="https://tanzil.net/#${key}" target="_blank" rel="noopener">${escape(ref(key))} · Kaynak metni aç</a>
</article>`;
}
const copyrightStart = corpus.indexOf('# PLEASE DO NOT REMOVE');
if (copyrightStart < 0) throw new Error('Tanzil telif bildirimi bulunamadı.');
const copyright = corpus.slice(copyrightStart).split('\n').map(line=>line.trimEnd()).join('\n');
const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kur'ân'da Salâtın İçeriği Atlası v0.2</title>
<meta name="description" content="Salâtın amacı, hazırlığı, kıblesi, hareketleri, okuması, toplu düzeni ve açık ayrıntıları: tam ayetler ve tam çalışma mealleri."><link rel="icon" href="data:,">
<style>
:root{--bg:#f5f7f8;--paper:#fff;--ink:#192723;--muted:#53625d;--line:#d5ded9;--green:#176249;--soft:#edf5f0;--amber:#784800;--warn:#fff5df}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:90px}body{margin:0;color:var(--ink);background:var(--bg);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.7;letter-spacing:0}a{color:var(--green);text-underline-offset:3px}button,input,select{font:inherit}button,select,input{border:1px solid var(--line);border-radius:6px;background:var(--paper);color:var(--ink);padding:10px 12px}button{cursor:pointer}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #30966b;outline-offset:3px}.site-header{background:var(--paper);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:10}.nav{max-width:1080px;margin:auto;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{font-size:16px;font-weight:750;text-decoration:none}.nav-links{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14px}main{max-width:1080px;margin:auto;padding:30px 24px 70px}h1{font-size:36px;line-height:1.2;margin:8px 0 16px}h2{font-size:26px;line-height:1.3;margin:0 0 12px}h3{font-size:20px;line-height:1.4;margin:0 0 12px}p{margin:0 0 16px}.muted,.source-link{color:var(--muted)}.version{font-size:13px;font-weight:700;color:var(--green)}.intro{max-width:880px}.notice{padding:14px 18px;border-left:4px solid var(--green);background:var(--soft);margin:20px 0}.warning{border-color:#b47e21;background:var(--warn)}section{padding:30px 0;border-top:1px solid var(--line);scroll-margin-top:12px}.summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:20px}.summary article{border-top:3px solid var(--green);padding-top:12px}.summary h3{font-size:18px}.tag{display:inline-block;font-size:12px;font-weight:700;padding:3px 8px;background:var(--soft);color:var(--green);border-radius:4px;margin-bottom:12px}.map{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 24px;list-style:none;padding:0;counter-reset:topic}.map li{counter-increment:topic;border-bottom:1px solid var(--line);padding:10px 0}.map a{text-decoration:none;font-weight:650}.map a::before{content:counter(topic) ". ";color:var(--muted)}.controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(200px,.65fr) auto;gap:12px;align-items:end}.controls label{display:grid;gap:6px;font-size:14px;font-weight:650}.controls input,.controls select{width:100%;min-width:0}#count{font-size:14px;color:var(--muted);margin:12px 0}.topic-head{max-width:900px}.topic-note{border-left:3px solid var(--line);padding:8px 16px;color:var(--muted);font-size:15px}.verse-list{display:grid;gap:16px;margin-top:24px}.verse-card{border:1px solid var(--line);border-radius:8px;background:var(--paper);padding:24px;scroll-margin-top:95px;min-width:0}.verse-card h3{color:var(--green);font-size:22px;font-weight:800}.arabic{font-family:"Noto Naskh Arabic","Amiri","Traditional Arabic",serif;font-size:27px;line-height:2.1;text-align:right;overflow-wrap:anywhere;margin:12px 0 20px}.meal{font-size:17px}.meal strong{display:block;font-size:12px;color:var(--muted);margin-bottom:8px}.reading-note{padding-top:12px;border-top:1px solid var(--line);font-size:14px;color:var(--muted)}.source-link{font-size:13px}.plain-list{padding-left:22px}.plain-list li{margin-bottom:12px}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:15px}th,td{text-align:left;padding:12px;border-bottom:1px solid var(--line);vertical-align:top}th{background:var(--soft)}.technical{overflow-wrap:anywhere;font-size:13px}.empty{padding:24px;background:var(--paper);border:1px solid var(--line);border-radius:8px}.footer{font-size:14px;color:var(--muted);margin-top:30px}details summary{cursor:pointer;font-weight:700}pre{white-space:pre-wrap;font-size:12px}[hidden]{display:none!important}
@media(max-width:760px){.nav{padding:12px 18px;align-items:flex-start;flex-direction:column;gap:8px}.site-header{position:static}main{padding:24px 18px 50px}h1{font-size:29px}h2{font-size:23px}.summary,.map,.controls{grid-template-columns:1fr}.controls{gap:10px}.verse-card{padding:18px}.arabic{font-size:25px}.nav-links{gap:6px 14px}.verse-card{scroll-margin-top:16px}html{scroll-padding-top:16px}.meal{font-size:16px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style></head><body>
<header class="site-header"><nav class="nav" aria-label="Ana gezinme"><a class="brand" href="./">Salâtın İçeriği Atlası</a><div class="nav-links"><a href="#sonuc">Özet</a><a href="#konular">Konular</a><a href="#ayetler">Tam Ayetler</a><a href="#acik">Açık Sorular</a><a href="#denetim">Denetim</a><a href="../salat-vakit/">Vakit Atlası</a></div></nav></header>
<main><div class="intro"><p class="version">v0.2 · İçerik denetimi yapılmış araştırma taslağı</p><h1>Kur'ân'da Salâtın İçeriği Atlası</h1><p>Kur'ân salâtın amacı, hazırlığı ve uygulanışı hakkında ne söylüyor? Hangi ayrıntılar açık kalıyor? Konular, tam ayetler ve araştırma notları burada ayrı ayrı gösterilir.</p></div>
<div class="notice"><strong>Kaynak ve yöntem:</strong> Arapça metin, Tanzil Uthmani v1.1'in 6236 ayetlik dosyasından değiştirilmeden alınır. Hadis, tefsir, mezhep, gelenek veya dış sözlük anlamı kanıt olarak kullanılmaz. Türkçe metinler bu proje için hazırlanmış <strong>çalışma mealleridir</strong>; yayımlanmış bir mealden alıntı değildir. Köşeli ayraçlar çevirmenin ekini veya açık bırakılan iki okumayı gösterir.</div>
<section id="sonuc"><h2>Kısaca ne çıkıyor?</h2><p>Kur'ân'da salât yalnız içten geçirilen bir niyet olarak anlatılmaz; hazırlık, söz, duruş, secde ve toplu uygulama sahneleri vardır. Bununla birlikte bu ayetler tek bir ayrıntılı uygulama tarifine dönüştürülemez.</p><div class="summary"><article><h3>Açıkça söylenenler</h3><p>Bilinç ve temizlik: ${refs(['4:43','5:6'])}. Ayakta salât: ${link('3:39')}. Salât içinde secde: ${link('4:102')}. Ses için orta yol: ${link('17:110')}. Cuma çağrısı: ${link('62:9')}. Bu ayetlerin muhatap ve koşulları aşağıda korunur.</p></article><article><h3>Birlikte okunarak çıkarılanlar</h3><p>Rükûnun salâtla bağlantısı: ${link('2:43')}. Kıblenin salât düzeniyle bağlantısı: ${refs(['2:144','2:149','2:150'])}. Okumanın salâtla ilişkisi: ${refs(['17:78','73:20'])}. Bağlantı, her ayrıntının ayrıca emredildiği anlamına gelmez.</p></article><article><h3>Açık kalan ayrıntılar</h3><p>İncelenen ayetler rekât sayısını, bütün hareketlerin tek ve zorunlu sırasını, sabit okunacak metin listesini, el konumunu ve oturuş biçimini belirtmez. Bu, bütün Kur'ân için tamamlanmış bir yokluk ispatı değildir.</p></article></div></section>
<section id="konular"><h2>Konular</h2><ol class="map">${topics.map(t=>`<li><a href="#${t.id}">${escape(t.title)}</a></li>`).join('')}</ol><p class="muted">Her konuda önce kısa değerlendirme, sonra dayanak ayetlerin tamamı bulunur. Bir konuda bulunan ayete başka konudan bağlantı verilir; ayet kırpılarak tekrarlanmaz.</p></section>
<section id="ayetler"><h2>Tam ayetler ve tam çalışma mealleri</h2><p>${allKeys.length} ayrı ayet, ${topics.length} konu. Bu seçki, içerik araştırmasının genişletilmiş dayanak listesidir; bütün köklerin bütün kullanımlarının tamamlanmış dökümü değildir.</p><div class="controls"><label for="search">Ayet veya sözcük ara<input id="search" type="search" placeholder="Bakara 238, temizlik, secde" autocomplete="off"></label><label for="topic">Konu seç<select id="topic"><option value="all">Bütün konular</option>${topics.map(t=>`<option value="${t.id}">${escape(t.title)}</option>`).join('')}</select></label><button type="button" id="reset">Temizle</button></div><p id="count" role="status" aria-live="polite">${allKeys.length} ayet gösteriliyor.</p><div id="empty" class="empty" hidden>Aramanıza uygun ayet bulunamadı.</div><noscript><p>Arama için JavaScript gerekir; bütün ayetler aşağıda tam olarak okunabilir.</p></noscript></section>
${topics.map((t,i)=>`<section class="topic" id="${t.id}"><div class="topic-head"><h2>${i+1}. ${escape(t.title)}</h2><span class="tag">${escape(t.grade)}</span><p>${escape(t.summary)}</p><p class="topic-note"><strong>Kanıtın sınırı:</strong> ${escape(t.note)}${t.id==='beden'||t.id==='topluluk' ? ` İlgili sahne: ${link('4:102')}.` : ''}${t.id==='vakit-bagi' ? ` Diğer dayanaklar: ${refs(['17:78','4:103'])}.` : ''}</p></div><div class="verse-list">${t.keys.map(card).join('\n')}</div></section>`).join('\n')}
<section id="acik"><h2>Henüz cevaplanmayan sorular</h2><ul class="plain-list"><li><strong>Hareket sırası ve tekrar:</strong> Nisâ 102 bir grup düzeni anlatır; iki grup, iki rekât demek değildir. Âl-i İmrân 43 ve Hac 77'deki emir dizilerini doğrudan tek bir zorunlu sıraya çevirmiyoruz.</li><li><strong>Sabit okunacak metin:</strong> Müzzemmil 20 kolay geleni okumayı söyler; bunu her salâtta belirli bir sure veya formülün zorunlu olduğunun kanıtı yapmıyoruz. Fâtiha'nın ya da başka bir metnin zorunluluğu konusunda burada sonuç kurulmadı.</li><li><strong>Temizlikte ayrıntılar:</strong> Mâide 6'da ayakların bağlı olduğu emir, Nisâ 43'te yol geçicileri istisnası ve iki ayetteki kadınlarla temas ifadesinin kapsamı ayrıca Kur'ân içi dil incelemesi ister.</li><li><strong>Genelleme sınırı:</strong> Mûsâ'ya, Meryem'e veya elçiye yönelmiş bir hitabı bütün salâtların aynı biçimde yapılması kuralına dönüştürmek ayrıca gerekçe ister.</li><li><strong>Cemaat ve çağrı:</strong> Toplu uygulama ve çağrı vardır; bütün salâtlar için cemaat zorunluluğu, çağrının sabit sözleri ve ayrıntılı cuma düzeni bu seçkiden tek başına kapanmaz.</li><li><strong>Tam tarama:</strong> Salât, kıyam, rükû, secde, okuma, zikir, taharet ve yöneliş kullanımlarının tamamı henüz tek tek sınıflandırılmadı. Dolayısıyla "Kur'ân hiçbir yerde söylemez" biçiminde mutlak yokluk hükmü vermiyoruz.</li></ul></section>
<section id="denetim"><h2>Bu denetimde neler düzeltildi?</h2><div class="table-wrap"><table><thead><tr><th>Önce</th><th>Şimdi</th></tr></thead><tbody><tr><td>Çıplak sure ve ayet numaraları; dokuz kartta on ayet.</td><td>Bakara 43 gibi belirgin sure adları; ${allKeys.length} ayetin her biri ayrı tam metin ve tam çalışma meali.</td></tr><tr><td>Tabloda anılan bazı ayetlerin tam metni yoktu.</td><td>Önceki tablonun dayanakları eklendi; amaç için Tâhâ 14, ayakta salât için Âl-i İmrân 39 ve ahlâk pasajları da tamamlandı.</td></tr><tr><td>Sefer ve korku, koşulları ayrılmadan özetleniyordu.</td><td>Nisâ 101'in korku koşulu korundu; kısaltmanın miktarı açık bırakıldı.</td></tr><tr><td>Salât içi eylem, genel ibadet ve salât sonrası zikir birbirine yaklaşıyordu.</td><td>Doğrudan bağ, bağlam çıkarımı ve salât sonrası ayrı gösterildi; Nisâ 103'teki üç duruş normal salât sırası sayılmadı.</td></tr><tr><td>Mâide 6'da ayaklar için genel "temizleyin" karşılığı vardı.</td><td>Yıkama/mesh bağlantısındaki iki okuma görünür kılındı; tartışma sonuçlandırılmadı.</td></tr><tr><td>"Tamamen kısma" ve "koşun" karşılıkları vardı.</td><td>İsrâ 110'da "kısma", Cuma 9'da "yönelin" kullanıldı; teknik desibel veya fiziksel koşma kuralı üretilmedi.</td></tr><tr><td>Tüm geçişleri sunulmayan teknik kök sayıları öne çıkıyordu.</td><td>Bu sayılar kaldırıldı; seçkinin kapsamı ve tamamlanmamış kök araştırması açıkça belirtildi.</td></tr></tbody></table></div><p class="notice warning"><strong>Denetimin sınırı:</strong> Arapça tamlığı ve referans eşleşmesi otomatik olarak kontrol edilir. Çalışma meallerinin tam cümle kapsamı ve yorumların sınırı ayrıca okunarak gözden geçirilmiştir; otomatik testler bir çevirinin anlamını kesin doğrulamaz. Bütün kökler için eksiksiz Kur'ân içi sözlükbilim denetimi tamamlanmış değildir.</p></section>
<section id="kokler"><h2>Kaynak ve araştırmanın kapsamı</h2><p>Arapça kaynak: <a href="https://tanzil.net/" target="_blank" rel="noopener">Tanzil Kur'ân metni</a>, Uthmani v1.1. Toplam 6236 ayet. Kartlardaki Arapça, kaynak dosyadaki ayet dizgesinin tamamıdır; hareke veya yazım değiştirilmedi. Kaynakta bazı surelerin ilk ayetiyle birlikte bulunan besmele de korundu ve çalışma mealine eklendi.</p><p><strong>Kanıt dereceleri:</strong> <strong>Doğrudan lafız</strong>: ayette açıkça bulunan ifade. <strong>Dil çıkarımı</strong>: dil yapısından çıkarılan sonuç. <strong>Bağlam çıkarımı</strong>: ayetleri ve muhataplarını birlikte okuyarak kurulan bağlantı. <strong>Açık</strong>: bu araştırmada yeterli kanıtla kapanmayan konu. Etiketler başlığın altındaki iddiaya aittir; bütün ayetin her çeviri tercihini kesinleştirmez.</p><p>Türkçe çalışma meali yardımcıdır; Arapça metnin yerine geçmez. Tekil veya tartışmalı kelimeler için yeterli Kur'ân içi kanıt kurulmadığında bu eksik okuma notunda belirtilir. Bu sayfa bir fetva veya tamamlanmış bir uygulama kılavuzu değildir.</p><p class="technical"><strong>Arapça kaynak dosyası SHA-256:</strong> ${crypto.createHash('sha256').update(corpus).digest('hex')}<br><strong>Kapsam kontrolü:</strong> ${allKeys.length} benzersiz ayet; ${allKeys.length} tam Arapça metin; ${allKeys.length} tam çalışma meali. Güncelleme: 12 Ekim 2026.</p><details><summary>Tanzil kaynak bildirimi</summary><pre>${escape(copyright)}</pre></details></section>
<footer class="footer"><p><a href="../salat-vakit/">Kur'ân Salât ve Vakit Atlası</a> ayrı araştırma olarak korunmuştur. Bu güncelleme yalnız Salâtın İçeriği Atlası'na aittir.</p></footer></main>
<script>
const topics=Array.from(document.querySelectorAll('.topic'));
const cards=Array.from(document.querySelectorAll('.verse-card'));
const search=document.getElementById('search');
const select=document.getElementById('topic');
const fold=value=>value.toLocaleLowerCase('tr').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replaceAll('ı','i').replaceAll('’',"'");
function filter(){const query=fold(search.value.trim());let count=0;topics.forEach(topic=>{const match=select.value==='all'||select.value===topic.id;let visible=0;topic.querySelectorAll('.verse-card').forEach(card=>{const shown=match&&(!query||fold(card.textContent+' '+card.dataset.key+' '+topic.querySelector('h2').textContent).includes(query));card.hidden=!shown;if(shown)visible++;});topic.hidden=!visible;count+=visible;});document.getElementById('count').textContent=count+' / '+cards.length+' ayet gösteriliyor.';document.getElementById('empty').hidden=count!==0;}
function reset(){search.value='';select.value='all';filter();}
search.addEventListener('input',filter);select.addEventListener('change',filter);document.getElementById('reset').addEventListener('click',()=>{reset();search.focus();});
function revealHash(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const target=document.getElementById(id);if(target&&(target.matches('.verse-card')||target.matches('.topic'))){reset();target.scrollIntoView();}}
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{const target=document.getElementById(a.getAttribute('href').slice(1));if(target&&(target.matches('.verse-card')||target.matches('.topic')))reset();}));window.addEventListener('hashchange',revealHash);if(location.hash)revealHash();
</script></body></html>`;
fs.writeFileSync(path.join(dir,'index.html'),html);
console.log(JSON.stringify({ayet:allKeys.length,konu:topics.length,bytes:Buffer.byteLength(html),corpusSha256:crypto.createHash('sha256').update(corpus).digest('hex')}));
