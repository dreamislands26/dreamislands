import re, sys

path = "src/app/(public)/tanya-samui/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

BASE = "https://xbzrtofanbrahasxbisf.supabase.co/storage/v1/object/public/properties/tanya-samui"

new_gallery_items = [
    ("guests-warm-welcome.jpg", "A warm welcome"),
    ("guests-foot-soak-trio.jpg", "Foot-soak ritual"),
    ("tanya-oil-jars.jpg", "The Tanya Oil blend"),
    ("facility-signage.jpg", "Tanya Samui campus"),
    ("buddha-courtyard.jpg", "Courtyard shrine"),
    ("bamboo-courtyard-tea.jpg", "Tea in the bamboo courtyard"),
    ("guests-face-mask.jpg", "Herbal face treatments"),
    ("guests-foot-soak-group.jpg", "Group foot-soak ritual"),
    ("wellness-soup-menu.jpg", "The wellness soup menu"),
    ("lounge-interior.jpg", "Lounge"),
    ("group-guests-reunion.jpg", "Guests together"),
    ("sunset-palms.jpg", "Sunset over the palms"),
    ("buddha-lily-pond.jpg", "Lily pond shrine"),
    ("tanya-eatery-buffet.jpg", "Tanya Eatery"),
    ("fitness-gym.jpg", "Fitness studio"),
]

gallery_lines = "\n".join(
    f'    {{ url: "{BASE}/gallery/{fname}", caption: "{caption}" }},'
    for fname, caption in new_gallery_items
)

marker = '{ url: "https://xbzrtofanbrahasxbisf.supabase.co/storage/v1/object/public/properties/tanya-samui/gallery/relax-zone.jpg", caption: "Relax zone" },\n]'
if marker not in content:
    print("ERROR: GALLERY marker not found")
    sys.exit(1)
content = content.replace(marker, marker.replace("\n]", "\n" + gallery_lines + "\n]"), 1)

social_proof_items = [
    ("day2-collage.jpg", "@dreamislands_travel", "Day 2 at Tanya Samui"),
    ("day-pool-cabana.jpg", "@ericahau883", "Poolside at Tanya Samui"),
    ("sound-healing.jpg", "@dreamislands_travel", "Sound bowl healing session"),
    ("day1-collage.jpg", "@dreamislands_travel", "Day 1 at Tanya Samui"),
    ("day4-richandfe.jpg", "@richandfe", "Day 4: Detox at Tanya Samui"),
    ("three-friends.jpg", "@dreamislands_travel", "Tanya Samui"),
    ("day8-richandfe.jpg", "@richandfe", "Day 8 at Tanya Samui"),
    ("facility-tour-richandfe.jpg", "@richandfe", "Facility tour"),
    ("arjanstrainhunter.jpg", "@arjanstrainhunter", "At the entrance"),
    ("erictansq.jpg", "@erictansq", "Group photo"),
    ("tuonglinh-review.jpg", "@tuonglinh.official", "Guest review"),
    ("ericahau883.jpg", "@ericahau883", "Poolside pose"),
    ("vidialdiano-review.jpg", "@vidialdiano", "5-star review"),
    ("vidialdiano-fivestar.jpg", "@vidialdiano", "Courtyard review"),
    ("laurinda-ho-walk.jpg", "@laurinda_ho", "Tanya Samui"),
    ("catrynaaa.jpg", "@catrynaaa_", "Garden path"),
    ("tuonglinh-sunset.jpg", "@tuonglinh.official", "Sunset at the retreat"),
    ("laurinda-ho-oil.jpg", "@laurinda_ho", "The Tanya Oil ritual"),
    ("laurinda-ho-group.jpg", "@laurinda_ho", "Foot-soak with friends"),
    ("laurinda-ho-pool-leaf.jpg", "@laurinda_ho", "Poolside calm"),
    ("laurinda-ho-fountain.jpg", "@laurinda_ho", "By the fountain"),
]

sp_lines = "\n".join(
    f'    {{ url: "{BASE}/social-proof/{fname}", handle: "{handle}", caption: "{caption}" }},'
    for fname, handle, caption in social_proof_items
)
social_proof_const = "\nconst SOCIAL_PROOF = [\n" + sp_lines + "\n]\n"

anchor2 = "\nexport default async function TanyaSamuiHub() {"
if anchor2 not in content:
    print("ERROR: function anchor not found")
    sys.exit(1)
content = content.replace(anchor2, social_proof_const + anchor2, 1)

founder_marker = "      {/* FOUNDER */}"
if founder_marker not in content:
    print("ERROR: FOUNDER marker not found")
    sys.exit(1)

social_section = '''      {/* SOCIAL PROOF */}
      <section className="shell" style={{ paddingTop: 64 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Social proof</div>
            <h2>As seen <span className="display-italic">on Instagram</span>.</h2>
          </div>
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {SOCIAL_PROOF.map((s) => (
            <div key={s.url} style={{ position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "4 / 5" }}>
              <Image src={s.url} alt={s.caption} fill sizes="(max-width: 768px) 50vw, 20vw" style={{ objectFit: "cover" }} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.65) 100%)",
                }}
              />
              <div style={{ position: "absolute", bottom: 10, left: 12, right: 12, color: "#fff" }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{s.handle}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>{s.caption}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

''' + founder_marker

content = content.replace(founder_marker, social_section, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("PATCH_OK")
