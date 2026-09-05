/**
 * LL33 Mode 1 — ENERGY STAR score to letter grade (spec §3.3).
 * Deterministic and exact, per §28-309.12 as amended by LL95 of 2019.
 */

import type { Result } from "../result";
import {
  LL33_THRESHOLDS,
  hashRulesets,
  sourceRefOf,
  type LL33ThresholdsRuleset,
} from "../rulesets/index";

export type Grade = "A" | "B" | "C" | "D" | "F" | "N";

export type GradeInput =
  | { kind: "score"; score: number }
  | { kind: "not_submitted" }
  | { kind: "exempt" };

export function gradeFromScore(
  score: number,
  ruleset: LL33ThresholdsRuleset = LL33_THRESHOLDS,
): Grade {
  if (!Number.isFinite(score) || score < 1 || score > 100) {
    throw new Error(`ENERGY STAR score must be between 1 and 100; got ${score}.`);
  }
  const { A, B, C } = ruleset.minScoreFor;
  if (score >= A) return "A";
  if (score >= B) return "B";
  if (score >= C) return "C";
  return "D";
}

export function grade(
  input: GradeInput,
  ruleset: LL33ThresholdsRuleset = LL33_THRESHOLDS,
): Grade {
  switch (input.kind) {
    case "score":
      return gradeFromScore(input.score, ruleset);
    case "not_submitted":
      return "F";
    case "exempt":
      return "N";
  }
}

/** Score band for a letter grade; undefined for F and N. */
export function bandFor(
  g: Grade,
  ruleset: LL33ThresholdsRuleset = LL33_THRESHOLDS,
): { min: number; max: number } | undefined {
  const { A, B, C } = ruleset.minScoreFor;
  switch (g) {
    case "A":
      return { min: A, max: 100 };
    case "B":
      return { min: B, max: A - 1 };
    case "C":
      return { min: C, max: B - 1 };
    case "D":
      return { min: 1, max: C - 1 };
    default:
      return undefined;
  }
}

export type GradeValue = {
  grade: Grade;
  score?: number;
  band?: { min: number; max: number };
};

export type ResolveGradeInput = GradeInput & {
  /** The benchmarking report year the score belongs to. */
  reportYear: number;
  ruleset?: LL33ThresholdsRuleset;
  computedAt?: string;
};

export function resolveGrade(input: ResolveGradeInput): Result<GradeValue> {
  const ruleset = input.ruleset ?? LL33_THRESHOLDS;
  const g = grade(input, ruleset);
  return {
    value: {
      grade: g,
      score: input.kind === "score" ? input.score : undefined,
      band: bandFor(g, ruleset),
    },
    method: "Statutory score-to-grade thresholds, §28-309.12 as amended by LL95 of 2019",
    basis: "statutory",
    filingYear: input.reportYear,
    sources: [sourceRefOf(ruleset)],
    rulesetHash: hashRulesets(ruleset),
    computedAt: input.computedAt ?? new Date().toISOString(),
  };
}
