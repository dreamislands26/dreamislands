# Dream Islands Travel (DIT) platform

One Next.js frontend, Supabase as the source of truth. EN/global is the primary market. RU is a locale of the same app (not a separate engine).

## Layout

| Path | What it is |
|---|---|
| `app/` | The Next.js 16 application (production: `/opt/dit-platform` on the EN VPS, pm2 app `dit`) |
| `tools/stage1/` | Deploy, repair and smoke tooling used for Stage 1, plus the Stage 1 source files |
| `docs/` | Specs and rules: event-driven rebuild, entity aggregation layer, media publication rules |
| `legacy/ru/` | Static RU generators (`build_ru_all.py` etc.). Legacy until RU becomes a locale of `app/`. No new features here |

## Principles

- Supabase is the source of truth. Published entities propagate to every frontend; unpublish removes them.
- Counters, sitemap, country routes and heroes come from the database. No hardcoded inventory.
- One hero resolver: program own, own property, neutral country hero, global. Never another property's photo.
- New public code reads through the anon RLS client (`src/lib/supabase-public.ts`). Do not extend service-role usage.
- Wellness matching (WS result) shows wellness programs only. Medical pathway is a separate layer, not a price competitor.
- Every change is made once, in this codebase, and must be compatible with all locales.

## Environment

Copy `app/.env.example` to `app/.env.local` and fill in the values. Real values are never committed.

## Deploy (EN VPS)

One command at a time, never two builds at once.

1. Edit source in `/opt/dit-platform` (or apply a patch script from `tools/stage1/`).
2. `npx tsc --noEmit`
3. `pgrep -af 'next build'` must print nothing.
4. `bash tools/stage1/repair_stage1.sh build` (backup, build, pm2 restart, smoke; restores `.next` on failure).
5. `bash tools/stage1/repair_stage1.sh smoke` against the running app.

`tools/stage1/deploy_stage1.sh` is disabled on purpose (unsafe rollback logic).

## Status

Stage 1 done: DB-driven counters, unified hero resolver, DB-driven `/sitemap.xml`, country routes from `destination_countries`, wellness/clinic separation on country pages, wellness-only top-3 in WS matching.
