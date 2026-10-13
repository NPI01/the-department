import { config } from "dotenv"; config({ path: "/Volumes/Extreme SSD/the-department/.env.local" });
import { readFileSync, writeFileSync } from "node:fs";
import { chatJson } from "/Volumes/Extreme SSD/the-department/src/lib/cobble";
const pub = readFileSync("canon/02-personnel-directory.md", "utf8"), sec = readFileSync("canon/secret/05-allegiance-matrix.md", "utf8");
const extra = [readFileSync("canon/secret/03-factions-and-people.md", "utf8"), readFileSync("canon/secret/02-tagus-and-the-stairway.md", "utf8"), readFileSync("canon/secret/10-episode-arcs.md", "utf8")].join("\n\n");
const world = readFileSync("canon/00-player-bible.md", "utf8").slice(0, 6000);
function block(md: string, name: string) { const lines = md.split("\n"); const i = lines.findIndex((l) => l.trim().startsWith("**") && l.includes(name)); if (i < 0) return ""; const out = [lines[i]]; for (let j = i + 1; j < lines.length; j++) { if (lines[j].trim().startsWith("**") && !lines[j].trim().startsWith("*   **")) break; if (lines[j].startsWith("#")) break; out.push(lines[j]); } return out.join("\n").trim(); }
function paras(md: string, key: string) { return md.split(/\n\s*\n/).filter((p) => p.includes(key)).slice(0, 6).join("\n\n"); }
const SCHEMA = `{"voice": {"register": "<two or three words>", "rules": ["<3-5 rules: length, grammar, what they never do>"], "phrases": ["<4-6 short characteristic phrases>"], "signoff": "<how they sign>"},
 "letterhead": {"name": "<the paper they write on>", "place": "<town, state>"} | null,
 "wants_from_newcomer": "<the one thing they want from a junior Royce employee; a reason to write in Round 1>",
 "will_trade": ["<2-4 things they will give for a price or favour>"], "never_says": ["<2-4 things never put in writing>"],
 "protects": ["<names>"], "resents": ["<names>"],
 "knows": ["<3-6 things they KNOW, each saying how they know>"], "believes": ["<2-4 things believed, unprovable>"],
 "checkable_lie": {"claim": "...", "truth": "...", "where_to_check": "<a record the game has: personnel file, invoice, flight log, sheriff's report, church register>"},
 "breaking_point": "...",
 "ladder": {"episode_1": "<first two weeks of October 1977: one small oddity, no theories>", "episode_2": "<once a rancher's dead steer with a Royce helicopter overhead is public>", "episode_3": "<once Security's purge and the Vigil invitations begin>"},
 "goals": ["<2-3>"], "fears": ["<2-3>"],
 "paragraph": "<one paragraph: who they are to a new junior employee and what their letters are like; mark anything invented PROPOSED>"}`;
const CAST: { slug: string; name: string; key: string; note: string }[] = [
  { slug: "vane", name: "Gary Vane", key: "Vane", note: "Letterhead: Vane Cattle Co., Tagus. Writes like a rancher: blunt, agricultural, suspicious; calls company people 'suitcases'. He has a tissue sample from a dead steer that will not rot and thinks it is a tumour." },
  { slug: "bernard", name: "Elmer Bernard", key: "Bernard", note: "Letterhead: plain paper, Tagus. 72, caretaker of St. Olaf Lutheran, last year-round resident of Tagus, keeps the cemetery; whispery, archaic, fearful, pauses as if listening. He holds an 1883 survey map and thinks of certain visitors as 'quiet men'; he is an unaware asset and must never be written as knowing what they are." },
  { slug: "bradley", name: "Capt. Thomas Bradley", key: "Bradley", note: "Letterhead: Prairie Meridian Aviation, Minot. Former Navy aviator, chief pilot of the night flight contract; clipped, technical, cynical, aviation jargon; calls flights 'calibration runs'. Financially trapped by the contract; instruments and his own senses have begun to disagree on the night runs (never explained)." },
  { slug: "doyle", name: "Tech. Sgt. Arthur Doyle", key: "Doyle", note: "Letterhead: a personal letter from Minot (never base stationery). Low-level radar technician, runs the town radio club; chatty, nervous, informal, over-explains; trades harmless gossip for favours. He mails radar oddities to a P.O. Box in Fargo and believes it is a hobbyist newsletter." },
  { slug: "okafor", name: "Maya Okafor", key: "Okafor", note: "PROPOSED character, no canon entry: junior clerk in Procurement & Logistics, two years at Station R, signs for deliveries, warm and gossipy, belongs to no faction and must stay ordinary. She has seen two versions of the campus map (one with Building 9, one without). Give her a family tie to Tagus or Minot (your invention, mark PROPOSED). Letterhead null (Royce paper). Her wants_from_newcomer is small and human." },
];
const only = process.argv.slice(2); const todo = CAST.filter((c) => !only.length || only.includes(c.slug));
const system = `You write people who have something to lose, for a 1977 corporate-intrigue correspondence game. Canon is what is in the material you are given; keep every fact in it. Mark anything you invent PROPOSED inside the paragraph only. The sheet is for prompting a model that answers letters as this person, so be concrete and machine-usable. Hard rules: nothing about the Keepers, Ascendants, SENTINEL, Convergence, Drawing 68-24, Sublevel Nine, Kessler, time loops or the future in "ladder", "will_trade" or "paragraph"; such things go only in "knows" and "believes". Episode 1 ladder entries are small: one oddity, no theories. No anachronisms. Output exactly one JSON object for ONE character, matching this schema and nothing else:\n${SCHEMA}`;
async function one(c: typeof CAST[number]) {
  const user = `THE WORLD (public):\n${world}\n\nTHE CHARACTER: ${c.name}\n${c.note}\n\nPUBLIC DIRECTORY ENTRY:\n${block(pub, c.name) || "(none; see note)"}\n\nSECRET ALLEGIANCE ROW:\n${sec.split("\n").find((l) => l.startsWith("|") && l.includes(c.key)) ?? "(none)"}\n\nSECRET CANON MENTIONS:\n${paras(extra, c.key) || "(none)"}\n\nWrite the cast sheet for ${c.name}.`;
  const t0 = Date.now();
  const { data, result } = await chatJson<Record<string, unknown>>([{ role: "system", content: system }, { role: "user", content: user }], { tag: `sheet:${c.slug}`, maxTokens: 3500, temperature: 0.7, timeoutMs: 600_000 });
  const ok = data && typeof data === "object" && "voice" in data && "ladder" in data;
  console.log(`${c.slug.padEnd(8)} ${result.model} ${Math.round((Date.now() - t0) / 1000)}s ${ok ? "ok" : "FAILED"}`);
  if (ok) writeFileSync(`agents/out/cast-sheets/singles/${c.slug}.json`, JSON.stringify(data, null, 1)); else writeFileSync(`agents/out/cast-sheets/singles/${c.slug}.failed.txt`, result.text ?? "");
}
const queue = [...todo]; await Promise.all([0, 1].map(async () => { while (queue.length) await one(queue.shift()!); }));
console.log("done");
