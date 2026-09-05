/**
 * Typed access to the vendored rulesets (spec §1.2).
 *
 * One file per ruleset, both periods in the same file. A DOB amendment is
 * a new versioned file, never an in-place edit. `pnpm audit:rulesets`
 * (spec §6.1) re-hashes each `sourceUrl` and fails if it drifts from
 * `sourceSha256`.
 */

import { createHash } from "node:crypto";
import type { Period, SourceRef } from "../result.js";

import occupancyLimitsJson from "./ll97-occupancy-limits.v1.json" with { type: "json" };
import espmLimitsJson from "./ll97-espm-limits.v1.json" with { type: "json" };
import coefficientsJson from "./ll97-coefficients.v1.json" with { type: "json" };
import ll33ThresholdsJson from "./ll33-grade-thresholds.v1.json" with { type: "json" };

type RulesetMeta = {
  ruleset: string;
  version: string;
  source: string;
  sourceUrl: string;
  sourceSha256: string;
  retrievedAt: string;
  effectiveFrom: string;
  appliesToFilingYears: number[];
  status: "complete" | "partial";
  notes?: string[];
};

export type PeriodFactors = Record<Period, number>;

export type LimitsRuleset = RulesetMeta & {
  units: string;
  excludedPropertyTypes?: string[];
  factors: Record<string, PeriodFactors>;
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

export const OCCUPANCY_LIMITS: LimitsRuleset = occupancyLimitsJson as LimitsRuleset;
export const ESPM_LIMITS: LimitsRuleset = espmLimitsJson as LimitsRuleset;
export const COEFFICIENTS: CoefficientsRuleset = coefficientsJson as CoefficientsRuleset;
export const LL33_THRESHOLDS: LL33ThresholdsRuleset = ll33ThresholdsJson as LL33ThresholdsRuleset;

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
