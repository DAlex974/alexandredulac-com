import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const SITE_URL = "https://alexandredulac.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Alexandre Dulac — Papilio Strategies | Energy & Sustainability Advisory, NYC",
    template: "%s · Alexandre Dulac",
  },
  description:
    "Papilio Strategies is a New York advisory practice helping owners, investors, and PropTech founders make energy, sustainability, and product decisions with operator-grade rigor. Founded by Alexandre Dulac — operator, founder, Court-Appointed Expert.",
  keywords: [
    "Alexandre Dulac",
    "Papilio Strategies",
    "Energy Advisory NYC",
    "Sustainability Advisory",
    "Real Estate Due Diligence",
    "LL97",
    "Local Law 97",
    "PropTech Advisory",
    "EDIMM",
    "BFY-Diagnostics",
    "Building Energy Compliance",
    "BREEAM",
    "Court-Appointed Expert",
  ],
  authors: [{ name: "Alexandre Dulac" }],
  creator: "Alexandre Dulac",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Alexandre Dulac · Papilio Strategies",
    title:
      "Alexandre Dulac — Papilio Strategies | Energy & Sustainability Advisory, NYC",
    description:
      "Operator-grade advisory for owners, investors, and PropTech founders navigating energy, sustainability, and compliance.",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Alexandre Dulac — Papilio Strategies | Energy & Sustainability Advisory, NYC",
    description:
      "Operator-grade advisory for owners, investors, and PropTech founders.",
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
