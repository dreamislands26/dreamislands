import type { Metadata } from "next"
import Script from "next/script"
import { Belleza, DM_Sans, Roboto_Mono } from "next/font/google"
import "./globals.css"

const SITE_NAME = "Dream Islands"
const DEFAULT_TITLE = "Dream Islands — Wellness Travel for Asia"
const DEFAULT_DESCRIPTION = "We score your wellbeing then match you to a retreat that actually moves the number."

export const metadata: Metadata = {
  metadataBase: new URL("https://dreamislands.org"),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | Dream Islands",
  },
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "https://dreamislands.org",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
}

// Brand typography: accent = Optima, base = Aeroport, mono = Roboto Mono.
// Optima and Aeroport are not web fonts, so each gets a close Google match as
// fallback. The variables sit on <html> so the :root type tokens can resolve
// them (they were previously on a nested div, which left --font-body empty and
// the whole site rendering in Times New Roman).
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans", display: "swap" })
const belleza = Belleza({ subsets: ["latin"], weight: "400", variable: "--font-optima-fallback", display: "swap" })
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono", display: "swap" })

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${belleza.variable} ${robotoMono.variable}`}>
      <body>
        <Script
          id="consent-default"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});try{var s=localStorage.getItem('di_consent');if(s){var c=JSON.parse(s);gtag('consent','update',{ad_storage:c.ad_storage||'denied',ad_user_data:c.ad_user_data||'denied',ad_personalization:c.ad_personalization||'denied',analytics_storage:c.analytics_storage||'denied'});}}catch(e){}",
          }}
        />
        <Script
          id="gtm-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-W628XDCM');",
          }}
        />
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W628XDCM"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "TravelAgency",
              name: "Dream Islands",
              url: "https://dreamislands.org",
              sameAs: [
                "https://www.instagram.com/dreamislands_travel/",
                "https://www.linkedin.com/company/dream-islands/",
                "https://www.youtube.com/@DreamIslandsTravel",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                email: "hello@dreamislands.org",
                telephone: "+66811612662",
                contactType: "customer service",
              },
            }),
          }}
        />
        {children}
      </body>
    </html>
  )
}
