#!/bin/bash
# Run on the main VPS: bash /root/check_guides.sh
for s in cost-of-treatment-china how-to-arrange-treatment-china how-to-choose-hospital-china hospitals-china-international-patients; do
  U=https://dreamislands.org/medical/china/guides/$s
  echo "== $s"
  curl -s -o /dev/null -w "HTTP %{http_code}\n" $U
  B=$(curl -s $U)
  echo "$B" | grep -oiE 'hreflang="[a-z-]*"' | sort | uniq -c | tr '\n' ' '; echo
  echo "$B" | grep -oE 'rel="canonical" href="[^"]*"' | head -1
  echo "$B" | grep -oE '"@type":"(FAQPage|WebPage|BreadcrumbList)"' | sort | uniq -c | tr '\n' ' '; echo
  echo -n "Submit Your Case: "; echo "$B" | grep -o 'Submit Your Case' | wc -l
done
echo "== hub guides link"
curl -s https://dreamislands.org/medical/china | grep -o 'guides/how-to-arrange-treatment-china' | head -1
echo "== sitemap"
curl -s https://dreamislands.org/sitemap.xml | grep -c 'medical/china/guides'
echo "== hospitals page links"
curl -s https://dreamislands.org/medical/china/guides/hospitals-china-international-patients | grep -o '/medical/china/hospitals/[a-z-]*' | sort -u | wc -l
