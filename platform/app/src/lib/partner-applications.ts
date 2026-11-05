// Partner application → CRM record + primary partner profile (Mark's vision interview, B1).
//
// LOCAL TEST ONLY. The site has one Supabase project and it is production, so this does not touch the
// database: records live in a JSON file under `.data/` on the machine that runs the server. Everything
// is off unless PARTNER_APPLICATIONS_STORE=file is set; without it the page and both APIs answer 404.
// The table this would become is drafted in supabase-migrations/24_partner_applications.draft.sql.
import "server-only"
import { promises as fs } from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { OFFERINGS, STAGES, type Stage } from "./partner-application-options"

export * from "./partner-application-options"

export const applicationsEnabled = () => process.env.PARTNER_APPLICATIONS_STORE === "file"

const FILE = path.join(process.cwd(), ".data", "partner-applications.json")

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

async function readAll(): Promise<PartnerApplication[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as PartnerApplication[]
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return []
    throw e
  }
}

async function writeAll(rows: PartnerApplication[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  const tmp = `${FILE}.${process.pid}.tmp`
  await fs.writeFile(tmp, JSON.stringify(rows, null, 2))
  await fs.rename(tmp, FILE)
}

export async function listApplications() {
  return (await readAll()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createApplication(input: ApplicationInput): Promise<PartnerApplication> {
  const now = new Date().toISOString()
  const row: PartnerApplication = {
    ...input,
    id: randomUUID(),
    createdAt: now,
    crm: { stage: "new", owner: null, history: [{ stage: "new", at: now, by: "application form" }] },
    profile: primaryProfile(input),
  }
  const rows = await readAll()
  rows.push(row)
  await writeAll(rows)
  return row
}

export async function moveApplication(id: string, stage: Stage, by: string) {
  if (!STAGES.some((s) => s.key === stage)) throw new Error("unknown stage")
  const rows = await readAll()
  const row = rows.find((r) => r.id === id)
  if (!row) return null
  if (row.crm.stage !== stage) {
    row.crm.stage = stage
    row.crm.history.push({ stage, at: new Date().toISOString(), by })
    if (!row.crm.owner) row.crm.owner = by
    await writeAll(rows)
  }
  return row
}
