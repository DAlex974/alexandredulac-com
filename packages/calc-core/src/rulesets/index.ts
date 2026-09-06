/**
 * Typed access to the vendored rulesets (spec §1.2).
 *
 * One file per ruleset, both periods in the same file. A DOB amendment is
 * a new versioned file, never an in-place edit. `pnpm audit:rulesets`
 * (spec §6.1) re-hashes each `sourceUrl` and fails if it drifts from
 * `sourceSha256`.
 */

import { createHash } from "node:crypto";
import type { Period, SourceRef } from "../result";

import occupancyLimitsJson from "./ll97-occupancy-limits.v1.json";
import espmLimitsJson from "./ll97-espm-limits.v1.json";
import coefficientsJson from "./ll97-coefficients.v1.json";
import ll33ThresholdsJson from "./ll33-grade-thresholds.v1.json";
import scoreLookupJson from "./energystar-score-lookup.v1.json";

export type RulesetMeta = {
  ruleset: string;
  version: string;
  source: string;
  sourceUrl: string;
  sourceSha256: string;
  retrievedAt: string;
  effectiveFrom: string;
  appliesToFilingYears: number[];
  status: "complete" | "partial" | "pending";
  notes?: string[];
};

export type PeriodFactors = Record<Period, number>;

export type LimitsRuleset = RulesetMeta & {
  units: string;
  excludedPropertyTypes?: string[];
  /** A period may be absent while its column is still being transcribed. */
  factors: Record<string, Partial<PeriodFactors>>;
};

export type CoefficientSpec = {
  label: string;
  per: "kWh" | "kBtu";
  coefficient: PeriodFactors;
};

export type CoefficientsRuleset = RulesetMeta & {
  sources: Record<string, CoefficientSpec>;
};

export type LL33ThresholdsRuleset = RulesetMeta & {
  minScoreFor: { A: number; B: number; C: number };
};

/**
 * EPA ENERGY STAR score lookup, per property type: the energy-efficiency
 * ratio (actual ÷ predicted source EUI) that corresponds to each 1–100
 * score. `ratioAtScore[i]` is the ratio for score i+1; it decreases as
 * the score rises.
 */
export type ScoreLookupTable = {
  modelVersion: string;
  ratioAtScore: number[];
};

export type ScoreLookupRuleset = RulesetMeta & {
  tables: Record<string, ScoreLookupTable>;
};

export const OCCUPANCY_LIMITS: LimitsRuleset = occupancyLimitsJson as LimitsRuleset;
export const ESPM_LIMITS: LimitsRuleset = espmLimitsJson as LimitsRuleset;
export const COEFFICIENTS: CoefficientsRuleset = coefficientsJson as CoefficientsRuleset;
export const LL33_THRESHOLDS: LL33ThresholdsRuleset = ll33ThresholdsJson as LL33ThresholdsRuleset;
export const SCORE_LOOKUP: ScoreLookupRuleset = scoreLookupJson as ScoreLookupRuleset;

export function sourceRefOf(r: RulesetMeta): SourceRef {
  return {
    ruleset: r.ruleset,
    version: r.version,
    citation: r.source,
    url: r.sourceUrl,
  };
}

/** Short SHA-256 over the exact ruleset objects a computation used. */
export function hashRulesets(...rulesets: RulesetMeta[]): string {
  const h = createHash("sha256");
  for (const r of rulesets) h.update(JSON.stringify(r));
  return h.digest("hex").slice(0, 16);
}

export function appliesToFilingYear(r: RulesetMeta, filingYear: number): boolean {
  return r.appliesToFilingYears.includes(filingYear);
}
