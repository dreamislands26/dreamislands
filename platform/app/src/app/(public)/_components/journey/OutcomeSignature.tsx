// Large abstract graphic identities for the seven outcomes — the visual
// primitive replacing the old icon-in-a-card treatment. Each signature is
// conceptually tied to its outcome (a slow wave for sleep, an irregular
// signal resolving into calm for stress, etc.) and animates with its own
// tempo, gated behind an ancestor `.iv-active` class. Server-renderable,
// decorative, excluded from the a11y tree. Unmapped slugs fall back to a
// plain wave rather than rendering nothing, so a future eighth outcome never
// breaks the layout.

export default function OutcomeSignature({ slug }: { slug: string }) {
  switch (slug) {
    case "restore-sleep":
      return (
        <svg className="sig sig-sleep" viewBox="0 0 300 130" aria-hidden="true" focusable="false">
          <path d="M-10 68 Q 16 24 42 68 T 94 68 T 146 68 T 198 68 T 250 68 T 302 68" />
        </svg>
      )
    case "stress-anxiety":
      return (
        <svg className="sig sig-stress" viewBox="0 0 300 130" aria-hidden="true" focusable="false">
          <path d="M-6 96 L14 40 L24 84 L36 20 L48 74 L60 46 Q 90 20 300 34" />
        </svg>
      )
    case "boost-energy":
      return (
        <svg className="sig sig-energy" viewBox="0 0 300 130" aria-hidden="true" focusable="false">
          <path d="M-6 100 L16 26 L30 100 L52 14 L66 100 L90 40 L104 100 Q 200 92 306 92" />
        </svg>
      )
    case "metabolic-health":
      return (
        <svg className="sig sig-metabolic" viewBox="0 0 300 130" aria-hidden="true" focusable="false">
          <path d="M-6 112 L48 112 L48 88 L102 88 L102 62 L156 62 L156 38 L210 38 L210 14 L306 14" />
        </svg>
      )
    case "mental-clarity":
      return (
        <svg className="sig sig-clarity" viewBox="0 0 300 130" aria-hidden="true" focusable="false">
          <path d="M-6 30 L20 90 L34 22 L52 96 L70 34 L92 82 L118 46 Q 200 66 306 66" />
        </svg>
      )
    case "rebuild-your-body":
      return (
        <svg className="sig sig-rebuild" viewBox="0 0 220 220" aria-hidden="true" focusable="false">
          <circle cx="110" cy="150" r="20" className="sig-ring-1" />
          <circle cx="110" cy="150" r="42" className="sig-ring-2" />
          <circle cx="110" cy="150" r="66" className="sig-ring-3" />
          <circle cx="110" cy="150" r="8" className="sig-core" />
        </svg>
      )
    case "healthy-ageing":
      return (
        <svg className="sig sig-ageing" viewBox="0 0 300 130" aria-hidden="true" focusable="false">
          <path d="M-10 100 C 60 100, 90 30, 160 30 C 230 30, 260 70, 310 60" />
        </svg>
      )
    default:
      return (
        <svg className="sig sig-default" viewBox="0 0 300 130" aria-hidden="true" focusable="false">
          <path d="M-10 68 Q 20 34 50 68 T 110 68 T 170 68 T 230 68 T 290 68" />
        </svg>
      )
  }
}
