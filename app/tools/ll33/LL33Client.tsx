"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { ArrowLeft, ArrowUpRight, ChevronDown, Zap } from "lucide-react";

type Grade = "A" | "B" | "C" | "D" | "F" | "N";
type TargetGrade = "A" | "B" | "C";
type Status = "score" | "not_submitted" | "exempt";

type SourceRef = { ruleset: string; version: string; citation: string; url: string };
type Envelope<T> = {
  value: T;
  method: string;
  sources: SourceRef[];
  rulesetHash: string;
  computedAt: string;
};

type GradeValue = { grade: Grade; score?: number; band?: { min: number; max: number } };

type GapValue = {
  currentScore: number;
  currentGrade: Grade;
  targetGrade: TargetGrade;
  targetMinScore: number;
  pointsNeeded: number;
  alreadyMet: boolean;
  euiReduction: {
    modelVersion: string;
    pct: number;
    kbtuPerSf?: number;
    totalKbtuPerYear?: number;
    spendReductionUsd?: number;
  } | null;
  euiReductionUnavailableReason?: string;
};

const STATUSES: { kind: Status; label: string; hint: string }[] = [
  { kind: "score", label: "I have a score", hint: "Benchmarking was submitted and Portfolio Manager returned a 1–100 score." },
  { kind: "not_submitted", label: "Benchmarking not submitted", hint: "Required LL84 benchmarking was not filed — DOB assigns an F." },
  { kind: "exempt", label: "Exempt or not scorable", hint: "Not covered by benchmarking, or a property type ENERGY STAR cannot score — DOB assigns an N." },
];

const TARGETS: { grade: TargetGrade; min: number }[] = [
  { grade: "A", min: 85 },
  { grade: "B", min: 70 },
  { grade: "C", min: 55 },
];

const PROPERTY_TYPES = ["Multifamily Housing", "Office"];

const GRADE_MEANING: Record<Grade, string> = {
  A: "Top of the peer distribution. Posted in green on the DOB label.",
  B: "Above the median of comparable buildings.",
  C: "Around or just below the median of comparable buildings.",
  D: "Bottom of the peer distribution. The label is the same size as an A.",
  F: "Assigned when required benchmarking was not submitted — regardless of actual performance.",
  N: "No grade: the building is exempt from benchmarking or ENERGY STAR cannot score its property type.",
};

const CALENDAR = [
  { when: "May 1", what: "Benchmark energy and water for the prior calendar year in ENERGY STAR Portfolio Manager (LL84). Late or missing benchmarking is an automatic F." },
  { when: "October 1", what: "DOB issues the Building Energy Efficiency Rating label." },
  { when: "By October 31", what: "Post the label within 30 days, in a conspicuous location near each public entrance. One label per entrance. Display until the following October 1." },
  { when: "Ongoing", what: "Failure to post: a $1,250 violation. Placards printed before LL95 of 2019 use the old thresholds and may be non-compliant even where the letter is right." },
];

function parseNumber(s: string): number | undefined {
  if (s.trim() === "") return undefined;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function fmt(n: number, digits = 0): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

async function post<T>(body: unknown): Promise<Envelope<T>> {
  const res = await fetch("/api/tools/ll33", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Request failed.");
  return json as Envelope<T>;
}

const inputClass =
  "w-full bg-transparent border-b border-navy/30 pb-2 text-2xl md:text-3xl font-light tracking-tight focus:outline-none focus:border-navy transition-colors";
const labelClass = "mono text-[10px] tracking-[0.25em] uppercase text-navy/60 mb-2";
const buttonClass =
  "group inline-flex items-center gap-3 bg-navy text-ivory px-8 py-4 mono text-xs tracking-[0.2em] uppercase hover:bg-navy/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export default function LL33Client() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const reportYear = new Date().getFullYear() - 1;

  // Mode 1
  const [status, setStatus] = useState<Status>("score");
  const [scoreText, setScoreText] = useState("");
  const [gradeResult, setGradeResult] = useState<Envelope<GradeValue> | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [gradeLoading, setGradeLoading] = useState(false);

  // Mode 3
  const [target, setTarget] = useState<TargetGrade>("B");
  const [propertyType, setPropertyType] = useState("");
  const [euiText, setEuiText] = useState("");
  const [areaText, setAreaText] = useState("");
  const [spendText, setSpendText] = useState("");
  const [gapResult, setGapResult] = useState<Envelope<GapValue> | null>(null);
  const [gapError, setGapError] = useState<string | null>(null);
  const [gapLoading, setGapLoading] = useState(false);

  const score = parseNumber(scoreText);
  const scoreValid = score !== undefined && score >= 1 && score <= 100;
  const canGrade = status !== "score" || scoreValid;

  const currentGrade = gradeResult?.value.grade;
  const gapEligible = status === "score" && scoreValid && currentGrade !== undefined && currentGrade !== "A";
  const availableTargets = TARGETS.filter((t) => score !== undefined && t.min > score);

  useEffect(() => {
    if (availableTargets.length && !availableTargets.some((t) => t.grade === target)) {
      setTarget(availableTargets[availableTargets.length - 1].grade);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreText]);

  async function runGrade() {
    setGradeLoading(true);
    setGradeError(null);
    setGapResult(null);
    try {
      const r = await post<GradeValue>({ mode: "grade", status, score, reportYear });
      setGradeResult(r);
      track("ll33_grade_lookup", { grade: r.value.grade });
    } catch (e) {
      setGradeResult(null);
      setGradeError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setGradeLoading(false);
    }
  }

  async function runGap() {
    if (score === undefined) return;
    setGapLoading(true);
    setGapError(null);
    try {
      const r = await post<GapValue>({
        mode: "gap",
        currentScore: score,
        targetGrade: target,
        reportYear,
        propertyType: propertyType || undefined,
        currentSourceEuiKbtuPerSf: parseNumber(euiText),
        grossFloorAreaSqft: parseNumber(areaText),
        annualUtilitySpendUsd: parseNumber(spendText),
      });
      setGapResult(r);
      track("ll33_gap_run", { fromGrade: r.value.currentGrade, toGrade: r.value.targetGrade });
    } catch (e) {
      setGapResult(null);
      setGapError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setGapLoading(false);
    }
  }

  const lastEnvelope = gapResult ?? gradeResult;
  const showLL97Link = currentGrade === "C" || currentGrade === "D";

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
          <a href="/" className="inline-flex items-center gap-2 mono text-xs tracking-[0.15em] uppercase hover:opacity-60 transition">
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Back to home
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="reveal mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-8">§ Tool · Local Law 33</div>
        <h1
          className="reveal text-[2.8rem] md:text-[5.4rem] lg:text-[6rem] leading-[1.02] font-light tracking-[-0.02em] max-w-5xl"
          style={{ animationDelay: "0.1s" }}
        >
          Building energy
          <br />
          <span className="italic font-normal">grade.</span>
        </h1>
        <p className="reveal max-w-2xl text-lg md:text-xl leading-relaxed text-navy/75 mt-10" style={{ animationDelay: "0.25s" }}>
          DOB assigns the Local Law 33 letter from your ENERGY STAR score and
          posts it every October. This tool runs that conversion forward —
          the grade you will get, how many points separate you from the next
          one, and the dates that matter.
        </p>
        <div className="reveal mt-8 mono text-xs tracking-[0.2em] uppercase text-navy/60" style={{ animationDelay: "0.4s" }}>
          Mode 1 · Score to grade · Mode 3 · Gap to next grade · v1
        </div>
      </section>

      {/* Mode 1 */}
      <section className="py-12 md:py-16 px-6 md:px-12 border-t border-navy/10">
        <div className="max-w-4xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">§ 01 · Your score</div>

          <div className="grid gap-px bg-navy/15 md:grid-cols-3 mb-10">
            {STATUSES.map((s) => (
              <button
                key={s.kind}
                type="button"
                onClick={() => {
                  setStatus(s.kind);
                  setGradeResult(null);
                  setGapResult(null);
                }}
                aria-pressed={status === s.kind}
                className={`text-left p-6 transition-colors duration-300 ${
                  status === s.kind ? "bg-navy text-ivory" : "bg-ivory hover:bg-navy/[0.04]"
                }`}
              >
                <div className="text-base font-medium tracking-tight mb-2">{s.label}</div>
                <div className={`text-sm leading-relaxed ${status === s.kind ? "text-ivory/75" : "text-navy/60"}`}>{s.hint}</div>
              </button>
            ))}
          </div>

          {status === "score" && (
            <label className="block max-w-sm mb-10">
              <div className={labelClass}>ENERGY STAR score · report year {reportYear}</div>
              <input
                type="text"
                inputMode="numeric"
                value={scoreText}
                onChange={(e) => {
                  setScoreText(e.target.value);
                  setGradeResult(null);
                  setGapResult(null);
                }}
                placeholder="1 – 100"
                className={inputClass}
              />
              <div className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 mt-2">From Portfolio Manager, whole number</div>
            </label>
          )}

          <button type="button" disabled={!canGrade || gradeLoading} onClick={runGrade} className={buttonClass}>
            {gradeLoading ? "Working…" : "Get the grade"}
            <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          </button>
          {gradeError && <div className="mt-4 text-sm text-navy/70">{gradeError}</div>}
        </div>
      </section>

      {/* Grade result */}
      {gradeResult && (
        <section className="py-16 md:py-24 px-6 md:px-12 bg-navy text-ivory">
          <div className="max-w-4xl mx-auto grid md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-4">
              <div className="mono text-[10px] tracking-[0.25em] uppercase text-ivory/60 mb-4">§ 02 · Grade</div>
              <div className="text-[7rem] md:text-[9rem] leading-none font-light tracking-[-0.04em]">{gradeResult.value.grade}</div>
              {gradeResult.value.band && (
                <div className="mono text-[10px] tracking-[0.2em] uppercase text-ivory/50 mt-4">
                  Scores {gradeResult.value.band.min}–{gradeResult.value.band.max}
                </div>
              )}
            </div>
            <div className="md:col-span-7 md:col-start-6 pt-2">
              <p className="text-lg md:text-xl leading-relaxed text-ivory/90">{GRADE_MEANING[gradeResult.value.grade]}</p>
              <p className="text-sm leading-relaxed text-ivory/60 mt-6">
                This is the statutory conversion, exact. The only authoritative
                grade is the one DOB issues on October 1 from your filed
                benchmarking.
              </p>
              {showLL97Link && (
                <p className="text-sm leading-relaxed text-ivory/75 mt-6 border-l border-ivory/20 pl-5">
                  A C or D is not a formal predictor of Local Law 97
                  non-compliance — the two are correlated because both derive
                  from the same benchmarking data, nothing more. If you have
                  last year&apos;s consumption to hand,{" "}
                  <a href="/tools/ll97" className="underline underline-offset-4 hover:text-ivory">
                    run the LL97 check
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Mode 3 */}
      {gapEligible && (
        <section className="py-16 md:py-24 px-6 md:px-12 border-t border-navy/10">
          <div className="max-w-4xl mx-auto">
            <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-4">§ 03 · Gap to the next grade</div>
            <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight mb-10">
              From {currentGrade} to
              <br />
              <span className="italic">where?</span>
            </h2>

            <div className={labelClass}>Target grade</div>
            <div className="flex gap-px bg-navy/15 mb-10 max-w-sm">
              {availableTargets.map((t) => (
                <button
                  key={t.grade}
                  type="button"
                  onClick={() => {
                    setTarget(t.grade);
                    setGapResult(null);
                  }}
                  aria-pressed={target === t.grade}
                  className={`flex-1 py-4 text-2xl font-light tracking-tight transition-colors duration-300 ${
                    target === t.grade ? "bg-navy text-ivory" : "bg-ivory hover:bg-navy/[0.04]"
                  }`}
                >
                  {t.grade}
                  <div className="mono text-[10px] tracking-[0.2em] uppercase opacity-60 mt-1">≥ {t.min}</div>
                </button>
              ))}
            </div>

            <details className="group/details border-y border-navy/10 py-5 mb-10">
              <summary className="cursor-pointer flex items-center justify-between text-base md:text-lg font-medium tracking-tight list-none">
                <span>Translate points into energy — optional</span>
                <ChevronDown className="w-4 h-4 transition-transform duration-300 group-open/details:rotate-180" strokeWidth={1.5} />
              </summary>
              <p className="text-sm text-navy/60 leading-relaxed mt-3 mb-8 max-w-2xl">
                Points are exact. Turning them into a source-EUI reduction
                needs the EPA score model for your property type. Where that
                model is not yet loaded, the tool says so instead of guessing.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <label className="block">
                  <div className={labelClass}>Property type</div>
                  <select
                    value={propertyType}
                    onChange={(e) => {
                      setPropertyType(e.target.value);
                      setGapResult(null);
                    }}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="">Not specified</option>
                    {PROPERTY_TYPES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <div className={labelClass}>Current source EUI</div>
                  <input type="text" inputMode="decimal" value={euiText} onChange={(e) => { setEuiText(e.target.value); setGapResult(null); }} placeholder="e.g. 145" className={inputClass} />
                  <div className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 mt-2">kBtu / sf / yr · from Portfolio Manager</div>
                </label>
                <label className="block">
                  <div className={labelClass}>Gross floor area</div>
                  <input type="text" inputMode="numeric" value={areaText} onChange={(e) => { setAreaText(e.target.value); setGapResult(null); }} placeholder="e.g. 120,000" className={inputClass} />
                  <div className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 mt-2">sq ft</div>
                </label>
                <label className="block">
                  <div className={labelClass}>Annual utility spend</div>
                  <input type="text" inputMode="numeric" value={spendText} onChange={(e) => { setSpendText(e.target.value); setGapResult(null); }} placeholder="e.g. 850,000" className={inputClass} />
                  <div className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 mt-2">USD / yr · all fuels</div>
                </label>
              </div>
            </details>

            <button type="button" disabled={gapLoading || availableTargets.length === 0} onClick={runGap} className={buttonClass}>
              {gapLoading ? "Working…" : "Size the gap"}
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </button>
            {gapError && <div className="mt-4 text-sm text-navy/70">{gapError}</div>}

            {gapResult && (
              <div className="mt-12 border border-navy/20 bg-white p-8 md:p-12">
                <div className="grid md:grid-cols-12 gap-8 items-baseline">
                  <div className="md:col-span-5">
                    <div className={labelClass}>Points needed</div>
                    <div className="text-6xl md:text-7xl font-light tracking-tight">
                      {gapResult.value.pointsNeeded}
                      <span className="text-lg text-navy/50 ml-3">
                        {gapResult.value.currentScore} → {gapResult.value.targetMinScore}
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-7">
                    {gapResult.value.euiReduction ? (
                      <div>
                        <div className={labelClass}>Source-EUI reduction required</div>
                        <div className="text-4xl md:text-5xl font-light tracking-tight">
                          {fmt(gapResult.value.euiReduction.pct * 100, 1)}%
                        </div>
                        <div className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 mt-3 space-y-1">
                          {gapResult.value.euiReduction.kbtuPerSf !== undefined && (
                            <div>≈ {fmt(gapResult.value.euiReduction.kbtuPerSf, 1)} kBtu / sf / yr</div>
                          )}
                          {gapResult.value.euiReduction.totalKbtuPerYear !== undefined && (
                            <div>≈ {fmt(gapResult.value.euiReduction.totalKbtuPerYear)} kBtu / yr to remove</div>
                          )}
                          {gapResult.value.euiReduction.spendReductionUsd !== undefined && (
                            <div>≈ ${fmt(gapResult.value.euiReduction.spendReductionUsd)} / yr, proportional</div>
                          )}
                          <div>EPA model {gapResult.value.euiReduction.modelVersion}</div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className={labelClass}>Energy translation</div>
                        <p className="text-base text-navy/75 leading-relaxed">{gapResult.value.euiReductionUnavailableReason}</p>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-navy/60 leading-relaxed mt-8 max-w-2xl">
                  A target, not a recommendation. Which measures get you there
                  — envelope, systems, controls, operations — is the
                  conversation, not the calculator.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Calendar */}
      <section className="py-16 md:py-24 px-6 md:px-12 border-t border-navy/10">
        <div className="max-w-4xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-4">§ 04 · The calendar</div>
          <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight mb-10">
            Two dates,
            <br />
            <span className="italic">one placard.</span>
          </h2>
          <div className="border-t border-navy/15">
            {CALENDAR.map((c) => (
              <div key={c.when} className="border-b border-navy/15 py-6 grid md:grid-cols-12 gap-4 items-baseline">
                <div className="md:col-span-3 text-2xl md:text-3xl font-light tracking-tight">{c.when}</div>
                <div className="md:col-span-9 text-navy/80 leading-relaxed">{c.what}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">§ 05 · Next step</div>
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
            {currentGrade === "A" || currentGrade === "B" ? "Holding the grade." : "Moving the grade."}
          </h2>
          <p className="text-base md:text-lg text-navy/75 leading-relaxed max-w-xl mx-auto mb-10">
            {currentGrade === "A" || currentGrade === "B"
              ? "A good letter today does not settle 2030. Thirty minutes is enough to check the grade against the LL97 cap and the next recalibration of the ENERGY STAR model."
              : "The points are the easy part to compute. Which measures earn them, in what order, at what cost — that is a thirty-minute conversation with someone who has run the audits."}
          </p>
          <a
            href="/intro"
            onClick={() => track("tool_cta_discovery_call", { tool: "ll33", verdict: currentGrade ?? "none" })}
            className={buttonClass}
          >
            Book a discovery call
            <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          </a>
        </div>
      </section>

      {/* Method & disclaimer */}
      <section className="py-16 md:py-24 px-6 md:px-12 border-t border-navy/10">
        <div className="max-w-3xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">§ Method &amp; disclaimer</div>
          <div className="space-y-4 text-sm md:text-base text-navy/75 leading-relaxed">
            <p>
              Mode 1 is the statutory conversion and is exact. Mode 3 computes
              points exactly; the energy translation, where available, uses the
              EPA score model for the stated property type and is an estimate
              of the source-EUI change needed, not a projection of any
              specific measure.
            </p>
            <p>
              Results are indicative only and are not a certification of
              compliance under NYC Administrative Code §28-309. The grade DOB
              issues from your filed benchmarking is the only authoritative
              value.
            </p>
            {lastEnvelope && (
              <div className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 pt-4 space-y-1">
                <div>Method: {lastEnvelope.method}</div>
                {lastEnvelope.sources.map((s) => (
                  <div key={s.ruleset}>
                    {s.citation} · {s.ruleset}@{s.version}
                  </div>
                ))}
                <div>Ruleset hash {lastEnvelope.rulesetHash}</div>
              </div>
            )}
            {!lastEnvelope && (
              <p className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 pt-4">
                Sources: NYC Admin Code §28-309.12 as amended by LL95 of 2019 (grade thresholds, label display) · EPA ENERGY STAR score technical references (Mode 3 energy translation).
              </p>
            )}
          </div>
        </div>
      </section>

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
