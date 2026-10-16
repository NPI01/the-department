"use server";
import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { growRequest, instantiate, loadLivePlaces, type WorldRequest } from "@/lib/engine/grow";
import { placesFor } from "@/lib/engine/world";

/* The showrunner's hand on the living world: keep or retire what the night
   wrote, run a request now, open one by hand. */

export async function keepPerson(fd: FormData) {
  const admin = await requireAdmin();
  const db = supabaseAdmin();
  const id = String(fd.get("id") ?? "");
  const { data: w } = await db.from("world_people").select("id, origin").eq("id", id).maybeSingle();
  if (!w) return;
  await db.from("world_people").update({ status: "live", decided_by: admin.id, decided_at: new Date().toISOString() }).eq("id", id);
  const origin = w.origin as { campaign_id?: string; request_id?: string };
  if (origin.campaign_id) await instantiate(db, id, origin.campaign_id);
  if (origin.request_id) await db.from("world_requests").update({ status: "done" }).eq("id", origin.request_id);
  refresh();
}

export async function keepPlace(fd: FormData) {
  const admin = await requireAdmin();
  const db = supabaseAdmin();
  const id = String(fd.get("id") ?? "");
  const { data: w } = await db.from("world_places").select("origin").eq("id", id).maybeSingle();
  if (!w) return;
  await db.from("world_places").update({ status: "live", decided_by: admin.id, decided_at: new Date().toISOString() }).eq("id", id);
  const origin = w.origin as { request_id?: string };
  if (origin.request_id) await db.from("world_requests").update({ status: "done" }).eq("id", origin.request_id);
  refresh();
}

/* Retiring a person: every cohort's copy is "transferred"; letters to them bounce in-world. */
export async function retire(fd: FormData) {
  const admin = await requireAdmin();
  if (fd.get("confirm") !== "yes") return;
  const db = supabaseAdmin();
  const id = String(fd.get("id") ?? ""); const kind = String(fd.get("kind") ?? "");
  const at = new Date().toISOString();
  if (kind === "person") {
    await db.from("world_people").update({ status: "retired", decided_by: admin.id, decided_at: at }).eq("id", id);
    await db.from("characters").update({ status: "retired" }).eq("world_person_id", id);
  } else {
    await db.from("world_places").update({ status: "retired", decided_by: admin.id, decided_at: at }).eq("id", id);
  }
  refresh();
}

/* Run one request now (open, held or failed) instead of waiting for a lock. */
export async function runRequest(fd: FormData) {
  await requireAdmin();
  const db = supabaseAdmin();
  const id = String(fd.get("id") ?? "");
  const { data: r } = await db.from("world_requests").select("*").eq("id", id).maybeSingle();
  if (!r) return;
  await loadLivePlaces(db);
  await db.from("world_requests").update({ status: "open", result: null }).eq("id", id);
  await growRequest(db, r as WorldRequest);
  refresh();
}

/* Open a request by hand: a person at a known place, or a new place from a clause. */
export async function openRequest(_: { ok?: string; error?: string } | undefined, fd: FormData): Promise<{ ok?: string; error?: string }> {
  await requireAdmin();
  const db = supabaseAdmin();
  const campaign = String(fd.get("campaign_id") ?? ""); const kind = String(fd.get("kind") ?? ""); const clause = String(fd.get("clause") ?? "").trim(); const place = String(fd.get("place_slug") ?? "").trim();
  if (!campaign || !clause) return { error: "A campaign and the words of the order are needed." };
  if (kind === "person_at_place") { await loadLivePlaces(db); if (!placesFor(99).some((p) => p.slug === place)) return { error: `No place with the short name “${place}”.` }; }
  const { data: round } = await db.from("rounds").select("id, number").eq("campaign_id", campaign).order("number", { ascending: false }).limit(1).maybeSingle();
  const { error } = await db.from("world_requests").insert({ campaign_id: campaign, round_id: round?.id ?? null, round: round?.number ?? 0, kind, place_slug: kind === "person_at_place" ? place : null, clause, verb: kind === "person_at_place" ? "interview" : "visit" });
  if (error) return { error: error.message };
  refresh();
  return { ok: "Opened. Run it from the list, or let the next lock take it." };
}
