/* The showrunner's review decisions that are not yet reflected in the text,
   as a worklist for whoever edits canon next (usually a Claude session).
     pnpm canon:decisions            writes docs/review-decisions.md
   After the edits are committed and synced, applied items drop out (their text
   is gone from the doc), so the list shrinks to what is still outstanding. */
import { config as loadEnv } from "dotenv";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(import.meta.dirname, "..");
loadEnv({ path: join(ROOT, ".env.local"), quiet: true });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

type Row = { doc_path: string; kind: string; heading: string | null; text: string; line: number | null; status: string; note: string | null; decided_at: string | null };
const ACTION: Record<string, string> = {
  approved: "Approved. Make it canon: remove the PROPOSED marker (for a whole document, its header line) and keep the text.",
  rejected: "Rejected. Remove it, or replace it with an open TBD if the gap still needs filling.",
  revise: "Revise as the note says, then leave it PROPOSED for another look.",
  answered: "Answered. Apply the answer to the rule(s) it concerns and remove the question.",
};

db.from("proposals").select("doc_path, kind, heading, text, line, status, note, decided_at").eq("present", true).neq("status", "open").order("doc_path").order("line").then(({ data, error }) => {
  if (error) { console.error("✗", error.message); process.exit(1); }
  const rows = (data ?? []) as Row[];
  const docs = [...new Set(rows.map((r) => r.doc_path))];
  const md = [
    "# Review decisions to apply",
    "",
    `Generated ${new Date().toISOString()} from the showrunner console. ${rows.length} decision(s) not yet reflected in the text.`,
    "Apply each, commit, and run `pnpm canon:sync`; applied items drop off this list.",
    "",
    ...docs.flatMap((d) => [
      `## ${d}`,
      "",
      ...rows.filter((r) => r.doc_path === d).flatMap((r) => [
        `### line ${r.line ?? "?"} · ${r.kind} · ${r.status.toUpperCase()}${r.heading ? ` · ${r.heading}` : ""}`,
        "",
        ACTION[r.status] ?? r.status,
        ...(r.note ? ["", `**Note:** ${r.note}`] : []),
        "",
        "```",
        r.text,
        "```",
        "",
      ]),
    ]),
  ].join("\n");
  writeFileSync(join(ROOT, "docs/review-decisions.md"), md);
  console.log(`✓ docs/review-decisions.md: ${rows.length} decision(s) across ${docs.length} doc(s)`);
});
