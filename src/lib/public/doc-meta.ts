/* Player-facing document metadata and pure helpers. No server imports, so
   client components (the console editor) may import this. The cached loader
   lives in ./docs.ts. */

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

export type PublicDocKey = keyof typeof PUBLIC_DOCS;

export const DEFAULT_BANNER: Record<PublicDocKey, string | null> = {
  rules: "Pilot rules, still in draft. Details and numbers will change before and during the pilot; your dispatch always reflects the rules in force.",
  guide: null,
};

export const DOC_META: Record<PublicDocKey, { label: string; path: string; admin: string }> = {
  rules: { label: "Rulebook", path: "/rules", admin: "/admin/rulebook" },
  guide: { label: "Field Guide", path: "/guide", admin: "/admin/field-guide" },
};
export const isPublicDocKey = (k: unknown): k is PublicDocKey => typeof k === "string" && k in PUBLIC_DOCS;

export const publicDocTag = (key: PublicDocKey) => `public-doc:${key}`;

/* The repo draft as players would see it: no title line, editorial bits removed. */
export function draftForPlayers(content: string) {
  return forPlayers(content).replace(/^#\s+.+\n/, "");
}
