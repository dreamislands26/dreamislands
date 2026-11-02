#!/usr/bin/env python3
"""Clinique La Prairie Phuket: download official images, upload to Supabase Storage (bucket `ecosystem`, folder clp-phuket/),
create media_assets rows, set hero images, then publish property + programs (pre-opening).
Idempotent. Run on the VPS:  python3 /root/clp_media_and_publish.py            (media + publish)
                              python3 /root/clp_media_and_publish.py --no-publish
Reads NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from env or /opt/dit-platform/.env.local"""
import json, os, sys, urllib.request, urllib.error, datetime

ENV_FILE = "/opt/dit-platform/.env.local"
PARTNER = "36ea7497-4d85-4ebf-8a57-325d3c609bd3"
PROP_SLUG = "clinique-la-prairie-phuket"
BUCKET = "ecosystem"
PUBLISH = "--no-publish" not in sys.argv

IMAGES = [  # (url, file name, alt)
    ("https://cliniquelaprairie.com/wp-content/uploads/2026/04/Phuket-Thailand-Clinique-La-Prairie-55.jpg", "resort-lake-view.jpg", "Clinique La Prairie Phuket at Tri Vananda: resort and lake (architectural visualisation)"),
    ("https://cliniquelaprairie.com/wp-content/uploads/2026/04/Phuket-Thailand-Clinique-La-Prairie-56.jpg", "resort-landscape.jpg", "Clinique La Prairie Phuket: forest and lake setting (architectural visualisation)"),
    ("https://cliniquelaprairie.com/wp-content/uploads/2026/07/Signature-Villa_Clinique-La-Prairie-Phuket.jpg", "signature-villa.jpg", "Signature private pool villa, Clinique La Prairie Phuket (architectural visualisation)"),
    ("https://cliniquelaprairie.com/wp-content/uploads/2026/07/Grand-Villa_Exterior_Clinique-La-Prairie-Phuket.jpg", "grand-villa.jpg", "Grand private pool villa, Clinique La Prairie Phuket (architectural visualisation)"),
    ("https://cliniquelaprairie.com/wp-content/uploads/2026/07/Royal-Villa_Exterior-2_Clinique-La-Prairie-Phuket.jpg", "royal-villa.jpg", "Royal villa, Clinique La Prairie Phuket (architectural visualisation)"),
    ("https://cliniquelaprairie.com/wp-content/uploads/2026/04/Phuket-Thailand-Clinique-La-Prairie-66.jpg", "resort-grounds.jpg", "Clinique La Prairie Phuket grounds (architectural visualisation)"),
]
UA = "Mozilla/5.0 (compatible; DreamIslands/1.0; +https://dreamislands.org)"


def env(name):
    if os.environ.get(name):
        return os.environ[name]
    for line in open(ENV_FILE):
        if line.startswith(name + "="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit(f"missing {name}")


base = env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
key = env("SUPABASE_SERVICE_ROLE_KEY")
H = {"apikey": key, "Authorization": f"Bearer {key}"}


def req(url, data=None, headers=None, method=None):
    r = urllib.request.Request(url, data=data, headers={**H, **(headers or {})}, method=method)
    with urllib.request.urlopen(r, timeout=60) as resp:
        b = resp.read()
        return json.loads(b) if b and resp.headers.get("content-type", "").startswith("application/json") else b


def rest(path, data=None, method=None, prefer=None):
    h = {"Content-Type": "application/json"}
    if prefer:
        h["Prefer"] = prefer
    return req(f"{base}/rest/v1/{path}", data=json.dumps(data).encode() if data is not None else None, headers=h, method=method)


prop = rest(f"properties?slug=eq.{PROP_SLUG}&select=id")[0]["id"]
programs = rest(f"programs?operator_partner_id=eq.{PARTNER}&select=id,slug&order=sort_order,slug")

urls = []
for src, name, alt in IMAGES:
    path = f"clp-phuket/{name}"
    try:
        dl = urllib.request.Request(src, headers={"User-Agent": UA, "Accept": "image/*"})
        img = urllib.request.urlopen(dl, timeout=60).read()
        req(f"{base}/storage/v1/object/{BUCKET}/{path}", data=img, headers={"Content-Type": "image/jpeg", "x-upsert": "true"}, method="POST")
        pub = f"{base}/storage/v1/object/public/{BUCKET}/{path}"
        urls.append((pub, path, alt))
        print("ok", name, len(img) // 1024, "KB")
    except Exception as e:  # keep going; report
        print("FAIL", name, e)
if not urls:
    sys.exit("no images uploaded; nothing changed")

# media_assets for the property (replace previous CLP rows)
rest(f"media_assets?property_id=eq.{prop}&bucket=eq.{BUCKET}&path=like.clp-phuket/*", method="DELETE")
rows = [{"bucket": BUCKET, "path": p, "public_url": u, "asset_type": "gallery" if i else "hero", "property_id": prop,
         "is_featured": i == 0, "sort_order": i + 1, "active": True, "alt_en": a} for i, (u, p, a) in enumerate(urls)]
rest("media_assets", rows, "POST", "return=minimal")
rest(f"properties?id=eq.{prop}", {"image_url": urls[0][0]}, "PATCH", "return=minimal")

# program heroes: cycle through the images, one media_assets hero row each
for i, pr in enumerate(programs):
    u, p, a = urls[i % len(urls)]
    # media_assets has UNIQUE(bucket, path): the images are already registered under the property; programs just point at the URL
    rest(f"programs?id=eq.{pr['id']}", {"hero_image_url": u}, "PATCH", "return=minimal")
print("media wired:", len(urls), "images,", len(programs), "programs")

if PUBLISH:
    now = datetime.datetime.utcnow().isoformat() + "Z"
    rest(f"properties?id=eq.{prop}", {"active": True}, "PATCH", "return=minimal")
    rest(f"programs?operator_partner_id=eq.{PARTNER}", {"status": "published", "active": True, "published_at": now}, "PATCH", "return=minimal")
    print("published property + programs")
