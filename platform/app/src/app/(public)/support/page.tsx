import type { Metadata } from "next"
import SupportCentre from "../ds/SupportCentre"

export const metadata: Metadata = {
  title: "Support centre",
  description: "Answers to common questions about booking, programmes, the Wellness Score and travel, and a chat with a Dream Islands coordinator.",
  alternates: { canonical: "/support" },
  openGraph: {
    title: "Support centre | Dream Islands",
    description: "Answers to common questions and a chat with a Dream Islands coordinator.",
    url: "https://dreamislands.org/support",
  },
}

export default function SupportPage() {
  return <SupportCentre />
}
