/* Company forms. A form is a numbered questionnaire a staff member can require;
   the player fills it by replying with the form number on a line by itself and
   numbered answers. Filing is deterministic: no model reads a form to file it.
   What a player writes on a form becomes what their character has asserted on
   the record, and the staff who own the form remember it.

   Canon text: canon/06-forms.md (keep the two in step). */

export type FormDef = {
  id: string;                 // "14-B"
  title: string;
  owner: string;              // department that owns the form
  revision: string;
  instructions: string[];
  questions: { n: number; text: string; required: boolean }[];
  attestation: string;
  officeUse: string[];
};

export const FORMS: Record<string, FormDef> = {
  "14-B": {
    id: "14-B",
    title: "REPORT OF UNUSUAL OBSERVATION",
    owner: "Corporate Security",
    revision: "Rev. 9/77",
    instructions: [
      "To be completed by the observer, in the observer's own words, within twenty-four hours of the observation.",
      "Answer every question. Where there is nothing to report, write NONE. Incomplete forms are returned.",
      "Do not interpret. State what you saw, heard and did. Opinions about what a thing was are not wanted on this form.",
      "A false statement on this form is cause for dismissal under Section 4 of the Employee Handbook.",
      "The contents of this form are not to be discussed with any person outside Corporate Security. Retain no copy.",
    ],
    questions: [
      { n: 1, text: "Full name, badge number, department and immediate supervisor.", required: true },
      { n: 2, text: "Date and time of the observation, to the minute if known. State how you know the time.", required: true },
      { n: 3, text: "Your own location at the time (building and room, road, gate, or grid square from the campus plat). Were you on duty?", required: true },
      { n: 4, text: "Location of the thing observed: direction from you, estimated distance, estimated height above ground.", required: true },
      { n: 5, text: "Weather, light and visibility at the time.", required: true },
      { n: 6, text: "Description, in your own words, of what you observed: appearance, size, colour, sound, motion, smell, any effect on you or on equipment near you. Use as many lines as you need.", required: true },
      { n: 7, text: "Duration of the observation and how it ended.", required: true },
      { n: 8, text: "Other persons present, or who may also have observed it. Names where known; otherwise descriptions.", required: true },
      { n: 9, text: "Have you reported this to any other person, inside or outside Royce Industries? To whom, when, and in what words?", required: true },
      { n: 10, text: "Your place of residence in the area and the length of time you have lived there. The names of any persons in Tagus or elsewhere in Ward County with whom you have regular contact.", required: true },
      { n: 11, text: "Since the observation, have you noticed any disturbance of sleep, appetite, or of your sense of time (clocks that disagree with one another, minutes you cannot account for, the sense of having already done a thing)? Describe. (Added Rev. 9/77.)", required: true },
      { n: 12, text: "Signature. Type your full name. By signing you affirm that the above is true and complete to the best of your knowledge and that you have retained no copy.", required: true },
    ],
    attestation: "I affirm that the above is true and complete to the best of my knowledge, and that I have retained no copy.",
    officeUse: ["Received by: ________  Date: ________  Index No.: S-77-____", "Disposition:  [ ] No action   [ ] Hold   [ ] Refer D-SRD   [ ] Return to observer"],
  },
};

const RULE = "─".repeat(64);

/* The blank form as a letter the player can answer by reply. */
export function renderBlankForm(id: string, first: string): string {
  const f = FORMS[id];
  return [
    `ROYCE INDUSTRIES · ${f.owner.toUpperCase()}`,
    `FORM ${f.id} (${f.revision})`,
    f.title,
    RULE,
    ...f.instructions.map((l) => `  ${l}`),
    RULE,
    ...f.questions.flatMap((q) => [`${String(q.n).padStart(2)}. ${q.text}`, ``]),
    RULE,
    `FOR ${f.owner.toUpperCase()} USE ONLY`,
    ...f.officeUse.map((l) => `  ${l}`),
    RULE,
    ``,
    `${first}, to file this form, reply to this message. Put`,
    ``,
    `  FORM ${f.id}`,
    ``,
    `on a line by itself, then your answers, each beginning with its number:`,
    ``,
    `  1. Joseph Pruitt, badge 4471, Information Systems, ...`,
    `  2. Monday, October 10, about 8:15 AM. I had just ...`,
    ``,
    `An answer may run to several lines. Question ${f.questions.length} is your signature: type your`,
    `full name. The form is filed the moment it is received, and the office that`,
    `owns it is told. Filing a form costs nothing and is not an order.`,
  ].join("\n");
}

export type FormSubmission = { form: string; answers: Record<number, string>; signed: string | null; missing: number[]; startLine: number; endLine: number };

/* A block beginning "FORM 14-B" followed by numbered answers. Returns null if
   no form line; a submission with no answers means the writer wants a blank. */
export function parseFormSubmission(text: string): FormSubmission | null {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => /^\s*(?:ORDER\s*:?\s*)?(?:SEND\s+(?:ME\s+)?|REQUEST\s+)?(?:A\s+)?(?:BLANK\s+)?FORM\s*(\d{1,3}\s*-?\s*[A-Z]?)\b\s*[.:]?\s*$/i.test(l) && !l.trim().startsWith(">"));
  if (start < 0) return null;
  const id = lines[start].match(/FORM\s*(\d{1,3}\s*-?\s*[A-Z]?)/i)![1].replace(/\s+/g, "").toUpperCase().replace(/^(\d+)([A-Z])$/, "$1-$2");
  const def = FORMS[id];
  const answers: Record<number, string> = {};
  let cur: number | null = null; let end = start;
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim().startsWith(">")) break;                     // quoted material: the form is over
    const m = l.match(/^\s*(\d{1,2})\s*[.):\-]\s*(.*)$/);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= (def?.questions.length ?? 20)) { cur = Number(m[1]); answers[cur] = m[2].trim(); end = i; continue; }
    if (cur !== null) {
      if (!l.trim()) { if (lines[i + 1] && /^\s*\d{1,2}\s*[.):\-]/.test(lines[i + 1])) continue; if (lines[i + 1] && lines[i + 1].trim() && !/^\s*(?:—|--|best|regards|sincerely|thanks)/i.test(lines[i + 1])) { answers[cur] += "\n"; continue; } break; }
      answers[cur] = `${answers[cur]}\n${l.trim()}`.trim(); end = i;
    }
  }
  for (const k of Object.keys(answers)) answers[Number(k)] = answers[Number(k)].trim();
  const missing = def ? def.questions.filter((q) => q.required && !(answers[q.n] && answers[q.n].length)).map((q) => q.n) : [];
  const last = def?.questions.length ?? 0;
  const signed = def && answers[last] ? answers[last].split("\n")[0].replace(/^(?:signed|signature)\s*[:\-]?\s*/i, "").trim() || null : null;
  return { form: id, answers, signed, missing, startLine: start, endLine: end };
}

export function formIsKnown(id: string) { return Boolean(FORMS[id]); }

/* A one-paragraph record of a filed form, for the memory of whoever owns it. */
export function summarizeSubmission(s: FormSubmission, index: string): string {
  const f = FORMS[s.form];
  const parts = f.questions.filter((q) => s.answers[q.n]).map((q) => `${q.n}. ${s.answers[q.n].replace(/\s+/g, " ").slice(0, 160)}`);
  return `Filed Form ${s.form} (${index})${s.missing.length ? `, incomplete (unanswered: ${s.missing.join(", ")})` : ""}: ${parts.join(" · ")}`.slice(0, 1400);
}

export function renderFormReceipt(p: { first: string; form: string; index: string; round: number; missing: number[]; signed: string | null; owner: string }): string {
  const out = [`Received, ${p.first}.`, ``, `FORM ${p.form} is filed with ${p.owner} as ${p.index}, Round ${p.round}.`];
  if (p.missing.length) out.push(``, `It is incomplete: ${p.missing.length === 1 ? "question" : "questions"} ${p.missing.join(", ")} ${p.missing.length === 1 ? "was" : "were"} not answered. ${p.owner} may return it. Reply with FORM ${p.form} and the missing answers to complete it; the filed copy is amended.`);
  if (!p.signed) out.push(``, `It is unsigned. Question ${FORMS[p.form].questions.length} is your signature: type your full name.`);
  out.push(``, `What you wrote on the form is now on the record under your name and may be cited. The office that owns the form has been told.`, ``, `— The Department`);
  return out.join("\n");
}

/* What a staff member knows about the forms their office uses. Public canon. */
export function formBriefFor(department: string | null): string {
  const own = Object.values(FORMS).filter((f) => f.owner === department);
  const lines: string[] = [];
  for (const f of own) lines.push(`Form ${f.id} (${f.revision}), ${f.title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}, is your office's form for any sighting or incident. You may require it, and you may decline to discuss a sighting in writing until it is on file. A writer gets a blank by replying FORM ${f.id}; the clerk files what comes back and tells you. The September revision added question 11 (sleep, appetite and sense of time since the observation); you were not told why, you assume it is about drink or pills, and you do not speculate in writing.`);
  if (!own.length) lines.push(`Sightings and incidents are reported to Corporate Security on Form 14-B; you refer such matters there and do not take statements yourself.`);
  return lines.join("\n");
}
