#!/usr/bin/env python3
# Run ON the RU VPS (103.13.228.84). 301: old medical destination pages -> /lechenie-v-kitae/.
# Archives old pages, removes them from sitemap.xml, rewrites llms.txt links, adds nginx 301 (nginx -t before reload).
import os, re, shutil, subprocess, sys
ROOT = "/var/www/dreamislands"
BK = "/root/backup_medical_20261006/old_dest"
NGX = "/etc/nginx/sites-enabled/dreamislands"
os.makedirs(BK, exist_ok=True)

MAP = {
  "/destinations/better-migrate-medical-network/": "/lechenie-v-kitae/",
  "/destinations/xian-international-medical-center/": "/lechenie-v-kitae/kliniki/mezhdunarodnyj-medcentr-sian/",
}

# 1) archive old pages (kept on disk as backup; nginx redirect takes precedence)
for old in MAP:
    src = ROOT + old + "index.html"
    if os.path.exists(src):
        shutil.copy(src, BK + "/" + old.strip("/").replace("/", "__") + ".html")
        print("archived", old)

# 2) sitemap: drop old URLs
p = ROOT + "/sitemap.xml"
s = open(p, encoding="utf-8").read()
shutil.copy(p, BK + "/sitemap.xml.pre-redirect")
n0 = len(s)
for old in MAP:
    s = re.sub(r"[ \t]*<url><loc>https://dreamislands\.ru" + re.escape(old) + r"</loc>.*?</url>\n?", "", s)
open(p, "w", encoding="utf-8").write(s)
print("sitemap shrunk by", n0 - len(s), "bytes")

# 3) llms.txt: repoint links
p = ROOT + "/llms.txt"
s = open(p, encoding="utf-8").read()
shutil.copy(p, BK + "/llms.txt.pre-redirect")
for old, new in MAP.items():
    s = s.replace("https://dreamislands.ru" + old, "https://dreamislands.ru" + new)
open(p, "w", encoding="utf-8").write(s)

# 4) nginx
c = open(NGX, encoding="utf-8").read()
if "lechenie-v-kitae/" in c and "return 301 /lechenie-v-kitae/" in c:
    print("nginx already patched")
else:
    shutil.copy(NGX, BK + "/nginx.dreamislands.pre-redirect")
    block = "".join("    location = %s { return 301 %s; }\n" % (o, n) for o, n in MAP.items())
    # also handle no-trailing-slash variants
    block += "".join("    location = %s { return 301 %s; }\n" % (o.rstrip("/"), n) for o, n in MAP.items())
    anchor = "    location / {"
    assert c.count(anchor) == 1, "anchor not unique"
    c = c.replace(anchor, block + "\n" + anchor)
    open(NGX, "w", encoding="utf-8").write(c)
    r = subprocess.run(["nginx", "-t"], capture_output=True, text=True)
    print(r.stderr.strip())
    if r.returncode != 0:
        shutil.copy(BK + "/nginx.dreamislands.pre-redirect", NGX)
        print("nginx -t FAILED, config restored"); sys.exit(1)
    subprocess.run(["systemctl", "reload", "nginx"], check=True)
    print("nginx reloaded")
print("DONE")
