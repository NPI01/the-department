import { adminDb } from "./auth";

/* Console reads for canon review and episode plans. Canon itself lives in git;
   scripts/canon-sync.ts copies it here. */

export type Proposal = {
  id: string; key: string; doc_path: string; kind: "document" | "item" | "question"; heading: string | null; text: string; line: number | null;
  present: boolean; status: "open" | "approved" | "rejected" | "revise" | "answered"; note: string | null;
  decided_by: string | null; decided_at: string | null; first_seen_at: string; last_seen_at: string;
};
export type CanonDoc = { path: string; title: string; tier: "public" | "secret" | "draft"; content: string; sha: string; git_sha: string | null; synced_at: string };

/* open: awaiting a decision · decided: decided, text not yet changed · applied: decided and gone from the text · retired: gone undecided */
export type View = "open" | "decided" | "applied" | "all";

export async function getProposals({ view = "open", doc, tier }: { view?: View; doc?: string; tier?: string }) {
  const db = await adminDb();
  let q = db.from("proposals").select("*").order("doc_path").order("line");
  if (view === "open") q = q.eq("status", "open").eq("present", true);
  if (view === "decided") q = q.neq("status", "open").eq("present", true);
  if (view === "applied") q = q.neq("status", "open").eq("present", false);
  if (doc) q = q.eq("doc_path", doc);
  if (tier === "public") q = q.like("doc_path", "canon/%").not("doc_path", "like", "canon/secret/%");
  if (tier === "secret") q = q.like("doc_path", "canon/secret/%");
  if (tier === "draft") q = q.like("doc_path", "docs/%");
  const { data } = await q.limit(500);
  return (data ?? []) as Proposal[];
}

export async function getReviewSummary() {
  const db = await adminDb();
  const [{ data: rows }, { data: docs }] = await Promise.all([
    db.from("proposals").select("doc_path, kind, status, present"),
    db.from("canon_docs").select("path, title, tier, synced_at, git_sha").order("path"),
  ]);
  const all = (rows ?? []) as Pick<Proposal, "doc_path" | "kind" | "status" | "present">[];
  const perDoc = new Map<string, { open: number; decided: number }>();
  for (const r of all) {
    const d = perDoc.get(r.doc_path) ?? { open: 0, decided: 0 };
    if (r.present && r.status === "open") d.open++;
    if (r.present && r.status !== "open") d.decided++;
    perDoc.set(r.doc_path, d);
  }
  const count = (f: (r: (typeof all)[number]) => boolean) => all.filter(f).length;
  return {
    open: count((r) => r.present && r.status === "open"),
    openQuestions: count((r) => r.present && r.status === "open" && r.kind === "question"),
    decided: count((r) => r.present && r.status !== "open"),
    applied: count((r) => !r.present && r.status !== "open"),
    docs: ((docs ?? []) as Pick<CanonDoc, "path" | "title" | "tier" | "synced_at" | "git_sha">[]).map((d) => ({ ...d, ...(perDoc.get(d.path) ?? { open: 0, decided: 0 }) })),
    lastSync: ((docs ?? []) as { synced_at: string; git_sha: string | null }[]).reduce<{ at: string | null; sha: string | null }>((m, d) => (!m.at || d.synced_at > m.at ? { at: d.synced_at, sha: d.git_sha } : m), { at: null, sha: null }),
  };
}

export async function getCanonDoc(path: string) {
  const db = await adminDb();
  const { data } = await db.from("canon_docs").select("*").eq("path", path).maybeSingle();
  return data as CanonDoc | null;
}

export async function getCanonDocs(paths: string[]) {
  const db = await adminDb();
  const { data } = await db.from("canon_docs").select("*").in("path", paths);
  return (data ?? []) as CanonDoc[];
}

/* Docs belonging to one episode, by the episode-NN convention in their file names. */
export async function getEpisodeDocs(n: number) {
  const db = await adminDb();
  const nn = String(n).padStart(2, "0");
  const { data } = await db.from("canon_docs").select("*").like("path", `%episode-${nn}-%`).order("path");
  return (data ?? []) as CanonDoc[];
}

export async function getEpisodeDocIndex() {
  const db = await adminDb();
  const { data } = await db.from("canon_docs").select("path").like("path", "%episode-%");
  const m = new Map<number, string[]>();
  for (const { path } of (data ?? []) as { path: string }[]) {
    const n = Number(path.match(/episode-(\d+)/)?.[1]);
    if (n) m.set(n, [...(m.get(n) ?? []), path]);
  }
  return m;
}

export async function openProposalCount(paths: string[]) {
  if (!paths.length) return 0;
  const db = await adminDb();
  const { count } = await db.from("proposals").select("id", { count: "exact", head: true }).in("doc_path", paths).eq("status", "open").eq("present", true);
  return count ?? 0;
}
