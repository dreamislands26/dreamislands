// Editorial copy per place, from the DS v2 layouts. Places without an entry
// render only the data-driven sections. Keep copy in English, plain words.

export type PlaceContent = {
  highlights?: { icon: string; h: string; t: string }[]
  intro?: string
  why?: { title: string; items: { icon: string; h: string; t: string }[] }
  ecosystem?: { icon: string; label: string; h: string; t: string }[]
  hosts?: { initials: string; name: string; role: string; text: string }[]
  whoFor?: { title: string; items: { icon: string; h: string; t: string }[] }
  route?: { stops: { name: string; leg?: string }[]; note: string }
  faq?: { q: string; a: string }[]
}

export const PLACE_CONTENT: Record<string, PlaceContent> = {
  "wudang-mountain-wellness-center": {
    highlights: [
      { icon: "temple_buddhist", h: "Wudang Mountain Wellness Center", t: "Partner retreat on the mountain" },
      { icon: "train", h: "From Xi'an by high-speed rail", t: "Xi'an to Shiyan, then a transfer up the mountain" },
      { icon: "do_not_disturb_on", h: "Quiet by design", t: "Many programmes include a no-devices protocol" },
      { icon: "monitoring", h: "Measure what changed", t: "Your Wellness Score before and after the trip" },
    ],
    intro:
      "Seven programmes, from a 3-day reset to 10 days of deep practice. Two of them are routes that start in Xi'an with the Terracotta Army and the old city walls.",
    why: {
      title: "Why Wudang",
      items: [
        { icon: "self_improvement", h: "Where Tai Chi began", t: "The internal arts that Tai Chi traces back to started on this mountain." },
        { icon: "temple_buddhist", h: "Living temples", t: "The Daoist temples are still active, with resident teachers." },
        { icon: "do_not_disturb_on", h: "Quiet by design", t: "Many programmes include a no-devices protocol for part of the day." },
        { icon: "account_balance", h: "UNESCO World Heritage", t: "Ancient buildings, forest trails and mountain air." },
      ],
    },
    ecosystem: [
      { icon: "bed", label: "Where you stay", h: "Wudang Retreat Hotel", t: "Rooms for 1–2 guests at the foot of the mountain." },
      { icon: "self_improvement", label: "Where you practise", h: "Wudang Mountain Wellness Center", t: "Taiji, Qigong and meditation with resident teachers." },
      { icon: "healing", label: "Where you are treated", h: "TCM consultation on request", t: "Traditional assessment inside the programme. Not a clinic." },
    ],
    hosts: [
      { initials: "W", name: "Wudang Mountain Wellness Center", role: "Host on the mountain", text: "Taiji, Qigong, meditation and traditional Chinese medicine on Wudang Mountain." },
      { initials: "DI", name: "Your coordinator", role: "Dream Islands, replies on WhatsApp", text: "Confirms dates and price, books transfers and stays in touch during the trip." },
    ],
    whoFor: {
      title: "When to choose Wudang",
      items: [
        { icon: "bedtime", h: "Stress, poor sleep or burnout", t: "Slow days, early practice and quiet evenings." },
        { icon: "sports_martial_arts", h: "First time with Taiji", t: "Teachers start from the basics. No experience needed." },
        { icon: "landscape", h: "You want quiet, not a resort", t: "Simple rooms, mountain food, no nightlife." },
        { icon: "monitoring", h: "Measured results", t: "Wellness Score before and after the trip." },
      ],
    },
    route: {
      stops: [{ name: "Xi'an", leg: "high-speed rail" }, { name: "Shiyan", leg: "transfer" }, { name: "Wudang Mountain" }],
      note: "Your coordinator books the rail tickets and the transfer and shares the details on WhatsApp.",
    },
    faq: [
      { q: "Do I need a visa for China?", a: "It depends on your passport and the length of the trip. Many nationalities can enter visa-free or transit visa-free. Your coordinator checks the rules for your dates before you book." },
      { q: "I have never done Taiji. Is that OK?", a: "Yes. Teachers start from the basics, and most guests come without experience." },
      { q: "What is included in the price?", a: "Each programme lists what is included: accommodation, practice, meals and transfers where stated. Flights and visa are not included." },
      { q: "How do I get from Xi'an to the mountain?", a: "High-speed rail from Xi'an to Shiyan, then a transfer up the mountain. Your coordinator books both." },
    ],
  },
}

export const GENERIC_FAQ: { q: string; a: string }[] = [
  { q: "How do I book?", a: "Pick a programme and reserve with a deposit when dates are confirmed, or request dates and pay nothing yet. A person confirms everything on WhatsApp." },
  { q: "What is included in the price?", a: "Each programme lists what is included. Flights and visa are not included unless stated." },
  { q: "Can I change my dates?", a: "Write to your coordinator. Changes depend on availability at the place." },
]
