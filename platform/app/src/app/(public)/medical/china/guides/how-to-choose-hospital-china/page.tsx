import GuideLayout, { guideMetadata, type GuideSection } from "../_guide"

export const dynamic = "force-dynamic"

const SLUG = "how-to-choose-hospital-china"
const TITLE = "How to Choose a Hospital in China"
const DESC = "How to choose a hospital in China as an international patient: selection criteria and how matching works through case review."
export const metadata = guideMetadata(SLUG, TITLE, DESC)

const SECTIONS: GuideSection[] = [
  {
    "h": "Criteria for choosing a hospital",
    "items": [
      "A profile that fits your case.|| A department and specialist who work with your diagnosis.",
      "The right format.|| A consultation, examination, outpatient treatment and surgery need different arrangements.",
      "Experience with international patients.|| Registration, communication and paperwork are easier where the hospital is used to foreign patients.",
      "Language.|| Bilingual accompaniment removes the barrier at appointments and examinations.",
      "City and logistics.|| Flights, accommodation near the hospital and length of stay.",
      "Cost transparency.|| It should be clear what is in the service fee and what is paid to the hospital separately.",
      "Doctor availability.|| Whether a specific specialist is available, and the nearest appointment, are confirmed per case."
    ]
  },
  {
    "h": "How matching works with us",
    "paras": [
      "Dream Islands and Better Migrate do not choose a hospital from a general list. After you submit a case, the coordinators review it, match a hospital, department and specialist from the partner network and confirm the scope and price in an individual proposal."
    ]
  },
  {
    "h": "What we do not do",
    "paras": [
      "We do not rank hospitals and we do not assign specialties to hospitals without confirmation. The hospitals in our network are listed here."
    ],
    "links": [
      [
        "Hospitals in China for international patients",
        "/medical/china/guides/hospitals-china-international-patients"
      ]
    ]
  },
  {
    "h": "If you need an assessment first",
    "paras": [
      "Request a remote second opinion: a suitable hospital in China reviews your documents directly, and you decide about travelling with that result."
    ],
    "links": [
      [
        "Remote second opinion",
        "/medical/china/guides/second-opinion-china"
      ]
    ]
  },
  {
    "h": "Service fees",
    "paras": [
      "Outpatient visit RMB 3,500 (approx. USD 521), surgery coordination from RMB 18,000 (approx. USD 2,679). Hospital charges are paid separately."
    ],
    "links": [
      [
        "Cost of medical treatment in China",
        "/medical/china/guides/cost-of-treatment-china"
      ]
    ]
  }
]

const FAQ = [
  {
    "q": "How do I choose a hospital in China?",
    "a": "Look at how well the hospital's profile fits your diagnosis, whether the needed specialist is available, experience with international patients, language support, logistics and cost transparency. Specific matching is done after case review."
  },
  {
    "q": "Do you recommend a specific hospital in advance?",
    "a": "No. A hospital, department and specialist are matched to your case. We do not assign specialties to hospitals without confirmation and we do not publish rankings."
  },
  {
    "q": "Can I choose the hospital myself?",
    "a": "Yes. Mention a preferred city or hospital in your case; availability of places and specialists is confirmed per case."
  },
  {
    "q": "What if I am unsure about travelling at all?",
    "a": "You can first request a remote second opinion: a suitable hospital in China reviews your documents directly, before you decide to travel."
  },
  {
    "q": "Do you guarantee a treatment result?",
    "a": "No. Diagnosis, treatment plan and results are determined by the hospital's physicians."
  }
]

export default function Page() {
  return (
    <GuideLayout slug={SLUG} title={TITLE} desc={DESC} h1="How to Choose a Hospital in China" crumb="How to choose a hospital" intro="China has many strong hospitals, and the right choice depends less on a general ranking than on your diagnosis, the type of care and logistics. These are the criteria to use and how matching works through a coordinator." sections={SECTIONS} faq={FAQ} formName="Hospital matching in China - case review">

    </GuideLayout>
  )
}
