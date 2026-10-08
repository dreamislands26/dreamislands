import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase-server"
import { fetchMatchedPrograms } from "@/lib/matched-programs"
import MatchedView, { type MatchedProgram } from "./MatchedView"

export const dynamic = "force-dynamic"

type RawPayload = {
  wbs_version?: number
  sub_scores?: {
    body?: number
    recovery?: number
    metabolic?: number
    mind?: number
    risk?: number
    // v1 legacy keys
    movement?: number
    lifestyle_risk?: number
    emotional?: number
  }
  recommendation?: string
  focus?: string
  flags?: { cvd?: boolean; cancer?: boolean }
}

export default async function MatchedPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name, wbs_score, cohort, raw_payload, source, created_at")
    .eq("id", id)
    .maybeSingle()

  if (!user) notFound()

  const { data: assessment } = await supabaseAdmin
    .from("assessments")
    .select("score, sub_body, sub_recovery, sub_metabolic, sub_mind, sub_risk, focus, intent, confidence")
    .eq("user_id", id)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const programs = await fetchMatchedPrograms(user.cohort)

  const raw = (user.raw_payload ?? {}) as RawPayload

  const subScores = assessment
    ? {
        body: assessment.sub_body ?? undefined,
        recovery: assessment.sub_recovery ?? undefined,
        metabolic: assessment.sub_metabolic ?? undefined,
        mind: assessment.sub_mind ?? undefined,
        risk: assessment.sub_risk ?? undefined,
      }
    : {
        body: raw.sub_scores?.body,
        recovery: raw.sub_scores?.recovery,
        metabolic: raw.sub_scores?.metabolic,
        mind: raw.sub_scores?.mind,
        risk: raw.sub_scores?.risk,
      }

  const focus = assessment?.focus ?? raw.focus ?? raw.recommendation ?? null
  const flags = raw.flags ?? {}

  return (
    <MatchedView
      userId={user.id}
      name={user.name ?? null}
      wbsScore={user.wbs_score}
      cohort={user.cohort ?? null}
      focus={focus}
      subScores={subScores}
      flags={flags}
      programs={programs as unknown as MatchedProgram[]}
    />
  )
}
