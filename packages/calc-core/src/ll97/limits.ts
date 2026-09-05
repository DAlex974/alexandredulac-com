/**
 * LL97 emissions limit (spec §2.4):
 *
 *   limit(period) = Σ_spaces area_i × factor(propertyType_i, period, filingYear)
 *
 * Whole-building, area-weighted across spaces. Consumption is never
 * allocated to spaces (decision b). The basis is gated by filing year
 * (spec §2.2): CY2024/25 may use either basis; CY2026+ is ESPM only.
 */

import type { Basis, Period, Result } from "../result";
import {
  ESPM_LIMITS,
  OCCUPANCY_LIMITS,
  appliesToFilingYear,
  hashRulesets,
  sourceRefOf,
  type LimitsRuleset,
} from "../rulesets/index";

export type Space = {
  /** Key into the chosen ruleset's `factors`. */
  propertyType: string;
  areaSqft: number;
};

export type SpaceContribution = Space & {
  factor: number;
  limitTonnes: number;
};

export type LimitValue = {
  limitTonnes: number;
  totalAreaSqft: number;
  perSpace: SpaceContribution[];
};

export type ResolveLimitInput = {
  spaces: Space[];
  basis: Basis;
  period: Period;
  filingYear: number;
  /** Test seam: inject a ruleset instead of the vendored one. */
  ruleset?: LimitsRuleset;
  computedAt?: string;
};

export const LAST_OCCUPANCY_FILING_YEAR = 2025;

export function permittedBases(filingYear: number): Basis[] {
  return filingYear <= LAST_OCCUPANCY_FILING_YEAR ? ["espm", "occupancy"] : ["espm"];
}

export function resolveLimit(input: ResolveLimitInput): Result<LimitValue> {
  const { spaces, basis, period, filingYear } = input;

  if (!permittedBases(filingYear).includes(basis)) {
    throw new Error(
      `Basis "${basis}" is not permitted for filing year ${filingYear}. ` +
        `Occupancy-group limits apply to CY2024–CY${LAST_OCCUPANCY_FILING_YEAR} only; later years must use ESPM property types.`,
    );
  }
  if (spaces.length === 0) throw new Error("At least one space is required.");

  const ruleset = input.ruleset ?? (basis === "espm" ? ESPM_LIMITS : OCCUPANCY_LIMITS);

  if (!appliesToFilingYear(ruleset, filingYear)) {
    throw new Error(
      `Ruleset ${ruleset.ruleset}@${ruleset.version} does not apply to filing year ${filingYear}.`,
    );
  }

  const excluded = new Set(ruleset.excludedPropertyTypes ?? []);

  const perSpace: SpaceContribution[] = spaces.map((s) => {
    if (!(s.areaSqft > 0)) {
      throw new Error(`Space "${s.propertyType}" must have a positive area.`);
    }
    if (excluded.has(s.propertyType)) {
      throw new Error(
        `Property type "${s.propertyType}" is excluded by rule and cannot be used to derive a limit.`,
      );
    }
    const factors = ruleset.factors[s.propertyType];
    if (!factors) {
      const hint =
        ruleset.status === "partial"
          ? " (ruleset is a partial transcription — see its notes)"
          : "";
      throw new Error(`Unknown property type "${s.propertyType}" in ${ruleset.ruleset}${hint}.`);
    }
    const factor = factors[period];
    return { ...s, factor, limitTonnes: s.areaSqft * factor };
  });

  const limitTonnes = perSpace.reduce((sum, s) => sum + s.limitTonnes, 0);
  const totalAreaSqft = perSpace.reduce((sum, s) => sum + s.areaSqft, 0);

  return {
    value: { limitTonnes, totalAreaSqft, perSpace },
    method:
      basis === "espm"
        ? "ESPM property type, area-weighted across spaces"
        : "Building Code occupancy group, area-weighted across spaces (CY2024–2025 basis)",
    basis,
    filingYear,
    sources: [sourceRefOf(ruleset)],
    rulesetHash: hashRulesets(ruleset),
    computedAt: input.computedAt ?? new Date().toISOString(),
  };
}
