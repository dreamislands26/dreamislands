import sys

FILES = {
    "proxy": "src/proxy.ts",
    "about": "src/app/(public)/about/page.tsx",
    "tanya": "src/app/(public)/tanya-samui/page.tsx",
    "reviews": "src/app/(public)/reviews/page.tsx",
    "partners": "src/app/(public)/partners/page.tsx",
    "guide": "src/app/(public)/guides/burnout-recovery-retreats-southeast-asia/page.tsx",
}

data = {}
for key, path in FILES.items():
    with open(path, "r", encoding="utf-8") as f:
        data[key] = f.read()


def do_replace(key, old, new, count=1):
    text = data[key]
    found = text.count(old)
    if found < count:
        print(f"ERROR [{key}]: expected >= {count} occurrences, found {found}: {old[:100]!r}")
        sys.exit(1)
    data[key] = text.replace(old, new, count)


# ---- proxy.ts: add /guides to both allowlists ----
do_replace(
    "proxy",
    'const PUBLIC_PATHS = [\n'
    '  "/",\n'
    '  "/login",\n'
    '  "/start",\n'
    '  "/matched",\n'
    '  "/programs",\n'
    '  "/properties",\n'
    '  "/reviews",\n'
    '  "/tanya-samui",\n'
    '  "/about",\n'
    '  "/partners",\n',
    'const PUBLIC_PATHS = [\n'
    '  "/",\n'
    '  "/login",\n'
    '  "/start",\n'
    '  "/matched",\n'
    '  "/programs",\n'
    '  "/properties",\n'
    '  "/reviews",\n'
    '  "/tanya-samui",\n'
    '  "/about",\n'
    '  "/partners",\n'
    '  "/guides",\n',
)

do_replace(
    "proxy",
    'const PUBLIC_HOST_ALLOWED = [\n'
    '  "/",\n'
    '  "/start",\n'
    '  "/matched",\n'
    '  "/programs",\n'
    '  "/properties",\n'
    '  "/reviews",\n'
    '  "/tanya-samui",\n'
    '  "/about",\n'
    '  "/partners",\n',
    'const PUBLIC_HOST_ALLOWED = [\n'
    '  "/",\n'
    '  "/start",\n'
    '  "/matched",\n'
    '  "/programs",\n'
    '  "/properties",\n'
    '  "/reviews",\n'
    '  "/tanya-samui",\n'
    '  "/about",\n'
    '  "/partners",\n'
    '  "/guides",\n',
)

# ---- fix doubled title suffixes (root layout already templates "%s | Dream Islands") ----
do_replace("about", 'title: "About | Dream Islands",', 'title: "About",')
do_replace("tanya", 'title: "Tanya Samui Holistic Health Retreat | Dream Islands",', 'title: "Tanya Samui Holistic Health Retreat",')
do_replace("reviews", 'title: "Guest Reviews | Dream Islands",', 'title: "Guest Reviews",')
do_replace("partners", 'title: "Partnership / B2B / MICE | Dream Islands",', 'title: "Partnership / B2B / MICE",')
do_replace(
    "guide",
    'title: "Burnout Recovery Retreats in Southeast Asia | Dream Islands",',
    'title: "Burnout Recovery Retreats in Southeast Asia",',
)

for key, path in FILES.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(data[key])

print("PATCH_OK")
