import type { Metadata } from "next";
import { publicDoc } from "@/lib/public/docs";
import { Markdown } from "@/lib/canon/render";
import { PublicShell } from "../_public-shell";

export const metadata: Metadata = { title: "Rulebook · The Department", description: "How The Department plays: rounds, orders, correspondence, committees and evidence." };

export default async function RulesPage() {
  const doc = await publicDoc("rules");
  return (
    <PublicShell kicker="Rules of employment" title="Rulebook" banner="Pilot rules, still in draft. Details and numbers will change before and during the pilot; your dispatch always reflects the rules in force.">
      {doc ? <div className="type text-[15px]"><Markdown md={doc.body} /></div> : <p>The rulebook is being typed. Check back shortly.</p>}
    </PublicShell>
  );
}
