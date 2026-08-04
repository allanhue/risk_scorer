"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  return (
    <nav className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold text-emerald-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-700 text-sm font-bold text-white">
            GT
          </span>
          <span className="text-base sm:text-lg">Green Taxonomy Scorer</span>
        </Link>

        <div className="flex items-center gap-2 text-sm sm:gap-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "rounded-md bg-emerald-50 px-3 py-2 font-medium text-emerald-800"
                  : "rounded-md px-3 py-2 font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }
            >
              {link.label}
            </Link>
          ))}

          {isSignedIn ? (
            <UserButton />
          ) : (
            <Link
              href="/auth/login"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm hover:border-emerald-300 hover:text-emerald-800"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
