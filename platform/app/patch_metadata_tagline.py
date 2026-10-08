import sys

FILES = {
    "about": "src/app/(public)/about/page.tsx",
    "tanya": "src/app/(public)/tanya-samui/page.tsx",
    "reviews": "src/app/(public)/reviews/page.tsx",
    "partners": "src/app/(public)/partners/page.tsx",
    "footer": "src/app/(public)/_components/Footer.tsx",
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


# ---- about/page.tsx ----
do_replace(
    "about",
    'import Image from "next/image"\n'
    'import Link from "next/link"\n'
    'import { supabaseAdmin } from "@/lib/supabase-server"\n'
    'import { Icon } from "../_components/Icon"\n',
    'import Image from "next/image"\n'
    'import Link from "next/link"\n'
    'import type { Metadata } from "next"\n'
    'import { supabaseAdmin } from "@/lib/supabase-server"\n'
    'import { Icon } from "../_components/Icon"\n\n'
    'export const metadata: Metadata = {\n'
    '  title: "About | Dream Islands",\n'
    '  description: "Dream Islands is the outcome-driven wellness travel platform for Asia — baseline first, program match second, measured progress third.",\n'
    '  alternates: { canonical: "/about" },\n'
    '  openGraph: {\n'
    '    title: "About | Dream Islands",\n'
    '    description: "The outcome-driven wellness travel platform for Asia — baseline first, program match second, measured progress third.",\n'
    '    url: "https://dreamislands.org/about",\n'
    '  },\n'
    '}\n',
)

# ---- tanya-samui/page.tsx ----
do_replace(
    "tanya",
    'import Image from "next/image"\n'
    'import Link from "next/link"\n'
    'import { supabaseAdmin } from "@/lib/supabase-server"\n'
    'import { mapProgram, type DbProgramRow } from "../_lib/programMapping"\n'
    'import ProgramCard from "../_components/ProgramCard"\n'
    'import { ReviewCard, type Review } from "../_components/ReviewsSection"\n'
    'import { Icon } from "../_components/Icon"\n',
    'import Image from "next/image"\n'
    'import Link from "next/link"\n'
    'import type { Metadata } from "next"\n'
    'import { supabaseAdmin } from "@/lib/supabase-server"\n'
    'import { mapProgram, type DbProgramRow } from "../_lib/programMapping"\n'
    'import ProgramCard from "../_components/ProgramCard"\n'
    'import { ReviewCard, type Review } from "../_components/ReviewsSection"\n'
    'import { Icon } from "../_components/Icon"\n\n'
    'export const metadata: Metadata = {\n'
    '  title: "Tanya Samui Holistic Health Retreat | Dream Islands",\n'
    '  description: "Tanya Samui on Koh Samui, Thailand — one of the longest-standing properties in the Dream Islands network. Detox protocols, medical wellness, and signature programs since 2009.",\n'
    '  alternates: { canonical: "/tanya-samui" },\n'
    '  openGraph: {\n'
    '    title: "Tanya Samui Holistic Health Retreat | Dream Islands",\n'
    '    description: "Detox protocols, medical wellness, and signature programs on Koh Samui, Thailand, since 2009.",\n'
    '    url: "https://dreamislands.org/tanya-samui",\n'
    '  },\n'
    '}\n',
)

# ---- reviews/page.tsx ----
with open(FILES["reviews"], "r", encoding="utf-8") as f:
    pass
reviews_lines = data["reviews"].split("\n")
# find the import line for supabaseAdmin to anchor insertion
reviews_marker = 'import { supabaseAdmin } from "@/lib/supabase-server"\nimport { ReviewCard, type Review } from "../_components/ReviewsSection"\n'
if reviews_marker not in data["reviews"]:
    print("ERROR [reviews]: import marker not found")
    sys.exit(1)
reviews_new = (
    'import type { Metadata } from "next"\n'
    'import { supabaseAdmin } from "@/lib/supabase-server"\n'
    'import { ReviewCard, type Review } from "../_components/ReviewsSection"\n\n'
    'export const metadata: Metadata = {\n'
    '  title: "Guest Reviews | Dream Islands",\n'
    '  description: "Real guest stories from Dream Islands wellness journeys across Asia — outcomes, programs, and destinations.",\n'
    '  alternates: { canonical: "/reviews" },\n'
    '  openGraph: {\n'
    '    title: "Guest Reviews | Dream Islands",\n'
    '    description: "Real guest stories from Dream Islands wellness journeys across Asia.",\n'
    '    url: "https://dreamislands.org/reviews",\n'
    '  },\n'
    '}\n'
)
data["reviews"] = data["reviews"].replace(reviews_marker, reviews_new, 1)

# ---- partners/page.tsx ----
partners_marker = 'import Link from "next/link"\nimport { Icon } from "../_components/Icon"\n'
if partners_marker not in data["partners"]:
    print("ERROR [partners]: import marker not found")
    sys.exit(1)
partners_new = (
    'import Link from "next/link"\n'
    'import type { Metadata } from "next"\n'
    'import { Icon } from "../_components/Icon"\n\n'
    'export const metadata: Metadata = {\n'
    '  title: "Partnership / B2B / MICE | Dream Islands",\n'
    '  description: "Partner with Dream Islands — wellness property onboarding, B2B distribution, and MICE wellness programs across Asia.",\n'
    '  alternates: { canonical: "/partners" },\n'
    '  openGraph: {\n'
    '    title: "Partnership / B2B / MICE | Dream Islands",\n'
    '    description: "Wellness property onboarding, B2B distribution, and MICE wellness programs across Asia.",\n'
    '    url: "https://dreamislands.org/partners",\n'
    '  },\n'
    '}\n'
)
data["partners"] = data["partners"].replace(partners_marker, partners_new, 1)

# ---- Footer.tsx tagline ----
do_replace(
    "footer",
    "The AI-matched wellness travel platform for Asia. Baseline first, retreat\n"
    "            second, measured outcomes third.",
    "The wellness intelligence and travel platform for Asia. Baseline first.\n"
    "            Match intelligently. Measure what changed.",
)

for key, path in FILES.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(data[key])

print("PATCH_OK")
