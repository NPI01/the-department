import type { SupabaseClient } from "@supabase/supabase-js";
import { renderLetter, type Letter, type LetterLinks } from "./letter";
import { buildLetter, templateByKey, type TemplateDef, type TemplateFields } from "./templates";

/* A template's live fields: the code defaults with the showrunner's saved edits
   (mail_templates) laid over them. Takes a service-role client; callers are
   server code (routes, the job worker, the console after its admin check). */

export async function loadTemplate(db: SupabaseClient, key: string): Promise<{ def: TemplateDef; fields: TemplateFields; edited: { at: string; by: string | null } | null }> {
  const def = templateByKey(key);
  if (!def) throw new Error(`unknown mail template ${key}`);
  const { data } = await db.from("mail_templates").select("fields, updated_at, updated_by").eq("key", key).maybeSingle();
  return {
    def,
    fields: { ...def.defaults, ...((data?.fields as Partial<TemplateFields>) ?? {}) },
    edited: data ? { at: data.updated_at as string, by: (data.updated_by as string | null) ?? null } : null,
  };
}

export async function renderTemplate(db: SupabaseClient, key: string, vars: Record<string, string | number | null | undefined>, links: LetterLinks, extra: Partial<Letter> = {}) {
  const { def, fields } = await loadTemplate(db, key);
  const letter = buildLetter(def, fields, vars, links, extra);
  return { subject: letter.subject, ...renderLetter(letter) };
}
