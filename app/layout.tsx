import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/ui/BackToTop";
import AiChatWidget from "@/components/ui/AiChatWidget";
import config from "@/content/config.json";
import { getProfile } from "@/lib/content";
import { getSeo } from "@/lib/seo";

const GA_MEASUREMENT_ID = config.gaMeasurementId;
const SITE_URL = config.siteUrl;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const homeSeo = getSeo("home");

export const metadata: Metadata = {
  ...homeSeo,
  authors: [{ name: getProfile().name }],
  metadataBase: new URL(SITE_URL),
  alternates: {
    ...homeSeo.alternates,
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

function buildJsonLd() {
  const profile = getProfile();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    alternateName: "Hridu",
    url: SITE_URL,
    image: `${SITE_URL}${profile.avatar}`,
    jobTitle: profile.title,
    worksFor: { "@type": "Organization", name: profile.currentEmployer },
    address: {
      "@type": "PostalAddress",
      addressLocality: profile.addressLocality,
      addressCountry: profile.addressCountry,
    },
    sameAs: [profile.social.github, profile.social.linkedin, profile.social.leetcode],
  };
}

const jsonLd = buildJsonLd();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0A1B2B" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme")||"dark";document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          suppressHydrationWarning
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <Navbar />
        <div className="md:pl-20 print:pl-0">
          <main id="main-content">{children}</main>
          <Footer />
        </div>
        <BackToTop />
        <AiChatWidget />
        {process.env.NODE_ENV === "production" && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
