"use client";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { parseBlocks } from "@/lib/canon/markdown";
import { inline } from "@/lib/canon/render";
import { STATUS_LABEL, type CaseFile, type CaseItem, type CaseNote, type Drawer, type Grade } from "@/lib/game/case-file";
import { addNote, deleteNote, editNote } from "./actions";

/* Drawers and folders; an open item as a sheet of paper with the player's
   margin notes beside it; the Notebook of every note. The open item lives in
   the URL hash so the back button and a bookmark both work. */

type DrawerKey = "all" | Drawer | "removed";
const DRAWER_LABEL: Record<DrawerKey, string> = { all: "Everything", correspondence: "Correspondence", documents: "Documents", photographs: "Photographs", maps: "Maps & plans", findings: "Findings", removed: "No longer held" };
const GRADE_LABEL: Record<Grade, string> = { intelligence: "Intelligence", evidence: "Evidence", finding: "Finding" };
const GRADE_HELP: Record<Grade, string> = {
  intelligence: "Believed relevant, not yet tied to a source. EXAMINE it to try to make it evidence.",
  evidence: "Has provenance. You can FILE it with a committee.",
  finding: "Formally accepted by a committee. A finding can be established and still be wrong.",
};

const held = (i: CaseItem) => i.status === "held";
function inDrawer(i: CaseItem, d: DrawerKey) {
  if (d === "removed") return !held(i);
  if (!held(i)) return d === "all";
  if (d === "findings") return i.grade === "finding" || i.drawer === "findings";
  return d === "all" || i.drawer === d;
}
const roundLabel = (r: number | null) => (r == null ? "Before Round 1" : `Round ${r}`);

function Stamp({ grade, className = "" }: { grade: Grade; className?: string }) {
  const tone = grade === "finding" ? "border-red bg-red text-paper" : grade === "evidence" ? "border-red text-red" : "border-dashed border-ink-2 text-ink-2";
  return <span className={`display inline-block -rotate-3 border-2 px-1.5 py-px text-[11px] font-semibold tracking-[0.08em] ${tone} ${className}`}>{GRADE_LABEL[grade]}</span>;
}

export function CaseFileView({ token, file }: { token: string; file: CaseFile }) {
  const [notes, setNotes] = useState<CaseNote[]>(file.notes);
  // A server refresh brings a new notes array; adopt it.
  const [seen, setSeen] = useState(file.notes);
  if (seen !== file.notes) { setSeen(file.notes); setNotes(file.notes); }
  const [view, setView] = useState<"cabinet" | "notebook">("cabinet");
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerKey>("all");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [sort, setSort] = useState<"received" | "written">("received");
  const [q, setQ] = useState("");

  const byKey = useMemo(() => new Map(file.items.map((i) => [i.key, i])), [file.items]);

  // Hash routing: #<item key> opens an item, #notebook the notebook.
  useEffect(() => {
    const read = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (h === "notebook") { setView("notebook"); setOpen(null); }
      else { setView("cabinet"); setOpen(h && byKey.has(h) ? h : null); }
    };
    read();
    // Next's router can move between hashes with popstate alone, so listen for both.
    addEventListener("hashchange", read);
    addEventListener("popstate", read);
    return () => { removeEventListener("hashchange", read); removeEventListener("popstate", read); };
  }, [byKey]);
  const go = (h: string) => { location.hash = h; scrollTo({ top: 0 }); };
  const close = () => { history.pushState(null, "", location.pathname + location.search); setOpen(null); setView("cabinet"); };

  const tabs = (
    <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
      <h1 className="display text-5xl sm:text-6xl">{view === "notebook" ? "Notebook" : "Case File"}</h1>
      <div className="flex gap-2 text-xs uppercase tracking-[0.2em]">
        <button type="button" onClick={close} className={`border-2 border-ink px-3 py-1.5 ${view === "cabinet" && !open ? "bg-ink text-paper" : "hover:bg-paper-2"}`}>Cabinet</button>
        <button type="button" onClick={() => go("notebook")} className={`border-2 border-ink px-3 py-1.5 ${view === "notebook" ? "bg-ink text-paper" : "hover:bg-paper-2"}`}>Notebook · {notes.length}</button>
      </div>
    </div>
  );

  const item = open ? byKey.get(open) : undefined;
  if (view === "notebook") return <>{tabs}<Notebook token={token} notes={notes} setNotes={setNotes} byKey={byKey} go={go} /></>;
  if (item) return <>{tabs}<ItemView token={token} item={item} items={file.items} notes={notes} setNotes={setNotes} byKey={byKey} go={go} close={close} /></>;

  const needle = q.trim().toLowerCase();
  const noteText = (k: string) => notes.filter((n) => n.itemKey === k).map((n) => `${n.body} ${n.quote ?? ""}`).join(" ");
  const list = file.items
    .filter((i) => inDrawer(i, drawer))
    .filter((i) => !grade || i.grade === grade)
    .filter((i) => !needle || [i.title, i.from, i.to, i.body, i.caption, noteText(i.key)].join(" ").toLowerCase().includes(needle))
    .sort(sort === "received"
      ? (a, b) => (a.round ?? 0) - (b.round ?? 0) || a.receivedAt.localeCompare(b.receivedAt)
      : (a, b) => (a.writtenOn ?? "9999").localeCompare(b.writtenOn ?? "9999"));

  return (
    <>
      {tabs}
      <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-ink-2">Everything you hold: letters, documents, photographs and maps. Open any item to read it, quote a passage, and write in the margin.</p>
      <div className="mt-8 grid gap-8 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="grid content-start gap-6">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-ink-2">Drawers</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 md:grid md:overflow-visible">
              {(Object.keys(DRAWER_LABEL) as DrawerKey[]).map((d) => (
                <button key={d} type="button" aria-pressed={drawer === d} onClick={() => setDrawer(d)}
                  className={`display flex shrink-0 items-center justify-between gap-3 border-[1.5px] border-ink px-3 py-2 text-left text-[15px] font-medium tracking-[0.04em] ${drawer === d ? "bg-ink text-paper" : "bg-paper-2 hover:bg-paper"}`}>
                  <span>{DRAWER_LABEL[d]}</span><span className="font-mono text-xs tabular-nums">{file.items.filter((i) => inDrawer(i, d)).length}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="case-q" className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-ink-2">Search, notes included</label>
            <input id="case-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} className="w-full border-[1.5px] border-ink bg-paper px-2.5 py-2 text-sm" />
          </div>
          <Chips label="Grade" options={(Object.keys(GRADE_LABEL) as Grade[]).map((g) => [g, GRADE_LABEL[g]])} value={grade} onChange={(g) => setGrade(grade === g ? null : g)} />
          <Chips label="Order by" options={[["received", "When I got it"], ["written", "When it was written"]]} value={sort} onChange={setSort} />
        </aside>
        <section className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
            <h2 className="display text-2xl">{DRAWER_LABEL[drawer]}</h2>
            <span className="text-xs text-ink-2">{list.length} item{list.length === 1 ? "" : "s"} · {notes.length} note{notes.length === 1 ? "" : "s"}</span>
          </div>
          <div className="mt-7 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-4 gap-y-6">
            {list.length ? list.map((i) => <Folder key={i.key} item={i} notes={notes.filter((n) => n.itemKey === i.key).length} onOpen={() => go(i.key)} />) : (
              <p className="col-span-full border-[1.5px] border-dashed border-rule p-6 text-sm leading-relaxed text-ink-2">
                {file.items.length === 0 ? "Your cabinet is empty. Letters you send and receive are filed here automatically, along with any documents, photographs and maps that come into your hands."
                  : drawer === "findings" ? "No findings yet. When a committee formally accepts evidence you filed (FILE … WITH …, then a vote), the finding is filed here."
                  : "Nothing here matches."}
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function Chips<T extends string>({ label, options, value, onChange }: { label: string; options: [T, string][]; value: T | null; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-ink-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}
            className={`border-[1.5px] px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] ${value === k ? "border-red bg-red text-paper" : "border-ink hover:bg-paper-2"}`}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function Folder({ item: i, notes, onOpen }: { item: CaseItem; notes: number; onOpen: () => void }) {
  const gone = !held(i);
  return (
    <button type="button" onClick={onOpen}
      className={`relative grid min-h-40 content-start gap-2 border-[1.5px] border-ink p-3.5 pt-4 text-left transition-transform hover:-translate-y-0.5 motion-reduce:transition-none ${gone ? "border-dashed text-ink-2" : "bg-paper-2"}`}>
      <span className={`absolute -top-[15px] left-3 border-[1.5px] border-b-0 border-ink px-2.5 pb-0.5 text-[10px] uppercase tracking-[0.2em] ${gone ? "border-dashed bg-paper" : "bg-paper-2"}`}>{i.kind}{i.round != null ? ` · R${i.round}` : ""}</span>
      {i.image && <span className="block h-16 border border-ink bg-cover bg-center grayscale" style={{ backgroundImage: `url("${i.image}")` }} />}
      <span className={`type text-base leading-snug ${gone ? "line-through decoration-red" : ""}`}>{i.title}</span>
      <span className="text-[11px] leading-relaxed text-ink-2">{i.from ?? "Unknown"}{i.writtenLabel ? <><br />{i.writtenLabel}</> : null}</span>
      <span className="mt-auto flex items-center justify-between gap-2 text-[11px]">
        {gone ? <span>{STATUS_LABEL[i.status]}{i.statusRound != null ? `, Round ${i.statusRound}` : ""}</span> : <Stamp grade={i.grade} />}
        {notes > 0 && <span className="text-red-2">✎ {notes} note{notes > 1 ? "s" : ""}</span>}
      </span>
    </button>
  );
}

/* ---------- one item ---------- */

function Body({ md }: { md: string }) {
  const soft = (t: string) => t.replace(/\s*\n\s*/g, " ");
  return (
    <div className="type max-w-[66ch] space-y-3 text-[15px] leading-[1.65]">
      {parseBlocks(md).map((b, k) => {
        switch (b.type) {
          case "heading": return <p key={k} className="pt-1 font-bold">{inline(b.text)}</p>;
          case "para": return <p key={k}>{inline(soft(b.text))}</p>;
          case "quote": return <blockquote key={k} className="ml-4 italic">{inline(soft(b.text))}</blockquote>;
          case "hr": return <hr key={k} className="border-dashed border-rule" />;
          case "code": return <pre key={k} className="type overflow-x-auto border-y border-dashed border-rule py-2 text-[13px] leading-snug">{b.text}</pre>;
          case "list": { const T = b.ordered ? "ol" : "ul"; return <T key={k} className={`${b.ordered ? "list-decimal" : "list-disc"} space-y-1 pl-6`}>{b.items.map((it) => <li key={it.line}>{inline(soft(it.text))}</li>)}</T>; }
          case "table": return (
            <div key={k} className="overflow-x-auto"><table className="w-full border-collapse text-[13px]">
              <thead><tr className="border-b border-ink text-left">{b.header.map((h, x) => <th key={x} className="py-1 pr-3 font-normal">{inline(h)}</th>)}</tr></thead>
              <tbody>{b.rows.map((r) => <tr key={r.line} className="border-b border-rule">{r.cells.map((c, x) => <td key={x} className="py-1 pr-3 align-top">{inline(c)}</td>)}</tr>)}</tbody>
            </table></div>
          );
        }
      })}
    </div>
  );
}

/* Marks every quoted passage in the sheet without touching the DOM, via the
   CSS Custom Highlight API. Browsers without it simply show no marks. */
function useQuoteHighlights(root: React.RefObject<HTMLElement | null>, quotes: string[]) {
  useEffect(() => {
    const el = root.current;
    const reg = (globalThis as { CSS?: { highlights?: Map<string, unknown> } }).CSS?.highlights;
    const HL = (globalThis as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
    if (!el || !reg || !HL) return;
    const nodes: Text[] = []; let text = "";
    const starts: number[] = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) { starts.push(text.length); nodes.push(n as Text); text += (n as Text).data; }
    const at = (pos: number): [Text, number] => { let i = starts.length - 1; while (i > 0 && starts[i] > pos) i--; return [nodes[i], pos - starts[i]]; };
    const ranges: Range[] = [];
    for (const q of quotes) {
      const idx = text.indexOf(q);
      if (idx < 0 || !q) continue;
      const r = document.createRange();
      const [sn, so] = at(idx); const [en, eo] = at(idx + q.length - 1);
      r.setStart(sn, so); r.setEnd(en, eo + 1); ranges.push(r);
    }
    reg.set("case-quote", new HL(...ranges));
    return () => { reg.delete("case-quote"); };
  }, [root, quotes]);
}

function ItemView({ token, item: i, items, notes, setNotes, byKey, go, close }: {
  token: string; item: CaseItem; items: CaseItem[]; notes: CaseNote[]; setNotes: (f: (n: CaseNote[]) => CaseNote[]) => void;
  byKey: Map<string, CaseItem>; go: (h: string) => void; close: () => void;
}) {
  const mine = notes.filter((n) => n.itemKey === i.key);
  const sheet = useRef<HTMLElement>(null);
  const quotes = useMemo(() => mine.map((n) => n.quote ?? "").filter(Boolean), [mine]);
  useQuoteHighlights(sheet, quotes);
  const [quote, setQuote] = useState("");
  const connected = [...new Set(notes.filter((n) => n.itemKey === i.key || n.links.includes(i.key)).flatMap((n) => [n.itemKey, ...n.links]))]
    .filter((k): k is string => !!k && k !== i.key && byKey.has(k));

  const onSelect = () => {
    const s = String(getSelection() ?? "").replace(/\s+/g, " ").trim();
    if (s && sheet.current?.contains(getSelection()?.anchorNode ?? null)) setQuote(s.slice(0, 600));
  };

  const gone = !held(i);
  const rows: [string, ReactNode][] = [
    ["How you got it", i.how ?? "—"],
    ["Your copy", i.copy ?? "—"],
    ["Filed", roundLabel(i.round)],
    ["Grade", <span key="g"><b>{GRADE_LABEL[i.grade]}.</b> {GRADE_HELP[i.grade]}</span>],
    ...(gone ? [["Status", `${STATUS_LABEL[i.status]}${i.statusRound != null ? `, Round ${i.statusRound}` : ""}${i.statusNote ? `. ${i.statusNote}` : ""}`] as [string, string]] : []),
  ];

  return (
    <>
      <style>{`::highlight(case-quote) { background-color: color-mix(in srgb, var(--red) 28%, transparent); }`}</style>
      <p className="mt-6"><button type="button" onClick={close} className="text-[11px] uppercase tracking-[0.25em] hover:text-red">← Back to the cabinet</button></p>
      <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article ref={sheet} onMouseUp={onSelect} onKeyUp={onSelect} className="relative min-w-0 border border-rule bg-[#f6f0e2] p-5 shadow-[4px_5px_0_var(--ink)] sm:p-10">
          <span className="absolute right-4 top-4 rotate-6 sm:right-6 sm:top-6">{gone ? <span className="display inline-block border-2 border-dashed border-ink-2 px-1.5 text-[12px] text-ink-2">{STATUS_LABEL[i.status]}</span> : <Stamp grade={i.grade} className="text-[14px]" />}</span>
          <p className="text-[10px] uppercase tracking-[0.25em] text-ink-2">{i.kind}</p>
          <h2 className="type mr-24 mt-1 text-xl leading-snug sm:text-2xl">{i.title}</h2>
          <p className="mb-6 mt-1 text-xs text-ink-2">{[i.from && `From ${i.from}`, i.to && `To ${i.to}`, i.writtenLabel].filter(Boolean).join(" · ")}</p>
          {i.image && <figure className="mb-6">{/* eslint-disable-next-line @next/next/no-img-element -- signed Storage URLs expire hourly; nothing to optimize or cache */}
            <img src={i.image} alt={i.caption ?? i.title} className="block w-full max-w-xl border-[10px] border-[#fbf7ee] outline outline-1 outline-rule grayscale contrast-110 sepia-[.15]" />{i.caption && <figcaption className="type mt-2 text-sm text-ink-2">{i.caption}</figcaption>}</figure>}
          {i.body && <Body md={i.body} />}
          <section className="mt-8 border-t-2 border-ink pt-3">
            <h3 className="display text-base font-medium tracking-[0.06em]">Provenance</h3>
            <dl className="mt-2 text-xs">
              {rows.map(([k, v]) => <div key={k} className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 border-b border-rule py-1.5"><dt className="pt-px text-[10px] uppercase tracking-[0.2em] text-ink-2">{k}</dt><dd>{v}</dd></div>)}
            </dl>
          </section>
        </article>

        <aside className="grid min-w-0 content-start gap-7">
          <div>
            <h3 className="display mb-2 text-base font-medium tracking-[0.06em]">Margin notes</h3>
            <div className="grid gap-2.5">
              {mine.length ? mine.map((n) => <NoteCard key={n.id} token={token} note={n} byKey={byKey} go={go} setNotes={setNotes} />)
                : <p className="text-xs leading-relaxed text-ink-2">No notes yet. Select a passage in the {i.image && !i.body ? "caption or details" : "document"} to quote it, then write what you make of it.</p>}
            </div>
          </div>
          <NewNote token={token} itemKey={i.key} quote={quote} clearQuote={() => setQuote("")} items={items} setNotes={setNotes} />
          {connected.length > 0 && (
            <div>
              <h3 className="display mb-2 text-base font-medium tracking-[0.06em]">Connected items</h3>
              <div className="flex flex-wrap gap-1.5">{connected.map((k) => <button key={k} type="button" onClick={() => go(k)} className="border-[1.5px] border-ink bg-paper-2 px-2 py-0.5 text-[11px] hover:border-red hover:text-red">{byKey.get(k)!.title}</button>)}</div>
            </div>
          )}
          {gone ? <p className="text-xs leading-relaxed text-ink-2">You no longer hold this. What you read and your notes stay here, but you can&apos;t hand it on or file it.</p> : (
            <div>
              <h3 className="display mb-2 text-base font-medium tracking-[0.06em]">In your orders</h3>
              <p className="text-xs leading-relaxed text-ink-2">Refer to this item by its short name:</p>
              <code className="mt-1.5 block overflow-x-auto whitespace-nowrap border border-rule bg-paper-2 px-2.5 py-2 text-xs">{i.key}</code>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-2">e.g. <code>EXAMINE {i.key}</code> or <code>FILE {i.key} WITH &lt;committee&gt;</code></p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

/* ---------- notes ---------- */

function NewNote({ token, itemKey, quote, clearQuote, items, setNotes }: {
  token: string; itemKey: string | null; quote?: string; clearQuote?: () => void; items: CaseItem[]; setNotes: (f: (n: CaseNote[]) => CaseNote[]) => void;
}) {
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const id = itemKey ?? "loose";
  const save = () => start(async () => {
    setError("");
    const r = await addNote({ token, itemKey, quote: quote || null, body, links: link ? [link] : [] });
    if (r.error || !r.note) { setError(r.error ?? "The note did not save."); return; }
    setNotes((ns) => [...ns, r.note!]); setBody(""); setLink(""); clearQuote?.();
  });
  return (
    <div>
      <label htmlFor={`note-${id}`} className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-ink-2">{itemKey ? "New note" : "New loose page"}</label>
      {quote && (
        <p className="mb-2 flex items-start gap-2 border-l-2 border-red pl-2 text-xs text-ink-2">
          <span className="type min-w-0 flex-1">“{quote}”</span>
          <button type="button" onClick={clearQuote} aria-label="Remove quote" className="hover:text-red">✕</button>
        </p>
      )}
      <textarea id={`note-${id}`} value={body} onChange={(e) => setBody(e.target.value)} rows={4}
        placeholder={itemKey ? "What does this tell you? What doesn't add up?" : "Theories, lists, who to write to next…"}
        className="type w-full resize-y border-[1.5px] border-ink bg-paper px-2.5 py-2 text-sm leading-relaxed" />
      <label htmlFor={`link-${id}`} className="mb-1.5 mt-2 block text-[10px] uppercase tracking-[0.25em] text-ink-2">Connect to another item</label>
      <select id={`link-${id}`} value={link} onChange={(e) => setLink(e.target.value)} className="w-full border-[1.5px] border-ink bg-paper px-2 py-1.5 text-xs">
        <option value="">None</option>
        {items.filter((x) => x.key !== itemKey).map((x) => <option key={x.key} value={x.key}>{x.title}</option>)}
      </select>
      <div className="mt-2.5 flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending || !body.trim()} className="bg-ink px-3.5 py-2 text-[11px] uppercase tracking-[0.2em] text-paper hover:bg-red disabled:opacity-50">{pending ? "Saving…" : itemKey ? "Add note" : "Add page"}</button>
        {error && <span role="alert" className="text-xs text-red">{error}</span>}
      </div>
    </div>
  );
}

function NoteCard({ token, note: n, byKey, go, setNotes, showItem = false }: {
  token: string; note: CaseNote; byKey: Map<string, CaseItem>; go: (h: string) => void; setNotes: (f: (n: CaseNote[]) => CaseNote[]) => void; showItem?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(n.body);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const item = n.itemKey ? byKey.get(n.itemKey) : undefined;
  const save = () => start(async () => {
    const r = await editNote(token, n.id, draft);
    if (r.error) { setError(r.error); return; }
    setNotes((ns) => ns.map((x) => (x.id === n.id ? { ...x, body: draft.trim() } : x))); setEditing(false); setError("");
  });
  const remove = () => start(async () => { await deleteNote(token, n.id); setNotes((ns) => ns.filter((x) => x.id !== n.id)); });
  return (
    <div className="border border-[#d9c98a] bg-[#fbf3c9] px-3 py-2.5 text-sm leading-relaxed odd:-rotate-[0.5deg] even:rotate-[0.4deg]">
      {showItem && <p className="mb-1 text-[10px] uppercase tracking-[0.15em] text-ink-2">{item ? <>On <button type="button" onClick={() => go(item.key)} className="underline decoration-dotted hover:text-red">{item.title}</button></> : n.itemKey ? "On an item no longer in your file" : "Loose page"}</p>}
      {n.quote && <p className="type mb-1.5 border-l-2 border-red pl-2 text-[13px] text-ink-2">“{n.quote}”</p>}
      {editing ? (
        <>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} aria-label="Edit note" className="type w-full resize-y border border-ink bg-paper px-2 py-1.5 text-sm" />
          <div className="mt-1.5 flex gap-3 text-[11px] uppercase tracking-[0.15em]">
            <button type="button" onClick={save} disabled={pending} className="text-red hover:underline">Save</button>
            <button type="button" onClick={() => { setEditing(false); setDraft(n.body); }} className="hover:underline">Cancel</button>
          </div>
        </>
      ) : <p className="type whitespace-pre-wrap">{n.body}</p>}
      {n.links.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">{n.links.filter((l) => byKey.has(l)).map((l) => <button key={l} type="button" onClick={() => go(l)} className="border border-ink px-1.5 text-[11px] hover:border-red hover:text-red">→ {byKey.get(l)!.title}</button>)}</div>
      )}
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.12em] text-ink-2">
        <span>{roundLabel(n.round)}</span>
        {!editing && (confirm ? (
          <span className="flex gap-2">Delete this note? <button type="button" onClick={remove} disabled={pending} className="text-red hover:underline">Delete</button><button type="button" onClick={() => setConfirm(false)} className="hover:underline">Keep</button></span>
        ) : (
          <span className="flex gap-3"><button type="button" onClick={() => setEditing(true)} className="hover:text-red">Edit</button><button type="button" onClick={() => setConfirm(true)} className="hover:text-red">Delete</button></span>
        ))}
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red">{error}</p>}
    </div>
  );
}

function Notebook({ token, notes, setNotes, byKey, go }: {
  token: string; notes: CaseNote[]; setNotes: (f: (n: CaseNote[]) => CaseNote[]) => void; byKey: Map<string, CaseItem>; go: (h: string) => void;
}) {
  const items = [...byKey.values()];
  return (
    <div className="mt-6 grid max-w-3xl gap-6">
      <p className="max-w-[62ch] text-sm leading-relaxed text-ink-2">Every note you have made, newest first, with the item it belongs to. Loose pages are for the bigger picture: theories, lists, who to write to next.</p>
      <div className="border border-rule border-l-[3px] border-l-red bg-paper-2/50 p-4">
        <NewNote token={token} itemKey={null} items={items} setNotes={setNotes} />
      </div>
      {notes.length === 0 ? <p className="text-sm text-ink-2">No notes yet. Open any item in the cabinet to write in its margin.</p>
        : <div className="grid gap-3">{[...notes].reverse().map((n) => <NoteCard key={n.id} token={token} note={n} byKey={byKey} go={go} setNotes={setNotes} showItem />)}</div>}
    </div>
  );
}
