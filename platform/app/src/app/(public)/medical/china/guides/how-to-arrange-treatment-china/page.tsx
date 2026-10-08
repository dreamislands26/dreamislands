import GuideLayout, { guideMetadata, type GuideSection } from "../_guide"

export const dynamic = "force-dynamic"

const SLUG = "how-to-arrange-treatment-china"
const TITLE = "How to Arrange Medical Treatment in China"
const DESC = "How to arrange medical treatment in China as a foreign patient: submit your case, coordination, hospital review, proposed plan and price, confirmation, treatment."
export const metadata = guideMetadata(SLUG, TITLE, DESC)

const SECTIONS: GuideSection[] = [
  {
    "h": "Six steps",
    "steps": [
      "You submit your case.|| Describe the diagnosis or symptoms and what you need. Please do not include passport details.",
      "Better Migrate coordinates your case.|| Our partner receives the request from Dream Islands and prepares it for the hospital.",
      "A hospital reviews the case.|| A suitable hospital assesses your documents and whether it can see you.",
      "You receive a proposed plan.|| The scope of service, the price and the next steps.",
      "You confirm.|| Booking and payment of the service only after you agree to the scope and price.",
      "Treatment and accompaniment.|| Appointments, bilingual accompaniment at the hospital, examinations and, where needed, admission and surgery."
    ]
  },
  {
    "h": "Who does what",
    "items": [
      "Dream Islands:|| receives your case and stays in touch with you.",
      "Better Migrate:|| coordinates the case with hospitals and arranges appointments and accompaniment.",
      "Hospital in China:|| reviews the case, makes the diagnosis and provides treatment.",
      "You:|| decide on treatment."
    ]
  },
  {
    "h": "What to prepare",
    "paras": [
      "Discharge summaries, test and examination results, imaging descriptions, a list of current medication and a short history of the condition. Your set does not need to be perfect: we confirm what is missing after you submit the case, and we confirm how to send documents securely."
    ]
  },
  {
    "h": "Cost",
    "paras": [
      "Service fees: outpatient visit RMB 3,500 (approx. USD 521), surgery coordination from RMB 18,000 (approx. USD 2,679). Hospital charges are paid separately and confirmed per case."
    ],
    "links": [
      [
        "Cost of medical treatment in China",
        "/medical/china/guides/cost-of-treatment-china"
      ]
    ]
  },
  {
    "h": "Visa and travel",
    "paras": [
      "Visa requirements depend on your citizenship and the purpose of the trip, and we clarify them during case review. Transfers, a hotel near the hospital and other details are agreed per case."
    ]
  },
  {
    "h": "Before you travel",
    "paras": [
      "If you want a hospital's view first, you can request a remote second opinion."
    ],
    "links": [
      [
        "Remote second opinion",
        "/medical/china/guides/second-opinion-china"
      ]
    ]
  }
]

const FAQ = [
  {
    "q": "Where do I start?",
    "a": "With a case: briefly describe the diagnosis or symptoms and what you need (consultation, second opinion, examination or surgery). No payment is needed at this stage."
  },
  {
    "q": "Who chooses the hospital and doctor?",
    "a": "Dream Islands and Better Migrate coordinate the matching after case review, and the hospital reviews the case and confirms it can see you. Availability of a specific doctor is confirmed per case."
  },
  {
    "q": "How long does it take to arrange?",
    "a": "Timing depends on the case, the hospital and your documents, so we do not state it in advance. It is confirmed after we review your request."
  },
  {
    "q": "Do I need to speak Chinese?",
    "a": "No. Bilingual hospital accompaniment is part of the service."
  },
  {
    "q": "Do I need a visa?",
    "a": "Requirements depend on your citizenship and the purpose of the trip. We clarify them during case review."
  },
  {
    "q": "Can I get a hospital's opinion remotely first?",
    "a": "Yes. A remote second opinion is available: a suitable hospital in China reviews your documents directly. Timing, fee and format are confirmed per case."
  }
]

export default function Page() {
  return (
    <GuideLayout slug={SLUG} title={TITLE} desc={DESC} h1="How to Arrange Medical Treatment in China" crumb="How to arrange treatment" intro="Arranging treatment in China on your own is hard: you need a suitable hospital, an appointment with a specialist, registration and examinations in another language. This is the process through a coordinator and what happens at each step." sections={SECTIONS} faq={FAQ} formName="Arrange treatment in China - case review">

    </GuideLayout>
  )
}
