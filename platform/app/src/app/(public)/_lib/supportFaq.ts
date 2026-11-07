// Support centre FAQ (footer → Support centre). Answers are collected from what the site already says
// (booking panel, reserve modal, How it works, place pages, footer disclaimer), not new policy. Anything a
// person decides (final price, date changes, visa rules) points to the coordinator, as the site does.
// The same list is handed to the support chat (Cura) as its knowledge base, so edit it here.

export type SupportQ = { id: string; q: string; a: string; icon?: string }
export type SupportTopic = { id: string; title: string; icon: string; items: SupportQ[] }

export const SUPPORT_TOPICS: SupportTopic[] = [
  {
    id: "booking",
    title: "Booking and payment",
    icon: "payments",
    items: [
      { id: "how-book", icon: "event_available", q: "How do I book a programme?", a: "Pick a programme and your dates, then either pay a 20% deposit or request the dates and pay nothing yet. A person checks availability and the final price and writes to you on WhatsApp, usually within a day." },
      { id: "deposit", q: "What does the deposit cover?", a: "The deposit is 20% of the programme price and secures your reservation request. The rest is due after a person confirms your trip on WhatsApp." },
      { id: "not-available", q: "What if my dates are not available?", a: "Your reservation is reviewed after the deposit arrives. If availability cannot be confirmed, the deposit is refunded in full." },
      { id: "pay-how", q: "How can I pay?", a: "The deposit is paid by card, Apple Pay or Google Pay, secured by Stripe. Your coordinator confirms the final price before the rest is due." },
      { id: "included", q: "What is included in the price?", a: "Each programme lists what is included. Flights and visa are not included unless stated." },
      { id: "change-dates", q: "Can I change my dates?", a: "Write to your coordinator. Changes depend on availability at the place." },
    ],
  },
  {
    id: "programmes",
    title: "Choosing a programme",
    icon: "spa",
    items: [
      { id: "choose", q: "How do I choose the right programme?", a: "Take the Wellness Journey: 23 short questions that give you a Wellness Score and match you to programmes for your goal. You can also browse by goal or track and filter by price, length and country." },
      { id: "tailor", q: "Can a programme be tailored to me?", a: "Yes. Your coordinator shapes the programme around your answers and your dates before anything is confirmed." },
      { id: "ai", q: "Does an AI decide my programme?", a: "No. Matching uses a fixed, rules-based formula: your stated goal and your four subscale scores are checked against a table of focus areas. A person reviews it with you." },
      { id: "after", q: "What happens when I come back?", a: "Retake the Wellness Journey after your trip to see what changed against your baseline. Your coordinator stays with you before arrival, during the stay and after you return home." },
    ],
  },
  {
    id: "health",
    title: "Health and the Wellness Score",
    icon: "medical_information",
    items: [
      { id: "medical", q: "Is the Wellness Score a medical diagnosis?", a: "No. It is a self-reported wellness assessment used to personalise programme recommendations. Dream Islands promotes wellness travel and does not provide medical or psychiatric services." },
      { id: "review", q: "Why would my answers need a review?", a: "Certain answers, such as a cancer history, heavy alcohol use or a very low subscale score, flag your assessment so our team reviews it before any programme is confirmed." },
      { id: "doctor", q: "Should I talk to my doctor first?", a: "Content on this site is for information only and is not medical advice. Please consult your doctor before making health-related decisions." },
    ],
  },
  {
    id: "travel",
    title: "Travel",
    icon: "flight",
    items: [
      { id: "flights", q: "Are flights and visas included?", a: "Not unless the programme says so. Your coordinator checks the visa rules for your dates and helps plan transfers." },
      { id: "where", q: "Where do you host?", a: "In Thailand, China, Indonesia, Singapore, the Philippines, Vietnam and Malaysia." },
    ],
  },
  {
    id: "contact",
    title: "Talking to a person",
    icon: "support_agent",
    items: [
      { id: "person", q: "How do I reach a person?", a: "Write in the support chat and a coordinator takes over when needed. You can also message us on WhatsApp at +66 81 161 2662 or email hello@dreamislands.org." },
    ],
  },
]

/** The cards under "Support centre": the questions people ask most, in this order. */
export const POPULAR_IDS = ["how-book", "deposit", "flights", "medical"]

export const findQuestion = (id: string) => SUPPORT_TOPICS.flatMap((t) => t.items.map((q) => ({ ...q, icon: q.icon ?? t.icon }))).find((q) => q.id === id)

/** Quick-start buttons shown when the chat opens. Same list goes to Cura. */
export const CHAT_STARTERS = [
  "Help me choose a programme",
  "Dates and prices",
  "How booking works",
  "Talk to a person",
]
