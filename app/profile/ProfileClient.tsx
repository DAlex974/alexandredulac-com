"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowUpRight, Zap } from "lucide-react";

const engagements = [
  {
    client: "SEGRO France",
    year: "2023",
    type: "Logistics portfolio",
    detail:
      "Energy performance certification rolled out across the entire French logistics portfolio — warehouses and last-mile distribution centers, portfolio-scale program coordination.",
  },
  {
    client: "Adobe HQ France",
    year: "2024",
    type: "via Cushman & Wakefield",
    detail:
      "Energy audit and technical due diligence on two transactional assignments for one of the world's leading commercial real estate advisors.",
  },
  {
    client: "Capital 8, Paris",
    year: "2025",
    type: "≈ 484,000 sq ft prime",
    detail:
      "Commercial energy compliance audit and regulatory diagnostics for transaction on one of the largest prime office complexes in Paris (75008).",
  },
  {
    client: "SIM Mayotte",
    year: "2026",
    type: "Post-cyclone reconstruction",
    detail:
      "Lead engineering consultant on two reconstruction operations — 98 units, ≈ $385K USD in fees, full design-to-handover lifecycle including dynamic thermal simulation.",
  },
];

const credentials = [
  { period: "2026 →", label: "BREEAM In-Use Practitioner · BRE Group (completing late 2026)" },
  { period: "2020 →", label: "Court-Appointed Expert Witness · French Court of Appeals" },
  { period: "Active", label: "SS3 Asbestos Technical Supervisor · High-risk asbestos abatement supervision" },
  { period: "Active", label: "Energy Retrofit Program Advisor · Equivalent of NYSERDA EmPower+ / ENERGY STAR Home Performance" },
  { period: "2018–20", label: "Post-Graduate Specialized Master's · ESTP Paris" },
  { period: "2009–11", label: "M.S. in Management · IAE Aix-en-Provence (English track, EQUIS)" },
  { period: "Active", label: "Bureau, French Energy & Environment Association · Member, French Federation of Consulting Engineers" },
];

const ventures = [
  {
    name: "EDIMM",
    years: "2008 — present",
    body: "The operating practice. An 18-year French building diagnostics and energy optimization firm, four offices, 5,000+ missions delivered, premium clients spanning logistics (SEGRO), prime office (Capital 8), and transactional advisory (Cushman & Wakefield). EDIMM is where the methodology and the playbook were built.",
  },
  {
    name: "BFY-Diagnostics",
    years: "2022 — present",
    body: "The product play. A cloud-native SaaS for inspection and compliance, currently in regulatory certification, with an embedded AI agent module. Productizing the operator workflow into software that I would use myself.",
  },
  {
    name: "Papilio Strategies LLC",
    years: "2025 — present",
    body: "The US advisory vehicle. New York S-Corp, active US business account in place. The legal and financial footing through which I work with US owners, investors, and PropTech founders.",
  },
];

export default function ProfileClient() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-ivory text-navy">
      <div className="grain pointer-events-none fixed inset-0 opacity-[0.04] z-50 mix-blend-multiply" />

      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled ? "bg-ivory/90 backdrop-blur-md border-b border-navy/10" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
          <div className="mono text-xs tracking-[0.2em] uppercase">Alexandre Dulac</div>
          <a
            href="/"
            className="inline-flex items-center gap-2 mono text-xs tracking-[0.15em] uppercase hover:opacity-60 transition"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Back to home
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="reveal mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-8">
          § Background
        </div>
        <h1
          className="reveal text-[2.6rem] md:text-[4.8rem] lg:text-[5.4rem] leading-[1.02] font-light tracking-[-0.02em] max-w-5xl"
          style={{ animationDelay: "0.1s" }}
        >
          Eighteen years on the
          <br />
          <span className="italic font-normal">operating bench.</span>
        </h1>
        <p
          className="reveal max-w-2xl text-lg md:text-xl leading-relaxed text-navy/75 mt-10"
          style={{ animationDelay: "0.25s" }}
        >
          I built and ran a regulated energy-diagnostics business through a full
          cycle of French regulatory reform — the same arc New York is entering
          now under Local Law 97. This page is the longer answer to who I am and
          what I&apos;ve built.
        </p>
      </section>

      {/* Ventures */}
      <section className="py-16 md:py-24 px-6 md:px-12 border-t border-navy/10">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-10">
            § The three ventures
          </div>
          <div className="border-t border-navy/15">
            {ventures.map((v, i) => (
              <div
                key={i}
                className="border-b border-navy/15 py-10 md:py-12 grid md:grid-cols-12 gap-6 items-baseline"
              >
                <div className="md:col-span-1 mono text-xs tracking-[0.2em] uppercase text-navy/50">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="md:col-span-3">
                  <div className="text-2xl md:text-3xl font-medium tracking-tight">{v.name}</div>
                  <div className="mono text-xs tracking-[0.2em] uppercase text-navy/60 mt-2">
                    {v.years}
                  </div>
                </div>
                <div className="md:col-span-8 text-navy/80 leading-relaxed text-base md:text-lg">
                  {v.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engagement history */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-navy text-ivory">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12 mb-12">
            <div className="md:col-span-4">
              <div className="mono text-xs tracking-[0.25em] uppercase text-ivory/60 mb-4">
                § Engagement history
              </div>
              <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight">
                Selected
                <br />
                <span className="italic">missions.</span>
              </h2>
            </div>
            <div className="md:col-span-7 md:col-start-6 text-base md:text-lg text-ivory/80 leading-relaxed pt-2">
              A short list of recent engagements that illustrate the asset
              classes and counterparties EDIMM operates with.
            </div>
          </div>

          <div className="border-t border-ivory/15">
            {engagements.map((e, i) => (
              <div
                key={i}
                className="border-b border-ivory/15 py-8 md:py-10 grid md:grid-cols-12 gap-6 items-baseline"
              >
                <div className="md:col-span-1 mono text-xs tracking-[0.2em] uppercase text-ivory/50">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="md:col-span-3">
                  <div className="text-2xl md:text-3xl font-medium tracking-tight">
                    {e.client}
                  </div>
                  <div className="mono text-xs tracking-[0.2em] uppercase text-ivory/60 mt-2">
                    {e.year}
                  </div>
                </div>
                <div className="md:col-span-2 mono text-xs tracking-[0.15em] uppercase text-ivory/60">
                  {e.type}
                </div>
                <div className="md:col-span-6 text-ivory/85 leading-relaxed">{e.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-8">
            § Credentials
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 text-base md:text-lg">
            {credentials.map((c, i) => (
              <div
                key={i}
                className="flex items-baseline gap-4 border-b border-navy/10 pb-3"
              >
                <span className="mono text-[10px] tracking-[0.2em] text-navy/50 shrink-0">
                  {c.period}
                </span>
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CV scarcity + CTA */}
      <section className="py-24 md:py-32 px-6 md:px-12 border-t border-navy/10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">
            § Continue the conversation
          </div>
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-8">
            Want the longer version?
          </h2>
          <p className="text-base md:text-lg text-navy/75 leading-relaxed max-w-xl mx-auto mb-10">
            A detailed CV and capabilities deck are available on request, shared
            after an introductory conversation so they land in the right
            context.
          </p>
          <a
            href="/intro"
            className="group inline-flex items-center gap-3 bg-navy text-ivory px-7 py-4 mono text-xs tracking-[0.2em] uppercase hover:bg-navy/80 transition-colors"
          >
            Book a discovery call
            <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          </a>
          <div className="mt-6 text-sm text-navy/60">
            Or write me directly at{" "}
            <a
              href="mailto:alexandre@alexandredulac.com"
              className="underline underline-offset-4 hover:text-navy transition-colors"
            >
              alexandre@alexandredulac.com
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy/10 py-10 px-6 md:px-12">
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
