/**
 * LL33 Mode 1 — ENERGY STAR score to letter grade (spec §3.3).
 * Deterministic and exact, per §28-309.12 as amended by LL95 of 2019.
 */

import { LL33_THRESHOLDS, type LL33ThresholdsRuleset } from "../rulesets/index.js";

export type Grade = "A" | "B" | "C" | "D" | "F" | "N";

export type GradeInput =
  | { kind: "score"; score: number }
  | { kind: "not_submitted" }
  | { kind: "exempt" };

export function gradeFromScore(score: number, ruleset: LL33ThresholdsRuleset = LL33_THRESHOLDS): Grade {
  if (!Number.isFinite(score) || score < 1 || score > 100) {
    throw new Error(`ENERGY STAR score must be between 1 and 100; got ${score}.`);
  }
  const { A, B, C } = ruleset.minScoreFor;
  if (score >= A) return "A";
  if (score >= B) return "B";
  if (score >= C) return "C";
  return "D";
}

export function grade(input: GradeInput, ruleset: LL33ThresholdsRuleset = LL33_THRESHOLDS): Grade {
  switch (input.kind) {
    case "score":
      return gradeFromScore(input.score, ruleset);
    case "not_submitted":
      return "F";
    case "exempt":
      return "N";
  }
}
