#!/bin/bash
# Run on RU VPS: bash /root/unify_checkup_cta.sh [--dry]
# Unifies ONLY CTA phrases about the check-up to one RU spelling: "чек-ап".
# No global replace: "Check-up" inside running text, glossary and the product name WS stays untouched.
R=/var/www/dreamislands
BK=/root/backup_checkup_cta_$(date +%Y%m%d)
DRY=0; [ "$1" = "--dry" ] && DRY=1
PAT='Пройти Check-up|Пройти бесплатный Check-up|Пройдите бесплатный Check-up|Пройдите Check-up|Бесплатный Check-up'
FILES=$(grep -rlE "$PAT" $R --include=*.html --include=*.js 2>/dev/null)
echo "files with CTA 'Check-up': $(echo "$FILES" | grep -c .)"
echo "phrase counts before:"; grep -rhoE "$PAT" $R --include=*.html --include=*.js | sort | uniq -c | sort -rn
[ $DRY = 1 ] && exit 0
mkdir -p $BK
for f in $FILES; do
  rel=${f#$R/}; mkdir -p "$BK/$(dirname "$rel")"; cp -n "$f" "$BK/$rel"
  sed -i -e 's/Пройти бесплатный Check-up/Пройти бесплатный чек-ап/g' \
         -e 's/Пройдите бесплатный Check-up/Пройдите бесплатный чек-ап/g' \
         -e 's/Пройти Check-up/Пройти чек-ап/g' \
         -e 's/Пройдите Check-up/Пройдите чек-ап/g' \
         -e 's/Бесплатный Check-up/Бесплатный чек-ап/g' "$f"
done
echo "remaining CTA 'Check-up': $(grep -rE "$PAT" $R --include=*.html --include=*.js | wc -l)"
echo "backups: $BK"
