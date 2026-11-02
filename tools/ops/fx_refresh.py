#!/usr/bin/env python3
"""Daily FX refresh for Dream Islands multi-currency prices.
Source: Frankfurter (ECB reference rates, no key). Writes public.fx_rates (per 1 USD).
Safety: keeps the old rate if a new one is missing or moves more than 15% in a day.
Env: reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the process env or /opt/dit-platform/.env.local
Usage: python3 fx_refresh.py          (cron: 20 1 * * * /usr/bin/python3 /root/fx_refresh.py >> /var/log/fx_refresh.log 2>&1)"""
import json, os, sys, urllib.request

CCY = ["EUR", "SGD", "THB", "CNY", "IDR", "CHF"]
ENV_FILE = "/opt/dit-platform/.env.local"


def env(name):
    if os.environ.get(name):
        return os.environ[name]
    try:
        for line in open(ENV_FILE):
            if line.startswith(name + "="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    except OSError:
        pass
    sys.exit(f"missing {name}")


def call(url, data=None, headers=None, method=None):
    h = {"User-Agent": "DreamIslands-fx/1.0 (+https://dreamislands.org)", "Accept": "application/json"}
    h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read()
        return json.loads(body) if body else None


base = env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
key = env("SUPABASE_SERVICE_ROLE_KEY")
H = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}

fx = call(f"https://api.frankfurter.dev/v1/latest?base=USD&symbols={','.join(CCY)}")
rates, day = fx["rates"], fx["date"]
old = {r["currency"]: float(r["per_usd"]) for r in call(f"{base}/rest/v1/fx_rates?select=currency,per_usd", headers=H)}

rows = []
for c in CCY:
    new = rates.get(c)
    if not new:
        print(f"skip {c}: not in response")
        continue
    if c in old and abs(new / old[c] - 1) > 0.15:
        print(f"skip {c}: {old[c]} -> {new} moves more than 15%, check manually")
        continue
    rows.append({"currency": c, "per_usd": new, "source": "frankfurter", "rate_date": day, "fetched_at": "now()"})

if not rows:
    sys.exit("nothing to update")
for r in rows:
    r["fetched_at"] = __import__("datetime").datetime.utcnow().isoformat() + "Z"
call(f"{base}/rest/v1/fx_rates?on_conflict=currency", data=json.dumps(rows).encode(),
     headers={**H, "Prefer": "resolution=merge-duplicates,return=minimal"}, method="POST")
print(day, {r["currency"]: r["per_usd"] for r in rows})

# re-derive programs.price_usd / price_thb for programs priced by the supplier in another currency (e.g. CHF)
n = call(f"{base}/rest/v1/rpc/sync_supplier_program_prices", data=b"{}", headers=H, method="POST")
print("supplier-priced programs updated:", n)
