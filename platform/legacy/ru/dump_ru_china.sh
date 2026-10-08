#!/bin/bash
# Run on RU VPS: bash /root/dump_ru_china.sh > /root/china_dump.txt ; then scp it back
R=/var/www/dreamislands
echo "=== destinations dirs (china related)"
ls -d $R/destinations/*/ | grep -iE 'china|mile|wudang|puer|pu-er|xishuang|sanya|huizhou|xian|better|medical|four-points|sheraton|wyndham|jinghong'
echo "=== china/index.html"
cat $R/destinations/china/index.html
echo
echo "=== destinations/index.html china-related lines"
grep -n -iE 'china|китай|mile|wudang|уданг|better|sian|сиань' $R/destinations/index.html | cut -c1-400
echo "=== generators in /root"
ls /root/*.py /root/*.sh 2>/dev/null
echo "=== programs dirs china"
ls -d $R/programs/*/ | grep -iE 'wudang|mile|puer|xishuang|sanya|huizhou|xian|bm-package'
echo "=== images used on china page"
grep -o 'src="[^"]*"' $R/destinations/china/index.html | sort -u
