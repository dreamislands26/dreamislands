// Option lists shared by the public application form and the admin view (no server imports).

/** What a property offers. `cohorts` are the Dream Islands tracks it points to (programs.cohort ids). */
export const OFFERINGS: { key: string; label: string; icon: string; cohorts: number[]; medical?: boolean }[] = [
  { key: "spa", label: "Spa and body treatments", icon: "spa", cohorts: [1] },
  { key: "detox", label: "Detox and nutrition", icon: "nutrition", cohorts: [1] },
  { key: "medical", label: "Medical and diagnostics", icon: "stethoscope", cohorts: [1], medical: true },
  { key: "traditional", label: "Traditional medicine", icon: "local_florist", cohorts: [1, 3] },
  { key: "yoga", label: "Yoga and meditation", icon: "self_improvement", cohorts: [3] },
  { key: "sleep", label: "Sleep and stress", icon: "bedtime", cohorts: [3] },
  { key: "fitness", label: "Fitness and training", icon: "fitness_center", cohorts: [2] },
  { key: "sport", label: "Sport and outdoors", icon: "surfing", cohorts: [7] },
  { key: "immersion", label: "Nature and culture", icon: "forest", cohorts: [4] },
]

export const PROPERTY_TYPES = ["Resort or hotel", "Wellness retreat", "Clinic", "Studio or centre", "Tour operator"]

export const SOURCES: { key: string; label: string }[] = [
  { key: "outbound", label: "Your team reached out" },
  { key: "referral", label: "Referral" },
  { key: "event", label: "Event" },
  { key: "inbound", label: "Found Dream Islands myself" },
]

/** The partner's path from Mark's interview (B1): apply → qualify → structure → verify & contract → live. */
export const STAGES = [
  { key: "new", label: "New application" },
  { key: "qualify", label: "Qualify" },
  { key: "structure", label: "Structure programmes" },
  { key: "verify", label: "Verify & contract" },
  { key: "live", label: "Live" },
  { key: "declined", label: "Declined" },
] as const
export type Stage = (typeof STAGES)[number]["key"]

export const COHORT_NAMES: Record<number, string> = {
  1: "Reset & Recovery",
  2: "Performance",
  3: "Mind Balance",
  4: "Island Immersion",
  7: "Sport & Chill",
}
