/* Where a trip can end (TRAVEL, rulebook §6.3). A town is a destination, not a
   place to search: the places in it are in the index with offCampus set, and
   a character who has travelled to a town pays no further trip for orders
   there until they come home. Text is player-safe. PROPOSED 2026-10-16. */
export type TownDef = { slug: string; name: string; aliases: string[]; arrive: string };

export const TOWNS: TownDef[] = [
  { slug: "tagus", name: "Tagus", aliases: ["tagus", "the siding", "tagus siding"], arrive: "Forty minutes west on the county road, the last ten on gravel. A grain elevator, a church, a store that is also the post office, nine houses with lights in four of them. The wind does not stop here; it goes around." },
  { slug: "minot", name: "Minot", aliases: ["minot", "town", "into town", "the city"], arrive: "Fifty miles east: the courthouse, the sheriff's office behind it, the Daily News on Main, two motels, the base traffic on the bypass. The only place in the county where nobody looks up when a stranger walks in." },
  { slug: "split-rock-basin", name: "Split Rock Basin", aliases: ["split rock", "split rock basin", "the basin"], arrive: "Company land to the north-west, past the perimeter and the second fence: a dry basin with a cut rock face and tyre tracks that go in and do not come out the same way. Field crews go here, and are not asked why." },
  { slug: "stanley", name: "Stanley", aliases: ["stanley", "mountrail", "the county seat"], arrive: "The Mountrail county seat, an hour west: a courthouse with the land records, a cafe that closes at two, a sheriff who is not Hollis." },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

export function findTown(text: string): TownDef | null {
  const t = ` ${norm(text)} `; let best: { d: TownDef; n: number } | null = null;
  for (const d of TOWNS) for (const a of d.aliases) if (t.includes(` ${a} `) && (!best || a.length > best.n)) best = { d, n: a.length };
  return best?.d ?? null;
}
