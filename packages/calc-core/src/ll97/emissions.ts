/**
 * LL97 building emissions (spec §2.4):
 *
 *   emissions(period) = Σ_sources consumption_j × coefficient(source_j, period)
 *
 * Electricity is coefficient-per-kWh; every other source is per kBtu.
 * Inputs arrive in the unit the bill is in and are converted here.
 * Zero or negative consumption rows are ignored — not treated as a
 * zero-emission source (spec §2.7, golden G6).
 */

import type { Basis, Period, Result } from "../result";
import { COEFFICIENTS, hashRulesets, sourceRefOf, type CoefficientsRuleset } from "../rulesets/index";
import { toKBtu, toKWh, type EnergyUnit } from "../units/convert";

export type Consumption = {
  /** Key into the coefficients ruleset `sources`, e.g. "electricity", "natural_gas". */
  source: string;
  value: number;
  unit: EnergyUnit;
};

export type SourceEmissions = {
  source: string;
  label: string;
  consumptionKBtu: number;
  coefficient: number;
  coefficientPer: "kWh" | "kBtu";
  tonnes: number;
  /** Share of total emissions, 0–1. */
  share: number;
};

export type EmissionsValue = {
  totalTonnes: number;
  bySource: SourceEmissions[];
};

export type ComputeEmissionsInput = {
  sources: Consumption[];
  period: Period;
  filingYear: number;
  /** Carried through for provenance; emissions do not depend on basis. */
  basis?: Basis;
  ruleset?: CoefficientsRuleset;
  computedAt?: string;
};

export function computeEmissions(input: ComputeEmissionsInput): Result<EmissionsValue> {
  const ruleset = input.ruleset ?? COEFFICIENTS;
  const { period } = input;

  const rows: Omit<SourceEmissions, "share">[] = [];

  for (const c of input.sources) {
    if (!(c.value > 0)) continue; // G6: ignored, not a zero row
    const spec = ruleset.sources[c.source];
    if (!spec) throw new Error(`Unknown energy source "${c.source}" in ${ruleset.ruleset}.`);

    const coefficient = spec.coefficient[period];
    const consumptionKBtu = toKBtu(c.value, c.unit);
    const tonnes =
      spec.per === "kWh" ? toKWh(c.value, c.unit) * coefficient : consumptionKBtu * coefficient;

    rows.push({
      source: c.source,
      label: spec.label,
      consumptionKBtu,
      coefficient,
      coefficientPer: spec.per,
      tonnes,
    });
  }

  const totalTonnes = rows.reduce((s, r) => s + r.tonnes, 0);
  const bySource: SourceEmissions[] = rows.map((r) => ({
    ...r,
    share: totalTonnes > 0 ? r.tonnes / totalTonnes : 0,
  }));

  return {
    value: { totalTonnes, bySource },
    method: "Whole-building consumption × DOB coefficient per source, period-dependent",
    basis: input.basis ?? "espm",
    filingYear: input.filingYear,
    sources: [sourceRefOf(ruleset)],
    rulesetHash: hashRulesets(ruleset),
    computedAt: input.computedAt ?? new Date().toISOString(),
  };
}
