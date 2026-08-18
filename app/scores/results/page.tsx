"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { ElementType } from "react";
import { ScoreResponse } from "@/lib/types";
import { emailReport } from "@/lib/api";
import { Leaf, XCircle, AlertTriangle, ShieldCheck, ShieldAlert, CloudRain, Sun, CloudDrizzle, HelpCircle, Download, Mail } from "lucide-react";

const SCORING_SERVICE_URL =
  process.env.NEXT_PUBLIC_SCORING_SERVICE_URL || "http://localhost:8000";

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-50 text-green-800 border-green-200",
  medium: "bg-yellow-50 text-yellow-800 border-yellow-200",
  high: "bg-red-50 text-red-800 border-red-200",
};

const RISK_ICONS: Record<string, ElementType> = {
  low: ShieldCheck,
  medium: AlertTriangle,
  high: ShieldAlert,
};

const CLIMATE_META: Record<string, { label: string; color: string; icon: ElementType }> = {
  drought_risk: { label: "Drought signal active", color: "text-amber-700 bg-amber-50 border-amber-200", icon: Sun },
  flood_risk: { label: "Flood signal active", color: "text-blue-700 bg-blue-50 border-blue-200", icon: CloudRain },
  normal: { label: "Rainfall normal", color: "text-gray-700 bg-gray-50 border-gray-200", icon: CloudDrizzle },
  unknown: { label: "Live data unavailable", color: "text-gray-500 bg-gray-50 border-gray-200", icon: HelpCircle },
};

export default function ScoreResult({ result }: { result: ScoreResponse }) {
  const { user } = useUser();
  const [mailStatus, setMailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const riskKey = result.riskLevel?.toLowerCase() || "unknown";
  const climateKey = result.climateSignal?.status || "unknown";
  const climate = CLIMATE_META[climateKey] || CLIMATE_META.unknown;
  const RiskIcon = RISK_ICONS[riskKey] || ShieldAlert;
  const ClimateIcon = climate.icon;
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  async function handleEmailReport() {
    setMailStatus("sending");
    try {
      await emailReport(result.loanId, userEmail);
      setMailStatus("sent");
    } catch {
      setMailStatus("error");
    }
  }

  return (
    <div className={`mt-6 p-5 rounded-lg border ${RISK_COLORS[result.riskLevel]}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
        <div>
          <span className="flex items-center gap-1.5 font-semibold uppercase text-sm">
            <RiskIcon className="h-4 w-4" />
            {result.riskLevel} risk
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 mt-1">
            {result.isGreen ? (
              <Leaf className="h-4 w-4 text-green-700" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
            {result.isGreen ? "Green-aligned" : "Not green-aligned"}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={`${SCORING_SERVICE_URL}/report/${result.loanId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 text-sm font-medium border border-current px-4 py-2 rounded-md hover:bg-white/50 transition"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </a>
          <button
            type="button"
            onClick={handleEmailReport}
            disabled={mailStatus === "sending" || !userEmail}
            className="inline-flex items-center justify-center gap-2 text-sm font-medium border border-current px-4 py-2 rounded-md hover:bg-white/50 transition disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {mailStatus === "sending" ? "Sending..." : "Email PDF"}
          </button>
        </div>
      </div>

      <p className="text-sm mb-4">{result.explanation}</p>
      {mailStatus === "sent" && (
        <p className="text-sm mb-4 text-green-700">Report sent to {userEmail}.</p>
      )}
      {mailStatus === "error" && (
        <p className="text-sm mb-4 text-red-700">Could not email the report. Check the mail service settings.</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs">
        <span className="opacity-70">Confidence: {(result.confidence * 100).toFixed(0)}%</span>

        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border font-medium ${climate.color}`}>
          <ClimateIcon className="h-3.5 w-3.5" />
          {climate.label}
          {result.climateSignal?.anomaly_pct !== null &&
            result.climateSignal?.anomaly_pct !== undefined &&
            ` · ${result.climateSignal.anomaly_pct > 0 ? "+" : ""}${result.climateSignal.anomaly_pct}%`}
        </span>
      </div>
    </div>
  );
}
