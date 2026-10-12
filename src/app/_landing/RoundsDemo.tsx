"use client";
import { useEffect, useRef, useState } from "react";

/* A scripted, autoplaying demonstration of three rounds. Everything shown is
   public canon (Episode 01). "You" are a new hire in Information Systems;
   "Okafor" and "Castellanos" are other players; Armitage, Ely, Hollis are NPCs. */

type Beat =
  | { kind: "dispatch"; round: number; time: string; from: string; subject: string; text: string }
  | { kind: "in"; round: number; time: string; from: string; subject: string; text: string; player?: boolean }
  | { kind: "out"; round: number; time: string; to: string; text: string }
  | { kind: "order"; round: number; time: string; lines: string[] }
  | { kind: "lock"; round: number }
  | { kind: "resolve"; round: number }
  | { kind: "note"; round: number; time: string; text: string }
  | { kind: "end"; round: number };

const SCRIPT: Beat[] = [
  { kind: "dispatch", round: 1, time: "9:00 AM", from: "D. Armitage, Personnel & Administration", subject: "Orientation and Shared Duty", text: "Your acceptance is recorded. Report to Building 1, Room 104. You will not be told the function of the Department of Special Research and Development. You may receive communications from individuals whose names do not appear on the staff directory. This is not necessarily an administrative error." },
  { kind: "dispatch", round: 1, time: "9:02 AM", from: "Facilities Management", subject: "Campus Layout Reference", text: "Your copy is the only authorized map for your department. Do not compare copies with other departments." },
  { kind: "note", round: 1, time: "9:02 AM", text: "Your map labels Building 7 \"Building 7 (restricted)\"." },
  { kind: "in", round: 1, time: "11:40 AM", from: "M. Okafor, Procurement & Logistics", subject: "Re: Campus Layout Reference", text: "Quick question, since we're both new. Does your map show a Building 9 north of the perimeter road? Mine does. No label.", player: true },
  { kind: "out", round: 1, time: "11:52 AM", to: "M. Okafor", text: "No Building 9 on mine. But my 7 is marked restricted and I'm told yours is cold storage. Keep this between us until we know who else noticed." },
  { kind: "in", round: 1, time: "4:20 PM", from: "Dr. S. Ely, Biological Sciences (cc: all departments)", subject: "URGENT: Specimen Retrieval — HARVEST", text: "The previous shipment, designated for delivery on September 28, was never logged into storage. I have checked the loading dock manifest and the cold storage logs. The crates are missing." },
  { kind: "order", round: 1, time: "7:52 PM", lines: ["ORDER: REQUEST_FILES Facilities ledger, Building 7", "ORDER: REQUEST_FILES HARVEST sampling authorizations 1976"] },
  { kind: "lock", round: 1 },
  { kind: "resolve", round: 1 },
  { kind: "dispatch", round: 2, time: "9:00 AM", from: "The Department", subject: "Round 2 · Results of your orders", text: "Facilities ledger, Building 7: the entry has been struck through in ink. Marginal note: \"see DSRD.\" Your request for HARVEST sampling authorizations was referred to Dr. Ely's office. No reply yet." },
  { kind: "dispatch", round: 2, time: "9:00 AM", from: "Sheriff D. Hollis (forwarded by Corporate Security)", subject: "Inquiry: Royce vehicles at dead rancher site", text: "Vane says one of your trucks was parked by a steer that turned up dead yesterday. Drained. Clean cuts. He says your guys were using a special light, something blue. I drove out. No trucks. No lights." },
  { kind: "in", round: 2, time: "10:15 AM", from: "M. Okafor, Procurement & Logistics", subject: "Something in the invoices", text: "Concrete, cable, surveying gear, ventilation. Delivered 1969 to 1977 to an inactive property near Tagus, billed to a subsidiary called Prairie Geological Services. No operational records. Want in? I need someone who can read the mainframe index.", player: true },
  { kind: "out", round: 2, time: "10:31 AM", to: "M. Okafor", text: "In. I'll trade you the Building 7 ledger line. Send me the PGS invoice numbers and I'll look for them on the index tonight." },
  { kind: "in", round: 2, time: "3:05 PM", from: "Dr. S. Ely, Biological Sciences", subject: "(no subject)", text: "Who told you to ask about the 1976 authorizations? Come by the lab after five. Bring no one. — S.E." },
  { kind: "order", round: 2, time: "7:58 PM", lines: ["ORDER: VISIT Biological Sciences lab (Dr. Ely), alone", "ORDER: SEARCH mainframe index for PGS invoice numbers (standing)"] },
  { kind: "lock", round: 2 },
  { kind: "resolve", round: 2 },
  { kind: "dispatch", round: 3, time: "9:00 AM", from: "The Department", subject: "Round 3 · Results of your orders", text: "Dr. Ely showed you the cold storage. Lot 77-B's shelf is empty. The storage log says it was never delivered. The dock manifest says it was. She let you copy the manifest. You now hold: EVIDENCE — HARVEST dock manifest, 9/28, with provenance." },
  { kind: "dispatch", round: 3, time: "9:00 AM", from: "Personnel & Administration", subject: "NOTICE · Election of employee representatives", text: "The cohort will elect one representative to the Research Committee and one to the Safety Committee. Ballots close at tonight's lock. VOTE E-77-001: <name> for the Research seat." },
  { kind: "in", round: 3, time: "9:48 AM", from: "M. Okafor, Procurement & Logistics", subject: "Re: NOTICE · Election", text: "I'm standing for the Research seat. With it I can get the PGS invoices in front of the committee. I'd like your vote.", player: true },
  { kind: "in", round: 3, time: "1:12 PM", from: "R. Castellanos, Corporate Security", subject: "A word", text: "Okafor is loud. Vote for me instead and I can get your clearance raised by Friday. Think about what you could read with it.", player: true },
  { kind: "out", round: 3, time: "6:30 PM", to: "M. Okafor", text: "You have my vote. Don't mention the manifest in committee until I've checked the index." },
  { kind: "order", round: 3, time: "7:55 PM", lines: ["VOTE E-77-001: okafor", "ORDER: REQUEST_FILES loading dock logs, September 1977"] },
  { kind: "lock", round: 3 },
  { kind: "resolve", round: 3 },
  { kind: "dispatch", round: 4, time: "9:00 AM", from: "The Department", subject: "Round 4 · Results", text: "Elected to the Research seat: M. Okafor, 7 votes of 12. Your vote was counted. Castellanos has not written back. The dock logs for September 27–29 are missing from the file." },
  { kind: "note", round: 4, time: "9:00 AM", text: "Later this week, someone will slide an envelope under your door. Inside is a photograph. On the back: They're not worshipping it." },
  { kind: "end", round: 4 },
];

const PHASES = ["validate orders", "close ballots", "execute agreements", "resolve contested actions", "the world moves", "write your dispatch"];

const DELAY: Record<Beat["kind"], number> = { dispatch: 3600, in: 3400, out: 3800, order: 3600, note: 2600, lock: 2200, resolve: 4200, end: 7000 };

/* Types `text` out while `active`; shows it whole otherwise. The caller keys
   each message so a new message mounts fresh and the counter starts at zero. */
function useTyped(text: string, active: boolean, speed = 16) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const t = setInterval(() => { i += 2; setN(Math.min(i, text.length)); if (i >= text.length) clearInterval(t); }, speed);
    return () => clearInterval(t);
  }, [text, active, speed]);
  return active ? text.slice(0, n) : text;
}

/* The overnight resolution ticker. Mounted fresh for every resolve beat. */
function Overnight() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    let p = 0; const t = setInterval(() => { p++; setPhase(Math.min(p, PHASES.length)); if (p >= PHASES.length) clearInterval(t); }, 550);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="w-72 border border-paper/30 bg-ink p-5">
      <p className="text-[10px] tracking-[0.22em] uppercase text-paper/60">Overnight · the world resolves</p>
      <ol className="mt-3 space-y-1.5 text-[13px]">
        {PHASES.map((p, k) => <li key={p} className={k < phase ? "text-paper" : "text-paper/30"}><span className={k < phase ? "text-red" : ""}>{k < phase ? "■" : "□"}</span> {p}</li>)}
      </ol>
    </div>
  );
}

function Message({ b, latest }: { b: Beat; latest: boolean }) {
  const typedOut = useTyped(b.kind === "out" ? b.text : "", latest && b.kind === "out");
  if (b.kind === "dispatch" || b.kind === "in") {
    const player = b.kind === "in" && b.player;
    return (
      <div className={`demo-msg ${latest ? "demo-msg-new" : ""} border-l-4 ${b.kind === "dispatch" ? "border-red" : player ? "border-ink" : "border-rule"} bg-paper px-4 py-3`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-[10px] tracking-[0.18em] uppercase text-ink-2">
          <span>{b.kind === "dispatch" ? "Dispatch" : player ? "From another player" : "From"} · {b.from}</span><span>{b.time}</span>
        </div>
        <p className="display mt-1 text-lg leading-tight">{b.subject}</p>
        <p className="type mt-1 text-[13.5px] leading-snug text-ink">{b.text}</p>
      </div>
    );
  }
  if (b.kind === "out") return (
    <div className={`demo-msg ${latest ? "demo-msg-new" : ""} ml-6 border-l-4 border-red bg-paper-2 px-4 py-3 sm:ml-12`}>
      <div className="flex justify-between text-[10px] tracking-[0.18em] uppercase text-ink-2"><span>You → {b.to}</span><span>{b.time}</span></div>
      <p className="type mt-1 text-[13.5px] leading-snug">{typedOut}{latest && typedOut.length < b.text.length && <span className="caret" />}</p>
    </div>
  );
  if (b.kind === "order") return (
    <div className={`demo-msg ${latest ? "demo-msg-new" : ""} ml-6 border-2 border-dashed border-ink bg-paper-2 px-4 py-3 sm:ml-12`}>
      <div className="flex justify-between text-[10px] tracking-[0.18em] uppercase text-ink-2"><span>Your order packet</span><span>{b.time}</span></div>
      {b.lines.map((l, i) => <p key={l} className="mt-1 text-[13px]" style={{ animation: latest ? `riseIn .5s ${i * 0.5}s both` : undefined }}><span className="text-red">▸</span> {l}</p>)}
      <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-ink-2">Binding at 8:00 PM. Everything else you wrote today was conversation.</p>
    </div>
  );
  if (b.kind === "note") return <p className={`demo-msg ${latest ? "demo-msg-new" : ""} type px-2 text-[13px] italic text-ink-2`}>{b.text}</p>;
  return null;
}

export function RoundsDemo() {
  const [i, setI] = useState(-1);          // index of the latest beat shown
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const beat = i >= 0 ? SCRIPT[i] : null;
  const round = beat?.round ?? 1;

  // autoplay when in view
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting && !started) { setStarted(true); setPlaying(true); setI(0); } }, { threshold: 0.35 });
    io.observe(el); return () => io.disconnect();
  }, [started]);

  // advance
  useEffect(() => {
    if (!playing || i < 0) return;
    const b = SCRIPT[i];
    if (b.kind === "end") { const t = setTimeout(() => setI(0), DELAY.end); return () => clearTimeout(t); }
    const t = setTimeout(() => setI((x) => Math.min(x + 1, SCRIPT.length - 1)), DELAY[b.kind]);
    return () => clearTimeout(t);
  }, [i, playing]);

  // keep the newest message in view
  useEffect(() => { const f = feedRef.current; if (f) f.scrollTo({ top: f.scrollHeight, behavior: "smooth" }); }, [i]);

  const visible = SCRIPT.slice(0, i + 1).filter((b) => b.round === round && ["dispatch", "in", "out", "order", "note"].includes(b.kind));
  const locked = beat?.kind === "lock" || beat?.kind === "resolve";
  const clock = beat && "time" in beat ? beat.time : locked ? "8:00 PM" : beat?.kind === "end" ? "9:00 AM" : "9:00 AM";
  const progress = i < 0 ? 0 : (i + 1) / SCRIPT.length;

  return (
    <div ref={ref} className="relative mx-auto max-w-5xl">
      {/* frame */}
      <div className="border-2 border-ink bg-ink text-paper shadow-[14px_14px_0_var(--red)]">
        {/* title bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper/20 px-4 py-2 text-[11px] tracking-[0.22em] uppercase">
          <div className="flex items-center gap-3">
            <span className="display text-base tracking-[0.3em]">Weird<span className="text-red">.</span>Delivery</span>
            <span className="text-paper/60">· Correspondence · thedepartment@weird.delivery</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Episode I · Round <span className="text-red">{round}</span> / 14</span>
            <span className={`display text-lg tabular-nums ${locked ? "text-red" : ""}`}>{clock}</span>
          </div>
        </div>

        <div className="grid min-h-[520px] md:grid-cols-[1fr_15rem]">
          {/* feed */}
          <div ref={feedRef} className="relative max-h-[560px] space-y-3 overflow-y-auto bg-ink p-4 [scrollbar-width:thin]">
            {i < 0 && <p className="type p-6 text-center text-paper/60">Scroll here to begin. Three rounds, about two minutes.</p>}
            {visible.map((b, k) => <Message key={`${b.round}-${k}`} b={b} latest={b === beat} />)}
            {locked && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/70">
                {beat?.kind === "lock" ? (
                  <div className="stamp text-3xl sm:text-5xl" style={{ animation: "stamp .6s cubic-bezier(.2,.9,.3,1.4) both", color: "var(--red)", borderColor: "var(--red)" }}>8:00 PM · Orders locked</div>
                ) : (
                  <Overnight key={round} />
                )}
              </div>
            )}
            {beat?.kind === "end" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/85 p-6 text-center">
                <p className="display text-3xl sm:text-5xl">Fourteen rounds<br />make an episode.</p>
                <p className="type text-paper/80">Twelve episodes make a season. Nobody has told us how it ends.</p>
                <a href="#apply" className="display mt-2 border-2 border-red bg-red px-6 py-2 text-lg text-paper hover:bg-transparent hover:text-red">Apply for employment</a>
              </div>
            )}
          </div>

          {/* side panel */}
          <aside className="hidden border-l border-paper/20 p-4 text-[12px] md:block">
            <p className="text-[10px] tracking-[0.22em] uppercase text-paper/60">Your dossier</p>
            <p className="display mt-1 text-xl">A new hire</p>
            <p className="text-paper/70">Information Systems · Clearance 1</p>
            <p className="mt-4 text-[10px] tracking-[0.22em] uppercase text-paper/60">Holdings</p>
            <ul className="mt-1 space-y-1">
              <li>Campus map (IS copy)</li>
              {i >= SCRIPT.findIndex((b) => b.round === 3 && b.kind === "dispatch") && <li className="text-red" style={{ animation: "riseIn .6s both" }}>HARVEST dock manifest 9/28 · evidence</li>}
            </ul>
            <p className="mt-4 text-[10px] tracking-[0.22em] uppercase text-paper/60">Correspondents</p>
            <ul className="mt-1 space-y-1 text-paper/80">
              <li>M. Okafor <span className="text-paper/40">· player</span></li>
              {round >= 3 && <li>R. Castellanos <span className="text-paper/40">· player</span></li>}
              {round >= 2 && <li>Dr. S. Ely <span className="text-paper/40">· staff</span></li>}
            </ul>
            <p className="mt-4 text-[10px] tracking-[0.22em] uppercase text-paper/60">Today</p>
            <p className="type mt-1 text-paper/80">{locked ? "Locked. Results at 9:00 AM." : "Orders lock at 8:00 PM Eastern. Talking is free."}</p>
          </aside>
        </div>

        {/* controls */}
        <div className="flex flex-wrap items-center gap-3 border-t border-paper/20 px-4 py-2 text-[11px] tracking-[0.18em] uppercase">
          <button onClick={() => { if (!started) { setStarted(true); setI(0); } setPlaying((p) => !p); }} className="border border-paper/60 px-3 py-1 hover:border-red hover:text-red">{playing ? "Pause" : "Play"}</button>
          <button onClick={() => { setPlaying(false); setStarted(true); setI((x) => Math.min(x + 1, SCRIPT.length - 1)); }} className="border border-paper/60 px-3 py-1 hover:border-red hover:text-red">Next</button>
          <button onClick={() => { setI(0); setPlaying(true); setStarted(true); }} className="border border-paper/60 px-3 py-1 hover:border-red hover:text-red">Restart</button>
          <div className="ml-auto h-1 w-40 bg-paper/20"><div className="h-1 bg-red transition-[width] duration-500" style={{ width: `${progress * 100}%` }} /></div>
        </div>
      </div>
    </div>
  );
}
