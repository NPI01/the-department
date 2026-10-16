"use server";
import { z } from "zod";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { characterForToken } from "@/lib/game/case-file";
import { askHelpDesk, type HelpTurn } from "@/lib/game/help";

/* The help desk. The file token is the only key; the question and the last few
   turns go to the desk (src/lib/game/help.ts), which reads public documents only. */

const Ask = z.object({
  token: z.string(),
  question: z.string().trim().min(1).max(1200),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(2000) })).max(12),
});

export async function askHelp(input: { token: string; question: string; history: HelpTurn[] }): Promise<{ answer: string } | { error: string }> {
  const parsed = Ask.safeParse(input);
  if (!parsed.success) return { error: "Ask something first." };
  if (!supabaseConfigured()) return { error: "The help desk is not available right now." };
  const db = supabaseAdmin();
  const me = await characterForToken(db, parsed.data.token);
  if (!me) return { error: "This file is not on record." };
  const r = await askHelpDesk(db, me, parsed.data.question, parsed.data.history);
  return "error" in r ? { error: r.error } : { answer: r.answer };
}
