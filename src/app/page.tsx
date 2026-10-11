import { EnlistForm } from "./enlist-form";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-20 flex-1">
      <header className="border-b border-rule pb-6">
        <p className="text-xs tracking-[0.25em] uppercase text-ink-2">Royce Industries</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">Department of Special Research and Development</h1>
        <p className="mt-1 text-sm text-ink-2">Personnel &amp; Administration · Station R, North Dakota</p>
      </header>

      <section className="mt-8 space-y-4 text-[15px] leading-relaxed">
        <div className="grid grid-cols-[9.5rem_1fr] gap-y-1 text-sm">
          <span className="text-ink-2">SUBJECT</span><span>Offer of Employment and Reporting Instructions</span>
          <span className="text-ink-2">CLASSIFICATION</span><span className="text-stamp font-semibold">COMPANY CONFIDENTIAL</span>
          <span className="text-ink-2">DATE</span><span>October 1977</span>
        </div>
        <p className="pt-4">To the prospective employee:</p>
        <p>Royce Industries is a privately held research and development company. Our headquarters occupy several hundred acres of prairie in north-central North Dakota. Compensation is excellent. Benefits are unusually generous. Relocation expenses are paid in full.</p>
        <p>Employees are hired in cohorts. Each cohort serves a six-week probationary term of daily correspondence. Employees receive instructions by mail each morning and submit their orders by 8:00 PM Eastern.</p>
        <p>Your employment agreement contains a confidentiality clause. Please read it. You may receive communications from individuals whose names do not appear on the staff directory. This is not necessarily an administrative error.</p>
        <p>Nobody will be particularly interested in telling you what the company manufactures.</p>
      </section>

      <section className="mt-10 border-t border-rule pt-8">
        <h2 className="text-sm tracking-[0.2em] uppercase text-ink-2">Form RI-1 · Application for Employment</h2>
        <EnlistForm />
        <p className="mt-4 text-xs text-ink-2 leading-relaxed">
          The Department is a correspondence game. Mail you send to the game is processed by software, including AI models, to run the simulation. It is never shared with other players except as the game&apos;s rules allow. Out-of-game personal information is not used in play.
        </p>
      </section>

      <footer className="mt-16 text-xs text-ink-2">Royce Industries · Incorporated Delaware 1959 · Station R opened 1972</footer>
    </main>
  );
}
