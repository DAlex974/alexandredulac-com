import type { Metadata } from "next";
import LL97Client from "./LL97Client";

export const metadata: Metadata = {
  title: "LL97 Compliance Calculator — NYC Emission Caps 2024–2029 and 2030–2034",
  description:
    "Estimate whether a NYC building — single-use or mixed — clears its Local Law 97 emissions limits for 2024–2029 and 2030–2034 under the ENERGY STAR property-type basis, the annual penalty at $268/tCO2e if it doesn't, and the cumulative exposure through 2034. First-pass, free, sourced to 1 RCNY §103-14.",
  alternates: { canonical: "https://alexandredulac.com/tools/ll97" },
  openGraph: {
    title: "LL97 Compliance Calculator · Alexandre Dulac",
    description:
      "NYC Local Law 97: emissions cap, penalty and cumulative exposure for 2024–2029 and 2030–2034, mixed-use supported. A tool by Papilio Strategies.",
    url: "https://alexandredulac.com/tools/ll97",
    type: "website",
  },
};

export default function LL97Page() {
  return <LL97Client />;
}
