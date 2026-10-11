/* Push canon/** and draft docs into Supabase so the showrunner console can read
   them, and record every proposal in them for review. Canon stays in git; this
   is a copy.
     pnpm canon:sync                 sync from the working tree
     tsx scripts/canon-sync.ts --if-production
                                     what the Vercel build runs: syncs only on a
                                     production build, and never fails the build */
import { config as loadEnv } from "dotenv";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { docTitle, findProposals, normalize } from "../src/lib/canon/markdown";

const ROOT = resolve(import.meta.dirname, "..");
loadEnv({ path: join(ROOT, ".env.local"), quiet: true });
const soft = process.argv.includes("--if-production");
if (soft && process.env.VERCEL && process.env.VERCEL_ENV !== "production") { console.log("canon-sync: not a production build, skipped"); process.exit(0); }

const sha = (s: string) => createHash("sha1").update(s).digest("hex");
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

/* Which files are reviewable canon, and their tier. READMEs are maps, not canon. */
function sources() {
  const canon = walk(join(ROOT, "canon")).filter((p) => p.endsWith(".md") && !/README\.md$/.test(p));
  const drafts = readdirSync(join(ROOT, "docs")).filter((f) => f.endsWith("-draft.md")).map((f) => join(ROOT, "docs", f));
  return [...canon, ...drafts].map((abs) => {
    const path = relative(ROOT, abs);
    return { path, tier: path.startsWith("canon/secret/") ? "secret" : path.startsWith("canon/") ? "public" : "draft", content: readFileSync(abs, "utf8") };
  });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  const db = createClient(url, key, { auth: { persistSession: false } });
  let gitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  if (!gitSha) { try { gitSha = execSync("git rev-parse HEAD", { cwd: ROOT }).toString().trim(); } catch { /* no git */ } }

  const docs = sources();
  const now = new Date().toISOString();
  const { error: e1 } = await db.from("canon_docs").upsert(docs.map((d) => ({ path: d.path, title: docTitle(d.content, d.path), tier: d.tier, content: d.content, sha: sha(d.content), git_sha: gitSha, synced_at: now })), { onConflict: "path" });
  if (e1) throw new Error(`canon_docs: ${e1.message}`);
  const paths = docs.map((d) => d.path);
  const { data: stale } = await db.from("canon_docs").select("path");
  const gone = (stale ?? []).map((r) => r.path as string).filter((p) => !paths.includes(p));
  if (gone.length) await db.from("canon_docs").delete().in("path", gone);

  const found = docs.flatMap((d) => findProposals(d.content).map((p) => ({ ...p, doc_path: d.path, key: sha(`${d.path}\n${p.kind}\n${normalize(p.text)}`) })));
  const keys = new Set(found.map((f) => f.key));
  // Upsert without touching decisions: only the location fields change on re-sync.
  for (let i = 0; i < found.length; i += 200) {
    const { error } = await db.from("proposals").upsert(found.slice(i, i + 200).map((f) => ({ key: f.key, doc_path: f.doc_path, kind: f.kind, heading: f.heading, text: f.text, line: f.line, present: true, last_seen_at: now })), { onConflict: "key" });
    if (error) throw new Error(`proposals: ${error.message}`);
  }
  const { data: present } = await db.from("proposals").select("id, key").eq("present", true);
  const vanished = (present ?? []).filter((r) => !keys.has(r.key as string)).map((r) => r.id as string);
  for (let i = 0; i < vanished.length; i += 200) await db.from("proposals").update({ present: false }).in("id", vanished.slice(i, i + 200));

  const byKind = found.reduce<Record<string, number>>((m, f) => ({ ...m, [f.kind]: (m[f.kind] ?? 0) + 1 }), {});
  console.log(`canon-sync: ${docs.length} docs, ${found.length} proposals in place (${Object.entries(byKind).map(([k, n]) => `${n} ${k}`).join(", ")}), ${vanished.length} no longer in the text${gitSha ? ` @ ${gitSha.slice(0, 7)}` : ""}`);
}

main().catch((e) => {
  console.error(`canon-sync: ${(e as Error).message}`);
  process.exit(soft ? 0 : 1);
});
