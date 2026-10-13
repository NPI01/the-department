/* Agent-team runner.
   pnpm agents <task-slug> [--model qwen/...] [--think]
   Reads agents/tasks/<slug>.md (the brief) and every file in canon/ (public canon;
   secret canon is passed only to archivist, rules_lawyer and skeptic).
   Pipeline: showrunner → writers in parallel → skeptic → archivist.
   Writes agents/out/<slug>/<timestamp>/ with every intermediate and a provenance.json,
   and agents/out/<slug>/latest.md with the archivist's canon document for review.
   Nothing is written into canon/ automatically; a human promotes it. */
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { chat, chatJson, type Msg, type LedgerRow } from "../src/lib/cobble";
import { ROLES, type RoleName } from "./roles";

const ROOT = resolve(import.meta.dirname, "..");
loadEnv({ path: join(ROOT, ".env.local") });
loadEnv({ path: join(ROOT, ".env") });

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const pinned = args.includes("--model") ? args[args.indexOf("--model") + 1] : undefined;
const forceThink = args.includes("--think");
// --resume <stamp>: reuse showrunner.json and draft-*.json from an earlier run
// folder and go straight to the Skeptic and Archivist.
const resumeStamp = args.includes("--resume") ? args[args.indexOf("--resume") + 1] : undefined;
if (!slug) { console.error("usage: pnpm agents <task-slug> [--model m] [--think]"); process.exit(2); }

const taskPath = join(ROOT, "agents/tasks", `${slug}.md`);
if (!existsSync(taskPath)) { console.error(`no task brief at ${taskPath}`); process.exit(2); }
const task = readFileSync(taskPath, "utf8");

function readDir(dir: string): { name: string; text: string }[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".md") && statSync(join(dir, f)).isFile()).sort()
    .map((f) => ({ name: f, text: readFileSync(join(dir, f), "utf8") }));
}
const publicCanon = readDir(join(ROOT, "canon"));
const secretCanon = readDir(join(ROOT, "canon/secret"));
const canonBlock = (files: { name: string; text: string }[], label: string) =>
  files.length ? `\n\n===== ${label} =====\n` + files.map((f) => `--- ${f.name} ---\n${f.text}`).join("\n\n") : "";

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = join(ROOT, "agents/out", slug, stamp);
mkdirSync(outDir, { recursive: true });
const ledger: LedgerRow[] = [];
const save = (name: string, data: unknown) => writeFileSync(join(outDir, name), typeof data === "string" ? data : JSON.stringify(data, null, 2));

async function ask(role: RoleName, user: string, opts: { secret?: boolean } = {}) {
  const r = ROLES[role];
  const canon = canonBlock(publicCanon, "PUBLIC CANON") + (opts.secret ? canonBlock(secretCanon, "SECRET CANON (engine only — never to players)") : "");
  const messages: Msg[] = [{ role: "system", content: r.system }, { role: "user", content: `${user}${canon}` }];
  const t0 = Date.now();
  process.stdout.write(`▶ ${r.title} … `);
  const common = { tag: role, think: forceThink || r.think, maxTokens: r.maxTokens, temperature: r.temperature, model: pinned, onLedger: (row: LedgerRow) => { ledger.push(row); } };
  if (role === "archivist") {
    const res = await chat(messages, common);
    console.log(`${res.model} ${((Date.now() - t0) / 1000).toFixed(0)}s ${res.usage?.total_tokens ?? "?"} tok`);
    save(`${role}.md`, res.text); return res.text;
  }
  const { data, result } = await chatJson<Record<string, unknown>>(messages, common);
  console.log(`${result.model} ${((Date.now() - t0) / 1000).toFixed(0)}s ${result.usage?.total_tokens ?? "?"} tok${data ? "" : "  (not JSON — prose kept for the Archivist)"}`);
  // A model that ignores JSON mode (measured: 35B-A3B on a long dossier brief)
  // still produced usable prose; it travels on to the Skeptic and Archivist.
  const out = data ?? { parse_failed: true, prose: result.text };
  save(`${role}-${Date.now()}.json`, out);
  return out;
}

type Brief = { role: RoleName; title: string; instructions: string; deliverable: string };
type Plan = { task_summary: string; canon_constraints: string[]; decisions: { question: string; recommendation: string; why: string }[]; briefs: Brief[] };

(async () => {
  console.log(`\nTHE DEPARTMENT · agent team · task "${slug}"\n`);
  let plan: Plan | null = null;
  let drafts: { brief: Brief; role: RoleName; out: unknown }[] = [];
  if (resumeStamp) {
    const prev = join(ROOT, "agents/out", slug, resumeStamp);
    plan = JSON.parse(readFileSync(join(prev, "showrunner.json"), "utf8")) as Plan;
    drafts = readdirSync(prev).filter((f) => /^draft-\d+-/.test(f)).sort().map((f) => {
      const i = Number(f.match(/^draft-(\d+)-/)![1]) - 1;
      const out = JSON.parse(readFileSync(join(prev, f), "utf8")) as Record<string, unknown>;
      return { brief: plan!.briefs[i], role: f.replace(/^draft-\d+-/, "").replace(/\.json$/, "") as RoleName, out };
    }).filter((d) => d.brief && Object.keys(d.out as object).length);
    console.log(`  resuming from ${resumeStamp}: ${plan.briefs.length} briefs, ${drafts.length} usable drafts`);
    save("showrunner.json", plan);
  } else {
    plan = (await ask("showrunner", `TASK BRIEF:\n${task}\n\nProduce the plan.`)) as Plan | null;
    if (!plan?.briefs?.length) { console.error("Showrunner produced no briefs; see", outDir); process.exit(1); }
    console.log(`  ${plan.briefs.length} briefs, ${plan.decisions?.length ?? 0} decisions`);
  }
  // On a resume, only the briefs without a usable draft are written again.
  const have = new Set(drafts.map((d) => plan!.briefs.indexOf(d.brief)));
  const todo = plan!.briefs.map((b, i) => [b, i] as const).filter(([, i]) => !have.has(i));
  if (todo.length) {
  if (resumeStamp) console.log(`  writing ${todo.length} missing brief(s)`);

  // Writers run two at a time: Cobble queues per model, and five parallel
  // canon-sized prompts filled them (measured 2026-10-11: a 503 after the
  // whole chain was refused). One failed brief does not sink the run.
  const CONCURRENCY = Number(process.env.AGENTS_CONCURRENCY || 2);
  const results: PromiseSettledResult<{ brief: Brief; role: RoleName; out: unknown }>[] = [];
  const queue = todo.map(([b, i]) => async () => {
    const role = (["character_writer", "rules_lawyer", "correspondent", "archivist"].includes(b.role) ? b.role : "correspondent") as RoleName;
    const p = plan!;
    const user = `TASK: ${p.task_summary}\n\nCANON CONSTRAINTS:\n${(p.canon_constraints ?? []).map((c) => `- ${c}`).join("\n")}\n\nDECISIONS ALREADY MADE:\n${(p.decisions ?? []).map((d) => `- ${d.question} → ${d.recommendation}`).join("\n")}\n\nYOUR BRIEF (${b.title}):\n${b.instructions}\n\nDELIVERABLE: ${b.deliverable}`;
    const out = await ask(role === "archivist" ? "rules_lawyer" : role, user, { secret: role !== "correspondent" && role !== "character_writer" });
    save(`draft-${i + 1}-${role}.json`, out ?? {});
    return { brief: b, role, out };
  });
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length) { const job = queue.shift()!; results.push(await Promise.allSettled([job()]).then((r) => r[0])); }
  }));
  drafts = [...drafts, ...results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []))];
  const failed = results.filter((r) => r.status === "rejected").map((r) => (r as PromiseRejectedResult).reason?.message ?? String(r));
  if (failed.length) console.log(`  ${failed.length} brief(s) failed: ${failed.join(" | ")}`);
  }
  if (!drafts.length) { console.error("No drafts succeeded; see", outDir); process.exit(1); }

  const bundle = drafts.map((d, i) => `### Draft ${i + 1} — ${d.role} — ${d.brief.title}\n${JSON.stringify(d.out, null, 1)}`).join("\n\n");
  const review = await ask("skeptic", `TASK: ${plan!.task_summary}\n\nReview these drafts.\n\n${bundle}`, { secret: true });

  const canonDoc = await ask("archivist", `TASK: ${plan!.task_summary}\n\nSHOWRUNNER PLAN:\n${JSON.stringify(plan, null, 1)}\n\nDRAFTS:\n${bundle}\n\nSKEPTIC REVIEW:\n${JSON.stringify(review, null, 1)}\n\nProduce the canon document for this task. Apply the Skeptic's high and medium findings. Keep PUBLIC CANON and SECRET CANON in separate top-level sections.`, { secret: true }) as string;

  const latest = join(ROOT, "agents/out", slug, "latest.md");
  writeFileSync(latest, canonDoc);
  const tokens = ledger.reduce((n, r) => n + (r.usage?.total_tokens ?? 0), 0);
  save("provenance.json", { slug, stamp, models_used: [...new Set(ledger.filter((r) => r.ok).map((r) => r.model))], calls: ledger.length, failures: ledger.filter((r) => !r.ok).length, total_tokens: tokens, ledger, canon_files_seen: publicCanon.map((f) => f.name), secret_files_seen: secretCanon.map((f) => f.name) });
  console.log(`\n✓ canon draft → ${latest}\n  run folder   → ${outDir}\n  ${ledger.length} calls, ${ledger.filter((r) => !r.ok).length} failed, ${tokens} tokens\n  Review it, then promote to canon/ by hand.`);
})().catch((e) => {
  console.error("\n✗", e.message); console.error("partial output in", outDir);
  save("provenance.json", { slug, stamp, failed: e.message, calls: ledger.length, failures: ledger.filter((r) => !r.ok).length, ledger });
  process.exit(1);
});
