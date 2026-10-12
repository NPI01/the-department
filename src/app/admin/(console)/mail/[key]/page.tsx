import { Suspense } from "react";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/admin/auth";
import { loadTemplate } from "@/lib/email/template-store";
import { templateByKey } from "@/lib/email/templates";
import { fmtDateTime } from "@/lib/admin/format";
import { A, Badge, Loading, PageHeader } from "../../ui";
import { TemplateEditor } from "./editor";
import { resetTemplate } from "../actions";

export default function TemplatePage({ params }: PageProps<"/admin/mail/[key]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/admin/mail/[key]">["params"] }) {
  const { key } = await params;
  if (!templateByKey(key)) notFound();
  const db = await adminDb();
  const { def, fields, edited } = await loadTemplate(db, key);
  return (
    <>
      <PageHeader kicker={<><A href="/admin/mail">Email templates</A> · <code>{def.key}</code></>} title={def.name}>
        {def.status === "live" ? <Badge tone="ok">in use</Badge> : <Badge tone="warn">ready for the engine</Badge>}{" "}
        {def.description} Sent by {def.usedBy}.{" "}
        {edited ? <>Edited {fmtDateTime(edited.at)}.</> : "Default copy."}
      </PageHeader>
      <TemplateEditor def={def} initial={fields} />
      {edited && (
        <form action={resetTemplate} className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule pt-4 text-sm">
          <input type="hidden" name="key" value={def.key} />
          <label className="flex items-center gap-2"><input type="checkbox" name="confirm" value="yes" required /> Discard my edits and restore the default copy</label>
          <button className="border border-stamp px-2.5 py-1 text-xs text-stamp hover:bg-stamp hover:text-paper">Reset to default</button>
        </form>
      )}
    </>
  );
}
