"use client";
import { useState, useSyncExternalStore } from "react";

/* The office wall calendar on the personnel file: a Royce Industries company
   calendar, one month to a page, with the player's first day ringed in red,
   the days gone by crossed off, and today's date and the hour on the desk
   clock beside it. One game day per round: the round fixes the date, the
   campaign's clock fixes the hour. A round opens at dispatch in the morning,
   so after midnight the calendar turns over while the round is still open. */

type Props = { startRound: number; currentRound: number | null; roundOpenedAt: string | null; timezone: string };

const START = Date.UTC(1977, 9, 10);
const DAY = 86_400_000;
const MONTHS = [[1977, 9], [1977, 10], [1977, 11], [1978, 0], [1978, 1], [1978, 2], [1978, 3]] as const;
const ART: Record<string, string> = { "1977-9": "north-dakota-1", "1977-10": "building-3", "1977-11": "cattle-2", "1978-0": "minuteman-2", "1978-1": "building-9", "1978-2": "cattle-5", "1978-3": "building-14" };

/* As printed on a 1977 company calendar. Veterans Day fell on the fourth Monday
   of October from 1971 to 1977; daylight time ended on the last Sunday of October. */
const PRINTED: Record<string, string> = {
  "1977-10-10": "Columbus Day", "1977-10-24": "Veterans Day", "1977-10-30": "Daylight time ends", "1977-10-31": "Halloween",
  "1977-11-8": "Election Day", "1977-11-24": "Thanksgiving", "1977-12-24": "Christmas Eve", "1977-12-25": "Christmas", "1977-12-31": "New Year's Eve",
  "1978-1-1": "New Year's Day", "1978-1-2": "Holiday observed", "1978-2-12": "Lincoln's Birthday", "1978-2-14": "St. Valentine's", "1978-2-20": "Washington's Birthday",
  "1978-3-17": "St. Patrick's", "1978-3-24": "Good Friday", "1978-3-26": "Easter", "1978-4-30": "Daylight time begins",
};
const RED = new Set(["Columbus Day", "Veterans Day", "Thanksgiving", "Christmas", "New Year's Day", "Holiday observed", "Washington's Birthday"]);
const key = (d: Date) => `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;

/* The local calendar day (as a day count) of an instant in the campaign's zone. */
function localDay(t: Date, tz: string) {
  const [m, d, y] = t.toLocaleDateString("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).split("/").map(Number);
  return Date.UTC(y, m - 1, d) / DAY;
}

const subscribe = (cb: () => void) => { const t = setInterval(cb, 15_000); return () => clearInterval(t); };

export function OfficeCalendar({ startRound, currentRound, roundOpenedAt, timezone }: Props) {
  const tick = useSyncExternalStore(subscribe, () => Math.floor(Date.now() / 15_000), () => null);
  const now = tick === null ? null : new Date(tick * 15_000);

  const start = new Date(START + (startRound - 1) * DAY);
  let today: Date | null = null;
  if (currentRound) {
    const turned = now && roundOpenedAt ? Math.min(1, Math.max(0, localDay(now, timezone) - localDay(new Date(roundOpenedAt), timezone))) : 0;
    today = new Date(START + (currentRound - 1 + turned) * DAY);
  }
  const shown = today ?? start;
  const initial = Math.max(0, MONTHS.findIndex(([y, m]) => y === shown.getUTCFullYear() && m === shown.getUTCMonth()));
  const [turn, setTurn] = useState(0);   // months flipped from the one showing today
  const page = Math.min(MONTHS.length - 1, Math.max(0, initial + turn));
  const setPage = (f: (p: number) => number) => setTurn(f(page) - initial);

  const [y, m] = MONTHS[page];
  const first = new Date(Date.UTC(y, m, 1));
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const cells: (Date | null)[] = [...Array(first.getUTCDay()).fill(null), ...Array.from({ length: days }, (_, i) => new Date(Date.UTC(y, m, i + 1)))];
  while (cells.length % 7) cells.push(null);
  const month = first.toLocaleDateString("en-US", { timeZone: "UTC", month: "long" });
  const time = now ? now.toLocaleTimeString("en-US", { timeZone: timezone, hour: "numeric", minute: "2-digit" }) : "—:——";
  const day = (d: Date) => d.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long" });

  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_11rem]">
      {/* the wall calendar */}
      <figure className="relative border-2 border-ink bg-paper-2 shadow-[6px_6px_0_0_var(--ink)]" aria-label={`Wall calendar, ${month} ${y}`}>
        <div className="flex h-5 items-center justify-center gap-24 bg-ink" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-paper" /><span className="h-2.5 w-2.5 rounded-full bg-paper" />
        </div>
        <div className="h-28 overflow-hidden sm:h-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/images/${ART[`${y}-${m}`]}.jpg`} alt="" className="h-full w-full object-cover" />
        </div>
        <p className="border-y-2 border-ink bg-ink px-3 py-1 text-center text-[10px] uppercase tracking-[0.3em] text-paper">Royce Industries · Station R · North Dakota</p>
        <div className="flex items-end justify-between gap-3 px-4 pt-3">
          <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="pb-1 text-lg disabled:opacity-20 hover:text-red" aria-label="Previous month">‹</button>
          <p className="display text-center text-4xl text-red">{month} <span className="text-ink">{y}</span></p>
          <button type="button" onClick={() => setPage((p) => Math.min(MONTHS.length - 1, p + 1))} disabled={page === MONTHS.length - 1} className="pb-1 text-lg disabled:opacity-20 hover:text-red" aria-label="Next month">›</button>
        </div>
        <div className="mt-3 grid grid-cols-7 border-t border-ink text-center text-[10px] uppercase tracking-[0.2em]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => <span key={d} className={`border-b border-ink py-1 ${i === 0 ? "text-red" : "text-ink-2"}`}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            if (!d) return <span key={i} className="min-h-14 border-b border-r border-rule bg-paper/40 [&:nth-child(7n)]:border-r-0" />;
            const t = d.getTime();
            const isStart = t === start.getTime();
            const isToday = today && t === today.getTime();
            const gone = today && t < today.getTime() && t >= start.getTime();
            const printed = PRINTED[key(d)];
            return (
              <div key={i} className={`relative min-h-14 border-b border-r border-rule p-1 [&:nth-child(7n)]:border-r-0 ${isToday ? "bg-paper outline-2 -outline-offset-2 outline-ink" : ""}`}>
                <span className={`display text-lg ${d.getUTCDay() === 0 || (printed && RED.has(printed)) ? "text-red" : ""}`}>{d.getUTCDate()}</span>
                {printed && <span className="block text-[8px] uppercase leading-tight tracking-wide text-ink-2">{printed}</span>}
                {gone && <svg viewBox="0 0 40 40" className="pointer-events-none absolute inset-1 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] text-red opacity-70 mix-blend-multiply" preserveAspectRatio="none" aria-hidden><path d="M4 5 L36 35 M35 4 L5 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" /></svg>}
                {isStart && <>
                  <svg viewBox="0 0 60 50" className="pointer-events-none absolute -inset-0.5 h-[calc(100%+0.25rem)] w-[calc(100%+0.25rem)] text-red mix-blend-multiply" preserveAspectRatio="none" aria-hidden><path d="M30 4 C 52 3, 58 18, 55 30 C 52 44, 20 48, 8 38 C -1 30, 4 10, 24 5 L 34 7" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" /></svg>
                  <span className="type absolute bottom-0.5 right-1 -rotate-6 text-[9px] text-red">1st day</span>
                </>}
              </div>
            );
          })}
        </div>
        <figcaption className="flex flex-wrap justify-between gap-2 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-ink-2">
          <span>Compliments of Personnel &amp; Administration</span><span>Form P-12 · Do not remove</span>
        </figcaption>
      </figure>

      {/* the desk clock and date block */}
      <aside className="flex flex-col gap-4 self-start">
        <div className="border-2 border-ink bg-paper text-center">
          <p className="bg-red py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-paper">{today ? "Today" : "First day"}</p>
          <p className="display pt-3 text-xs tracking-[0.2em] text-ink-2">{day(today ?? start)}</p>
          <p className="display text-7xl">{(today ?? start).getUTCDate()}</p>
          <p className="display pb-3 text-sm tracking-[0.2em]">{(today ?? start).toLocaleDateString("en-US", { timeZone: "UTC", month: "long" })} {(today ?? start).getUTCFullYear()}</p>
        </div>
        {today && (
          <div className="border-2 border-ink bg-ink px-3 py-3 text-center text-paper">
            <p className="text-[10px] uppercase tracking-[0.3em] text-paper/70">Time clock</p>
            <p className="mt-1 font-mono text-3xl tabular-nums" suppressHydrationWarning>{time}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-paper/70">Round {currentRound}</p>
          </div>
        )}
        <p className="text-xs leading-relaxed text-ink-2">
          {today
            ? <>You started on {day(start)}, {start.toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric" })}. Each round is one working day at Station R.</>
            : <>Your first day is {day(start)}, {start.toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" })}. The clock starts when your cohort convenes.</>}
        </p>
      </aside>
    </div>
  );
}
