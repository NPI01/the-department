"use client";
import { chooseSeason } from "./actions";

export function SeasonSelect({ seasons, current }: { seasons: { slug: string; title: string }[]; current: string }) {
  return (
    <form action={chooseSeason}>
      <select
        name="season"
        defaultValue={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label="Season"
        className="w-full border border-rule bg-paper-2 px-2 py-1 text-sm"
      >
        {seasons.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
      </select>
    </form>
  );
}
