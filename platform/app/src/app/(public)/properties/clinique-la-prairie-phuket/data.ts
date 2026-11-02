import "server-only";
import { supabasePublic } from "@/lib/supabase-public";

// Content for this page lives in Supabase:
//   properties.translations.en.page   (copy, opening state, proof, FAQ)
//   properties.translations.onboarding (inventory, brochure facts)
//   programs.translations.en.page     (card tag, duration label, matcher label, featured)
//   programs.translations.supplier    (CHF starting_from, mirrors program_rates)
// Editing those rows updates the page without a deploy (ISR, 5 min).

export const PROPERTY_SLUG = "clinique-la-prairie-phuket";

export type ClpProgram = {
  slug: string;
  name: string;
  order: number;
  tag: string;
  durationLabel: string;
  cardSummary: string;
  matcherLabel: string | null;
  featured: boolean;
  badge: string | null;
  durationNote: string | null;
  priceChf: number | null;
  ctaType: string | null;
  href: string;
};

export type FaqItem = { q: string; a: string };

export type ClpPage = {
  name: string;
  location: string;
  description: string;
  seoTitle: string;
  metaDescription: string;
  openingStatus: string;
  openingBadge: string;
  openingLine: string;
  bookingEnabled: boolean;
  heroEyebrow: string;
  heroTagline: string;
  heroSubhead: string;
  statementTitle: string;
  statement: string;
  proof: { value: string; label: string }[];
  assessmentAreas: string[];
  infrastructure: string[];
  trisaraNote: string | null;
  faq: FaqItem[];
  inventory: { key: string; label: string; sqm: number; units: number }[];
  villasTotal: number;
  airportKm: number | null;
  airportMin: number | null;
  restaurant: string | null;
  programs: ClpProgram[];
  minPriceChf: number | null;
  maxPriceChf: number | null;
  images: Record<string, ClpImage>;
};

export type ClpImage = { src: string; alt: string; w: number; h: number };

// Bundled defaults (brochure extraction, architectural visualisations).
// Override any slot from Supabase: properties.translations.en.page.images.<slot> = {src, alt, w, h}
const DIR = "/images/clp-phuket";
const VIS = " (architectural visualisation)";
export const DEFAULT_IMAGES: Record<string, ClpImage> = {
  hero: { src: `${DIR}/hero-lake-landmark.webp`, alt: "Lake pavilion at Clinique La Prairie Phuket, Tri Vananda" + VIS, w: 1182, h: 1477 },
  statement: { src: `${DIR}/aerial-resort.webp`, alt: "Aerial view of Tri Vananda lakes and forest, Phuket" + VIS, w: 1182, h: 609 },
  assessment: { src: `${DIR}/assessment-dna.webp`, alt: "Abstract DNA strand representing the Longevity Master Assessment", w: 1200, h: 1260 },
  pillar_medical: { src: `${DIR}/lakeside-building.webp`, alt: "Lakeside medical building at Clinique La Prairie Phuket" + VIS, w: 1182, h: 639 },
  pillar_nutrition: { src: `${DIR}/cuisine-plate.webp`, alt: "Plated vegetable dish from the programme menu", w: 1181, h: 502 },
  pillar_movement: { src: `${DIR}/movement-studio.webp`, alt: "Reformer movement studio overlooking the lake" + VIS, w: 1182, h: 503 },
  pillar_wellbeing: { src: `${DIR}/hydrotherapy.webp`, alt: "Indoor hydrotherapy pool" + VIS, w: 1181, h: 502 },
  infrastructure: { src: `${DIR}/main-building-lake.webp`, alt: "Main building across the lake at Tri Vananda" + VIS, w: 1587, h: 992 },
  break: { src: `${DIR}/property-landscape.webp`, alt: "Tropical landscape and lake at Tri Vananda, Phuket" + VIS, w: 2000, h: 1250 },
  setting: { src: `${DIR}/lakeside-villas.webp`, alt: "Lakeside villas and pool at Tri Vananda" + VIS, w: 1182, h: 1477 },
  villas: { src: `${DIR}/villa-lounge.webp`, alt: "Villa living area" + VIS, w: 1182, h: 545 },
  villa_signature: { src: `${DIR}/signature-villa.webp`, alt: "Signature Villa with private pool" + VIS, w: 579, h: 609 },
  villa_grand: { src: `${DIR}/grand-villa.webp`, alt: "Grand Villa on the water" + VIS, w: 603, h: 609 },
  villa_royal: { src: `${DIR}/royal-villa.webp`, alt: "Royal Villa with pavilion and pool" + VIS, w: 910, h: 729 },
  nutrition: { src: `${DIR}/seeds-restaurant.webp`, alt: "SEEDS restaurant interior" + VIS, w: 1182, h: 545 },
  final: { src: `${DIR}/arrival-architecture.webp`, alt: "Arrival pavilion and water courtyard" + VIS, w: 2000, h: 1250 },
};

const stripSuffix = (n: string) => n.replace(/\s+[—–-]\s+Clinique La Prairie Phuket$/i, "").trim();

export async function getClpPage(): Promise<ClpPage | null> {
  const sb = supabasePublic;

  const { data: prop } = await sb
    .from("properties")
    .select("id, name, island, country, description, translations, active")
    .eq("slug", PROPERTY_SLUG)
    .maybeSingle();
  if (!prop || prop.active === false) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- free-form jsonb content
  const t = (prop.translations ?? {}) as any;
  const en = t.en ?? {};
  const page = en.page ?? {};
  const ob = t.onboarding ?? {};
  const facts = ob.brochure_facts ?? {};
  const inv = ob.inventory ?? {};

  const { data: progs } = await sb
    .from("programs")
    .select("id, slug, name, active, status, cta_type, translations")
    .like("slug", "clp-phuket-%")
    .eq("active", true)
    .eq("status", "published");

  // Supplier CHF starting rate. Source of truth: price_points (source = 'supplier', anon-readable), the same
  // row the programme page and sync_supplier_program_prices() use. translations.supplier.starting_from is
  // only a fallback so the page keeps working if a price_points row is missing.
  const ids = (progs ?? []).map((p: { id: string }) => p.id);
  const chfById = new Map<string, number>();
  if (ids.length) {
    const { data: pts } = await sb
      .from("price_points")
      .select("entity_id, amount, currency")
      .eq("entity_type", "program")
      .eq("tier", "base")
      .eq("source", "supplier")
      .eq("currency", "CHF")
      .in("entity_id", ids);
    for (const r of (pts ?? []) as { entity_id: string; amount: number | string }[]) chfById.set(r.entity_id, Number(r.amount));
  }

  const programs: ClpProgram[] = (progs ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- free-form jsonb content
    .map((p: any) => {
      const pe = p.translations?.en ?? {};
      const pp = pe.page ?? {};
      const sup = p.translations?.supplier ?? {};
      const amount = chfById.get(p.id) ?? (sup.currency === "CHF" && sup.starting_from ? Number(sup.starting_from) : null);
      const rate = amount ? { amount } : null;
      return {
        slug: p.slug,
        name: pe.name || stripSuffix(p.name),
        order: pp.order ?? 99,
        tag: pp.tag ?? "",
        durationLabel: pp.duration_label ?? "",
        cardSummary: pp.card_summary ?? pe.description ?? "",
        matcherLabel: pp.matcher_label ?? null,
        featured: !!pp.featured,
        badge: pp.badge ?? null,
        durationNote: pp.duration_note ?? null,
        priceChf: rate ? Number(rate.amount) : null,
        ctaType: p.cta_type ?? null,
        href: `/programs/${p.slug}`,
      };
    })
    .sort((a: ClpProgram, b: ClpProgram) => a.order - b.order);

  const prices = programs.map((p) => p.priceChf).filter((n): n is number => n != null);

  const label: Record<string, string> = { signature: "Signature Villa", grand: "Grand Villa", royal: "Royal Villa" };
  const inventory = ["signature", "grand", "royal"]
    .filter((k) => inv[k])
    .map((k) => ({ key: k, label: label[k], sqm: inv[k].sqm, units: inv[k].units }));

  return {
    name: en.name || prop.name,
    location: en.location || `${prop.island}, ${prop.country}`,
    description: en.description || prop.description || "",
    seoTitle: page.seo_title || `${prop.name} | Longevity Programs & Prices`,
    metaDescription: page.meta_description || prop.description || "",
    openingStatus: ob.opening_status || "pre_opening",
    openingBadge: page.opening_badge || "Pre-opening",
    openingLine: page.opening_line || "",
    bookingEnabled: !!page.commercial_booking_enabled,
    heroEyebrow: page.hero_eyebrow || "Clinique La Prairie · Phuket",
    heroTagline: page.hero_tagline || "Medical longevity in Phuket",
    heroSubhead: page.hero_subhead || "",
    statementTitle: page.statement_title || "",
    statement: page.statement || "",
    proof: page.proof || [],
    assessmentAreas: page.assessment_areas || [],
    infrastructure: page.infrastructure || [],
    trisaraNote: page.trisara_note || null,
    faq: page.faq || [],
    inventory,
    villasTotal: facts.villas_total ?? inventory.reduce((s, v) => s + v.units, 0),
    airportKm: facts.airport_km ?? null,
    airportMin: facts.airport_min ?? null,
    restaurant: facts.restaurant ?? null,
    programs,
    minPriceChf: prices.length ? Math.min(...prices) : null,
    maxPriceChf: prices.length ? Math.max(...prices) : null,
    images: { ...DEFAULT_IMAGES, ...(page.images ?? {}) },
  };
}

export const chf = (n: number | null) => (n == null ? "on request" : `CHF ${n.toLocaleString("en-US")}`);
