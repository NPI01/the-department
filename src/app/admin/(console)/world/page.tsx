import { Suspense } from "react";
import { adminDb } from "@/lib/admin/auth";
import { fmtDateTime } from "@/lib/admin/format";
import { loadLivePlaces } from "@/lib/engine/grow";
import { placesFor } from "@/lib/engine/world";
import { A, Badge, Empty, Loading, PageHeader, Panel, Table, type Tone } from "../ui";
import { keepPerson, keepPlace, retire, runRequest } from "./actions";
import { OpenRequestForm } from "./form";

/* Overnight additions: what the living world wrote, what it held for a human,
   and what it could not do. docs/living-world-draft.md. */

export default function WorldPage() {
  return (
    <>
      <PageHeader kicker="The living world" title="Overnight additions">
        Where a player&apos;s order reached for a person or place the world did not have, the night wrote one. Auto-live unless the Skeptic flagged it; flagged drafts wait here. Retiring a person transfers them out of every cohort.
      </PageHeader>
      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}

const tone: Record<string, Tone> = { live: "ok", done: "ok", held: "warn", open: "accent", failed: "bad", retired: "muted" };
type Person = { id: string; slug: string; name: string; title: string | null; department_slug: string | null; public_profile: string; sheet: Record<string, unknown>; place_slug: string | null; status: string; origin: { campaign_id?: string; round?: number }; provenance: { models?: string[]; flags?: { rule: string; quote: string }[] }; created_at: string };
type Place = { id: string; slug: string; def: { name: string; visit: string; ask?: string; offCampus?: boolean; restricted?: boolean }; status: string; origin: { round?: number }; provenance: { flags?: { rule: string; quote: string }[] }; created_at: string };
type Req = { id: string; campaign_id: string; round: number; kind: string; place_slug: string | null; clause: string; verb: string; status: string; result: { note?: string; flags?: { rule: string; quote: string }[]; reused?: boolean } | null; created_at: string; characters: { name: string } | { name: string }[] | null };

async function Content() {
  const db = await adminDb();
  await loadLivePlaces(db);
  const [{ data: reqs }, { data: people }, { data: places }, { data: campaigns }] = await Promise.all([
    db.from("world_requests").select("*, characters(name)").order("created_at", { ascending: false }).limit(60),
    db.from("world_people").select("*").order("created_at", { ascending: false }).limit(60),
    db.from("world_places").select("*").order("created_at", { ascending: false }).limit(60),
    db.from("campaigns").select("id, title").order("created_at"),
  ]);
  const cname = new Map((campaigns ?? []).map((c) => [c.id as string, c.title as string]));
  const rs = (reqs ?? []) as unknown as Req[];
  const ps = (people ?? []) as unknown as Person[];
  const pls = (places ?? []) as unknown as Place[];
  const held = ps.filter((p) => p.status === "held").length + pls.filter((p) => p.status === "held").length;
  const flagList = (f?: { rule: string; quote: string }[]) => f?.length ? <ul className="mt-1 space-y-0.5 text-xs text-warn">{f.map((x, i) => <li key={i}>rule {x.rule}: “{x.quote}”</li>)}</ul> : null;
  const confirm = (id: string, kind: "person" | "place") => (
    <form action={retire} className="flex items-center gap-1.5 text-xs">
      <input type="hidden" name="id" value={id} /><input type="hidden" name="kind" value={kind} />
      <label className="flex items-center gap-1 text-ink-2"><input type="checkbox" name="confirm" value="yes" /> sure</label>
      <button className="text-stamp hover:underline">Retire</button>
    </form>
  );

  return (
    <div className="grid gap-4">
      {held > 0 && <p className="border border-warn px-3 py-2 text-sm text-warn">{held} addition{held === 1 ? "" : "s"} waiting on you: the Skeptic flagged the draft on both reads. Keep it if the flags are wrong, or retire it and the player&apos;s next try will write another.</p>}

      <Panel title={`People · ${ps.length}`}>
        {!ps.length ? <Empty>No one written yet. The first free-form order that goes to a place with nobody in it opens a request.</Empty> : (
          <div className="grid gap-3">
            {ps.map((p) => (
              <details key={p.id} className="border border-rule bg-paper-2/40 px-3 py-2" open={p.status === "held"}>
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
                  <Badge tone={tone[p.status] ?? "muted"}>{p.status}</Badge>
                  <b>{p.name}</b>{p.title ? `, ${p.title}` : ""} <span className="text-ink-2">· {p.department_slug ?? "off campus"} · at {p.place_slug ?? "—"} · {cname.get(p.origin.campaign_id ?? "") ?? "?"}, Round {p.origin.round ?? "?"} · {fmtDateTime(p.created_at)}</span>
                </summary>
                <p className="mt-2 text-sm">{p.public_profile}</p>
                {flagList(p.provenance.flags)}
                <pre className="mt-2 max-h-72 overflow-auto border border-rule bg-paper p-2 text-[11px] leading-snug">{JSON.stringify(p.sheet, null, 1)}</pre>
                <p className="mt-1 text-xs text-ink-2">Models: {(p.provenance.models ?? []).join(", ") || "—"} · short name <code>{p.slug}</code></p>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {p.status === "held" && <form action={keepPerson}><input type="hidden" name="id" value={p.id} /><button className="border border-ink px-2.5 py-1 text-xs hover:bg-ink hover:text-paper">Keep: make them live</button></form>}
                  {p.status !== "retired" && confirm(p.id, "person")}
                </div>
              </details>
            ))}
          </div>
        )}
      </Panel>

      <Panel title={`Places · ${pls.length}`}>
        {!pls.length ? <Empty>No places written yet.</Empty> : (
          <div className="grid gap-3">
            {pls.map((p) => (
              <details key={p.id} className="border border-rule bg-paper-2/40 px-3 py-2" open={p.status === "held"}>
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm"><Badge tone={tone[p.status] ?? "muted"}>{p.status}</Badge><b>{p.def.name}</b> <span className="text-ink-2">· <code>{p.slug}</code> · {p.def.offCampus ? "beyond the fence" : "on campus"}{p.def.restricted ? " · restricted" : ""} · Round {p.origin.round ?? "?"} · {fmtDateTime(p.created_at)}</span></summary>
                <p className="mt-2 text-sm">{p.def.visit}</p>
                {p.def.ask && <p className="mt-1 text-sm text-ink-2">Asked: {p.def.ask}</p>}
                {flagList(p.provenance.flags)}
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {p.status === "held" && <form action={keepPlace}><input type="hidden" name="id" value={p.id} /><button className="border border-ink px-2.5 py-1 text-xs hover:bg-ink hover:text-paper">Keep: make it live</button></form>}
                  {p.status !== "retired" && confirm(p.id, "place")}
                </div>
              </details>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <Panel title={`Requests · ${rs.length}`}>
          {!rs.length ? <Empty>None yet.</Empty> : (
            <Table head={["When", "Cohort · round", "Asked for", "By", "Status", ""]}>
              {rs.map((r) => {
                const who = Array.isArray(r.characters) ? r.characters[0] : r.characters;
                return (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap text-xs text-ink-2">{fmtDateTime(r.created_at)}</td>
                    <td className="text-xs">{cname.get(r.campaign_id) ?? "?"} · R{r.round}</td>
                    <td><span className="text-xs uppercase tracking-wider text-ink-2">{r.kind.replace(/_/g, " ")}{r.place_slug ? ` · ${r.place_slug}` : ""}</span><br />“{r.clause}”{r.result?.note && <><br /><span className="text-xs text-ink-2">{r.result.note}{r.result.reused ? " (reused)" : ""}</span></>}{flagList(r.result?.flags)}</td>
                    <td className="text-xs">{who?.name ?? "showrunner"}</td>
                    <td><Badge tone={tone[r.status] ?? "muted"}>{r.status}</Badge></td>
                    <td>{r.status !== "done" && <form action={runRequest}><input type="hidden" name="id" value={r.id} /><button className="border border-ink px-2 py-0.5 text-xs hover:bg-ink hover:text-paper">Run now</button></form>}</td>
                  </tr>
                );
              })}
            </Table>
          )}
          <p className="mt-3 text-xs text-ink-2">Run now takes a minute or two: two writer drafts and two Skeptic reads at most. The page refreshes when it is done.</p>
        </Panel>
        <Panel title="Open a request by hand">
          <OpenRequestForm campaigns={(campaigns ?? []).map((c) => ({ id: c.id as string, title: c.title as string }))} places={placesFor(99).map((p) => ({ slug: p.slug, name: p.name }))} />
          <p className="mt-3 text-xs text-ink-2">For a gap the engine missed, or one from before it existed (Building 7 in The Pilot). The player who asked is not told; they meet the person the next time they go there. See <A href="/admin/casting">Casting</A> for the result.</p>
        </Panel>
      </div>
    </div>
  );
}
