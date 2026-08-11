"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AllLoansItem } from "@/lib/types";
import { getAllLoans } from "@/lib/api";
import Spinner from "@/components/spinner";
import { ChevronLeft, ChevronRight, FileDown, Leaf, ShieldAlert, Lock, Search } from "lucide-react";

const SCORING_SERVICE_URL =
  process.env.NEXT_PUBLIC_SCORING_SERVICE_URL || "http://localhost:8000";

const RISK_BADGE: Record<string, string> = {
  low: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

const PAGE_SIZE = 10;

export default function AuditPage() {
  const { user, isLoaded } = useUser();
  const [loans, setLoans] = useState<AllLoansItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [greenFilter, setGreenFilter] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setForbidden(false);

    const params = new URLSearchParams({
      requesterId: user.id,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (riskFilter) params.set("riskLevel", riskFilter);
    if (greenFilter) params.set("isGreen", greenFilter);

    fetch(`${SCORING_SERVICE_URL}/loans/all?${params.toString()}`)
      .then(async (res) => {
        if (res.status === 403) {
          setForbidden(true);
          return null;
        }
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data) {
          setLoans(data.items);
          setTotal(data.total);
        }
      })
      .catch(() => {
        setLoans([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [user?.id, page, search, riskFilter, greenFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center"> Please wait ...
        <Spinner />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <Lock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Restricted</h1>
        <p className="text-sm text-gray-600">
          This view is only available to Auditors and Admins. Contact your admin if you believe
          you should have access.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <ShieldAlert className="h-4 w-4" />
          Audit View
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          All Scored Loans
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Institution-wide view across all officers. Read-only.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search purpose, county, or sector..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <select
          value={riskFilter}
          onChange={(e) => {
            setRiskFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <option value="">All risk levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select
          value={greenFilter}
          onChange={(e) => {
            setGreenFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <option value="">Green + non-green</option>
          <option value="true">Green-aligned only</option>
          <option value="false">Not green-aligned only</option>
        </select>
      </div>

      {loans.length === 0 ? (
        <p className="text-sm text-gray-500">No loans have been scored yet.</p>
      ) : (
        <>
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Submitted By</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Sector</th>
                  <th className="px-4 py-2 font-medium">County</th>
                  <th className="px-4 py-2 font-medium">Risk</th>
                  <th className="px-4 py-2 font-medium">Green</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(loan.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{loan.submittedBy}</td>
                    <td className="px-4 py-3">KES {loan.loanAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 capitalize">{loan.sector}</td>
                    <td className="px-4 py-3">{loan.county}</td>
                    <td className="px-4 py-3">
                      {loan.riskLevel && (
                        <span
                          className={`px-2 py-0.5 rounded-full border text-xs font-medium ${RISK_BADGE[loan.riskLevel]}`}
                        >
                          {loan.riskLevel}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {loan.isGreen ? <Leaf className="h-4 w-4 text-green-600" /> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`${SCORING_SERVICE_URL}/report/${loan.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-green-700 text-xs font-medium hover:underline"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
            <span>
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}