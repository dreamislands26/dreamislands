#!/bin/bash
# Run on the EN VPS: bash /root/stage1_pack/repair_stage1.sh [status|smoke|repair|build]
#   status : read-only report (which Stage 1 files exist, which patches are in src, what the running build is)
#   smoke  : runs the smoke test against the RUNNING app (changes nothing)
#   repair : restores missing Stage 1 source files from the pack, then type-checks (npx tsc --noEmit). Does NOT touch .next or restart.
#   build  : backup (aborts if the backup fails) -> npm run build -> pm2 restart -> smoke. Restores .next on failure.
PACK=$(cd "$(dirname "$0")" && pwd)
APP=/opt/dit-platform
MODE=${1:-status}
cd $APP || exit 1
NEW=("src/lib/supabase-public.ts" "src/lib/stats.ts" "src/lib/hero.ts" "src/app/sitemap.ts" "src/app/sitemap-static.ts" "src/app/(public)/_lib/programMappingResolved.ts")

port() { python3 - <<'PY'
import json, subprocess
try:
    j = json.loads(subprocess.run(["pm2", "jlist"], capture_output=True, text=True).stdout or "[]")
    for p in j:
        if p.get("pm2_env", {}).get("pm_cwd", "").rstrip("/") == "/opt/dit-platform":
            print(p["pm2_env"].get("env", {}).get("PORT") or p["pm2_env"].get("PORT") or 3000); break
    else: print(3000)
except Exception: print(3000)
PY
}

status() {
  echo "== new Stage 1 files in src:"
  for f in "${NEW[@]}"; do [ -e "$f" ] && echo "   present  $f" || echo "   MISSING  $f"; done
  echo "== patches in src (files importing mapProgramsResolved): $(grep -rl 'mapProgramsResolved' src --include=*.tsx --include=*.ts | grep -vc 'programMappingResolved.ts')"
  echo "== files still on plain mapProgram: $(grep -rlE '\.map\(mapProgram\)' src --include=*.tsx --include=*.ts | wc -l)"
  echo "== HomeView takes stats: $(grep -c 'stats: CatalogStats' 'src/app/(public)/_components/HomeView.tsx')"
  echo "== proxy has /sitemap.xml: $(grep -c '/sitemap.xml' src/proxy.ts)"
  echo "== public/sitemap.xml: $([ -e public/sitemap.xml ] && echo 'EXISTS (conflicts with sitemap.ts)' || echo 'absent (ok)')"
  echo "== .next build time: $(stat -c %y .next/BUILD_ID 2>/dev/null)   newest src file: $(find src -type f -printf '%TY-%Tm-%Td %TH:%TM %p\n' | sort | tail -1)"
  echo "== backups: $(ls -d /root/stage1_backup_* 2>/dev/null | tr '\n' ' ')"
}

case "$MODE" in
  status) status ;;
  smoke) python3 $PACK/smoke_stage1.py $(port) ;;
  repair)
    for f in "${NEW[@]}"; do
      if [ ! -e "$f" ]; then mkdir -p "$(dirname "$f")"; cp "$PACK/$f" "$f" && echo "restored $f"; fi
    done
    [ -e public/sitemap.xml ] && { mv public/sitemap.xml /root/old_public_sitemap.xml && echo "moved public/sitemap.xml -> /root/old_public_sitemap.xml"; }
    echo "== type-check (does not touch the running app)"
    npx tsc --noEmit 2>&1 | head -40
    echo "tsc exit: ${PIPESTATUS[0]}"
    status
    ;;
  build)
    if pgrep -f '[n]ext build' >/dev/null; then echo "!! a next build is already running - aborting, nothing changed"; pgrep -af '[n]ext build'; exit 1; fi
    TS=$(date +%Y%m%d_%H%M%S); BK=/root/stage1_backup_$TS; mkdir -p $BK
    tar czf $BK/src.tgz src || { echo "!! backup failed - aborting, nothing changed"; exit 1; }
    cp -a .next $BK/next_dir || { echo "!! .next backup failed - aborting"; exit 1; }
    echo "backup ok: $BK"
    if ! npm run build 2>&1 | tail -30; then :; fi
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
      echo "!! build failed - restoring previous .next"; rm -rf .next; cp -a $BK/next_dir .next; exit 1
    fi
    pm2 restart dit --update-env >/dev/null 2>&1 || pm2 restart all --update-env >/dev/null 2>&1
    sleep 8
    python3 $PACK/smoke_stage1.py $(port) || { echo "!! smoke failed - restoring previous .next"; rm -rf .next; cp -a $BK/next_dir .next; pm2 restart dit --update-env >/dev/null 2>&1; exit 1; }
    echo "BUILD + SMOKE OK (backup in $BK)"
    ;;
  *) echo "usage: $0 status|smoke|repair|build" ;;
esac
