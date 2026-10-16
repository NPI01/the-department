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
  // Long lines wrap under the label so the cost column stays put.
  const W = 52;
  const wrap = (t: string) => t.split(/\s+/).reduce<string[]>((ls, word) => {
    const last = ls[ls.length - 1];
    if (last !== undefined && (last + " " + word).length <= W) ls[ls.length - 1] = last + " " + word; else ls.push(word);
    return ls;
  }, []);
  const w = Math.min(W, Math.max(...options.map((o) => Math.max(...wrap(o.label).map((l) => l.length)))));
  const rows = options.flatMap((o) => { const [first, ...more] = wrap(o.label); return [`  ${o.code}.  ${first.padEnd(w + 2)}${String(o.cost).padStart(3)} AU`, ...more.map((l) => `      ${l}`)]; });
  return [
    `YOUR ORDERS FOR TONIGHT`,
    `You have ${au} Action Units. Orders lock at 8:00 PM Eastern.`,
    ``,
    ...rows,
    `  X.  Something else. Write ORDER: and what you want to attempt;`,
    `      the cost is ruled in the morning.`,
    `  H.  Hold. Keep your units and stay watchful at your desk.  +5 AU`,
    ``,
    `HOW TO SUBMIT`,
    `Reply to this message. Put each choice on its own line, for example:`,
    ``,
    `    A`,
    `    C`,
    `    ORDER: Ask the night guard at Gate 2 who signs for the helicopter.`,
    `    IF anyone requests the motor pool log THEN C`,
    ``,
    `An IF line is a trip-wire: it is carried out only if its condition comes`,
    `about tonight, and its units come back if it does not. HOLD EXCEPT <name>`,
    `lets a colleague pass your watch. Anything else you write is a note to the`,
    `clerk and is not acted on. You may reply again before 8:00 PM; your latest`,
    `reply replaces the earlier one. The Department answers every reply with a`,
    `receipt. Reply HELP for every line the clerk reads.`,
  ].join("\n");
}

/* The clerk's quick reference, sent on HELP and kept in step with the rulebook (§13). */
export function renderHelp(first: string) {
  return [
    `${first}, these are the lines the clerk reads. Each goes at the start of its`,
    `own line, in any reply to The Department. Everything else is a note.`,
    ``,
    `TONIGHT'S ORDERS (cost Action Units; lock at 8:00 PM Eastern)`,
    `  A                                a lettered option from the morning's list`,
    `  ORDER: <what you want to do>     anything else, in your own words`,
    `  IF <condition> THEN <order>      a trip-wire: done only if the condition`,
    `                                   comes about tonight; units back if not.`,
    `                                   Conditions: <name or anyone> requests <file>;`,
    `                                   <name or anyone> is seen at <place>;`,
    `                                   <name or anyone> watches <place>;`,
    `                                   <name or anyone> reports me;`,
    `                                   <ballot number> passes / fails`,
    `  ORDER: RESEARCH <subject>        the library's brief, in your Case File by morning`,
    `  ORDER: REQUISITION <item>        a camera, a recorder, a truck or a badge from stores`,
    `  ORDER: OBTAIN <file> / <item> FROM <name>   take what you are not entitled to; 8 AU`,
    `  ORDER: PROTECT my desk | <item> | <file> | myself   a guard for the night; 4 AU`,
    `  FALLBACK: <order>                done only if the order above it fails`,
    `  HOLD                             keep your units, +5 AU; while you hold you`,
    `                                   learn who pulled your department's files`,
    `                                   and who reported you`,
    `  HOLD EXCEPT <name>, <name>       hold, but let these colleagues pass`,
    ``,
    `STANDING (free; stay until changed; the person named is never told)`,
    `  AUTHORIZE <name>                 they may pull your department's files`,
    `  REVOKE <name>                    they may not`,
    `  ATTITUDE <name>: FRIENDLY        as AUTHORIZE, and your watch lets them pass`,
    `  ATTITUDE <name>: HOSTILE         any sighting of them in your reports goes`,
    `                                   to Security the same night`,
    `  ATTITUDE <name>: NEUTRAL         nothing automatic either way`,
    ``,
    `PAPERWORK AND VOTES (free)`,
    `  VOTE B-77-003: FOR               FOR, AGAINST or ABSTAIN; VOTE E-…: <surname>`,
    `  SEND <item> TO <name>            a copy from your Case File to a colleague`,
    `  FILE <item> WITH <committee>     evidence before a body, on the record`,
    `  FORM 14-B                        a blank company form`,
    `  ACCEPT INVITATION / DECLINE INVITATION`,
    ``,
    `THE PRESS`,
    `  ORDER: LEAK <item>               a copy to the Minot Daily News for its next`,
    `                                   issue (days 7 and 14); 6 AU, 2 more for each`,
    `                                   further leak this episode`,
    ``,
    `OTHER`,
    `  DIRECTORY                        who you can write to`,
    `  HELP                             this letter`,
    `  RESIGN                           leave the game`,
    ``,
    `Say "also" to add to what is on file; otherwise a new reply replaces it.`,
    ``,
    `— The Department`,
    ``,
    renderFooter(),
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
    renderFooter(),
  ].join("\n");
}

export const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://weird.delivery";

export function renderFooter() {
  return [
    `———`,
    `Help: ${SITE}/help · Rules: ${SITE}/rules · Field guide: ${SITE}/guide`,
    `Lines the clerk reads: A–D · ORDER: · IF … THEN … · FALLBACK: · HOLD [EXCEPT <name>]`,
    `· VOTE · AUTHORIZE / REVOKE <name> · ATTITUDE <name>: FRIENDLY|NEUTRAL|HOSTILE`,
    `· SEND … TO … · FILE … WITH … · FORM · DIRECTORY · HELP · RESIGN`,
    `Weird.Delivery · thedepartment@weird.delivery`,
  ].join("\n");
}

export type DirectoryEntry = { name: string; title: string | null; division: string | null; address: string };
export function renderDirectory(p: { first: string; cohort: DirectoryEntry[]; staff: DirectoryEntry[]; offCampus?: DirectoryEntry[]; committees: string[] }) {
  const row = (e: DirectoryEntry) => `  ${e.name}${e.title ? `, ${e.title}` : ""}${e.division ? ` — ${e.division}` : ""}\n      ${e.address}`;
  return [
    `PERSONNEL DIRECTORY · STATION R`,
    ``,
    `${p.first}, here is the directory as of this morning.`,
    ``,
    `HOW TO WRITE TO SOMEONE`,
    `Send an ordinary email from your own address. Any of these reach the person:`,
    `  • Address it to them: put fisk@weird.delivery in your To field.`,
    `  • Reply to any Department letter and begin with their name: "Mr. Fisk,"`,
    `  • Or start the letter with a line "To: Mr. Fisk" (several names, separated`,
    `    by commas, to write to more than one).`,
    `Use your mail program's Subject line as usual; you need not type To: or Re:`,
    `in the body. Staff reply as themselves, usually within the hour, sometimes the`,
    `next morning. Letters cost nothing; only orders cost Action Units.`,
    ``,
    `YOUR COHORT`,
    ...(p.cohort.length ? p.cohort.map(row) : [`  (you are the first to arrive)`]),
    ``,
    `STAFF`,
    ...p.staff.map(row),
    ``,
    ...(p.offCampus?.length ? [`OFF CAMPUS`, `Not Royce employees. They answer when they feel like it, on their own paper,`, `and they owe you nothing.`, ...p.offCampus.map(row), ``] : []),
    `COMMITTEES`,
    ...p.committees.map((c) => `  ${c}`),
    ``,
    renderFooter(),
  ].join("\n");
}

export type LedgerLine = { label: string; cost: number; estimated: boolean; funded: boolean };
export function renderReceipt(p: { first: string; round: number; onFile: string[]; added: string[]; replaced: boolean; ignored: string[]; notes: number; lockAt: string; nothingFound: boolean; ledger: LedgerLine[]; balance: number }) {
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
  if (p.ledger.length) {
    const w = Math.max(...p.ledger.map((l) => l.label.length), 10);
    const funded = p.ledger.filter((l) => l.funded); const unfunded = p.ledger.filter((l) => !l.funded);
    const spent = funded.reduce((n, l) => n + l.cost, 0);
    out.push(`ACTION UNITS`);
    for (const l of funded) out.push(`  ${l.label.padEnd(w + 2)}${String(l.cost).padStart(3)}${l.estimated ? " est." : ""}`);
    out.push(`  ${"".padEnd(w + 2)}———`, `  ${"on hand".padEnd(w + 2)}${String(p.balance).padStart(3)}`, `  ${"spent".padEnd(w + 2)}${String(spent).padStart(3)}`, `  ${"remaining".padEnd(w + 2)}${String(p.balance - spent).padStart(3)}`);
    if (unfunded.length) {
      out.push(``, `BEYOND YOUR BALANCE — these will not be carried out unless you drop`, `something before the lock:`);
      for (const l of unfunded) out.push(`  ${l.label.padEnd(w + 2)}${String(l.cost).padStart(3)}${l.estimated ? " est." : ""}`);
    }
    if (p.ledger.some((l) => l.estimated)) out.push(``, `Free-form orders are costed in the morning; ${p.ledger.filter((l) => l.estimated).length === 1 ? "an estimate is" : "estimates are"} carried for now.`);
    out.push(``);
  }
  if (p.notes) out.push(`Your ${p.notes === 1 ? "note was" : "notes were"} read and filed; ${p.notes === 1 ? "it is" : "they are"} not orders.`);
  out.push(`These lock at ${p.lockAt}. Reply again before then to change them. Say "also" to add; otherwise a new reply replaces the list.`, ``, `— The Department`, ``, renderFooter());
  return out.join("\n");
}

export function textToHtml(text: string) {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<div style="background:#efe6d4;padding:24px"><pre style="margin:0;font-family:ui-monospace,Menlo,Consolas,'Courier New',monospace;font-size:14px;line-height:1.45;color:#141210;white-space:pre-wrap">${esc}</pre></div>`;
}
