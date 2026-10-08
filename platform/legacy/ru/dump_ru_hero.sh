#!/bin/bash
# Run on RU VPS: bash /root/dump_ru_hero.sh > /root/ru_hero.txt
# Where does the live frontend pick a program image / emoji? (program-detail.js, /programs/ listing, shared js)
R=/var/www/dreamislands
echo "=== js files"; ls -la $R/js | head -40
echo "=== grep hero/emoji in js"
grep -nE "hero_image|heroImage|image_url|🏝|🌴|🌏|emoji|placeholder" $R/js/*.js | cut -c1-260 | head -80
echo "=== grep in /programs/index.html"
grep -nE "hero_image|image_url|🏝|🌴|🌏|emoji|placeholder|img src" $R/programs/index.html | cut -c1-260 | head -40
