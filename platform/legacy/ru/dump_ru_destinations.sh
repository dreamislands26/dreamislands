#!/bin/bash
# Run on RU VPS: bash /root/dump_ru_destinations.sh > /root/ru_destinations.txt
R=/var/www/dreamislands
echo "=== destinations/index.html lines 1-140 (cut)"; sed -n '1,140p' $R/destinations/index.html | cut -c1-600
echo "=== line count"; wc -l $R/destinations/index.html
echo "=== tail"; tail -40 $R/destinations/index.html | cut -c1-400
