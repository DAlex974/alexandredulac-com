"use client";

import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Mail,
  Linkedin,
  Compass,
  Layers,
  CircuitBoard,
  Zap,
} from "lucide-react";

const services = [
  {
    icon: Compass,
    label: "Mode 01",
    title: "Energy Due Diligence",
    desc: "Pre-acquisition and portfolio energy risk, audit-grade, for owners and investors.",
  },
  {
    icon: Layers,
    label: "Mode 02",
    title: "Sustainability Program Management",
    desc: "Turning regulatory and ESG obligations into executable roadmaps owners can actually deliver.",
  },
  {
    icon: CircuitBoard,
    label: "Mode 03",
    title: "PropTech Product Advisory",
    desc: "Product and go-to-market guidance for compliance and energy software, from someone building it.",
  },
];

const ventures = [
  {
    name: "EDIMM",
    locus: "France · since 2008",
    body: "An 18-year building diagnostics and energy optimization firm. Four offices, 5,000+ missions delivered, premium clients including SEGRO France, Cushman & Wakefield, and Capital 8 Paris.",
  },
  {
    name: "BFY-Diagnostics",
    locus: "Cloud-native SaaS",
    body: "Inspection and compliance platform currently in regulatory certification, with an embedded AI agent module. Productizing two decades of operator workflow into software.",
  },
  {
    name: "Papilio Strategies LLC",
    locus: "New York · S-Corp",
    body: "Active New York advisory vehicle through which I work with US clients. US business account in place. The legal and financial footing for transatlantic engagements.",
  },
];

const rare = [
  "An operator who has run a mandatory energy-audit business inside a mature regulatory regime (France), now bringing that perspective to New York as Local Law 97 reshapes the market.",
  "A founder, not a consultant — I've built the firms, the software, and the methodology, not just slide decks.",
  "Court-Appointed Expert at the French Court of Appeals since 2020.",
  "A transatlantic profile: French operational depth, US legal and financial footing already in place (green card, active US entity).",
];

export default function Page() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-ivory text-navy">
      <div className="grain pointer-events-none fixed inset-0 opacity-[0.04] z-50 mix-blend-multiply" />

      {/* Nav */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled ? "bg-ivory/90 backdrop-blur-md border-b border-navy/10" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
          <div className="mono text-xs tracking-[0.2em] uppercase">Alexandre Dulac</div>
          <div className="hidden md:flex items-center gap-8 mono text-xs tracking-[0.15em] uppercase">
            <a href="#how" className="hover:opacity-60 transition">How we work</a>
            <a href="#work" className="hover:opacity-60 transition">Work</a>
            <a href="/tools/ll97" className="hover:opacity-60 transition">LL97 check</a>
            <a href="/profile" className="hover:opacity-60 transition">Background</a>
            <a href="#contact" className="hover:opacity-60 transition">Contact</a>
            <a
              href="/intro"
              className="bg-navy text-ivory px-4 py-2 hover:bg-navy/80 transition-colors"
            >
              Book a discovery call
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 md:pt-40 pb-20 md:pb-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="reveal mono text-xs tracking-[0.25em] uppercase mb-8 text-navy/60 flex items-center gap-3">
            <span className="inline-block w-12 h-px bg-navy/40" />
            <span>Papilio Strategies · New York</span>
          </div>

          <h1
            className="reveal text-[2.6rem] md:text-[5rem] lg:text-[5.6rem] leading-[1.02] font-light tracking-[-0.02em] mb-10 max-w-6xl"
            style={{ animationDelay: "0.1s" }}
          >
            Building diagnostics and energy strategy,
            <br />
            <span className="italic font-normal">from a French operator&apos;s bench
            <br />
            to the New York market.</span>
          </h1>

          <p
            className="reveal max-w-2xl text-lg md:text-xl leading-relaxed text-navy/75 mb-12"
            style={{ animationDelay: "0.25s" }}
          >
            I&apos;m Alexandre Dulac, founder of Papilio Strategies — a New York
            advisory practice helping owners and investors make energy,
            sustainability, and PropTech decisions with the rigor of someone who
            has run the operations, not just advised on them.
          </p>

          <div className="reveal" style={{ animationDelay: "0.4s" }}>
            <a
              href="/intro"
              className="group inline-flex items-center gap-3 bg-navy text-ivory px-7 py-4 mono text-xs tracking-[0.2em] uppercase hover:bg-navy/80 transition-colors"
            >
              Book a discovery call
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <section className="border-y border-navy/10 bg-navy text-ivory">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <div className="text-5xl md:text-6xl font-light mb-2 tracking-tight">18 yrs</div>
            <div className="mono text-[10px] tracking-[0.2em] uppercase opacity-60">Operating</div>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-light mb-2 tracking-tight">5,000+</div>
            <div className="mono text-[10px] tracking-[0.2em] uppercase opacity-60">Missions delivered</div>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-light mb-2 tracking-tight">4</div>
            <div className="mono text-[10px] tracking-[0.2em] uppercase opacity-60">Offices led</div>
          </div>
          <div>
            <div className="text-base md:text-lg font-light leading-snug mb-2 mt-2">
              SEGRO · Cushman &amp; Wakefield · Capital 8 Paris
            </div>
            <div className="mono text-[10px] tracking-[0.2em] uppercase opacity-60">Selected clients</div>
          </div>
        </div>
      </section>

      {/* How we work */}
      <section id="how" className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-4">
              <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-4">§ 01 · How we work</div>
              <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight">
                Three modes of
                <br />
                <span className="italic">engagement.</span>
              </h2>
            </div>
            <div className="md:col-span-7 md:col-start-6 text-base md:text-lg text-navy/75 leading-relaxed pt-2">
              Each mode is scoped to a specific decision a principal is making —
              an acquisition, a regulatory deadline, a product roadmap. No
              retainers, no slide decks for the sake of slide decks.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-navy/15">
            {services.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="bg-ivory p-8 md:p-10 group hover:bg-navy hover:text-ivory transition-colors duration-500"
                >
                  <Icon className="w-7 h-7 mb-6" strokeWidth={1.25} />
                  <div className="mono text-[10px] tracking-[0.25em] uppercase opacity-60 mb-3">
                    {s.label}
                  </div>
                  <div className="text-2xl font-medium leading-tight tracking-tight mb-4">
                    {s.title}
                  </div>
                  <div className="text-sm leading-relaxed opacity-80">{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What I've built */}
      <section id="work" className="py-24 md:py-32 px-6 md:px-12 border-t border-navy/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-4">
              <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-4">§ 02 · Work</div>
              <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight">
                What I&apos;ve
                <br />
                <span className="italic">built.</span>
              </h2>
            </div>
            <div className="md:col-span-7 md:col-start-6 text-base md:text-lg text-navy/75 leading-relaxed pt-2">
              Three vehicles, one continuous thread: operating the regulatory and
              energy systems that real estate owners now have to navigate.
            </div>
          </div>

          <div className="border-t border-navy/15">
            {ventures.map((v, i) => (
              <div
                key={i}
                className="border-b border-navy/15 py-10 md:py-12 group hover:bg-navy/[0.02] transition-colors -mx-4 px-4"
              >
                <div className="grid md:grid-cols-12 gap-6 items-baseline">
                  <div className="md:col-span-1 mono text-xs tracking-[0.2em] uppercase text-navy/50">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="md:col-span-3">
                    <div className="text-2xl md:text-3xl font-medium tracking-tight">
                      {v.name}
                    </div>
                    <div className="mono text-xs tracking-[0.2em] uppercase text-navy/60 mt-2">
                      {v.locus}
                    </div>
                  </div>
                  <div className="md:col-span-8 text-navy/80 leading-relaxed text-base md:text-lg">
                    {v.body}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <a
              href="/profile"
              className="inline-flex items-center gap-2 mono text-xs tracking-[0.2em] uppercase border-b border-navy/30 pb-1 hover:border-navy transition-colors"
            >
              See the engagement history
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </section>

      {/* Why this profile is rare */}
      <section className="py-24 md:py-32 px-6 md:px-12 bg-navy text-ivory">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-4">
              <div className="mono text-xs tracking-[0.25em] uppercase text-ivory/60 mb-4">§ 03 · Differentiation</div>
              <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight">
                Why this profile
                <br />
                <span className="italic">is rare.</span>
              </h2>
            </div>
            <div className="md:col-span-7 md:col-start-6 text-base md:text-lg leading-relaxed text-ivory/80 pt-2">
              Most advisors in this space have either operating depth or US
              market footing. This one has both.
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-ivory/15">
            {rare.map((point, i) => (
              <div key={i} className="bg-navy p-8 md:p-10 flex gap-6">
                <div className="mono text-xs tracking-[0.2em] uppercase text-ivory/40 pt-1 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="text-base md:text-lg leading-relaxed text-ivory/90">
                  {point}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Background */}
      <section id="background" className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">§ 04 · Background</div>
          <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight mb-10">
            Two graduate degrees,
            <br />
            <span className="italic">one operating practice.</span>
          </h2>
          <div className="space-y-6 text-base md:text-lg text-navy/80 leading-relaxed">
            <p>
              Two WES-evaluated master&apos;s degrees (US equivalency): a
              post-graduate specialized master&apos;s from ESTP Paris in
              construction and real estate, and an M.S. in Management from IAE
              Aix-en-Provence (English track, EQUIS-accredited).
            </p>
            <p>
              Court-Appointed Expert at the French Court of Appeals since 2020.
              SS3 Asbestos Technical Supervisor. Energy retrofit program advisor —
              the French equivalent of NYSERDA EmPower+ / ENERGY STAR Home
              Performance. BREEAM In-Use Practitioner, completing certification
              late 2026.
            </p>
            <p>
              Member of the Bureau of the French Energy &amp; Environment
              Association; member of the French Federation of Consulting
              Engineers.
            </p>
          </div>
          <div className="mt-10">
            <a
              href="/profile"
              className="inline-flex items-center gap-2 mono text-xs tracking-[0.2em] uppercase border-b border-navy/30 pb-1 hover:border-navy transition-colors"
            >
              More on my background
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </section>

      {/* Press */}
      <section id="press" className="py-24 md:py-32 px-6 md:px-12 border-t border-navy/10">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-10">§ 05 · Press</div>
          <a
            href="https://www.actu-environnement.com/ae/news/dpe-audit-energetique-reglementaire-vente-passoires-thermiques-alexandre-dulac-edimm-atee-48102.php4"
            target="_blank"
            rel="noopener noreferrer"
            className="group block border border-navy/20 p-8 md:p-12 hover:border-navy hover:bg-white transition-all"
          >
            <div className="grid md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-2 mono text-xs tracking-[0.2em] uppercase text-navy/60">
                Actu-Environnement
                <div className="mt-1 text-navy/40">June 2026</div>
              </div>
              <div className="md:col-span-9">
                <div className="text-2xl md:text-3xl font-medium tracking-tight leading-snug mb-4">
                  « Diagnostic immobilier : les règles clés de l&apos;audit
                  énergétique obligatoire »
                </div>
                <div className="text-navy/75 leading-relaxed text-base md:text-lg">
                  Featured as the expert voice on energy-audit methodology and
                  regulatory compliance.
                </div>
              </div>
              <div className="md:col-span-1 flex justify-end pt-2">
                <ArrowUpRight
                  className="w-5 h-5 group-hover:rotate-45 transition-transform"
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <div className="mt-6 mono text-[10px] tracking-[0.2em] uppercase text-navy/50">
              Read the feature → actu-environnement.com
            </div>
          </a>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-32 md:py-40 px-6 md:px-12 bg-ivory">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">§ 06 · Contact</div>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-light leading-[1.05] tracking-[-0.02em] mb-12 max-w-5xl">
            Let&apos;s talk about the
            <br />
            decision you&apos;re
            <br />
            <span className="italic">actually making.</span>
          </h2>

          <div className="mb-12">
            <a
              href="/intro"
              className="group inline-flex items-center gap-3 bg-navy text-ivory px-7 py-4 mono text-xs tracking-[0.2em] uppercase hover:bg-navy/80 transition-colors"
            >
              Book a discovery call
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <a
              href="mailto:alexandre@alexandredulac.com"
              className="group border border-navy/20 p-8 hover:border-navy hover:bg-white transition-all"
            >
              <Mail className="w-5 h-5 mb-4" strokeWidth={1.5} />
              <div className="mono text-[10px] tracking-[0.25em] uppercase text-navy/50 mb-2">Email</div>
              <div className="text-lg font-medium tracking-tight break-all">
                alexandre@<wbr />alexandredulac.com
              </div>
            </a>
            <a
              href="https://linkedin.com/in/alexandredulac"
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-navy/20 p-8 hover:border-navy hover:bg-white transition-all"
            >
              <Linkedin className="w-5 h-5 mb-4" strokeWidth={1.5} />
              <div className="mono text-[10px] tracking-[0.25em] uppercase text-navy/50 mb-2">LinkedIn</div>
              <div className="text-lg font-medium tracking-tight">
                linkedin.com/in/alexandredulac
              </div>
            </a>
          </div>

          <div className="mt-12 max-w-2xl text-navy/70 italic text-base md:text-lg leading-relaxed border-l border-navy/20 pl-6">
            CV and detailed capabilities are shared after an introductory
            conversation. If that&apos;s useful to you, let&apos;s talk.
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
