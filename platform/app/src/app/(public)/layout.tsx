import AttributionInit from "./_components/AttributionInit"
import ConsentBanner from "./_components/ConsentBanner"
import WhatsAppFab from "./_components/WhatsAppFab"
import AuthProvider from "./_components/account/AuthProvider"
import { Footer, MobileTopBar, NavigationBar, NavTracker, TopAppBar } from "./ds/chrome"
// Old styles stay loaded until every page has moved to DS v2.
import "./landing.css"
import "./ds/tokens.css"
import "./ds/legacy.css"

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="ds-root">
      {/* Material Symbols Rounded, Light. Hoisted to <head> by React. */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300,0..1,0&display=block"
        precedence="default"
      />
      <AuthProvider>
        <AttributionInit />
        <NavTracker />
        <ConsentBanner />
        <TopAppBar />
        <MobileTopBar />
        <main className="ds-main">{children}</main>
        <Footer />
        <WhatsAppFab />
        <NavigationBar />
      </AuthProvider>
    </div>
  )
}
