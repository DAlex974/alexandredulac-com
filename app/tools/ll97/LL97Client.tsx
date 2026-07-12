"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ArrowUpRight, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import {
  FUELS,
  FuelKey,
  OCCUPANCY_LIMITS,
  emissionsForFuel,
  computeCompliance,
  ComplianceResult,
  sqftToM2,
  m2ToSqft,
  M2_PER_SQFT,
} from "./constants";

const FUEL_ORDER: FuelKey[] = ["electricity", "natural_gas", "district_steam", "fuel_oil_2"];
type AreaUnit = "sqft" | "m2";

interface FormState {
  area: string;
  areaUnit: AreaUnit;
  quantities: Record<FuelKey, string>;
}

interface Results {
  emissions_2024_2029: number;
  emissions_2030_2034: number;
  result_2029: ComplianceResult;
  result_2030: ComplianceResult;
  perFuel: Array<{ fuel: FuelKey; tonnes_2024_2029: number; tonnes_2030_2034: number }>;
}

function parseNumber(s: string): number {
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function formatTonnes(n: number): string {
  return n.toLocaleString("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  });
}

function formatIntensityPerSqft(n: number): string {
  // Matches DOB table convention (e.g. 0.00846 tCO2e/sf).
  return n.toFixed(5);
}

function formatIntensityPerM2(n: number): string {
  return n.toFixed(4);
}

function formatArea(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatUsd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function LL97Client() {
  const [scrolled, setScrolled] = useState(false);
  const [form, setForm] = useState<FormState>({
    area: "",
    areaUnit: "sqft",
    quantities: {
      electricity: "",
      natural_gas: "",
      district_steam: "",
      fuel_oil_2: "",
    },
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const areaInput = parseNumber(form.area);
  // Normalise to sqft for the internal calculation.
  const sqft = form.areaUnit === "sqft" ? areaInput : m2ToSqft(areaInput);
  const m2 = form.areaUnit === "m2" ? areaInput : sqftToM2(areaInput);

  const hasAnyFuel = FUEL_ORDER.some((f) => parseNumber(form.quantities[f]) > 0);
  const canCompute = sqft > 0 && hasAnyFuel;

  const results: Results | null = useMemo(() => {
    if (!submitted || !canCompute) return null;

    const perFuel = FUEL_ORDER.map((fuel) => {
      const q = parseNumber(form.quantities[fuel]);
      return {
        fuel,
        tonnes_2024_2029: q > 0 ? emissionsForFuel(fuel, q, "2024-2029") : 0,
        tonnes_2030_2034: q > 0 ? emissionsForFuel(fuel, q, "2030-2034") : 0,
      };
    });

    const emissions_2024_2029 = perFuel.reduce((s, p) => s + p.tonnes_2024_2029, 0);
    const emissions_2030_2034 = perFuel.reduce((s, p) => s + p.tonnes_2030_2034, 0);

    return {
      emissions_2024_2029,
      emissions_2030_2034,
      result_2029: computeCompliance(emissions_2024_2029, sqft, "B_business", "2024-2029"),
      result_2030: computeCompliance(emissions_2030_2034, sqft, "B_business", "2030-2034"),
      perFuel,
    };
  }, [submitted, canCompute, form, sqft]);

  const groupB = OCCUPANCY_LIMITS.B_business;

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
          § Tool · Local Law 97
        </div>
        <h1
          className="reveal text-[2.8rem] md:text-[5.4rem] lg:text-[6rem] leading-[1.02] font-light tracking-[-0.02em] max-w-5xl"
          style={{ animationDelay: "0.1s" }}
        >
          LL97
          <br />
          <span className="italic font-normal">compliance check.</span>
        </h1>
        <p
          className="reveal max-w-2xl text-lg md:text-xl leading-relaxed text-navy/75 mt-10"
          style={{ animationDelay: "0.25s" }}
        >
          A first-pass estimate of where your Group B (Business) building sits
          against the 2024–2029 and 2030–2034 emission caps set by NYC Local Law
          97 — and, if over, the annual excess-emissions penalty at the statutory
          $268/tCO2e rate.
        </p>
        <div
          className="reveal mt-8 mono text-xs tracking-[0.2em] uppercase text-navy/60"
          style={{ animationDelay: "0.4s" }}
        >
          Group B · Business · v1
        </div>
      </section>

      {/* Form */}
      <section className="py-12 md:py-16 px-6 md:px-12 border-t border-navy/10">
        <div className="max-w-4xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">
            § 01 · Building
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <div className="mono text-[10px] tracking-[0.25em] uppercase text-navy/60">
                  Gross floor area
                </div>
                <div className="mono text-[10px] tracking-[0.2em] uppercase flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, areaUnit: "sqft" });
                      setSubmitted(false);
                    }}
                    className={`transition ${
                      form.areaUnit === "sqft" ? "text-navy border-b border-navy" : "text-navy/40 hover:text-navy/70"
                    }`}
                  >
                    sqft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, areaUnit: "m2" });
                      setSubmitted(false);
                    }}
                    className={`transition ${
                      form.areaUnit === "m2" ? "text-navy border-b border-navy" : "text-navy/40 hover:text-navy/70"
                    }`}
                  >
                    m²
                  </button>
                </div>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={form.area}
                onChange={(e) => {
                  setForm({ ...form, area: e.target.value });
                  setSubmitted(false);
                }}
                placeholder={form.areaUnit === "sqft" ? "e.g. 120,000" : "e.g. 11,150"}
                className="w-full bg-transparent border-b border-navy/30 pb-2 text-2xl md:text-3xl font-light tracking-tight focus:outline-none focus:border-navy transition-colors"
              />
              {areaInput > 0 && (
                <div className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 mt-2">
                  {form.areaUnit === "sqft"
                    ? `≈ ${formatArea(m2)} m²`
                    : `≈ ${formatArea(sqft)} sqft`}
                </div>
              )}
            </div>

            <div>
              <div className="mono text-[10px] tracking-[0.25em] uppercase text-navy/60 mb-2">
                Occupancy group
              </div>
              <div className="border-b border-navy/30 pb-2 text-2xl md:text-3xl font-light tracking-tight">
                Business (Group B)
              </div>
              <div className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 mt-2">
                Other groups available on request
              </div>
            </div>
          </div>

          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">
            § 02 · Annual energy consumption
          </div>
          <p className="text-base text-navy/75 leading-relaxed mb-4 max-w-2xl">
            Enter last calendar year&apos;s consumption in <strong>kWh</strong> for each
            source your building uses. Leave blank or 0 for sources you don&apos;t use.
          </p>
          <p className="text-sm text-navy/60 leading-relaxed mb-10 max-w-2xl italic">
            Conversion hints: 1 therm ≈ 29.3 kWh · 1 CCF ≈ 30.4 kWh · 1 gallon of fuel oil #2 ≈ 40.6 kWh · 1 Mlb of steam ≈ 350 kWh.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {FUEL_ORDER.map((fuelKey) => {
              const spec = FUELS[fuelKey];
              return (
                <label key={fuelKey} className="block">
                  <div className="mono text-[10px] tracking-[0.25em] uppercase text-navy/60 mb-2">
                    {spec.label}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.quantities[fuelKey]}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        quantities: {
                          ...form.quantities,
                          [fuelKey]: e.target.value,
                        },
                      });
                      setSubmitted(false);
                    }}
                    placeholder="0"
                    className="w-full bg-transparent border-b border-navy/30 pb-2 text-2xl md:text-3xl font-light tracking-tight focus:outline-none focus:border-navy transition-colors"
                  />
                  <div className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 mt-2">
                    kWh / year
                  </div>
                  <div className="text-sm text-navy/60 mt-2 leading-relaxed">
                    {spec.inputHelp}
                  </div>
                </label>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!canCompute}
            onClick={() => setSubmitted(true)}
            className="group inline-flex items-center gap-3 bg-navy text-ivory px-8 py-4 mono text-xs tracking-[0.2em] uppercase hover:bg-navy/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Run the check
            <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          </button>
          {!canCompute && (
            <div className="mt-4 mono text-[10px] tracking-[0.2em] uppercase text-navy/50">
              Enter floor area and at least one energy source to compute.
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      {results && (
        <section className="py-16 md:py-24 px-6 md:px-12 bg-navy text-ivory">
          <div className="max-w-4xl mx-auto">
            <div className="mono text-xs tracking-[0.25em] uppercase text-ivory/60 mb-6">
              § 03 · Result
            </div>
            <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight mb-6">
              Where you stand
              <br />
              <span className="italic">against the caps.</span>
            </h2>

            <div className="mono text-xs tracking-[0.2em] uppercase text-ivory/60 mb-12">
              {formatArea(sqft)} sqft · {formatArea(m2)} m² · Group B
            </div>

            <div className="grid md:grid-cols-2 gap-px bg-ivory/15 mb-12">
              <PeriodBlock
                label="2024 — 2029"
                emissions={results.emissions_2024_2029}
                result={results.result_2029}
                capPerSf={groupB.limit_2024_2029}
                sqft={sqft}
                m2={m2}
              />
              <PeriodBlock
                label="2030 — 2034"
                emissions={results.emissions_2030_2034}
                result={results.result_2030}
                capPerSf={groupB.limit_2030_2034}
                sqft={sqft}
                m2={m2}
              />
            </div>

            <div className="mono text-[10px] tracking-[0.25em] uppercase text-ivory/60 mb-4">
              Breakdown by fuel · tCO2e per year
            </div>
            <div className="border-t border-ivory/15">
              {results.perFuel
                .filter((p) => p.tonnes_2024_2029 > 0 || p.tonnes_2030_2034 > 0)
                .map((p) => (
                  <div
                    key={p.fuel}
                    className="border-b border-ivory/15 py-4 grid grid-cols-3 gap-4 items-baseline"
                  >
                    <div className="text-base md:text-lg font-medium">
                      {FUELS[p.fuel].label}
                    </div>
                    <div className="mono text-sm text-ivory/70">
                      2024–29: <span className="text-ivory">{formatTonnes(p.tonnes_2024_2029)}</span>
                    </div>
                    <div className="mono text-sm text-ivory/70">
                      2030–34: <span className="text-ivory">{formatTonnes(p.tonnes_2030_2034)}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-8 text-sm text-ivory/70 leading-relaxed max-w-2xl">
              The 2030–2034 electricity coefficient reflects the projected
              ConEd/NYISO grid decarbonization. Buildings heavy on gas or fuel
              oil generally see their 2030 exposure worsen because the cap
              tightens while the fuel coefficient does not.
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {results && (
        <section className="py-24 md:py-32 px-6 md:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">
              § 04 · Next step
            </div>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
              {results.result_2029.compliant && results.result_2030.compliant
                ? "You clear both caps."
                : "There is a compliance gap."}
            </h2>
            <p className="text-base md:text-lg text-navy/75 leading-relaxed max-w-xl mx-auto mb-10">
              {results.result_2029.compliant && results.result_2030.compliant
                ? "Compliant on paper doesn't mean settled — grid coefficients, portfolio-level accounting, and beneficial-electrification credits can shift the picture. A 30-minute discovery call is enough to pressure-test it."
                : "The number above is a first-pass estimate. A discovery call is the fastest way to size the retrofit, timing, and financing paths that would close the gap before penalties compound."}
            </p>
            <a
              href="/intro"
              className="group inline-flex items-center gap-3 bg-navy text-ivory px-8 py-4 mono text-xs tracking-[0.2em] uppercase hover:bg-navy/80 transition-colors"
            >
              Book a discovery call
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </a>
          </div>
        </section>
      )}

      {/* Disclaimer & method */}
      <section className="py-16 md:py-24 px-6 md:px-12 border-t border-navy/10">
        <div className="max-w-3xl mx-auto">
          <div className="mono text-xs tracking-[0.25em] uppercase text-navy/60 mb-6">
            § Method &amp; disclaimer
          </div>
          <div className="space-y-4 text-sm md:text-base text-navy/75 leading-relaxed">
            <p>
              This tool produces a first-pass estimate for a single-occupancy
              Group B (Business) building. It does not account for mixed-use
              floor area weighting, beneficial-electrification credits,
              greenhouse-gas offsets, DER carve-outs, or the alternate-compliance
              path.
            </p>
            <p>
              Results are indicative only and are not a certification of
              compliance under NYC Administrative Code §28-320.
              Building-specific work requires a filed report by a licensed
              professional.
            </p>
            <p className="mono text-[10px] tracking-[0.2em] uppercase text-navy/50 pt-4">
              Sources: NYC Admin Code §28-320.3.1 &amp; §28-320.3.2 (occupancy
              caps) · NYC DOB Rule §103-14 Appendix (fuel coefficients, converted
              per kWh) · §28-320.6 ($268/tCO2e penalty).
            </p>
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

function PeriodBlock({
  label,
  emissions,
  result,
  capPerSf,
  sqft,
  m2,
}: {
  label: string;
  emissions: number;
  result: ComplianceResult;
  capPerSf: number;
  sqft: number;
  m2: number;
}) {
  const Icon = result.compliant ? CheckCircle2 : AlertTriangle;
  const intensityPerSqft = sqft > 0 ? emissions / sqft : 0; // tCO2e / sqft
  const intensityPerM2 = m2 > 0 ? emissions / m2 : 0; // tCO2e / m²
  const capIntensityPerM2 = capPerSf / M2_PER_SQFT; // tCO2e / m²

  return (
    <div className="bg-navy p-8 md:p-10">
      <div className="mono text-[10px] tracking-[0.25em] uppercase text-ivory/60 mb-6">
        {label}
      </div>

      <div className="mb-6">
        <div className="mono text-[10px] tracking-[0.2em] uppercase text-ivory/50 mb-2">
          Your emissions
        </div>
        <div className="text-4xl md:text-5xl font-light tracking-tight">
          {formatTonnes(emissions)}
          <span className="text-lg md:text-xl text-ivory/60 ml-2">tCO2e/yr</span>
        </div>
        <div className="mono text-[10px] tracking-[0.2em] uppercase text-ivory/50 mt-2">
          {formatIntensityPerM2(intensityPerM2)} tCO2e / m² · {formatIntensityPerSqft(intensityPerSqft)} tCO2e / sqft
        </div>
      </div>

      <div className="mb-6">
        <div className="mono text-[10px] tracking-[0.2em] uppercase text-ivory/50 mb-2">
          Cap
        </div>
        <div className="text-xl md:text-2xl font-light tracking-tight">
          {formatTonnes(result.cap)}
          <span className="text-sm text-ivory/60 ml-2">tCO2e/yr</span>
        </div>
        <div className="mono text-[10px] tracking-[0.2em] uppercase text-ivory/40 mt-1">
          {formatIntensityPerM2(capIntensityPerM2)} tCO2e/m² · {formatIntensityPerSqft(capPerSf)} tCO2e/sqft
        </div>
      </div>

      <div className="border-t border-ivory/15 pt-6 flex items-start gap-3">
        <Icon className="w-6 h-6 shrink-0 mt-1" strokeWidth={1.5} />
        <div>
          {result.compliant ? (
            <div>
              <div className="text-xl md:text-2xl font-medium tracking-tight">
                Compliant
              </div>
              <div className="text-sm text-ivory/70 mt-1">
                {formatTonnes(result.cap - emissions)} tCO2e/yr headroom.
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xl md:text-2xl font-medium tracking-tight">
                Over by {formatTonnes(result.excess)} tCO2e/yr
              </div>
              <div className="text-sm text-ivory/70 mt-1">
                Estimated annual penalty:
              </div>
              <div className="text-2xl md:text-3xl font-light tracking-tight mt-1">
                {formatUsd(result.annualFineUsd)}
                <span className="text-sm text-ivory/60 ml-2">/ year</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

