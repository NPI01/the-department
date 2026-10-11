/* The small slice of Markdown canon is written in: headings, paragraphs,
   lists, tables, code fences, blockquotes and rules. Parsed into blocks with
   their source line, so the console can render a doc, link to a line, and
   find the PROPOSED blocks in it. Pure: shared by scripts/canon-sync.ts and
   the console. */

export type Block =
  | { type: "heading"; level: number; text: string; line: number }
  | { type: "para"; text: string; line: number }
  | { type: "quote"; text: string; line: number }
  | { type: "list"; ordered: boolean; start: number; items: { text: string; line: number }[]; line: number }
  | { type: "table"; header: string[]; rows: { cells: string[]; line: number }[]; line: number }
  | { type: "code"; lang: string; text: string; line: number }
  | { type: "hr"; line: number };

const LIST_ITEM = /^(\s*)([-*]|\d+\.)\s+(.*)$/;
const splitRow = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const isTableSep = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);

export function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    const n = i + 1;
    if (!l.trim()) { i++; continue; }
    const fence = l.match(/^```(\w*)/);
    if (fence) {
      const body: string[] = []; i++;
      while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++]);
      i++; out.push({ type: "code", lang: fence[1], text: body.join("\n"), line: n }); continue;
    }
    const h = l.match(/^(#{1,6})\s+(.*)$/);
    if (h) { out.push({ type: "heading", level: h[1].length, text: h[2].trim(), line: n }); i++; continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) { out.push({ type: "hr", line: n }); i++; continue; }
    if (l.trim().startsWith("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(l); i += 2;
      const rows: { cells: string[]; line: number }[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push({ cells: splitRow(lines[i]), line: i + 1 }); i++; }
      out.push({ type: "table", header, rows, line: n }); continue;
    }
    if (l.startsWith(">")) {
      const body: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) body.push(lines[i++].replace(/^>\s?/, ""));
      out.push({ type: "quote", text: body.join("\n"), line: n }); continue;
    }
    const li = l.match(LIST_ITEM);
    if (li) {
      const ordered = /\d/.test(li[2]);
      const items: { text: string; line: number }[] = [];
      while (i < lines.length) {
        const m = lines[i].match(LIST_ITEM);
        if (m && m[1].length <= li[1].length) { items.push({ text: m[3], line: i + 1 }); i++; continue; }
        // continuation (indented, or a nested item folded into its parent)
        if (lines[i].trim() && (/^\s+/.test(lines[i]) || m) && items.length) { items[items.length - 1].text += "\n" + lines[i].trim(); i++; continue; }
        break;
      }
      out.push({ type: "list", ordered, start: ordered ? Number(li[2].replace(".", "")) : 1, items, line: n }); continue;
    }
    const body: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|>|\s*\|)/.test(lines[i]) && !LIST_ITEM.test(lines[i])) body.push(lines[i++]);
    if (!body.length) { body.push(lines[i++]); }
    out.push({ type: "para", text: body.join("\n"), line: n });
  }
  return out;
}

export function docTitle(md: string, fallback: string) {
  return md.match(/^#\s+(.+)$/m)?.[1].trim() ?? fallback;
}

/* The markdown under a heading (matched by case-insensitive prefix), up to the
   next heading of the same or a higher level. */
export function section(md: string, heading: string): string | null {
  const lines = md.split("\n");
  const want = heading.toLowerCase();
  const start = lines.findIndex((l) => { const h = l.match(/^(#{1,6})\s+(.*)$/); return Boolean(h && h[2].trim().toLowerCase().startsWith(want)); });
  if (start < 0) return null;
  const level = lines[start].match(/^(#+)/)![1].length;
  let end = lines.length;
  for (let j = start + 1; j < lines.length; j++) { const h = lines[j].match(/^(#{1,6})\s/); if (h && h[1].length <= level) { end = j; break; } }
  return lines.slice(start + 1, end).join("\n").trim();
}

/* ---------- proposals ---------- */

export type FoundProposal = { kind: "document" | "item" | "question"; heading: string | null; text: string; line: number };

const QUESTION_HEADING = /decision|gaps for|open question/i;
const SKIP_HEADING = /^engine work|^changelog/i;

/* Every block that awaits the showrunner: blocks marked PROPOSED (before the
   first section heading they stand for the whole document), and list items
   under a "decisions"/"gaps" heading, which are questions to answer. */
export function findProposals(md: string): FoundProposal[] {
  const out: FoundProposal[] = [];
  const stack: { level: number; text: string }[] = [];
  let sawSection = false;
  for (const b of parseBlocks(md)) {
    if (b.type === "heading") {
      while (stack.length && stack[stack.length - 1].level >= b.level) stack.pop();
      if (b.level > 1) { stack.push({ level: b.level, text: b.text }); sawSection = true; }
      continue;
    }
    const heading = stack.map((s) => s.text).join(" › ") || null;
    const current = stack[stack.length - 1]?.text ?? "";
    if (stack.some((s) => SKIP_HEADING.test(s.text)) || b.type === "code" || b.type === "hr") continue;
    const asQuestion = QUESTION_HEADING.test(current);
    if (b.type === "para" || b.type === "quote") {
      if (/PROPOSED/.test(b.text)) out.push({ kind: sawSection ? "item" : "document", heading, text: b.type === "quote" ? b.text.split("\n").map((x) => `> ${x}`).join("\n") : b.text, line: b.line });
    } else if (b.type === "list") {
      b.items.forEach((it, k) => {
        const bullet = b.ordered ? `${b.start + k}.` : "-";
        if (asQuestion) out.push({ kind: "question", heading, text: `${bullet} ${it.text}`, line: it.line });
        else if (/PROPOSED/.test(it.text)) out.push({ kind: "item", heading, text: `${bullet} ${it.text}`, line: it.line });
      });
    } else if (b.type === "table") {
      for (const r of b.rows) {
        if (!/PROPOSED/.test(r.cells.join(" "))) continue;
        const row = (c: string[]) => `| ${c.join(" | ")} |`;
        out.push({ kind: "item", heading, text: [row(b.header), row(b.header.map(() => "---")), row(r.cells)].join("\n"), line: r.line });
      }
    }
  }
  return out;
}

export const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
