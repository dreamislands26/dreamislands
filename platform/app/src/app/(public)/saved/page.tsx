import type { Metadata } from "next"
import SavedView from "./SavedView"

export const metadata: Metadata = { title: "Saved", robots: { index: false, follow: false } }

export default function SavedPage() {
  return <SavedView />
}
