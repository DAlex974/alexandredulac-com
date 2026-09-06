"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Minus,
  Plus,
  Zap,
} from "lucide-react";
import type { CoverageValue, EmissionsValue, EnergyUnit, LimitValue, PenaltyValue, SourceRef } from "@papilio/calc-core";

type Basis = "espm" | "occupancy";
type Period = "2024-2029" | "2030-2034";
type AreaUnit = "sqft" | "m2";
type Config = "single" | "lot" | "condo";

type Catalog = {
  propertyTypes: string[];
  occupancyGroups: string[];
  sources: { key: string; label: string; units: EnergyUnit[]; primary: boolean }[];
  filingYears: number[];
  lastOccupancyFilingYear: number;
  periods: Period[];
  pdf: boolean;
  version: string;
};

type PeriodResult = { limit: LimitValue; emissions: EmissionsValue; penalty: PenaltyValue };

type CheckResult = {
  version: string;
  filingYear: number;
  basis: Basis;
  permittedBases: Basis[];
  asOfYear: number;
  totalAreaSqft: number;
  periods: Record<Period, PeriodResult>;
  method: string;
  sources: SourceRef[];
  rulesetHash: string;
  computedAt: string;
};

type SpaceRow = { id: number; propertyType: string; areaText: string; areaUnit: AreaUnit };
type SourceRow = { source: string; valueText: string; unit: EnergyUnit };

const M2_PER_SQFT = 0.092903;

const UNIT_LABEL: Record<EnergyUnit, string> = {
  kWh: "kWh",
  kBtu: "kBtu",
  therm: "therms",
  CCF: "CCF",
  gallon_fuel_oil_2: "gallons",
  Mlb_steam: "Mlb",
};

const DEFAULT_UNIT: Record<string, EnergyUnit> = {
  electricity: "kWh",
  natural_gas: "therm",
  district_steam: "Mlb_steam",
  fuel_oil_2: "gallon_fuel_oil_2",
};

const CONFIGS: { key: Config; label: string; field: string; hint: string }[] = [
  { key: "single", label: "One building", field: "Gross floor area of the building", hint: "Covered above 25,000 gsf." },
  { key: "lot", label: "Two or more buildings on one tax lot", field: "Combined gross floor area on the lot", hint: "Covered above 50,000 gsf combined." },
  { key: "condo", label: "Condominium buildings under one board", field: "Combined gross floor area under the board", hint: "Covered above 50,000 gsf combined." },
];

function parseNumber(s: string): number | undefined {
  if (s.trim() === "") return undefined;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}
const fmt = (n: number, digits = 0) => n.toLocaleString("en-US", { maximumFractionDigits: digits });
const fmtT = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtUsd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${n >= 0 ? "" : "−"}${Math.abs(n * 100).toFixed(1)}%`;

async function api<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/tools/ll97", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Request failed.");
  return json as T;
}

const inputClass =
  "w-full bg-transparent border-b border-navy/30 pb-2 text-2xl md:text-3xl font-light tracking-tight focus:outline-none focus:border-navy transition-colors";
const selectClass =
  "w-full bg-transparent border-b border-navy/30 pb-2 text-lg md:text-xl font-light tracking-tight focus:outline-none focus:border-navy transition-colors appearance-none";
const labelClass = "mono text-[10px] tracking-[0.25em] uppercase text-navy/60 mb-2";
const microClass = "mono text-[10px] tracking-[0.2em] uppercase text-navy/50";
const buttonClass =
  "group inline-flex items-center gap-3 bg-navy text-ivory px-8 py-4 mono text-xs tracking-[0.2em] uppercase hover:bg-navy/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const ghostButtonClass =
  "inline-flex items-center gap-2 mono text-[10px] tracking-[0.2em] uppercase border-b border-navy/30 pb-1 hover:border-navy transition-colors";

let nextId = 1;

export default function LL97Client() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  useEffect(() => {
    fetch("/api/tools/ll97")
      .then((r) => r.json())
      .then((c: Catalog) => setCatalog(c))
      .catch(() => setCatalog(null));
  }, []);

  // §01 coverage
  const [config, setConfig] = useState<Config>("single");
  const [gsfText, setGsfText] = useState("");
  const [cov, setCov] = useState<CoverageValue | null>(null);
  const [covLoading, setCovLoading] = useState(false);
  const [covError, setCovError] = useState<string | null>(null);
  const [continueAnyway, setContinueAnyway] = useState(false);

  // §02 filing
  const [filingYear, setFilingYear] = useState(2026);
  const [basis, setBasis] = useState<Basis>("espm");

  // §03 spaces
  const [spaces, setSpaces] = useState<SpaceRow[]>([{ id: nextId++, propertyType: "", areaText: "", areaUnit: "sqft" }]);

  // §04 energy
  const [sources, setSources] = useState<SourceRow[]>([]);
  useEffect(() => {
    if (!catalog || sources.length) return;
    setSources(catalog.sources.filter((s) => s.primary).map((s) => ({ source: s.key, valueText: "", unit: DEFAULT_UNIT[s.key] ?? s.units[0] })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog]);

  // result
  const [result, setResult] = useState<CheckResult | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const occupancyAllowed = catalog ? filingYear <= catalog.lastOccupancyFilingYear : false;
  useEffect(() => {
    if (!occupancyAllowed && basis === "occupancy") setBasis("espm");
  }, [occupancyAllowed, basis]);

  // When the basis flips, the type lists are different: reset the picks.
  useEffect(() => {
    setSpaces((rows) => rows.map((r) => ({ ...r, propertyType: "" })));
    setResult(null);
  }, [basis]);

  const typeOptions = catalog ? (basis === "espm" ? catalog.propertyTypes : catalog.occupancyGroups) : [];

  const gsf = parseNumber(gsfText);
  const covered = cov?.covered || continueAnyway;

  const spacesSqft = useMemo(
    () =>
      spaces.reduce((sum, r) => {
        const a = parseNumber(r.areaText) ?? 0;
        return sum + (r.areaUnit === "m2" ? a / M2_PER_SQFT : a);
      }, 0),
    [spaces],
  );
  const areaMismatch = gsf !== undefined && gsf > 0 && spacesSqft > 0 && Math.abs(spacesSqft - gsf) / gsf > 0.01;

  const spacesValid = spaces.length > 0 && spaces.every((r) => r.propertyType && (parseNumber(r.areaText) ?? 0) > 0);
  const anySource = sources.some((s) => (parseNumber(s.valueText) ?? 0) > 0);
  const canRun = Boolean(catalog) && covered && spacesValid && anySource;

  const invalidate = () => setResult(null);

  async function runCoverage() {
    setCovLoading(true);
    setCovError(null);
    setContinueAnyway(false);
    setResult(null);
    try {
      const body: Record<string, unknown> = { mode: "coverage" };
      if (config === "single") body.singleBuildingGsf = gsf;
      if (config === "lot") body.sameTaxLotTotalGsf = gsf;
      if (config === "condo") body.condoBoardTotalGsf = gsf;
      setCov(await api<CoverageValue>(body));
    } catch (e) {
      setCov(null);
      setCovError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setCovLoading(false);
    }
  }

  async function runCheck() {
    setRunLoading(true);
    setRunError(null);
    try {
      const r = await api<CheckResult>({
        mode: "check",
        filingYear,
        basis,
        spaces: spaces.map((s) => ({ propertyType: s.propertyType, area: parseNumber(s.areaText), areaUnit: s.areaUnit })),
        sources: sources.map((s) => ({ source: s.source, value: parseNumber(s.valueText) ?? 0, unit: s.unit })),
      });
      setResult(r);
      track("ll97_check_run", {
        basis: r.basis,
        filingYear: r.filingYear,
        spaceCount: spaces.length,
        overCap2029: !r.periods["2024-2029"].penalty.compliant,
        overCap2030: !r.periods["2030-2034"].penalty.compliant,
      });
    } catch (e) {
      setResult(null);
      setRunError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setRunLoading(false);
    }
  }

  const p29 = result?.periods["2024-2029"];
  const p30 = result?.periods["2030-2034"];
  const bothClear = Boolean(p29?.penalty.compliant && p30?.penalty.compliant);
  const verdictKey = !result ? "none" : bothClear ? "under" : p29?.penalty.compliant ? "over_2030" : "over_both";

  const extraFuelOptions = catalog ? catalog.sources.filter((s) => !s.primary && !sources.some((r) => r.source === s.key)) : [];

  return (
    <div className="min-h-screen bg-ivory text-navy">
      <div className="grain pointer-events-none fixed inset-0 opacity-[0.04] z-50 mix-blend-multiply" />

      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? "bg-ivory/90 backdrop-blur-md border-b border-navy/10" : ""}`}>
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
        <div className="reveal mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-8">§ Tool · Local Law 97</div>
        <h1 className="reveal text-[2.8rem] md:text-[5.4rem] lg:text-[6rem] leading-[1.02] font-light tracking-[-0.02em] max-w-5xl" style={{ animationDelay: "0.1s" }}>
          LL97
          <br />
          <span className="italic font-normal">compliance check.</span>
        </h1>
        <p className="reveal max-w-2xl text-lg md:text-xl leading-relaxed text-navy/75 mt-10" style={{ animationDelay: "0.25s" }}>
          Where a building sits against its 2024–2029 and 2030–2034 emissions
          limits, the annual penalty at the statutory $268/tCO2e if it is over,
          and what that adds up to through 2034. Single-use or mixed-use, on
          the ENERGY STAR property-type basis every filing must use from
          calendar year 2026.
        </p>
        <div className="reveal mt-8 mono text-xs tracking-[0.2em] uppercase text-navy/60" style={{ animationDelay: "0.4s" }}>
          v2 · ESPM property types · Mixed-use · Native units
        </div>
      </section>

      {/* §01 Coverage */}
      <section className="py-12 md:py-16 px-6 md:px-12 border-t border-navy/10">
        <div className="max-w-4xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">§ 01 · Is the building covered?</div>
          <div className="grid gap-px bg-navy/15 md:grid-cols-3 mb-10">
            {CONFIGS.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={config === c.key}
                onClick={() => {
                  setConfig(c.key);
                  setCov(null);
                  setContinueAnyway(false);
                  invalidate();
                }}
                className={`text-left p-6 transition-colors duration-300 ${config === c.key ? "bg-navy text-ivory" : "bg-ivory hover:bg-navy/[0.04]"}`}
              >
                <div className="text-base font-medium tracking-tight mb-2">{c.label}</div>
                <div className={`text-sm leading-relaxed ${config === c.key ? "text-ivory/75" : "text-navy/60"}`}>{c.hint}</div>
              </button>
            ))}
          </div>

          <label className="block max-w-sm mb-8">
            <div className={labelClass}>{CONFIGS.find((c) => c.key === config)!.field}</div>
            <input
              type="text"
              inputMode="numeric"
              value={gsfText}
              onChange={(e) => {
                setGsfText(e.target.value);
                setCov(null);
                setContinueAnyway(false);
                invalidate();
              }}
              placeholder="e.g. 120,000"
              className={inputClass}
            />
            <div className={`${microClass} mt-2`}>gross sq ft</div>
          </label>

          <button type="button" disabled={!gsf || covLoading} onClick={runCoverage} className={buttonClass}>
            {covLoading ? "Working…" : "Check coverage"}
            <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          </button>
          {covError && <div className="mt-4 text-sm text-navy/70">{covError}</div>}

          {cov && (
            <div className={`mt-8 border-l pl-5 ${cov.covered ? "border-navy/40" : "border-navy/20"}`}>
              <div className="text-lg md:text-xl font-medium tracking-tight">{cov.covered ? "Covered building under Article 320." : "Likely not a covered building under Article 320."}</div>
              <div className="text-sm text-navy/70 leading-relaxed mt-2">{cov.reason}</div>
              {!cov.covered && (
                <div className="text-sm text-navy/70 leading-relaxed mt-3 space-y-2">
                  <p>{cov.article321Note}</p>
                  <p>
                    City-owned buildings are covered above 10,000 gsf and DOB may have notified you directly.{" "}
                    <button type="button" onClick={() => setContinueAnyway(true)} className="underline underline-offset-4 hover:text-navy">
                      Continue anyway
                    </button>
                    .
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {covered && catalog && (
        <>
          {/* §02 Filing */}
          <section className="py-12 md:py-16 px-6 md:px-12 border-t border-navy/10">
            <div className="max-w-4xl mx-auto">
              <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">§ 02 · Reporting year and basis</div>
              <div className="grid md:grid-cols-2 gap-8">
                <label className="block">
                  <div className={labelClass}>Calendar year being reported</div>
                  <select
                    value={filingYear}
                    onChange={(e) => {
                      setFilingYear(Number(e.target.value));
                      invalidate();
                    }}
                    className={selectClass}
                  >
                    {catalog.filingYears.map((y) => (
                      <option key={y} value={y}>
                        CY{y} — report due May 1, {y + 1}
                      </option>
                    ))}
                  </select>
                  <div className={`${microClass} mt-2`}>Both periods are computed regardless</div>
                </label>
                <div>
                  <div className={labelClass}>Limit basis</div>
                  {occupancyAllowed ? (
                    <div className="flex gap-px bg-navy/15">
                      {(["espm", "occupancy"] as Basis[]).map((b) => (
                        <button
                          key={b}
                          type="button"
                          aria-pressed={basis === b}
                          onClick={() => setBasis(b)}
                          className={`flex-1 py-3 px-4 text-left transition-colors duration-300 ${basis === b ? "bg-navy text-ivory" : "bg-ivory hover:bg-navy/[0.04]"}`}
                        >
                          <div className="text-base font-medium tracking-tight">{b === "espm" ? "ESPM property type" : "Occupancy group"}</div>
                          <div className={`mono text-[10px] tracking-[0.2em] uppercase mt-1 ${basis === b ? "text-ivory/60" : "text-navy/50"}`}>
                            {b === "espm" ? "1 RCNY §103-14" : "§28-320.3.1 · CY2024–25 only"}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="border-b border-navy/30 pb-2 text-lg md:text-xl font-light tracking-tight">ESPM property type</div>
                      <div className={`${microClass} mt-2`}>Only basis permitted from CY2026 · 1 RCNY §103-14</div>
                    </div>
                  )}
                  {occupancyAllowed && (
                    <div className="text-sm text-navy/60 leading-relaxed mt-3">
                      For CY2024 and CY2025 an owner may file under either basis, one methodology per filing. Run the check under each to compare.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* §03 Spaces */}
          <section className="py-12 md:py-16 px-6 md:px-12 border-t border-navy/10">
            <div className="max-w-4xl mx-auto">
              <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-2">§ 03 · Floor area by {basis === "espm" ? "property type" : "occupancy group"}</div>
              <p className="text-base text-navy/75 leading-relaxed mb-8 max-w-2xl">
                One row per use. The limit is the sum of each area times its factor — mixed-use is a sum, not a blend.
              </p>

              <div className="space-y-6">
                {spaces.map((row, i) => (
                  <div key={row.id} className="grid md:grid-cols-12 gap-6 items-end">
                    <label className="block md:col-span-7">
                      <div className={labelClass}>Space {i + 1}</div>
                      <select
                        value={row.propertyType}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSpaces((rows) => rows.map((r) => (r.id === row.id ? { ...r, propertyType: v } : r)));
                          invalidate();
                        }}
                        className={selectClass}
                      >
                        <option value="">Choose…</option>
                        {typeOptions.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="md:col-span-4">
                      <div className="flex items-baseline justify-between mb-2">
                        <div className="mono text-[10px] tracking-[0.25em] uppercase text-navy/60">Floor area</div>
                        <div className="mono text-[10px] tracking-[0.2em] uppercase flex gap-3">
                          {(["sqft", "m2"] as AreaUnit[]).map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => {
                                setSpaces((rows) => rows.map((r) => (r.id === row.id ? { ...r, areaUnit: u } : r)));
                                invalidate();
                              }}
                              className={row.areaUnit === u ? "text-navy border-b border-navy" : "text-navy/40 hover:text-navy/70"}
                            >
                              {u === "sqft" ? "sqft" : "m²"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={row.areaText}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSpaces((rows) => rows.map((r) => (r.id === row.id ? { ...r, areaText: v } : r)));
                          invalidate();
                        }}
                        placeholder={row.areaUnit === "sqft" ? "e.g. 120,000" : "e.g. 11,150"}
                        className={inputClass}
                      />
                    </div>
                    <div className="md:col-span-1 pb-2">
                      {spaces.length > 1 && (
                        <button
                          type="button"
                          aria-label={`Remove space ${i + 1}`}
                          onClick={() => {
                            setSpaces((rows) => rows.filter((r) => r.id !== row.id));
                            invalidate();
                          }}
                          className="text-navy/40 hover:text-navy transition"
                        >
                          <Minus className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-8">
                <button
                  type="button"
                  onClick={() => setSpaces((rows) => [...rows, { id: nextId++, propertyType: "", areaText: "", areaUnit: rows[rows.length - 1]?.areaUnit ?? "sqft" }])}
                  className={ghostButtonClass}
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} /> Add a space
                </button>
                {spacesSqft > 0 && (
                  <div className={microClass}>
                    Total {fmt(spacesSqft)} sqft · {fmt(spacesSqft * M2_PER_SQFT)} m²
                  </div>
                )}
              </div>
              {areaMismatch && (
                <div className="mt-4 text-sm text-navy/70 leading-relaxed border-l border-navy/20 pl-5 max-w-2xl">
                  Space areas sum to {fmt(spacesSqft)} sqft; the coverage check used {fmt(gsf!)} sqft. §103-14(d)(1) requires the floor areas by type to add up to the gross floor area.
                </div>
              )}
            </div>
          </section>

          {/* §04 Energy */}
          <section className="py-12 md:py-16 px-6 md:px-12 border-t border-navy/10">
            <div className="max-w-4xl mx-auto">
              <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-2">§ 04 · Annual energy, whole building</div>
              <p className="text-base text-navy/75 leading-relaxed mb-8 max-w-2xl">
                Last calendar year, in the unit your bill uses. Leave a source blank if you don&apos;t use it. Consumption is not split by space — the comparison is whole-building.
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                {sources.map((row) => {
                  const spec = catalog.sources.find((s) => s.key === row.source)!;
                  return (
                    <div key={row.source}>
                      <div className="flex items-baseline justify-between mb-2">
                        <div className="mono text-[10px] tracking-[0.25em] uppercase text-navy/60">{spec.label}</div>
                        <div className="mono text-[10px] tracking-[0.2em] uppercase flex gap-3">
                          {spec.units.map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => {
                                setSources((rows) => rows.map((r) => (r.source === row.source ? { ...r, unit: u } : r)));
                                invalidate();
                              }}
                              className={row.unit === u ? "text-navy border-b border-navy" : "text-navy/40 hover:text-navy/70"}
                            >
                              {UNIT_LABEL[u]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={row.valueText}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSources((rows) => rows.map((r) => (r.source === row.source ? { ...r, valueText: v } : r)));
                          invalidate();
                        }}
                        placeholder="0"
                        className={inputClass}
                      />
                      <div className={`${microClass} mt-2 flex items-center justify-between`}>
                        <span>{UNIT_LABEL[row.unit]} / year</span>
                        {!spec.primary && (
                          <button
                            type="button"
                            onClick={() => {
                              setSources((rows) => rows.filter((r) => r.source !== row.source));
                              invalidate();
                            }}
                            className="text-navy/40 hover:text-navy transition"
                          >
                            remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {extraFuelOptions.length > 0 && (
                <label className="block mt-10 max-w-sm">
                  <div className={labelClass}>Add another on-premises fuel · entered in kBtu</div>
                  <select
                    value=""
                    onChange={(e) => {
                      const key = e.target.value;
                      if (!key) return;
                      setSources((rows) => [...rows, { source: key, valueText: "", unit: "kBtu" }]);
                      invalidate();
                    }}
                    className={selectClass}
                  >
                    <option value="">Choose…</option>
                    {extraFuelOptions.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="mt-12">
                <button type="button" disabled={!canRun || runLoading} onClick={runCheck} className={buttonClass}>
                  {runLoading ? "Working…" : "Run the check"}
                  <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                </button>
                {!canRun && <div className={`${microClass} mt-4`}>Choose a type and area for every space, and enter at least one energy source.</div>}
                {runError && <div className="mt-4 text-sm text-navy/70">{runError}</div>}
              </div>
            </div>
          </section>
        </>
      )}

      {/* §05 Result */}
      {result && p29 && p30 && (
        <section className="py-16 md:py-24 px-6 md:px-12 bg-navy text-ivory">
          <div className="max-w-4xl mx-auto">
            <div className="mono text-xs tracking-[0.25em] uppercase text-ivory/60 mb-6">§ 05 · Result</div>
            <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight mb-6">
              Where you stand
              <br />
              <span className="italic">against the limits.</span>
            </h2>
            <div className="mono text-xs tracking-[0.2em] uppercase text-ivory/60 mb-12">
              {fmt(result.totalAreaSqft)} sqft · {fmt(result.totalAreaSqft * M2_PER_SQFT)} m² · {spaces.length} {spaces.length === 1 ? "space" : "spaces"} · {result.basis === "espm" ? "ESPM basis" : "Occupancy basis"} · CY{result.filingYear}
            </div>

            <div className="grid md:grid-cols-2 gap-px bg-ivory/15 mb-12">
              <PeriodBlock label="2024 — 2029" r={p29} areaSqft={result.totalAreaSqft} asOfYear={result.asOfYear} />
              <PeriodBlock label="2030 — 2034" r={p30} areaSqft={result.totalAreaSqft} asOfYear={result.asOfYear} />
            </div>

            {spaces.length > 1 && (
              <div className="mb-12">
                <div className="mono text-[10px] tracking-[0.25em] uppercase text-ivory/60 mb-4">Limit contribution by space · tCO2e per year</div>
                <div className="border-t border-ivory/15">
                  {p29.limit.perSpace.map((s, i) => (
                    <div key={i} className="border-b border-ivory/15 py-4 grid grid-cols-12 gap-4 items-baseline">
                      <div className="col-span-6 text-base md:text-lg font-medium">{s.propertyType}</div>
                      <div className="col-span-2 mono text-sm text-ivory/70">{fmt(s.areaSqft)} sf</div>
                      <div className="col-span-2 mono text-sm text-ivory/70">
                        24–29 <span className="text-ivory">{fmtT(s.limitTonnes)}</span>
                      </div>
                      <div className="col-span-2 mono text-sm text-ivory/70">
                        30–34 <span className="text-ivory">{fmtT(p30.limit.perSpace[i].limitTonnes)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mono text-[10px] tracking-[0.25em] uppercase text-ivory/60 mb-4">Emissions by source · tCO2e per year · share</div>
            <div className="border-t border-ivory/15">
              {p29.emissions.bySource.map((s, i) => (
                <div key={s.source} className="border-b border-ivory/15 py-4 grid grid-cols-12 gap-4 items-baseline">
                  <div className="col-span-5 text-base md:text-lg font-medium">{s.label}</div>
                  <div className="col-span-2 mono text-sm text-ivory/70">{fmt(s.consumptionKBtu)} kBtu</div>
                  <div className="col-span-2 mono text-sm text-ivory/70">
                    24–29 <span className="text-ivory">{fmtT(s.tonnes)}</span> <span className="text-ivory/50">{Math.round(s.share * 100)}%</span>
                  </div>
                  <div className="col-span-3 mono text-sm text-ivory/70">
                    30–34 <span className="text-ivory">{fmtT(p30.emissions.bySource[i].tonnes)}</span> <span className="text-ivory/50">{Math.round(p30.emissions.bySource[i].share * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3 text-sm text-ivory/70 leading-relaxed max-w-2xl">
              <p>
                The 2030–2034 electricity coefficient reflects the projected grid decarbonization; gas, steam and oil coefficients do not change. Fossil-heavy buildings see their 2030 exposure worsen because the limit tightens while the coefficient does not.
              </p>
              {result.permittedBases.length > 1 && (
                <p>
                  CY{result.filingYear} may be filed under either basis. This run used the {result.basis === "espm" ? "ESPM property-type" : "occupancy-group"} basis; switch it in § 02 and run again to compare.
                </p>
              )}
              <p>If DOB has granted your building an adjustment to its emissions limit, the limit shown here will not match your filed limit.</p>
            </div>
          </div>
        </section>
      )}

      {/* §06 CTA */}
      {result && (
        <section className="py-24 md:py-32 px-6 md:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">§ 06 · Next step</div>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
              {verdictKey === "under" ? "You clear both limits." : verdictKey === "over_2030" ? "Clear now, over in 2030." : "There is a compliance gap."}
            </h2>
            <p className="text-base md:text-lg text-navy/75 leading-relaxed max-w-xl mx-auto mb-10">
              {verdictKey === "under"
                ? "Compliant on paper is not settled — coefficients get revised, portfolio accounting and beneficial-electrification credits move the picture. Thirty minutes is enough to pressure-test it."
                : verdictKey === "over_2030"
                  ? "The 2030 limit is where most buildings turn. The number above is a first-pass estimate; a discovery call is the fastest way to size the electrification and envelope paths that close it before the period opens."
                  : "The number above is a first-pass estimate. A discovery call is the fastest way to size the retrofit, timing and financing paths that close the gap before penalties compound."}
            </p>
            <a href="/intro" onClick={() => track("tool_cta_discovery_call", { tool: "ll97", verdict: verdictKey })} className={buttonClass}>
              Book a discovery call
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </a>
          </div>
        </section>
      )}

      {/* Method & disclaimer */}
      <section className="py-16 md:py-24 px-6 md:px-12 border-t border-navy/10">
        <div className="max-w-3xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">§ Method &amp; disclaimer</div>
          <div className="space-y-4 text-sm md:text-base text-navy/75 leading-relaxed">
            <p>
              First-pass estimate. Not modelled: RECs (electricity only), §28-320.7 adjustments under Rule 103-12, the Article 321 prescriptive path for rent-regulated buildings, DER carve-outs, greenhouse-gas offsets, clean distributed energy, and any period beyond 2034. Cumulative exposure is undiscounted and assumes flat consumption.
            </p>
            <p>
              Results are indicative only and are not a certification of compliance under NYC Administrative Code §28-320. The annual report must be prepared and filed by a registered design professional.
            </p>
            {result ? (
              <div className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 pt-4 space-y-1">
                <div>Method: {result.method}</div>
                {result.sources.map((s) => (
                  <div key={s.ruleset}>
                    {s.citation} · {s.ruleset}@{s.version}
                  </div>
                ))}
                <div>Ruleset hash {result.rulesetHash} · computed {result.computedAt.slice(0, 10)}</div>
              </div>
            ) : (
              <p className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 pt-4">
                Sources: 1 RCNY §103-14(c)(3) (ESPM limits) and (d) (method) · NYC Admin Code §28-320.3.1 / .3.2 (occupancy limits, CY2024–25) · §28-320.3.1.1 and §103-14(d)(3) (coefficients) · §28-320.6 (penalty).
              </p>
            )}
          </div>

          <details className="group/details border-t border-navy/10 mt-10 pt-5">
            <summary className="cursor-pointer flex items-center justify-between text-base font-medium tracking-tight list-none">
              <span>Changelog</span>
              <ChevronDown className="w-4 h-4 transition-transform duration-300 group-open/details:rotate-180" strokeWidth={1.5} />
            </summary>
            <div className="mt-4 space-y-3 text-sm text-navy/70 leading-relaxed">
              <p>
                <span className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 mr-3">v2 · Sep 2026</span>
                ESPM property-type basis (all 60 types), mixed-use as a sum of spaces, reporting-year gating of the CY2024–25 occupancy basis, native billing units per source, cumulative exposure, coverage pre-check, calculation moved server-side with sourced rulesets.
              </p>
              <p>
                <span className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 mr-3">v1 · Sep 2026</span>
                Group B (Business) only, kWh inputs, both periods, annual penalty.
              </p>
            </div>
          </details>
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

function PeriodBlock({ label, r, areaSqft, asOfYear }: { label: string; r: PeriodResult; areaSqft: number; asOfYear: number }) {
  const em = r.emissions.totalTonnes;
  const lim = r.limit.limitTonnes;
  const Icon = r.penalty.compliant ? CheckCircle2 : AlertTriangle;
  const m2 = areaSqft * M2_PER_SQFT;
  const endYear = label.includes("2029") ? 2029 : 2034;
  return (
    <div className="bg-navy p-8 md:p-10">
      <div className="mono text-[10px] tracking-[0.25em] uppercase text-ivory/60 mb-6">{label}</div>

      <div className="mb-6">
        <div className="mono text-[10px] tracking-[0.2em] uppercase text-ivory/50 mb-2">Your emissions</div>
        <div className="text-4xl md:text-5xl font-light tracking-tight">
          {fmtT(em)}
          <span className="text-lg md:text-xl text-ivory/60 ml-2">tCO2e/yr</span>
        </div>
        <div className="mono text-[10px] tracking-[0.2em] uppercase text-ivory/50 mt-2">
          {(em / m2).toFixed(4)} tCO2e/m² · {(em / areaSqft).toFixed(5)} tCO2e/sqft
        </div>
      </div>

      <div className="mb-6">
        <div className="mono text-[10px] tracking-[0.2em] uppercase text-ivory/50 mb-2">Limit</div>
        <div className="text-xl md:text-2xl font-light tracking-tight">
          {fmtT(lim)}
          <span className="text-sm text-ivory/60 ml-2">tCO2e/yr</span>
        </div>
        <div className="mono text-[10px] tracking-[0.2em] uppercase text-ivory/40 mt-1">
          {(lim / m2).toFixed(4)} tCO2e/m² · {(lim / areaSqft).toFixed(5)} tCO2e/sqft
        </div>
      </div>

      <div className="border-t border-ivory/15 pt-6 flex items-start gap-3">
        <Icon className="w-6 h-6 shrink-0 mt-1" strokeWidth={1.5} />
        <div>
          {r.penalty.compliant ? (
            <div>
              <div className="text-xl md:text-2xl font-medium tracking-tight">Under the limit</div>
              <div className="text-sm text-ivory/70 mt-1">
                {fmtT(r.penalty.marginTonnes)} tCO2e/yr of headroom · {fmtPct(r.penalty.marginPct)} of the limit
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xl md:text-2xl font-medium tracking-tight">
                Over by {fmtT(r.penalty.excessTonnes)} tCO2e/yr · {fmtPct(-r.penalty.marginPct)}
              </div>
              <div className="text-sm text-ivory/70 mt-2">Estimated annual penalty</div>
              <div className="text-2xl md:text-3xl font-light tracking-tight mt-1">
                {fmtUsd(r.penalty.annualUsd)}
                <span className="text-sm text-ivory/60 ml-2">/ year</span>
              </div>
              {r.penalty.remainingYears > 0 && (
                <div className="mt-3">
                  <div className="text-sm text-ivory/70">
                    Through {endYear}, from {asOfYear} · {r.penalty.remainingYears} {r.penalty.remainingYears === 1 ? "year" : "years"}
                  </div>
                  <div className="text-xl md:text-2xl font-light tracking-tight mt-1">{fmtUsd(r.penalty.cumulativeUsd)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
