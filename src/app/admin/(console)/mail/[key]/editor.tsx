"use client";
import { useActionState, useMemo, useState } from "react";
import { renderSample, type TemplateDef, type TemplateFields } from "@/lib/email/templates";
import { saveTemplate, sendTest } from "../actions";

const LABELS: { key: keyof TemplateFields; label: string; hint?: string; rows?: number }[] = [
  { key: "subject", label: "Subject" },
  { key: "label", label: "Stamp", hint: "Blank uses the default for this kind of document." },
  { key: "classification", label: "Classification", hint: "Printed in red in the routing block. Blank omits it." },
  { key: "fromName", label: "From" },
  { key: "fromTitle", label: "From: title or department" },
  { key: "date", label: "Date line", hint: "Blank uses the in-game date where there is one." },
  { key: "preheader", label: "Inbox preview line", hint: "Blank uses the start of the body." },
  { key: "body", label: "Body", hint: "Blank lines separate paragraphs. A line starting “## ” begins a section.", rows: 14 },
  { key: "signatureName", label: "Signature" },
  { key: "signatureTitle", label: "Signature: second line" },
];

const input = "mt-1 w-full border border-rule bg-paper px-2 py-1.5 text-sm outline-none focus:border-accent";
const btn = "border px-3 py-1.5 text-xs disabled:opacity-50";

export function TemplateEditor({ def, initial }: { def: TemplateDef; initial: TemplateFields }) {
  const [fields, setFields] = useState<TemplateFields>(initial);
  const [view, setView] = useState<"desktop" | "phone" | "text">("desktop");
  const [saved, saveAction, saving] = useActionState(saveTemplate, undefined);
  const [tested, testAction, testing] = useActionState(sendTest, undefined);
  const preview = useMemo(() => renderSample(def, fields), [def, fields]);
  const dirty = JSON.stringify(fields) !== JSON.stringify(initial);
  const set = (k: keyof TemplateFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFields({ ...fields, [k]: e.target.value });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form action={saveAction} className="min-w-0 space-y-3">
        <input type="hidden" name="key" value={def.key} />
        {LABELS.map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="text-ink-2">{f.label}</span>
            {f.rows
              ? <textarea name={f.key} value={fields[f.key]} onChange={set(f.key)} rows={f.rows} className={`${input} font-mono text-[13px] leading-relaxed`} />
              : <input name={f.key} value={fields[f.key]} onChange={set(f.key)} className={input} />}
            {f.hint && <span className="mt-0.5 block text-xs text-ink-2">{f.hint}</span>}
          </label>
        ))}
        <div className="border border-rule p-3 text-xs">
          <p className="mb-1 uppercase tracking-wider text-ink-2">Variables the sender fills in</p>
          <ul className="space-y-0.5">{def.vars.map((v) => <li key={v.name}><code>{`{{${v.name}}}`}</code> <span className="text-ink-2">— {v.about}</span></li>)}</ul>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button disabled={saving} className={`${btn} border-ink bg-ink text-paper hover:opacity-90`}>{saving ? "Saving…" : "Save"}</button>
          <button formAction={testAction} disabled={testing} className={`${btn} border-ink hover:bg-ink hover:text-paper`}>{testing ? "Sending…" : "Send a test to me"}</button>
          <button type="button" disabled={!dirty} onClick={() => setFields(initial)} className={`${btn} border-rule text-ink-2 hover:border-ink`}>Undo changes</button>
          {dirty && <span className="text-xs text-warn">Unsaved changes</span>}
        </div>
        {saved?.ok && !dirty && <p className="text-xs text-ok">{saved.ok}</p>}
        {saved?.error && <p className="text-xs text-stamp">{saved.error}</p>}
        {tested?.ok && <p className="text-xs text-ok">{tested.ok}</p>}
        {tested?.error && <p className="text-xs text-stamp">{tested.error}</p>}
      </form>

      <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          {(["desktop", "phone", "text"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} className={`border px-2 py-0.5 ${view === v ? "border-ink bg-ink text-paper" : "border-rule text-ink-2 hover:border-ink"}`}>
              {v === "desktop" ? "Desktop" : v === "phone" ? "Phone" : "Plain text"}
            </button>
          ))}
          <span className="ml-auto truncate text-ink-2">Subject: {preview.subject}</span>
        </div>
        {view === "text"
          ? <pre style={{ maxHeight: "78vh" }} className="overflow-auto whitespace-pre-wrap border border-rule bg-paper p-3 text-xs">{preview.text}</pre>
          : <iframe title="Preview" srcDoc={preview.html} style={{ height: "78vh", minHeight: 560 }} className={`border border-rule bg-white ${view === "phone" ? "w-[375px] max-w-full" : "w-full"}`} />}
        <p className="mt-2 text-xs text-ink-2">Previewed with sample values. Links point at the live site.</p>
      </div>
    </div>
  );
}
