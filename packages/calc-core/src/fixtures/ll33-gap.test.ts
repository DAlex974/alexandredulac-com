/**
 * LL33 Mode 3 goldens. Points are exact from statute. The EUI translation
 * is exercised against a synthetic lookup table (the vendored EPA table
 * is pending transcription — the tests assert that state honestly).
 */

import { describe, expect, it } from "vitest";
import {
  SCORE_LOOKUP,
  bandFor,
  gapToGrade,
  ratioAtScore,
  resolveGrade,
  type ScoreLookupRuleset,
} from "../index";

const AT = "2026-09-05T00:00:00.000Z";

// ratio falls linearly from 1.50 at score 1 to 0.51 at score 100
const synthetic: ScoreLookupRuleset = {
  ...SCORE_LOOKUP,
  ruleset: "test-score-lookup",
  version: "0.0.0-test",
  status: "complete",
  tables: {
    "Test Type": {
      modelVersion: "test-2024",
      ratioAtScore: Array.from({ length: 100 }, (_, i) => 1.5 - 0.01 * i),
    },
  },
};

describe("Mode 1 — resolveGrade envelope", () => {
  it("returns grade, band and provenance", () => {
    const r = resolveGrade({ kind: "score", score: 72, reportYear: 2025, computedAt: AT });
    expect(r.value.grade).toBe("B");
    expect(r.value.band).toEqual({ min: 70, max: 84 });
    expect(r.basis).toBe("statutory");
    expect(r.sources[0].ruleset).toBe("ll33-grade-thresholds");
    expect(r.rulesetHash).toMatch(/^[0-9a-f]{16}$/);
  });
  it("F and N carry no band", () => {
    expect(resolveGrade({ kind: "not_submitted", reportYear: 2025 }).value).toMatchObject({ grade: "F", band: undefined });
    expect(resolveGrade({ kind: "exempt", reportYear: 2025 }).value).toMatchObject({ grade: "N", band: undefined });
  });
  it("bands tile 1–100 without gaps", () => {
    expect(bandFor("D")).toEqual({ min: 1, max: 54 });
    expect(bandFor("C")).toEqual({ min: 55, max: 69 });
    expect(bandFor("B")).toEqual({ min: 70, max: 84 });
    expect(bandFor("A")).toEqual({ min: 85, max: 100 });
  });
});

describe("Mode 3 — points needed (exact)", () => {
  it("62 → B needs 8; 62 → A needs 23", () => {
    const b = gapToGrade({ currentScore: 62, targetGrade: "B", reportYear: 2025, computedAt: AT });
    expect(b.value).toMatchObject({ currentGrade: "C", targetMinScore: 70, pointsNeeded: 8, alreadyMet: false });
    const a = gapToGrade({ currentScore: 62, targetGrade: "A", reportYear: 2025, computedAt: AT });
    expect(a.value.pointsNeeded).toBe(23);
  });
  it("already met → 0 points, no reduction", () => {
    const r = gapToGrade({ currentScore: 90, targetGrade: "B", reportYear: 2025, computedAt: AT });
    expect(r.value).toMatchObject({ pointsNeeded: 0, alreadyMet: true, euiReduction: null });
    expect(r.value.euiReductionUnavailableReason).toMatch(/already met/);
  });
  it("rejects out-of-range scores", () => {
    expect(() => gapToGrade({ currentScore: 0, targetGrade: "B", reportYear: 2025 })).toThrow();
    expect(() => gapToGrade({ currentScore: 101, targetGrade: "B", reportYear: 2025 })).toThrow();
  });
});

describe("Mode 3 — EUI translation", () => {
  it("is unavailable without a property type", () => {
    const r = gapToGrade({ currentScore: 50, targetGrade: "B", reportYear: 2025, computedAt: AT });
    expect(r.value.euiReduction).toBeNull();
    expect(r.value.euiReductionUnavailableReason).toMatch(/Select a property type/);
    expect(r.sources).toHaveLength(1);
  });
  it("is unavailable while the vendored EPA lookup is pending", () => {
    expect(SCORE_LOOKUP.status).toBe("pending");
    const r = gapToGrade({ currentScore: 50, targetGrade: "B", reportYear: 2025, propertyType: "Multifamily Housing", computedAt: AT });
    expect(r.value.euiReduction).toBeNull();
    expect(r.value.euiReductionUnavailableReason).toMatch(/not been transcribed/);
  });
  it("interpolates the lookup", () => {
    const t = synthetic.tables["Test Type"];
    expect(ratioAtScore(t, 1)).toBeCloseTo(1.5, 9);
    expect(ratioAtScore(t, 100)).toBeCloseTo(0.51, 9);
    expect(ratioAtScore(t, 50.5)).toBeCloseTo(1.005, 9);
  });
  it("computes reduction = 1 − ratio(target) ÷ ratio(current), scaled by EUI, area, spend", () => {
    const r = gapToGrade({
      currentScore: 50,
      targetGrade: "B",
      reportYear: 2025,
      propertyType: "Test Type",
      currentSourceEuiKbtuPerSf: 100,
      grossFloorAreaSqft: 100_000,
      annualUtilitySpendUsd: 500_000,
      lookup: synthetic,
      computedAt: AT,
    });
    const e = r.value.euiReduction!;
    expect(e.currentRatio).toBeCloseTo(1.01, 9); // score 50
    expect(e.targetRatio).toBeCloseTo(0.81, 9); // score 70
    expect(e.pct).toBeCloseTo(1 - 0.81 / 1.01, 9);
    expect(e.kbtuPerSf).toBeCloseTo(100 * e.pct, 9);
    expect(e.totalKbtuPerYear).toBeCloseTo(100 * e.pct * 100_000, 6);
    expect(e.spendReductionUsd).toBeCloseTo(500_000 * e.pct, 6);
    expect(r.sources.map((s) => s.ruleset)).toEqual(["ll33-grade-thresholds", "test-score-lookup"]);
  });
});
