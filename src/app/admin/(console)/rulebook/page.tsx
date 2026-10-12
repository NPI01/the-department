import { Suspense } from "react";
import { adminDb } from "@/lib/admin/auth";
import { fmtDateTime } from "@/lib/admin/format";
import { DEFAULT_BANNER, PUBLIC_DOCS, draftForPlayers } from "@/lib/public/docs";
import { A, Badge, Empty, Loading, PageHeader, Panel } from "../ui";
import { resetToDraft, restoreRevision } from "./actions";
import { RulebookEditor } from "./editor";

/* The player-facing rulebook, editable. Until the first save, players see the
   repo draft (docs/rulebook-draft.md, synced on deploy); after it, they see
   what is saved here. */

export default function RulebookPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const db = await adminDb();
  const [{ data: edited }, { data: draft }, { data: revisions }, { data: admins }] = await Promise.all([
    db.from("published_docs").select("banner, content, updated_at, updated_by").eq("key", "rules").maybeSingle(),
    db.from("canon_docs").select("content, synced_at, git_sha").eq("path", PUBLIC_DOCS.rules).maybeSingle(),
    db.from("published_doc_revisions").select("id, note, saved_at, saved_by").eq("key", "rules").order("saved_at", { ascending: false }).limit(15),
    db.from("admins").select("id, email"),
  ]);
  const who = new Map((admins ?? []).map((a) => [a.id as string, (a.email as string).split("@")[0]]));
  const content = edited?.content ?? (draft ? draftForPlayers(draft.content) : "");
  const banner = edited ? edited.banner ?? "" : DEFAULT_BANNER.rules ?? "";
  const draftNewer = edited && draft && draft.synced_at > edited.updated_at && draft.git_sha;

  return (
    <>
      <PageHeader kicker={<>Players see it at <A href="/rules">/rules</A></>} title="Rulebook">
        {edited
          ? <><Badge tone="accent">edited here</Badge> Last saved {fmtDateTime(edited.updated_at)}{edited.updated_by ? ` by ${who.get(edited.updated_by) ?? "an admin"}` : ""}. Players see this version.</>
          : <><Badge>repo draft</Badge> Players see <code>{PUBLIC_DOCS.rules}</code>{draft ? `, synced ${fmtDateTime(draft.synced_at)}` : ""}. Your first save publishes your version in its place.</>}
      </PageHeader>

      {draftNewer && (
        <p className="mb-4 border border-warn px-3 py-2 text-sm text-warn">
          The repo draft was synced after your last save ({fmtDateTime(draft.synced_at)}). Players keep seeing your edited version; changes made to <code>{PUBLIC_DOCS.rules}</code> since then don&apos;t reach them unless you copy them in here.
        </p>
      )}

      {content ? <RulebookEditor initialContent={content} initialBanner={banner} /> : <Empty>No rulebook draft has been synced yet. Run <code>pnpm canon:sync</code>.</Empty>}

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <Panel title="Earlier versions">
          {!revisions?.length ? <Empty>No saves yet.</Empty> : (
            <ul className="divide-y divide-rule/60 text-sm">
              {revisions.map((r, i) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                  <span><span className="tabular-nums text-ink-2">#{r.id}</span> {fmtDateTime(r.saved_at)} · {r.saved_by ? who.get(r.saved_by) ?? "admin" : "—"} · <span className="text-ink-2">{r.note}</span></span>
                  {i === 0 && edited ? <Badge tone="ok">current</Badge> : (
                    <form action={restoreRevision}><input type="hidden" name="id" value={r.id} /><button className="border border-ink px-2 py-0.5 text-xs hover:bg-ink hover:text-paper">Restore</button></form>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ink-2">Restoring publishes that version straight away. Nothing is deleted: every save and restore is kept here.</p>
        </Panel>
        {edited && (
          <Panel title="Go back to the repo draft">
            <p className="text-sm text-ink-2">Players would see <code>{PUBLIC_DOCS.rules}</code> again. Your edited text stays in Earlier versions and can be restored.</p>
            <form action={resetToDraft} className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="confirm" value="yes" required /> Stop publishing my edits</label>
              <button className="border border-stamp px-2.5 py-1 text-xs text-stamp hover:bg-stamp hover:text-paper">Use the repo draft</button>
            </form>
          </Panel>
        )}
      </div>
    </>
  );
}
