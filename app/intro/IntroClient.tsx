"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Compass,
  Layers,
  CircuitBoard,
  Clock,
  ChevronDown,
  Zap,
} from "lucide-react";

const CALENDAR_URL = "https://calendar.app.google/we9AXs7jdZsbdwcZ8";

const topics = [
  {
    icon: Compass,
    label: "If you're an owner or investor",
    title: "Energy & sustainability decisions",
    desc: "Pre-acquisition diligence, portfolio energy risk, LL97 compliance pathways, or a sustainability program that has gone sideways. Bring the specific decision you're sizing.",
  },
  {
    icon: Layers,
    label: "If you're a PropTech founder",
    title: "Product & GTM in regulated real estate",
    desc: "Compliance and energy software needs an operator's lens. Happy to dig into product scope, customer profile, regulatory positioning, or go-to-market with a buyer who runs the workflow.",
  },
  {
    icon: CircuitBoard,
    label: "If you're somewhere in between",
    title: "Open conversation",
    desc: "Sometimes the most useful 30 minutes is the one with no fixed agenda. If the work I've built resonates and you want to compare notes, that's enough of a reason.",
  },
];

const faqs = [
  {
    q: "Where will the call happen?",
    a: "Google Meet — the link is auto-generated and sent in your confirmation email immediately after booking.",
  },
  {
    q: "What time zone do the slots show in?",
    a: "Your local time zone, automatically. Google converts my New York availability to whatever zone your browser detects.",
  },
  {
    q: "What if I need to reschedule?",
    a: "Use the link in your confirmation email — Google handles rescheduling. No need to email me first.",
  },
  {
    q: "Can we do the call in French?",
    a: "Bien sûr. I default to English but happy to switch.",
  },
];

export default function IntroClient() {
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
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-32 md:py-40">
        <div className="reveal mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-8">
          § Schedule a 30-minute call
        </div>
        <h1
          className="reveal text-[3.2rem] md:text-[6.5rem] lg:text-[7rem] leading-[0.95] font-light tracking-[-0.02em]"
          style={{ animationDelay: "0.1s" }}
        >
          Discovery
          <br />
          <span className="italic font-normal">call.</span>
        </h1>
        <p
          className="reveal max-w-2xl text-lg md:text-xl leading-relaxed text-navy/75 mt-10"
          style={{ animationDelay: "0.25s" }}
        >
          Thirty minutes on Google Meet to discuss the energy, sustainability,
          or PropTech decision you&apos;re working through. Owners, investors,
          and PropTech founders welcome — bring the specific question and
          we&apos;ll go from there.
        </p>
        <div
          className="reveal mt-8 mono text-xs tracking-[0.2em] uppercase text-navy/60"
          style={{ animationDelay: "0.4s" }}
        >
          30 minutes · Google Meet · By appointment
        </div>
      </section>

      {/* Who this is for */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-4">
            § Who this is for
          </div>
          <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight">
            Three kinds of
            <br />
            <span className="italic">conversation.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-navy/15 mt-12">
            {topics.map((t, i) => {
              const Icon = t.icon;
              return (
                <div
                  key={i}
                  className="bg-ivory p-8 md:p-10 group hover:bg-navy hover:text-ivory transition-colors duration-500"
                >
                  <Icon className="w-7 h-7 mb-6" strokeWidth={1.25} />
                  <div className="mono text-[10px] tracking-[0.25em] uppercase opacity-60 mb-3">
                    {t.label}
                  </div>
                  <div className="text-2xl font-medium leading-tight tracking-tight mb-4">
                    {t.title}
                  </div>
                  <div className="text-sm leading-relaxed opacity-80">{t.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Booking CTA */}
      <section className="py-24 md:py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">
            § Pick a slot
          </div>
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-12">
            Open my calendar
          </h2>

          <div className="border border-navy/20 p-12 md:p-16 bg-white text-center">
            <Clock className="w-12 h-12 mx-auto" strokeWidth={1.25} />
            <h3 className="text-3xl md:text-4xl font-medium tracking-tight mt-6">
              Book your 30 minutes
            </h3>
            <p className="max-w-md mx-auto text-navy/75 mt-4 leading-relaxed">
              Click below to open the Google Calendar booking page in a new
              tab. Pick any available slot — confirmation and Google Meet link
              are emailed instantly.
            </p>
            <a
              href={CALENDAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-3 bg-navy text-ivory px-8 py-4 mono uppercase tracking-[0.2em] text-xs hover:bg-navy/80 transition-colors group"
            >
              Open booking calendar
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </a>
            <div className="mt-6 mono uppercase tracking-[0.2em] text-[10px] text-navy/50">
              Opens calendar.app.google in a new tab
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-8">
            § Quick answers
          </div>

          {faqs.map((f, i) => (
            <details
              key={i}
              className="group/details border-b border-navy/10 py-5"
            >
              <summary className="cursor-pointer flex items-center justify-between text-base md:text-lg font-medium tracking-tight list-none">
                <span>{f.q}</span>
                <ChevronDown
                  className="w-4 h-4 transition-transform duration-300 group-open/details:rotate-180"
                  strokeWidth={1.5}
                />
              </summary>
              <p className="text-navy/75 leading-relaxed mt-3 pr-8">{f.a}</p>
            </details>
          ))}
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
