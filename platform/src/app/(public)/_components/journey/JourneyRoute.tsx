// Route / loop SVG primitives. Purely presentational and server-renderable —
// motion is driven entirely by CSS gated behind an ancestor `.iv-active`
// class (see InViewMotion), so these components have no client-side
// dependency of their own. All decorative, excluded from the a11y tree.
//
// Two geometries per placement (desktop / mobile) rather than one path
// stretched with preserveAspectRatio="none" across all widths — a single
// curve that reads as intentional at 1200px becomes illegible noise at
// 375px, so mobile gets its own simpler line rather than a squashed version
// of the desktop one.

export function HeroRoute() {
  return (
    <>
      <svg
        className="jr jr-hero-desktop"
        viewBox="0 0 640 460"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <circle className="jr-origin" cx="8" cy="392" r="5" />
        <path className="jr-fast" d="M8 392 C 60 392, 105 362, 140 330 C 195 280, 235 250, 270 218" />
        <path className="jr-slow" d="M270 218 C 305 186, 335 158, 365 128" />
        <circle className="jr-ring" cx="365" cy="128" r="34" />
      </svg>
      <svg
        className="jr jr-hero-mobile"
        viewBox="0 0 200 320"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <circle className="jr-origin" cx="18" cy="286" r="4" />
        <path className="jr-fast" d="M18 286 C 40 240, 58 200, 84 160" />
        <path className="jr-slow" d="M84 160 C 100 128, 116 96, 138 62" />
        <circle className="jr-ring" cx="138" cy="62" r="24" />
      </svg>
    </>
  )
}

export function BDARoute() {
  return (
    <>
      <svg
        className="jr jr-bda-desktop"
        viewBox="0 0 1000 400"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <circle className="jr-origin" cx="40" cy="90" r="4" />
        <path className="jr-fast" d="M40 90 L 220 90" strokeDasharray="6 6" />
        <circle className="jr-way" cx="220" cy="90" r="7" />
        <path className="jr-fast" d="M226 90 C 260 90, 275 150, 280 185" />
        <path className="jr-wide" d="M280 185 C 320 250, 420 290, 520 278 C 600 268, 650 210, 690 190" />
        <path className="jr-fast" d="M690 190 C 730 168, 755 135, 780 105" />
        <circle className="jr-ring jr-ring-sm" cx="780" cy="105" r="7" />
        <path className="jr-loop" d="M780 105 C 880 80, 920 320, 620 372 C 340 420, 130 340, 40 90" strokeDasharray="4 9" />
      </svg>
      <svg
        className="jr jr-bda-mobile"
        viewBox="0 0 200 900"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <circle className="jr-origin" cx="26" cy="40" r="4" />
        <path className="jr-fast" d="M26 40 L 26 160" strokeDasharray="6 6" />
        <circle className="jr-way" cx="26" cy="160" r="6" />
        <path className="jr-fast" d="M26 168 C 26 200, 60 220, 90 235" />
        <path className="jr-wide" d="M90 235 C 140 260, 150 500, 120 560 C 95 610, 60 630, 30 645" />
        <path className="jr-fast" d="M30 645 C 26 690, 24 730, 24 770" />
        <circle className="jr-ring jr-ring-sm" cx="24" cy="800" r="6" />
      </svg>
    </>
  )
}
