"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

const SCORING_SERVICE_URL =
  process.env.NEXT_PUBLIC_SCORING_SERVICE_URL || "http://localhost:8000";

export default function BackendStatusBanner() {
  const [isDown, setIsDown] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${SCORING_SERVICE_URL}/`, { signal: AbortSignal.timeout(5000) })
      .then((res) => {
        if (!cancelled) setIsDown(!res.ok);
      })
      .catch(() => {
        if (!cancelled) setIsDown(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isDown) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-6 py-2 flex items-center gap-2 justify-center">
      <WifiOff className="h-4 w-4" />
      Scoring service is unreachable right now — some features may not work. Try again shortly.
    </div>
  );
}