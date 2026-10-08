#!/bin/bash
# Run on RU VPS: bash /root/replace_checkup.sh [--dry]
# Replaces the nav CTA "Пройти оценку" with "Пройти чек-ап" (and the /destinations/ sentence) across static HTML and JS.
R=/var/www/dreamislands
BK=/root/backup_checkup_20261006
DRY=0; [ "$1" = "--dry" ] && DRY=1
mkdir -p $BK
FILES=$(grep -rlE 'Пройти оценку|Пройдите бесплатную оценку состояния' $R --include=*.html --include=*.js --include=*.json --include=*.txt 2>/dev/null)
N=$(echo "$FILES" | grep -c .)
echo "files to change: $N"
if [ $DRY = 1 ]; then echo "$FILES" | sed "s#$R/##" | head -60; exit 0; fi
for f in $FILES; do
  rel=${f#$R/}
  mkdir -p "$BK/$(dirname "$rel")"
  cp -n "$f" "$BK/$rel"
  sed -i -e 's/Пройти оценку/Пройти чек-ап/g' -e 's/Пройдите бесплатную оценку состояния/Пройдите бесплатный чек-ап/g' "$f"
done
echo "remaining occurrences:"; grep -rE 'Пройти оценку|Пройдите бесплатную оценку состояния' $R --include=*.html --include=*.js 2>/dev/null | wc -l
echo "done; backups in $BK"
