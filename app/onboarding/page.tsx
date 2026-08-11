"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const SCORING_SERVICE_URL =
  process.env.NEXT_PUBLIC_SCORING_SERVICE_URL || "http://localhost:8000";

const ROLES = [
  { value: "OFFICER", label: "Loan Officer", desc: "Submit and score loans" },
  { value: "AUDITOR", label: "Auditor", desc: "Review all scored loans" },
  { value: "ADMIN", label: "Admin", desc: "Full access, manage users" },
];

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [institution, setInstitution] = useState("");
  const [role, setRole] = useState("OFFICER");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    await fetch(`${SCORING_SERVICE_URL}/users/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || "",
        institution,
        role,
      }),
    });

    router.push("/dashboard");
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-xl font-semibold mb-2">Complete your profile</h1>
      <p className="text-sm text-gray-600 mb-6">
        Tell us a bit about your role so we can set up the right access.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
          <input
            type="text"
            required
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="e.g. Equity Bank"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`flex items-start gap-3 border rounded-md p-3 cursor-pointer ${
                  role === r.value ? "border-green-600 bg-green-50" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => setRole(r.value)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{r.label}</div>
                  <div className="text-xs text-gray-500">{r.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white py-2.5 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Continue to Dashboard"}
        </button>
      </form>
    </div>
  );
}