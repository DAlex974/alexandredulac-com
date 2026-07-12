/**
 * LL97 compliance constants.
 *
 * Sources:
 * - Occupancy emission limits: NYC Administrative Code §28-320.3.1 (2024–2029)
 *   and §28-320.3.2 (2030–2034). Values are tCO2e per square foot per year.
 * - Fuel emission coefficients: NYC DOB Rule §103-14, Appendix (2022, amended).
 *   DOB publishes these per kBtu; we convert to per kWh once here so all fuel
 *   inputs can be entered directly in kWh (1 kWh = 3.412 kBtu).
 * - Excess emissions penalty: NYC Administrative Code §28-320.6 —
 *   $268 per metric ton CO2e per year of excess.
 * - Electricity 2030+ coefficient: projected ConEd/NYISO grid decarbonization
 *   used in DOB guidance; subject to future DOB updates.
 *
 * Unit conventions:
 * - All emission coefficients stored as tCO2e/kWh.
 * - Occupancy caps stored as tCO2e/sqft. sqft ↔ m² conversion is a
 *   presentation concern handled in the UI (1 sqft = 0.092903 m²).
 */

export type Period = "2024-2029" | "2030-2034";

export const FINE_PER_TON_USD = 268;

// Unit conversions
export const KBTU_PER_KWH = 3.412;
export const SQFT_PER_M2 = 10.7639; // 1 m² = 10.7639 sqft
export const M2_PER_SQFT = 0.092903;

// tCO2e per square foot per year, by occupancy classification.
export const OCCUPANCY_LIMITS: Record<
  string,
  { label: string; limit_2024_2029: number; limit_2030_2034: number }
> = {
  A: { label: "Assembly", limit_2024_2029: 0.01074, limit_2030_2034: 0.0042 },
  B_business: {
    label: "Business",
    limit_2024_2029: 0.00846,
    limit_2030_2034: 0.00453,
  },
  B_healthcare: {
    label: "Healthcare (outpatient)",
    limit_2024_2029: 0.02381,
    limit_2030_2034: 0.01193,
  },
  E: { label: "Education", limit_2024_2029: 0.00758, limit_2030_2034: 0.00344 },
  F: {
    label: "Factory / Industrial",
    limit_2024_2029: 0.00574,
    limit_2030_2034: 0.00167,
  },
  H: {
    label: "High Hazard",
    limit_2024_2029: 0.02381,
    limit_2030_2034: 0.01193,
  },
  I1: {
    label: "Institutional I-1",
    limit_2024_2029: 0.01138,
    limit_2030_2034: 0.00598,
  },
  I2: {
    label: "Institutional I-2",
    limit_2024_2029: 0.02381,
    limit_2030_2034: 0.01193,
  },
  I3: {
    label: "Institutional I-3",
    limit_2024_2029: 0.02381,
    limit_2030_2034: 0.01193,
  },
  I4: {
    label: "Institutional I-4",
    limit_2024_2029: 0.00758,
    limit_2030_2034: 0.00344,
  },
  M: {
    label: "Mercantile",
    limit_2024_2029: 0.01181,
    limit_2030_2034: 0.00403,
  },
  R1: {
    label: "Residential R-1",
    limit_2024_2029: 0.00987,
    limit_2030_2034: 0.00526,
  },
  R2: {
    label: "Residential R-2",
    limit_2024_2029: 0.00675,
    limit_2030_2034: 0.00407,
  },
  S: { label: "Storage", limit_2024_2029: 0.00426, limit_2030_2034: 0.0011 },
  U: { label: "Utility", limit_2024_2029: 0.00426, limit_2030_2034: 0.0011 },
};

export type FuelKey =
  | "electricity"
  | "natural_gas"
  | "district_steam"
  | "fuel_oil_2";

// All coefficients pre-converted to tCO2e/kWh so input is always kWh.
// Comments preserve the original DOB Rule §103-14 values for traceability.
export const FUELS: Record<
  FuelKey,
  {
    label: string;
    inputHelp: string;
    coefficient: Record<Period, number>;
    coefficientSource: string;
  }
> = {
  electricity: {
    label: "Electricity",
    inputHelp: "Annual grid electricity from your utility bill or submeter.",
    // Native DOB unit: tCO2e/kWh (no conversion).
    coefficient: {
      "2024-2029": 0.000288962,
      "2030-2034": 0.000145,
    },
    coefficientSource:
      "DOB Rule §103-14 Appendix (2024–2029: 0.000288962 tCO2e/kWh); DOB projected grid decarbonization (2030+: 0.000145 tCO2e/kWh).",
  },
  natural_gas: {
    label: "Natural gas",
    inputHelp:
      "Energy content in kWh. If your bill is in therms: 1 therm ≈ 29.3 kWh. If in CCF: 1 CCF ≈ 30.4 kWh.",
    // DOB: 0.00005311 tCO2e/kBtu × 3.412 kBtu/kWh = 0.0001812 tCO2e/kWh
    coefficient: {
      "2024-2029": 0.0001812,
      "2030-2034": 0.0001812,
    },
    coefficientSource:
      "DOB Rule §103-14 Appendix — 0.00005311 tCO2e/kBtu × 3.412 kBtu/kWh = 0.0001812 tCO2e/kWh.",
  },
  district_steam: {
    label: "District steam",
    inputHelp:
      "Energy content in kWh. If your bill is in Mlb (thousand pounds): 1 Mlb ≈ 350 kWh.",
    // DOB: 0.00006661 tCO2e/kBtu × 3.412 kBtu/kWh = 0.0002273 tCO2e/kWh
    coefficient: {
      "2024-2029": 0.0002273,
      "2030-2034": 0.0002273,
    },
    coefficientSource:
      "DOB Rule §103-14 Appendix — 0.00006661 tCO2e/kBtu × 3.412 kBtu/kWh = 0.0002273 tCO2e/kWh.",
  },
  fuel_oil_2: {
    label: "Fuel oil #2",
    inputHelp:
      "Energy content in kWh. If your bill is in gallons: 1 gallon ≈ 40.6 kWh.",
    // DOB: 0.00007421 tCO2e/kBtu × 3.412 kBtu/kWh = 0.0002532 tCO2e/kWh
    coefficient: {
      "2024-2029": 0.0002532,
      "2030-2034": 0.0002532,
    },
    coefficientSource:
      "DOB Rule §103-14 Appendix — 0.00007421 tCO2e/kBtu × 3.412 kBtu/kWh = 0.0002532 tCO2e/kWh.",
  },
};

export function emissionsForFuel(
  fuel: FuelKey,
  quantityKWh: number,
  period: Period,
): number {
  return quantityKWh * FUELS[fuel].coefficient[period];
}

export interface ComplianceResult {
  totalTonnes: number;
  cap: number;
  excess: number;
  compliant: boolean;
  annualFineUsd: number;
}

export function computeCompliance(
  emissions: number,
  squareFootage: number,
  occupancyKey: string,
  period: Period,
): ComplianceResult {
  const occupancy = OCCUPANCY_LIMITS[occupancyKey];
  const perSf =
    period === "2024-2029"
      ? occupancy.limit_2024_2029
      : occupancy.limit_2030_2034;
  const cap = perSf * squareFootage;
  const excess = Math.max(0, emissions - cap);
  return {
    totalTonnes: emissions,
    cap,
    excess,
    compliant: excess === 0,
    annualFineUsd: excess * FINE_PER_TON_USD,
  };
}

export function sqftToM2(sqft: number): number {
  return sqft * M2_PER_SQFT;
}

export function m2ToSqft(m2: number): number {
  return m2 * SQFT_PER_M2;
}
