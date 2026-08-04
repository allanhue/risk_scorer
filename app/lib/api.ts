import { LoanInput, ScoreResponse } from "./types";

const SCORING_SERVICE_URL =
  process.env.NEXT_PUBLIC_SCORING_SERVICE_URL || "http://localhost:8000";

export async function scoreLoan(input: LoanInput): Promise<ScoreResponse> {
  const res = await fetch(`${SCORING_SERVICE_URL}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error("Failed to score loan");
  }

  return res.json();
}