import AttributionInit from "./_components/AttributionInit"
import MetricoolTracker from "./_components/MetricoolTracker"
import ConsentBanner from "./_components/ConsentBanner"
import WhatsAppFab from "./_components/WhatsAppFab"
import SupportFab from "./_components/SupportFab"
import AuthProvider from "./_components/account/AuthProvider"
import { Footer, MobileTopBar, NavigationBar, NavTracker, TopAppBar } from "./ds/chrome"
import { LocaleProvider } from "@/lib/i18n-client"
import { getLocale, getMessages } from "@/lib/i18n-server"
// Old styles stay loaded until every page has moved to DS v2.
import "./landing.css"
import "./ds/tokens.css"
import "./ds/legacy.css"

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()
  return (
    <LocaleProvider locale={locale} messages={getMessages(locale)}>
    <div className="ds-root">
      {/* Material Symbols Rounded, Light. Hoisted to <head> by React. */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300,0..1,0&display=block"
        precedence="default"
      />
      <AuthProvider>
        <AttributionInit />
        <MetricoolTracker />
        <NavTracker />
        <ConsentBanner />
        <TopAppBar />
        <MobileTopBar />
        <main className="ds-main">{children}</main>
        <Footer />
        <WhatsAppFab />
        <SupportFab />
        <NavigationBar />
      </AuthProvider>
    </div>
    </LocaleProvider>
  )
}
