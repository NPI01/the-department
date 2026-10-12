"use server";
import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DOC_META, isPublicDocKey, publicDocTag, type PublicDocKey } from "@/lib/public/docs";

/* Editing the player-facing documents (rulebook, field guide). Saving
   publishes: the page shows the new text on its next request. Every change
   writes a revision first, so nothing is lost. */

async function publish(KEY: PublicDocKey, adminId: string, banner: string | null, content: string, note: string) {
  const db = supabaseAdmin();
  const { error: e1 } = await db.from("published_doc_revisions").insert({ key: KEY, banner, content, note, saved_by: adminId });
  if (e1) return e1.message;
  const { error: e2 } = await db.from("published_docs").upsert({ key: KEY, banner, content, updated_by: adminId, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (e2) return e2.message;
  updateTag(publicDocTag(KEY));
  return null;
}

export async function saveDoc(key: PublicDocKey, input: { banner: string; content: string }): Promise<{ ok?: string; error?: string }> {
  const admin = await requireAdmin();
  if (!isPublicDocKey(key)) return { error: "Unknown document." };
  const content = input.content.trim();
  if (!content) return { error: `The ${DOC_META[key].label.toLowerCase()} can't be empty.` };
  if (content.length > 400_000) return { error: "That's longer than the editor accepts (400,000 characters)." };
  const error = await publish(key, admin.id, input.banner.trim() || null, content + "\n", "saved");
  if (error) return { error };
  refresh();
  return { ok: `Saved. ${DOC_META[key].path} shows it now.` };
}

export async function restoreRevision(fd: FormData) {
  const admin = await requireAdmin();
  const KEY = fd.get("key");
  if (!isPublicDocKey(KEY)) return;
  const id = Number(fd.get("id"));
  const { data: rev } = await supabaseAdmin().from("published_doc_revisions").select("id, banner, content").eq("key", KEY).eq("id", id).maybeSingle();
  if (!rev) return;
  await publish(KEY, admin.id, rev.banner, rev.content, `restored from #${rev.id}`);
  refresh();
}

/* Players go back to the repo draft. The edited text stays in the revisions. */
export async function resetToDraft(fd: FormData) {
  const admin = await requireAdmin();
  const KEY = fd.get("key");
  if (fd.get("confirm") !== "yes" || !isPublicDocKey(KEY)) return;
  const db = supabaseAdmin();
  const { data: cur } = await db.from("published_docs").select("banner, content").eq("key", KEY).maybeSingle();
  if (!cur) return;
  await db.from("published_doc_revisions").insert({ key: KEY, banner: cur.banner, content: cur.content, note: "set aside: reset to repo draft", saved_by: admin.id });
  await db.from("published_docs").delete().eq("key", KEY);
  updateTag(publicDocTag(KEY));
  refresh();
}
