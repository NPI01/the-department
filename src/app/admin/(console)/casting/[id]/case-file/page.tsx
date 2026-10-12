import { Suspense } from "react";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/admin/auth";
import { GRADES, STATUSES, STATUS_LABEL, letterKey } from "@/lib/game/case-file";
import { A, Badge, Empty, Loading, PageHeader, Panel, Table } from "../../../ui";
import { deleteItem, updateItem } from "./actions";
import { FileItemForm } from "./form";

/* What a character holds in their Case File, and the form to file more. The
   player's notes are private and never shown here. */

export default function CaseFileAdmin({ params }: PageProps<"/admin/casting/[id]/case-file">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

type Row = { id: string; slug: string; kind: string; drawer: string; title: string; grade: string; status: string; status_note: string | null; status_round: number | null; round_received: number | null; image_path: string | null };

async function Content({ params }: { params: PageProps<"/admin/casting/[id]/case-file">["params"] }) {
  const { id } = await params;
  const db = await adminDb();
  const { data: c } = await db.from("characters").select("id, name, campaign_id, player_id").eq("id", id).maybeSingle();
  if (!c) notFound();
  const [{ data: items }, { data: letters }, { count: notes }] = await Promise.all([
    db.from("case_items").select("id, slug, kind, drawer, title, grade, status, status_note, status_round, round_received, image_path").eq("character_id", id).order("created_at"),
    db.from("correspondence").select("id, subject, from_character").eq("campaign_id", c.campaign_id).not("from_character", "is", null)
      .or(`from_character.eq.${id},to_characters.cs.{${id}},cc_characters.cs.{${id}}`).order("received_at").limit(500),
    db.from("case_notes").select("id", { count: "exact", head: true }).eq("character_id", id),
  ]);
  const rows = (items ?? []) as Row[];
  const sel = "border border-rule bg-paper-2 px-1.5 py-1 text-xs";

  return (
    <>
      <PageHeader kicker={<><A href={`/admin/casting/${c.id}`}>{c.name}</A> · Case File</>} title="Case File">
        The character&apos;s own copies: documents, photographs, maps and findings filed here, plus every letter they sent or received (filed automatically).
        Write each item as the character would see it; never put engine-side truth in a field. {notes ?? 0} private note{notes === 1 ? "" : "s"} (not shown).
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <div className="grid content-start gap-4">
          <Panel title={`Filed items · ${rows.length}`}>
            {!rows.length ? <Empty>Nothing filed yet.</Empty> : (
              <Table head={["Short name", "Item", "Round", "Grade · status", ""]}>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td><code className="text-xs">{r.slug}</code></td>
                    <td>{r.title}<br /><span className="text-xs text-ink-2">{r.kind} · {r.drawer}{r.image_path ? " · image" : ""}</span></td>
                    <td className="tabular-nums">{r.round_received ?? "—"}</td>
                    <td>
                      <form action={updateItem} className="flex flex-wrap items-center gap-1.5">
                        <input type="hidden" name="id" value={r.id} />
                        <select name="grade" defaultValue={r.grade} aria-label="Grade" className={sel}>{GRADES.map((g) => <option key={g}>{g}</option>)}</select>
                        <select name="status" defaultValue={r.status} aria-label="Status" className={sel}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
                        <input name="status_round" defaultValue={r.status_round ?? ""} placeholder="round" aria-label="Status round" className={`${sel} w-14`} />
                        <input name="status_note" defaultValue={r.status_note ?? ""} placeholder="what happened (player sees this)" aria-label="Status note" className={`${sel} min-w-40 flex-1`} />
                        <button className="border border-ink px-2 py-1 text-xs hover:bg-ink hover:text-paper">Save</button>
                      </form>
                    </td>
                    <td>
                      <form action={deleteItem} className="flex items-center gap-1.5 text-xs">
                        <input type="hidden" name="id" value={r.id} />
                        <label className="flex items-center gap-1 text-ink-2"><input type="checkbox" name="confirm" value="yes" /> sure</label>
                        <button className="text-stamp hover:underline">Remove</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
            <p className="mt-3 text-xs text-ink-2">To take an item away in the fiction (handed over, seized, stolen, destroyed), change its status: the player keeps a dashed folder and their notes. Remove only fixes filing mistakes.</p>
          </Panel>
          <Panel title={`Letters · ${letters?.length ?? 0}`}>
            {!letters?.length ? <Empty>No letters yet.</Empty> : (
              <ul className="space-y-1 text-sm">{letters.map((l) => <li key={l.id}><code className="text-xs">{letterKey(l.id)}</code> {l.subject ?? "(no subject)"} {l.from_character === id && <Badge>sent</Badge>}</li>)}</ul>
            )}
          </Panel>
        </div>
        <Panel title="File a new item">
          <FileItemForm characterId={c.id} />
        </Panel>
      </div>
    </>
  );
}
