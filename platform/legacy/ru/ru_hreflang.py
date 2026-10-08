#!/usr/bin/env python3
# Run ON the RU VPS. Adds hreflang to the RU hub (pair exists: EN /medical/china). Idempotent.
import shutil
p = "/var/www/dreamislands/lechenie-v-kitae/index.html"
s = open(p, encoding="utf-8").read()
if 'hreflang="en"' in s:
    print("already present")
else:
    shutil.copy(p, "/root/backup_medical_20261006/hub.index.html.pre-hreflang")
    tag = ('<link rel="alternate" hreflang="ru" href="https://dreamislands.ru/lechenie-v-kitae/">'
           '<link rel="alternate" hreflang="en" href="https://dreamislands.org/medical/china">'
           '<link rel="alternate" hreflang="x-default" href="https://dreamislands.org/medical/china">')
    anchor = '<meta property="og:type"'
    assert s.count(anchor) == 1
    open(p, "w", encoding="utf-8").write(s.replace(anchor, tag + anchor))
    print("hreflang added")
