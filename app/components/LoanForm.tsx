"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { LoanInput, ScoreResponse } from "@/lib/types";
import { scoreLoan } from "@/lib/api";
import ScoreResult from "./ScoreResult";

const SECTORS = [
  "energy",
  "agriculture",
  "manufacturing",
  "transport",
  "construction",
];
const COUNTIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Turkana"];

export default function LoanForm() {
  const { user } = useUser();
  const [form, setForm] = useState<LoanInput>({
    loanAmount: 0,
    purpose: "",
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
    } catch {
      setError("Something went wrong scoring this loan. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Loan Amount (KES)
          </label>
          <input
            type="number"
            required
            value={form.loanAmount || ""}
            onChange={(e) => setForm({ ...form, loanAmount: Number(e.target.value) })}
            className={fieldClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Purpose
          </label>
          <input
            type="text"
            required
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            placeholder="e.g. Solar irrigation pump purchase"
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              County
            </label>
            <select
              required
              value={form.county}
              onChange={(e) => setForm({ ...form, county: e.target.value })}
              className={fieldClass}
            >
              <option value="">Select county</option>
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Sector
            </label>
            <select
              required
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
              className={fieldClass}
            >
              <option value="">Select sector</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-emerald-700 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {loading ? "Scoring..." : "Score Loan"}
        </button>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      </form>

      <div className="min-h-72 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {result ? (
          <ScoreResult result={result} />
        ) : (
          <div className="flex h-full min-h-64 flex-col justify-center">
            <p className="text-sm font-medium text-emerald-700">
              Awaiting loan details
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Your score will appear here
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              Enter the loan amount, purpose, county, and sector to generate a
              risk level, alignment status, confidence score, and explanation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
