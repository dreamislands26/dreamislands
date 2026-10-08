import DetailsForm from "../_components/DetailsForm"
import { loadProfile } from "../_components/load"

export default async function ProfileDetails() {
  const data = await loadProfile()
  if (data.state !== "guest") return null
  const { profile } = data.cabinet
  return (
    <div className="profile-grid">
      <DetailsForm
        email={data.email}
        initial={{ name: profile.name ?? "", whatsapp: profile.whatsapp ?? "", country: profile.country ?? "" }}
      />
    </div>
  )
}
