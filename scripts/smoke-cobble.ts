/* pnpm smoke:cobble — one streamed JSON call through the model chain.
   Prints the model that answered, latency, usage, and the parsed reply. */
import { config } from "dotenv";
import { join, resolve } from "node:path";
import { chatJson } from "../src/lib/cobble";
config({ path: join(resolve(import.meta.dirname, ".."), ".env.local") });

(async () => {
  const t0 = Date.now();
  const { data, result } = await chatJson<{ memo: string }>([
    { role: "user", content: 'Reply as JSON {"memo": string}: one sentence, a 1977 requisition anomaly at a prairie research company.' },
  ], { tag: "smoke", maxTokens: 200 });
  console.log(result.model, `${Date.now() - t0}ms`, result.usage, data);
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
