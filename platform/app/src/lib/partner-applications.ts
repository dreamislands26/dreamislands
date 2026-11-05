// Partner application → CRM record + primary partner profile (Mark's vision interview, B1).
//
// Tables: supabase-migrations/24_partner_applications.sql. Service role only (RLS on, no policies):
// the public form writes through /api/partner-applications, the admin reads on gated server pages.
import "server-only"
import { supabaseAdmin } from "./supabase-server"
import { OFFERINGS, STAGES, type Stage } from "./partner-application-options"

export * from "./partner-application-options"

export type ApplicationInput = {
  property: { name: string; type: string; country: string; city: string; website: string }
  offerings: string[]
  programs: { name: string; nights: number | null; priceFrom: number | null }[]
  practitioners: { name: string; specialty: string }[]
  contact: { name: string; role: string; email: string; phone: string }
  source: string
}

export type Check = { key: string; label: string; status: "ok" | "missing" | "review"; note?: string }

export type PartnerApplication = ApplicationInput & {
  id: string
  createdAt: string
  crm: {
    stage: Stage
    owner: string | null
    history: { stage: Stage; at: string; by: string }[]
  }
  profile: {
    cohorts: number[]
    medical: boolean
    completeness: number
    checks: Check[]
  }
}

/** What the system can say about a new partner on its own, before anyone from the team looks. */
export function primaryProfile(a: ApplicationInput): PartnerApplication["profile"] {
  const picked = OFFERINGS.filter((o) => a.offerings.includes(o.key))
  const cohorts = [...new Set(picked.flatMap((o) => o.cohorts))]
  const medical = picked.some((o) => o.medical)
  const p = a.property
  const checks: Check[] = [
    { key: "property", label: "Property and location", status: p.name && p.country && p.city ? "ok" : "missing" },
    { key: "website", label: "Website for enrichment", status: p.website ? "ok" : "missing" },
    { key: "offering", label: "Wellness offering", status: picked.length ? "ok" : "missing" },
    { key: "cohorts", label: "Fits a Dream Islands track", status: cohorts.length ? "ok" : "missing" },
    { key: "programs", label: "Existing programmes", status: a.programs.length ? "ok" : "missing", note: a.programs.length ? `${a.programs.length} listed` : undefined },
    { key: "pricing", label: "Programme prices", status: a.programs.length && a.programs.every((x) => x.priceFrom) ? "ok" : "missing" },
    { key: "practitioners", label: "Practitioners", status: a.practitioners.length ? "ok" : "missing", note: a.practitioners.length ? `${a.practitioners.length} listed` : undefined },
    { key: "credentials", label: "Practitioner credentials", status: "review", note: "Documents are asked for at Verify" },
    ...(medical ? [{ key: "medical", label: "Medical claims review", status: "review" as const, note: "Medical services need a separate check" }] : []),
    { key: "commercial", label: "Commercial terms", status: "missing", note: "Agreed at Verify & contract" },
  ]
  // Share of what the partner can fill in themselves: the team's reviews and the contract are not counted
  const own = checks.filter((c) => c.status !== "review" && c.key !== "commercial")
  const completeness = Math.round((own.filter((c) => c.status === "ok").length / own.length) * 100)
  return { cohorts, medical, completeness, checks }
}

type Row = {
  id: string
  property_name: string
  property_type: string | null
  country: string
  city: string | null
  website: string | null
  offerings: string[]
  programs: ApplicationInput["programs"]
  practitioners: ApplicationInput["practitioners"]
  contact_name: string
  contact_role: string | null
  contact_email: string
  contact_phone: string | null
  source: string | null
  cohorts: number[]
  medical: boolean
  completeness: number
  checks: Check[]
  stage: Stage
  owner_email: string | null
  created_at: string
  partner_application_stage_events?: { stage: Stage; changed_by: string; created_at: string }[]
}

const SELECT = "*, partner_application_stage_events(stage, changed_by, created_at)"

function fromRow(r: Row): PartnerApplication {
  return {
    id: r.id,
    createdAt: r.created_at,
    property: { name: r.property_name, type: r.property_type ?? "", country: r.country, city: r.city ?? "", website: r.website ?? "" },
    offerings: r.offerings,
    programs: r.programs,
    practitioners: r.practitioners,
    contact: { name: r.contact_name, role: r.contact_role ?? "", email: r.contact_email, phone: r.contact_phone ?? "" },
    source: r.source ?? "",
    crm: {
      stage: r.stage,
      owner: r.owner_email,
      history: (r.partner_application_stage_events ?? [])
        .map((e) => ({ stage: e.stage, at: e.created_at, by: e.changed_by }))
        .sort((a, b) => a.at.localeCompare(b.at)),
    },
    profile: { cohorts: r.cohorts, medical: r.medical, completeness: r.completeness, checks: r.checks },
  }
}

export async function listApplications(): Promise<PartnerApplication[]> {
  const { data, error } = await supabaseAdmin.from("partner_applications").select(SELECT).order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data as Row[]).map(fromRow)
}

async function getApplication(id: string) {
  const { data, error } = await supabaseAdmin.from("partner_applications").select(SELECT).eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? fromRow(data as Row) : null
}

export async function createApplication(input: ApplicationInput): Promise<PartnerApplication> {
  const profile = primaryProfile(input)
  const { data, error } = await supabaseAdmin
    .from("partner_applications")
    .insert({
      property_name: input.property.name,
      property_type: input.property.type || null,
      country: input.property.country,
      city: input.property.city || null,
      website: input.property.website || null,
      offerings: input.offerings,
      programs: input.programs,
      practitioners: input.practitioners,
      contact_name: input.contact.name,
      contact_role: input.contact.role || null,
      contact_email: input.contact.email,
      contact_phone: input.contact.phone || null,
      source: input.source || null,
      cohorts: profile.cohorts,
      medical: profile.medical,
      completeness: profile.completeness,
      checks: profile.checks,
      stage: "new",
      consent_at: new Date().toISOString(),
    })
    .select("id")
    .single()
  if (error) throw new Error(error.message)
  const { error: evErr } = await supabaseAdmin
    .from("partner_application_stage_events")
    .insert({ application_id: data.id, stage: "new", changed_by: "application form" })
  if (evErr) console.error("[partner-applications] stage event", evErr.message)
  return (await getApplication(data.id))!
}

export async function moveApplication(id: string, stage: Stage, by: string) {
  if (!STAGES.some((s) => s.key === stage)) throw new Error("unknown stage")
  const row = await getApplication(id)
  if (!row) return null
  if (row.crm.stage === stage) return row
  const { error } = await supabaseAdmin
    .from("partner_applications")
    .update({ stage, owner_email: row.crm.owner ?? by, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)
  const { error: evErr } = await supabaseAdmin.from("partner_application_stage_events").insert({ application_id: id, stage, changed_by: by })
  if (evErr) throw new Error(evErr.message)
  return getApplication(id)
}
