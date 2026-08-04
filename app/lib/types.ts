export interface LoanInput {
  loanAmount: number;
  purpose: string;
  county: string;
  sector: string;
  userId?: string;
  userEmail?: string;
}


export interface ClimateSignal {
  status: "drought_risk" | "flood_risk" | "normal" | "unknown";
  anomaly_pct: number | null;
  recent_mm?: number;
}

export interface ScoreResponse {
  riskLevel: string;
  isGreen: boolean;
  confidence: number;
  explanation: string;
  climateSignal: ClimateSignal;
}