"use server";
import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

/* The one switch: a cohort's room runs in shadow (decides, logs, commits
   nothing) or live. Going live asks for a tick that the shadow log was read. */
export async function setMode(fd: FormData) {
  await requireAdmin();
  const campaign = String(fd.get("campaign_id") ?? ""); const mode = String(fd.get("mode") ?? "");
  if (!campaign || !["shadow", "live"].includes(mode)) return;
  if (mode === "live" && fd.get("confirm") !== "yes") return;
  await supabaseAdmin().from("rules").upsert({ campaign_id: campaign, key: "room.mode", value: mode, enacted_by: "admin" }, { onConflict: "campaign_id,key" });
  refresh();
}
