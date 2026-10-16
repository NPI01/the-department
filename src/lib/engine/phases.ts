/* The fixed order of resolution. Design 04 §6, with the audit's rule that
   nothing consequential waits on a model: the deterministic phases decide,
   grow and narrate are where models write (and a failure there costs nothing
   but depth), and send delivers. */
export const PHASES = [
  "validate",    // authorization, dependencies, costs; reserve resources; rulings on rejected orders
  "grow",        // the living world: people and places written for the gaps tonight's orders opened (src/lib/engine/grow.ts)
  "governance",  // close ballots, appointments, funding, rule amendments taking effect
  "diplomatic",  // execute formal agreements whose conditions are met; mark breaches
  "strategic",   // contested actions in rules-defined sub-order: defend → move → intercept → investigate
  "world",       // NPC moves, projects, pressure clocks, economy, decay
  "narrate",     // personal dispatches (model, with templated fallback)
  "send",        // deliver mail; open the next round
] as const;
export type Phase = (typeof PHASES)[number];
