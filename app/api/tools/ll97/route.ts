/**
 * LL97 v2 endpoint. Runs calc-core server-side (decision f).
 *
 * GET  → catalog: property types, occupancy groups, energy sources with
 *        their native units, filing years, and feature flags.
 * POST → { mode: "coverage" } Article 320 pre-check, or
 *        { mode: "check" }    full computation for both exposed periods.
 */

import { NextResponse } from "next/server";
import {
  COEFFICIENTS,
  ESPM_LIMITS,
  OCCUPANCY_LIMITS,
  computeEmissions,
  computePenalty,
  coverage,
  hashRulesets,
  permittedBases,
  resolveLimit,
  sourceRefOf,
  toSqft,
  type Basis,
  type EnergyUnit,
  type Period,
  type SourceRef,
} from "@papilio/calc-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPOSED_PERIODS: Period[] = ["2024-2029", "2030-2034"];
const FILING_YEARS = [2024, 2025, 2026, 2027, 2028, 2029];
const LAST_OCCUPANCY_FILING_YEAR = 2025;

/** Native billing units offered per primary source; every other fuel is entered in kBtu. */
const PRIMARY_UNITS: Record<string, EnergyUnit[]> = {
  electricity: ["kWh", "kBtu"],
  natural_gas: ["therm", "CCF", "kBtu"],
  district_steam: ["Mlb_steam", "kBtu"],
  fuel_oil_2: ["gallon_fuel_oil_2", "kBtu"],
};

function catalog() {
  const sources = Object.entries(COEFFICIENTS.sources).map(([key, s]) => ({
    key,
    label: s.label,
    units: PRIMARY_UNITS[key] ?? (["kBtu"] as EnergyUnit[]),
    primary: key in PRIMARY_UNITS,
  }));
  return {
    propertyTypes: Object.keys(ESPM_LIMITS.factors),
    occupancyGroups: Object.keys(OCCUPANCY_LIMITS.factors),
    sources,
    filingYears: FILING_YEARS,
    lastOccupancyFilingYear: LAST_OCCUPANCY_FILING_YEAR,
    periods: EXPOSED_PERIODS,
    pdf: Boolean(process.env.RESEND_API_KEY),
    version: "v2",
  };
}

export async function GET() {
  return NextResponse.json(catalog());
}

type CoverageBody = {
  mode: "coverage";
  singleBuildingGsf?: unknown;
  sameTaxLotTotalGsf?: unknown;
  condoBoardTotalGsf?: unknown;
};

type CheckBody = {
  mode: "check";
  filingYear?: unknown;
  basis?: unknown;
  spaces?: { propertyType?: unknown; area?: unknown; areaUnit?: unknown }[];
  sources?: { source?: unknown; value?: unknown; unit?: unknown }[];
  asOfYear?: unknown;
};

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  let body: CoverageBody | CheckBody;
  try {
    body = (await req.json()) as CoverageBody | CheckBody;
  } catch {
    return bad("Invalid JSON body.");
  }

  try {
    if (body.mode === "coverage") {
      return NextResponse.json(
        coverage({
          singleBuildingGsf: num(body.singleBuildingGsf),
          sameTaxLotTotalGsf: num(body.sameTaxLotTotalGsf),
          condoBoardTotalGsf: num(body.condoBoardTotalGsf),
        }),
      );
    }

    if (body.mode !== "check") return bad("Unknown mode.");

    const filingYear = num(body.filingYear);
    if (filingYear === undefined || !FILING_YEARS.includes(filingYear)) {
      return bad(`Reporting year must be one of ${FILING_YEARS.join(", ")}.`);
    }
    const basis = body.basis as Basis;
    if (basis !== "espm" && basis !== "occupancy") return bad("Basis must be espm or occupancy.");
    if (!permittedBases(filingYear).includes(basis)) {
      return bad(`The occupancy-group basis is only permitted for CY2024 and CY2025 filings.`);
    }

    const rawSpaces = Array.isArray(body.spaces) ? body.spaces : [];
    if (rawSpaces.length === 0) return bad("At least one space is required.");
    const spaces = rawSpaces.map((s, i) => {
      const propertyType = typeof s.propertyType === "string" ? s.propertyType.trim() : "";
      const area = num(s.area);
      const areaUnit = s.areaUnit === "m2" ? "m2" : "sqft";
      if (!propertyType) throw new Error(`Space ${i + 1}: choose a ${basis === "espm" ? "property type" : "occupancy group"}.`);
      if (area === undefined || area <= 0) throw new Error(`Space ${i + 1}: floor area must be a positive number.`);
      return { propertyType, areaSqft: toSqft(area, areaUnit) };
    });

    const cat = catalog();
    const allowedUnits = new Map(cat.sources.map((s) => [s.key, s.units] as const));
    const rawSources = Array.isArray(body.sources) ? body.sources : [];
    const sources = rawSources
      .map((s) => {
        const source = typeof s.source === "string" ? s.source : "";
        const value = num(s.value) ?? 0;
        const unit = s.unit as EnergyUnit;
        const units = allowedUnits.get(source);
        if (!units) throw new Error(`Unknown energy source "${source}".`);
        if (!units.includes(unit)) throw new Error(`Unit "${unit}" is not offered for ${source}.`);
        return { source, value, unit };
      })
      .filter((s) => s.value > 0);
    if (sources.length === 0) return bad("Enter consumption for at least one energy source.");

    const asOfYear = num(body.asOfYear) ?? new Date().getUTCFullYear();
    const computedAt = new Date().toISOString();

    const periods: Record<string, unknown> = {};
    for (const period of EXPOSED_PERIODS) {
      const limit = resolveLimit({ spaces, basis, period, filingYear, computedAt });
      const emissions = computeEmissions({ sources, period, filingYear, basis, computedAt });
      const penalty = computePenalty({
        emissionsTonnes: emissions.value.totalTonnes,
        limitTonnes: limit.value.limitTonnes,
        period,
        asOfYear,
      });
      periods[period] = { limit: limit.value, emissions: emissions.value, penalty };
    }

    const limitsRuleset = basis === "espm" ? ESPM_LIMITS : OCCUPANCY_LIMITS;
    const sourceRefs: SourceRef[] = [sourceRefOf(limitsRuleset), sourceRefOf(COEFFICIENTS)];

    return NextResponse.json({
      version: "v2",
      filingYear,
      basis,
      permittedBases: permittedBases(filingYear),
      asOfYear,
      totalAreaSqft: spaces.reduce((s, x) => s + x.areaSqft, 0),
      periods,
      method:
        basis === "espm"
          ? "Limit: ESPM property type × floor area, summed across spaces (1 RCNY §103-14(d)(2)(ii), Equation 103-14.1). Emissions: whole-building consumption × DOB coefficient per source, period-dependent. Penalty: $268/tCO2e/yr on the excess (§28-320.6)."
          : "Limit: Building Code occupancy group × floor area, summed across spaces (§28-320.3.1/.3.2; CY2024–2025 basis). Emissions: whole-building consumption × DOB coefficient per source, period-dependent. Penalty: $268/tCO2e/yr on the excess (§28-320.6).",
      sources: sourceRefs,
      rulesetHash: hashRulesets(limitsRuleset, COEFFICIENTS),
      computedAt,
    });
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Calculation failed.");
  }
}
