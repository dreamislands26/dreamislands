import { notFound } from "next/navigation"
import type { Metadata } from "next"
import PropertyDetailPage, { generateMetadata as propertyMetadata } from "@/app/(public)/properties/[slug]/page"
import { dbSlugForEn } from "@/lib/medical-routes"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const db = dbSlugForEn(slug)
  if (!db) return { title: "Hospital not found" }
  return propertyMetadata({ params: Promise.resolve({ slug: db }) })
}

export default async function MedicalHospitalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = dbSlugForEn(slug)
  if (!db) notFound()
  return PropertyDetailPage({ params: Promise.resolve({ slug: db }) })
}
