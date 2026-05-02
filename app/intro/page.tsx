import type { Metadata } from "next";
import IntroClient from "./IntroClient";

export const metadata: Metadata = {
  title: "Schedule a call · Alexandre Dulac",
  description:
    "Book a 30-minute intro call with Alexandre Dulac to discuss real estate sustainability, PropTech, or LL97 compliance opportunities. Calls on Google Meet — instant confirmation.",
  alternates: { canonical: "https://alexandredulac.com/intro" },
  openGraph: {
    title: "Schedule a call · Alexandre Dulac",
    description:
      "Book a 30-minute intro call with Alexandre Dulac to discuss real estate sustainability, PropTech, or LL97 compliance opportunities. Calls on Google Meet — instant confirmation.",
    url: "https://alexandredulac.com/intro",
    type: "website",
  },
};

export default function IntroPage() {
  return <IntroClient />;
}
