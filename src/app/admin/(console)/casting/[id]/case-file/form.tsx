"use client";
import { useActionState } from "react";
import { DRAWERS, GRADES, KINDS } from "@/lib/game/case-file";
import { fileItem } from "./actions";

const input = "mt-1 w-full border border-rule bg-paper-2 px-2.5 py-1.5 text-sm outline-none focus:border-accent";
const DEFAULT_DRAWER: Record<string, string> = { letter: "correspondence", memo: "correspondence", photograph: "photographs", map: "maps", diagram: "documents", finding: "findings" };

export function FileItemForm({ characterId }: { characterId: string }) {
  const [state, action, pending] = useActionState(fileItem, undefined);
  const field = (name: string, label: string, hint?: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block text-sm"><span className="text-ink-2">{label}</span>{hint && <span className="text-xs text-ink-2"> · {hint}</span>}<input name={name} className={input} {...props} /></label>
  );
  return (
    <form action={action} className="space-y-3" onChange={(e) => {
      const t = e.target as unknown as HTMLSelectElement;
      if (t.name === "kind") { const d = t.form?.elements.namedItem("drawer") as HTMLSelectElement | null; if (d) d.value = DEFAULT_DRAWER[t.value] ?? "documents"; }
    }}>
      <input type="hidden" name="character_id" value={characterId} />
      {field("title", "Title", "as the player sees it", { required: true })}
      {field("slug", "Short name", "for orders; blank = from the title", { placeholder: "pgs-69-044" })}
      <div className="grid grid-cols-3 gap-2">
        {([["kind", KINDS, "document"], ["drawer", DRAWERS, "documents"], ["grade", GRADES, "intelligence"]] as const).map(([n, opts, d]) => (
          <label key={n} className="block text-sm"><span className="capitalize text-ink-2">{n}</span>
            <select name={n} defaultValue={d} className={input}>{opts.map((o) => <option key={o}>{o}</option>)}</select>
          </label>
        ))}
      </div>
      {field("from_label", "From", "author or maker, as the copy shows")}
      <div className="grid grid-cols-2 gap-2">
        {field("written_label", "Date as written", undefined, { placeholder: "13–14 Oct 1921" })}
        {field("written_on", "Date for sorting", undefined, { type: "date" })}
      </div>
      {field("round_received", "Round received", undefined, { inputMode: "numeric" })}
      {field("how_obtained", "How they got it", "player sees this", { placeholder: "Engineering Archives, in reply to your file request" })}
      {field("copy_note", "Their copy", "player sees this", { placeholder: "Copy 2 of 4, Tier 3. Routing carbon attached." })}
      <label className="block text-sm"><span className="text-ink-2">Text</span><span className="text-xs text-ink-2"> · canon Markdown; ``` for typed headers</span>
        <textarea name="body" rows={10} className={`${input} font-mono text-xs`} />
      </label>
      <label className="block text-sm"><span className="text-ink-2">Image upload</span><span className="text-xs text-ink-2"> · JPEG/PNG/WebP, under 3.8 MB, stored privately</span>
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-1 block w-full text-xs" />
      </label>
      {field("image_path", "…or a site image", undefined, { placeholder: "/images/tagus-church-1.jpg" })}
      {field("caption", "Caption")}
      <button disabled={pending} className="border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper disabled:opacity-50">{pending ? "Filing…" : "File it"}</button>
      {state?.ok && <p className="text-sm text-ok">{state.ok}</p>}
      {state?.error && <p className="text-sm text-stamp">{state.error}</p>}
    </form>
  );
}
