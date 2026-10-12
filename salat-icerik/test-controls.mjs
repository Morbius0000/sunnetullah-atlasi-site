// Arama mantığının denetimi. test.py tarafından çağrılır; sayfadaki betikten
// /*SEARCH-START*/ ile /*SEARCH-END*/ arasındaki bölümü alıp gerçek ayet verisiyle sınar.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const block = input.script.match(/\/\*SEARCH-START\*\/([\s\S]*?)\/\*SEARCH-END\*\//);
assert.ok(block, 'Arama bölümü bulunamadı');
const ctx = vm.createContext({});
vm.runInContext(block[1] + '\nthis.parseQuery = parseQuery; this.cardMatches = cardMatches;', ctx);

// Sayfadaki davranışın aynısı: ayet adıyla bulunamazsa düz metin aramasına geçer.
const find = query => {
  let q = ctx.parseQuery(query);
  let found = input.cards.filter(c => ctx.cardMatches(c, q)).map(c => c.key);
  if (!found.length && q && q.type === 'title') {
    q = ctx.parseQuery(query, true);
    found = input.cards.filter(c => ctx.cardMatches(c, q)).map(c => c.key);
  }
  return found;
};

const passed = [];
const check = (name, fn) => { fn(); passed.push(name); };

check('boş arama', () => assert.equal(ctx.parseQuery('   '), null));
check('sure adı ve numara', () => assert.deepEqual(find('Nisa 43'), ['4:43']));
check('Türkçe büyük harf ve şapka', () => assert.deepEqual(find('NİSÂ 43'), ['4:43']));
check('kesme işaretli sure adı', () => assert.deepEqual(find("Mü'minûn 2"), ['23:2']));
check('sayısal gösterim', () => assert.deepEqual(find('5:6'), ['5:6']));
check('Bakara 238', () => assert.deepEqual(find('Bakara 238'), ['2:238']));
check('sonuçsuz arama', () => assert.deepEqual(find('ZZZX-bulunamaz'), []));
check('namaz = salât', () => { const r = find('namaz'); assert.ok(r.length > 60 && r.includes('2:238') && r.includes('4:102')); });
check('abdest', () => { const r = find('abdest'); assert.ok(r.includes('5:6') && r.includes('4:43')); });
check('teyemmüm', () => assert.ok(find('teyemmüm').includes('4:43')));
check('ezan = çağrı', () => assert.ok(find('ezan').includes('62:9')));
check('kıble', () => assert.ok(find('kıble').includes('10:87')));
check('Kur\'an yazımı', () => assert.ok(find('kuran').includes('7:204')));
check('secde', () => { const r = find('secde'); assert.ok(r.includes('17:107') && r.includes('4:102')); });
check('iki kelime birlikte', () => { const r = find('secde gece'); assert.ok(r.includes('25:64') && !r.includes('4:102')); });

console.log(JSON.stringify(passed));
