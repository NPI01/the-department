"use client";
import { useEffect, useRef, useState } from "react";

/* A scripted, autoplaying demonstration of three rounds. Everything shown is
   public canon (Episode 01). "You" are a new hire in Information Systems;
   "Okafor" and "Castellanos" are other players; Armitage, Ely, Hollis are NPCs. */

type Mail = { from: string; addr: string; to: string; subject: string; text: string; date: string; thread: string; player?: boolean; quote?: string };
type Beat =
  | ({ kind: "dispatch" | "in"; round: number; time: string } & Mail)
  | { kind: "out"; round: number; time: string; to: string; toAddr: string; subject: string; text: string; date: string; thread: string; quote: string }
  | { kind: "order"; round: number; time: string; date: string; lines: string[] }
  | { kind: "lock"; round: number }
  | { kind: "resolve"; round: number }
  | { kind: "note"; round: number; time: string; text: string }
  | { kind: "end"; round: number };

export const YOU = "you@yourmail.com";
const DEPT = "thedepartment@weird.delivery";
const D = ["", "Mon, Oct 10, 1977", "Tue, Oct 11, 1977", "Wed, Oct 12, 1977", "Thu, Oct 13, 1977"];

const SCRIPT: Beat[] = [
  { kind: "dispatch", round: 1, time: "9:00 AM", date: D[1], thread: "orientation", from: "D. Armitage, Personnel & Administration", addr: "armitage@weird.delivery", to: YOU, subject: "Orientation and Shared Duty", text: "Your acceptance is recorded. Report to Building 1, Room 104. You will not be told the function of the Department of Special Research and Development. You may receive communications from individuals whose names do not appear on the staff directory. This is not necessarily an administrative error." },
  { kind: "dispatch", round: 1, time: "9:02 AM", date: D[1], thread: "map", from: "Facilities Management", addr: "facilities@weird.delivery", to: YOU, subject: "Campus Layout Reference", text: "Your copy is the only authorized map for your department. Do not compare copies with other departments. Attached: Station R, Information Systems issue." },
  { kind: "note", round: 1, time: "9:02 AM", text: "Your map labels Building 7 \"Building 7 (restricted)\"." },
  { kind: "in", round: 1, time: "11:40 AM", date: D[1], thread: "map", player: true, from: "M. Okafor", addr: "okafor@weird.delivery", to: YOU, subject: "Re: Campus Layout Reference", text: "Quick question, since we're both new. Does your map show a Building 9 north of the perimeter road? Mine does. No label.", quote: "Your copy is the only authorized map for your department. Do not compare copies with other departments." },
  { kind: "out", round: 1, time: "11:52 AM", date: D[1], thread: "map", to: "M. Okafor", toAddr: "okafor@weird.delivery", subject: "Re: Campus Layout Reference", text: "No Building 9 on mine. But my 7 is marked restricted and I'm told yours is cold storage. Keep this between us until we know who else noticed.", quote: "Does your map show a Building 9 north of the perimeter road? Mine does. No label." },
  { kind: "in", round: 1, time: "4:20 PM", date: D[1], thread: "harvest", from: "Dr. S. Ely, Biological Sciences", addr: "ely@weird.delivery", to: "voss@weird.delivery (cc: all departments)", subject: "URGENT: Specimen Retrieval — HARVEST", text: "The previous shipment, designated for delivery on September 28, was never logged into storage. I have checked the loading dock manifest and the cold storage logs. The crates are missing." },
  { kind: "order", round: 1, time: "7:52 PM", date: D[1], lines: ["ORDER: REQUEST_FILES Facilities ledger, Building 7", "ORDER: REQUEST_FILES HARVEST sampling authorizations 1976"] },
  { kind: "lock", round: 1 },
  { kind: "resolve", round: 1 },
  { kind: "dispatch", round: 2, time: "9:00 AM", date: D[2], thread: "r2", from: "The Department", addr: DEPT, to: YOU, subject: "Round 2 · Results of your orders", text: "Facilities ledger, Building 7: the entry has been struck through in ink. Marginal note: \"see DSRD.\" Your request for HARVEST sampling authorizations was referred to Dr. Ely's office. No reply yet." },
  { kind: "dispatch", round: 2, time: "9:00 AM", date: D[2], thread: "sheriff", from: "Sheriff D. Hollis (fwd: Corporate Security)", addr: "security@weird.delivery", to: "all departments", subject: "FW: Inquiry: Royce vehicles at dead rancher site", text: "Vane says one of your trucks was parked by a steer that turned up dead yesterday. Drained. Clean cuts. He says your guys were using a special light, something blue. I drove out. No trucks. No lights." },
  { kind: "in", round: 2, time: "10:15 AM", date: D[2], thread: "pgs", player: true, from: "M. Okafor", addr: "okafor@weird.delivery", to: YOU, subject: "Something in the invoices", text: "Concrete, cable, surveying gear, ventilation. Delivered 1969 to 1977 to an inactive property near Tagus, billed to a subsidiary called Prairie Geological Services. No operational records. Want in? I need someone who can read the mainframe index." },
  { kind: "out", round: 2, time: "10:31 AM", date: D[2], thread: "pgs", to: "M. Okafor", toAddr: "okafor@weird.delivery", subject: "Re: Something in the invoices", text: "In. I'll trade you the Building 7 ledger line. Send me the PGS invoice numbers and I'll look for them on the index tonight.", quote: "Want in? I need someone who can read the mainframe index." },
  { kind: "in", round: 2, time: "3:05 PM", date: D[2], thread: "ely", from: "Dr. S. Ely", addr: "ely@weird.delivery", to: YOU, subject: "(no subject)", text: "Who told you to ask about the 1976 authorizations? Come by the lab after five. Bring no one. — S.E." },
  { kind: "order", round: 2, time: "7:58 PM", date: D[2], lines: ["ORDER: VISIT Biological Sciences lab (Dr. Ely), alone", "ORDER: SEARCH mainframe index for PGS invoice numbers (standing)"] },
  { kind: "lock", round: 2 },
  { kind: "resolve", round: 2 },
  { kind: "dispatch", round: 3, time: "9:00 AM", date: D[3], thread: "r3", from: "The Department", addr: DEPT, to: YOU, subject: "Round 3 · Results of your orders", text: "Dr. Ely showed you the cold storage. Lot 77-B's shelf is empty. The storage log says it was never delivered. The dock manifest says it was. She let you copy the manifest. You now hold: EVIDENCE — HARVEST dock manifest, 9/28, with provenance." },
  { kind: "dispatch", round: 3, time: "9:00 AM", date: D[3], thread: "election", from: "Personnel & Administration", addr: "personnel@weird.delivery", to: "the October cohort", subject: "NOTICE · Election of employee representatives", text: "The cohort will elect one representative to the Research Committee and one to the Safety Committee. Ballots close at tonight's lock. Reply with VOTE E-77-001: <name> for the Research seat." },
  { kind: "in", round: 3, time: "9:48 AM", date: D[3], thread: "election", player: true, from: "M. Okafor", addr: "okafor@weird.delivery", to: YOU, subject: "Re: NOTICE · Election of employee representatives", text: "I'm standing for the Research seat. With it I can get the PGS invoices in front of the committee. I'd like your vote.", quote: "The cohort will elect one representative to the Research Committee…" },
  { kind: "in", round: 3, time: "1:12 PM", date: D[3], thread: "castellanos", player: true, from: "R. Castellanos, Corporate Security", addr: "castellanos@weird.delivery", to: YOU, subject: "A word", text: "Okafor is loud. Vote for me instead and I can get your clearance raised by Friday. Think about what you could read with it." },
  { kind: "out", round: 3, time: "6:30 PM", date: D[3], thread: "election", to: "M. Okafor", toAddr: "okafor@weird.delivery", subject: "Re: NOTICE · Election of employee representatives", text: "You have my vote. Don't mention the manifest in committee until I've checked the index.", quote: "I'm standing for the Research seat. … I'd like your vote." },
  { kind: "order", round: 3, time: "7:55 PM", date: D[3], lines: ["VOTE E-77-001: okafor", "ORDER: REQUEST_FILES loading dock logs, September 1977"] },
  { kind: "lock", round: 3 },
  { kind: "resolve", round: 3 },
  { kind: "dispatch", round: 4, time: "9:00 AM", date: D[4], thread: "r4", from: "The Department", addr: DEPT, to: YOU, subject: "Round 4 · Results", text: "Elected to the Research seat: M. Okafor, 7 votes of 12. Your vote was counted. Castellanos has not written back. The dock logs for September 27–29 are missing from the file." },
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

function Header({ rows, dateline }: { rows: [string, string][]; dateline: string }) {
  return (
    <div className="grid grid-cols-[3.6rem_1fr] gap-x-2 gap-y-0.5 border-b border-ink/15 pb-2 text-[11px] leading-snug">
      {rows.map(([k, v]) => <div key={k} className="contents"><span className="text-ink-2">{k}</span><span className="min-w-0 break-words">{v}</span></div>)}
      <span className="text-ink-2">Date</span><span>{dateline}</span>
    </div>
  );
}

/* One email as the player would see it in their mail client. Received mail sits
   left on cream paper; mail you sent sits right on darker paper; replies carry a
   quoted line of what they answer. `reply` marks a follow-up inside a thread. */
function Message({ b, latest, reply }: { b: Beat; latest: boolean; reply: boolean }) {
  const typedOut = useTyped(b.kind === "out" ? b.text : "", latest && b.kind === "out");
  const nest = reply ? "ml-4 sm:ml-8 border-l border-paper/25 pl-3 sm:pl-5" : "";
  const anim = latest ? "demo-msg-new" : "";
  if (b.kind === "dispatch" || b.kind === "in") {
    const player = b.kind === "in" && b.player;
    return (
      <div className={`${nest}`}>
        <div className={`demo-msg ${anim} max-w-[94%] bg-paper px-3 py-3 text-ink shadow-[4px_4px_0_rgba(0,0,0,.35)] sm:px-4`}>
          <div className="mb-2 flex items-center justify-between text-[9px] tracking-[0.22em] uppercase text-ink-2">
            <span className={b.kind === "dispatch" ? "text-red" : player ? "text-ink" : ""}>{b.kind === "dispatch" ? "■ Dispatch" : player ? "● Another player" : "○ Staff"}</span>
            <span>{reply ? "in thread" : "new message"}</span>
          </div>
          <Header rows={[["From", `${b.from} <${b.addr}>`], ["To", b.to], ["Subject", b.subject]]} dateline={`${b.date} · ${b.time}`} />
          <p className="type mt-2 text-[13.5px] leading-snug">{b.text}</p>
          {b.quote && <p className="type mt-2 border-l-2 border-ink/20 pl-2 text-[12px] italic text-ink-2">&gt; {b.quote}</p>}
        </div>
      </div>
    );
  }
  if (b.kind === "out") return (
    <div className={nest}>
      <div className={`demo-msg ${anim} ml-auto max-w-[94%] border-r-4 border-red bg-paper-2 px-3 py-3 text-ink shadow-[4px_4px_0_rgba(0,0,0,.35)] sm:px-4`}>
        <div className="mb-2 flex items-center justify-between text-[9px] tracking-[0.22em] uppercase text-ink-2">
          <span className="text-red">▲ Sent by you</span><span>reply</span>
        </div>
        <Header rows={[["From", `you <${YOU}>`], ["To", `${b.to} <${b.toAddr}>`], ["Subject", b.subject]]} dateline={`${b.date} · ${b.time}`} />
        <p className="type mt-2 text-[13.5px] leading-snug">{typedOut}{latest && typedOut.length < b.text.length && <span className="caret" />}</p>
        <p className="type mt-2 border-l-2 border-ink/20 pl-2 text-[12px] italic text-ink-2">&gt; {b.quote}</p>
      </div>
    </div>
  );
  if (b.kind === "order") return (
    <div className={`demo-msg ${anim} ml-auto max-w-[94%] border-r-4 border-red bg-paper-2 px-3 py-3 text-ink shadow-[4px_4px_0_rgba(0,0,0,.35)] sm:px-4`}>
      <div className="mb-2 flex items-center justify-between text-[9px] tracking-[0.22em] uppercase text-ink-2">
        <span className="text-red">▲ Sent by you</span><span>orders</span>
      </div>
      <Header rows={[["From", `you <${YOU}>`], ["To", `The Department <${DEPT}>`], ["Subject", `Orders — Round ${b.round}`]]} dateline={`${b.date} · ${b.time}`} />
      <div className="mt-2 font-mono text-[13px]">
        {b.lines.map((l, i) => <p key={l} className="mt-1" style={{ animation: latest ? `riseIn .5s ${i * 0.5}s both` : undefined }}><span className="text-red">▸</span> {l}</p>)}
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-ink-2">Lines like these are binding at 8:00 PM. Everything else you wrote today was conversation.</p>
    </div>
  );
  if (b.kind === "note") return <p className={`demo-msg ${anim} type px-2 text-[13px] italic text-paper/60`}>{b.text}</p>;
  return null;
}

export function RoundsDemo({ fill = false }: { fill?: boolean } = {}) {
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
    <div ref={ref} className={fill ? "relative flex h-full flex-col" : "relative mx-auto max-w-5xl"}>
      {/* frame */}
      <div className={fill ? "flex min-h-0 flex-1 flex-col bg-ink text-paper" : "border-2 border-ink bg-ink text-paper shadow-[14px_14px_0_var(--red)]"}>
        {/* title bar */}
        <div className="flex items-center justify-between gap-3 border-b border-paper/20 px-3 py-2 text-[11px] tracking-[0.18em] uppercase sm:px-4 sm:tracking-[0.22em]">
          <div className="flex min-w-0 items-center gap-3">
            <span className="display text-base tracking-[0.3em]">Weird<span className="text-red">.</span>Delivery</span>
            <span className="hidden text-paper/60 lg:inline">· Correspondence · thedepartment@weird.delivery</span>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <span><span className="hidden sm:inline">Episode I · </span>Round <span className="text-red">{round}</span>/14</span>
            <span className={`display text-lg tabular-nums ${locked ? "text-red" : ""}`}>{clock}</span>
          </div>
        </div>
        {/* compact dossier for phones; the side panel covers wider screens */}
        <div className="flex items-center gap-x-3 overflow-x-auto whitespace-nowrap border-b border-paper/20 px-3 py-1.5 text-[10px] tracking-[0.16em] uppercase text-paper/70 md:hidden [scrollbar-width:none]">
          <span className="text-paper">A new hire</span><span>· IS · Clearance 1</span>
          {round >= 2 && <span>· knows Dr. Ely</span>}
          {i >= SCRIPT.findIndex((b) => b.round === 3 && b.kind === "dispatch") && <span className="text-red">· holds: HARVEST dock manifest</span>}
        </div>

        <div className={`grid md:grid-cols-[1fr_15rem] ${fill ? "min-h-0 flex-1" : "min-h-[520px]"}`}>
          {/* feed */}
          <div ref={feedRef} className={`relative space-y-4 overflow-y-auto bg-ink p-3 sm:p-4 [scrollbar-width:thin] ${fill ? "h-full max-h-[calc(100dvh-8.5rem)] md:max-h-[calc(100dvh-6.5rem)]" : "max-h-[60dvh] sm:max-h-[560px]"}`}>
            {i < 0 && <p className="type p-6 text-center text-paper/60">Scroll here to begin. Three rounds, about two minutes.</p>}
            {visible.map((b, k) => {
              const thread = "thread" in b ? b.thread : null;
              const reply = Boolean(thread) && visible.slice(0, k).some((x) => "thread" in x && x.thread === thread);
              return <Message key={`${b.round}-${k}`} b={b} latest={b === beat} reply={reply} />;
            })}
            {locked && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/70">
                {beat?.kind === "lock" ? (
                  <div className="stamp text-xl sm:text-3xl md:text-5xl" style={{ animation: "stamp .6s cubic-bezier(.2,.9,.3,1.4) both", color: "var(--red)", borderColor: "var(--red)" }}>8:00 PM · Orders locked</div>
                ) : (
                  <Overnight key={round} />
                )}
              </div>
            )}
            {beat?.kind === "end" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/85 p-6 text-center">
                <p className="display text-2xl sm:text-5xl">Fourteen rounds<br />make an episode.</p>
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
            <p className="mt-1 break-all text-paper/50">{YOU}</p>
            <p className="mt-4 text-[10px] tracking-[0.22em] uppercase text-paper/60">Holdings</p>
            <ul className="mt-1 space-y-1">
              <li>Campus map (IS copy)</li>
              {i >= SCRIPT.findIndex((b) => b.round === 3 && b.kind === "dispatch") && <li className="text-red" style={{ animation: "riseIn .6s both" }}>HARVEST dock manifest 9/28 · evidence</li>}
            </ul>
            <p className="mt-4 text-[10px] tracking-[0.22em] uppercase text-paper/60">Correspondents</p>
            <ul className="mt-1 space-y-1 text-paper/80">
              <li>okafor@weird.delivery <span className="text-paper/40">· player</span></li>
              {round >= 3 && <li>castellanos@weird.delivery <span className="text-paper/40">· player</span></li>}
              {round >= 2 && <li>ely@weird.delivery <span className="text-paper/40">· staff</span></li>}
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
          <div className="ml-auto h-1 w-24 bg-paper/20 sm:w-40"><div className="h-1 bg-red transition-[width] duration-500" style={{ width: `${progress * 100}%` }} /></div>
        </div>
      </div>
    </div>
  );
}
