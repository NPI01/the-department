"use server";
import { z } from "zod";
import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BUCKET, DRAWERS, GRADES, KINDS, STATUSES, slugify } from "@/lib/game/case-file";

/* Filing items into a character's Case File by hand. Whatever is filed is the
   character's own copy: write it as they would see it, and keep engine-side
   truth (what is forged, who really holds the original) out of every field. */

export type FileState = { ok?: string; error?: string } | undefined;

const Item = z.object({
  character_id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(48),
  kind: z.enum(KINDS),
  drawer: z.enum(DRAWERS as [string, ...string[]]),
  grade: z.enum(GRADES as [string, ...string[]]),
  from_label: z.string().trim().max(200),
  written_label: z.string().trim().max(80),
  written_on: z.string().trim().regex(/^(\d{4}-\d{2}-\d{2})?$/, "use YYYY-MM-DD"),
  round_received: z.string().trim().regex(/^\d*$/, "a round number"),
  how_obtained: z.string().trim().max(400),
  copy_note: z.string().trim().max(400),
  image_path: z.string().trim().max(300),
  caption: z.string().trim().max(400),
  body: z.string().max(60_000),
});

const s = (v: string) => v || null;

export async function fileItem(_: FileState, fd: FormData): Promise<FileState> {
  await requireAdmin();
  const parsed = Item.safeParse(Object.fromEntries(["character_id", "title", "slug", "kind", "drawer", "grade", "from_label", "written_label", "written_on", "round_received", "how_obtained", "copy_note", "image_path", "caption", "body"].map((k) => [k, String(fd.get(k) ?? "")])));
  if (!parsed.success) { const i = parsed.error.issues[0]; return { error: `Check ${String(i.path[0]).replace(/_/g, " ")}: ${i.message.toLowerCase()}.` }; }
  const f = parsed.data;
  const db = supabaseAdmin();
  const { data: ch } = await db.from("characters").select("id, campaign_id").eq("id", f.character_id).maybeSingle();
  if (!ch) return { error: "No such character." };
  const slug = slugify(f.slug || f.title);
  if (!slug || slug.startsWith("letter-")) return { error: "Pick a short name that doesn't start with “letter-”." };

  let imagePath = f.image_path;
  const upload = fd.get("image");
  if (upload instanceof File && upload.size > 0) {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(upload.type)) return { error: "Images must be JPEG, PNG, WebP or GIF." };
    if (upload.size > 3.8 * 1024 * 1024) return { error: "Images must be under 3.8 MB." };
    const ext = upload.type.split("/")[1].replace("jpeg", "jpg");
    imagePath = `${ch.campaign_id}/${ch.id}/${slug}-${Date.now()}.${ext}`;
    const { error } = await db.storage.from(BUCKET).upload(imagePath, upload, { contentType: upload.type });
    if (error) return { error: `Upload failed: ${error.message}` };
  }
  if (!f.body.trim() && !imagePath) return { error: "An item needs a text, an image, or both." };

  const { error } = await db.from("case_items").insert({
    campaign_id: ch.campaign_id, character_id: ch.id, slug, kind: f.kind, drawer: f.drawer, grade: f.grade, title: f.title,
    from_label: s(f.from_label), written_label: s(f.written_label), written_on: s(f.written_on), round_received: f.round_received ? Number(f.round_received) : null,
    how_obtained: s(f.how_obtained), copy_note: s(f.copy_note), image_path: s(imagePath), caption: s(f.caption), body: f.body.trim() || null,
  });
  if (error) return { error: error.code === "23505" ? `This character already holds an item called “${slug}”.` : error.message };
  refresh();
  return { ok: `Filed as ${slug}.` };
}

export async function updateItem(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const grade = String(fd.get("grade") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!GRADES.includes(grade as never) || !STATUSES.includes(status as never)) return;
  const round = String(fd.get("status_round") ?? "").trim();
  await supabaseAdmin().from("case_items").update({
    grade, status,
    status_note: status === "held" ? null : String(fd.get("status_note") ?? "").trim() || null,
    status_round: status === "held" || !/^\d+$/.test(round) ? null : Number(round),
  }).eq("id", id);
  refresh();
}

export async function deleteItem(fd: FormData) {
  await requireAdmin();
  if (fd.get("confirm") !== "yes") return;
  const db = supabaseAdmin();
  const { data } = await db.from("case_items").select("image_path").eq("id", String(fd.get("id") ?? "")).maybeSingle();
  if (data?.image_path && !data.image_path.startsWith("/")) await db.storage.from(BUCKET).remove([data.image_path]);
  await db.from("case_items").delete().eq("id", String(fd.get("id") ?? ""));
  refresh();
}
