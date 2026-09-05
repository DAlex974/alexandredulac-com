/**
 * Provenance envelope for every value calc-core returns.
 *
 * Spec §1.3. A result is never a bare number: it says which basis and
 * filing year it was computed for, which rulesets (and which versions)
 * it drew on, and a hash of those rulesets so the same inputs can be
 * replayed later on exactly the same data.
 */

/**
 * "espm" / "occupancy" — the two LL97 limit bases.
 * "statutory" — values read straight from statute (LL33 grade thresholds).
 */
export type Basis = "espm" | "occupancy" | "statutory";

export type Period = "2024-2029" | "2030-2034";

export const PERIODS: readonly Period[] = ["2024-2029", "2030-2034"] as const;

export const PERIOD_YEARS: Record<Period, { start: number; end: number }> = {
  "2024-2029": { start: 2024, end: 2029 },
  "2030-2034": { start: 2030, end: 2034 },
};

export type SourceRef = {
  ruleset: string;
  version: string;
  citation: string;
  url: string;
};

export type Result<T> = {
  value: T;
  /** Human-readable description of the method, e.g. "ESPM property type, area-weighted". */
  method: string;
  basis: Basis;
  /** LL97: the calendar year being filed. LL33: the benchmarking report year. */
  filingYear: number;
  /** Rendered into the Method block of every tool page — never hand-written per page. */
  sources: SourceRef[];
  /** Short SHA-256 over the ruleset files used. Printed on the PDF. */
  rulesetHash: string;
  /** ISO 8601. */
  computedAt: string;
};
