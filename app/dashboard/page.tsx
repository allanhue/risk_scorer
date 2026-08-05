"use client";

import { useState } from "react";
import LoanForm from "@/loan/form/page";
import LoanHistory from "@/loan/history/page";

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="bg-[#f7faf8] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Loan Risk Scoring
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Submit loan details to get a green taxonomy classification and
            climate risk score.
          </p>
        </div>

        <LoanForm onScored={() => setRefreshKey((k) => k + 1)} />
        <LoanHistory refreshTrigger={refreshKey} />
      </div>
    </div>
  );
}