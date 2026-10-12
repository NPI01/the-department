/* The game's letterhead. Every message the game sends goes through here, so it
   looks like a 1977 Royce document and carries the same out-of-character
   footer: the player's personnel file, the rulebook, the field guide.

   Built for the lowest common denominator of mail clients:
   - tables for layout, inline styles only (Gmail strips <style> in some views;
     the one <style> block is progressive enhancement: mobile and dark mode)
   - no images, so nothing is lost when images are blocked
   - web fonts (Special Elite, Oswald) where the client loads them (Apple Mail,
     iOS, Thunderbird); everywhere else Courier New and Arial Narrow/Arial
   - MSO conditionals hold the width in Outlook for Windows
   - a plain-text part with the same structure and links */

export type LetterKind = "letter" | "memo" | "dispatch" | "notice";

export type Letter = {
  kind: LetterKind;
  label?: string | null;                    // overrides the document label in the stamp, e.g. "Correspondence" for an outsider
  subject: string;
  preheader?: string;                       // inbox preview line
  from: { name: string; title?: string | null; department?: string | null };
  to?: { name: string; title?: string | null } | null;
  date?: string | null;                     // the in-game date line, e.g. "Tuesday, October 11, 1977"
  classification?: string | null;           // INTERNAL, CONFIDENTIAL, LIMITED DISTRIBUTION, ...
  round?: { number: number; episode?: number | null; episodeRound?: number | null; locksAt?: string | null } | null;
  body: string;                             // plain text; blank lines separate paragraphs
  sections?: { heading: string; body: string }[];
  signature?: { name: string; title?: string | null } | null;
  links: LetterLinks;
};

export type LetterLinks = { file?: string | null; rules: string; guide: string };

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://weird.delivery").replace(/\/$/, "");
}

export function letterLinks(fileToken?: string | null): LetterLinks {
  const base = siteUrl();
  return { file: fileToken ? `${base}/file/${fileToken}` : null, rules: `${base}/rules`, guide: `${base}/guide` };
}

/* Round 1 of Season One is Monday, October 10, 1977; one game day per round. */
export function gameDate(round: number) {
  const d = new Date(Date.UTC(1977, 9, 10 + round - 1));
  return d.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

// ---------- palette and type ----------
const C = { desk: "#d8ceb6", paper: "#efe6d4", paper2: "#e6dcc6", ink: "#141210", ink2: "#4b453c", red: "#b8241a", rule: "#c9bea4" };
const TYPE = `'Special Elite', 'Courier New', Courier, monospace`;
const DISPLAY = `Oswald, 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif`;
const MONO = `'Courier New', Courier, monospace`;

const KIND_LABEL: Record<LetterKind, string> = {
  letter: "Interoffice Correspondence",
  memo: "Memorandum",
  dispatch: "Daily Dispatch",
  notice: "Personnel Notice",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Paragraphs from plain text. Command lines (ORDER:, VOTE ...) keep their
   line breaks and get a typed-form look; other single newlines become <br>. */
function paragraphs(text: string, size = 15) {
  return text.trim().split(/\n\s*\n/).map((p) => {
    const lines = p.split("\n");
    const isCommand = lines.every((l) => /^(ORDER|STANDING ORDER|FALLBACK|VOTE|HOLD|ACCEPT|REJECT|TRANSFER|PROXY|AGREEMENT|TERMS)\b/i.test(l.trim()));
    if (isCommand) {
      return `<p style="margin:0 0 16px 0;padding:10px 12px;background:${C.paper2};border-left:3px solid ${C.red};font-family:${MONO};font-size:13px;line-height:1.6;color:${C.ink};">${lines.map((l) => esc(l)).join("<br>")}</p>`;
    }
    return `<p style="margin:0 0 16px 0;font-family:${TYPE};font-size:${size}px;line-height:1.65;color:${C.ink};">${lines.map((l) => esc(l)).join("<br>")}</p>`;
  }).join("\n");
}

function routingRow(label: string, value: string, red = false) {
  return `<tr>
    <td valign="top" width="128" style="padding:3px 0;font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.ink2};">${label}</td>
    <td valign="top" style="padding:3px 0;font-family:${MONO};font-size:13px;line-height:1.45;color:${red ? C.red : C.ink};${red ? "font-weight:bold;letter-spacing:1px;" : ""}">${value}</td>
  </tr>`;
}

const person = (p: { name: string; title?: string | null; department?: string | null }) =>
  [p.name, p.title, p.department].filter(Boolean).map((x) => esc(String(x))).join(", ");

function link(href: string, label: string) {
  return `<a href="${esc(href)}" style="color:${C.red};font-family:${DISPLAY};font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-bottom:1px solid ${C.red};white-space:nowrap;">${esc(label)}</a>`;
}

export function renderLetter(l: Letter): { html: string; text: string } {
  const label = l.label ?? (l.kind === "dispatch" && l.round ? `${KIND_LABEL.dispatch} · Round ${String(l.round.number).padStart(2, "0")}` : KIND_LABEL[l.kind]);
  const classification = l.classification ?? (l.kind === "dispatch" ? "Personal & Confidential" : l.kind === "notice" ? "Internal" : null);
  const dateLine = l.date ?? (l.round ? gameDate(l.round.number) : null);
  const preheader = l.preheader ?? l.body.replace(/\s+/g, " ").slice(0, 110);

  const routing = [
    routingRow("From", person(l.from)),
    l.to ? routingRow("To", person(l.to)) : "",
    dateLine ? routingRow("Date", esc(dateLine)) : "",
    routingRow("Subject", esc(l.subject)),
    classification ? routingRow("Class.", esc(classification.toUpperCase()), true) : "",
  ].join("");

  const roundLine = l.round
    ? `<p style="margin:0 0 18px 0;font-family:${MONO};font-size:12px;letter-spacing:1px;color:${C.ink2};">${l.round.episode ? `EPISODE ${String(l.round.episode).padStart(2, "0")} · DAY ${l.round.episodeRound ?? "?"} OF 14 · ` : ""}ORDERS LOCK ${esc(l.round.locksAt ?? "8:00 PM EASTERN")}</p>`
    : "";

  const sections = (l.sections ?? []).map((s) => `
    <tr><td style="padding:6px 0 0 0;">
      <p style="margin:0 0 10px 0;padding-bottom:4px;border-bottom:1px solid ${C.rule};font-family:${DISPLAY};font-size:14px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:${C.red};">${esc(s.heading)}</p>
      ${paragraphs(s.body, 14)}
    </td></tr>`).join("");

  const signature = l.signature ? `
    <p style="margin:24px 0 0 0;font-family:${TYPE};font-size:15px;line-height:1.5;color:${C.ink};">${esc(l.signature.name)}${l.signature.title ? `<br><span style="font-size:13px;color:${C.ink2};">${esc(l.signature.title)}</span>` : ""}</p>` : "";

  // A recipient with a personnel file is a player; anyone else (an applicant) gets the plain footer.
  const playing = Boolean(l.links.file);
  const links = [l.links.file ? link(l.links.file, "Your personnel file") : null, link(l.links.rules, "Rulebook"), link(l.links.guide, "Field guide")].filter(Boolean);

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${esc(l.subject)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Special+Elite&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: light only; supported-color-schemes: light only; }
  body { margin:0; padding:0; -webkit-text-size-adjust:100%; }
  a { color:${C.red}; }
  @media only screen and (max-width: 620px) {
    .sheet { width:100% !important; }
    .pad { padding-left:22px !important; padding-right:22px !important; }
    .stack { display:block !important; width:100% !important; text-align:left !important; }
    .stamp { margin-top:12px !important; }
  }
  /* Outlook.com and Gmail app dark modes: keep the paper light */
  [data-ogsc] .paper, [data-ogsb] .paper { background-color:${C.paper} !important; }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.desk};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.desk};">${esc(preheader)}${"&#8199;&#65279;&#847; ".repeat(30)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.desk}" style="background-color:${C.desk};">
<tr><td align="center" style="padding:28px 12px;">
<!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="sheet paper" width="600" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.paper}" style="width:600px;max-width:600px;background-color:${C.paper};border:1px solid ${C.rule};">
  <tr><td height="6" bgcolor="${C.red}" style="height:6px;line-height:6px;font-size:0;background-color:${C.red};">&nbsp;</td></tr>

  <tr><td class="pad" style="padding:26px 40px 14px 40px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td class="stack" valign="top" style="font-family:${DISPLAY};">
          <p style="margin:0;font-family:${DISPLAY};font-size:28px;line-height:1;font-weight:bold;letter-spacing:5px;text-transform:uppercase;color:${C.ink};">Royce Industries</p>
          <p style="margin:6px 0 0 0;font-family:${MONO};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.ink2};">Station R &middot; North Dakota</p>
        </td>
        <td class="stack stamp" valign="top" align="right" style="text-align:right;">
          <span style="display:inline-block;padding:5px 9px;border:2px solid ${C.red};font-family:${DISPLAY};font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${C.red};transform:rotate(-3deg);">${esc(label)}</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td class="pad" style="padding:0 40px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td height="1" bgcolor="${C.ink}" style="height:1px;line-height:1px;font-size:0;background-color:${C.ink};">&nbsp;</td></tr></table></td></tr>

  <tr><td class="pad" style="padding:14px 40px 6px 40px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${routing}</table>
  </td></tr>

  <tr><td class="pad" style="padding:6px 40px 0 40px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td height="1" style="height:1px;line-height:1px;font-size:0;border-top:1px dashed ${C.rule};">&nbsp;</td></tr></table></td></tr>

  <tr><td class="pad" style="padding:22px 40px 10px 40px;">
    ${roundLine}
    ${paragraphs(l.body)}
    ${sections ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${sections}</table>` : ""}
    ${signature}
  </td></tr>

  <tr><td class="pad" style="padding:22px 40px 0 40px;">
    <p style="margin:0;font-family:${MONO};font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.ink2};">Form RI-${l.kind === "dispatch" ? "40" : l.kind === "memo" ? "12" : l.kind === "notice" ? "1" : "7"} &middot; Retain for your records</p>
  </td></tr>

  <tr><td class="pad" style="padding:22px 40px 0 40px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td height="1" style="height:1px;line-height:1px;font-size:0;border-top:2px dotted ${C.ink2};">&nbsp;</td></tr></table>
  </td></tr>

  <tr><td class="pad" bgcolor="${C.paper2}" style="padding:16px 40px 24px 40px;background-color:${C.paper2};">
    <p style="margin:0 0 12px 0;font-family:${MONO};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${C.ink2};">&#9986; Out of character &middot; The Department, a play-by-mail game from Weird.Delivery</p>
    <p style="margin:0 0 14px 0;line-height:2.2;">${links.join(`<span style="color:${C.rule};">&nbsp;&nbsp;&#9632;&nbsp;&nbsp;</span>`)}</p>
    <p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;line-height:1.6;color:${C.ink2};">${playing
      ? `Reply to this message to write back. To act, start a line with <b style="color:${C.ink};">ORDER:</b>, <b style="color:${C.ink};">HOLD</b> or <b style="color:${C.ink};">VOTE</b>. Orders lock at 8:00 PM Eastern.`
      : "Questions about the game? Reply to this message."}</p>
    <p style="margin:0;font-family:${MONO};font-size:11px;line-height:1.6;color:${C.ink2};">Mail you send to the game is read by software, including AI models, to run the simulation. It is never shown to other players except as the rules allow.</p>
  </td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;

  // ---------- plain text ----------
  const rule = "-".repeat(60);
  const text = [
    "ROYCE INDUSTRIES · STATION R, NORTH DAKOTA",
    label.toUpperCase(),
    rule,
    `FROM:     ${[l.from.name, l.from.title, l.from.department].filter(Boolean).join(", ")}`,
    l.to ? `TO:       ${[l.to.name, l.to.title].filter(Boolean).join(", ")}` : null,
    dateLine ? `DATE:     ${dateLine}` : null,
    `SUBJECT:  ${l.subject}`,
    classification ? `CLASS.:   ${classification.toUpperCase()}` : null,
    rule,
    "",
    l.round ? `${l.round.episode ? `EPISODE ${String(l.round.episode).padStart(2, "0")} · DAY ${l.round.episodeRound ?? "?"} OF 14 · ` : ""}ORDERS LOCK ${l.round.locksAt ?? "8:00 PM EASTERN"}\n` : null,
    l.body.trim(),
    ...(l.sections ?? []).flatMap((s) => ["", s.heading.toUpperCase(), "~".repeat(Math.min(s.heading.length, 60)), s.body.trim()]),
    l.signature ? `\n${l.signature.name}${l.signature.title ? `\n${l.signature.title}` : ""}` : null,
    "",
    rule,
    "OUT OF CHARACTER · The Department, a play-by-mail game from Weird.Delivery",
    l.links.file ? `Your personnel file: ${l.links.file}` : null,
    `Rulebook:            ${l.links.rules}`,
    `Field guide:         ${l.links.guide}`,
    "",
    ...(playing
      ? ["Reply to this message to write back. To act, start a line with ORDER:, HOLD or VOTE.", "Orders lock at 8:00 PM Eastern."]
      : ["Questions about the game? Reply to this message."]),
    "Mail you send to the game is read by software, including AI models, to run the",
    "simulation. It is never shown to other players except as the rules allow.",
  ].filter((x) => x !== null).join("\n");

  return { html, text };
}
