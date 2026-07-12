import type { Metadata } from "next";
import LL97Client from "./LL97Client";

export const metadata: Metadata = {
  title: "LL97 Compliance Check · Alexandre Dulac",
  description:
    "First-pass estimate of your NYC building's compliance with Local Law 97 emission caps for 2024–2029 and 2030–2034, and the annual excess-emissions penalty at $268/tCO2e. Group B (Business) — v1.",
  alternates: { canonical: "https://alexandredulac.com/tools/ll97" },
  openGraph: {
    title: "LL97 Compliance Check · Alexandre Dulac",
    description:
      "Estimate your NYC building's LL97 compliance for 2029 and 2030 in under a minute. A tool by Papilio Strategies.",
    url: "https://alexandredulac.com/tools/ll97",
    type: "website",
  },
};

export default function LL97Page() {
  return <LL97Client />;
}
