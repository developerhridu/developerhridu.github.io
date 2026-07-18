import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/ui/BackToTop";
import AiChatWidget from "@/components/ui/AiChatWidget";
import config from "@/content/config.json";

const GA_MEASUREMENT_ID = config.gaMeasurementId;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://developerhridu.github.io";

export const metadata: Metadata = {
  title: "Hridu | Full-Stack Software Engineer",
  description:
    "Full-stack software engineer with 4+ years building scalable .NET microservices and modern frontends across travel, food delivery, and recruitment domains.",
  keywords: [
    "software engineer",
    "full-stack",
    "backend",
    ".NET",
    "ASP.NET Core",
    "microservices",
    "C#",
    "Angular",
    "React",
    "developer",
    "portfolio",
    "Dhaka",
    "Bangladesh",
  ],
  authors: [{ name: "Mizanur Rahman" }],
  metadataBase: new URL(BASE_URL),
  alternates: {
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
  openGraph: {
    title: "Hridu | Full-Stack Software Engineer",
    description:
      "Full-stack software engineer with 4+ years building scalable .NET microservices and modern frontends across travel, food delivery, and recruitment domains.",
    type: "website",
    url: BASE_URL,
    images: [{ url: "/images/profile/dp.png", width: 400, height: 400, alt: "Mizanur Rahman" }],
  },
  twitter: {
    card: "summary",
    title: "Hridu | Full-Stack Software Engineer",
    description:
      "Full-stack software engineer with 4+ years building scalable .NET microservices and modern frontends.",
    images: ["/images/profile/dp.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Mizanur Rahman",
  alternateName: "Hridu",
  url: BASE_URL,
  image: `${BASE_URL}/images/profile/dp.png`,
  jobTitle: "Full-Stack Software Engineer",
  worksFor: { "@type": "Organization", name: "TechnoNext Software" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Dhaka",
    addressCountry: "BD",
  },
  sameAs: [
    "https://github.com/developerhridu",
    "https://linkedin.com/in/developerhridu",
    "https://leetcode.com/developerhridu",
  ],
};

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
