import type { ReactNode } from "react";
import { parseBlocks, type Block } from "./markdown";

/* Renders canon Markdown as React elements (no raw HTML), in the console's
   paper/ink style. Every block carries id="line-N" so a link can land on it,
   and the word PROPOSED is marked wherever it appears. */

export function Markdown({ md, compact = false }: { md: string; compact?: boolean }) {
  const blocks = parseBlocks(md);
  return <div className={`space-y-3 text-sm leading-relaxed ${compact ? "space-y-2" : ""}`}>{blocks.map((b, i) => <BlockView key={i} b={b} compact={compact} />)}</div>;
}

function BlockView({ b, compact }: { b: Block; compact: boolean }) {
  const id = `line-${b.line}`;
  const target = "scroll-mt-6 target:bg-warn/15 target:outline target:outline-1 target:outline-warn";
  switch (b.type) {
    case "heading": {
      const size = b.level <= 1 ? "text-lg font-semibold" : b.level === 2 ? "pt-2 text-base font-semibold" : "font-semibold";
      return <p id={id} className={`${size} ${target}`}>{inline(b.text)}</p>;
    }
    case "para":
      return <p id={id} className={target}>{inline(soft(b.text))}</p>;
    case "quote":
      return <blockquote id={id} className={`border-l-2 border-rule pl-3 text-ink-2 ${target}`}>{inline(soft(b.text))}</blockquote>;
    case "hr":
      return <hr id={id} className="border-rule" />;
    case "code":
      return <pre id={id} className={`overflow-x-auto border border-rule bg-paper-2 p-3 text-xs ${target}`}>{b.text}</pre>;
    case "list": {
      const Tag = b.ordered ? "ol" : "ul";
      return (
        <Tag start={b.ordered ? b.start : undefined} className={`${b.ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5`}>
          {b.items.map((it) => <li key={it.line} id={`line-${it.line}`} className={target}>{inline(soft(it.text))}</li>)}
        </Tag>
      );
    }
    case "table":
      return (
        <div className="-mx-1 overflow-x-auto px-1">
          <table id={id} className={`w-full border-collapse ${compact ? "text-xs" : "text-[13px]"}`}>
            <thead><tr className="border-b border-rule text-left text-[11px] uppercase tracking-wider text-ink-2">{b.header.map((h, i) => <th key={i} className="py-1 pr-3 font-normal">{inline(h)}</th>)}</tr></thead>
            <tbody>{b.rows.map((r) => <tr key={r.line} id={`line-${r.line}`} className={`border-b border-rule/50 align-top ${target}`}>{r.cells.map((c, i) => <td key={i} className="py-1 pr-3">{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
  }
}

/* Markdown joins hard-wrapped source lines into one paragraph. */
const soft = (t: string) => t.replace(/\s*\n\s*/g, " ");

/* **bold**, *italic*, `code`, [text](url), and a mark on PROPOSED / TBD. */
export function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\bPROPOSED\b|\bTBD\b)/g;
  let last = 0; let k = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<b key={k++}>{t.slice(2, -2)}</b>);
    else if (t.startsWith("`")) out.push(<code key={k++} className="bg-paper-2 px-1 text-[0.92em]">{t.slice(1, -1)}</code>);
    else if (t.startsWith("[")) {
      const lm = t.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      out.push(/^https?:/.test(lm[2]) ? <a key={k++} href={lm[2]} className="underline" target="_blank" rel="noreferrer">{lm[1]}</a> : <span key={k++} className="underline decoration-dotted">{lm[1]}</span>);
    } else if (t === "PROPOSED" || t === "TBD") out.push(<mark key={k++} className="bg-warn/20 px-0.5 text-warn">{t}</mark>);
    else out.push(<i key={k++}>{t.slice(1, -1)}</i>);
    last = m.index! + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
