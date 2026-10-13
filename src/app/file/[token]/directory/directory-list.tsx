"use client";
import { useMemo, useState } from "react";

/* The directory as a list the player can search and narrow by department or
   by cohort. Grouped by department, alphabetical within each. */

export type Entry = { id: string; name: string; title: string | null; department: string; profile: string | null; newHire: boolean; you: boolean; supervisor: boolean };

export function DirectoryList({ entries }: { entries: Entry[] }) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("all");
  const depts = useMemo(() => [...new Set(entries.map((e) => e.department))].sort(), [entries]);
  const needle = q.trim().toLowerCase();
  const shown = entries.filter((e) =>
    (dept === "all" || (dept === "cohort" ? e.newHire : e.department === dept)) &&
    (!needle || [e.name, e.title, e.department, e.profile].some((v) => v?.toLowerCase().includes(needle))));
  const groups = depts.map((d) => [d, shown.filter((e) => e.department === d)] as const).filter(([, list]) => list.length);
  const chip = (key: string, label: string) => (
    <button key={key} type="button" onClick={() => setDept(key)} aria-pressed={dept === key}
      className={`shrink-0 border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${dept === key ? "border-ink bg-ink text-paper" : "border-rule text-ink-2 hover:border-ink hover:text-ink"}`}>{label}</button>
  );

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 mt-6 border-b border-rule bg-paper px-4 py-3 sm:mx-0 sm:px-0">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, title or department" aria-label="Search the directory"
          className="type w-full border-b-2 border-ink bg-transparent px-1 py-2 text-[15px] outline-none placeholder:text-ink-2/60 focus:border-red" />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {chip("all", `All · ${entries.length}`)}
          {chip("cohort", `New hires · ${entries.filter((e) => e.newHire).length}`)}
          {depts.map((d) => chip(d, d))}
        </div>
      </div>

      {groups.length ? (
        <div className="mt-6 space-y-10">
          {groups.map(([d, list]) => (
            <section key={d}>
              <h2 className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-1">
                <span className="display text-2xl">{d}</span><span className="font-mono text-xs text-ink-2">{list.length}</span>
              </h2>
              <ul>
                {list.map((e) => (
                  <li key={e.id} className={`border-b border-rule py-3 ${e.you ? "bg-paper-2 px-2" : ""}`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p>
                        <span className="type text-[16px]">{e.name}</span>
                        {e.you && <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red">You</span>}
                        {e.supervisor && <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red">Your supervisor</span>}
                        {e.newHire && !e.you && <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-ink-2">New hire</span>}
                        {e.title && <span className="block text-sm text-ink-2">{e.title}</span>}
                      </p>
                      {!e.you && <code className="shrink-0 text-xs text-ink-2">TO: {e.name}</code>}
                    </div>
                    {e.profile && <p className="mt-1.5 text-[13px] leading-relaxed">{e.profile}</p>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : <p className="mt-8 text-sm text-ink-2">No one on file matches.</p>}
    </>
  );
}
