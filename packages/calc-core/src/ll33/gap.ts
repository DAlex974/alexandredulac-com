/**
 * LL33 Mode 3 — gap to the next grade (spec §3.5).
 *
 * Points needed is exact (statutory thresholds). The source-EUI
 * translation is only computed when an EPA score lookup table exists for
 * the property type; otherwise the result says why it is unavailable
 * rather than guessing. Output is framed as a target, never as a measure.
 */

import type { Result } from "../result";
import {
  LL33_THRESHOLDS,
  SCORE_LOOKUP,
  hashRulesets,
  sourceRefOf,
  type LL33ThresholdsRuleset,
  type ScoreLookupRuleset,
  type ScoreLookupTable,
} from "../rulesets/index";
import { gradeFromScore, type Grade } from "./grade";

export type TargetGrade = "A" | "B" | "C";

export type GapInput = {
  /** Current ENERGY STAR score, 1–100. */
  currentScore: number;
  targetGrade: TargetGrade;
  /** The benchmarking report year the score belongs to. */
  reportYear: number;
  /** Optional — enables the EUI translation when a lookup exists for the type. */
  propertyType?: string;
  /** kBtu per sf per year, source energy. */
  currentSourceEuiKbtuPerSf?: number;
  grossFloorAreaSqft?: number;
  annualUtilitySpendUsd?: number;
  thresholds?: LL33ThresholdsRuleset;
  lookup?: ScoreLookupRuleset;
  computedAt?: string;
};

export type EuiReduction = {
  modelVersion: string;
  /** actual ÷ predicted source EUI at the current score. */
  currentRatio: number;
  /** actual ÷ predicted source EUI at the target's minimum score. */
  targetRatio: number;
  /** Fraction of source EUI to remove, 0–1. */
  pct: number;
  kbtuPerSf?: number;
  totalKbtuPerYear?: number;
  /** Proportional to the EUI reduction — rough, blended, no tariff model. */
  spendReductionUsd?: number;
};

export type GapValue = {
  currentScore: number;
  currentGrade: Grade;
  targetGrade: TargetGrade;
  targetMinScore: number;
  /** 0 when the target is already met. */
  pointsNeeded: number;
  alreadyMet: boolean;
  euiReduction: EuiReduction | null;
  euiReductionUnavailableReason?: string;
};

/** Ratio at a (possibly fractional) score, linearly interpolated. */
export function ratioAtScore(table: ScoreLookupTable, score: number): number {
  const r = table.ratioAtScore;
  if (r.length !== 100) {
    throw new Error(`Score lookup table must have 100 rows; has ${r.length}.`);
  }
  const s = Math.min(100, Math.max(1, score));
  const lo = Math.floor(s);
  const hi = Math.ceil(s);
  if (lo === hi) return r[lo - 1];
  const t = s - lo;
  return r[lo - 1] + (r[hi - 1] - r[lo - 1]) * t;
}

export function gapToGrade(input: GapInput): Result<GapValue> {
  const thresholds = input.thresholds ?? LL33_THRESHOLDS;
  const lookup = input.lookup ?? SCORE_LOOKUP;
  const { currentScore, targetGrade } = input;

  const currentGrade = gradeFromScore(currentScore, thresholds); // validates 1–100
  const targetMinScore = thresholds.minScoreFor[targetGrade];
  const pointsNeeded = Math.max(0, targetMinScore - currentScore);
  const alreadyMet = pointsNeeded === 0;

  let euiReduction: EuiReduction | null = null;
  let euiReductionUnavailableReason: string | undefined;

  if (alreadyMet) {
    euiReductionUnavailableReason = "Target already met — no reduction required.";
  } else if (!input.propertyType) {
    euiReductionUnavailableReason =
      "Select a property type to translate points into a source-EUI reduction.";
  } else {
    const table = lookup.tables[input.propertyType];
    if (!table) {
      euiReductionUnavailableReason =
        lookup.status === "pending"
          ? `The EPA score lookup for "${input.propertyType}" has not been transcribed yet; points needed is exact, the EUI translation is not available.`
          : `No EPA score lookup is available for "${input.propertyType}".`;
    } else {
      const currentRatio = ratioAtScore(table, currentScore);
      const targetRatio = ratioAtScore(table, targetMinScore);
      const pct = 1 - targetRatio / currentRatio;
      const eui = input.currentSourceEuiKbtuPerSf;
      const area = input.grossFloorAreaSqft;
      const spend = input.annualUtilitySpendUsd;
      euiReduction = {
        modelVersion: table.modelVersion,
        currentRatio,
        targetRatio,
        pct,
        kbtuPerSf: eui && eui > 0 ? eui * pct : undefined,
        totalKbtuPerYear: eui && eui > 0 && area && area > 0 ? eui * pct * area : undefined,
        spendReductionUsd: spend && spend > 0 ? spend * pct : undefined,
      };
    }
  }

  const sources = [sourceRefOf(thresholds)];
  const used = [thresholds as Parameters<typeof hashRulesets>[0]];
  if (euiReduction) {
    sources.push(sourceRefOf(lookup));
    used.push(lookup);
  }

  return {
    value: {
      currentScore,
      currentGrade,
      targetGrade,
      targetMinScore,
      pointsNeeded,
      alreadyMet,
      euiReduction,
      euiReductionUnavailableReason,
    },
    method: euiReduction
      ? "Statutory thresholds for points; EPA score lookup (ratio of actual to predicted source EUI) for the EUI translation"
      : "Statutory thresholds for points; EUI translation not computed",
    basis: "statutory",
    filingYear: input.reportYear,
    sources,
    rulesetHash: hashRulesets(...used),
    computedAt: input.computedAt ?? new Date().toISOString(),
  };
}
