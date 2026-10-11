"use server";
import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type DecideState = { error?: string; ok?: boolean } | undefined;

const STATUS: Record<string, string> = { approve: "approved", reject: "rejected", revise: "revise", answer: "answered", reopen: "open" };

export async function decide(_: DecideState, fd: FormData): Promise<DecideState> {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const decision = String(fd.get("decision") ?? "");
  const note = String(fd.get("note") ?? "").trim() || null;
  const status = STATUS[decision];
  if (!id || !status) return { error: "Unknown decision." };
  if ((decision === "revise" || decision === "answer") && !note) return { error: decision === "answer" ? "Write your answer first." : "Say what should change." };
  const { error } = await supabaseAdmin().from("proposals").update(
    status === "open" ? { status, note: null, decided_by: null, decided_at: null } : { status, note, decided_by: admin.id, decided_at: new Date().toISOString() },
  ).eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { ok: true };
}

/* Approve every open, present item and whole-document marker in one doc.
   Questions are left alone: they need answers, not approval. */
export async function approveDocument(fd: FormData) {
  const admin = await requireAdmin();
  const path = String(fd.get("doc_path") ?? "");
  if (!path || fd.get("confirm") !== "yes") return;
  await supabaseAdmin().from("proposals").update({ status: "approved", decided_by: admin.id, decided_at: new Date().toISOString() })
    .eq("doc_path", path).eq("status", "open").eq("present", true).in("kind", ["document", "item"]);
  refresh();
}
