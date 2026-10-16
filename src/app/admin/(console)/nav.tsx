"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/schedule", label: "Season Schedule" },
  { href: "/admin/plans", label: "Episode Plans" },
  { href: "/admin/review", label: "Review" },
  { href: "/admin/mail", label: "Mail" },
  { href: "/admin/rulebook", label: "Rulebook" },
  { href: "/admin/field-guide", label: "Field Guide" },
  { href: "/admin/seasons", label: "Seasons & Episodes" },
  { href: "/admin/casting", label: "Casting Call" },
  { href: "/admin/players", label: "Players" },
  { href: "/admin/cohorts", label: "Cohorts" },
  { href: "/admin/world", label: "Overnight additions" },
  { href: "/admin/room", label: "Season log" },
  { href: "/admin/engine", label: "Engine Health" },
];

export function Nav() {
  const path = usePathname();
  return <NavList active={(href) => (href === "/admin" ? path === "/admin" : path.startsWith(href))} />;
}

export function NavList({ active = () => false }: { active?: (href: string) => boolean }) {
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:gap-0">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={`whitespace-nowrap border-l-2 px-3 py-1.5 text-sm ${active(n.href) ? "border-accent bg-paper-2 font-semibold" : "border-transparent text-ink-2 hover:text-ink"}`}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
