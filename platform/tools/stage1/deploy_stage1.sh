#!/bin/bash
# Run on the EN VPS (103.76.180.236) from /root/stage1_pack:
#   bash deploy_stage1.sh dry      -> patch a temp copy, print report + diff, change NOTHING
#   bash deploy_stage1.sh deploy   -> backup -> patch -> build -> restart -> smoke test -> automatic rollback on any failure
PACK=$(cd "$(dirname "$0")" && pwd)
APP=/opt/dit-platform
MODE=${1:-dry}
if [ "$MODE" = "deploy" ]; then
  echo "deploy mode is DISABLED: Stage 1 is already applied on this server and the old rollback logic was unsafe."
  echo "Use: bash $PACK/repair_stage1.sh status|smoke|repair|build"
  exit 1
fi

if [ "$MODE" = "dry" ]; then
  python3 $PACK/apply_stage1.py --dry
  echo; echo "Full diff: /tmp/stage1.diff   (view: less /tmp/stage1.diff   or   sed -n 1,200p /tmp/stage1.diff)"
  exit 0
fi

cd $APP || exit 1
TS=$(date +%Y%m%d_%H%M%S); BK=/root/stage1_backup_$TS
mkdir -p $BK
echo "== backup -> $BK"
tar czf $BK/src_public.tgz src public/sitemap.xml
[ -d .next ] && cp -a .next $BK/next_dir
grep -o '<loc>[^<]*' public/sitemap.xml | sed 's/<loc>//' | sort > /root/sitemap_old_urls.txt
echo "old sitemap URLs saved: $(wc -l < /root/sitemap_old_urls.txt)"

NEW_FILES=("src/lib/supabase-public.ts" "src/lib/stats.ts" "src/lib/hero.ts" "src/app/sitemap.ts" "src/app/sitemap-static.ts" "src/app/(public)/_lib/programMappingResolved.ts")

restart_app() {
  python3 - <<'PY'
import json, subprocess, sys
try:
    j = json.loads(subprocess.run(["pm2", "jlist"], capture_output=True, text=True).stdout or "[]")
    names = [p["name"] for p in j if p.get("pm2_env", {}).get("pm_cwd", "").rstrip("/") == "/opt/dit-platform"]
    if names:
        subprocess.run(["pm2", "restart", names[0], "--update-env"]); print("restarted via pm2:", names[0]); sys.exit(0)
except FileNotFoundError:
    pass
out = subprocess.run("systemctl list-units --type=service --no-legend | grep -iE 'dit|dream|next'", shell=True, capture_output=True, text=True).stdout.split()
if out:
    subprocess.run(["systemctl", "restart", out[0]]); print("restarted via systemd:", out[0]); sys.exit(0)
print("NO RESTART MECHANISM FOUND - restart the app manually"); sys.exit(2)
PY
}

rollback() {
  echo "!! ROLLBACK: $1"
  cd $APP
  for f in "${NEW_FILES[@]}"; do rm -f "$f"; done
  tar xzf $BK/src_public.tgz
  if [ -d $BK/next_dir ]; then rm -rf .next && cp -a $BK/next_dir .next; fi
  restart_app
  echo "rolled back to the state saved in $BK"
  exit 1
}

echo "== apply patch"
python3 $PACK/apply_stage1.py --apply || rollback "patch failed (see MISSING/PROBLEMS above)"
echo "== build"
npm run build 2>&1 | tail -40
[ ${PIPESTATUS[0]} -eq 0 ] || rollback "build failed"
echo "== restart"
restart_app || rollback "restart failed"
PORT=$(python3 - <<'PY'
import json, subprocess
try:
    j = json.loads(subprocess.run(["pm2", "jlist"], capture_output=True, text=True).stdout or "[]")
    for p in j:
        if p.get("pm2_env", {}).get("pm_cwd", "").rstrip("/") == "/opt/dit-platform":
            print(p["pm2_env"].get("env", {}).get("PORT") or p["pm2_env"].get("PORT") or 3000); break
    else: print(3000)
except Exception: print(3000)
PY
)
sleep 8
echo "== smoke test (port $PORT)"
python3 $PACK/smoke_stage1.py $PORT || rollback "smoke test failed"
echo
echo "STAGE 1 DEPLOYED OK. Backup kept in $BK (rollback: tar xzf $BK/src_public.tgz in $APP, restore next_dir, restart)."
