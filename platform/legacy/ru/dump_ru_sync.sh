#!/bin/bash
# Run on RU VPS: bash /root/dump_ru_sync.sh > /root/ru_sync.txt
R=/var/www/dreamislands
echo "=== SYNC_README.md"; cat $R/SYNC_README.md
echo "=== V6_README.md"; head -80 $R/V6_README.md
echo "=== build_from_supabase.js"; wc -l $R/build_from_supabase.js; cat $R/build_from_supabase.js | head -260
echo "=== js/program-detail.js (head 90)"; head -90 $R/js/program-detail.js
echo "=== crontab"; crontab -l 2>/dev/null
echo "=== programs/index.html: card count + head"; grep -c 'class="prog' $R/programs/index.html; sed -n '1,60p' $R/programs/index.html | cut -c1-300
echo "=== prozhivanie/index.html head"; sed -n '1,80p' $R/prozhivanie/index.html | cut -c1-300
