import { ScoreResponse } from "../lib/types";

const RISK_COLORS: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-800 border-emerald-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  high: "bg-red-50 text-red-800 border-red-200",
};

export default function ScoreResult({ result }: { result: ScoreResponse }) {
  const confidence = (result.confidence * 100).toFixed(0);

  return (
    <div className="space-y-5">
      <div className={`rounded-lg border p-5 ${RISK_COLORS[result.riskLevel]}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold uppercase tracking-wide">
            {result.riskLevel} risk
          </span>
          <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold">
            {result.isGreen ? "Green-aligned" : "Not green-aligned"}
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-slate-950">Score result</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {result.explanation}
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">Confidence</span>
          <span className="font-semibold text-slate-950">{confidence}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-emerald-600"
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
}
