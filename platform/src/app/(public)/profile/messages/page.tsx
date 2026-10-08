import { DIT_EMAIL, DIT_WHATSAPP_URL } from "@/lib/contact"
import { Icon } from "../../_components/Icon"

export default function MyMessages() {
  return (
    <div className="profile-grid">
      <section className="card profile-card">
        <div className="eyebrow" style={{ marginBottom: 12 }}>Messages</div>
        <h2 className="display" style={{ fontSize: 32, margin: "0 0 10px", color: "var(--ink)" }}>Talk to the team</h2>
        <p className="body" style={{ margin: "0 0 24px", maxWidth: 520 }}>
          We answer on WhatsApp and by email — questions about your program, your dates, or anything that came up
          during your stay.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href={DIT_WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn btn-primary">
            <Icon.wa width={18} height={18} /> Open WhatsApp chat
          </a>
          <a href={`mailto:${DIT_EMAIL}`} className="btn btn-ghost">{DIT_EMAIL}</a>
        </div>
      </section>
    </div>
  )
}
