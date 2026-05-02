import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const SITE_URL = "https://alexandredulac.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Alexandre Dulac — Real Estate Sustainability & PropTech Leader",
    template: "%s · Alexandre Dulac",
  },
  description:
    "Director-level leader in real estate sustainability and energy compliance. 18+ years building and scaling a transnational diagnostics firm, now founder of a cloud-native SaaS in regulator certification. BREEAM In-Use Practitioner. Court-Appointed Expert. Based in NYC, available immediately.",
  keywords: [
    "Alexandre Dulac",
    "Real Estate Sustainability",
    "PropTech",
    "LL97",
    "Energy Compliance",
    "Director Sustainability NYC",
    "BFY-Diagnostics",
    "EDIMM",
    "BREEAM",
    "Sustainable Real Estate",
    "ESG Director NYC",
    "Energy Compliance NYC",
    "Building Decarbonization",
  ],
  authors: [{ name: "Alexandre Dulac" }],
  creator: "Alexandre Dulac",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Alexandre Dulac",
    title: "Alexandre Dulac — Real Estate Sustainability & PropTech Leader",
    description:
      "18+ years scaling building energy compliance across Europe. Founder of EDIMM and BFY-Diagnostics. Based in NYC, available immediately.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alexandre Dulac — Real Estate Sustainability & PropTech Leader",
    description:
      "Director-level leader in real estate sustainability and energy compliance, based in NYC.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
