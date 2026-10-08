#!/bin/bash
H=$(curl -s https://dreamislands.org/medical/china/hospitals/ruijin-hospital)
echo "== RUIJIN"
echo "$H" | grep -oE 'rel="canonical" href="[^"]*"' | head -2
echo "$H" | grep -oE '"@type":"(Hospital|LodgingBusiness|Organization)"' | sort | uniq -c
echo "$H" | grep -oE '<title>[^<]*</title>' | head -1
echo "$H" | grep -oE 'Submit Your Case' | head -1
M=$(curl -s https://dreamislands.org/medical/china)
echo "== HUB"
echo "$M" | grep -oE '<title>[^<]*</title>' | head -1
echo "$M" | grep -oE 'rel="canonical" href="[^"]*"' | head -1
echo "$M" | grep -oE 'hreflang="[a-z-]*"' | sort -u
echo "$M" | grep -oE '"@type":"(FAQPage|Service|WebPage|BreadcrumbList)"' | sort -u
echo "$M" | grep -oE 'Submit Your Case' | head -1
echo "== SITEMAP medical lines"
curl -s https://dreamislands.org/sitemap.xml | grep -o '<loc>[^<]*medical[^<]*</loc>'
echo "== old fudan in sitemap:"
curl -s https://dreamislands.org/sitemap.xml | grep -c 'properties/fudan'
