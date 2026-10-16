/* The world the verbs act on. Data, not prose: what exists, who holds it, who
   may reach it, what reading or seeing it teaches. Bodies are the player's copy
   (canon Markdown) and are short; the morning narration adds the texture. */

export type Access = {
  clearance?: number;            // minimum clearance to get it by request
  department?: string[];         // division slugs that may request it regardless of clearance
  via?: string;                  // an NPC slug who holds it personally; a request is referred to them
  sealed?: boolean;              // Security seal: needs clearance 3 or a Security grant
  society?: string;              // members of this society (org slug) may reach it regardless
};

export type DocumentDef = {
  slug: string;
  episode?: number;              // first episode in which it exists (default 1)
  title: string;
  kind: "document" | "report" | "memo" | "map" | "letter" | "diagram" | "object";
  aliases: string[];             // words a request may use; all lowercase
  holder: string;                // where the original is: a division slug, an NPC slug, or a place slug
  access: Access;
  grants: string[];              // knowledge keys the reader gains
  wrongDetail: { text: string; grants: string } | null;   // what EXAMINE can notice
  body: string;                  // the player's copy
  from?: string; written?: string;
  notice?: boolean;              // Security learns who asked
  logKey?: string;               // a log the engine appends to: lines from facts log.<key>.* (equipment.ts)
};

export type Sighting = { episode?: number; rounds: [number, number]; text: string; grants: string; restricted?: boolean };   // rounds are days of that episode

export type PlaceDef = {
  slug: string;
  episode?: number;              // first episode in which it can be reached (default 1)
  name: string;
  aliases: string[];
  restricted?: boolean;          // being seen there is noticed by Security
  offCampus?: boolean;           // beyond the fence: a free-form order going there pays for the trip (TRAVEL)
  visit: string;                 // what a daytime visit shows (player-safe)
  ask?: string;                  // what whoever is there will say to a stranger who asks
  surveil: Sighting[];           // what a night's watch may show, by round band
  contains?: string[];           // document slugs a search may turn up
  searchAccess?: Access;
};

export type PressureTier = { episode?: number; tier: number; rounds: [number, number]; text: string; mitigation: { verbs: string[]; department?: string[] } | null };
