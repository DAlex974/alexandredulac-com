import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Background · Alexandre Dulac",
  description:
    "Background of Alexandre Dulac — founder of Papilio Strategies, EDIMM, and BFY-Diagnostics. Court-Appointed Expert at the French Court of Appeals. Operator-turned-advisor working with US owners and investors.",
  alternates: { canonical: "https://alexandredulac.com/profile" },
  openGraph: {
    title: "Background · Alexandre Dulac",
    description:
      "Operator-turned-advisor. Founder of Papilio Strategies, EDIMM, and BFY-Diagnostics. Court-Appointed Expert since 2020.",
    url: "https://alexandredulac.com/profile",
    type: "profile",
  },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
