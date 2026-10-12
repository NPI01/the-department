import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About · Weird.Delivery",
  description: "Weird.Delivery makes play-by-mail games for the inbox, in the line of postal Diplomacy, Flying Buffalo and the 1980s play-by-mail boom.",
};

/* The lineage, oldest first. Facts checked 2026-10-11 against the sources
   listed at the foot of the page. */
const LINEAGE: { year: string; title: string; body: string }[] = [
  {
    year: "1963",
    title: "A war fought by post",
    body: "John Boardman, a science-fiction fan, offers in his fanzine to run a game of Allan Calhamer's Diplomacy by mail. Five players sign up. His newsletter, Graustark, becomes the first postal Diplomacy zine: turn results, press releases from imaginary governments, and letters. It runs for more than forty years.",
  },
  {
    year: "1970",
    title: "The first company",
    body: "Rick Loomis, a soldier stationed in Hawaii, writes to strangers who had advertised for play-by-mail opponents and offers to moderate a game called Nuclear Destruction. Within months he has more than two hundred players and a fellow soldier writing a computer program to resolve their turns. Players cannot see each other's moves until the results arrive. Flying Buffalo becomes the first commercial play-by-mail company.",
  },
  {
    year: "Mid-1970s",
    title: "Fifteen strangers, two hundred and twenty-five worlds",
    body: "Flying Buffalo's Starweb puts fifteen players in one universe, each in a different role with different ways to win. Players who will never meet negotiate, betray and conspire by letter between turns. Starweb is still running.",
  },
  {
    year: "1983",
    title: "The scene finds its voice",
    body: "Paper Mayhem launches from Ottawa, Illinois, in July, a hundred copies of a newsletter that grows into the hobby's leading American magazine. In October, Flagship begins in Britain. Reviews, reader ratings of companies and game masters, and pages of letters: the players start writing about the games they play by writing.",
  },
  {
    year: "1984–1985",
    title: "The boom",
    body: "Hundreds of play-by-mail companies open across the decade, many of them small hobby outfits. Reality Simulations' Hyborian War, adjudicated by computer, begins in 1985 and has been running ever since. Most of the others fold within a few years. The mailbox becomes a place where empires fall on a two-week cycle.",
  },
  {
    year: "1990s",
    title: "Into the inbox",
    body: "Email shortens a fortnight to a day. Play-by-email keeps the shape of the old games (orders, a deadline, a turn report) while the envelopes and the magazines fade away.",
  },
  {
    year: "Now",
    title: "Weird.Delivery",
    body: "A company of its own, making play-by-mail games for people who check their inbox. Its first game, The Department, is set in October 1977: the decade the commercial industry began, when Starweb's players were already writing to each other.",
  },
];

const INHERITED: { then: string; now: string }[] = [
  { then: "The turn report was an event. You waited for it, and you read it twice.", now: "One dispatch a morning, written for you, about what happened overnight because of what you did." },
  { then: "Orders were read literally, and everyone's moves resolved at once.", now: "Commitments go on their own lines and resolve together at the lock. Nobody wins by answering first." },
  { then: "The real game happened in the letters between turns.", now: "Correspondence is free and unlimited. Alliances, bargains and betrayals are made in writing." },
  { then: "You could not see the other players' moves.", now: "You learn what your character could learn, and nothing else." },
  { then: "A good game master wrote back like a person.", now: "Everyone in the company directory answers letters, remembers promises, and has something to lose." },
];

export default function AboutPage() {
  return (
    <main className="flex-1">
      <header className="bg-ink text-paper">
        <div className="mx-auto max-w-5xl px-5 pb-16 pt-6 sm:pb-24">
          <nav className="mb-16 flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.25em] sm:mb-24">
            <Link href="/" className="display text-sm tracking-[0.35em]">Weird<span className="text-red">.</span>Delivery</Link>
            <span className="flex flex-wrap gap-x-5 gap-y-2 whitespace-nowrap">
              <Link href="/" className="hover:text-red">The Department</Link>
              <Link href="/rules" className="hover:text-red">Rulebook</Link>
              <Link href="/guide" className="hover:text-red">Field guide</Link>
            </span>
          </nav>
          <p className="text-[11px] uppercase tracking-[0.4em] text-red">About</p>
          <h1 className="display mt-4 text-6xl sm:text-8xl">Mail<br />for the<br />strange</h1>
          <p className="type mt-8 max-w-2xl text-lg leading-relaxed text-paper/85">
            Weird.Delivery is a game company. It makes play-by-mail games: long, slow, many-player games you play by writing letters,
            where the board is your inbox and the turn ends when the post goes out. It comes from a tradition older than the home
            computer, and it is trying to carry that tradition forward.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <p className="text-[11px] uppercase tracking-[0.3em] text-red">Lineage</p>
        <h2 className="display mt-3 text-4xl sm:text-5xl">Sixty years of waiting for the mail</h2>
        <ol className="mt-12 border-l-2 border-ink">
          {LINEAGE.map((e) => (
            <li key={e.year} className="relative pb-12 pl-8 last:pb-0 sm:pl-12">
              <span className="absolute -left-[7px] top-2 h-3 w-3 bg-red" aria-hidden />
              <p className="display text-2xl text-red sm:text-3xl">{e.year}</p>
              <h3 className="mt-1 text-sm font-medium uppercase tracking-[0.2em]">{e.title}</h3>
              <p className="type mt-3 max-w-3xl text-[16px] leading-relaxed">{e.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y-2 border-ink bg-paper-2">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
          <p className="text-[11px] uppercase tracking-[0.3em] text-red">What we kept</p>
          <h2 className="display mt-3 text-4xl sm:text-5xl">The envelope, minus the fortnight</h2>
          <div className="mt-10 divide-y divide-rule border-y border-rule">
            {INHERITED.map((r, i) => (
              <div key={i} className="grid gap-x-10 gap-y-2 py-6 md:grid-cols-2">
                <p className="text-sm leading-relaxed text-ink-2"><span className="mr-2 text-[11px] uppercase tracking-[0.25em] text-ink">Then</span>{r.then}</p>
                <p className="type text-[16px] leading-relaxed"><span className="mr-2 font-sans text-[11px] uppercase tracking-[0.25em] text-red">Now</span>{r.now}</p>
              </div>
            ))}
          </div>
          <p className="type mt-10 max-w-3xl text-[16px] leading-relaxed">
            What is new is speed and voice. A turn takes a day instead of two weeks. And the people in the game write back: the
            characters you correspond with are played by software, including AI models, that remembers what you told it and
            answers in character. The software writes letters; it never decides what happens. Every consequential act comes from
            a line you wrote on purpose, resolved by fixed rules that are published and explained.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <p className="text-[11px] uppercase tracking-[0.3em] text-red">The first game</p>
        <h2 className="display mt-3 text-4xl sm:text-5xl">The Department</h2>
        <p className="type mt-6 max-w-3xl text-[16px] leading-relaxed">
          October 1977. A private research company on six hundred acres of North Dakota prairie hires a cohort of new employees.
          One letter a day; fourteen days an episode; twelve episodes a season. Everyone you write to is playing too.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 text-[11px] uppercase tracking-[0.25em]">
          <Link href="/#apply" className="border-2 border-ink px-4 py-2 hover:border-red hover:text-red">Apply for employment</Link>
          <Link href="/rules" className="border-2 border-rule px-4 py-2 text-ink-2 hover:border-ink hover:text-ink">Read the rulebook</Link>
        </div>
      </section>

      <footer className="border-t-2 border-ink px-5 py-10">
        <div className="mx-auto max-w-5xl text-xs text-ink-2">
          <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-ink">Sources for the lineage</p>
          <ul className="space-y-1">
            <li><a className="underline hover:text-red" href="https://www.diplomacyworld.net/old/10years.htm">A history of the postal Diplomacy hobby</a> (Diplomacy World)</li>
            <li><a className="underline hover:text-red" href="https://en.wikipedia.org/wiki/Nuclear_Destruction">Nuclear Destruction</a>, <a className="underline hover:text-red" href="https://en.wikipedia.org/wiki/Rick_Loomis">Rick Loomis</a>, <a className="underline hover:text-red" href="https://en.wikipedia.org/wiki/Flying_Buffalo">Flying Buffalo</a>, <a className="underline hover:text-red" href="https://en.wikipedia.org/wiki/Starweb">Starweb</a> (Wikipedia)</li>
            <li><a className="underline hover:text-red" href="https://en.wikipedia.org/wiki/Paper_Mayhem">Paper Mayhem</a>, <a className="underline hover:text-red" href="https://en.wikipedia.org/wiki/Flagship_(magazine)">Flagship</a>, <a className="underline hover:text-red" href="https://en.wikipedia.org/wiki/Hyborian_War">Hyborian War</a>, <a className="underline hover:text-red" href="https://en.wikipedia.org/wiki/Play-by-mail_game">Play-by-mail game</a> (Wikipedia)</li>
          </ul>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-[11px] uppercase tracking-[0.25em]">
            <span className="display text-base tracking-[0.35em] text-ink">Weird<span className="text-red">.</span>Delivery</span>
            <a href="mailto:thedepartment@weird.delivery" className="hover:text-red">thedepartment@weird.delivery</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
