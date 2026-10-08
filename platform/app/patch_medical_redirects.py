#!/usr/bin/env python3
# Run ON the main VPS from /opt/dit-platform AFTER patch_medical_en.py is built and the new URLs return 200.
# 301: /properties/<hospital> -> /medical/china/hospitals/<en-slug>; network page -> /medical/china.
# Removes old URLs from public/sitemap.xml.
import os, re, shutil, sys, time
ROOT = "/opt/dit-platform"
BK = "/tmp/medical_redirects_backup_" + time.strftime("%Y%m%d%H%M%S")
os.makedirs(BK, exist_ok=True)

PAIRS = [
 ("peking-union-medical-college-hospital", "/medical/china/hospitals/peking-union-medical-college-hospital"),
 ("fudan-zhongshan-hospital", "/medical/china/hospitals/fudan-zhongshan-hospital"),
 ("shanghai-jiaotong-ruijin-hospital", "/medical/china/hospitals/ruijin-hospital"),
 ("xian-international-medical-center", "/medical/china/hospitals/xian-international-medical-center"),
 ("shanghai-jiahui-international-hospital", "/medical/china/hospitals/shanghai-jiahui-international-hospital"),
 ("peking-university-first-hospital", "/medical/china/hospitals/peking-university-first-hospital"),
 ("peking-university-international-hospital", "/medical/china/hospitals/peking-university-international-hospital"),
 ("sichuan-university-west-china-hospital", "/medical/china/hospitals/west-china-hospital"),
 ("sun-yat-sen-university-affiliated-hospital", "/medical/china/hospitals/sun-yat-sen-university-hospital"),
 ("better-migrate-medical-network", "/medical/china"),
]

nc = ROOT + "/next.config.ts"
shutil.copy(nc, BK + "/next.config.ts")
s = open(nc, encoding="utf-8").read()
if "redirects()" in s:
    print("next.config already has redirects()"); sys.exit(1)
rows = "".join('      { source: "/properties/%s", destination: "%s", statusCode: 301 },\n' % (a, b) for a, b in PAIRS)
block = "  async redirects() {\n    return [\n" + rows + "    ]\n  },\n"
anchor = "const nextConfig: NextConfig = {\n"
if s.count(anchor) != 1:
    print("anchor fail"); sys.exit(1)
open(nc, "w", encoding="utf-8").write(s.replace(anchor, anchor + block))
print("next.config.ts patched")

sm = ROOT + "/public/sitemap.xml"
shutil.copy(sm, BK + "/sitemap.xml")
t = open(sm, encoding="utf-8").read()
n0 = len(t)
for a, _ in PAIRS:
    t = re.sub(r"[ \t]*<url><loc>https://dreamislands\.org/properties/" + re.escape(a) + r"</loc>.*?</url>\n?", "", t)
open(sm, "w", encoding="utf-8").write(t)
print("sitemap shrunk by", n0 - len(t), "bytes")
print("BACKUPS in", BK)
print("NEXT: npm run build && pm2 restart dit")
