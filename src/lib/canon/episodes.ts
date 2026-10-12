import { parseBlocks, section } from "./markdown";

/* Episode structure read out of canon: the season arc table
   (canon/secret/04-season-one-arc.md) and an episode's beat sheet
   (canon/secret/NN-episode-XX-beats.md). Pure. */

export const ARC_PATH = "canon/secret/04-season-one-arc.md";

export type ArcRow = { n: number; title: string; stage: string; crisis: string; decision: string; tagus: string; carries: string };
export type Act = { name: string; from: number; to: number; question: string };

export function parseArc(md: string): { episodes: ArcRow[]; acts: Act[] } {
  const table = parseBlocks(section(md, "The twelve episodes") ?? "").find((b) => b.type === "table");
  const episodes = table && table.type === "table"
    ? table.rows.map((r) => ({ n: Number(r.cells[0]), title: r.cells[1], stage: r.cells[2], crisis: r.cells[3], decision: r.cells[4], tagus: r.cells[5], carries: r.cells[6] })).filter((e) => e.n)
    : [];
  const acts = [...md.matchAll(/Act ([IVX]+) \((\d+)[–-](\d+)\)\s*\*([^*]+)\*/g)].map((m) => ({ name: `Act ${m[1]}`, from: Number(m[2]), to: Number(m[3]), question: m[4].trim() }));
  return { episodes, acts };
}

export type Beat = { from: number; to: number; kind: string; beat: string; seenBy: string; source: string };

export function parseBeats(md: string): Beat[] {
  const table = parseBlocks(section(md, "Beats") ?? md).find((b) => b.type === "table");
  if (!table || table.type !== "table") return [];
  return table.rows.map((r) => {
    const [a, b] = r.cells[0].split(/[–-]/).map((x) => Number(x.trim()));
    return { from: a, to: b || a, kind: r.cells[1], beat: r.cells[2], seenBy: r.cells[3], source: r.cells[4] };
  }).filter((x) => x.from);
}

/* Round 1 of Season One is Monday, October 10, 1977. Episodes after the first
   shift by intermissions the arc has not fixed yet, so later dates are approximate. */
export function fictionalDate(episode: number, round: number) {
  const d = new Date(Date.UTC(1977, 9, 10 + (episode - 1) * 14 + (round - 1)));
  return { date: d, exact: episode === 1 };
}

export const ARCS_PATH = "canon/secret/10-episode-arcs.md";

/* One episode's story arc from 10-episode-arcs.md: the logline, and the rest
   of the section as markdown. */
export function arcFor(md: string, n: number): { logline: string | null; body: string } | null {
  const s = section(md, `Episode ${String(n).padStart(2, "0")}`);
  if (!s) return null;
  const m = s.match(/\*\*Logline\.\*\*\s*([\s\S]*?)(\n\s*\n|$)/);
  return { logline: m ? m[1].replace(/\s+/g, " ").trim() : null, body: m ? s.replace(m[0], "").trim() : s };
}
