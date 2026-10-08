import { supabaseAdmin } from "@/lib/supabase-server"
import PricingGapsView, { type PricingGapRow } from "./PricingGapsView"

export const dynamic = "force-dynamic"

type RawProperty = { id: string; name: string; country: string | null; island: string | null }
type RawVariant = {
  id: string
  duration_days: number | null
  duration_nights: number | null
  price_basic_thb: number | null
  active: boolean
  created_at: string
}
type RawProgram = {
  id: string
  name: string
  slug: string | null
  duration_days: number | null
  created_at: string
  program_properties: Array<{ properties: RawProperty | null }>
  program_variants: RawVariant[]
}

export default async function PricingGapsPage() {
  const { data: programs } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, duration_days, active, created_at, " +
        "program_properties(properties(id, name, country, island)), " +
        "program_variants(id, duration_days, duration_nights, price_basic_thb, active, created_at)",
    )
    .eq("active", true)
    .order("name")

  const rows: PricingGapRow[] = []
  const propertyIdSet = new Set<string>()

  for (const p of (programs ?? []) as unknown as RawProgram[]) {
    const variants = p.program_variants ?? []
    const activeVariants = variants.filter((v) => v.active)
    // Same rule the live checkout uses (/api/programs/[id]/pricing): a
    // program is bookable once it has an active variant with a THB price.
    // Anything else is a gap for this report.
    const hasPricedVariant = activeVariants.some((v) => v.price_basic_thb != null)
    if (hasPricedVariant) continue

    const properties = (p.program_properties ?? [])
      .map((pp) => pp.properties)
      .filter((x): x is RawProperty => !!x)
    properties.forEach((prop) => propertyIdSet.add(prop.id))

    const anyVariantWithDuration = variants.find((v) => v.duration_days != null)
    const existingDurationDays = anyVariantWithDuration?.duration_days ?? p.duration_days ?? null

    const lastVariantCreated = variants.map((v) => v.created_at).sort().at(-1) ?? null

    rows.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      properties: properties.map((prop) => ({
        id: prop.id,
        name: prop.name,
        country: prop.country,
        island: prop.island,
      })),
      existingDurationDays,
      missingDuration: existingDurationDays == null,
      variantCount: variants.length,
      gapType: variants.length === 0 ? "no_variant" : "unpriced_variant",
      partners: [],
      lastUpdated: lastVariantCreated ?? p.created_at,
    })
  }

  // Batch-resolve partner contact/owner for every property involved, mirroring
  // the recipient lookup already used for inquiry notifications.
  const propertyIds = Array.from(propertyIdSet)
  const partnersByProperty = new Map<string, Array<{ name: string | null; email: string | null }>>()

  if (propertyIds.length > 0) {
    const { data: links } = await supabaseAdmin
      .from("partner_properties")
      .select("property_id, profile_id")
      .in("property_id", propertyIds)

    const profileIds = Array.from(new Set((links ?? []).map((l) => l.profile_id as string)))

    let profileById = new Map<string, { full_name: string | null }>()
    if (profileIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, role")
        .eq("role", "partner")
        .in("id", profileIds)
      profileById = new Map((profiles ?? []).map((pr) => [pr.id as string, { full_name: pr.full_name as string | null }]))
    }

    let emailById = new Map<string, string>()
    if (profileById.size > 0) {
      const {
        data: { users },
      } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 })
      emailById = new Map(
        users
          .filter((u) => profileById.has(u.id) && u.email)
          .map((u) => [u.id, u.email as string]),
      )
    }

    for (const link of links ?? []) {
      const profile = profileById.get(link.profile_id as string)
      if (!profile) continue
      const entry = { name: profile.full_name, email: emailById.get(link.profile_id as string) ?? null }
      const arr = partnersByProperty.get(link.property_id as string) ?? []
      arr.push(entry)
      partnersByProperty.set(link.property_id as string, arr)
    }
  }

  for (const row of rows) {
    const seen = new Map<string, { name: string | null; email: string | null }>()
    for (const prop of row.properties) {
      for (const partner of partnersByProperty.get(prop.id) ?? []) {
        seen.set(`${partner.name ?? ""}|${partner.email ?? ""}`, partner)
      }
    }
    row.partners = Array.from(seen.values())
  }

  rows.sort((a, b) => a.name.localeCompare(b.name))

  return <PricingGapsView rows={rows} />
}
