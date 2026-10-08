import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"
import TeamView, { type PropertyOption, type TeamMember } from "./TeamView"

export const dynamic = "force-dynamic"

export default async function TeamPage() {
  const me = await getSessionUser()

  const [{ data: authData }, profilesRes, propertiesRes, linksRes] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ perPage: 200 }),
    supabaseAdmin
      .from("profiles")
      .select("id, role, full_name, password_set_by_admin, created_at"),
    supabaseAdmin
      .from("properties")
      .select("id, name, slug, active")
      .order("name", { ascending: true }),
    supabaseAdmin.from("partner_properties").select("profile_id, property_id"),
  ])

  const profilesById = new Map<string, {
    role: TeamMember["role"]
    full_name: string | null
    password_set_by_admin: boolean
    created_at: string
  }>()
  for (const p of profilesRes.data ?? []) {
    profilesById.set(p.id, {
      role: p.role as TeamMember["role"],
      full_name: p.full_name,
      password_set_by_admin: p.password_set_by_admin,
      created_at: p.created_at,
    })
  }

  const propsById = new Map<string, { name: string; slug: string }>()
  for (const p of propertiesRes.data ?? []) {
    propsById.set(p.id, { name: p.name, slug: p.slug })
  }

  const linksByProfile = new Map<string, TeamMember["partner_properties"]>()
  for (const l of linksRes.data ?? []) {
    const prop = propsById.get(l.property_id)
    if (!prop) continue
    const list = linksByProfile.get(l.profile_id) ?? []
    list.push({ id: l.property_id, name: prop.name, slug: prop.slug })
    linksByProfile.set(l.profile_id, list)
  }

  const roleOrder: Record<TeamMember["role"], number> = { admin: 0, partner: 1, user: 2 }

  const members: TeamMember[] = (authData?.users ?? [])
    .map((u) => {
      const prof = profilesById.get(u.id)
      const role: TeamMember["role"] = prof?.role ?? "user"
      return {
        id: u.id,
        email: u.email ?? "",
        role,
        partner_properties: (linksByProfile.get(u.id) ?? []).sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
        full_name: prof?.full_name ?? null,
        password_set_by_admin: prof?.password_set_by_admin ?? false,
        created_at: u.created_at,
      }
    })
    .sort((a, b) => {
      const r = roleOrder[a.role] - roleOrder[b.role]
      if (r !== 0) return r
      return a.email.localeCompare(b.email)
    })

  const properties: PropertyOption[] = (propertiesRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    active: p.active,
  }))

  return (
    <TeamView
      currentUserId={me?.id ?? null}
      members={members}
      properties={properties}
    />
  )
}
