import type { Metadata } from "next";
import LL33Client from "./LL33Client";

export const metadata: Metadata = {
  title: "LL33 Building Energy Grade — Score to Letter, Gap to Next Grade, Deadlines",
  description:
    "Convert an ENERGY STAR score into the NYC Local Law 33 letter grade, see how many points separate you from the next grade, and check the May 1 benchmarking and October label-posting deadlines. A first-pass tool by Papilio Strategies.",
  alternates: { canonical: "https://alexandredulac.com/tools/ll33" },
  openGraph: {
    title: "LL33 Building Energy Grade · Alexandre Dulac",
    description:
      "ENERGY STAR score → NYC LL33 letter grade, gap to the next grade, and the compliance calendar. First-pass, free.",
    url: "https://alexandredulac.com/tools/ll33",
    type: "website",
  },
};

export default function LL33Page() {
  return <LL33Client />;
}
