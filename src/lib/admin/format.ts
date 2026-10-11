/* Display helpers for the console. Times show in the season's timezone. */

export function fmtDateTime(iso: string | null | undefined, tz = "America/New_York") {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(iso));
}

export function fmtDate(iso: string | null | undefined, tz = "America/New_York") {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" }).format(new Date(iso));
}

export function ago(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "never";
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  const abs = Math.abs(s);
  const unit = abs < 90 ? `${abs}s` : abs < 5400 ? `${Math.round(abs / 60)}m` : abs < 129600 ? `${Math.round(abs / 3600)}h` : `${Math.round(abs / 86400)}d`;
  return s >= 0 ? `${unit} ago` : `in ${unit}`;
}

export function money(cents: number | null | undefined, currency = "usd") {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

export function pct(n: number, d: number) {
  return d ? `${Math.round((100 * n) / d)}%` : "—";
}

export function num(n: number | null | undefined) {
  return n == null ? "—" : new Intl.NumberFormat("en-US").format(n);
}

/* A short, readable line for an event payload. */
export function payloadLine(p: unknown) {
  if (p == null) return "";
  if (typeof p !== "object") return String(p);
  return Object.entries(p as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ")
    .slice(0, 240);
}

/* The request's clock. Console pages render per request (after the session
   read), so reading the time once per render is intended. */
export function nowMs() {
  return Date.now();
}
