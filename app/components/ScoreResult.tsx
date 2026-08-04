import { ScoreResponse } from "@/lib/types";

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-50 text-green-800 border-green-200",
  medium: "bg-yellow-50 text-yellow-800 border-yellow-200",
  high: "bg-red-50 text-red-800 border-red-200",
};

const CLIMATE_LABELS: Record<string, { label: string; color: string }> = {
  drought_risk: { label: "Drought signal active", color: "text-amber-700 bg-amber-50 border-amber-200" },
  flood_risk: { label: "Flood signal active", color: "text-blue-700 bg-blue-50 border-blue-200" },
  normal: { label: "Rainfall normal", color: "text-gray-700 bg-gray-50 border-gray-200" },
  unknown: { label: "Live data unavailable", color: "text-gray-500 bg-gray-50 border-gray-200" },
};

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
      <path d="M5 19c6.5-2 10-6.5 13-13 0 0 1.5 4.5-3 8.5-3.5 2.5-7 3.5-10 4.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 16c1.2-1.2 2.8-2 4.5-2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function ScoreResult({ result }: { result: ScoreResponse }) {
  const climate = CLIMATE_LABELS[result.climateSignal?.status || "unknown"];

  return (
    <div className={`mt-6 p-5 rounded-lg border ${RISK_COLORS[result.riskLevel]}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold uppercase text-sm">{result.riskLevel} risk</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          <LeafIcon />
          {result.isGreen ? "Green-aligned" : "Not green-aligned"}
        </span>
      </div>

      <p className="text-sm mb-3">{result.explanation}</p>

      <div className="flex items-center justify-between text-xs">
        <span className="opacity-70">Confidence: {(result.confidence * 100).toFixed(0)}%</span>

        <span className={`px-2 py-1 rounded-full border font-medium ${climate.color}`}>
          {climate.label}
          {result.climateSignal?.anomaly_pct !== null &&
            result.climateSignal?.anomaly_pct !== undefined &&
            ` · ${result.climateSignal.anomaly_pct > 0 ? "+" : ""}${result.climateSignal.anomaly_pct}%`}
        </span>
      </div>
    </div>
  );
}