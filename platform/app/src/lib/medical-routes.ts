export const MEDICAL_SITE = "https://dreamislands.org"

export type MedicalHospital = { en: string; db: string; city: string }

// en = canonical slug in /medical/china/hospitals/<en>; db = properties.slug
export const MEDICAL_HOSPITALS: MedicalHospital[] = [
  { en: "peking-union-medical-college-hospital", db: "peking-union-medical-college-hospital", city: "Beijing" },
  { en: "fudan-zhongshan-hospital", db: "fudan-zhongshan-hospital", city: "Shanghai" },
  { en: "ruijin-hospital", db: "shanghai-jiaotong-ruijin-hospital", city: "Shanghai" },
  { en: "xian-international-medical-center", db: "xian-international-medical-center", city: "Xi'an" },
  { en: "shanghai-jiahui-international-hospital", db: "shanghai-jiahui-international-hospital", city: "Shanghai" },
  { en: "peking-university-first-hospital", db: "peking-university-first-hospital", city: "Beijing" },
  { en: "peking-university-international-hospital", db: "peking-university-international-hospital", city: "Beijing" },
  { en: "west-china-hospital", db: "sichuan-university-west-china-hospital", city: "Chengdu" },
  { en: "sun-yat-sen-university-hospital", db: "sun-yat-sen-university-affiliated-hospital", city: "Guangzhou" },
]

export function dbSlugForEn(en: string): string | null {
  return MEDICAL_HOSPITALS.find((h) => h.en === en)?.db ?? null
}

// Canonical path for a property slug (new medical URL for the 9 hospitals, /properties/<slug> otherwise)
export function canonicalPathForDbSlug(db: string): string {
  const h = MEDICAL_HOSPITALS.find((x) => x.db === db)
  return h ? "/medical/china/hospitals/" + h.en : "/properties/" + db
}
