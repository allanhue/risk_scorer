import { LoanHistoryItem, LoanHistoryResponse, LoanInput, ScoreResponse } from "./types";

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

export async function getLoanHistory(
  userId: string,
  page: number = 1,
  pageSize: number = 5
): Promise<LoanHistoryResponse> {
  const res = await fetch(
    `${SCORING_SERVICE_URL}/loans?userId=${userId}&page=${page}&pageSize=${pageSize}`
  );
  if (!res.ok) throw new Error("Failed to fetch loan history");
  return res.json();
}