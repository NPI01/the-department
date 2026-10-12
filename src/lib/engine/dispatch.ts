/* The morning dispatch and the order menu it carries.

   Order entry, as the player experiences it: the dispatch lists lettered,
   costed options and a free-form line. The player replies; each line that is
   a letter picks an option, each ORDER: line is a free-form attempt, HOLD
   conserves, VOTE casts. The latest reply before the lock replaces the
   previous one, and every reply gets a receipt. The menu offered to a
   character for a round is recorded as an event so the reply can be
   resolved deterministically. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { emailDomain } from "@/lib/email/resend";

export type MenuOption = { code: string; verb: string; args: string; label: string; cost: number };

export function replyAddress(mailToken: string) {
  return `The Department <thedepartment+${mailToken}@${emailDomain()}>`;
}

export async function recordMenu(db: SupabaseClient, campaignId: string, roundId: string, characterId: string, options: MenuOption[]) {
  await db.from("events").upsert({
    campaign_id: campaignId, round_id: roundId, phase: "open", kind: "menu.offered",
    payload: { character_id: characterId, options }, idempotency_key: `menu:${roundId}:${characterId}`, visible_to: [characterId],
  }, { onConflict: "idempotency_key" });
}

export async function menuFor(db: SupabaseClient, roundId: string, characterId: string): Promise<MenuOption[]> {
  const { data } = await db.from("events").select("payload").eq("idempotency_key", `menu:${roundId}:${characterId}`).maybeSingle();
  return ((data?.payload as { options?: MenuOption[] } | null)?.options) ?? [];
}

export function renderMenu(options: MenuOption[], au: number) {
  const w = Math.max(...options.map((o) => o.label.length));
  const rows = options.map((o) => `  ${o.code}.  ${o.label.padEnd(w + 2)}${String(o.cost).padStart(3)} AU`);
  return [
    `YOUR ORDERS FOR TONIGHT`,
    `You have ${au} Action Units. Orders lock at 8:00 PM Eastern.`,
    ``,
    ...rows,
    `  X.  Something else. Write ORDER: and what you want to attempt;`,
    `      the cost is ruled in the morning.`,
    `  H.  Hold. Keep your units; standing orders continue.  +5 AU`,
    ``,
    `HOW TO SUBMIT`,
    `Reply to this message. Put each choice on its own line, for example:`,
    ``,
    `    A`,
    `    C`,
    `    ORDER: Ask the night guard at Gate 2 who signs for the helicopter.`,
    ``,
    `Anything else you write is a note to the clerk and is not acted on.`,
    `You may reply again before 8:00 PM; your latest reply replaces the`,
    `earlier one. The Department answers every reply with a receipt.`,
  ].join("\n");
}

export function renderDispatch(p: { first: string; date: string; round: number; episode: string; narrative: string; overnight: string[]; menu: string; signature?: string }) {
  return [
    `THE DEPARTMENT · WEIRD.DELIVERY`,
    `${p.date} · Round ${p.round} of 14 · ${p.episode}`,
    ``,
    `${p.first},`,
    ``,
    p.narrative,
    ``,
    `WHAT ARRIVED OVERNIGHT`,
    ...p.overnight.map((l) => `  • ${l}`),
    ``,
    p.menu,
    ``,
    p.signature ?? `— Personnel & Administration, Royce Industries`,
    ``,
    `Weird.Delivery · you are receiving this because you applied to The Department. Reply RESIGN to leave the game.`,
  ].join("\n");
}

export function renderReceipt(p: { first: string; round: number; onFile: string[]; added: string[]; replaced: boolean; ignored: string[]; notes: number; lockAt: string; nothingFound: boolean }) {
  const out: string[] = [`Received, ${p.first}.`, ``];
  if (p.nothingFound) {
    out.push(`No orders were found in your reply, so nothing changed.`, ``,
      `To choose from tonight's list, put the letter on its own line (A), or say it`,
      `plainly ("let's do A and C"). For anything else, start a line with ORDER:.`, ``);
  } else if (p.added.length) {
    out.push(`Added to what was on file:`, ...p.added.map((r) => `  + ${r}`), ``);
  } else if (p.replaced) {
    out.push(`Your earlier orders for tonight were replaced.`, ``);
  }
  if (p.ignored.length) out.push(`Not acted on:`, ...p.ignored.map((r) => `  · ${r}`), ``);
  out.push(`On file for Round ${p.round}:`, ...(p.onFile.length ? p.onFile.map((r, i) => `  ${i + 1}. ${r}`) : [`  (nothing yet)`]), ``);
  if (p.notes) out.push(`Your ${p.notes === 1 ? "note was" : "notes were"} read and filed; ${p.notes === 1 ? "it is" : "they are"} not orders.`);
  out.push(`These lock at ${p.lockAt}. Reply again before then to change them. Say "also" to add; otherwise a new reply replaces the list.`, ``, `— The Department`);
  return out.join("\n");
}

export function textToHtml(text: string) {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<div style="background:#efe6d4;padding:24px"><pre style="margin:0;font-family:ui-monospace,Menlo,Consolas,'Courier New',monospace;font-size:14px;line-height:1.45;color:#141210;white-space:pre-wrap">${esc}</pre></div>`;
}
