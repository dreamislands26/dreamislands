#!/bin/bash
# Run on RU VPS: bash /root/dump_ru_templates.sh > /root/ru_templates.txt
R=/var/www/dreamislands
echo "=== destination dirs"; ls -1 $R/destinations/
echo "=== program dirs"; ls -1 $R/programs/
echo "=== other top-level dirs"; ls -1 $R | head -80
echo "=== TEMPLATE destination page: tanya-wellbeing"
cat $R/destinations/tanya-wellbeing/index.html
echo "=== TEMPLATE program page: wudang-3-day-mind-reset"
cat $R/programs/wudang-3-day-mind-reset/index.html
echo "=== country hub: thailand"
cat $R/destinations/thailand/index.html | sed -n '1,200p'
echo "=== sitemap count"; grep -c '<url>' $R/sitemap.xml
echo "=== which files generate programs/destinations?"; grep -l -E 'programs/|destinations/' /root/*.sh /root/*.py 2>/dev/null | head -40
