import { cacheLife, cacheTag } from "next/cache";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";

/* Player-facing documents. A version edited in the console (published_docs)
   wins; otherwise the page is served from the repo draft's copy in canon_docs.
   Only the paths listed here can be served; nothing secret is reachable.
   Editorial material is stripped from the draft: the note at the top, sections
   addressed to Nathan or to engine work, CHANGELOG lines and [PROPOSED] markers. */

export * from "./doc-meta";
import { PUBLIC_DOCS, DEFAULT_BANNER, draftForPlayers, publicDocTag, type PublicDocKey } from "./doc-meta";

export async function publicDoc(key: PublicDocKey) {
  "use cache";
  cacheLife("minutes");
  cacheTag(publicDocTag(key));
  if (!supabaseConfigured()) return null;
  const db = supabaseAdmin();
  const { data: edited } = await db.from("published_docs").select("banner, content, updated_at").eq("key", key).maybeSingle();
  if (edited) return { body: edited.content as string, banner: edited.banner as string | null, updatedAt: edited.updated_at as string };
  const { data } = await db.from("canon_docs").select("content, synced_at").eq("path", PUBLIC_DOCS[key]).maybeSingle();
  if (!data) return null;
  return { body: draftForPlayers(data.content as string), banner: DEFAULT_BANNER[key], updatedAt: data.synced_at as string };
}
