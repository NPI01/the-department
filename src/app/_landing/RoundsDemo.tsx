"use client";
import { useEffect, useRef, useState } from "react";

/* A scripted, autoplaying demonstration of three rounds. Everything shown is
   public canon (Episode 01). "You" are a new hire in Information Systems;
   "Okafor" and "Castellanos" are other players; Armitage, Ely, Hollis are NPCs. */

type Mail = { from: string; addr: string; to: string; subject: string; text: string; date: string; thread: string; player?: boolean; quote?: string; attachment?: "map" };
type Beat =
  | ({ kind: "dispatch" | "in"; round: number; time: string } & Mail)
  | { kind: "out"; round: number; time: string; to: string; toAddr: string; subject: string; text: string; date: string; thread: string; quote: string }
  | { kind: "order"; round: number; time: string; date: string; note: string; lines: string[] }
  | { kind: "ack"; round: number; time: string; date: string; count: number }
  | { kind: "lock"; round: number }
  | { kind: "resolve"; round: number }
  | { kind: "note"; round: number; time: string; text: string }
  | { kind: "end"; round: number };

export const PLAYER = { name: "Joe Pruitt", first: "Joe", addr: "joe.pruitt@yourmail.com" };
export const YOU = PLAYER.addr;
const DEPT = "thedepartment@weird.delivery";
const D = ["", "Mon, Oct 10, 1977", "Tue, Oct 11, 1977", "Wed, Oct 12, 1977", "Thu, Oct 13, 1977"];

const SCRIPT: Beat[] = [
  { kind: "dispatch", round: 1, time: "9:00 AM", date: D[1], thread: "orientation", from: "Dorothy Armitage", addr: "armitage@weird.delivery", to: `${PLAYER.name} <${YOU}>`, subject: "Welcome, and a word about shared duty", text: "Joe,\n\nYour acceptance is recorded, and I'm glad of it. Report to Building 1, Room 104, at eight. Bring your identification and two photographs.\n\nYou will not be told the function of the Department of Special Research and Development; that is not a slight. You may also receive letters from people whose names are not on the staff directory. That is not necessarily an administrative error.\n\nMy door is open, darling. Most doors here are not.\n\n— Dorothy Armitage, Personnel & Administration" },
  { kind: "dispatch", round: 1, time: "9:02 AM", date: D[1], thread: "map", from: "Facilities Management", addr: "facilities@weird.delivery", to: `${PLAYER.name} <${YOU}>`, subject: "Campus Layout Reference — Information Systems issue", text: "Mr. Pruitt,\n\nAttached is your department's authorized map of Station R. It is the only copy you should use. Please do not compare it with maps issued to other departments; report any discrepancy to this office only.", attachment: "map" },
  { kind: "note", round: 1, time: "9:04 AM", text: "You notice Building 7 is marked restricted. Nobody mentioned a Building 7." },
  { kind: "in", round: 1, time: "11:40 AM", date: D[1], thread: "map", player: true, from: "Maya Okafor", addr: "okafor@weird.delivery", to: `${PLAYER.name} <${YOU}>`, subject: "Re: Campus Layout Reference", text: "Joe — hi. We met at the badge table this morning; I'm the one who dropped her photographs.\n\nQuick question, since we're both new. Does your map show a Building 9 north of the perimeter road? Mine does. No label.\n\n— Maya", quote: "Please do not compare it with maps issued to other departments." },
  { kind: "out", round: 1, time: "11:52 AM", date: D[1], thread: "map", to: "Maya Okafor", toAddr: "okafor@weird.delivery", subject: "Re: Campus Layout Reference", text: "Maya — I remember. No Building 9 on mine. But my 7 is marked restricted, and from what you say yours calls it cold storage.\n\nKeep this between us until we know who else noticed?\n\n— Joe", quote: "Does your map show a Building 9 north of the perimeter road? Mine does. No label." },
  { kind: "in", round: 1, time: "4:20 PM", date: D[1], thread: "harvest", from: "Dr. Sarah Ely", addr: "ely@weird.delivery", to: "G. Voss <voss@weird.delivery>, cc: all departments", subject: "URGENT: Specimen Retrieval — HARVEST", text: "Mr. Voss,\n\nThe previous shipment, designated for delivery on September 28, was never logged into storage. I have checked the loading dock manifest and the cold storage logs. The crates are missing.\n\nI need Lot 77-B replaced today. Dr. Marsh insisted on precision for this handoff. I wish she were still here to oversee it.\n\nSarah Ely" },
  { kind: "order", round: 1, time: "7:52 PM", date: D[1], note: "Here's what I'd like to do tonight.", lines: ["ORDER: REQUEST_FILES Facilities ledger, Building 7", "ORDER: REQUEST_FILES HARVEST sampling authorizations 1976"] },
  { kind: "ack", round: 1, time: "7:52 PM", date: D[1], count: 2 },
  { kind: "lock", round: 1 },
  { kind: "resolve", round: 1 },
  { kind: "dispatch", round: 2, time: "9:00 AM", date: D[2], thread: "r2", from: "The Department", addr: DEPT, to: `${PLAYER.name} <${YOU}>`, subject: "Tuesday, October 11 — your results", text: "Good morning, Joe.\n\nFacilities ledger, Building 7: you found the entry. It has been struck through in ink, with a note in the margin: \"see DSRD.\"\n\nYour request for the 1976 HARVEST sampling authorizations was referred to Dr. Ely's office. No reply yet.\n\nYour orders lock again at 8:00 PM." },
  { kind: "dispatch", round: 2, time: "9:00 AM", date: D[2], thread: "sheriff", from: "Corporate Security", addr: "security@weird.delivery", to: "all departments", subject: "FW: Inquiry from Sheriff Hollis — Royce vehicles at Vane ranch", text: "Forwarded for awareness. Do not respond to the Sheriff directly.\n\n> Vane says one of your trucks was parked by a steer that turned up dead yesterday. Drained. Clean cuts. He says your guys were using a special light, something blue. I drove out. No trucks. No lights. — D. Hollis" },
  { kind: "in", round: 2, time: "10:15 AM", date: D[2], thread: "pgs", player: true, from: "Maya Okafor", addr: "okafor@weird.delivery", to: `${PLAYER.name} <${YOU}>`, subject: "Something in the invoices", text: "Joe —\n\nConcrete, cable, surveying gear, ventilation. Delivered 1969 to 1977 to an inactive property near a town called Tagus, billed to a subsidiary called Prairie Geological Services. No operational records anywhere.\n\nWant in? I need someone who can read the mainframe index, and that's you.\n\n— M." },
  { kind: "out", round: 2, time: "10:31 AM", date: D[2], thread: "pgs", to: "Maya Okafor", toAddr: "okafor@weird.delivery", subject: "Re: Something in the invoices", text: "In. I'll trade you the Building 7 ledger line for it.\n\nSend me the PGS invoice numbers and I'll look for them on the index tonight.\n\n— Joe", quote: "Want in? I need someone who can read the mainframe index, and that's you." },
  { kind: "in", round: 2, time: "3:05 PM", date: D[2], thread: "ely", from: "Dr. Sarah Ely", addr: "ely@weird.delivery", to: `${PLAYER.name} <${YOU}>`, subject: "(no subject)", text: "Mr. Pruitt,\n\nWho told you to ask about the 1976 authorizations?\n\nCome by the lab after five. Bring no one.\n\n— S.E." },
  { kind: "order", round: 2, time: "7:58 PM", date: D[2], note: "Going to see Ely. Keep the index search running.", lines: ["ORDER: VISIT Biological Sciences lab (Dr. Ely), alone", "ORDER: SEARCH mainframe index for PGS invoice numbers (standing)"] },
  { kind: "ack", round: 2, time: "7:58 PM", date: D[2], count: 2 },
  { kind: "lock", round: 2 },
  { kind: "resolve", round: 2 },
  { kind: "dispatch", round: 3, time: "9:00 AM", date: D[3], thread: "r3", from: "The Department", addr: DEPT, to: `${PLAYER.name} <${YOU}>`, subject: "Wednesday, October 12 — your results", text: "Joe,\n\nDr. Ely met you at the lab door and took you down to the cold storage herself. Lot 77-B's shelf is empty. The storage log says it was never delivered. The dock manifest says it was. She let you copy the manifest.\n\nYou now hold: EVIDENCE — HARVEST dock manifest, 9/28, with provenance. It is in your case file.\n\nThe index search found nothing yet. It continues tonight." },
  { kind: "dispatch", round: 3, time: "9:00 AM", date: D[3], thread: "election", from: "Personnel & Administration", addr: "personnel@weird.delivery", to: "the October cohort", subject: "NOTICE · Election of employee representatives", text: "The cohort will elect one representative to the Research Committee and one to the Safety Committee. Ballots close at tonight's lock.\n\nTo vote, reply to this notice with a line reading VOTE E-77-001: <surname> for the Research seat." },
  { kind: "in", round: 3, time: "9:48 AM", date: D[3], thread: "election", player: true, from: "Maya Okafor", addr: "okafor@weird.delivery", to: `${PLAYER.name} <${YOU}>`, subject: "Re: NOTICE · Election of employee representatives", text: "Joe — I'm standing for the Research seat. With it I can get the PGS invoices in front of the committee, where someone has to answer for them.\n\nI'd like your vote. I know that's a lot to ask on day three.\n\n— Maya", quote: "The cohort will elect one representative to the Research Committee…" },
  { kind: "in", round: 3, time: "1:12 PM", date: D[3], thread: "castellanos", player: true, from: "Rafael Castellanos", addr: "castellanos@weird.delivery", to: `${PLAYER.name} <${YOU}>`, subject: "A word, Pruitt", text: "Okafor is loud. Loud gets noticed here, and not in the good way.\n\nVote for me instead and I can get your clearance raised by Friday. Think about what you could read with it.\n\nR.C., Corporate Security" },
  { kind: "out", round: 3, time: "6:30 PM", date: D[3], thread: "election", to: "Maya Okafor", toAddr: "okafor@weird.delivery", subject: "Re: NOTICE · Election of employee representatives", text: "You have my vote.\n\nOne thing: don't mention the manifest in committee until I've checked the index. Castellanos wrote to me today. He's counting.\n\n— Joe", quote: "I'd like your vote. I know that's a lot to ask on day three." },
  { kind: "order", round: 3, time: "7:55 PM", date: D[3], note: "My vote, and one more file request.", lines: ["VOTE E-77-001: Okafor", "ORDER: REQUEST_FILES loading dock logs, September 1977"] },
  { kind: "ack", round: 3, time: "7:55 PM", date: D[3], count: 2 },
  { kind: "lock", round: 3 },
  { kind: "resolve", round: 3 },
  { kind: "dispatch", round: 4, time: "9:00 AM", date: D[4], thread: "r4", from: "The Department", addr: DEPT, to: `${PLAYER.name} <${YOU}>`, subject: "Thursday, October 13 — your results", text: "Joe,\n\nElected to the Research seat: Maya Okafor, 7 votes of 12. Your vote was counted.\n\nCastellanos has not written back.\n\nThe loading dock logs for September 27 through 29 are missing from the file. The clerk says they were never missing before." },
  { kind: "note", round: 4, time: "9:00 AM", text: "Later this week, someone will slide an envelope under your door. Inside is a photograph. On the back: They're not worshipping it." },
  { kind: "end", round: 4 },
];

const PHASES = ["validate orders", "close ballots", "execute agreements", "resolve contested actions", "the world moves", "write your dispatch"];

const DELAY: Record<Beat["kind"], number> = { dispatch: 7000, in: 6500, out: 7500, order: 7500, ack: 4500, note: 3600, lock: 2800, resolve: 4600, end: 9000 };

/* Types `text` out while `active`; shows it whole otherwise. The caller keys
   each message so a new message mounts fresh and the counter starts at zero. */
function useTyped(text: string, active: boolean, speed = 22) {
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

function Body({ text, className = "" }: { text: string; className?: string }) {
  return <div className={`type whitespace-pre-line text-[13.5px] leading-snug ${className}`}>{text}</div>;
}

/* The Information Systems issue of the Station R map, as the attachment the
   player opens. Drawn, not photographed: a mimeographed plan. */
function MapAttachment() {
  const B: [number, number, number, number, string][] = [[40, 60, 90, 50, "1"], [150, 60, 70, 40, "2"], [240, 60, 90, 60, "3"], [40, 130, 60, 60, "4"], [120, 140, 110, 50, "5"], [250, 140, 80, 50, "6"], [120, 210, 70, 40, "8"]];
  return (
    <div className="mt-3 border border-ink/30 bg-paper p-2">
      <div className="flex items-center justify-between text-[10px] tracking-[0.18em] uppercase text-ink-2"><span>📎 station-r-layout-IS.pdf · 1 page</span><span>Attachment</span></div>
      <svg viewBox="0 0 380 290" className="mt-2 w-full" role="img" aria-label="Map of Station R, Information Systems issue, with Building 7 marked restricted">
        <rect x="0" y="0" width="380" height="290" fill="var(--paper-2)" />
        <text x="12" y="24" fontFamily="Oswald, Impact, sans-serif" fontSize="16" fill="var(--ink)" letterSpacing="2">STATION R · CAMPUS LAYOUT</text>
        <text x="12" y="40" fontFamily="ui-monospace, monospace" fontSize="8" fill="var(--ink-2)" letterSpacing="1.5">INFORMATION SYSTEMS ISSUE · OCT 1977 · NOT FOR CIRCULATION</text>
        <path d="M20 50 H360 V270 H20 Z" fill="none" stroke="var(--ink)" strokeWidth="1" strokeDasharray="4 3" />
        <text x="24" y="282" fontFamily="ui-monospace, monospace" fontSize="7" fill="var(--ink-2)">PERIMETER ROAD</text>
        <path d="M30 100 C 80 90, 120 110, 200 100 S 320 95, 350 105" fill="none" stroke="var(--ink-2)" strokeWidth="1.2" />
        {B.map(([x, y, w, h, n]) => (
          <g key={n}>
            <rect x={x} y={y} width={w} height={h} fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.2" />
            <text x={x + 6} y={y + 14} fontFamily="Oswald, Impact, sans-serif" fontSize="12" fill="var(--ink)">{n}</text>
          </g>
        ))}
        <g>
          <rect x="250" y="210" width="90" height="46" fill="none" stroke="var(--red)" strokeWidth="1.6" />
          <text x="256" y="225" fontFamily="Oswald, Impact, sans-serif" fontSize="12" fill="var(--red)">7</text>
          <text x="256" y="246" fontFamily="ui-monospace, monospace" fontSize="7.5" fill="var(--red)" letterSpacing="1">(RESTRICTED)</text>
        </g>
        <g transform="translate(340 72)"><path d="M0 -14 L4 0 L0 -4 L-4 0 Z" fill="var(--ink)" /><text x="-3" y="12" fontFamily="ui-monospace, monospace" fontSize="8" fill="var(--ink)">N</text></g>
        <text x="300" y="282" fontFamily="ui-monospace, monospace" fontSize="7" fill="var(--ink-2)">FACILITIES MGMT · COPY 11 OF 14</text>
      </svg>
    </div>
  );
}

/* One email as the player would see it in their mail client. Received mail sits
   left on cream paper; mail you sent sits right on darker paper; replies carry a
   quoted line of what they answer. `reply` marks a follow-up inside a thread. */
function Message({ b, latest, reply }: { b: Beat; latest: boolean; reply: boolean }) {
  const typedOut = useTyped(b.kind === "out" ? b.text : b.kind === "order" ? b.note : "", latest && (b.kind === "out" || b.kind === "order"));
  const nest = reply ? "ml-4 sm:ml-8 border-l border-paper/25 pl-3 sm:pl-5" : "";
  const anim = latest ? "demo-msg-new" : "";
  if (b.kind === "dispatch" || b.kind === "in") {
    const player = b.kind === "in" && b.player;
    return (
      <div className={nest}>
        <div className={`demo-msg ${anim} max-w-[94%] bg-paper px-3 py-3 text-ink shadow-[4px_4px_0_rgba(0,0,0,.35)] sm:px-4`}>
          <div className="mb-2 flex items-center justify-between text-[9px] tracking-[0.22em] uppercase text-ink-2">
            <span className={b.kind === "dispatch" ? "text-red" : player ? "text-ink" : ""}>{b.kind === "dispatch" ? "■ Dispatch" : player ? "● Another player" : "○ Staff"}</span>
            <span>{reply ? "in thread" : "new message"}</span>
          </div>
          <Header rows={[["From", `${b.from} <${b.addr}>`], ["To", b.to], ["Subject", b.subject]]} dateline={`${b.date} · ${b.time}`} />
          <Body text={b.text} className="mt-2" />
          {b.attachment === "map" && <MapAttachment />}
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
        <Header rows={[["From", `${PLAYER.name} <${YOU}>`], ["To", `${b.to} <${b.toAddr}>`], ["Subject", b.subject]]} dateline={`${b.date} · ${b.time}`} />
        <Body text={typedOut} className="mt-2" />{latest && typedOut.length < b.text.length && <span className="caret" />}
        <p className="type mt-2 border-l-2 border-ink/20 pl-2 text-[12px] italic text-ink-2">&gt; {b.quote}</p>
      </div>
    </div>
  );
  if (b.kind === "order") return (
    <div className={`demo-msg ${anim} ml-auto max-w-[94%] border-r-4 border-red bg-paper-2 px-3 py-3 text-ink shadow-[4px_4px_0_rgba(0,0,0,.35)] sm:px-4`}>
      <div className="mb-2 flex items-center justify-between text-[9px] tracking-[0.22em] uppercase text-ink-2">
        <span className="text-red">▲ Composing</span><span>orders for tonight</span>
      </div>
      <Header rows={[["From", `${PLAYER.name} <${YOU}>`], ["To", `The Department <${DEPT}>`], ["Subject", `Orders — Round ${b.round}`]]} dateline={`${b.date} · ${b.time}`} />
      <Body text={typedOut} className="mt-2" />
      <div className="mt-2 font-mono text-[13px]">
        {b.lines.map((l, i) => <p key={l} className="mt-1 bg-red/10 px-1" style={{ animation: latest ? `riseIn .6s ${1.2 + i * 0.9}s both` : undefined }}>{l}</p>)}
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-ink-2" style={{ animation: latest ? "riseIn .6s 3.2s both" : undefined }}>Lines that begin ORDER:, VOTE, or HOLD are read by the Department. The rest is just a note to the clerk.</p>
    </div>
  );
  if (b.kind === "ack") return (
    <div className={`demo-msg ${anim} max-w-[94%] bg-paper px-3 py-3 text-ink shadow-[4px_4px_0_rgba(0,0,0,.35)] sm:px-4`}>
      <div className="mb-2 flex items-center justify-between text-[9px] tracking-[0.22em] uppercase text-ink-2"><span className="text-red">■ Dispatch</span><span>auto-reply</span></div>
      <Header rows={[["From", `The Department <${DEPT}>`], ["To", `${PLAYER.name} <${YOU}>`], ["Subject", `Re: Orders — Round ${b.round}`]]} dateline={`${b.date} · ${b.time}`} />
      <Body text={`Received, ${PLAYER.first}. ${b.count} orders are on file for tonight. They lock at 8:00 PM Eastern; reply before then to change them.`} className="mt-2" />
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

  const visible = SCRIPT.slice(0, i + 1).filter((b) => b.round === round && ["dispatch", "in", "out", "order", "ack", "note"].includes(b.kind));
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
          <span className="text-paper">{PLAYER.name}</span><span>· IS · Clearance 1</span>
          {round >= 2 && <span>· knows Dr. Ely</span>}
          {i >= SCRIPT.findIndex((b) => b.round === 3 && b.kind === "dispatch") && <span className="text-red">· holds: HARVEST dock manifest</span>}
        </div>

        <div className={`grid md:grid-cols-[1fr_15rem] ${fill ? "min-h-0 flex-1" : "min-h-[520px]"}`}>
          {/* feed */}
          <div ref={feedRef} className={`relative space-y-4 overflow-y-auto bg-ink p-3 sm:p-4 [scrollbar-width:thin] ${fill ? "h-full max-h-[calc(100dvh-8.5rem)] md:max-h-[calc(100dvh-6.5rem)]" : "max-h-[60dvh] sm:max-h-[560px]"}`}>
            {i < 0 && <p className="type p-6 text-center text-paper/60">Scroll here to begin. Three rounds, about four minutes.</p>}
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
            <p className="display mt-1 text-xl">{PLAYER.name}</p>
            <p className="text-paper/70">Information Systems · Clearance 1</p>
            <p className="mt-1 break-all text-paper/50">{YOU}</p>
            <p className="mt-4 text-[10px] tracking-[0.22em] uppercase text-paper/60">Holdings</p>
            <ul className="mt-1 space-y-1">
              <li>Campus map (IS copy)</li>
              {i >= SCRIPT.findIndex((b) => b.round === 3 && b.kind === "dispatch") && <li className="text-red" style={{ animation: "riseIn .6s both" }}>HARVEST dock manifest 9/28 · evidence</li>}
            </ul>
            <p className="mt-4 text-[10px] tracking-[0.22em] uppercase text-paper/60">Correspondents</p>
            <ul className="mt-1 space-y-1 text-paper/80">
              <li>Maya Okafor <span className="text-paper/40">· player</span></li>
              {round >= 3 && <li>Rafael Castellanos <span className="text-paper/40">· player</span></li>}
              {round >= 2 && <li>Dr. Sarah Ely <span className="text-paper/40">· staff</span></li>}
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
