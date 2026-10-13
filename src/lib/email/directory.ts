/* The Personnel Directory as a Royce document: the letterhead frame, each
   department a ruled section, every person a row with name, title and the
   mailbox that reaches them. The plain-text part is the same list typed out. */
import { C, DISPLAY, MONO, TYPE, esc, renderLetter, type LetterLinks } from "./letter";
import type { DirectoryEntry } from "@/lib/engine/dispatch";

export type DirectoryInput = {
  first: string;
  to: { name: string; title?: string | null };
  date: string;
  cohort: DirectoryEntry[];
  staff: DirectoryEntry[];
  offCampus: DirectoryEntry[];
  committees: string[];
  mailbox: string;              // the game's one address
  links: LetterLinks;
};

/* Most staff do not know what the Department does; its people are listed under the Executive Office. */
const dept = (d: string | null) => (d && /special research/i.test(d) ? "Executive Office" : d ?? "Other");

function personRow(e: DirectoryEntry, you = false) {
  return `<tr>
    <td class="stack" valign="top" style="padding:7px 0;border-bottom:1px dotted ${C.rule};">
      <span style="font-family:${TYPE};font-size:15px;line-height:1.4;color:${C.ink};">${esc(e.name)}</span>${you ? ` <span style="font-family:${MONO};font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.red};">you</span>` : ""}
      ${e.title ? `<br><span style="font-family:${TYPE};font-size:13px;line-height:1.4;color:${C.ink2};">${esc(e.title)}</span>` : ""}
    </td>
    <td class="stack" valign="top" align="right" width="200" style="padding:7px 0;border-bottom:1px dotted ${C.rule};text-align:right;">
      <a href="mailto:${esc(e.address)}" style="font-family:${MONO};font-size:12px;letter-spacing:0.5px;color:${C.red};text-decoration:none;white-space:nowrap;">${esc(e.address)}</a>
    </td>
  </tr>`;
}

function section(heading: string, note: string | null, rows: string) {
  return `
  <p style="margin:26px 0 0 0;padding-bottom:5px;border-bottom:2px solid ${C.ink};font-family:${DISPLAY};font-size:15px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:${C.ink};">${esc(heading)}</p>
  ${note ? `<p style="margin:8px 0 2px 0;font-family:${TYPE};font-size:13px;line-height:1.5;color:${C.ink2};">${esc(note)}</p>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows}</table>`;
}

export function renderDirectoryLetter(p: DirectoryInput): { subject: string; html: string; text: string } {
  const depts = [...new Set(p.staff.map((e) => dept(e.division)))].sort((a, b) => (a === "Executive Office" ? -1 : b === "Executive Office" ? 1 : a.localeCompare(b)));
  const howTo = `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 0 0;">
    <tr><td style="padding:14px 16px;border:1px solid ${C.ink};background-color:${C.paper2};">
      <p style="margin:0 0 8px 0;font-family:${DISPLAY};font-size:12px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:${C.red};">How to write to someone</p>
      <p style="margin:0 0 6px 0;font-family:${TYPE};font-size:13px;line-height:1.55;color:${C.ink};">Send an ordinary email from your own address. Any of these reach the person:</p>
      <p style="margin:0 0 4px 12px;font-family:${TYPE};font-size:13px;line-height:1.55;color:${C.ink};">&bull; put their mailbox in your To field, e.g. <span style="font-family:${MONO};color:${C.red};">fisk@weird.delivery</span></p>
      <p style="margin:0 0 4px 12px;font-family:${TYPE};font-size:13px;line-height:1.55;color:${C.ink};">&bull; reply to any Department letter and begin with their name: &ldquo;Mr. Fisk,&rdquo;</p>
      <p style="margin:0 0 8px 12px;font-family:${TYPE};font-size:13px;line-height:1.55;color:${C.ink};">&bull; or start the letter with a line <span style="font-family:${MONO};">To: Mr. Fisk</span> (several names, separated by commas, to write to more than one)</p>
      <p style="margin:0;font-family:${TYPE};font-size:13px;line-height:1.55;color:${C.ink2};">Use your mail program&rsquo;s Subject line as usual; you need not type To: or Re: in the body. Staff reply as themselves, usually within the hour, sometimes the next morning. Letters cost nothing; only orders cost Action Units.</p>
    </td></tr>
  </table>`;
  const bodyHtml = [
    `<p style="margin:0 0 14px 0;font-family:${TYPE};font-size:15px;line-height:1.65;color:${C.ink};">${esc(p.first)}, here is the directory as of this morning. Keep it; it is reissued when the roster changes.</p>`,
    howTo,
    section("Your cohort", null, p.cohort.length ? p.cohort.map((e) => personRow(e, e.name === p.to.name)).join("") : `<tr><td style="padding:7px 0;font-family:${TYPE};font-size:13px;color:${C.ink2};">You are the first to arrive.</td></tr>`),
    ...depts.map((d) => section(d, null, p.staff.filter((e) => dept(e.division) === d).map((e) => personRow(e)).join(""))),
    p.offCampus.length ? section("Off campus", "Not Royce employees. They answer when they feel like it, on their own paper, and they owe you nothing.", p.offCampus.map((e) => personRow({ ...e, title: e.title ?? e.division })).join("")) : "",
    section("Committees", null, p.committees.map((c) => `<tr><td style="padding:7px 0;border-bottom:1px dotted ${C.rule};font-family:${TYPE};font-size:15px;color:${C.ink};">${esc(c)}</td></tr>`).join("")),
    `<p style="margin:22px 0 0 0;font-family:${MONO};font-size:11px;line-height:1.6;letter-spacing:1px;color:${C.ink2};">Reply DIRECTORY to any Department mail for a fresh copy. All mail passes through ${esc(p.mailbox)}.</p>`,
  ].join("\n");

  // Plain text: the same list, typed.
  const row = (e: DirectoryEntry) => `  ${e.name}${e.title ? `, ${e.title}` : ""}\n      ${e.address}`;
  const text = [
    `${p.first}, here is the directory as of this morning. Keep it; it is reissued when the roster changes.`, ``,
    `HOW TO WRITE TO SOMEONE`,
    `Send an ordinary email from your own address. Any of these reach the person:`,
    `  • Address it to them: put fisk@weird.delivery in your To field.`,
    `  • Reply to any Department letter and begin with their name: "Mr. Fisk,"`,
    `  • Or start the letter with a line "To: Mr. Fisk" (several names, separated`,
    `    by commas, to write to more than one).`,
    `Use your mail program's Subject line as usual; you need not type To: or Re:`,
    `in the body. Staff reply as themselves, usually within the hour, sometimes the`,
    `next morning. Letters cost nothing; only orders cost Action Units.`, ``,
    `YOUR COHORT`, ...(p.cohort.length ? p.cohort.map(row) : [`  (you are the first to arrive)`]), ``,
    ...depts.flatMap((d) => [d.toUpperCase(), ...p.staff.filter((e) => dept(e.division) === d).map(row), ``]),
    ...(p.offCampus.length ? [`OFF CAMPUS`, `Not Royce employees. They answer when they feel like it, on their own paper,`, `and they owe you nothing.`, ...p.offCampus.map(row), ``] : []),
    `COMMITTEES`, ...p.committees.map((c) => `  ${c}`), ``,
    `Reply DIRECTORY to any Department mail for a fresh copy. All mail passes through ${p.mailbox}.`,
  ].join("\n");

  const subject = "Personnel Directory · Station R";
  const out = renderLetter({ kind: "directory", subject, preheader: "Your cohort, the staff you can write to, the people off campus, and the committees.", from: { name: "Personnel & Administration", department: "Royce Industries" }, to: p.to, date: p.date, body: text, bodyHtml, links: p.links });
  return { subject, ...out };
}
