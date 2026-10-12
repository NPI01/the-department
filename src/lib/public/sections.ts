/* A player-facing document as the console edits it: an intro, then sections
   that each start at a "## " heading. Subheadings (###) stay inside their
   section's text. Pure; shared by the editor and its save action. */

export type Section = { title: string; body: string };
export type Sectioned = { intro: string; sections: Section[]; numbered: boolean };

const NUMBER = /^\d+\.\s+/;

export function splitSections(md: string): Sectioned {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const intro: string[] = [];
  const sections: { title: string; lines: string[] }[] = [];
  let fence = false;
  for (const line of lines) {
    if (/^```/.test(line)) fence = !fence;
    const h = !fence && line.match(/^##\s+(.*)$/);
    if (h) { sections.push({ title: h[1].trim(), lines: [] }); continue; }
    (sections.length ? sections[sections.length - 1].lines : intro).push(line);
  }
  // Numbered when every heading carries a number, as the rulebook's do.
  const numbered = sections.length > 0 && sections.every((s) => NUMBER.test(s.title));
  return {
    intro: intro.join("\n").trim(),
    sections: sections.map((s) => ({ title: numbered ? s.title.replace(NUMBER, "") : s.title, body: s.lines.join("\n").trim() })),
    numbered,
  };
}

export function joinSections({ intro, sections, numbered }: Sectioned): string {
  const parts = intro.trim() ? [intro.trim()] : [];
  sections.forEach((s, i) => {
    const title = s.title.trim() || "Untitled section";
    parts.push(`## ${numbered ? `${i + 1}. ` : ""}${title}${s.body.trim() ? `\n\n${s.body.trim()}` : ""}`);
  });
  return parts.join("\n\n") + "\n";
}
