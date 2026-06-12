import type { Metadata } from "next";
import IntroClient from "./IntroClient";

export const metadata: Metadata = {
  title: "Discovery call · Alexandre Dulac",
  description:
    "Book a 30-minute discovery call with Alexandre Dulac, founder of Papilio Strategies, to discuss energy, sustainability, LL97 compliance, or PropTech product decisions. Google Meet, instant confirmation.",
  alternates: { canonical: "https://alexandredulac.com/intro" },
  openGraph: {
    title: "Discovery call · Alexandre Dulac",
    description:
      "Book a 30-minute discovery call with Alexandre Dulac, founder of Papilio Strategies. Google Meet, instant confirmation.",
    url: "https://alexandredulac.com/intro",
    type: "website",
  },
};

export default function IntroPage() {
  return <IntroClient />;
}
