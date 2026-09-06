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
  PERIODS,
  ZERO_LIMIT_FROM_YEAR,
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
    expect(c["2030-2034"]!).toBeLessThan(0.6 * c["2024-2029"]!);
  });
  it("electricity emissions roughly halve between periods for the same consumption", () => {
    const sources = [{ source: "electricity", value: 1_000_000, unit: "kWh" as const }];
    const a = computeEmissions({ sources, period: "2024-2029", filingYear: 2026, computedAt: AT }).value.totalTonnes;
    const b = computeEmissions({ sources, period: "2030-2034", filingYear: 2026, computedAt: AT }).value.totalTonnes;
    expect(a).toBeCloseTo(288.962, 3);
    expect(b).toBeCloseTo(145.0, 3);
  });
});

describe("G3 — three-space mixed-use: Equation 103-14.1, B = Σ lₖ·sₖ, no consumption allocation", () => {
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
    expect(remainingYears("2035-2039", 2026)).toBe(5);
    expect(remainingYears("2040-2049", 2026)).toBe(10);
    expect(remainingYears("2024-2029", 2030)).toBe(0);
    expect(remainingYears("2035-2039", 2038)).toBe(2);
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
  // The ten statutory values of §28-320.3.1; DOB mapped every ESPM type onto one of them.
  const STATUTORY_2024_2029 = new Set([
    0.00426, 0.00574, 0.00675, 0.00758, 0.00846, 0.00987, 0.01074, 0.01138, 0.01181, 0.02381,
  ]);

  it("occupancy table has the 15 statutory groups, both periods, 2030 tighter", () => {
    expect(Object.keys(OCCUPANCY_LIMITS.factors)).toHaveLength(15);
    for (const [type, f] of Object.entries(OCCUPANCY_LIMITS.factors)) {
      expect(f["2024-2029"], type).toBeGreaterThan(0);
      expect(f["2030-2034"], type).toBeGreaterThan(0);
      expect(f["2030-2034"]!, type).toBeLessThan(f["2024-2029"]!);
      expect(STATUTORY_2024_2029.has(f["2024-2029"]!), `${type} ${f["2024-2029"]}`).toBe(true);
    }
  });

  it("ESPM table: 60 types × 4 periods, every 2024–2029 value in the statutory set", () => {
    const entries = Object.entries(ESPM_LIMITS.factors);
    expect(entries).toHaveLength(60);
    expect(ESPM_LIMITS.status).toBe("complete");
    expect(PERIODS).toEqual(["2024-2029", "2030-2034", "2035-2039", "2040-2049"]);
    for (const [type, f] of entries) {
      for (const p of PERIODS) {
        expect(f[p], `${type} ${p}`).toBeDefined();
        expect(f[p]!, `${type} ${p}`).toBeGreaterThanOrEqual(0);
      }
      expect(STATUTORY_2024_2029.has(f["2024-2029"]!), `${type} ${f["2024-2029"]}`).toBe(true);
    }
  });

  it("ESPM limits are non-increasing across consecutive periods, except the documented step", () => {
    // Laboratory's 2030 limit is above its 2024 limit — confirmed against the rule text by the owner on 2026-09-05.
    const ALLOWED_LOOSER_STEPS = new Set(["Laboratory:2024-2029>2030-2034"]);
    for (const [type, f] of Object.entries(ESPM_LIMITS.factors)) {
      for (let i = 1; i < PERIODS.length; i++) {
        const prev = f[PERIODS[i - 1]]!;
        const next = f[PERIODS[i]]!;
        const key = `${type}:${PERIODS[i - 1]}>${PERIODS[i]}`;
        if (ALLOWED_LOOSER_STEPS.has(key)) {
          expect(next, key).toBeGreaterThan(prev);
        } else {
          expect(next, key).toBeLessThanOrEqual(prev);
        }
      }
    }
  });

  it("only Parking and Performing Arts reach a 0.00 limit before 2050", () => {
    const zeros = Object.entries(ESPM_LIMITS.factors)
      .filter(([, f]) => PERIODS.some((p) => f[p] === 0))
      .map(([type]) => type)
      .sort();
    expect(zeros).toEqual(["Parking", "Performing Arts"]);
    expect(ESPM_LIMITS.factors["Parking"]["2040-2049"]).toBe(0);
    expect(ESPM_LIMITS.factors["Performing Arts"]["2040-2049"]).toBe(0);
    expect(ZERO_LIMIT_FROM_YEAR).toBe(2050);
  });

  it("ESPM spot checks against 1 RCNY §103-14(c)(3)", () => {
    const f = ESPM_LIMITS.factors;
    expect(f["Office"]).toEqual({ "2024-2029": 0.00758, "2030-2034": 0.002690852, "2035-2039": 0.00165234, "2040-2049": 0.000581893 });
    expect(f["Financial Office"]).toEqual({ "2024-2029": 0.00846, "2030-2034": 0.003697004, "2035-2039": 0.002772753, "2040-2049": 0.001848502 });
    expect(f["Multifamily Housing"]).toEqual({ "2024-2029": 0.00675, "2030-2034": 0.00334664, "2035-2039": 0.002692183, "2040-2049": 0.002052731 }); // 2030 anchor: matches spec Rev 1
    expect(f["Bank Branch"]).toEqual({ "2024-2029": 0.00987, "2030-2034": 0.004036172, "2035-2039": 0.003027129, "2040-2049": 0.002018086 });
    expect(f["Bowling Alley"]).toEqual({ "2024-2029": 0.00574, "2030-2034": 0.003103815, "2035-2039": 0.002327861, "2040-2049": 0.001551907 });
    expect(f["Distribution Center"]).toEqual({ "2024-2029": 0.00574, "2030-2034": 0.0009916, "2035-2039": 0.000549637, "2040-2049": 0.000123568 });
    expect(f["Data Center"]).toEqual({ "2024-2029": 0.02381, "2030-2034": 0.014791131, "2035-2039": 0.011093348, "2040-2049": 0.007395565 });
    expect(f["Laboratory"]).toEqual({ "2024-2029": 0.02381, "2030-2034": 0.026029868, "2035-2039": 0.019522401, "2040-2049": 0.013014934 });
    expect(f["Worship Facility"]).toEqual({ "2024-2029": 0.00574, "2030-2034": 0.001230602, "2035-2039": 0.000866921, "2040-2049": 0.000549306 });
    expect(f["Strip Mall"]).toEqual({ "2024-2029": 0.01181, "2030-2034": 0.001361842, "2035-2039": 0.000600493, "2040-2049": 0.000038512 });
  });

  it("coefficients: 23 on-premises sources incl. fuel gas and biofuel; none beyond 2034", () => {
    const s = COEFFICIENTS.sources;
    expect(Object.keys(s)).toHaveLength(23);
    expect(s.fuel_gas.coefficient["2024-2029"]).toBe(0.00005925);
    expect(s.biofuel.coefficient["2024-2029"]).toBe(0.00007389);
    expect(s.butane.coefficient["2024-2029"]).toBe(0.00006502);
    for (const [key, spec] of Object.entries(s)) {
      expect(spec.coefficient["2035-2039"], key).toBeUndefined();
      expect(spec.coefficient["2040-2049"], key).toBeUndefined();
    }
    expect(() =>
      computeEmissions({ sources: [{ source: "electricity", value: 1, unit: "kWh" }], period: "2035-2039", filingYear: 2036, computedAt: AT }),
    ).toThrow(/No emissions coefficient for "electricity" in 2035-2039/);
  });

  it("an ESPM Office is tighter than occupancy Group B in both periods", () => {
    const spaces = [{ propertyType: "Office", areaSqft: 450_000 }];
    const occ = [{ propertyType: "Group B (Business)", areaSqft: 450_000 }];
    const e24 = resolveLimit({ spaces, basis: "espm", period: "2024-2029", filingYear: 2026, computedAt: AT });
    const o24 = resolveLimit({ spaces: occ, basis: "occupancy", period: "2024-2029", filingYear: 2025, computedAt: AT });
    expect(e24.value.limitTonnes).toBeCloseTo(3411, 3); // 0.00758 vs 0.00846
    expect(o24.value.limitTonnes).toBeCloseTo(3807, 3);
    const e30 = resolveLimit({ spaces, basis: "espm", period: "2030-2034", filingYear: 2026, computedAt: AT });
    const o30 = resolveLimit({ spaces: occ, basis: "occupancy", period: "2030-2034", filingYear: 2025, computedAt: AT });
    expect(e30.value.limitTonnes).toBeCloseTo(1210.8834, 3); // 0.002690852 vs 0.00453
    expect(o30.value.limitTonnes).toBeCloseTo(2038.5, 3);
  });

  it("resolveLimit refuses a period that is not transcribed rather than guessing", () => {
    const partial: LimitsRuleset = {
      ...ESPM_LIMITS,
      ruleset: "test-partial",
      version: "0.0.0-test",
      status: "partial",
      factors: { Office: { "2024-2029": 0.00758 } },
    };
    expect(() =>
      resolveLimit({ spaces: [{ propertyType: "Office", areaSqft: 1 }], basis: "espm", period: "2030-2034", filingYear: 2026, ruleset: partial, computedAt: AT }),
    ).toThrow(/not transcribed for 2030-2034/);
  });
});

describe("G10 — the G1 office under the ESPM basis (mandatory from CY2026)", () => {
  const spaces = [{ propertyType: "Office", areaSqft: 450_000 }];
  const sources = [
    { source: "electricity", value: 5_200_000, unit: "kWh" as const },
    { source: "natural_gas", value: 180_000, unit: "therm" as const },
  ];

  it("2024–2029: under, with less headroom than Group B (952 vs 1,348 tCO2e)", () => {
    const limit = resolveLimit({ spaces, basis: "espm", period: "2024-2029", filingYear: 2026, computedAt: AT });
    const em = computeEmissions({ sources, period: "2024-2029", filingYear: 2026, computedAt: AT });
    const p = computePenalty({ emissionsTonnes: em.value.totalTonnes, limitTonnes: limit.value.limitTonnes, period: "2024-2029", asOfYear: 2026 });
    expect(p.compliant).toBe(true);
    expect(p.marginTonnes).toBeCloseTo(952.4, 1);
  });

  it("2030–2034: OVER by ≈499 tCO2e — $133.8k/yr, $668.8k over the period", () => {
    const limit = resolveLimit({ spaces, basis: "espm", period: "2030-2034", filingYear: 2026, computedAt: AT });
    const em = computeEmissions({ sources, period: "2030-2034", filingYear: 2026, computedAt: AT });
    const p = computePenalty({ emissionsTonnes: em.value.totalTonnes, limitTonnes: limit.value.limitTonnes, period: "2030-2034", asOfYear: 2026 });
    expect(em.value.totalTonnes).toBeCloseTo(1710.0, 1);
    expect(limit.value.limitTonnes).toBeCloseTo(1210.9, 1);
    expect(p.compliant).toBe(false);
    expect(p.excessTonnes).toBeCloseTo(499.1, 1);
    expect(p.annualUsd).toBeCloseTo(133_760, -2);
    expect(p.remainingYears).toBe(5);
    expect(p.cumulativeUsd).toBeCloseTo(668_800, -2);
  });
});
