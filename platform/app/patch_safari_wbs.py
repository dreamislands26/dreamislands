import sys

path = "src/app/(public)/start/AssessmentView.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()


def do_replace(old, new, count=1):
    global content
    found = content.count(old)
    if found < count:
        print(f"ERROR: expected >= {count} occurrences, found {found}: {old[:100]!r}")
        sys.exit(1)
    content = content.replace(old, new, count)


# 1. Remove autoFocus from the "Your name" contact field — the leading cause of
#    Safari mobile layout jank when the keyboard + autofill suggestion strip
#    animate in at the same time as the 100dvh container recalculates.
do_replace(
    '                  <input\n'
    '                    className="field"\n'
    '                    autoFocus\n'
    '                    placeholder="Alex Carter"\n'
    '                    value={contact.name}\n'
    '                    onChange={(e) => setContact({ ...contact, name: e.target.value })}\n'
    '                  />',
    '                  <input\n'
    '                    className="field"\n'
    '                    placeholder="Alex Carter"\n'
    '                    autoComplete="name"\n'
    '                    value={contact.name}\n'
    '                    onChange={(e) => setContact({ ...contact, name: e.target.value })}\n'
    '                    onFocus={(e) => e.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })}\n'
    '                  />',
)

# 2. WhatsApp field — add type="tel", inputMode, autoComplete, and scroll-into-view on focus.
do_replace(
    '                  <input\n'
    '                    className="field"\n'
    '                    placeholder="+65 9123 4567"\n'
    '                    value={contact.whatsapp}\n'
    '                    required\n'
    '                    onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}\n'
    '                  />',
    '                  <input\n'
    '                    className="field"\n'
    '                    type="tel"\n'
    '                    inputMode="tel"\n'
    '                    autoComplete="tel"\n'
    '                    placeholder="+65 9123 4567"\n'
    '                    value={contact.whatsapp}\n'
    '                    required\n'
    '                    onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}\n'
    '                    onFocus={(e) => e.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })}\n'
    '                  />',
)

# 3. Email field — add autoComplete + scroll-into-view.
do_replace(
    '                  <input\n'
    '                    className="field"\n'
    '                    type="email"\n'
    '                    placeholder="alex@example.com"\n'
    '                    value={contact.email}\n'
    '                    onChange={(e) => setContact({ ...contact, email: e.target.value })}\n'
    '                  />',
    '                  <input\n'
    '                    className="field"\n'
    '                    type="email"\n'
    '                    inputMode="email"\n'
    '                    autoComplete="email"\n'
    '                    placeholder="alex@example.com"\n'
    '                    value={contact.email}\n'
    '                    onChange={(e) => setContact({ ...contact, email: e.target.value })}\n'
    '                    onFocus={(e) => e.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })}\n'
    '                  />',
)

# 4. Country field — add autoComplete + scroll-into-view.
do_replace(
    '                  <input\n'
    '                    className="field"\n'
    '                    placeholder="Singapore"\n'
    '                    value={contact.country}\n'
    '                    onChange={(e) => setContact({ ...contact, country: e.target.value })}\n'
    '                  />',
    '                  <input\n'
    '                    className="field"\n'
    '                    placeholder="Singapore"\n'
    '                    autoComplete="country-name"\n'
    '                    value={contact.country}\n'
    '                    onChange={(e) => setContact({ ...contact, country: e.target.value })}\n'
    '                    onFocus={(e) => e.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })}\n'
    '                  />',
)

# 5. Give the scroller extra bottom padding so the submit button + scroll-into-view
#    margin stays clear of the keyboard/autofill strip on iOS Safari.
do_replace(
    '          padding: "0 var(--pad) 32px",\n'
    '          maxWidth: 560,',
    '          padding: "0 var(--pad) 120px",\n'
    '          maxWidth: 560,',
)

# 6. Add a small-viewport-height fallback alongside 100dvh for older Safari that
#    doesn't support dvh units reliably.
do_replace(
    '<div className="page" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>',
    '<div className="page" style={{ minHeight: "100svh", display: "flex", flexDirection: "column" }}>',
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("PATCH_OK")
