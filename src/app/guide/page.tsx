import type { Metadata } from "next";
import { publicDoc } from "@/lib/public/docs";
import { Markdown } from "@/lib/canon/render";
import { PublicShell } from "../_public-shell";

export const metadata: Metadata = { title: "Field Guide · The Department", description: "Gameplay tips for new employees of Royce Industries." };

export default async function GuidePage() {
  const doc = await publicDoc("guide");
  return (
    <PublicShell kicker="For new employees" title="Field Guide" banner={doc?.banner ?? undefined}>
      {doc ? <div className="type text-[15px]"><Markdown md={doc.body} /></div> : <p>The field guide is being typed. Check back shortly.</p>}
    </PublicShell>
  );
}
