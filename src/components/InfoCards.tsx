export function HowToPlayCard() {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-card/80 p-6 backdrop-blur-sm">
      <header className="mb-3 flex items-baseline gap-3">
        <span className="num-mono text-xs text-text-secondary">01</span>
        <h2 className="font-serif text-2xl text-text-primary">How to play</h2>
      </header>
      <p className="text-sm leading-relaxed text-text-secondary">
        Read the definition, then type the idiom. Hints reveal structure;
        <span className="text-text-primary"> reveal kills your streak.</span>
      </p>
    </section>
  );
}

export function ScoringCard() {
  const rows: { label: string; value: string; tone?: "accent" | "error" | "default" }[] = [
    { label: "base", value: "+10", tone: "default" },
    { label: "difficulty bonus", value: "+5/lvl", tone: "default" },
    { label: "no-hint clean", value: "+5", tone: "accent" },
    { label: "wrong / reveal", value: "streak ✕", tone: "error" },
  ];

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-card/80 p-6 backdrop-blur-sm">
      <header className="mb-4 flex items-baseline gap-3">
        <span className="num-mono text-xs text-text-secondary">02</span>
        <h2 className="font-serif text-2xl text-text-primary">Scoring</h2>
      </header>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-baseline justify-between border-b border-[var(--color-border)]/50 pb-2 last:border-0 last:pb-0">
            <span className="text-sm text-text-secondary">{r.label}</span>
            <span
              className={`num-mono text-sm ${
                r.tone === "accent"
                  ? "text-accent"
                  : r.tone === "error"
                    ? "text-error"
                    : "text-text-primary"
              }`}
            >
              {r.value}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
