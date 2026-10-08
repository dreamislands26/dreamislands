import TopNav from "./_components/TopNav"
import Footer from "./_components/Footer"
import WhatsAppFab from "./_components/WhatsAppFab"
import AttributionInit from "./_components/AttributionInit"
import ConsentBanner from "./_components/ConsentBanner"
import AuthProvider from "./_components/account/AuthProvider"
import { supabaseAdmin } from "@/lib/supabase-server"
import "./landing.css"
export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { data: programRows } = await supabaseAdmin
    .from("programs")
    .select("id, name")
    .eq("active", true)
    .eq("status", "published")
    .order("sort_order")
  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      <AuthProvider>
        <AttributionInit />
        <ConsentBanner />
        <TopNav programs={programRows ?? []} />
        {children}
        <Footer />
        <WhatsAppFab />
      </AuthProvider>
    </div>
  )
}
