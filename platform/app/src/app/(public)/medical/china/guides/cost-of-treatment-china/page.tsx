import GuideLayout, { guideMetadata, type GuideSection } from "../_guide"

export const dynamic = "force-dynamic"

const SLUG = "cost-of-treatment-china"
const TITLE = "Cost of Medical Treatment in China"
const DESC = "What medical treatment in China costs for foreign patients: service fees from RMB 3,500, hospital charges separate. Confirmed RMB tariffs and how to get your total."
export const metadata = guideMetadata(SLUG, TITLE, DESC)

const SECTIONS: GuideSection[] = [
  {
    "h": "What makes up the cost",
    "steps": [
      "Service fee.|| Dream Islands and Better Migrate arrange the treatment: hospital and specialist matching, appointments, bilingual accompaniment and case follow-up. Tariffs are fixed and stated in RMB.",
      "Hospital costs.|| Consultations, diagnostics, surgery, hospitalization and medication. They are paid separately and confirmed per case."
    ]
  },
  {
    "h": "Service fees",
    "items": [
      "Outpatient Fast-track:|| RMB 3,500 (approx. USD 521). Specialist consultation or examination pathway without inpatient treatment.",
      "Surgery Full-process:|| from RMB 18,000 (approx. USD 2,679). Includes the basic package, specialist arrangement, pre-operative examination support, surgery scheduling, inpatient assistance, post-operative guidance and medication service support. Complex cases (oncology, neurosurgery, rare diseases) are arranged individually after case review."
    ],
    "paras": [
      "Prices are in RMB, which is the source of truth. USD figures are approximate at a single rate of 6.72 RMB per USD."
    ]
  },
  {
    "h": "What the service fee includes",
    "paras": [
      "A 30-minute online pre-consultation (a preliminary assessment and routing, not a second medical opinion), hospital, department and specialist matching, specialist appointment coordination, registration and identity verification, bilingual hospital accompaniment, support with payment, examinations and pharmacy, one complimentary citywide airport or railway station pickup, basic insurance communication and claim-document organization, and case follow-up. The exact scope is confirmed in your quotation."
    ]
  },
  {
    "h": "What is paid separately",
    "items": [
      "Hospital and medical charges:|| consultations, diagnostics, surgery, medication.",
      "Travel:|| flights and accommodation.",
      "Visa fees."
    ]
  },
  {
    "h": "Optional services and partner tariffs",
    "paras": [
      "The final amount is confirmed in your quotation."
    ],
    "items": [
      "Additional airport or railway pickup:|| RMB 300 per trip.",
      "Hotel booking assistance near the hospital:|| RMB 100.",
      "Interpretation:|| RMB 200 per hour.",
      "Insurance claim document organization:|| RMB 300 per set.",
      "24-hour emergency medical access coordination:|| RMB 1,500 per time.",
      "Bilingual hospital accompaniment:|| outpatient visit up to 4 hours RMB 600, full day (8 hours) RMB 800, inpatient or surgery RMB 1,000 per day.",
      "Travel itinerary assistance:|| quoted on request."
    ]
  },
  {
    "h": "What hospital costs depend on",
    "paras": [
      "Hospital charges depend on the hospital and department, the scope of examinations, the type of treatment or surgery, the length of hospitalization and medication. We do not publish general price lists without data for your case. An estimate for hospital costs is confirmed in your individual proposal."
    ]
  },
  {
    "h": "How to get your total cost",
    "steps": [
      "Submit your case.|| Describe the situation in your own words. Please do not include passport details.",
      "Case review.|| Better Migrate coordinates your case and a suitable hospital is matched.",
      "Proposal.|| You receive the scope of service and the price.",
      "Confirmation.|| Booking and payment only after you agree to the scope and price. No payment is needed to submit a case."
    ],
    "paras": [
      "For companies, official VAT invoices and corporate bank transfer are available."
    ]
  },
  {
    "h": "Before you decide to travel",
    "paras": [
      "You can request a remote second opinion first: a suitable hospital in China reviews your documents directly."
    ],
    "links": [
      [
        "Remote second opinion",
        "/medical/china/guides/second-opinion-china"
      ],
      [
        "How to arrange medical treatment in China",
        "/medical/china/guides/how-to-arrange-treatment-china"
      ]
    ]
  }
]

const FAQ = [
  {
    "q": "How much does medical treatment in China cost for a foreign patient?",
    "a": "Cost has two parts. The Dream Islands and Better Migrate service fee is RMB 3,500 (approx. USD 521) for an outpatient visit and from RMB 18,000 (approx. USD 2,679) for surgery coordination. Hospital charges are paid separately and depend on the case; an estimate is given after case review."
  },
  {
    "q": "Are hospital charges included in the service fee?",
    "a": "No. The service fee covers arrangement and accompaniment. Hospital charges are paid separately unless your individual proposal states otherwise."
  },
  {
    "q": "Can I find out the cost before travelling?",
    "a": "Yes. Submit your case and, after review, you receive an individual proposal with the scope of service and the price. Booking and payment follow only after your confirmation."
  },
  {
    "q": "Do I pay when I submit a case?",
    "a": "No. No payment is required to submit a case."
  },
  {
    "q": "Which currency are prices in?",
    "a": "Service prices are set in RMB. USD amounts are approximate at a single rate of 6.72 RMB per USD and may differ at the time of payment."
  },
  {
    "q": "Why don't you publish prices for surgery and examinations?",
    "a": "Hospital charges depend on the hospital, department, scope of examinations, type of treatment and length of stay. General figures without data for your case would be misleading, so they are given in your individual proposal."
  }
]

export default function Page() {
  return (
    <GuideLayout slug={SLUG} title={TITLE} desc={DESC} h1="How Much Does Medical Treatment in China Cost?" crumb="Cost of treatment" intro="The cost of medical treatment in China for a foreign patient has two parts: the service that arranges it and the hospital's own charges. This guide explains what each part includes, which service tariffs are confirmed and how to get the total for your case." sections={SECTIONS} faq={FAQ} formName="Cost of treatment in China - case review">

    </GuideLayout>
  )
}
