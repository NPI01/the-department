import { EnlistForm } from "./enlist-form";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-20 flex-1">
      <header className="border-b border-rule pb-6">
        <p className="text-xs tracking-[0.25em] uppercase text-ink-2">United States Government</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">Office of Administrative Survey</h1>
        <p className="mt-1 text-sm text-ink-2">Personnel Division · Washington, D.C.</p>
      </header>

      <section className="mt-8 space-y-4 text-[15px] leading-relaxed">
        <div className="grid grid-cols-[9.5rem_1fr] gap-y-1 text-sm">
          <span className="text-ink-2">SUBJECT</span><span>Appointment and Reporting Instructions</span>
          <span className="text-ink-2">CLASSIFICATION</span><span className="text-stamp font-semibold">INTERNAL</span>
          <span className="text-ink-2">DATE</span><span>October 1977</span>
        </div>
        <p className="pt-4">To the prospective employee:</p>
        <p>The Office of Administrative Survey is responsible for records management, government property inventories, and unusual interagency administrative matters.</p>
        <p>Appointments are made in cohorts. Each cohort serves a six-week probationary term of daily correspondence. Employees receive instructions by mail each morning and submit their orders by 8:00 PM Eastern.</p>
        <p>You may receive communications from individuals whose names do not appear on the current staff directory. This is not necessarily an administrative error.</p>
        <p>Do not assume that an absence of documentation constitutes proof that something does not exist.</p>
      </section>

      <section className="mt-10 border-t border-rule pt-8">
        <h2 className="text-sm tracking-[0.2em] uppercase text-ink-2">Form OAS-1 · Request for Appointment</h2>
        <EnlistForm />
        <p className="mt-4 text-xs text-ink-2 leading-relaxed">
          The Department is a correspondence game. Mail you send to the game is processed by software, including AI models, to run the simulation. It is never shared with other players except as the game&apos;s rules allow. Out-of-game personal information is not used in play.
        </p>
      </section>

      <footer className="mt-16 text-xs text-ink-2">Continuity Order 7 · Est. 1947</footer>
    </main>
  );
}
