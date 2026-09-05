# Papilio Tools — Spec: LL97 v2 & LL33 v1

**Status:** Revision 2 — decisions confirmed 2026-09-05, ready to build
**Owner:** Alexandre Dulac / Papilio Strategies LLC
**Date:** September 2026
**Scope:** `alexandredulac.com/tools/*` — public-facing calculators; shared calculation engine with BFY-Diagnostics

---

## Changelog — Rev 1 → Rev 2

| § | Change |
|---|---|
| 2.4 | **Corrected.** Rev 1 suspected v1 applied a single electricity coefficient across both periods. It does not: `app/tools/ll97/constants.ts` carries `0.000288962` (2024–2029) and `0.000145` (2030–2034) tCO2e/kWh, and the calculation honours the split (verified on the 250 Park Ave case: 1,502.6 → 754.0 tCO2e electricity). The requirement becomes a golden test that fails if the two values ever converge. |
| 1.2 / 1.3 | Rulesets get semver + `effectiveFrom`; resolution is by **filing year**, not calculation date. `Result` gains `rulesetHash` for reproducibility. |
| 2.3 / 2.4 | **Consumption is not allocated to spaces.** LL97 compliance is whole-building: the limit is area-weighted across spaces, emissions are building-level. Per-space output shows limit contribution only. This removes an allocation rule that Rev 1 review had proposed and that the statute does not require. |
| 2.2 / 5 | The legacy occupancy-group basis is not a separate mode. A **Reporting year** field (CY2024 / CY2025 / CY2026+) gates which basis is selectable. No permanently maintained "legacy" route. |
| 2.6 | DOB-granted adjustments added to out-of-scope with a required UI note. |
| 3.4 | LL33 Mode 2 returns a `predictionInterval` and a `bandCrossesThreshold` flag from calc-core; the UI does not decide when to withhold a letter. |
| 4 | Build order revised: LL33 Mode 1 + 3 + calendar ship **before** the LL97 ESPM rebuild. |
| 5 | Open questions resolved into decisions a–h; confirmed by the owner on 2026-09-05. Decision **a** changed from preview-then-swap to **direct replacement** of v1. |
| 6 | New: operations — limits-table audit script, runtime placement, routes, lead capture, telemetry events. |

---

## 0. Context and the one decision that drives everything

The live tool (`/tools/ll97`, v1) computes the emissions limit from the **NYC Building Code occupancy group** (Group B, Admin Code §28-320.3.1). That basis is being retired.

DOB Rule 1 RCNY §103-14 (Dec 2022, amended Dec 2023) replaced the occupancy-group limits with limits keyed to **ENERGY STAR Portfolio Manager (ESPM) property types** (~60). Transition:

| Report year | Permitted basis |
|---|---|
| CY2024, CY2025 | ESPM property types **or** §28-320.3.1 occupancy groups — one methodology per filing, no mixing |
| CY2026 and after | **ESPM property types only** |

The CY2026 report is due **May 1, 2027**. A tool that still leads with "what's your occupancy group?" answers last year's question by the time it ranks.

**Decision:** LL97 v2 is a rebuild on the ESPM property-type table. The occupancy-group basis survives only as the CY2024/CY2025 option behind a Reporting-year field.

Symptom of the two-basis problem the tool must resolve rather than reproduce: the R-2 / Multifamily 2030–2034 limit is published as **0.00407** tCO2e/sf (statutory §28-320.3.2) *and* as **0.00334664** tCO2e/sf (ESPM Multifamily Housing). Both are correct under their basis.

---

## 1. Shared foundation (build before either tool)

### 1.1 `calc-core` — one library, two consumers

Pure functions. No UI, no DOM, no framework. Consumed by the public site and by BFY-Diagnostics. A formula that exists in two places will diverge.

```
calc-core/
  rulesets/                 # versioned JSON — the only place a regulatory constant lives
    ll97-espm-limits.v1.json
    ll97-occupancy-limits.v1.json
    ll97-coefficients.v1.json
    ll33-grade-thresholds.v1.json
  ll97/
    limits.ts               # (spaces, basis, period, filingYear) -> limit
    emissions.ts            # (sources, period) -> tCO2e
    penalty.ts              # excess -> $/yr, cumulative
    coverage.ts             # pre-check: covered / not covered / Article 321
  ll33/
    grade.ts                # score -> letter (deterministic)
    gap.ts                  # (score, target) -> points, EUI delta
    estimate.ts             # (inputs) -> score, predictionInterval (Multifamily first)
  units/
    convert.ts              # therms, CCF, gallons, Mlb, kBtu, kWh, sf, m²
  result.ts                 # Result<T>, SourceRef
  fixtures/                 # golden tests
```

### 1.2 Rule data is data, not code

Every regulatory constant lives in a versioned JSON asset:

```json
{
  "ruleset": "ll97-espm-limits",
  "version": "1.0.0",
  "source": "1 RCNY §103-14(c)(3)(i)",
  "sourceUrl": "https://www.nyc.gov/assets/buildings/pdf/...",
  "sourceSha256": "…",
  "retrievedAt": "2026-09-04",
  "effectiveFrom": "2024-01-01",
  "appliesToFilingYears": [2024, 2025, 2026, 2027, 2028, 2029],
  "units": "tCO2e/sf/yr",
  "factors": { "Multifamily Housing": 0.00675, "Office": 0.0 }
}
```

Rules:

- **Semver.** A DOB amendment is a new file version, never an in-place edit. Old versions stay in the repo.
- **Resolution by filing year.** `limits.ts` picks the ruleset whose `appliesToFilingYears` contains the filing year. A building filed on CY2024 must compute identically in 2028, after any later amendment.
- **Source hash.** `sourceSha256` is the hash of the DOB document the numbers were transcribed from. See §6.1 for the audit script that keys off it.

### 1.3 Every result carries its provenance

```ts
type SourceRef = { ruleset: string; version: string; citation: string; url: string };

type Result<T> = {
  value: T;
  method: string;            // "ESPM property type, area-weighted"
  basis: "espm" | "occupancy";
  filingYear: number;
  sources: SourceRef[];      // rendered into the Method block — never hand-written per page
  rulesetHash: string;       // short SHA-256 over the concatenated ruleset files used
  computedAt: string;        // ISO 8601
};
```

`rulesetHash` is what lets a PDF from 2026 be replayed in 2028 with the exact data it was computed on. It is printed on the PDF.

### 1.4 Golden tests

A fixture file of worked examples with expected outputs. Any formula or ruleset change that moves a golden number fails CI. Minimum set before any UI work:

| ID | Case | Asserts |
|---|---|---|
| G1 | 450,000 sf Office, 5,200,000 kWh electricity, 180,000 therms gas, occupancy basis Group B | 2024–29: 2,458.6 tCO2e vs 3,807.0 limit; 2030–34: 1,710.0 vs 2,038.5 *(current v1 output — pins legacy basis)* |
| G2 | Electricity coefficient | `coef(elec, 2030–2034) < 0.6 × coef(elec, 2024–2029)` — fails if the period split is ever lost |
| G3 | Three-space mixed-use, three ESPM types | Limit equals Σ area_i × factor_i to 4 decimals; no consumption allocation performed |
| G4 | Same building, ESPM vs occupancy basis, CY2025 | Both computed; divergence reported, not silently chosen |
| G5 | Unit round-trips | therm → kBtu → kWh → kBtu → therm within 0.01% |
| G6 | Zero-consumption source | Excluded from source breakdown, not shown as a 0 tCO2e row |
| G7 | Coverage boundary | 25,000 gsf single building → not covered; 25,001 → covered *(verify inclusive/exclusive against §28-320.1)* |
| G8 | LL33 thresholds | 84.99 → B, 85 → A, 69.99 → C, 70 → B, 54.99 → D, 55 → C |
| G9 | Cumulative exposure | Annual penalty × remaining years per period, undiscounted, from the current calendar year |

### 1.5 Conventions

- **Units.** IP first (sf, kBtu, therms, gallons, Mlb); SI toggle secondary. The site is US-market; kBtu is the native unit of the LL84/ESPM workflow. v2 accepts the unit the bill is in, per source, and converts internally. (v1's all-kWh input with conversion hints is retired.)
- **Versioning.** Each tool page carries `v{n}` and a changelog anchor.
- **Lead capture.** Calculation is free and unrestricted. The formatted PDF (result, method, assumptions, `rulesetHash`, Papilio letterhead) requires an email. No gate before a number appears on screen.
- **Liability.** Every tool states it is a first-pass estimate, not a filed report, and that filing requires a Registered Design Professional. v1 wording is reused verbatim.

---

## 2. SPEC A — LL97 v2

### 2.1 Purpose

Let an owner or investor establish, in under two minutes and without a consultant, whether a NYC building is over its emissions cap for 2024–2029 and 2030–2034, and what the annual and cumulative penalty exposure is.

### 2.2 Coverage pre-check

Before any calculation, a three-question qualifier:

1. Single building > 25,000 gsf, or
2. Two or more buildings on the same tax lot together > 50,000 gsf, or
3. Two or more condominium buildings under the same board of managers together > 50,000 gsf

If none: state that the building is likely **not a covered building** under Article 320 and stop. Note that Article 321 (rent-regulated and certain affordable housing) has a separate prescriptive path.

Then a **Reporting year** field — CY2024, CY2025, CY2026+. It determines the permitted basis:

- CY2024 / CY2025 → user chooses ESPM or occupancy group (one, not both).
- CY2026+ → ESPM only; the occupancy selector is not rendered.

This is how the legacy basis survives without a separate maintained mode.

### 2.3 Inputs

**Spaces** — repeatable rows, minimum one. This is the headline v2 feature: mixed-use is the common real case and v1 cannot express it.

| Field | Type | Notes |
|---|---|---|
| ESPM property type | searchable select (~60) | `Other` and `Mixed Use` are excluded by rule — selecting either blocks with an explanation *(verify exclusion list against §103-14)* |
| Gross floor area | number + unit | sf / m² |

**Energy consumption** — annual, whole-building, per source, each with a native-unit selector:

| Source | Native units offered |
|---|---|
| Utility electricity | kWh, kBtu |
| Natural gas | therms, CCF, kBtu |
| District steam | Mlb, kBtu |
| Fuel oil #2 | gallons, kBtu |
| Fuel oil #4 | gallons, kBtu |
| Fuel oil #1 / #5 / #6, kerosene, propane, district chilled water | per rule table |

Consumption is **not** entered or allocated per space. LL97 compares whole-building emissions to an area-weighted limit; allocation is neither required nor meaningful for compliance.

### 2.4 Model

```
limit(period)      = Σ_spaces  area_i × factor(propertyType_i | occupancyGroup_i, period, filingYear)
emissions(period)  = Σ_sources consumption_j,kBtu × coefficient(source_j, period)
excess(period)     = max(0, emissions − limit)
penalty(period)    = excess × 268                              # $/tCO2e/yr, §28-320.6
cumulative(period) = penalty × remainingYears(period, now)     # undiscounted; assumption stated
```

Coefficients are **period-dependent**. v1 already implements this for electricity (`0.000288962` → `0.000145` tCO2e/kWh); v2 keeps the split, sources it from `ll97-coefficients.v1.json`, and pins it with golden G2.

### 2.5 Outputs

1. **Verdict per period** — Under / Over, margin in tCO2e and as % of limit.
2. **Annual penalty** per period at $268/tCO2e.
3. **Cumulative exposure** through 2034 — the number that moves an owner. Assumption (undiscounted, from current year, consumption flat) stated inline.
4. **Source contribution breakdown** — share of emissions per fuel, both periods. This is where the retrofit conversation starts.
5. **Per-space limit contribution** for mixed-use — how much of the cap each space earns.
6. **Basis divergence** (CY2024/25 only) — if the user could have filed under the other basis, show both limits and the delta.
7. **PDF export** — email-gated (§6.4).

### 2.6 Out of scope in v2 — stated in the Method block

RECs (electricity only), §28-320.7 temporary adjustments under Rule 103-12, Article 321 prescriptive path, DER carve-outs, GHG offsets, clean distributed energy, any period beyond 2034.

**Required UI note:** *"If DOB has granted your building an adjustment to its emissions limit, the limit shown here will not match your filed limit."* An owner with an approved adjustment who sees a different number will otherwise conclude the tool is wrong.

### 2.7 Acceptance criteria

- Mixed-use with three spaces of different ESPM types returns the correctly area-weighted limit (G3).
- Same building under occupancy vs ESPM for CY2025 returns both, with the divergence explained (G4).
- Electricity coefficient differs between periods in the output (G2).
- Every displayed constant traces to a `sources` entry; the Method block is generated from `Result.sources`, not hand-written.
- Zero-consumption sources are ignored (G6).
- Reporting year CY2026+ renders no occupancy selector.
- PDF carries `rulesetHash`.

---

## 3. SPEC B — LL33 v1

### 3.1 Purpose

Two audiences, one page. The owner who wants to know the grade before DOB posts it in October; the buyer who sees a D on a lobby door and wants to know what it implies.

### 3.2 Why this is worth building

The LL33 grade is *assigned* by DOB from the ENERGY STAR score, which comes from LL84 benchmarking. A naive "LL33 calculator" is a lookup table. The value is in what DOB does not give you:

1. The score-to-grade conversion run **forward** — "if I get to 71, I'm a B"
2. The **gap** — how much reduction moves the grade
3. The **interpretation** — what a grade signals about LL97 exposure and resale

### 3.3 Mode 1 — Score to grade (deterministic, exact)

Input: ENERGY STAR score 1–100. Output: letter per §28-309.12 as amended by LL95 of 2019.

| Grade | Condition |
|---|---|
| A | score ≥ 85 |
| B | 70 ≤ score < 85 |
| C | 55 ≤ score < 70 |
| D | score < 55 |
| F | required benchmarking not submitted |
| N | exempt from benchmarking, or not covered by ENERGY STAR |

Exact. Standard disclaimer only. Pinned by golden G8.

### 3.4 Mode 2 — Estimated score from consumption (modelled)

Input: gross floor area, annual consumption by source, and the property-type-specific operating characteristics the ESPM model requires (Multifamily Housing: units, bedrooms, HDD/CDD, etc.).

Output: estimated source EUI and estimated 1–100 score, **prominently labelled an estimate**, with the DOB-issued grade named as the only authoritative value.

Scope: **Multifamily Housing only** in v1 (decision §5c). Office follows once Multifamily has been validated against real DOB-issued grades. Other property types are gated: *"not yet supported — contact us."*

**Threshold contract** (calc-core, not UI):

```ts
type ScoreEstimate = {
  score: number;
  predictionInterval: [number, number];   // e.g. 90% PI from the regression residuals
  grade: Grade;
  bandCrossesThreshold: boolean;          // PI straddles 55, 70, or 85
  modelVersion: string;                    // EPA score model year — pin it
};
```

When `bandCrossesThreshold` is true, the UI shows the two possible letters and says so. It never commits to one. An estimate that lands a grade boundary wrong is worse than no estimate.

EPA recalibrates score models (e.g. the CBECS-based updates). `modelVersion` is pinned in the ruleset and shown in the Method block.

### 3.5 Mode 3 — Gap to next grade

Given current score and target grade:

- Points needed
- Approximate source EUI reduction required, in % and kBtu/sf/yr
- Total annual kBtu to remove
- Rough annual utility cost at user-supplied or default NYC rates

Framed as a target, not a recommendation: *"reaching a B requires roughly a 12% reduction in source EUI."* Specific measures are the advisory conversation. That restraint is the CTA.

### 3.6 Compliance calendar block (static, high SEO value)

- Benchmark energy and water annually by **May 1**
- DOB issues the Building Energy Efficiency Rating label on **October 1**
- Label posted within 30 days — by **October 31** — near **each** public entrance, displayed until the following October 1
- Multiple public entrances require multiple copies
- Failure to post: **$1,250** violation *(verify current amount)*
- Late or missing benchmarking: automatic **F**

LL95 of 2019 amended the original LL33 of 2018 thresholds. Placards printed before that amendment may be non-compliant even where the letter is right — a checkable diligence item.

### 3.7 Cross-link to LL97

On a C or D result, surface `/tools/ll97` with the caveat stated honestly: a low grade is correlated with LL97 exposure (same benchmarking data) but is not a formal predictor. Do not overclaim.

---

## 4. Build order (revised)

| # | Work | Why here |
|---|---|---|
| 1 | `calc-core` scaffold: `units/`, `result.ts`, rulesets dir, golden harness with G1–G9 | Everything else depends on it; G1 pins current v1 behaviour before anything moves |
| 2 | **LL33 Mode 1 + Mode 3 + calendar block** at `/tools/ll33` | Days of work, zero modelling risk, immediate SEO surface ("LL33 October 1 label"), second lead-gen flow live before the first is rebuilt |
| 3 | **LL97 v2** ESPM rebuild, multi-space, reporting-year gating, native units, cumulative exposure, PDF | The main event; replaces v1 at `/tools/ll97` on merge (decision a). Goldens G1–G9 green is the release gate. |
| 4 | LL33 Mode 2, Multifamily only, labelled beta | Highest modelling risk; benefits from Mode 1/3 usage data first |
| 5 | Portfolio view — CSV in, table out | Separate spec. Bridge to BFY-Diagnostics and the natural upsell to multi-building owners |

Rev 1's "fix the electricity coefficient first" step is removed — already correct in v1 (see changelog).

---

## 5. Decisions (confirmed 2026-09-05)

Confirmed by the owner. **a, c, d, f** were chosen among alternatives; **b, e, g, h** had no alternative raised and stand as written.

| # | Question | Decision |
|---|---|---|
| a | Route for v2 | **Direct replacement.** v2 ships at `/tools/ll97` on merge; no preview route, no legacy route. The Reporting-year field covers CY2024/25. The release gate is goldens G1–G9 green plus a manual pass on the three acceptance scenarios in §2.7. |
| b | Multi-space consumption | Not allocated. Whole-building comparison per statute. Per-space output = limit contribution only. |
| c | LL33 Mode 2 scope | Multifamily Housing only. Office deferred until Multifamily estimates are validated against ≥10 real DOB-issued grades. |
| d | PDF + lead capture | Server-side PDF (`@react-pdf/renderer` in a route handler), sent via **Resend** with a copy to Alexandre. Requires `RESEND_API_KEY` on Vercel. |
| e | Language | English. |
| f | Calculation runtime | **Server-side** (Vercel Edge/route handler). Keeps the engine — shared with BFY-Diagnostics — out of the client bundle; free telemetry; sub-100 ms. |
| g | ESPM limits table sourcing | Vendored JSON transcribed from the DOB rule text; no first-party machine-readable source exists. Guarded by the audit script in §6.1. |
| h | Address / BBL lookup | Deferred to v2.1. PLUTO gives floor area and a building class that maps *coarsely* to a suggested ESPM type (e.g. O-class → Office; C/D-class → Multifamily Housing — verify mapping). Useful as a pre-fill suggestion, not as authoritative input. |

---

## 6. Operations & delivery

### 6.1 Limits-table audit

`pnpm audit:rulesets` downloads each `sourceUrl` in `calc-core/rulesets/*.json`, hashes it, and fails if the hash differs from `sourceSha256`. Runs weekly in CI and on every PR touching `rulesets/`. A failure means DOB changed the document — a human re-transcribes, bumps the ruleset version, and adds a golden for whatever moved. The tool never silently drifts from the rule.

### 6.2 Telemetry

Vercel Analytics custom events, no PII:

- `ll97_check_run` — with `basis`, `filingYear`, `spaceCount`, `overCap2029`, `overCap2030`
- `ll97_pdf_requested`
- `ll33_grade_lookup` — with `grade`
- `ll33_gap_run` — with `fromGrade`, `toGrade`
- `tool_cta_discovery_call` — with `tool`, `verdict`

These answer "where do people drop" and "which verdicts convert to calls".

### 6.3 Routes and sunset

| Route | Status |
|---|---|
| `/tools/ll97` | v1 until the v2 merge; then v2 (direct replacement, decision a) |
| `/tools/ll33` | new |
| `/tools` | new index page listing both tools — small SEO hub |

### 6.4 Lead capture flow

1. Result renders in full, no gate.
2. "Get this as a PDF" → email field (single input, no name required).
3. Route handler: generate PDF, send via Resend to user, cc Alexandre with the inputs and verdict in the email body.
4. Confirmation inline. No account, no follow-up sequence in v1.

### 6.5 Environment

- `RESEND_API_KEY` — Vercel env, production + preview
- No other secrets. Rulesets are public data.

---

## 7. Sources to verify before implementation

- **1 RCNY §103-14** — current consolidated text: ESPM property-type limits by period, exclusion of `Other`/`Mixed Use`, all emissions coefficients by period, CY2024/25 transition language
- **NYC Admin Code §28-320.1** — covered-building thresholds (inclusive vs exclusive at 25,000 / 50,000 gsf)
- **§28-320.3.1 / §28-320.3.2** — statutory occupancy-group limits (CY2024/25 basis)
- **§28-320.6** — penalty rate
- **§28-320.7** and Rule 103-12 — adjustments (out of scope, but the UI note in §2.6 depends on their existence)
- **§28-309.12** as amended by LL95 of 2019 — LL33 thresholds, display requirements, violation amount
- **DOB service notice** on the CY2026 ESPM-only transition
- **EPA ENERGY STAR score technical reference — Multifamily Housing** — regression coefficients and residual distribution for Mode 2's prediction interval

No constant in this document is implemented without checking it against the primary source at build time. The rule has been amended twice already.
