/* The fixed order of resolution. Design 04 §6, with the audit's rule that
   nothing consequential waits on a model: phases 1–5 are deterministic,
   6 and 7 are where the model narrates and the mail goes out. */
export const PHASES = [
  "validate",    // authorization, dependencies, costs; reserve resources; rulings on rejected orders
  "governance",  // close ballots, appointments, funding, rule amendments taking effect
  "diplomatic",  // execute formal agreements whose conditions are met; mark breaches
  "strategic",   // contested actions in rules-defined sub-order: defend → move → intercept → investigate
  "world",       // NPC moves, projects, pressure clocks, economy, decay
  "narrate",     // personal dispatches (model, with templated fallback)
  "send",        // deliver mail; open the next round
] as const;
export type Phase = (typeof PHASES)[number];
