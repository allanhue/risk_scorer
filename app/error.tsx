"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Something went wrong</h1>
      <p className="text-sm text-gray-600 mb-4">
        An unexpected error occurred. You can try again, or refresh the page.
      </p>
      <button
        onClick={reset}
        className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800"
      >
        Try again
      </button>
    </div>
  );
}