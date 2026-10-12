import Image from "next/image";
import Link from "next/link";
import { EnlistForm } from "./enlist-form";
import { Reveal } from "./_landing/Reveal";
import { Typewriter } from "./_landing/Typewriter";
import { Parallax } from "./_landing/Parallax";
import { RoundsDemo } from "./_landing/RoundsDemo";

const IRREGULARITIES = [
  "A requisition for a specimen that cannot be located.",
  "A helicopter landing where no flight was scheduled.",
  "A sheriff asking why company trucks were parked beside a dead steer.",
  "Two maps of the same campus that do not agree about Building 7.",
  "A scientist who transferred out of state. The facility has never heard of her.",
  "A technician's locker, sealed in July.",
  "A town forty miles west with a church, a cemetery, and fourteen residents.",
  "A photograph under your door. On the back: They're not worshipping it.",
];

const DEPARTMENTS = ["Advanced Materials", "Aerospace Systems", "Biological Sciences", "Applied Physics", "Information Systems", "Procurement & Logistics", "Corporate Security", "Personnel & Administration"];

const EPISODES = [
  ["I", "Orientation"], ["II", "The Harvest"], ["III", "The Devil Cult"], ["IV", "The Church at Tagus"],
  ["V", "The Unfinished Descent"], ["VI", "The Sons of Sam"], ["VII", "SENTINEL"], ["VIII", "The Minot Winter"],
  ["IX", "The Omega Hypothesis"], ["X", "Drawing 68-24"], ["XI", "The Threshold"], ["XII", "The Opening"],
];

function Plate({ src, alt, caption, className = "", priority = false }: { src: string; alt: string; caption?: string; className?: string; priority?: boolean }) {
  return (
    <Reveal as="figure" className={`reveal-wipe relative overflow-hidden bg-ink ${className}`}>
      <Image src={src} alt={alt} width={1456} height={816} priority={priority} className="h-full w-full object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
      {caption && <figcaption className="type absolute bottom-0 left-0 right-0 bg-ink/80 px-4 py-2 text-[13px] text-paper/90">{caption}</figcaption>}
    </Reveal>
  );
}

export default function Home() {
  return (
    <main className="relative flex-1 overflow-x-clip">
      <div className="scanline" aria-hidden />

      {/* ---------- masthead ---------- */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-4 mix-blend-difference text-paper">
        <a href="#top" className="display text-sm tracking-[0.35em]">Weird<span className="text-red">.</span>Delivery</a>
        <nav className="hidden gap-6 text-[11px] tracking-[0.25em] uppercase sm:flex">
          <a href="#how" className="hover:text-red">How it plays</a>
          <Link href="/demo" className="hover:text-red">Demo</Link>
          <a href="#company" className="hover:text-red">The company</a>
          <a href="#social" className="hover:text-red">The secret game</a>
          <a href="#season" className="hover:text-red">Season one</a>
          <a href="/about" className="hover:text-red">About</a>
        </nav>
        <a href="/subscribe" className="border border-current px-3 py-1 text-[11px] tracking-[0.25em] uppercase hover:border-red hover:text-red">Apply</a>
      </header>

      {/* ---------- hero ---------- */}
      <section id="top" className="relative flex min-h-[100svh] items-end overflow-hidden bg-ink text-paper">
        <div className="absolute inset-0">
          <Image src="/images/building-x.jpg" alt="A compound on the prairie under a red and black sky" fill priority className="kenburns object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-40 sm:pb-24">
          <Reveal className="reveal">
            <p className="text-[11px] tracking-[0.4em] uppercase text-paper/70">Weird.Delivery presents · a play-by-mail game</p>
          </Reveal>
          <Reveal className="reveal-ink delay-1">
            <h1 className="display mt-3 text-[18vw] leading-[.85] sm:text-[12vw] lg:text-[9.5rem]">
              The<br />Depart<span className="text-red">ment</span>
            </h1>
          </Reveal>
          <Reveal className="reveal delay-3">
            <Typewriter className="type mt-6 max-w-xl text-lg text-paper/90 sm:text-xl" lines={["October 1977. North Dakota.", "You've just accepted a position with Royce Industries.", "Nobody will tell you what the company makes."]} />
          </Reveal>
          <Reveal className="reveal delay-4 mt-10 flex flex-wrap items-center gap-4">
            <a href="/subscribe" className="display inline-block border-2 border-red bg-red px-7 py-3 text-xl tracking-wider text-paper transition hover:bg-transparent hover:text-red">Apply for employment</a>
            <a href="#how" className="text-[11px] tracking-[0.3em] uppercase text-paper/70 hover:text-paper">One letter a day ↓</a>
          </Reveal>
        </div>
      </section>

      {/* ---------- irregularities marquee ---------- */}
      <div className="border-y-2 border-ink bg-paper py-3 overflow-hidden" aria-hidden>
        <div className="marquee type text-[15px] text-ink">
          {[...IRREGULARITIES, ...IRREGULARITIES].map((t, i) => (
            <span key={i} className="px-6">{t} <span className="text-red">■</span></span>
          ))}
        </div>
      </div>

      {/* ---------- how it plays ---------- */}
      <section id="how" className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
        <Reveal className="reveal">
          <p className="text-[11px] tracking-[0.4em] uppercase text-red">How it plays</p>
          <h2 className="display mt-2 text-5xl sm:text-7xl">One letter<br />a day.</h2>
        </Reveal>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {[
            ["09:00", "The morning dispatch", "Every morning a letter arrives in your inbox: yesterday's results, new memos, a note from a colleague, sometimes from someone who is not on the directory."],
            ["All day", "Correspondence", "You write. To your department head, to the sheriff, to the rancher, to the stranger who wrote first. Alliances, bargains, threats, votes. Talking is free."],
            ["20:00", "Orders lock", "What you have actually committed to is read at eight o'clock Eastern. Overnight the world resolves. Fourteen days make an episode. Twelve episodes make a season."],
          ].map(([t, h, b], i) => (
            <Reveal key={h} className={`reveal delay-${i + 1} border-t-2 border-ink pt-5`}>
              <p className="display text-4xl text-red">{t}</p>
              <h3 className="display mt-2 text-2xl">{h}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{b}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="reveal mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px] tracking-[0.2em] uppercase text-ink-2">
          <span>No app</span><span className="text-red">·</span><span>No login</span><span className="text-red">·</span><span>Your mail client is the board</span><span className="text-red">·</span><span>Roots in play-by-mail, 1970s postal games</span>
        </Reveal>
      </section>

      {/* ---------- three rounds, live ---------- */}
      <section id="demo" className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
        <Reveal className="reveal max-w-2xl">
          <p className="text-[11px] tracking-[0.4em] uppercase text-red">Three rounds</p>
          <h2 className="display mt-2 text-5xl sm:text-7xl">Watch it play.</h2>
          <p className="type mt-6 text-[17px] leading-relaxed text-ink-2">A new hire's first three days, compressed. Dispatches arrive. Another player writes. You answer. At eight o'clock your orders lock and the world resolves overnight. In the morning, consequences. Everything in it is what the game actually does.</p>
        </Reveal>
        <div className="mt-12"><RoundsDemo /></div>
        <Reveal className="reveal mt-6 text-[11px] tracking-[0.3em] uppercase text-ink-2">
          <Link href="/demo" className="hover:text-red">Open full-screen →</Link>
        </Reveal>
      </section>

      {/* ---------- the company ---------- */}
      <section id="company" className="relative bg-ink text-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-24 sm:py-32 lg:grid-cols-2 lg:items-center">
          <div>
            <Reveal className="reveal">
              <p className="text-[11px] tracking-[0.4em] uppercase text-red">The company</p>
              <h2 className="display mt-2 text-5xl sm:text-7xl">Royce<br />Industries</h2>
            </Reveal>
            <Reveal className="reveal delay-1 type mt-8 space-y-4 text-[17px] leading-relaxed text-paper/90">
              <p>A privately owned research and development company on six hundred acres of prairie, forty miles from the missile fields. The compensation is excellent. The benefits are unusually generous. Your relocation expenses have been paid in full.</p>
              <p>Some divisions produce no marketable products. Certain projects receive equipment far beyond their stated budgets. Restricted buildings have their own power supplies. There is a night flight operation and no aviation department.</p>
              <p>You are not hired to investigate this. You are hired to work there.</p>
            </Reveal>
            <Reveal className="reveal delay-2 mt-8">
              <span className="stamp text-sm">Company confidential</span>
            </Reveal>
          </div>
          <div className="grid gap-4">
            <Parallax speed={0.15}><Plate src="/images/building-1.jpg" alt="Aerial view of a white and red research campus on bare ground" caption="STATION R · aerial survey, 1972" /></Parallax>
            <Parallax speed={0.3} className="lg:ml-16"><Plate src="/images/building-9.jpg" alt="A research building on the prairie" caption="Building 7. Your map may not show it." /></Parallax>
          </div>
        </div>
        <div className="border-t border-paper/20 py-4 overflow-hidden" aria-hidden>
          <div className="marquee display text-3xl text-paper/80">
            {[...DEPARTMENTS, ...DEPARTMENTS].map((d, i) => <span key={i} className="px-8">{d}<span className="ml-8 text-red">/</span></span>)}
          </div>
        </div>
      </section>

      {/* ---------- the country ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
        <Reveal className="reveal max-w-2xl">
          <p className="text-[11px] tracking-[0.4em] uppercase text-red">The country</p>
          <h2 className="display mt-2 text-5xl sm:text-7xl">The ground is<br />not empty here.</h2>
          <p className="type mt-6 text-[17px] leading-relaxed text-ink-2">Minot Air Force Base and its Minuteman fields. Cattle found cut in ways ranchers cannot explain. Unmarked helicopters at night. A near-abandoned railroad town called Tagus with a church, a cemetery, and a story about a stairway. All of it in the newspapers. None of it explained.</p>
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Plate src="/images/minuteman-1.jpg" alt="A missile installation under a red sky" caption="Minuteman field, Ward County" />
          <Plate src="/images/cattle-1.jpg" alt="A herd of cattle on snow, one animal apart" caption="Vane Cattle Co. · north pasture" className="sm:translate-y-8" />
          <Plate src="/images/black-helicopter-1.jpg" alt="A dark helicopter against a red sky" caption="Prairie Meridian Aviation · 'calibration run'" />
          <Plate src="/images/tagus-1.jpg" alt="A small prairie town in snow with two figures walking" caption="Tagus, N.D. · pop. 14" className="sm:translate-y-8" />
          <Plate src="/images/tagus-church-1.jpg" alt="A white church on the prairie, half the sky painted red" caption="St. Olaf · the bell was removed in 1961" />
          <Plate src="/images/stairway-to-hell-1.jpg" alt="A long staircase descending into a dark pit on the plains" caption="Halvorsen parcel · do not descend alone" className="sm:translate-y-8" />
        </div>
      </section>

      {/* ---------- the secret social game ---------- */}
      <section id="social" className="relative overflow-hidden bg-red text-paper">
        <div className="halftone absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <Reveal className="reveal max-w-3xl">
            <p className="text-[11px] tracking-[0.4em] uppercase text-paper/80">The secret game</p>
            <h2 className="display mt-2 text-5xl sm:text-7xl">Everyone you write to<br />is playing too.</h2>
            <p className="type mt-6 text-[17px] leading-relaxed">Twelve to twenty-four players arrive in the same cohort with different jobs, different clearances, and sealed private objectives. The procurement analyst needs the financial analyst's ledger. The security investigator needs personnel's files. Somebody in your department has already been invited to a meeting after sunset and has not told you.</p>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["Correspondence", "Every letter routes through the Department. Threats, promises, and bargains are remembered. So are the ones you break."],
              ["Committees", "Nine seats, three bodies, real votes. Lobby the directors by mail. One flipped seat changes what the company is allowed to know."],
              ["Invitations", "Some players will receive an envelope that was not sent by the company. Attend, report it, infiltrate, or ignore it."],
              ["Evidence", "What you know, what you believe, and what you can prove are three different things. A finding can be formally established and still be wrong."],
            ].map(([h, b], i) => (
              <Reveal key={h} className={`reveal delay-${i + 1} border-t-2 border-paper/70 pt-4`}>
                <h3 className="display text-2xl">{h}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-paper/90">{b}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="reveal mt-16 grid gap-4 sm:grid-cols-2">
            <Plate src="/images/cattle-3.jpg" alt="Cattle on the prairie" caption="'The animal was drained. No blood. Clean cuts.' — D. Hollis, Sheriff" />
            <Plate src="/images/black-helicopter-2.jpg" alt="A helicopter over the plains" caption="'I do not want unmarked rotors touching our soil without my signature.' — H. Sloane" />
          </Reveal>
        </div>
      </section>

      {/* ---------- a letter ---------- */}
      <section className="mx-auto max-w-3xl px-5 py-24 sm:py-32">
        <Reveal className="reveal border-2 border-ink bg-paper-2 p-6 sm:p-10 shadow-[12px_12px_0_var(--ink)]">
          <div className="grid grid-cols-[6rem_1fr] gap-y-1 text-[12px] text-ink-2">
            <span>FROM</span><span>Personnel &amp; Administration, Royce Industries</span>
            <span>TO</span><span>The newly hired employee</span>
            <span>DATE</span><span>October 10, 1977</span>
            <span>SUBJECT</span><span>Orientation and Shared Duty</span>
          </div>
          <Typewriter className="type mt-6 space-y-3 text-[16px] leading-relaxed" speed={18} lines={[
            "Your acceptance is recorded. Report to Building 1, Room 104, at 0800 hours.",
            "You will not be told the function of the Department of Special Research and Development. You will coordinate with the Department on all cross-departmental projects.",
            "You may receive communications from individuals whose names do not appear on the staff directory. This is not necessarily an administrative error.",
          ]} />
          <p className="type mt-6 text-right text-[15px]">— D. Armitage, Director</p>
        </Reveal>
      </section>

      {/* ---------- season one ---------- */}
      <section id="season" className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <Reveal className="reveal">
            <p className="text-[11px] tracking-[0.4em] uppercase text-red">Season one · twelve episodes · six months</p>
            <h2 className="display mt-2 text-5xl sm:text-7xl">The High Country<br />Program</h2>
          </Reveal>
          <ol className="mt-12 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {EPISODES.map(([n, t], i) => (
              <Reveal key={t} as="li" className={`reveal delay-${(i % 4) + 1} flex items-baseline gap-4 border-b border-paper/15 py-3`}>
                <span className="display w-10 text-2xl text-red">{n}</span>
                <span className="display text-2xl">{t}</span>
              </Reveal>
            ))}
          </ol>
          <Reveal className="reveal mt-12 grid gap-4 sm:grid-cols-2">
            <Plate src="/images/north-dakota-1.jpg" alt="A red car on a black road across snowy plains" caption="Relocation expenses paid in full." />
            <Plate src="/images/stairway-to-hell-2.jpg" alt="A staircase descending into the earth" caption="Episode V. If authorized." />
          </Reveal>
          <Reveal className="reveal type mt-10 max-w-2xl text-[15px] leading-relaxed text-paper/80">
            <p>The first cohort plays Episodes I–III as a six-week pilot. Fourteen daily rounds per episode. What you find, whom you tell, and what the Board decides are permanent. The game ends when it ends; nobody has told us either.</p>
          </Reveal>
        </div>
      </section>

      {/* ---------- apply ---------- */}
      <section id="apply" className="relative overflow-hidden bg-ink text-paper">
        <div className="absolute inset-0 opacity-40">
          <Image src="/images/tagus-church-2.jpg" alt="" fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/60 to-ink" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 py-24 sm:py-32">
          <Reveal className="reveal">
            <p className="text-[11px] tracking-[0.4em] uppercase text-red">Form RI-1</p>
            <h2 className="display mt-2 text-5xl sm:text-7xl">Apply for<br />employment.</h2>
            <p className="type mt-6 text-[16px] text-paper/85">Employees are hired in cohorts. Leave an address. When a cohort is convened you will receive your offer letter, your department, and your first instructions from thedepartment@weird.delivery.</p>
          </Reveal>
          <Reveal className="reveal delay-2"><EnlistForm /></Reveal>
          <Reveal className="reveal delay-3 mt-8 text-[11px] leading-relaxed text-paper/50">
            <p>The Department is a correspondence game by Weird.Delivery. Mail you send to the game is processed by software, including AI models, to run the simulation, and is never shared with other players except as the game's rules allow. Out-of-game personal information is not used in play. You can leave at any time by writing RESIGN.</p>
          </Reveal>
        </div>
      </section>

      <footer className="border-t-2 border-ink bg-paper px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-[11px] tracking-[0.25em] uppercase text-ink-2">
          <span className="display text-base tracking-[0.35em] text-ink">Weird<span className="text-red">.</span>Delivery</span>
          <a href="/about" className="hover:text-red">Play-by-mail games for people who check their inbox · About</a>
          <a href="mailto:thedepartment@weird.delivery" className="hover:text-red">thedepartment@weird.delivery</a>
        </div>
      </footer>
    </main>
  );
}
