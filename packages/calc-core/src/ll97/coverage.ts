/**
 * LL97 Article 320 coverage pre-check (spec §2.2).
 *
 * Covered if any of:
 *   1. a single building exceeds 25,000 gsf
 *   2. two or more buildings on the same tax lot together exceed 50,000 gsf
 *   3. two or more condominium buildings under the same board of managers
 *      together exceed 50,000 gsf
 *
 * Thresholds are applied as strictly "exceeds" — verify inclusive vs
 * exclusive against §28-320.1 before release (golden G7).
 */

export const SINGLE_BUILDING_GSF_THRESHOLD = 25_000;
export const MULTI_BUILDING_GSF_THRESHOLD = 50_000;

export type CoverageInput = {
  singleBuildingGsf?: number;
  sameTaxLotTotalGsf?: number;
  condoBoardTotalGsf?: number;
};

export type CoverageValue = {
  covered: boolean;
  reason: string;
  /** Article 321 has a separate prescriptive path for rent-regulated and certain affordable housing. */
  article321Note: string;
};

const ARTICLE_321_NOTE =
  "Rent-regulated and certain affordable housing follow Article 321's prescriptive path, not the Article 320 emissions limits.";

export function coverage(input: CoverageInput): CoverageValue {
  if ((input.singleBuildingGsf ?? 0) > SINGLE_BUILDING_GSF_THRESHOLD) {
    return {
      covered: true,
      reason: `Single building exceeds ${SINGLE_BUILDING_GSF_THRESHOLD.toLocaleString("en-US")} gsf.`,
      article321Note: ARTICLE_321_NOTE,
    };
  }
  if ((input.sameTaxLotTotalGsf ?? 0) > MULTI_BUILDING_GSF_THRESHOLD) {
    return {
      covered: true,
      reason: `Buildings on the same tax lot together exceed ${MULTI_BUILDING_GSF_THRESHOLD.toLocaleString("en-US")} gsf.`,
      article321Note: ARTICLE_321_NOTE,
    };
  }
  if ((input.condoBoardTotalGsf ?? 0) > MULTI_BUILDING_GSF_THRESHOLD) {
    return {
      covered: true,
      reason: `Condominium buildings under one board of managers together exceed ${MULTI_BUILDING_GSF_THRESHOLD.toLocaleString("en-US")} gsf.`,
      article321Note: ARTICLE_321_NOTE,
    };
  }
  return {
    covered: false,
    reason: "Below every Article 320 threshold — likely not a covered building.",
    article321Note: ARTICLE_321_NOTE,
  };
}
