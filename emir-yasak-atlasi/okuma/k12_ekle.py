# Konu 12 kayıtlarını k12_kayit.tsv dosyasına ekler (blok, davranış, davranış ayeti, karşılık ayeti, karşılık, derece, not, tür)
import sys, os
F = 'k12_kayit.tsv'
HEAD = '# blok\tdavranis\tdavranis_ayet\tceza_ayet\tceza\tderece\tnot\ttur\n'
rows = [l.rstrip('\n').split('\t') for l in sys.stdin if l.strip() and not l.startswith('#')]
for r in rows:
    assert len(r) == 8, r
    assert r[5] in ('✓', '→', '?'), r
    assert r[7] in ('yasak', 'emir', 'sonuc', 'tanim'), r
if not os.path.exists(F): open(F, 'w', encoding='utf8').write(HEAD)
open(F, 'a', encoding='utf8').write(''.join('\t'.join(r) + '\n' for r in rows))
print('eklendi', len(rows))
