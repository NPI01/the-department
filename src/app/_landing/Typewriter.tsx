"use client";
import { useEffect, useState } from "react";

/* Types `lines` one after another, teletype style, when it enters view. */
export function Typewriter({ lines, speed = 34, startDelay = 400, className = "" }: { lines: string[]; speed?: number; startDelay?: number; className?: string }) {
  const [out, setOut] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { setStarted(true); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(ref); return () => io.disconnect();
  }, [ref]);
  useEffect(() => {
    if (!started) return;
    let li = 0, ci = 0; let t: ReturnType<typeof setTimeout>;
    const acc: string[] = [];
    const tick = () => {
      if (li >= lines.length) { setDone(true); return; }
      const line = lines[li];
      acc[li] = line.slice(0, ci + 1); setOut([...acc]);
      ci++;
      if (ci >= line.length) { li++; ci = 0; t = setTimeout(tick, 420); }
      else t = setTimeout(tick, line[ci - 1] === "." ? speed * 6 : speed);
    };
    t = setTimeout(tick, startDelay);
    return () => clearTimeout(t);
  }, [started, lines, speed, startDelay]);
  return (
    <div ref={setRef} className={className} aria-label={lines.join(" ")}>
      {out.map((l, i) => <div key={i}>{l}{i === out.length - 1 && !done && <span className="caret" />}</div>)}
      {!started && <div className="opacity-0">{lines[0]}</div>}
    </div>
  );
}
