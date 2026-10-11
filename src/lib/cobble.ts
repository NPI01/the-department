/* The one model client. Every call to Cobble Network goes through here so the
   model chain, retry policy, thinking toggle and usage ledger are in one place.
   Server only: the key never reaches the browser.

   Facts this is built on (measured 2026-10-10):
   - Cobble is OpenAI-compatible at https://api.cobble.network/v1.
   - When a model has no ready replica it answers 429 with a JSON body:
     { code: "FLEET_MODEL_UNAVAILABLE", retryable: true, retry_after_seconds: 60, ... }.
     Nothing is charged. We honour retry_after once, then move down the chain.
   - Qwen models accept chat_template_kwargs.enable_thinking to switch reasoning
     on/off. Thinking helps canon/rules work; it burns the token budget on short
     JSON replies. Default off, opt in per call.
   - response_format json_object is accepted by the Qwen pools. We still parse
     defensively because a fallback model may ignore it. */

export type Msg = { role: "system" | "user" | "assistant"; content: string };
export type Usage = { prompt_tokens: number; completion_tokens: number; total_tokens: number };

export type ChatOpts = {
  model?: string;          // pin one model (skips the chain)
  models?: string[];       // override the chain
  maxTokens?: number;
  temperature?: number;
  think?: boolean;
  json?: boolean;          // ask for a JSON object
  signal?: AbortSignal;
  timeoutMs?: number;
  tag?: string;            // who is calling (role name) — for the ledger
  patient?: boolean;       // false: on 429/5xx go straight to the next model (interactive calls)
  onLedger?: (row: LedgerRow) => void | Promise<void>;
};

export type LedgerRow = {
  tag: string; model: string; ok: boolean; status: number | null; ms: number;
  usage: Usage | null; error: string | null; attempt: number;
};

export type ChatResult = { text: string; model: string; usage: Usage | null; raw: string };

export function cobbleConfig() {
  const base = (process.env.COBBLE_BASE_URL || "https://api.cobble.network/v1").replace(/\/$/, "");
  const key = process.env.COBBLE_API_KEY || process.env.RSX_LLM_API_KEY || "";
  const models = (process.env.COBBLE_MODELS || "qwen/qwen3.8-27b,qwen/qwen3.6-35b-a3b,qwen/qwen3.8-flash-next")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const thinking = process.env.COBBLE_THINKING === "1";
  return { base, key, models, thinking };
}

export class CobbleError extends Error {
  constructor(message: string, public status: number | null, public body: string, public retryAfter: number | null) { super(message); }
}

function parseRetryAfter(status: number, body: string, headers: Headers): number | null {
  const h = headers.get("retry-after");
  if (h && !Number.isNaN(Number(h))) return Number(h);
  if (status !== 429) return null;
  try { const j = JSON.parse(body); if (typeof j.retry_after_seconds === "number") return j.retry_after_seconds; } catch { /* not json */ }
  return null;
}

const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((res, rej) => {
  const t = setTimeout(res, ms);
  signal?.addEventListener("abort", () => { clearTimeout(t); rej(new Error("aborted")); }, { once: true });
});

/* One completion through the chain. Per model: one attempt, plus one retry when
   Cobble quotes a retry_after under 90 s. Then the next model. Throws when the
   whole chain fails. */
export async function chat(messages: Msg[], opts: ChatOpts = {}): Promise<ChatResult> {
  const cfg = cobbleConfig();
  if (!cfg.key) throw new CobbleError("COBBLE_API_KEY is not set", null, "", null);
  const chain = opts.model ? [opts.model] : (opts.models?.length ? opts.models : cfg.models);
  const think = opts.think ?? cfg.thinking;
  const body: Record<string, unknown> = {
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 2000,
    chat_template_kwargs: { enable_thinking: think },
  };
  if (opts.json) body.response_format = { type: "json_object" };
  // Streamed by default: Cobble's hosts sit behind Cloudflare, which closes a
  // connection that has sent nothing for ~2 minutes (524 → gateway 503). A
  // non-streamed reply sends nothing until generation ends, so any long
  // reply dies whole. Streaming delivers bytes from the first token.
  // COBBLE_STREAM=0 sends plain requests.
  const streaming = process.env.COBBLE_STREAM !== "0";

  let lastErr: CobbleError | null = null;
  for (const model of chain) {
    // attempt 0: as asked. attempt 1: once more after a quoted retry_after, OR with
    // thinking off when the model spent its whole budget reasoning and emitted
    // nothing (measured 2026-10-11: 35B-A3B reasons ~2000 tokens on a one-line
    // prompt; on a canon-sized prompt it hit a 3000 cap with empty content).
    let thinkThisCall = think;
    const LADDER = [5_000, 15_000, 30_000];      // 429/5xx without a quote
    for (let attempt = 0; attempt <= LADDER.length; attempt++) {
      const t0 = Date.now();
      let status: number | null = null;
      try {
        // A streamed reply is alive the whole time it generates (measured: a
        // 12k-token dossier set took 855 s), so its deadline is generous; a
        // plain reply that has sent nothing for 5 min is dead.
        const deadline = opts.timeoutMs ?? (streaming ? 1_500_000 : 300_000);
        const res = await fetch(`${cfg.base}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` },
          body: JSON.stringify({ ...body, model, chat_template_kwargs: { enable_thinking: thinkThisCall }, ...(streaming ? { stream: true, stream_options: { include_usage: true } } : {}) }),
          signal: opts.signal ? AbortSignal.any([opts.signal, AbortSignal.timeout(deadline)]) : AbortSignal.timeout(deadline),
        });
        status = res.status;
        const raw = res.ok && streaming ? await readStream(res) : await res.text();
        if (!res.ok) {
          const retryAfter = parseRetryAfter(res.status, raw, res.headers);
          lastErr = new CobbleError(`${model} answered ${res.status}`, res.status, raw.slice(0, 500), retryAfter);
          await opts.onLedger?.({ tag: opts.tag ?? "untagged", model, ok: false, status, ms: Date.now() - t0, usage: null, error: lastErr.message, attempt });
          // 400 = bad model name or bad request for this model: never retry it
          if (res.status === 400 || res.status === 401 || res.status === 404) break;
          if (attempt === LADDER.length || opts.patient === false) break;
          const wait = retryAfter !== null ? Math.min(retryAfter, 120) * 1000 : LADDER[attempt];
          await sleep(wait, opts.signal); continue;
        }
        const j = JSON.parse(raw);
        const content = String(j?.choices?.[0]?.message?.content ?? "");
        const text = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        const usage: Usage | null = j?.usage ?? null;
        await opts.onLedger?.({ tag: opts.tag ?? "untagged", model, ok: true, status, ms: Date.now() - t0, usage, error: null, attempt });
        if (!text) {
          const finish = j?.choices?.[0]?.finish_reason;
          lastErr = new CobbleError(`${model} returned empty content (finish=${finish}, thinking=${thinkThisCall})`, status, raw.slice(0, 500), null);
          if (thinkThisCall) { thinkThisCall = false; continue; }
          break;
        }
        return { text, model, usage, raw };
      } catch (e) {
        if (opts.signal?.aborted) throw e;
        lastErr = new CobbleError(`${model}: ${(e as Error).message}`, status, "", null);
        await opts.onLedger?.({ tag: opts.tag ?? "untagged", model, ok: false, status, ms: Date.now() - t0, usage: null, error: lastErr.message, attempt });
        break;
      }
    }
  }
  throw lastErr ?? new CobbleError("no models in chain", null, "", null);
}

/* Assemble a streamed chat completion into the same JSON shape a plain
   reply has: content from content deltas (reasoning deltas skipped),
   finish_reason, and usage from the final chunk. */
async function readStream(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader(); const dec = new TextDecoder();
  let buf = ""; let content = ""; let finish: string | null = null; let usage: Usage | null = null; let model = "";
  const handle = (line: string) => {
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") return;
    let j: { model?: string; usage?: Usage; choices?: { finish_reason?: string; delta?: { content?: string } }[] };
    try { j = JSON.parse(payload); } catch { return; }
    if (j.model) model = j.model;
    if (j.usage) usage = j.usage;
    const c = j.choices?.[0];
    if (c?.finish_reason) finish = c.finish_reason;
    if (typeof c?.delta?.content === "string") content += c.delta.content;
  };
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) { handle(buf.slice(0, nl).replace(/\r$/, "")); buf = buf.slice(nl + 1); }
  }
  if (buf.trim()) handle(buf.trim());
  return JSON.stringify({ model, usage, choices: [{ finish_reason: finish, message: { content } }] });
}

/* Tolerant JSON: strip fences and thinking, try whole text, then the largest
   {...} or [...] span. Returns null rather than throwing; callers decide. */
export function extractJson<T = unknown>(text: string): T | null {
  let s = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try { return JSON.parse(s) as T; } catch { /* fall through */ }
  const starts = [s.indexOf("{"), s.indexOf("[")].filter((i) => i >= 0);
  if (!starts.length) return null;
  const start = Math.min(...starts);
  const open = s[start]; const close = open === "{" ? "}" : "]";
  const end = s.lastIndexOf(close);
  if (end > start) { try { return JSON.parse(s.slice(start, end + 1)) as T; } catch { /* fall through */ } }
  return repairTruncated<T>(s.slice(start));
}

/* A reply cut off by max_tokens: drop the unfinished trailing value, then close
   every open string, array and object. Loses at most the last item. */
export function repairTruncated<T = unknown>(s: string): T | null {
  // Walk back through closing braces; at each, close whatever is still open
  // and try to parse. A cut inside a string fails to parse and we move on.
  for (let cut = s.lastIndexOf("}"); cut > 0; cut = s.lastIndexOf("}", cut - 1)) {
    let head = s.slice(0, cut + 1).replace(/,\s*$/, "");
    const open: string[] = []; let q = false; let e = false;
    for (const ch of head) {
      if (q) { if (e) e = false; else if (ch === "\\") e = true; else if (ch === '"') q = false; continue; }
      if (ch === '"') q = true; else if (ch === "{") open.push("}"); else if (ch === "[") open.push("]"); else if (ch === "}" || ch === "]") open.pop();
    }
    if (q) continue;
    head += open.reverse().join("");
    try { return JSON.parse(head) as T; } catch { /* try an earlier cut */ }
  }
  return null;
}

export async function chatJson<T = unknown>(messages: Msg[], opts: ChatOpts = {}): Promise<{ data: T | null; result: ChatResult }> {
  const result = await chat(messages, { ...opts, json: true, temperature: opts.temperature ?? 0.3 });
  return { data: extractJson<T>(result.text), result };
}
