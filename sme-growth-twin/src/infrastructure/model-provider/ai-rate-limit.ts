import "server-only";

const subjects = new Map<string, number[]>();
let active = 0;
const MAX_CONCURRENT = 3;

export function enterAiLimit(subject: string, perMinute: number): () => void {
  const now = Date.now();
  const recent = (subjects.get(subject) ?? []).filter((timestamp) => now - timestamp < 60_000);
  if (recent.length >= perMinute || active >= MAX_CONCURRENT) throw new Error("ai_rate_limited");
  recent.push(now);
  subjects.set(subject, recent);
  active += 1;
  let released = false;
  return () => {
    if (!released) active = Math.max(0, active - 1);
    released = true;
  };
}
