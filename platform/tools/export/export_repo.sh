#!/bin/bash
# Assemble a clean git repo at /root/dit-repo from the live app + pack + docs. Does NOT touch /opt/dit-platform, does NOT push.
# Run on the EN VPS after scp-ing the seed:  bash /root/dit-seed/export_repo.sh
SEED=/root/dit-seed
APP=/opt/dit-platform
OUT=/root/dit-repo
[ -d "$OUT" ] && { echo "!! $OUT already exists - remove or rename it first"; exit 1; }
[ -d "$APP/src" ] || { echo "!! $APP/src not found"; exit 1; }
mkdir -p "$OUT/app" "$OUT/tools/stage1" "$OUT/docs" "$OUT/legacy/ru" || exit 1

echo "== app/"
tar -C "$APP" --exclude=node_modules --exclude=.next --exclude=.git --exclude='.env*' --exclude='*.bak' --exclude='*.bak_*' --exclude='*.log' -cf - . | tar -C "$OUT/app" -xf - || { echo "!! copy failed"; exit 1; }
# .env.example = variable NAMES only, values blank
if [ -f "$APP/.env.local" ]; then
  grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$APP/.env.local" | sed 's/=.*/=/' > "$OUT/app/.env.example"
  echo "   .env.example: $(wc -l < "$OUT/app/.env.example") variable names (no values)"
fi

echo "== tools/stage1/"
cp /root/stage1_pack/*.sh /root/stage1_pack/*.py "$OUT/tools/stage1/" 2>/dev/null
rm -f "$OUT/tools/stage1/gen_static_routes.sh"
[ -d /root/stage1_pack/src ] && cp -r /root/stage1_pack/src "$OUT/tools/stage1/files-src"

echo "== docs/ and legacy/ru/"
cp $SEED/docs/* "$OUT/docs/" 2>/dev/null
cp $SEED/legacy_ru/* "$OUT/legacy/ru/" 2>/dev/null
cp $SEED/README.md $SEED/.gitignore "$OUT/"

echo "== files over 5 MB (review: these are better in Supabase Storage than in git):"
find "$OUT" -type f -size +5M -printf '   %s bytes  %P\n' | sort -rn | head -20
echo "== total size: $(du -sh "$OUT" | cut -f1)   files: $(find "$OUT" -type f | wc -l)"

echo "== secret scan (file names only, values are never printed):"
HITS=$(grep -rIlE 'sk_live_|sk_test_|whsec_|-----BEGIN [A-Z ]*PRIVATE KEY|eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{30,}' "$OUT" 2>/dev/null | sed "s#^$OUT/##")
if [ -n "$HITS" ]; then
  echo "$HITS" | sed 's/^/   POSSIBLE SECRET: /'
  echo "!! Review these files before committing. Nothing was committed."
  exit 2
fi
echo "   no hits"

cd "$OUT" || exit 1
git init -q -b main 2>/dev/null || { git init -q && git checkout -q -b main; }
git add -A
git -c user.name="Mark" -c user.email="9679108@gmail.com" commit -q -m "Initial import: DIT platform (Next.js app, Stage 1 tooling, specs, legacy RU)"
echo "== committed: $(git rev-parse --short HEAD), $(git ls-files | wc -l) files"
echo
echo "Next (you run, with your GitHub credentials). Check first: is the GitHub repo EMPTY or does it already have files (e.g. Dmitry's tech-design)?"
echo
echo "A) Repo is EMPTY:"
echo "  cd $OUT && git remote add origin <REPO_URL> && git push -u origin main"
echo
echo "B) Repo already has content (do NOT push this history over it):"
echo "  git clone <REPO_URL> /root/dit-clone && cd /root/dit-clone"
echo "  git checkout -b import/platform-code"
echo "  rsync -a --exclude .git $OUT/ /root/dit-clone/     # review 'git status': README/.gitignore may collide with existing files"
echo "  git add -A && git commit -m 'Import DIT platform: app, tools, docs, legacy RU' && git push -u origin import/platform-code"
echo "  then open a Pull Request on GitHub"
