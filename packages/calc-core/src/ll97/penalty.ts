/**
 * LL97 excess-emissions penalty (spec §2.4, §2.5):
 *
 *   excess     = max(0, emissions − limit)
 *   annual $   = excess × 268                     (§28-320.6)
 *   cumulative = annual × remaining years in the period, undiscounted,
 *                consumption assumed flat — stated on the page.
 *
 * `asOfYear` is explicit: no hidden clock in a pure function.
 */

import { PERIOD_YEARS, type Period } from "../result";

export const PENALTY_USD_PER_TONNE = 268;

export type PenaltyInput = {
  emissionsTonnes: number;
  limitTonnes: number;
  period: Period;
  asOfYear: number;
};

export type PenaltyValue = {
  compliant: boolean;
  excessTonnes: number;
  /** limit − emissions; negative when over. */
  marginTonnes: number;
  /** margin as a fraction of the limit; negative when over. */
  marginPct: number;
  annualUsd: number;
  remainingYears: number;
  cumulativeUsd: number;
};

export function remainingYears(period: Period, asOfYear: number): number {
  const { start, end } = PERIOD_YEARS[period];
  const from = Math.max(start, asOfYear);
  return Math.max(0, end - from + 1);
}

export function computePenalty(input: PenaltyInput): PenaltyValue {
  const { emissionsTonnes, limitTonnes, period, asOfYear } = input;
  const excessTonnes = Math.max(0, emissionsTonnes - limitTonnes);
  const marginTonnes = limitTonnes - emissionsTonnes;
  const years = remainingYears(period, asOfYear);
  const annualUsd = excessTonnes * PENALTY_USD_PER_TONNE;
  return {
    compliant: excessTonnes === 0,
    excessTonnes,
    marginTonnes,
    marginPct: limitTonnes > 0 ? marginTonnes / limitTonnes : 0,
    annualUsd,
    remainingYears: years,
    cumulativeUsd: annualUsd * years,
  };
}
