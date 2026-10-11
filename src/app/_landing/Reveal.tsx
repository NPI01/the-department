"use client";
import { useEffect, useRef } from "react";

/* Adds .is-in when the element enters the viewport. Children can use
   .reveal / .reveal-wipe / .reveal-ink and .delay-N. */
export function Reveal({ children, className = "", as: Tag = "div", once = true, threshold = 0.18 }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "p" | "h2" | "li" | "figure"; once?: boolean; threshold?: number }) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { el.classList.add("is-in"); if (once) io.unobserve(el); }
        else if (!once) el.classList.remove("is-in");
      }
    }, { threshold, rootMargin: "0px 0px -8% 0px" });
    io.observe(el); return () => io.disconnect();
  }, [once, threshold]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const T = Tag as any;
  return <T ref={ref} className={className}>{children}</T>;
}
