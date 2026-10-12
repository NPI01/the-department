import { cacheLife } from "next/cache";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";

/* Player-facing documents served from the canon copy in Supabase. Only the
   paths listed here can be served; nothing secret is reachable. Editorial
   material is stripped: the draft note at the top, sections addressed to
   Nathan or to engine work, CHANGELOG lines and [PROPOSED] markers. */

export const PUBLIC_DOCS = {
  rules: "docs/rulebook-draft.md",
  guide: "docs/field-guide-draft.md",
} as const;

export function forPlayers(md: string) {
  const out: string[] = [];
  let skipping = false;
  let lead = true; // drop the opening blockquote (the note to Nathan)
  for (const line of md.split("\n")) {
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) skipping = /^(for nathan|engine work)/i.test(h[2]);
    if (skipping) continue;
    if (lead && line.startsWith(">")) continue;
    if (lead && line.trim() && !line.startsWith("#") && !line.startsWith(">")) lead = false;
    if (/^CHANGELOG:/.test(line)) continue;
    out.push(line);
  }
  return out.join("\n")
    .replace(/\s*\*{0,2}\[PROPOSED[^\]]*\]\*{0,2}/g, "")
    .replace(/\s*\(PROPOSED[^)]*\)/g, "")
    .replace(/\n-{3,}\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function publicDoc(key: keyof typeof PUBLIC_DOCS) {
  "use cache";
  cacheLife("minutes");
  if (!supabaseConfigured()) return null;
  const { data } = await supabaseAdmin().from("canon_docs").select("title, content, synced_at").eq("path", PUBLIC_DOCS[key]).maybeSingle();
  if (!data) return null;
  const body = forPlayers(data.content as string).replace(/^#\s+.+\n/, "");
  return { title: data.title as string, body, syncedAt: data.synced_at as string };
}
