/**
 * LL97 compliance constants.
 *
 * Sources:
 * - Occupancy emission limits: NYC Administrative Code §28-320.3.1 (2024–2029)
 *   and §28-320.3.2 (2030–2034).
 * - Fuel emission coefficients: NYC DOB Rule §103-14, Appendix (2022, amended).
 * - Excess emissions penalty: NYC Administrative Code §28-320.6 —
 *   $268 per metric ton CO2e per year of excess.
 * - Electricity 2030+ coefficient: projected ConEd/NYISO grid decarbonization
 *   used by DOB in guidance; subject to future DOB updates.
 */

export type Period = "2024-2029" | "2030-2034";

export const FINE_PER_TON_USD = 268;

// tCO2e per square foot per year, by occupancy classification.
// Full table stored for future expansion; UI currently exposes Business only.
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

// Emission coefficients in tCO2e per unit; unit varies by fuel.
// Values are period-dependent for electricity (grid decarbonization).
export type FuelKey =
  | "electricity"
  | "natural_gas"
  | "district_steam"
  | "fuel_oil_2";

export const FUELS: Record<
  FuelKey,
  {
    label: string;
    inputUnit: string;
    inputHelp: string;
    // Converts one input unit to tCO2e for the given period.
    coefficient: Record<Period, number>;
    coefficientUnit: string;
    // Factor to convert one input unit to kBtu (for fuels priced in kBtu).
    // For electricity we bypass kBtu and apply coefficient directly to kWh.
    unitToKBtu?: number;
    coefficientSource: string;
  }
> = {
  electricity: {
    label: "Electricity",
    inputUnit: "kWh / year",
    inputHelp: "From ConEd or your submeter — annual grid electricity.",
    // tCO2e per kWh
    coefficient: {
      "2024-2029": 0.000288962,
      "2030-2034": 0.000145,
    },
    coefficientUnit: "tCO2e/kWh",
    coefficientSource:
      "DOB Rule §103-14 Appendix (2024–2029); DOB projected grid decarbonization (2030+).",
  },
  natural_gas: {
    label: "Natural gas",
    inputUnit: "therms / year",
    inputHelp: "1 therm = 100 kBtu (standard ConEd gas bill unit).",
    // tCO2e per kBtu
    coefficient: {
      "2024-2029": 0.00005311,
      "2030-2034": 0.00005311,
    },
    coefficientUnit: "tCO2e/kBtu",
    unitToKBtu: 100,
    coefficientSource: "DOB Rule §103-14 Appendix.",
  },
  district_steam: {
    label: "District steam",
    inputUnit: "Mlb / year",
    inputHelp:
      "Thousands of pounds — standard ConEd steam bill unit. 1 Mlb ≈ 1,194 kBtu.",
    coefficient: {
      "2024-2029": 0.00006661,
      "2030-2034": 0.00006661,
    },
    coefficientUnit: "tCO2e/kBtu",
    unitToKBtu: 1194,
    coefficientSource: "DOB Rule §103-14 Appendix.",
  },
  fuel_oil_2: {
    label: "Fuel oil #2",
    inputUnit: "gallons / year",
    inputHelp: "Heating oil #2. 1 gallon ≈ 138.5 kBtu.",
    coefficient: {
      "2024-2029": 0.00007421,
      "2030-2034": 0.00007421,
    },
    coefficientUnit: "tCO2e/kBtu",
    unitToKBtu: 138.5,
    coefficientSource: "DOB Rule §103-14 Appendix (distillate #2).",
  },
};

export function emissionsForFuel(
  fuel: FuelKey,
  quantity: number,
  period: Period,
): number {
  const spec = FUELS[fuel];
  const coeff = spec.coefficient[period];
  if (fuel === "electricity") {
    return quantity * coeff;
  }
  const kBtu = quantity * (spec.unitToKBtu ?? 1);
  return kBtu * coeff;
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
