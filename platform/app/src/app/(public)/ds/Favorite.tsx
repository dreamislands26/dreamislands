// DS component "Favorite": 24px heart, white 2px stroke, no plate.
// Default: black 50% inside. Saved: filled #ff4462.
const HEART =
  "M12 20.6c-.25 0-.5-.08-.7-.25C6.7 16.5 2.75 13.1 2.75 8.75 2.75 5.95 4.95 3.75 7.7 3.75c1.75 0 3.3.88 4.3 2.25 1-1.37 2.55-2.25 4.3-2.25 2.75 0 4.95 2.2 4.95 5 0 4.35-3.95 7.75-8.55 11.6-.2.17-.45.25-.7.25z"

export default function FavoriteIcon({ saved }: { saved?: boolean }) {
  return (
    <svg style={{ width: "1.5rem", height: "1.5rem" }} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d={HEART} fill={saved ? "#ff4462" : "rgba(0,0,0,0.5)"} stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}
