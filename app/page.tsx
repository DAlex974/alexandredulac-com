"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, Mail, MapPin, Linkedin, Building2, Zap, Scale, Box, Download, ChevronDown } from "lucide-react";

export default function Page() {
  const [scrolled, setScrolled] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const resumeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (resumeRef.current && !resumeRef.current.contains(e.target as Node)) {
        setResumeOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const resumes = [
    {
      label: "Track 01 · Sustainability & ESG",
      role: "Director, Sustainability",
      href: "/resume/alexandre-dulac-director.pdf",
    },
    {
      label: "Track 02 · PropTech & Product",
      role: "Senior PM / Head of Product",
      href: "/resume/alexandre-dulac-proptech.pdf",
    },
    {
      label: "Track 03 · Advisory & Consulting",
      role: "Director, Sustainability Practice",
      href: "/resume/alexandre-dulac-advisory.pdf",
    },
  ];

  const engagements = [
    {
      client: "SEGRO France",
      year: "2023",
      type: "Logistics portfolio",
      detail:
        "Energy performance certification rolled out across the entire French logistics portfolio — warehouses and last-mile distribution centers, portfolio-scale program coordination."
    },
    {
      client: "Adobe HQ France",
      year: "2024",
      type: "via Cushman & Wakefield",
      detail:
        "Energy audit and technical due diligence on two transactional assignments for one of the world's leading commercial real estate advisors."
    },
    {
      client: "Capital 8, Paris",
      year: "2025",
      type: "≈ 484,000 sq ft prime",
      detail:
        "Commercial energy compliance audit and regulatory diagnostics for transaction on one of the largest prime office complexes in Paris (75008)."
    },
    {
      client: "SIM Mayotte",
      year: "2026",
      type: "Post-cyclone reconstruction",
      detail:
        "Lead engineering consultant on two reconstruction operations — 98 units, ≈ $385K USD in fees, full design-to-handover lifecycle including dynamic thermal simulation."
    }
  ];

  const tracks = [
    {
      icon: Building2,
      label: "REIT in-house",
      role: "Director, Sustainability / ESG",
      desc: "NYC property owners navigating Local Law 97 carbon caps through 2030."
    },
    {
      icon: Box,
      label: "PropTech",
      role: "Senior PM / Head of Product",
      desc: "Real estate and energy compliance platforms scaling across thousands of buildings."
    },
    {
      icon: Scale,
      label: "Advisory",
      role: "Director, Sustainability Practice",
      desc: "Top-tier real estate services or specialist firms (Steven Winter, Cadmus, Bright Power)."
    }
  ];

  return (
    <div className="min-h-screen bg-ivory text-navy">
      {/* Grain overlay */}
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
            <a href="#work" className="hover:opacity-60 transition">
              Work
            </a>
            <a href="#bfy" className="hover:opacity-60 transition">
              BFY
            </a>
            <a href="#now" className="hover:opacity-60 transition">
              Now
            </a>
            <a
              href="#contact"
              className="bg-navy text-ivory px-4 py-2 hover:bg-terracotta transition-colors"
            >
              Get in touch
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 md:pt-40 pb-20 md:pb-32 px-6 md:px-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div
            className="reveal mono text-xs tracking-[0.25em] uppercase mb-8 text-navy/60 flex items-center gap-3"
          >
            <span className="inline-block w-12 h-px bg-navy/40" />
            <span>New York · Director-level · Available immediately</span>
          </div>

          <h1
            className="reveal text-[3.2rem] md:text-[6.5rem] lg:text-[7.5rem] leading-[0.95] font-light tracking-[-0.02em] mb-10"
            style={{ animationDelay: "0.1s" }}
          >
            Real estate
            <br />
            <span className="italic font-normal text-terracotta">sustainability</span>
            <br />
            built to scale.
          </h1>

          <div
            className="reveal max-w-2xl text-lg md:text-xl leading-relaxed text-navy/75 mb-12"
            style={{ animationDelay: "0.25s" }}
          >
            18 years building and running the European equivalent of NYC's
            LL84 / LL87 / LL97 ecosystem — across 5,000+ inspection and audit
            missions, four offices, and the SaaS that's now in regulator
            certification. BREEAM In-Use Practitioner, completing certification
            in late 2026. Two master's degrees and an associate degree,
            WES-evaluated as U.S. equivalents.
          </div>

          <div
            className="reveal flex flex-wrap items-center gap-4"
            style={{ animationDelay: "0.4s" }}
          >
            <a
              href="#contact"
              className="group inline-flex items-center gap-3 bg-navy text-ivory px-7 py-4 mono text-xs tracking-[0.2em] uppercase hover:bg-terracotta transition-colors"
            >
              Start a conversation
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </a>
            <a
              href="#work"
              className="inline-flex items-center gap-3 px-7 py-4 mono text-xs tracking-[0.2em] uppercase border border-navy/20 hover:border-navy transition-colors"
            >
              See the work
            </a>
            <div ref={resumeRef} className="relative z-40">
              <button
                type="button"
                onClick={() => setResumeOpen((v) => !v)}
                aria-expanded={resumeOpen}
                aria-haspopup="true"
                className="inline-flex items-center gap-3 px-7 py-4 mono text-xs tracking-[0.2em] uppercase border border-navy/20 hover:border-navy transition-colors"
              >
                <Download className="w-4 h-4" strokeWidth={1.5} />
                Download Resume
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${
                    resumeOpen ? "rotate-180" : ""
                  }`}
                  strokeWidth={1.5}
                />
              </button>
              <div
                className={`absolute left-0 top-full mt-2 min-w-[280px] max-w-[calc(100vw-3rem)] bg-ivory border border-navy/20 shadow-lg z-50 transition-opacity duration-300 ${
                  resumeOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                role="menu"
              >
                {resumes.map((r) => (
                  <a
                    key={r.href}
                    href={r.href}
                    download
                    onClick={() => setResumeOpen(false)}
                    className="block px-5 py-4 hover:bg-navy hover:text-ivory transition-colors duration-300"
                    role="menuitem"
                  >
                    <div className="mono text-[10px] tracking-[0.25em] uppercase opacity-60 mb-1">
                      {r.label}
                    </div>
                    <div className="font-medium tracking-tight">{r.role}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block absolute right-12 top-32 mono text-[10px] tracking-[0.2em] uppercase text-navy/40 text-right leading-loose">
          Fig. 01
          <br />
          <span className="text-terracotta/60">⎯⎯⎯⎯⎯⎯⎯⎯</span>
          <br />
          Operator + builder
          <br />
          A rare profile in
          <br />
          PropTech &amp; ESG
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative z-0 border-y border-navy/10 bg-navy text-ivory">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
          {[
            ["18+", "Years operating"],
            ["5,000+", "Missions delivered"],
            ["4", "Offices led"],
            ["$2M+", "Public-sector AMO program"]
          ].map(([n, l], i) => (
            <div key={i}>
              <div className="text-5xl md:text-6xl font-light mb-2 tracking-tight">{n}</div>
              <div className="mono text-[10px] tracking-[0.2em] uppercase opacity-60">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Selected Work */}
      <section id="work" className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-4">
              <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-4">§ 01</div>
              <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight">
                Selected
                <br />
                <span className="italic">engagements</span>
              </h2>
            </div>
            <div className="md:col-span-7 md:col-start-6 text-base md:text-lg text-navy/75 leading-relaxed pt-2">
              Tertiary, industrial-logistics, and prime office assets — the same
              compliance, performance, and capex problems NYC owners are solving
              under Local Law 97. Just five years earlier.
            </div>
          </div>

          <div className="border-t border-navy/15">
            {engagements.map((e, i) => (
              <div
                key={i}
                className="border-b border-navy/15 py-8 md:py-10 group hover:bg-navy/[0.02] transition-colors -mx-4 px-4"
              >
                <div className="grid md:grid-cols-12 gap-6 items-baseline">
                  <div className="md:col-span-1 mono text-xs tracking-[0.2em] uppercase text-navy/50">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="md:col-span-3">
                    <div className="text-2xl md:text-3xl font-medium tracking-tight">
                      {e.client}
                    </div>
                    <div className="mono text-xs tracking-[0.2em] uppercase text-terracotta mt-2">
                      {e.year}
                    </div>
                  </div>
                  <div className="md:col-span-2 mono text-xs tracking-[0.15em] uppercase text-navy/60">
                    {e.type}
                  </div>
                  <div className="md:col-span-6 text-navy/80 leading-relaxed">{e.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BFY */}
      <section id="bfy" className="py-24 md:py-32 px-6 md:px-12 bg-navy text-ivory relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-terracotta/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-32 bottom-0 w-96 h-96 rounded-full bg-terracotta/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-4">
              <div className="mono text-xs tracking-[0.25em] uppercase text-ivory/60 mb-4">§ 02 · The build</div>
              <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight">
                BFY-Diagnostics
              </h2>
              <div className="italic text-2xl text-terracotta mt-3">in regulator cert.</div>
            </div>
            <div className="md:col-span-7 md:col-start-6 text-base md:text-lg leading-relaxed text-ivory/85 space-y-6">
              <p>
                A cloud-native SaaS platform productizing 18 years of inspection,
                energy diagnostics, and compliance reporting workflow.
              </p>
              <p>
                Twenty modules. Fifteen-plus functional specifications I authored
                personally. An offline-first PWA for field technicians. A
                Claude-based AI agent. Stripe usage-based billing. Multi-tenant
                internationalization. The entire regulatory energy calculation
                engine — currently in certification with the French national
                building research institute, positioned to be the first
                cloud-native engine on the regulator's validated tools list
                against nine Windows-desktop incumbents.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {[
              { k: "Stack", v: "Next.js · NestJS · PostgreSQL · Prisma · Stripe · Entra ID" },
              { k: "Status", v: "Regulator submission · IP deposit · GTM live" },
              { k: "Customer profile", v: "EDIMM · the firm I run · the user I am" }
            ].map((c, i) => (
              <div
                key={i}
                className="border border-ivory/15 p-6 md:p-8 hover:border-terracotta/60 transition-colors"
              >
                <div className="mono text-[10px] tracking-[0.25em] uppercase text-ivory/50 mb-3">{c.k}</div>
                <div className="text-base leading-relaxed">{c.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Now */}
      <section id="now" className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-4">
              <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-4">§ 03 · Now</div>
              <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight">
                Three tracks,
                <br />
                <span className="italic">one move.</span>
              </h2>
            </div>
            <div className="md:col-span-7 md:col-start-6 text-base md:text-lg text-navy/75 leading-relaxed pt-2">
              Based in NYC. U.S. permanent resident — no sponsorship needed.
              Available immediately for Director-level roles at the intersection
              of real estate sustainability, energy compliance, and PropTech.
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-navy/15">
            {tracks.map((t, i) => {
              const Icon = t.icon;
              return (
                <div
                  key={i}
                  className="bg-ivory p-8 md:p-10 group hover:bg-navy hover:text-ivory transition-colors duration-500"
                >
                  <Icon className="w-7 h-7 mb-6 text-terracotta" strokeWidth={1.25} />
                  <div className="mono text-[10px] tracking-[0.25em] uppercase opacity-60 mb-3">
                    Track {String(i + 1).padStart(2, "0")} · {t.label}
                  </div>
                  <div className="text-2xl font-medium leading-tight tracking-tight mb-4">
                    {t.role}
                  </div>
                  <div className="text-sm leading-relaxed opacity-80">{t.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Credentials strip */}
      <section className="py-16 md:py-20 px-6 md:px-12 border-y border-navy/10">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/50 mb-8">Credentials</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 text-base md:text-lg">
            <div className="flex items-baseline gap-4 border-b border-navy/10 pb-3">
              <span className="mono text-[10px] tracking-[0.2em] text-terracotta">2026 →</span>
              <span>BREEAM In-Use Practitioner · BRE Group (completing late 2026)</span>
            </div>
            <div className="flex items-baseline gap-4 border-b border-navy/10 pb-3">
              <span className="mono text-[10px] tracking-[0.2em] text-terracotta">2020 →</span>
              <span>Court-Appointed Expert Witness · French Court of Appeals</span>
            </div>
            <div className="flex items-baseline gap-4 border-b border-navy/10 pb-3">
              <span className="mono text-[10px] tracking-[0.2em] text-terracotta">Active</span>
              <span>SS3 Asbestos Technical Supervisor · High-risk asbestos abatement supervision</span>
            </div>
            <div className="flex items-baseline gap-4 border-b border-navy/10 pb-3">
              <span className="mono text-[10px] tracking-[0.2em] text-terracotta">Active</span>
              <span>Energy Retrofit Program Advisor · Equivalent of NYSERDA EmPower+ / ENERGY STAR Home Performance</span>
            </div>
            <div className="flex items-baseline gap-4 border-b border-navy/10 pb-3">
              <span className="mono text-[10px] tracking-[0.2em] text-terracotta">2018–20</span>
              <span>M.S. in Real Estate Project Management &amp; Development · ESTP Paris</span>
            </div>
            <div className="flex items-baseline gap-4 border-b border-navy/10 pb-3">
              <span className="mono text-[10px] tracking-[0.2em] text-terracotta">2010–11</span>
              <span>M.S. in Management · IAE Aix-Marseille (English track, EQUIS-accredited)</span>
            </div>
            <div className="flex items-baseline gap-4 border-b border-navy/10 pb-3">
              <span className="mono text-[10px] tracking-[0.2em] text-terracotta">2000–06</span>
              <span>Associate Degree in Computer Engineering Technology · CNAM</span>
            </div>
            <div className="flex items-baseline gap-4 border-b border-navy/10 pb-3">
              <span className="mono text-[10px] tracking-[0.2em] text-terracotta">Active</span>
              <span>Bureau, French Energy &amp; Environment Association · Member, French Federation of Consulting Engineers</span>
            </div>
          </div>
          <div className="mt-6 italic text-sm text-navy/60">
            All credentials evaluated by World Education Services · Reference #7120282
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-32 md:py-40 px-6 md:px-12 bg-ivory relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">§ 04 · Get in touch</div>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-light leading-[1.05] tracking-[-0.02em] mb-12 max-w-5xl">
            Hiring, comparing
            <br />
            notes, or just
            <br />
            <span className="italic text-terracotta">curious</span> — write.
          </h2>

          <div className="mb-12">
            <a
              href="/intro"
              className="group inline-flex items-center gap-3 bg-terracotta text-ivory px-7 py-4 mono text-xs tracking-[0.2em] uppercase hover:bg-navy transition-colors"
            >
              Or book a call directly
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 max-w-6xl">
            <a
              href="mailto:alexandre@alexandredulac.com"
              className="group md:col-span-3 border border-navy/20 p-8 hover:border-terracotta hover:bg-white transition-all"
            >
              <Mail className="w-5 h-5 mb-4 text-terracotta" strokeWidth={1.5} />
              <div className="mono text-[10px] tracking-[0.25em] uppercase text-navy/50 mb-2">Email</div>
              <div className="text-lg font-medium tracking-tight group-hover:text-terracotta transition-colors break-all">
                alexandre@<wbr />alexandredulac.com
              </div>
            </a>
            <a
              href="https://linkedin.com/in/alexandredulac"
              target="_blank"
              rel="noopener noreferrer"
              className="group md:col-span-2 border border-navy/20 p-8 hover:border-terracotta hover:bg-white transition-all"
            >
              <Linkedin className="w-5 h-5 mb-4 text-terracotta" strokeWidth={1.5} />
              <div className="mono text-[10px] tracking-[0.25em] uppercase text-navy/50 mb-2">LinkedIn</div>
              <div className="text-lg font-medium tracking-tight group-hover:text-terracotta transition-colors">
                linkedin.com/in/alexandredulac
              </div>
            </a>
            <a
              href="/resume/alexandre-dulac-director.pdf"
              download
              className="group md:col-span-1 border border-navy/20 p-8 hover:border-terracotta hover:bg-white transition-all"
            >
              <Download className="w-5 h-5 mb-4 text-terracotta" strokeWidth={1.5} />
              <div className="mono text-[10px] tracking-[0.25em] uppercase text-navy/50 mb-2">Resume</div>
              <div className="text-base font-medium tracking-tight group-hover:text-terracotta transition-colors">
                Download Resume
              </div>
            </a>
          </div>

          <div className="mt-16 flex flex-wrap items-center gap-6 mono text-xs tracking-[0.2em] uppercase text-navy/60">
            <span className="inline-flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> New York, NY
            </span>
            <span className="hidden md:inline">·</span>
            <span>+1 (646) 944-2109</span>
            <span className="hidden md:inline">·</span>
            <span className="text-terracotta">U.S. permanent resident</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy/10 py-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mono text-[10px] tracking-[0.25em] uppercase text-navy/50">
          <div>© 2026 Alexandre Dulac · Built in NYC</div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-terracotta" /> alexandredulac.com
          </div>
        </div>
      </footer>
    </div>
  );
}
