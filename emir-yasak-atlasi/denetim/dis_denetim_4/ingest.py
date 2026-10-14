#!/usr/bin/env python3
"""ChatGPT sonuc.zip / okuma_parti*.csv -> kapsam doğrulaması + bulgu triyajı.
Kullanım: python3 ingest.py <klasör_veya_zip>   (okuma_parti1..4.csv aranır)"""
import csv,sys,glob,os,zipfile,tempfile,collections
D=os.path.dirname(os.path.abspath(__file__))
src=sys.argv[1]
if src.endswith('.zip'):
    tmp=tempfile.mkdtemp(); zipfile.ZipFile(src).extractall(tmp); src=tmp
girdi={}
for f in sorted(glob.glob(D+'/parti*.csv')):
    p=os.path.basename(f)[5]
    girdi[p]=list(csv.DictReader(open(f,encoding='utf-8-sig')))
out=[];ozet=[]
for p,rows in girdi.items():
    fs=glob.glob(f'{src}/**/okuma_parti{p}*.csv',recursive=True)
    if not fs: ozet.append(f'parti{p}: DOSYA YOK'); continue
    o=list(csv.DictReader(open(fs[0],encoding='utf-8-sig')))
    by={r['id']:r for r in rows}; ok={}
    for r in o: ok[r['id']]=r
    eksik=[i for i in by if i not in ok]; fazla=[i for i in ok if i not in by]
    shabad=[i for i in ok if i in by and ok[i].get('satir_sha256','').strip()!=by[i]['satir_sha256']]
    notlar=collections.Counter(r.get('kontrol_notu','').strip() for r in o)
    tekrar=sum(c for n,c in notlar.items() if c>5 and n)
    bos=sum(1 for r in o if not r.get('kontrol_notu','').strip())
    bul=[r for r in o if r.get('bulgu_var','').strip().lower().startswith('e') and r['id'] in by]
    ozet.append(f'parti{p}: girdi {len(rows)} | gelen {len(o)} | eksik {len(eksik)} | fazla {len(fazla)} | sha hatalı {len(shabad)} | boş not {bos} | 5+ kez tekrar eden not {tekrar} | bulgu {len(bul)}')
    for r in bul:
        g=by[r['id']]
        out.append({'id':r['id'],'konu':g['konu_no'],'davranis':g['davranis_ayet'],'karsilik':g['karsilik_ayet'],'kod':g['karsilik_kodu'],'derece':g['derece'],'tur':g['tur'],'kayit_notu':g['kayit_notu'],'tur_sorun':r.get('sorun_turu',''),'lafiz':r.get('ayetin_gercek_lafzi',''),'oneri':r.get('onerilen_duzeltme',''),'guven':r.get('guven','')})
print('\n'.join(ozet))
if out:
    fn=D+'/bulgular_triyaj.csv'
    with open(fn,'w',newline='',encoding='utf-8-sig') as f:
        w=csv.DictWriter(f,fieldnames=list(out[0])); w.writeheader(); w.writerows(out)
    print('triyaj ->',fn,len(out))
