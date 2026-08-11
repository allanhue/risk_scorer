"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

const SCORING_SERVICE_URL =
  process.env.NEXT_PUBLIC_SCORING_SERVICE_URL || "http://localhost:8000";

const SECTORS = ["energy", "agriculture", "manufacturing", "transport", "construction"];
const COUNTIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Turkana"];

export default function DemoPage() {
  const [form, setForm] = useState({ loanAmount: 0, purpose: "", county: "", sector: "" });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${SCORING_SERVICE_URL}/score/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 429) {
        setError("You've hit the demo limit for now — try again in a minute, or create a free account for unlimited use.");
        return;
      }
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="text-center mb-8">
        <span className="inline-block bg-green-50 text-green-800 text-xs font-medium px-3 py-1 rounded-full border border-green-200 mb-3">
          Demo mode - no signup required
        </span>
        <h1 className="text-2xl font-semibold text-gray-900">Try the Green Taxonomy Scorer</h1>
        <p className="text-sm text-gray-600 mt-2">
          See a real green-alignment and climate risk score in seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (KES)</label>
          <input
            type="number"
            required
            value={form.loanAmount || ""}
            onChange={(e) => setForm({ ...form, loanAmount: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
          <input
            type="text"
            required
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            placeholder="e.g. Solar irrigation pump purchase"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
            <select
              required
              value={form.county}
              onChange={(e) => setForm({ ...form, county: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">Select county</option>
              {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
            <select
              required
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">Select sector</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white py-2.5 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? "Scoring..." : "Score This Loan"}
        </button>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        )}
      </form>

      {result && (
        <div className="mt-6 p-5 rounded-lg border bg-white">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold uppercase text-sm">{result.riskLevel} risk</span>
            <span className="text-sm">{result.isGreen ? "🌱 Green-aligned" : "Not green-aligned"}</span>
          </div>
          <p className="text-sm mb-4">{result.explanation}</p>

          <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
            <p className="text-sm text-green-900 font-medium mb-2">
              Create a free account to save this report, remove the watermark and access your full loan history.
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800"
            >
              Create free account
            </Link>

            <a
              href={`${SCORING_SERVICE_URL}/report/${result.loanId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center mt-4 text-sm text-gray-600 hover:underline"
            >
              Download sample PDF (watermarked)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}