"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Markdown } from "@/lib/canon/render";
import { joinSections, splitSections } from "@/lib/public/sections";
import { DOC_META, type PublicDocKey } from "@/lib/public/docs";
import { saveDoc } from "./actions";

/* Section by section: rename, rewrite, add, remove and reorder the "## "
   sections, each with a preview. "Whole document" edits the same text as one
   Markdown file. Nothing reaches players until Save. */

type Sec = { id: number; title: string; body: string; open: boolean; preview: boolean };

const input = "w-full border border-rule bg-paper px-2.5 py-1.5 outline-none focus:border-accent";
const btn = "border border-rule px-2 py-0.5 text-xs hover:border-ink disabled:opacity-40";
const rows = (t: string, min = 4) => Math.min(32, Math.max(min, t.split("\n").length + 1));

// ids only key React lists; they start from a given number so server and browser agree.
const toSecs = (md: string, from: number) => {
  const s = splitSections(md);
  return { intro: s.intro, numbered: s.numbered, secs: s.sections.map((x, i) => ({ id: from + i, title: x.title, body: x.body, open: false, preview: false })) };
};

export function DocEditor({ docKey, initialContent, initialBanner }: { docKey: PublicDocKey; initialContent: string; initialBanner: string }) {
  const meta = DOC_META[docKey];
  const [start] = useState(() => toSecs(initialContent, 0));
  const nextId = useRef(10_000);
  const [banner, setBanner] = useState(initialBanner);
  const [intro, setIntro] = useState(start.intro);
  const [secs, setSecs] = useState<Sec[]>(start.secs);
  const [numbered, setNumbered] = useState(start.numbered);
  const [mode, setMode] = useState<"sections" | "whole">("sections");
  const [whole, setWhole] = useState("");
  const [dirty, setDirty] = useState(false);
  const [renumbered, setRenumbered] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pending, startSave] = useTransition();
  const focusId = useRef<number | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (focusId.current == null) return;
    document.getElementById(`sec-title-${focusId.current}`)?.focus();
    focusId.current = null;
  });

  const touch = () => { setDirty(true); setMsg({}); };
  const content = () => (mode === "whole" ? whole : joinSections({ intro, numbered, sections: secs }));
  const edit = (id: number, patch: Partial<Sec>) => { setSecs((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x))); if ("title" in patch || "body" in patch) touch(); };
  const add = (at: number) => {
    const s: Sec = { id: nextId.current++, title: "", body: "", open: true, preview: false };
    focusId.current = s.id;
    setSecs((xs) => [...xs.slice(0, at), s, ...xs.slice(at)]);
    if (numbered && at < secs.length) setRenumbered(true);
    touch();
  };
  const move = (i: number, d: -1 | 1) => {
    setSecs((xs) => { const ys = [...xs]; [ys[i], ys[i + d]] = [ys[i + d], ys[i]]; return ys; });
    if (numbered) setRenumbered(true);
    touch();
  };
  const remove = (id: number) => { const i = secs.findIndex((x) => x.id === id); setSecs((xs) => xs.filter((x) => x.id !== id)); if (numbered && i < secs.length - 1) setRenumbered(true); touch(); };

  const switchMode = (m: "sections" | "whole") => {
    if (m === mode) return;
    if (m === "whole") setWhole(joinSections({ intro, numbered, sections: secs }));
    else { const s = toSecs(whole, nextId.current); nextId.current += s.secs.length; setIntro(s.intro); setSecs(s.secs); setNumbered(s.numbered); }
    setMode(m);
  };
  const save = () => startSave(async () => {
    const r = await saveDoc(docKey, { banner, content: content() });
    setMsg(r);
    if (r.ok) { setDirty(false); setRenumbered(false); }
  });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex text-xs">
          {(["sections", "whole"] as const).map((m) => (
            <button key={m} type="button" onClick={() => switchMode(m)} className={`border border-ink px-3 py-1 ${mode === m ? "bg-ink text-paper" : "hover:bg-paper-2"} ${m === "whole" ? "-ml-px" : ""}`}>{m === "sections" ? "Sections" : "Whole document"}</button>
          ))}
        </div>
        {mode === "sections" && (
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={numbered} onChange={(e) => { setNumbered(e.target.checked); touch(); }} /> Number sections automatically</label>
        )}
      </div>

      <label className="block text-sm">
        <span className="text-ink-2">Notice above the {meta.label.toLowerCase()}</span> <span className="text-xs text-ink-2">· shown in a red box; leave empty for none</span>
        <input id={`${docKey}-banner`} value={banner} onChange={(e) => { setBanner(e.target.value); touch(); }} className={`${input} mt-1 text-sm`} />
      </label>

      {mode === "whole" ? (
        <label className="block text-sm">
          <span className="text-ink-2">The whole {meta.label.toLowerCase()} in Markdown</span> <span className="text-xs text-ink-2">· each <code>## Heading</code> starts a section</span>
          <textarea id={`${docKey}-whole`} value={whole} onChange={(e) => { setWhole(e.target.value); touch(); }} rows={40} className={`${input} mt-1 font-mono text-xs leading-relaxed`} />
        </label>
      ) : (
        <>
          <nav aria-label="Sections" className="flex flex-wrap gap-1.5 text-xs">
            {secs.map((s, i) => <a key={s.id} href={`#sec-${s.id}`} className="border border-rule px-1.5 py-0.5 hover:border-ink">{numbered ? `${i + 1}. ` : ""}{s.title || "Untitled"}</a>)}
          </nav>
          <label className="block text-sm">
            <span className="text-ink-2">Opening text</span> <span className="text-xs text-ink-2">· before the first section</span>
            <textarea id={`${docKey}-intro`} value={intro} onChange={(e) => { setIntro(e.target.value); touch(); }} rows={rows(intro, 3)} className={`${input} mt-1 font-mono text-xs leading-relaxed`} />
          </label>
          <AddHere onAdd={() => add(0)} />
          {secs.map((s, i) => (
            <div key={s.id} className="grid gap-3">
              <section id={`sec-${s.id}`} className="scroll-mt-6 border border-rule bg-paper-2/40">
                <div className="flex flex-wrap items-center gap-2 border-b border-rule px-3 py-2">
                  {numbered && <span className="w-7 shrink-0 text-right text-sm tabular-nums text-ink-2">{i + 1}.</span>}
                  <input id={`sec-title-${s.id}`} aria-label={`Section ${i + 1} title`} value={s.title} placeholder="Section title" onChange={(e) => edit(s.id, { title: e.target.value })}
                    className="min-w-48 flex-1 border border-transparent bg-transparent px-1.5 py-1 text-base font-semibold outline-none hover:border-rule focus:border-accent focus:bg-paper" />
                  <span className="flex flex-wrap gap-1">
                    <button type="button" className={btn} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                    <button type="button" className={btn} onClick={() => move(i, 1)} disabled={i === secs.length - 1} aria-label="Move down">↓</button>
                    <button type="button" className={btn} onClick={() => edit(s.id, { open: !s.open })} aria-expanded={s.open}>{s.open ? "Close" : "Edit text"}</button>
                    {s.open && <button type="button" className={btn} onClick={() => edit(s.id, { preview: !s.preview })}>{s.preview ? "Write" : "Preview"}</button>}
                    <DeleteButton onDelete={() => remove(s.id)} />
                  </span>
                </div>
                {s.open ? (
                  <div className="p-3">
                    {s.preview ? <div className="type min-h-24 text-[15px]"><Markdown md={s.body || "*Nothing written yet.*"} /></div> : (
                      <textarea aria-label={`Section ${i + 1} text`} value={s.body} onChange={(e) => edit(s.id, { body: e.target.value })} rows={rows(s.body, 6)}
                        placeholder="Write in Markdown: blank lines between paragraphs, **bold**, *italic*, - lists, ### subheadings, | tables |"
                        className={`${input} font-mono text-xs leading-relaxed`} />
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={() => edit(s.id, { open: true })} className="block w-full px-3 py-2 text-left text-xs text-ink-2 hover:text-ink">
                    {s.body.trim() ? `${s.body.trim().replace(/\s+/g, " ").slice(0, 180)}${s.body.length > 180 ? "…" : ""}` : <i>No text yet.</i>}
                  </button>
                )}
              </section>
              <AddHere onAdd={() => add(i + 1)} />
            </div>
          ))}
        </>
      )}

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-rule bg-paper px-1 py-3">
        <button type="button" onClick={save} disabled={pending || !dirty} className="border border-ink bg-ink px-4 py-2 text-sm text-paper hover:bg-accent disabled:opacity-40">{pending ? "Saving…" : "Save and publish"}</button>
        <a href={meta.path} target="_blank" rel="noreferrer" className="text-sm underline decoration-rule underline-offset-2 hover:decoration-ink">View the {meta.label.toLowerCase()} ↗</a>
        {dirty && !msg.error && <span className="text-sm text-warn">Unsaved changes</span>}
        {msg.ok && <span className="text-sm text-ok">{msg.ok}</span>}
        {msg.error && <span role="alert" className="text-sm text-stamp">{msg.error}</span>}
        {renumbered && <span className="basis-full text-xs text-warn">Section numbers have changed. References in the text such as “§9” are not updated automatically.</span>}
      </div>
    </div>
  );
}

function AddHere({ onAdd }: { onAdd: () => void }) {
  return (
    <button type="button" onClick={onAdd} className="flex items-center gap-2 text-xs text-ink-2 hover:text-accent">
      <span className="h-px w-6 bg-rule" /> + Add a section here <span className="h-px w-6 bg-rule" />
    </button>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [ask, setAsk] = useState(false);
  return ask ? (
    <span className="flex items-center gap-1 text-xs">Delete this section? <button type="button" onClick={onDelete} className="border border-stamp px-2 py-0.5 text-stamp hover:bg-stamp hover:text-paper">Delete</button><button type="button" className={btn} onClick={() => setAsk(false)}>Keep</button></span>
  ) : <button type="button" className={`${btn} hover:border-stamp hover:text-stamp`} onClick={() => setAsk(true)}>Delete</button>;
}
