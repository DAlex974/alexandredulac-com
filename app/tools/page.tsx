import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Tools — LL97 and LL33 calculators for NYC buildings",
  description:
    "Free first-pass calculators for NYC building owners and investors: Local Law 97 emissions caps and penalty exposure, Local Law 33 energy grade and gap to the next grade. By Papilio Strategies.",
  alternates: { canonical: "https://alexandredulac.com/tools" },
  openGraph: {
    title: "Tools · Alexandre Dulac",
    description: "LL97 compliance check and LL33 energy grade — first-pass, free, sourced to the rule text.",
    url: "https://alexandredulac.com/tools",
    type: "website",
  },
};

const tools = [
  {
    href: "/tools/ll97",
    law: "Local Law 97",
    title: "Compliance check",
    version: "v2 · ESPM · Mixed-use",
    desc: "Where a building — single-use or mixed — sits against its 2024–2029 and 2030–2034 limits on the ENERGY STAR property-type basis, the annual penalty at $268/tCO2e if over, and the cumulative exposure through 2034.",
  },
  {
    href: "/tools/ll33",
    law: "Local Law 33",
    title: "Building energy grade",
    version: "v1 · Modes 1 & 3",
    desc: "ENERGY STAR score to letter grade, points to the next grade, and the May 1 / October 1 calendar.",
  },
];

export default function ToolsIndex() {
  return (
    <div className="min-h-screen bg-ivory text-navy">
      <div className="grain pointer-events-none fixed inset-0 opacity-[0.04] z-50 mix-blend-multiply" />

      <nav className="fixed top-0 left-0 right-0 z-40 bg-ivory/90 backdrop-blur-md border-b border-navy/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
          <div className="mono text-xs tracking-[0.2em] uppercase">Alexandre Dulac</div>
          <a href="/" className="inline-flex items-center gap-2 mono text-xs tracking-[0.15em] uppercase hover:opacity-60 transition">
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Back to home
          </a>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="reveal mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-8">§ Tools</div>
        <h1
          className="reveal text-[2.8rem] md:text-[5.4rem] lg:text-[6rem] leading-[1.02] font-light tracking-[-0.02em] max-w-5xl"
          style={{ animationDelay: "0.1s" }}
        >
          First-pass numbers,
          <br />
          <span className="italic font-normal">sourced to the rule.</span>
        </h1>
        <p className="reveal max-w-2xl text-lg md:text-xl leading-relaxed text-navy/75 mt-10" style={{ animationDelay: "0.25s" }}>
          Free, no account, no gate before a number appears. Every constant
          traces to the statute or the DOB rule it comes from. Estimates, not
          filings — the filing needs a registered design professional.
        </p>
      </section>

      <section className="py-12 md:py-16 px-6 md:px-12 border-t border-navy/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-px bg-navy/15">
          {tools.map((t) => (
            <a key={t.href} href={t.href} className="group bg-ivory p-8 md:p-12 hover:bg-navy hover:text-ivory transition-colors duration-500">
              <div className="mono text-[10px] tracking-[0.25em] uppercase opacity-60 mb-3">
                {t.law} · {t.version}
              </div>
              <div className="text-3xl md:text-4xl font-medium leading-tight tracking-tight mb-4 flex items-baseline gap-3">
                {t.title}
                <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform shrink-0" strokeWidth={1.5} />
              </div>
              <div className="text-base leading-relaxed opacity-80 max-w-md">{t.desc}</div>
            </a>
          ))}
        </div>
      </section>

      <footer className="border-t border-navy/10 py-10 px-6 md:px-12 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mono text-[10px] tracking-[0.25em] uppercase text-navy/50">
          <div>© 2026 Papilio Strategies LLC · New York</div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3" /> alexandredulac.com
          </div>
        </div>
      </footer>
    </div>
  );
}
