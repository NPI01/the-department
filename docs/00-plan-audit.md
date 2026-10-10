# The Department — Plan Audit

Audited 2026-10-10 against the ChatGPT brainstorm in `docs/source/chatgpt-brainstorm.md`
(Game Design 03, Game Design 04, World Bible 01). Designs 01 and 02 were not in the share,
so anything they covered (the core world-state model, the original engine sketch) is
treated here as unspecified.

Stack decided by Nathan: Next.js on Vercel, Supabase, Resend, Cobble Network inference
(Qwen 27B-class agents). This audit says what in the plan is sound, what is missing or
risky, and what the first build should actually be.

## 1. What is sound and should be locked

- **One shared daily tick, full-day submission window.** Correct call. It removes
  time-zone advantage and makes adjudication a batch job, which is the only shape that
  is cheap and auditable on serverless infrastructure.
- **Talking is free, authorizing costs.** The distinction between *discussing* an action
  and *committing* it is the single most important safety rule in the design. It also
  keeps the LLM out of the critical path (see §3).
- **Truth / knowledge / belief / statement kept separate.** The engine's canon is never
  rewritten by a player assertion. This is what makes disinformation a mechanic rather
  than a bug.
- **Negotiations, treaties, motions and votes as first-class state**, not chat
  side-effects. The table list in Design 04 §10 is a good first schema and is adopted
  almost verbatim in `supabase/migrations/0001_init.sql`.
- **The institution is the object of play.** Players amending the Department's own
  rules is the differentiator. It must be scoped tightly (see §2.6) but it stays.
- **Three tiers of evidence** (Intelligence → Evidence → Established Finding) and the
  rule that a finding can be *legally established and factually false*.
- **Bureaucratic cosmic horror** as the tone, with the horror entering through small
  record inconsistencies. Administrative Convergence is a strong central conceit because
  it makes the game's own medium (records, memos, votes) part of the mystery.
- **15 deep NPCs over 150 shallow ones.**

## 2. Gaps and risks, in priority order

### 2.1 Inbound email is the hard problem and the plan treats it as solved
The whole correspondence design assumes players email in-character addresses and the
engine receives, parses and routes them. Facts as of today:

- All six Resend domains on the account have **Receiving: disabled**. Inbound needs a
  dedicated game domain with MX pointed at Resend and a verified inbound webhook.
- Per-character addresses (`fletcher@…`) need catch-all inbound plus an address → player
  resolution table. Pseudonymous identities are just more rows in that table.
- **Sender authentication.** Email `From:` is forgeable. Trust must come from (a) DKIM
  pass on the sender's own domain **and** (b) a per-player secret token embedded in the
  reply address (`fletcher+k7f2@…`) or in the thread's hidden token. Without this, any
  player can cast another player's vote by spoofing a header.
- **Threading.** Preserve `Message-ID`, `In-Reply-To`, `References` so replies group in
  real mail clients. Every outbound message must carry a stable, engine-generated
  Message-ID that maps back to a correspondence row.
- **Deliverability.** Game mail is bulk-ish, link-heavy, and 1977-flavoured. SPF, DKIM,
  DMARC, a warmed domain, and a plain-text part on every message are non-negotiable.

Decision needed from Nathan: which domain. Nothing on the account fits "The Department";
`anomalous.app` is the closest brand neighbour. A subdomain (`oas.anomalous.app` or a new
`administrativesurvey.gov`-flavoured domain) is the cleanest.

### 2.2 A 27B model must never be the authority on anything consequential
Design 04 wants the engine to "extract claims, proposals, commitments and votes" from
free text. With a 27B-class model this extraction is useful but unreliable, and the
plan already half-says so ("ambiguous messages remain nonbinding"). Make it a hard rule:

- **Consequential acts (votes, transfers, treaty acceptance, order submission) have a
  deterministic grammar** the engine parses without a model: a `VOTE: REMOVE` line, a
  structured order block, a signed magic-link confirmation, or the web form.
- The LLM layer **proposes** structured events with a confidence and provenance
  (model, prompt hash, raw span). Anything consequential it proposes is queued as a
  *pending confirmation* the player must ratify. Non-consequential extractions (claims
  shared, relationships, tone) can be applied directly to the social graph.
- Store original text immutably; store interpretations separately. The plan says this;
  the schema enforces it (`correspondence` vs `correspondence_events`).

### 2.3 Cobble capacity is not guaranteed; the game must run without it
Measured today: `qwen/qwen3.8-27b` answered `429 FLEET_MODEL_UNAVAILABLE` (no ready
replica, retry in 60 s) on every attempt over several minutes. `qwen/qwen3.6-35b-a3b`
and `qwen/qwen3.8-flash-next` answered in ~1–2 s. `qwen3.6-27b`, which the other
projects default to, is no longer in the model list for this key.

Consequences for the design:

- The daily tick's **rules resolution is deterministic and model-free**. Resources,
  votes, treaty execution, access checks, and objective scoring never wait on a model.
- The model is used for **narration** (personal dispatches), **NPC voice**, and
  **extraction**. Each of these degrades gracefully: a dispatch can fall back to a
  templated report; NPC replies can be delayed to the next morning; extraction can
  queue.
- Every model call goes through one client (`src/lib/cobble.ts`) with a **model chain**
  (27B → 35B-A3B → flash), honours `retry_after_seconds`, and writes a ledger row.

### 2.4 Serverless timeouts vs. a 24-player adjudication
A nightly tick that narrates 24 personal dispatches plus NPC moves can be many minutes
of model time. Vercel functions cap out well before that. The tick route therefore
**enqueues phases**, and a worker drains a job table in small idempotent batches
(Vercel cron every minute while a round is resolving, or a Railway worker later as in
`research-harness`). Each phase is replayable without double-applying effects
(idempotency keys on every event).

### 2.5 Objectives and scoring are not machine-checkable yet
"Identify who ordered Marsh's disappearance" is a story goal, not a predicate. Every
episode objective needs a success condition expressed over world state:
`finding_established(subject=voss, claim=ordered_marsh_disappearance, by=player)` or
`asset_held(player, NIGHTJAR_FILES_ORIGINAL)`. The agent team's Rules Lawyer role is
tasked with writing objectives in this form. If an objective cannot be written as a
predicate, it is not ready to ship.

### 2.6 Player-rewritable rules need a small, closed vocabulary
"Players amend the charter" is wonderful and dangerous. Scope v1 to a fixed set of
amendable parameters and permissions: council seat allocation, quorum and threshold per
motion type, clearance level required per archive class, division budget shares,
emergency-power scope and duration, who may call a vote. Each is a versioned row with
effective rounds. No free-text rules in v1.

### 2.7 Six months is too long for a first run
168 daily rounds before anyone learns whether the loop is fun is a bad bet. Run a
**pilot season: Episodes 1–3 (six weeks), 12 players, one Department**. Keep the
12-episode season as the designed shape; ship the pilot.

### 2.8 Economy numbers are placeholders
20 AU/round, 60 AU cap, 10 starting are illustrative. They live in a `rules` table and
get tuned by simulation (the agent team can run bot seasons) before humans play.

### 2.9 NPC memory architecture is unspecified
"Models must play characters who have something to lose" requires each NPC to have a
structured state the prompt is built from: known facts (with source), beliefs (with
confidence), goals, relationships (trust/obligation per counterpart), and a log of
promises made. Same truth/knowledge/belief split as players. Without this the NPCs
drift and contradict themselves within a week.

### 2.10 Auditability
Any model-influenced outcome needs: seeded RNG, the exact prompt and response stored,
the rule version in force, and a replay path. Players will dispute outcomes. "The model
said so" is not an answer; "here is the rule, the roll, and the evidence" is.

### 2.11 Consent and privacy
Players must agree at signup that in-game mail is processed by AI and stored. Out-of-
game personal information must not become fictional intelligence. Put the policy in the
appointment letter and the signup form; strip signatures and quoted personal footers
before extraction.

## 3. Architecture (v1)

```
Player mail client ──► Resend inbound (MX) ──► POST /api/email/inbound (verify Svix sig)
                                                    │  store raw → correspondence
                                                    │  resolve sender/recipients
                                                    │  deterministic grammar parse → orders/votes
                                                    │  enqueue extraction job (LLM, non-blocking)
                                                    ▼
                                             Supabase (Postgres, RLS, jobs, events)
                                                    ▲
 Vercel cron (daily lock) ──► /api/cron/tick ───────┤  phases: lock → validate → governance →
                                                    │          strategic → world → narrate → send
 Job worker (cron 1-min / Railway) ─────────────────┘  drains jobs idempotently
                                                    │
                                                    ▼
                                      Resend outbound (dispatches, NPC letters)
 Cobble (qwen 27B chain) ◄── src/lib/cobble.ts ◄── narration · NPC voice · extraction
```

Web companion (Next.js): signup, order packet editor, confirmation of pending acts,
dossier, public dispatch archive. Email is the primary interface; web is the fallback
and the place where consequential acts get confirmed.

## 4. The agent team

Qwen 27B-class agents on Cobble, run from `agents/`. Same roles, same prompts, later
mounted inside the engine:

| Role | Build phase | Engine phase |
|---|---|---|
| Showrunner | decomposes a story task into briefs | proposes episode crises from world state |
| Archivist | keeps canon consistent, writes the canon file | canon/knowledge integrity checks |
| Character Writer | NPC dossiers, voices, secrets | NPC letters and replies |
| Rules Lawyer | charter, mechanics, objectives as predicates | validates orders, explains rulings |
| Correspondent | in-world letters, memos, dispatches | personal dispatch narration |
| Skeptic | adversarial continuity and balance review | pre-send review of model output |

Pipeline per task: Showrunner → writers (parallel) → Skeptic → Archivist commit, with
provenance JSON per output. Nathan and Claude curate what enters `canon/`.

## 5. Decisions needed from Nathan

1. **Game domain** for mail (new domain vs. subdomain of `anomalous.app`).
2. **Pilot scope**: agree to Episodes 1–3, 12 players.
3. **Lock time**: 8:00 PM Eastern is the proposed cutoff; Vercel cron is UTC, so the
   schedule shifts with DST unless we compute it.
4. ~~Supabase project~~ — done: `edyhveglvnnunfbiebdr`, schema applied 2026-10-10.
5. **Secret canon**: the true mechanism of Administrative Convergence goes in
   `canon/secret/` and must stay out of any prompt that reaches players.

## 6. What this first session built

See `README.md`. In short: the Next.js app, the Cobble client with model chain, the
agent-team harness with six roles and four starter tasks, the Supabase schema, Resend
inbound/outbound plumbing with signature verification, the daily tick skeleton, the
landing page, and the first canon files.
