"use client";
import { useActionState, useMemo, useState } from "react";
import { DEJA_VU, IDENTITIES, KNOWLEDGE, SKILLS, SPECIALIZATIONS, priceOut, type Purchasable } from "@/lib/game/creation";
import { submitApplication } from "./actions";

const field = "mt-1 w-full border-2 border-ink bg-paper px-3 py-2 text-[15px] outline-none focus:border-red";
const label = "block text-xs uppercase tracking-[0.2em] text-ink-2";

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t-2 border-ink pt-6">
      <h2 className="display text-2xl"><span className="text-red">{n}</span> {title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Cards<T extends { key: string; name: string; blurb: string }>({ name, items, value, onChange, extra }: { name: string; items: readonly T[]; value: string; onChange: (k: string) => void; extra?: (i: T) => React.ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((i) => (
        <label key={i.key} className={`cursor-pointer border-2 p-3 ${value === i.key ? "border-red bg-paper-2" : "border-rule hover:border-ink"}`}>
          <input type="radio" name={name} value={i.key} checked={value === i.key} onChange={() => onChange(i.key)} className="sr-only" />
          <span className="display text-lg">{i.name}</span>
          {extra?.(i)}
          <p className="type mt-1 text-sm leading-relaxed">{i.blurb}</p>
        </label>
      ))}
    </div>
  );
}

function Purchases({ name, items, chosen, toggle, canAfford }: { name: string; items: Purchasable[]; chosen: string[]; toggle: (k: string) => void; canAfford: (p: Purchasable) => boolean }) {
  const have = (k?: string) => !k || chosen.includes(k);
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((p) => {
        const on = chosen.includes(p.key);
        const locked = !on && (!have(p.requires) || !canAfford(p));
        return (
          <li key={p.key}>
            <label className={`flex cursor-pointer gap-3 border-2 p-2.5 ${on ? "border-red bg-paper-2" : locked ? "border-rule opacity-50" : "border-rule hover:border-ink"}`}>
              <input type="checkbox" name={name} value={p.key} checked={on} disabled={locked} onChange={() => toggle(p.key)} className="mt-1" />
              <span className="min-w-0">
                <span className="flex items-baseline justify-between gap-2"><b>{p.name}</b><span className="shrink-0 text-xs text-red">{p.cost} pt{p.cost > 1 ? "s" : ""}</span></span>
                <span className="type block text-sm leading-snug text-ink-2">{p.blurb}{p.requires && <> · requires {items.find((x) => x.key === p.requires)?.name}</>}</span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export function ApplicationForm({ token, departments, email }: { token: string; departments: { slug: string; name: string }[]; email: string }) {
  const [state, action, pending] = useActionState(submitApplication, undefined);
  const [identity, setIdentity] = useState("");
  const [spec, setSpec] = useState("");
  const [prefs, setPrefs] = useState(["", "", ""]);
  const [skills, setSkills] = useState<string[]>([]);
  const [knowledge, setKnowledge] = useState<string[]>([]);
  const [unexplained, setUnexplained] = useState("");
  const [nearDeath, setNearDeath] = useState("");
  // The browser's zone, read once on the client; the server falls back to Eastern.
  const [tz] = useState(() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"; } catch { return "America/New_York"; } });

  const price = useMemo(() => priceOut(identity, skills, knowledge), [identity, skills, knowledge]);
  const left = price.budget - price.spent;
  const toggle = (list: string[], set: (v: string[]) => void, items: Purchasable[]) => (k: string) => {
    if (list.includes(k)) {
      // dropping a prerequisite drops what depends on it
      const dependents = items.filter((p) => p.requires === k).map((p) => p.key);
      set(list.filter((x) => x !== k && !dependents.includes(x)));
    } else set([...list, k]);
  };
  const canAfford = (p: Purchasable) => identity !== "" && p.cost <= left;

  return (
    <form action={action} className="space-y-10">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="timezone" value={tz} />

      <Section n="1." title="Applicant">
        <label className="block"><span className={label}>Full name, as it will appear in the Personnel Directory</span><input name="name" required minLength={2} maxLength={60} className={field} /></label>
        <label className="block"><span className={label}>Brief biography (where you are from, what you did before Royce)</span><textarea name="bio" rows={5} maxLength={1500} className={`${field} type`} /></label>
        <p className="text-xs text-ink-2">Correspondence will be sent to {email}.</p>
      </Section>

      <Section n="2." title="Identity Matrix">
        <p className="type text-sm">How you came to Royce decides how much you bring with you. Each identity gives a different number of points to spend in section 5.</p>
        <Cards name="identity" items={IDENTITIES} value={identity} onChange={setIdentity} extra={(i) => <span className="ml-2 text-xs text-red">{i.points} points · {i.engine}</span>} />
      </Section>

      <Section n="3." title="Specialization and department">
        <p className="type text-sm">What you are particularly good at, and where you would like to work. Departments are assigned to balance the cohort; your ranking is honoured as far as it can be.</p>
        <Cards name="specialization" items={SPECIALIZATIONS} value={spec} onChange={setSpec} />
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <label key={i} className="block">
              <span className={label}>{["First", "Second", "Third"][i]} choice</span>
              <select name={`dept${i + 1}`} required value={prefs[i]} onChange={(e) => setPrefs(prefs.map((p, j) => (j === i ? e.target.value : p)))} className={field}>
                <option value="">—</option>
                {departments.map((d) => <option key={d.slug} value={d.slug} disabled={prefs.includes(d.slug) && prefs[i] !== d.slug}>{d.name}</option>)}
              </select>
            </label>
          ))}
        </div>
      </Section>

      <Section n="4." title="Interview">
        <label className="block"><span className={label}>Which of your traits is your favorite?</span><input name="trait_favorite" maxLength={300} className={field} /></label>
        <label className="block"><span className={label}>Which of your traits do you hate the most?</span><input name="trait_hated" maxLength={300} className={field} /></label>
        <YesNo name="unexplained" question="Have you ever had an encounter or experience that you couldn't explain?" value={unexplained} onChange={setUnexplained} />
        <YesNo name="near_death" question="Have you ever had a near-death experience?" value={nearDeath} onChange={setNearDeath} />
        <fieldset>
          <legend className={label}>How frequently do you experience déjà vu?</legend>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            {DEJA_VU.map((d) => <label key={d.key} className="flex items-center gap-2"><input type="radio" name="deja_vu" value={d.key} required /> {d.label}</label>)}
          </div>
        </fieldset>
      </Section>

      <Section n="5." title="Skills and knowledge">
        <div className="sticky top-0 z-10 -mx-1 border-2 border-ink bg-paper px-3 py-2 text-sm">
          {identity ? <><b>{left}</b> of {price.budget} points left{price.problems.length > 0 && identity && <span className="ml-3 text-red">{price.problems[0]}</span>}</> : <span className="text-red">Choose an identity in section 2 to see your points.</span>}
        </div>
        <h3 className="text-xs uppercase tracking-[0.2em] text-ink-2">Skills</h3>
        <Purchases name="skills" items={SKILLS} chosen={skills} toggle={toggle(skills, setSkills, SKILLS)} canAfford={canAfford} />
        <h3 className="pt-2 text-xs uppercase tracking-[0.2em] text-ink-2">Knowledge</h3>
        <Purchases name="knowledge" items={KNOWLEDGE} chosen={knowledge} toggle={toggle(knowledge, setKnowledge, KNOWLEDGE)} canAfford={canAfford} />
      </Section>

      <Section n="6." title="Declaration">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="consent" value="yes" required className="mt-1" />
          <span className="type">I understand that The Department is a game; that mail I send to it is read by software, including AI models, to run the simulation and is stored; that it is never shown to other players except as the rules allow; and that nothing in this application is checked against real records.</span>
        </label>
        {state?.error && <p className="border-2 border-red p-3 text-sm text-red">{state.error}</p>}
        <button disabled={pending || !price.ok} className="border-2 border-ink px-5 py-2.5 text-[11px] uppercase tracking-[0.25em] hover:border-red hover:text-red disabled:opacity-50">
          {pending ? "Filing…" : "File application"}
        </button>
        <p className="text-xs text-ink-2">Personnel reviews applications within 24 hours. You will be notified at {email}.</p>
      </Section>
    </form>
  );
}

function YesNo({ name, question, value, onChange }: { name: string; question: string; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className={label}>{question}</legend>
      <div className="mt-2 flex gap-4 text-sm">
        {["yes", "no"].map((v) => <label key={v} className="flex items-center gap-2 capitalize"><input type="radio" name={name} value={v} required checked={value === v} onChange={() => onChange(v)} /> {v}</label>)}
      </div>
      {value === "yes" && <textarea name={`${name}_text`} rows={4} maxLength={2000} required placeholder="Describe it." className={`${field} type mt-2`} />}
      {value !== "yes" && <input type="hidden" name={`${name}_text`} value="" />}
    </fieldset>
  );
}
