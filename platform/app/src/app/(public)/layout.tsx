import AttributionInit from "./_components/AttributionInit"
import MetricoolTracker from "./_components/MetricoolTracker"
import ConsentBanner from "./_components/ConsentBanner"
import WhatsAppFab from "./_components/WhatsAppFab"
import PageTransition from "./ds/PageTransition"
import { ICON_FONT_HREF } from "./ds/icon-font"
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
      {/* Material Symbols Rounded, Light, only the glyphs in ds/icon-font.ts. Hoisted to <head> by React. */}
      <link
        rel="stylesheet"
        href={ICON_FONT_HREF}
        precedence="default"
      />
      <AuthProvider>
        <AttributionInit />
        <MetricoolTracker />
        <NavTracker />
        <ConsentBanner />
        <TopAppBar />
        <MobileTopBar />
        <main className="ds-main">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        <WhatsAppFab />
        <SupportFab />
        <NavigationBar />
      </AuthProvider>
    </div>
    </LocaleProvider>
  )
}
