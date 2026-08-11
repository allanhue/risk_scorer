import { LoanHistoryItem, LoanHistoryResponse, LoanInput, ScoreResponse, AllLoansResponse} from "./types";

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

export async function getAllLoans(
  requesterId: string,
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  riskLevel?: string,
  isGreen?: boolean
): Promise<AllLoansResponse> {
  const params = new URLSearchParams({
    requesterId,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search) params.set("search", search);
  if (riskLevel) params.set("riskLevel", riskLevel);
  if (isGreen !== undefined) params.set("isGreen", String(isGreen));

  const res = await fetch(`${SCORING_SERVICE_URL}/loans/all?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch loans");
  return res.json();
}