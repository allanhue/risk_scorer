"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { LoanInput, ScoreResponse } from "@/lib/types";
import { scoreLoan } from "@/lib/api";
import ScoreResult from "@/scores/results/page";
import Select from "@/components/select";
import Autocomplete from "@/components/autocomplete";
import Spinner from "@/components/spinner";
import { Sparkles } from "lucide-react";

const SECTORS = ["energy", "agriculture", "manufacturing", "transport", "construction"];
const COUNTIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Turkana"];
const CURRENCIES = ["KES", "USD", "EUR", "GBP", "UGX", "TZS"];

// Suggested purposes per sector — feeds the datalist for quick, guided entry
const PURPOSE_SUGGESTIONS: Record<string, string[]> = {
  energy: ["Solar mini-grid installation", "Wind turbine purchase", "Geothermal drilling", "Clean cooking stoves"],
  agriculture: ["Drip irrigation system", "Agroforestry expansion", "Climate-smart seed purchase", "Conservation tillage equipment"],
  transport: ["Electric vehicle purchase", "Public transit fleet upgrade"],
  construction: ["Green building certification", "Energy-efficient retrofit"],
  manufacturing: ["Resource efficiency upgrade", "Waste reduction system"],
};

export default function LoanForm({ onScored }: { onScored?: () => void }) {
  const { user } = useUser();
  const [form, setForm] = useState<LoanInput>({
    loanAmount: 0,
    currency: "KES",
    purpose: "",
    description: "",
    county: "",
    sector: "",
  });
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const score = await scoreLoan({
        ...form,
        userId: user?.id,
        userEmail: user?.primaryEmailAddress?.emailAddress,
      } as any);
      setResult(score);
      onScored?.();
    } catch {
      setError("Something went wrong scoring this loan. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const purposeSuggestions = form.sector ? PURPOSE_SUGGESTIONS[form.sector] || [] : [];

  return (
    <div className="max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-7 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Loan Amount</label>
            <input
              type="number"
              required
              min={0}
              value={form.loanAmount || ""}
              onChange={(e) => setForm({ ...form, loanAmount: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 hover:border-gray-400"
            />
          </div>
          <Select
            label="Currency"
            value={form.currency}
            onChange={(v) => setForm({ ...form, currency: v })}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
        </div>

        <div>
          <Select
            label="Sector"
            value={form.sector}
            onChange={(v) => setForm({ ...form, sector: v, purpose: "" })}
            options={SECTORS.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          />
        </div>

        <div>
          <Autocomplete
            label="Purpose"
            value={form.purpose}
            onChange={(v) => setForm({ ...form, purpose: v })}
            suggestions={purposeSuggestions}
            placeholder={form.sector ? "Start typing or pick a suggestion..." : "Select a sector first for suggestions"}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Additional Details <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Any extra context that helps clarify the green classification — equipment specs, certifications, project scale, etc."
            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 hover:border-gray-400 resize-none"
          />
        </div>

        <Select
          label="County"
          value={form.county}
          onChange={(v) => setForm({ ...form, county: v })}
          options={COUNTIES.map((c) => ({ value: c, label: c }))}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-green-700 text-white py-3 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition shadow-sm"
        >
          {loading ? (
            <>
              <Spinner size={16} />
              Scoring...
            </>
          ) : (
            "Score Loan"
          )}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {result && <ScoreResult result={result} />}
    </div>
  );
}