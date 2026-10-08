import sys

# ---- sitemap.xml ----
sm_path = "public/sitemap.xml"
with open(sm_path, "r", encoding="utf-8") as f:
    sm = f.read()

sm_marker = '  <url><loc>https://dreamislands.org/tanya-samui/wellness-menu</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n'
if sm_marker not in sm:
    print("ERROR: sitemap marker not found")
    sys.exit(1)
new_entry = '  <url><loc>https://dreamislands.org/guides/burnout-recovery-retreats-southeast-asia</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n'
sm = sm.replace(sm_marker, sm_marker + new_entry, 1)

# ---- Footer.tsx ----
footer_path = "src/app/(public)/_components/Footer.tsx"
with open(footer_path, "r", encoding="utf-8") as f:
    footer = f.read()

footer_marker = (
    '  const exploreLinks: Link[] = [\n'
    '    { href: "/properties", label: "Destinations" },\n'
    '    { href: "/properties", label: "Properties" },\n'
    '    { href: "/programs", label: "Programs" },\n'
    '    { href: "/#tracks", label: "Key Outcomes" },\n'
    '    { href: "/partners", label: "Partnership / B2B / MICE" },\n'
    '  ]\n'
)
if footer_marker not in footer:
    print("ERROR: footer marker not found")
    sys.exit(1)
new_footer = (
    '  const exploreLinks: Link[] = [\n'
    '    { href: "/properties", label: "Destinations" },\n'
    '    { href: "/properties", label: "Properties" },\n'
    '    { href: "/programs", label: "Programs" },\n'
    '    { href: "/#tracks", label: "Key Outcomes" },\n'
    '    { href: "/guides/burnout-recovery-retreats-southeast-asia", label: "Burnout Recovery Guide" },\n'
    '    { href: "/partners", label: "Partnership / B2B / MICE" },\n'
    '  ]\n'
)
footer = footer.replace(footer_marker, new_footer, 1)

with open(sm_path, "w", encoding="utf-8") as f:
    f.write(sm)
with open(footer_path, "w", encoding="utf-8") as f:
    f.write(footer)

print("PATCH_OK")
