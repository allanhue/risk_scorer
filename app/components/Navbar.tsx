"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const SCORING_SERVICE_URL =
  process.env.NEXT_PUBLIC_SCORING_SERVICE_URL || "http://localhost:8000";

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { isLoaded } = useAuth();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${SCORING_SERVICE_URL}/users/${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRole(data?.role || null))
      .catch(() => setRole(null));
  }, [user?.id]);

  const LINKS = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    ...(role === "AUDITOR" || role === "ADMIN"
      ? [{ href: "/audit", label: "Audit View" }]
      : []),
  ];

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-green-800">
          Green Taxonomy Scorer
        </Link>

        <div className="flex items-center gap-6 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "text-green-700 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }
            >
              {link.label}
            </Link>
          ))}

          {!isLoaded || !user ? (
            <Link
              href="/auth/login"
              className="border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50"
            >
              Sign in
            </Link>
          ) : (
            <UserButton afterSignOutUrl="/" />
          )}
        </div>
      </div>
    </nav>
  );
}