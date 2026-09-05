/**
 * Unit conversions. IP first (spec §1.5); kBtu is the pivot unit for
 * everything except electricity, whose DOB coefficient is per kWh.
 *
 * Conversion factors marked "verify" depend on fuel heating values that
 * DOB fixes in 1 RCNY §103-14; confirm against the current rule text
 * before a release that changes them.
 */

export const KBTU_PER_KWH = 3.412;
export const KBTU_PER_THERM = 100; // by definition: 1 therm = 100,000 BTU
export const KBTU_PER_CCF = 103.7; // verify — natural gas heating value, ~1,037 BTU/cf
export const KBTU_PER_GALLON_FUEL_OIL_2 = 138.5; // verify — DOB heating value for #2 distillate
export const KBTU_PER_MLB_STEAM = 1194; // verify — 1,194 BTU/lb saturated steam

export const M2_PER_SQFT = 0.092903;
export const SQFT_PER_M2 = 1 / M2_PER_SQFT;

export type EnergyUnit =
  | "kWh"
  | "kBtu"
  | "therm"
  | "CCF"
  | "gallon_fuel_oil_2"
  | "Mlb_steam";

const TO_KBTU: Record<EnergyUnit, number> = {
  kWh: KBTU_PER_KWH,
  kBtu: 1,
  therm: KBTU_PER_THERM,
  CCF: KBTU_PER_CCF,
  gallon_fuel_oil_2: KBTU_PER_GALLON_FUEL_OIL_2,
  Mlb_steam: KBTU_PER_MLB_STEAM,
};

export function toKBtu(value: number, unit: EnergyUnit): number {
  return value * TO_KBTU[unit];
}

export function fromKBtu(kBtu: number, unit: EnergyUnit): number {
  return kBtu / TO_KBTU[unit];
}

export function toKWh(value: number, unit: EnergyUnit): number {
  return unit === "kWh" ? value : toKBtu(value, unit) / KBTU_PER_KWH;
}

export type AreaUnit = "sqft" | "m2";

export function toSqft(value: number, unit: AreaUnit): number {
  return unit === "sqft" ? value : value * SQFT_PER_M2;
}

export function sqftToM2(sqft: number): number {
  return sqft * M2_PER_SQFT;
}

export function m2ToSqft(m2: number): number {
  return m2 * SQFT_PER_M2;
}
