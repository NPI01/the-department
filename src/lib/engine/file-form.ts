/* Filing a company form. One path for both ways a form arrives (an email reply
   with numbered answers, or the hosted page in the player's file):
     correspondence row (the player's statement, immutable)
     correspondence_events  form_submission (the parsed answers)
     knowledge              the owning office and any addressee remember it
     case_items             the player's copy, in their Case File, stamped RECEIVED
     events                 form.filed (idempotent per correspondence)
     a receipt by mail; for a web filing, a staff reply is queued too. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { FORMS, type FormSubmission } from "./forms";
import { gameDate, siteUrl, type Letter, type LetterLinks } from "@/lib/email/letter";
import { gameMailbox, newMessageId, sendMail } from "@/lib/email/resend";
import { renderFooter, replyAddress, textToHtml } from "./dispatch";
import { renderFormReceipt, summarizeSubmission } from "./forms";
import { slugify } from "@/lib/game/case-file";
import { scoreLedgerStatement } from "./ledger";

function hashKey(text: string): string {
  let h = 5381; const t = text.toLowerCase().replace(/\s+/g, " ").trim();
  for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/* The filled form as plain text: the body of the correspondence row for a web filing. */
export function renderFilledFormText(s: FormSubmission): string {
  const f = FORMS[s.form];
  return [`FORM ${f.id}`, ...f.questions.map((q) => `${q.n}. ${s.answers[q.n] ?? "—"}`)].join("\n");
}

/* The filled form as canon Markdown: the player's copy in the Case File. */
export function renderFilledFormMarkdown(s: FormSubmission, p: { index: string; receivedOn: string; receivedBy: string }): string {
  const f = FORMS[s.form];
  const out = [
    `**ROYCE INDUSTRIES · ${f.owner.toUpperCase()}**`, ``,
    `**FORM ${f.id} (${f.revision}) · ${f.title}**`, ``,
    ...f.instructions.map((l) => `*${l}*`), ``,
    `---`, ``,
  ];
  for (const q of f.questions) out.push(`**${q.n}. ${q.text.replace(/ \(Added Rev\. 9\/77\.\)$/, "")}**`, ``, s.answers[q.n]?.trim() || `*(not answered)*`, ``);
  out.push(`---`, ``, `**FOR ${f.owner.toUpperCase()} USE ONLY**`, ``, `Received by: ${p.receivedBy} · Date: ${p.receivedOn} · Index No.: ${p.index}`, ``, `Disposition: — pending`);
  return out.join("\n");
}

/* The blank form as a letter from the owning office, with a link to the hosted page. */
export function blankFormLetter(id: string, p: { to: { name: string; title: string | null }; date: string; particulars?: string | null; fileToken: string | null; links: LetterLinks }): Letter {
  const f = FORMS[id];
  const url = p.fileToken ? `${siteUrl()}/file/${p.fileToken}/forms/${f.id}` : null;
  return {
    kind: "form",
    label: `Form ${f.id}`,
    subject: `Form ${f.id} · ${f.shortTitle}`,
    preheader: `${f.owner} requires this form. ${url ? "Fill it in on your personnel file, or reply with numbered answers." : "Reply with numbered answers."}`,
    from: { name: f.owner, department: "Royce Industries" },
    to: p.to,
    date: p.date,
    classification: "Internal",
    body: [...f.instructions, ...f.questions.map((q) => `${q.n}. ${q.text}`)].join("\n\n"),
    sections: [
      ...(p.particulars ? [{ heading: "Your particulars, from Personnel", body: p.particulars }] : []),
      { heading: `For ${f.owner} use only`, body: f.officeUse.join("\n") },
      { heading: "To file this form", body: [url ? `The quickest way is the form on your personnel file (the button below). Your answers are filed the moment you submit and a copy goes into your Case File.` : null, `Or reply to this message with FORM ${f.id} on a line by itself, then your answers, each beginning with its number. An answer may run to several lines. Question ${f.questions.length} is your signature: type your full name.`, `Filing a form costs nothing and is not an order. The office that owns it is told, and its staff remember what you wrote.`].filter(Boolean).join("\n\n") },
    ],
    cta: url ? { href: url, label: `Fill in Form ${f.id}` } : null,
    links: p.links,
  };
}

export type FiledForm = { index: string; caseSlug: string; correspondenceId: string; already: boolean };

export async function fileForm(db: SupabaseClient, p: { campaignId: string; characterId: string; submission: FormSubmission; correspondenceId: string | null; source: "email" | "web"; toCharacters?: string[] }): Promise<FiledForm> {
  const s = p.submission; const def = FORMS[s.form];
  if (!def) throw new Error(`unknown form ${s.form}`);
  const { data: round } = await db.from("rounds").select("id, number").eq("campaign_id", p.campaignId).order("number", { ascending: false }).limit(1).maybeSingle();
  const roundNo = round?.number ?? 1;
  const { data: ch } = await db.from("characters").select("id, slug, name, title, players(email, mail_token, file_token, display_name)").eq("id", p.characterId).single();
  const player = (ch as { players?: { email: string; mail_token: string; file_token: string | null; display_name: string | null } | null } | null)?.players ?? null;
  const first = (player?.display_name || ch?.name || "there").split(" ")[0];
  // Who owns the form: that office's staff. Plus whoever the letter was addressed to.
  const { data: owners } = await db.from("characters").select("id, divisions!inner(name)").eq("campaign_id", p.campaignId).is("player_id", null).eq("divisions.name", def.owner);
  const ownerIds = (owners ?? []).map((o) => o.id as string);

  // The statement itself. A web filing has no letter yet, so one is written for it.
  let correspondenceId = p.correspondenceId;
  if (!correspondenceId) {
    const { data: row, error } = await db.from("correspondence").insert({
      campaign_id: p.campaignId, round_id: round?.id ?? null, direction: "inbound", message_id: newMessageId(), from_character: p.characterId, from_address: player?.email ?? null,
      to_characters: ownerIds, to_addresses: [gameMailbox().address], subject: `Form ${def.id}`, body_text: renderFilledFormText(s), trusted: true,
      raw: { letter_kind: "form", source: "web" }, auth: { trusted: true, source: "file-token" },
    }).select("id").single();
    if (error) throw new Error(error.message);
    correspondenceId = row.id as string;
  }
  const key = `form:${correspondenceId}`;
  const { data: dup } = await db.from("events").select("payload").eq("idempotency_key", key).maybeSingle();
  if (dup) { const v = dup.payload as { index: string; case_slug: string }; return { index: v.index, caseSlug: v.case_slug, correspondenceId, already: true }; }

  const { count } = await db.from("events").select("id", { count: "exact", head: true }).eq("campaign_id", p.campaignId).eq("kind", "form.filed");
  const index = `S-77-${String((count ?? 0) + 1).padStart(3, "0")}`;
  const caseSlug = slugify(`form ${def.id} ${index}`);
  const receivedOn = gameDate(roundNo);

  await db.from("correspondence_events").insert({ correspondence_id: correspondenceId, kind: "form_submission", payload: { form: s.form, index, answers: s.answers, signed: s.signed, missing: s.missing, round: roundNo, source: p.source }, confidence: 1, span: null, provenance: { parser: "deterministic", source: p.source } });

  const readers = new Set<string>([...(p.toCharacters ?? []), ...ownerIds]);
  const summary = summarizeSubmission(s, index);
  if (readers.size) await db.from("knowledge").insert([...readers].map((rid) => ({ character_id: rid, fact_key: `told:${ch?.slug ?? "unknown"}:form:${s.form}:${hashKey(index)}`, value: { kind: "form", text: summary, from: p.characterId, from_name: ch?.name ?? null, round: roundNo, form: s.form, index }, confidence: 1, source_kind: "told", source_ref: correspondenceId, learned_round: roundNo })));

  await db.from("case_items").upsert({
    campaign_id: p.campaignId, character_id: p.characterId, slug: caseSlug, kind: "document", drawer: "documents",
    title: `Form ${def.id} · ${def.shortTitle} · ${index}`,
    from_label: ch?.name ?? null, written_label: receivedOn, written_on: new Date(Date.UTC(1977, 9, 10 + roundNo - 1)).toISOString().slice(0, 10),
    body: renderFilledFormMarkdown(s, { index, receivedOn, receivedBy: "The Department (clerk)" }),
    round_received: roundNo, how_obtained: p.source === "web" ? "You filled it in on your personnel file." : "You filed it by letter.",
    copy_note: `Your copy, as filed${s.missing.length ? ` (incomplete: ${s.missing.join(", ")})` : ""}. The office-use box is updated as ${def.owner} acts on it.`,
    grade: "evidence", status: "held",
  }, { onConflict: "character_id,slug" });

  await db.from("events").insert({ campaign_id: p.campaignId, round_id: round?.id ?? null, phase: "intake", kind: "form.filed", payload: { correspondence_id: correspondenceId, form: s.form, index, missing: s.missing, signed: s.signed, character: p.characterId, source: p.source, case_slug: caseSlug }, idempotency_key: key, visible_to: [p.characterId] });
  // Form 22 is scored against the ledger the engine holds, and may go to the sheriff (ledger.ts).
  if (s.form === "22") await scoreLedgerStatement(db, { campaignId: p.campaignId, roundId: round?.id ?? null, roundNo, characterId: p.characterId, characterSlug: (ch?.slug as string) ?? "unknown", characterName: (ch?.name as string) ?? "An employee", submission: s, index });

  if (player?.email) {
    const from = replyAddress(player.mail_token);
    const fileLink = player.file_token ? `\n\nYour copy is in your Case File: ${siteUrl()}/file/${player.file_token}/case` : "";
    const text = renderFormReceipt({ first, form: s.form, index, round: roundNo, missing: s.missing, signed: s.signed, owner: def.owner }) + fileLink + "\n\n" + renderFooter();
    await sendMail({ to: player.email, from, replyTo: from, subject: `Form ${s.form} filed · ${index}`, text, html: textToHtml(text) });
  }
  // A form filed on the web was not addressed to anyone; the office that owns it answers.
  if (p.source === "web" && ownerIds.length) {
    const { data: last } = await db.from("correspondence").select("from_character").eq("campaign_id", p.campaignId).in("from_character", ownerIds).contains("to_characters", [p.characterId]).order("received_at", { ascending: false }).limit(1).maybeSingle();
    const npc = (last?.from_character as string | undefined) ?? ownerIds[0];
    await db.from("jobs").insert({ kind: "npc_reply", payload: { correspondence_id: correspondenceId, character_id: npc }, run_after: new Date(Date.now() + (2 + Math.random() * 4) * 60_000).toISOString() });
  }
  return { index, caseSlug, correspondenceId, already: false };
}
