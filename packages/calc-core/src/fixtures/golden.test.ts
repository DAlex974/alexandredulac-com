/**
 * Golden tests (spec §1.4). Any formula or ruleset change that moves one
 * of these numbers fails CI. Expected values are pinned from DOB material,
 * the owner-supplied tables, and the live v1 tool's verified output.
 */

import { describe, expect, it } from "vitest";
import {
  COEFFICIENTS,
  ESPM_LIMITS,
  OCCUPANCY_LIMITS,
  computeEmissions,
  computePenalty,
  coverage,
  fromKBtu,
  gradeFromScore,
  permittedBases,
  remainingYears,
  resolveLimit,
  toKBtu,
  toKWh,
  type LimitsRuleset,
} from "../index";

const AT = "2026-09-05T00:00:00.000Z";

describe("G1 — 450,000 sf office, occupancy basis Group B (pins live v1 output)", () => {
  const spaces = [{ propertyType: "Group B (Business)", areaSqft: 450_000 }];
  const sources = [
    { source: "electricity", value: 5_200_000, unit: "kWh" as const },
    { source: "natural_gas", value: 180_000, unit: "therm" as const },
  ];

  it("2024–2029: 2,458.6 tCO2e vs 3,807.0 limit — under", () => {
    const limit = resolveLimit({ spaces, basis: "occupancy", period: "2024-2029", filingYear: 2025, computedAt: AT });
    const em = computeEmissions({ sources, period: "2024-2029", filingYear: 2025, computedAt: AT });
    expect(limit.value.limitTonnes).toBeCloseTo(3807.0, 1);
    expect(em.value.totalTonnes).toBeCloseTo(2458.6, 1);
    const p = computePenalty({ emissionsTonnes: em.value.totalTonnes, limitTonnes: limit.value.limitTonnes, period: "2024-2029", asOfYear: 2026 });
    expect(p.compliant).toBe(true);
    expect(p.marginTonnes).toBeCloseTo(1348.4, 1);
  });

  it("2030–2034: 1,710.0 tCO2e vs 2,038.5 limit — under", () => {
    const limit = resolveLimit({ spaces, basis: "occupancy", period: "2030-2034", filingYear: 2025, computedAt: AT });
    const em = computeEmissions({ sources, period: "2030-2034", filingYear: 2025, computedAt: AT });
    expect(limit.value.limitTonnes).toBeCloseTo(2038.5, 1);
    expect(em.value.totalTonnes).toBeCloseTo(1710.0, 1);
    const p = computePenalty({ emissionsTonnes: em.value.totalTonnes, limitTonnes: limit.value.limitTonnes, period: "2030-2034", asOfYear: 2026 });
    expect(p.compliant).toBe(true);
    expect(p.marginTonnes).toBeCloseTo(328.5, 1);
  });

  it("carries provenance", () => {
    const em = computeEmissions({ sources, period: "2024-2029", filingYear: 2025, computedAt: AT });
    expect(em.sources[0].ruleset).toBe("ll97-coefficients");
    expect(em.rulesetHash).toMatch(/^[0-9a-f]{16}$/);
    expect(em.computedAt).toBe(AT);
  });
});

describe("G2 — electricity coefficient is period-dependent", () => {
  it("2030–2034 is well below 60% of 2024–2029", () => {
    const c = COEFFICIENTS.sources.electricity.coefficient;
    expect(c["2030-2034"]).toBeLessThan(0.6 * c["2024-2029"]);
  });
  it("electricity emissions roughly halve between periods for the same consumption", () => {
    const sources = [{ source: "electricity", value: 1_000_000, unit: "kWh" as const }];
    const a = computeEmissions({ sources, period: "2024-2029", filingYear: 2026, computedAt: AT }).value.totalTonnes;
    const b = computeEmissions({ sources, period: "2030-2034", filingYear: 2026, computedAt: AT }).value.totalTonnes;
    expect(a).toBeCloseTo(288.962, 3);
    expect(b).toBeCloseTo(145.0, 3);
  });
});

describe("G3 — three-space mixed-use, area-weighted limit, no consumption allocation", () => {
  const synthetic: LimitsRuleset = {
    ...ESPM_LIMITS,
    ruleset: "test-espm-limits",
    version: "0.0.0-test",
    status: "complete",
    factors: {
      X: { "2024-2029": 0.01, "2030-2034": 0.005 },
      Y: { "2024-2029": 0.005, "2030-2034": 0.0025 },
      Z: { "2024-2029": 0.002, "2030-2034": 0.001 },
    },
  };
  it("limit equals Σ area_i × factor_i", () => {
    const r = resolveLimit({
      spaces: [
        { propertyType: "X", areaSqft: 10_000 },
        { propertyType: "Y", areaSqft: 20_000 },
        { propertyType: "Z", areaSqft: 30_000 },
      ],
      basis: "espm",
      period: "2024-2029",
      filingYear: 2026,
      ruleset: synthetic,
      computedAt: AT,
    });
    expect(r.value.limitTonnes).toBeCloseTo(260, 4);
    expect(r.value.perSpace.map((s) => s.limitTonnes)).toEqual([100, 100, 60]);
    expect(r.value.totalAreaSqft).toBe(60_000);
  });
});

describe("G4 — same building, ESPM vs occupancy basis, CY2025", () => {
  const espm = [{ propertyType: "Multifamily Housing", areaSqft: 100_000 }];
  const occ = [{ propertyType: "Group R-2 (Residential)", areaSqft: 100_000 }];

  it("both bases compute for a CY2025 filing", () => {
    expect(permittedBases(2025)).toEqual(["espm", "occupancy"]);
    expect(permittedBases(2026)).toEqual(["espm"]);
  });
  it("2024–2029: bases agree (675 tCO2e)", () => {
    const a = resolveLimit({ spaces: espm, basis: "espm", period: "2024-2029", filingYear: 2025, computedAt: AT });
    const b = resolveLimit({ spaces: occ, basis: "occupancy", period: "2024-2029", filingYear: 2025, computedAt: AT });
    expect(a.value.limitTonnes).toBeCloseTo(675, 4);
    expect(b.value.limitTonnes).toBeCloseTo(675, 4);
  });
  it("2030–2034: bases diverge (334.664 vs 407 tCO2e) and the divergence is reported, not hidden", () => {
    const a = resolveLimit({ spaces: espm, basis: "espm", period: "2030-2034", filingYear: 2025, computedAt: AT });
    const b = resolveLimit({ spaces: occ, basis: "occupancy", period: "2030-2034", filingYear: 2025, computedAt: AT });
    expect(a.value.limitTonnes).toBeCloseTo(334.664, 3);
    expect(b.value.limitTonnes).toBeCloseTo(407, 3);
    expect(b.value.limitTonnes - a.value.limitTonnes).toBeCloseTo(72.336, 3);
    expect(a.basis).toBe("espm");
    expect(b.basis).toBe("occupancy");
  });
  it("occupancy basis is refused for CY2026+", () => {
    expect(() =>
      resolveLimit({ spaces: occ, basis: "occupancy", period: "2024-2029", filingYear: 2026, computedAt: AT }),
    ).toThrow(/not permitted for filing year 2026/);
  });
  it("excluded ESPM types are refused", () => {
    expect(() =>
      resolveLimit({ spaces: [{ propertyType: "Mixed Use", areaSqft: 1 }], basis: "espm", period: "2024-2029", filingYear: 2026, computedAt: AT }),
    ).toThrow(/excluded by rule/);
  });
});

describe("G5 — unit round-trips within 0.01%", () => {
  it("therm → kBtu → therm", () => {
    const t = 180_000;
    expect(fromKBtu(toKBtu(t, "therm"), "therm")).toBeCloseTo(t, 6);
  });
  it("kWh ↔ kBtu", () => {
    expect(toKBtu(1, "kWh")).toBeCloseTo(3.412, 6);
    expect(toKWh(3.412, "kBtu")).toBeCloseTo(1, 6);
  });
  it("1 therm ≈ 29.31 kWh", () => {
    expect(toKWh(1, "therm")).toBeCloseTo(29.31, 2);
  });
  it("gas in therms and in kWh yield the same emissions", () => {
    const period = "2024-2029" as const;
    const a = computeEmissions({ sources: [{ source: "natural_gas", value: 180_000, unit: "therm" }], period, filingYear: 2026, computedAt: AT });
    const b = computeEmissions({ sources: [{ source: "natural_gas", value: toKWh(180_000, "therm"), unit: "kWh" }], period, filingYear: 2026, computedAt: AT });
    expect(Math.abs(a.value.totalTonnes - b.value.totalTonnes) / a.value.totalTonnes).toBeLessThan(0.0001);
  });
});

describe("G6 — zero-consumption sources are ignored", () => {
  it("does not emit a 0 tCO2e row", () => {
    const r = computeEmissions({
      sources: [
        { source: "electricity", value: 100_000, unit: "kWh" },
        { source: "natural_gas", value: 0, unit: "therm" },
        { source: "district_steam", value: -5, unit: "Mlb_steam" },
      ],
      period: "2024-2029",
      filingYear: 2026,
      computedAt: AT,
    });
    expect(r.value.bySource.map((s) => s.source)).toEqual(["electricity"]);
    expect(r.value.bySource[0].share).toBe(1);
  });
});

describe("G7 — coverage thresholds (strict 'exceeds'; verify against §28-320.1)", () => {
  it("single building", () => {
    expect(coverage({ singleBuildingGsf: 25_000 }).covered).toBe(false);
    expect(coverage({ singleBuildingGsf: 25_001 }).covered).toBe(true);
  });
  it("same tax lot", () => {
    expect(coverage({ sameTaxLotTotalGsf: 50_000 }).covered).toBe(false);
    expect(coverage({ sameTaxLotTotalGsf: 50_001 }).covered).toBe(true);
  });
  it("condo board", () => {
    expect(coverage({ condoBoardTotalGsf: 50_000 }).covered).toBe(false);
    expect(coverage({ condoBoardTotalGsf: 50_001 }).covered).toBe(true);
  });
  it("not covered carries the Article 321 note", () => {
    expect(coverage({}).article321Note).toMatch(/Article 321/);
  });
});

describe("G8 — LL33 grade thresholds", () => {
  it.each([
    [84.99, "B"],
    [85, "A"],
    [69.99, "C"],
    [70, "B"],
    [54.99, "D"],
    [55, "C"],
    [100, "A"],
    [1, "D"],
  ])("score %s → %s", (score, letter) => {
    expect(gradeFromScore(score as number)).toBe(letter);
  });
  it("rejects out-of-range scores", () => {
    expect(() => gradeFromScore(0)).toThrow();
    expect(() => gradeFromScore(101)).toThrow();
  });
});

describe("G9 — cumulative exposure", () => {
  it("remaining years from 2026", () => {
    expect(remainingYears("2024-2029", 2026)).toBe(4);
    expect(remainingYears("2030-2034", 2026)).toBe(5);
    expect(remainingYears("2024-2029", 2030)).toBe(0);
  });
  it("cumulative = annual × remaining years, undiscounted", () => {
    const p = computePenalty({ emissionsTonnes: 1_000, limitTonnes: 800, period: "2024-2029", asOfYear: 2026 });
    expect(p.excessTonnes).toBe(200);
    expect(p.annualUsd).toBe(53_600);
    expect(p.cumulativeUsd).toBe(214_400);
    expect(p.marginPct).toBeCloseTo(-0.25, 6);
    expect(p.compliant).toBe(false);
  });
});

describe("Rulesets — integrity", () => {
  it("occupancy table has the 15 statutory groups", () => {
    expect(Object.keys(OCCUPANCY_LIMITS.factors)).toHaveLength(15);
  });
  it("every factor is positive and 2030–2034 is tighter than 2024–2029", () => {
    for (const rs of [OCCUPANCY_LIMITS, ESPM_LIMITS]) {
      for (const [type, f] of Object.entries(rs.factors)) {
        expect(f["2024-2029"], type).toBeGreaterThan(0);
        expect(f["2030-2034"], type).toBeGreaterThan(0);
        expect(f["2030-2034"], type).toBeLessThan(f["2024-2029"]);
      }
    }
  });
  it("ESPM table is explicitly marked partial until transcribed", () => {
    expect(ESPM_LIMITS.status).toBe("partial");
  });
});
