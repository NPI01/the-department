/* Episode 03 — scheduled mail by day of the episode. Invitations are not here:
   the societies issue them to whoever has earned one (societies.ts). PROPOSED. */
import type { ScheduledItem } from "./episode-01-mail";

export const SCHEDULED_03: ScheduledItem[] = [
  { key: "ep3-sloane-review", round: 1, from: { npc: "sloane" }, kind: "memo", subject: "Security review: all departments", classification: "Internal", route: { all: true },
    body: "To all staff,\n\nCorporate Security has opened a review of outside contacts and after-hours activity on company property. Employees may be asked to attend an interview; attendance is a condition of employment. Any employee approached by an outside group, in person or by letter, is to report it to this office at once. Failure to report is itself a matter for interview.\n\nH. Sloane, Director" },
  { key: "ep3-fisk-symbol", round: 2, from: { npc: "fisk" }, kind: "memo", subject: "A recurring symbol", classification: "Internal", route: { all: true },
    body: "To all departments. A symbol, reproduced in the attached memorandum, has been observed on company property on four occasions since September. Any employee who has seen it is to report the time and place to this office on Form 14-B. Do not discuss it.\n\n— L. Fisk, for the Director",
    caseItem: { slug: "fisk-symbol-memo", kind: "memo", drawer: "documents", title: "Memorandum: a recurring symbol (L. Fisk)", written: "October 1977", body: "**ROYCE INDUSTRIES · CORPORATE SECURITY · MEMORANDUM**\n\nA symbol, reproduced below, has been observed on company property on four occasions since September: scratched into a bench in Building 2, chalked on the Gate 2 booth, in the margin of a requisition, and on a pamphlet seized at Tagus. A ring with a short bar across it. Report the time and place to this office on Form 14-B. Do not discuss it.\n\n*(sketch: a ring, a bar across its lower third)*\n\n— L. Fisk, for the Director" } },
  { key: "ep3-bernard-warning", round: 4, from: { npc: "bernard" }, kind: "letter", subject: "(no subject)", route: { all: true },
    body: "Friend,\n\nThey are asking in town who has been out to the church. I told them nobody. If you came, you did not come. If you come again, come at dusk and do not bring a light. The ground does not like a light.\n\nElmer" },
  { key: "ep3-hensley-safety", round: 8, from: { npc: "hensley" }, kind: "memo", subject: "Safety Committee: motion S-77-003", classification: "Confidential", original_to: "Safety Committee", route: { departments: ["procurement-logistics", "personnel-administration"] },
    body: "To the Committee,\n\nMr. Sloane's motion asks this Committee to authorize the surveillance of named employees on the strength of a report I have read twice and cannot foot. Before I vote I want to know where the pamphlet in his Exhibit 2 came from, since the office it was seized at does not exist. I ask the Committee to require that answer in writing.\n\nM. Hensley, CFO" },
];
