"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/* Re-renders the page from the server on an interval while something is pending. */
export function AutoRefresh({ every = 10_000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}
