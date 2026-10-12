import { Suspense } from "react";
import Link from "next/link";
import { adminDb } from "@/lib/admin/auth";
import { TEMPLATES } from "@/lib/email/templates";
import { fmtDateTime } from "@/lib/admin/format";
import { Badge, Loading, PageHeader, Panel } from "../ui";

export default function MailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const db = await adminDb();
  const { data } = await db.from("mail_templates").select("key, updated_at");
  const edited = new Map(((data ?? []) as { key: string; updated_at: string }[]).map((r) => [r.key, r.updated_at]));
  const groups: { title: string; status: "live" | "planned"; note: string }[] = [
    { title: "In use", status: "live", note: "The game sends these today." },
    { title: "Ready for the engine", status: "planned", note: "Written and previewable; the engine step that sends them is not built yet." },
  ];
  return (
    <>
      <PageHeader kicker="Mail" title="Email templates">
        Every message the game sends uses the Royce letterhead (<code>src/lib/email/letter.ts</code>): tables and inline styles, no images,
        web fonts where the client allows, a plain-text part, and the out-of-character footer with the personnel file, rulebook and field guide.
        Edit the copy here; the defaults live in <code>src/lib/email/templates.ts</code>.
      </PageHeader>
      {groups.map((g) => (
        <Panel key={g.status} title={g.title} className="mb-4">
          <p className="mb-3 text-xs text-ink-2">{g.note}</p>
          <ul className="divide-y divide-rule/60">
            {TEMPLATES.filter((t) => t.status === g.status).map((t) => (
              <li key={t.key} className="grid gap-x-6 gap-y-1 py-3 md:grid-cols-[16rem_1fr_10rem]">
                <div>
                  <Link href={`/admin/mail/${t.key}`} className="font-semibold underline decoration-rule underline-offset-2 hover:decoration-ink">{t.name}</Link>
                  <p className="text-xs text-ink-2"><code>{t.key}</code> · {t.kind}</p>
                </div>
                <div className="text-sm">
                  <p>{t.description}</p>
                  <p className="mt-0.5 text-xs text-ink-2">Sent by {t.usedBy} · {t.player ? "to players" : "to applicants"}</p>
                </div>
                <div className="text-xs md:text-right">
                  {edited.has(t.key) ? <><Badge tone="accent">edited</Badge><p className="mt-1 text-ink-2">{fmtDateTime(edited.get(t.key))}</p></> : <Badge>default copy</Badge>}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </>
  );
}
