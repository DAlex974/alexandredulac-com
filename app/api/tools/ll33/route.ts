/**
 * LL33 calculation endpoint. Runs calc-core server-side (decision f):
 * the engine stays out of the client bundle and every call is countable.
 */

import { NextResponse } from "next/server";
import { gapToGrade, resolveGrade, type GradeInput, type TargetGrade } from "@papilio/calc-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body =
  | { mode: "grade"; status: "score" | "not_submitted" | "exempt"; score?: number; reportYear?: number }
  | {
      mode: "gap";
      currentScore: number;
      targetGrade: TargetGrade;
      reportYear?: number;
      propertyType?: string;
      currentSourceEuiKbtuPerSf?: number;
      grossFloorAreaSqft?: number;
      annualUtilitySpendUsd?: number;
    };

const TARGETS: TargetGrade[] = ["A", "B", "C"];

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return bad("Invalid JSON body.");
  }

  const reportYear = num((body as { reportYear?: unknown }).reportYear) ?? new Date().getUTCFullYear();

  try {
    if (body.mode === "grade") {
      let input: GradeInput;
      if (body.status === "score") {
        const score = num(body.score);
        if (score === undefined) return bad("A numeric ENERGY STAR score is required.");
        input = { kind: "score", score };
      } else if (body.status === "not_submitted") {
        input = { kind: "not_submitted" };
      } else if (body.status === "exempt") {
        input = { kind: "exempt" };
      } else {
        return bad("Unknown status.");
      }
      return NextResponse.json(resolveGrade({ ...input, reportYear }));
    }

    if (body.mode === "gap") {
      const currentScore = num(body.currentScore);
      if (currentScore === undefined) return bad("A numeric current score is required.");
      if (!TARGETS.includes(body.targetGrade)) return bad("Target grade must be A, B, or C.");
      return NextResponse.json(
        gapToGrade({
          currentScore,
          targetGrade: body.targetGrade,
          reportYear,
          propertyType: body.propertyType || undefined,
          currentSourceEuiKbtuPerSf: num(body.currentSourceEuiKbtuPerSf),
          grossFloorAreaSqft: num(body.grossFloorAreaSqft),
          annualUtilitySpendUsd: num(body.annualUtilitySpendUsd),
        }),
      );
    }

    return bad("Unknown mode.");
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Calculation failed.");
  }
}
