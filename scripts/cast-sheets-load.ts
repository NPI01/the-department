/* Load cast sheets from a Markdown document into characters.npc_state.
     pnpm tsx scripts/cast-sheets-load.ts [path]      default canon/secret/11-cast-sheets.md
     pnpm tsx scripts/cast-sheets-load.ts --dry [path] parse and report only
   A sheet is a "### <Name>" heading followed by a ```json block. Names are
   matched to characters by full name (titles stripped), then by surname when
   exactly one character has it; an ambiguous surname (the two Thornes) is
   reported and not loaded, as is a name that matches nobody. */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const path = args.find((a) => !a.startsWith("--")) ?? "canon/secret/11-cast-sheets.md";

export function parseSheets(md: string): { name: string; sheet: Record<string, unknown>; problems: string[] }[] {
  const out: { name: string; sheet: Record<string, unknown>; problems: string[] }[] = [];
  const sections = md.split(/^###\s+/m).slice(1);
  for (const sec of sections) {
    const name = sec.split("\n")[0].replace(/\*/g, "").trim();
    const m = sec.match(/```json\s*([\s\S]*?)```/);
    if (!m) { out.push({ name, sheet: {}, problems: ["no json block"] }); continue; }
    let sheet: Record<string, unknown>;
    try { sheet = JSON.parse(m[1]); } catch (e) { out.push({ name, sheet: {}, problems: [`bad json: ${(e as Error).message}`] }); continue; }
    const problems: string[] = [];
    for (const k of ["voice", "wants_from_newcomer", "ladder", "knows", "never_says"]) if (!(k in sheet)) problems.push(`missing ${k}`);
    const v = sheet.voice as { signoff?: string } | undefined; if (v && !v.signoff) problems.push("voice.signoff missing");
    out.push({ name, sheet, problems });
  }
  return out;
}

const norm = (n: string) => n.replace(/\(.*?\)/g, "").replace(/\b(mr|mrs|ms|miss|dr|col|colonel|captain|capt|sheriff|tech|sgt|ret)\.?\s*/gi, "").replace(/\s+/g, " ").trim().toLowerCase();
const surname = (n: string) => norm(n).split(" ").pop()!;

async function main() {
  const md = readFileSync(resolve(process.cwd(), path), "utf8");
  const sheets = parseSheets(md);
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const cid = process.env.CAMPAIGN_ID!;
  const { data: chars } = await db.from("characters").select("id, slug, name").eq("campaign_id", cid).is("player_id", null);
  let loaded = 0;
  for (const s of sheets) {
    const byFull = (chars ?? []).filter((c) => norm(c.name) === norm(s.name));
    const bySurname = (chars ?? []).filter((c) => surname(c.name) === surname(s.name));
    const hit = byFull.length === 1 ? byFull[0] : bySurname.length === 1 ? bySurname[0] : null;
    const status = hit ? (s.problems.length ? `problems: ${s.problems.join(", ")}` : "ok") : bySurname.length > 1 ? `AMBIGUOUS surname: ${bySurname.map((c) => c.slug).join(", ")} (not loaded)` : "NO CHARACTER";
    console.log(` ${s.name.padEnd(28)} → ${(hit?.slug ?? "-").padEnd(10)} ${status}`);
    if (!hit || dry || s.problems.some((p) => p.startsWith("no json") || p.startsWith("bad json"))) continue;
    const { error } = await db.from("characters").update({ npc_state: s.sheet }).eq("id", hit.id);
    if (error) throw error; loaded++;
  }
  console.log(dry ? `dry run: ${sheets.length} sheets parsed` : `npc_state loaded for ${loaded} of ${sheets.length}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
