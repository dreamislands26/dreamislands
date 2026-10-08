#!/bin/bash
M=$(curl -s https://dreamislands.org/medical/china)
echo "== HUB (expect: pre-consultation 1+, 1,500 1+, report translation 0)"
echo "$M" | grep -oE '30-minute online pre-consultation' | sort | uniq -c
echo "$M" | grep -oE 'RMB 1,500 per time' | sort | uniq -c
echo "$M" | grep -oiE 'report translation' | sort | uniq -c
echo "$M" | grep -oE 'second-opinion-china' | sort | uniq -c
S=$(curl -s https://dreamislands.org/medical/china/guides/second-opinion-china)
echo "== SECOND OPINION (expect: hreflang en/ru/x-default, Submit Your Case)"
echo "$S" | grep -oE 'hreflang="[a-zA-Z-]*"' | sort | uniq -c
echo "$S" | grep -oE 'rel="canonical" href="[^"]*"' | head -1
echo "$S" | grep -oE 'Submit Your Case' | sort | uniq -c
echo "$S" | grep -oE '"@type":"(FAQPage|WebPage|BreadcrumbList)"' | sort | uniq -c
