#!/bin/bash
# Export the production app for Oleg: a clean tarball (no secrets) + a diff of everything changed since before Stage 1.
# Read-only for /opt/dit-platform. Run on the EN VPS:  bash /root/dit-seed/make_oleg_export.sh
APP=/opt/dit-platform
BASE_BACKUP=/root/stage1_backup_20261007_181131/src_public.tgz   # src taken BEFORE any Stage 1 change
OUT=/root/oleg-export
[ -d "$OUT" ] && { echo "!! $OUT exists - remove it first"; exit 1; }
mkdir -p "$OUT" || exit 1
cd "$APP" || exit 1

echo "== 1. tarball of the production app (no .env, .next, node_modules, backups)"
tar --exclude=node_modules --exclude=.next --exclude=.git --exclude='.env*' --exclude='*.bak' --exclude='*.bak_*' --exclude='*.log' \
    --transform 's#^\.#dit-platform#' -czf "$OUT/dit-platform-prod-$(date +%Y%m%d).tgz" . || { echo "!! tar failed"; exit 1; }
[ -f .env.local ] && grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env.local | sed 's/=.*/=/' > "$OUT/env.example.names"
ls -la "$OUT"

echo "== 2. diff: pre-Stage-1 src  ->  current src"
if [ -f "$BASE_BACKUP" ]; then
  T=$(mktemp -d); tar -xzf "$BASE_BACKUP" -C "$T" src 2>/dev/null
  diff -ruN --exclude='*.bak*' "$T/src" "$APP/src" > "$OUT/stage1-since-pre-stage1.diff"
  echo "   files changed: $(grep -c '^diff ' "$OUT/stage1-since-pre-stage1.diff")   lines: $(wc -l < "$OUT/stage1-since-pre-stage1.diff")"
  rm -rf "$T"
else
  echo "   baseline backup not found: $BASE_BACKUP (diff skipped)"
fi

echo "== 3. secret scan of the export (file names only)"
T2=$(mktemp -d); tar -xzf "$OUT"/dit-platform-prod-*.tgz -C "$T2"
HITS=$(grep -rIlE 'sk_live_|sk_test_|whsec_|-----BEGIN [A-Z ]*PRIVATE KEY|eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{30,}' "$T2" 2>/dev/null | sed "s#^$T2/##")
rm -rf "$T2"
if [ -n "$HITS" ]; then echo "$HITS" | sed 's/^/   POSSIBLE SECRET: /'; echo "!! review before sending; the diff file may also contain them"; else echo "   no hits"; fi

cp /root/stage1_pack/*.sh /root/stage1_pack/*.py "$OUT/" 2>/dev/null; rm -f "$OUT/gen_static_routes.sh" "$OUT/deploy_stage1.sh"
echo; echo "Download to Windows (run in PowerShell):"
echo "  scp -r root@103.76.180.236:$OUT \"C:\\Users\\Mark RS\\Desktop\\cowork\\ugc content\\oleg-export\""
