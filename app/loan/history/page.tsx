"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { LoanHistoryItem } from "@/lib/types";
import { getLoanHistory } from "@/lib/api";
import { ChevronLeft, ChevronRight, FileDown, Leaf } from "lucide-react";

const RISK_BADGE: Record<string, string> = {
  low: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

const SCORING_SERVICE_URL =
  process.env.NEXT_PUBLIC_SCORING_SERVICE_URL || "http://localhost:8000";

const PAGE_SIZE = 5;

export default function LoanHistory({ refreshTrigger }: { refreshTrigger?: number }) {
  const { user } = useUser();
  const [loans, setLoans] = useState<LoanHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getLoanHistory(user.id, page, PAGE_SIZE)
      .then((res) => {
        setLoans(res.items);
        setTotal(res.total);
      })
      .catch(() => {
        setLoans([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [user?.id, page, refreshTrigger]);

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      setPage(1);
    }
  }, [refreshTrigger]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (loading) {
    return <p className="text-sm text-gray-500 mt-8">Loading history...</p>;
  }

  if (loans.length === 0) {
    return <p className="text-sm text-gray-500 mt-8">No loans scored yet.</p>;
  }

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Loan History</h2>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
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
    </div>
  );
}