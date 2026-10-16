import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Help — The Department", description: "How to play The Department by email: dispatches, orders, Action Units, the lock, the directory." };

const H = ({ children }: { children: React.ReactNode }) => <h2 className="display mt-12 text-3xl sm:text-4xl">{children}</h2>;
const P = ({ children }: { children: React.ReactNode }) => <p className="type mt-4 text-[16px] leading-relaxed text-ink-2">{children}</p>;
const Code = ({ children }: { children: React.ReactNode }) => <pre className="mt-4 overflow-x-auto border-2 border-ink bg-paper-2 p-4 text-[13px] leading-relaxed">{children}</pre>;

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20">
      <p className="text-[11px] tracking-[0.4em] uppercase text-red">Help</p>
      <h1 className="display mt-2 text-5xl sm:text-7xl">How to play<br />by mail.</h1>
      <P>The Department is played entirely through email. There is no app and nothing to install. Each morning you receive a dispatch; during the day you write to people; at 8:00 PM Eastern your orders lock and the night passes.</P>

      <H>The morning dispatch</H>
      <P>Arrives at 9:00 AM Eastern from The Department. It tells you what happened overnight, what came in the mail, and lists what you can do with your day as lettered options with their cost in Action Units.</P>

      <H>Giving orders</H>
      <P>Reply to the dispatch. Put each choice on its own line, or just say it. All of these work:</P>
      <Code>{`A
C

Let's go with A and C.

I'd also like to do D.          ← "also" adds to what is on file

B instead of C.

ORDER: Ask the night guard at Gate 2 who signs for the helicopter.

H                               ← hold: keep your units this round`}</Code>
      <P>Letters pick from the morning's list. A line starting with ORDER: is a free-form attempt at anything else; its cost is ruled in the morning. Anything else you write is treated as a note and is not acted on. A new reply replaces your earlier orders for the night unless it says "also", "add", or "plus", in which case it adds to them.</P>

      <H>Trip-wires: IF and FALLBACK</H>
      <P>An order can wait on something another player does tonight. It costs what it would cost, and the units come back in the morning if the condition never came about. Everyone's ordinary orders resolve first; then every IF line is judged against that night; a fired order cannot set off anyone else's IF line.</P>
      <Code>{`IF anyone requests the motor pool log THEN C
IF Okafor is seen at Building 7 THEN ORDER: report Okafor to Security
IF B-77-003 fails THEN ORDER: lobby Crane against the budget
FALLBACK: ORDER: ask around at the motor pool      ← only if the order above it fails`}</Code>
      <P>Conditions the clerk can read: a named colleague or <em>anyone</em> requests a file; is seen at a place; watches a place; reports me; a ballot number passes or fails; the order above fails.</P>

      <H>Holding, and what you see</H>
      <P>Reply <strong>H</strong> or <strong>HOLD</strong> to keep your units and earn a small bonus. A character who holds, or who sends nothing, is at their desk and alert: in the morning they learn who pulled their department's files overnight and who reported them to Security. <strong>HOLD EXCEPT Okafor, Pruitt</strong> lets those colleagues pass unnoticed.</P>
      <P>Whatever you do, two people who touch the same place, the same file or the same person in one night each learn the other was there, unless one of them was watching from the dark, is an Operative, or took something nobody saw. A contact report is a line in your dispatch, nothing more.</P>

      <H>Standing declarations</H>
      <P>These are free, last until you change them, and the person named is never told:</P>
      <Code>{`AUTHORIZE Okafor                 she may pull your department's files as if one of you
REVOKE Okafor                    she may not
ATTITUDE Pruitt: FRIENDLY        as AUTHORIZE, and your watch lets him pass
ATTITUDE Pruitt: HOSTILE         any sighting of him in your reports goes to Security the same night
ATTITUDE Pruitt: NEUTRAL         nothing automatic either way`}</Code>
      <P>Your own declarations are listed in your dispatch under Standing. You will never see anyone else's; you may notice that a request went through that should not have.</P>

      <H>The paper</H>
      <P>The Minot Daily News comes out on the morning of days 7 and 14 of each episode and reaches every desk: what the committees decided, what the company will say, and anything leaked to it. <code>ORDER: LEAK facilities-ledger-b7</code> sends a copy of something you hold to the paper for its next issue; it costs 6 Action Units, two more for each further leak in the same episode. What the paper prints, everyone knows, roughly. Records keeps a log of who asked for some files.</P>
      <P>The Department answers every reply with a receipt listing exactly what is on file, with the Action Units each order costs. Read the receipt; it is the truth.</P>

      <H>Action Units</H>
      <P>You receive 20 Action Units each round and can bank up to 60. Each order on the morning's list has a cost. Orders are funded in the order you give them; if the list runs past your balance, the receipt marks the ones beyond it, and those are not carried out unless you drop something before the lock. Holding (H) keeps your units and pays a small bonus in the morning.</P>

      <H>The lock</H>
      <P>Orders lock at 8:00 PM Eastern. Whatever is on file at that moment is what the Department carries out overnight. Your latest receipt is the record. After the lock, the night resolves and the next dispatch arrives at 9:00 AM.</P>

      <H>Writing to people</H>
      <P>Reply <strong>DIRECTORY</strong> to any Department mail and the Personnel Directory comes back at once: your cohort, the staff you can write to, and the committees. Reply <strong>HELP</strong> for a one-page list of every line the clerk reads.</P>
      <P>To write to someone, send an ordinary email from your own address. Any of these reach the person: put their address (fisk@weird.delivery) in your To field; or reply to any Department letter and begin with their name ("Mr. Fisk,"); or start the letter with a line "To: Mr. Fisk". Use your mail program's Subject line as usual. You do not need to type To: or Re: in the body.</P>
      <P>Staff reply as themselves, usually within the hour, sometimes not until the morning. Other players reply when they reply. Letters cost nothing; only orders cost Action Units.</P>

      <H>Forms</H>
      <P>Some matters are handled on paper. A staff member may require a company form before acting on, or even discussing, what you have raised. Reply <strong>FORM 14-B</strong> to any Department mail and the blank comes back at once, with a button that opens the form on your personnel file. Fill it in there, or reply with the form number on a line by itself and your answers, each beginning with its number:</P>
      <Code>{`FORM 14-B
1. Joseph Pruitt, badge 4471, Information Systems, supervisor R. Okafor
2. Monday, October 10, about 8:15 AM. I looked at the dash clock.
...
12. Joseph Pruitt`}</Code>
      <P>A filed form is on the record under your name. It costs nothing and is not an order, but staff read it and remember it, and it can be cited against you. A copy, stamped with its index number, is kept in your Case File. Incomplete forms may be returned.</P>

      <H>Documents, copies, and the record</H>
      <P>Anything you obtain goes into your Case File. From there you can hand a copy to a colleague (<code>SEND facilities-ledger-b7 TO Okafor</code>, or the button on the item) or put it before a committee as evidence (<code>FILE facilities-ledger-b7 WITH the Research Committee</code>). Filing is free and on the record: every member is told, the chair may answer, and a document that proves what a member needed to see can change their vote.</P>

      <H>Votes and committees</H>
      <P>When a ballot is open, the notice tells you its number. Reply with a line such as <code>VOTE E-77-001: Okafor</code> or <code>VOTE B-77-003: FOR</code> before the lock on its closing day.</P>

      <H>Leaving</H>
      <P>Reply <strong>RESIGN</strong> to any Department mail. Your character is retired at the next lock and you receive no further dispatches.</P>

      <H>Who is reading my mail?</H>
      <P>Mail you send to the game is processed by software, including AI models, to run the simulation. It is never shared with other players except as the game's rules allow (for example, a letter you send to another player is delivered to that player). Out-of-game personal information is not used in play. Questions: thedepartment@weird.delivery.</P>

      <p className="mt-16 text-[11px] tracking-[0.3em] uppercase text-ink-2"><Link href="/" className="hover:text-red">← Weird.Delivery</Link> · <Link href="/rules" className="hover:text-red">Rules</Link> · <Link href="/guide" className="hover:text-red">Field guide</Link></p>
    </main>
  );
}
