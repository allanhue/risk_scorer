export interface LoanInput {
  loanAmount: number;
  purpose: string;
  county: string;
  sector: string;
  userId?: string;
  userEmail?: string;
}

export interface ScoreResponse {
  riskLevel: "low" | "medium" | "high";
  isGreen: boolean;
  confidence: number;
  explanation: string;
}
