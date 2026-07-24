import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quest Craft — GM Co-Pilot for Tabletop RPGs" },
      {
        name: "description",
        content:
          "AI co-pilot for tabletop RPG Game Masters running games for kids ages 8–14. Get story outcomes, narration, and consequences on the fly.",
      },
      { property: "og:title", content: "Quest Craft — GM Co-Pilot" },
      {
        property: "og:description",
        content:
          "AI suggestions for GMs when young players make unexpected choices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Tone = "playful" | "intrigue" | "high-stakes";

interface StoryOutcome {
  id: string;
  tone: Tone | string;
  text: string;
  consequence_later: string;
}

interface Suggestions {
  read_of_moment: string;
  story_outcomes: StoryOutcome[];
  narration: string;
  safety_notes: string[];
}

interface LogEntry {
  id: string;
  text: string;
  consequence_later: string;
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function coerceSuggestions(obj: unknown): Suggestions | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const outcomesRaw = Array.isArray(o.story_outcomes) ? o.story_outcomes : [];
  const outcomes: StoryOutcome[] = outcomesRaw.map((oc) => {
    const r = (oc || {}) as Record<string, unknown>;
    return {
      id: newId(),
      tone: typeof r.tone === "string" ? r.tone : "playful",
      text: typeof r.text === "string" ? r.text : "",
      consequence_later:
        typeof r.consequence_later === "string" ? r.consequence_later : "",
    };
  });
  const safety = Array.isArray(o.safety_notes)
    ? o.safety_notes.filter((n): n is string => typeof n === "string")
    : typeof o.safety_notes === "string"
      ? [o.safety_notes]
      : [];
  return {
    read_of_moment:
      typeof o.read_of_moment === "string" ? o.read_of_moment : "",
    story_outcomes: outcomes,
    narration: typeof o.narration === "string" ? o.narration : "",
    safety_notes: safety,
  };
}

function toneClass(tone: string) {
  switch (tone) {
    case "playful":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
    case "intrigue":
      return "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200";
    case "high-stakes":
      return "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

const DEFAULT_SITUATION = `The students defeated the Stormbristle Boar. Instead of accepting Artemis' blessing or treating the boar as sacred, they want to sell the tusks at the market, divide up the meat, and keep the profits. I need 2–3 possible story outcomes that respect their choice, create an interesting consequence, and keep the quest moving for ages 9–12.`;

function Index() {
  const [situation, setSituation] = useState(DEFAULT_SITUATION);
  const [ageRange, setAgeRange] = useState("9-12");
  const [setting, setSetting] = useState("Ancient Greek myth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [rawFallback, setRawFallback] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [revising, setRevising] = useState<Record<string, string>>({});
  const [revisingBusy, setRevisingBusy] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<LogEntry[]>([]);


  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!situation.trim()) return;
    setLoading(true);
    setError(null);
    setRawFallback(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation, ageRange, setting }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { raw } = (await res.json()) as { raw: string };
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
      const coerced = coerceSuggestions(parsed);
      if (coerced) {
        setSuggestions(coerced);
      } else {
        setSuggestions(null);
        setRawFallback(raw || "(empty response)");
      }
      setDismissed(new Set());
      setRevising({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function accept(outcome: StoryOutcome) {
    setLog((prev) => [
      ...prev,
      {
        id: newId(),
        text: outcome.text,
        consequence_later: outcome.consequence_later,
      },
    ]);
    setDismissed((prev) => new Set(prev).add(outcome.id));
  }

  function ignore(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  function startRevise(o: StoryOutcome) {
    setRevising((prev) => ({ ...prev, [o.id]: o.text }));
  }

  function cancelRevise(id: string) {
    setRevising((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function submitRevise(o: StoryOutcome) {
    const notes = revising[o.id] ?? "";
    setRevisingBusy((prev) => new Set(prev).add(o.id));
    try {
      const res = await fetch("/api/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation,
          ageRange,
          setting,
          originalOutcome: {
            tone: o.tone,
            text: o.text,
            consequence_later: o.consequence_later,
          },
          revisionNotes: notes,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { raw } = (await res.json()) as { raw: string };
      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        parsed = null;
      }
      setSuggestions((prev) =>
        prev
          ? {
              ...prev,
              story_outcomes: prev.story_outcomes.map((so) =>
                so.id === o.id
                  ? {
                      id: so.id,
                      tone:
                        parsed && typeof parsed.tone === "string"
                          ? parsed.tone
                          : so.tone,
                      text:
                        parsed && typeof parsed.text === "string"
                          ? parsed.text
                          : raw || so.text,
                      consequence_later:
                        parsed && typeof parsed.consequence_later === "string"
                          ? parsed.consequence_later
                          : so.consequence_later,
                    }
                  : so,
              ),
            }
          : prev,
      );
      cancelRevise(o.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revise failed");
    } finally {
      setRevisingBusy((prev) => {
        const next = new Set(prev);
        next.delete(o.id);
        return next;
      });
    }
  }

  const visibleOutcomes =
    suggestions?.story_outcomes.filter((o) => !dismissed.has(o.id)) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Quest Craft — GM Co-Pilot
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live help when young players do something you didn't plan for.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <form
            onSubmit={onSubmit}
            className="rounded-lg border border-border bg-card p-5 space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="situation" className="text-sm font-medium">
                What just happened / what do you need help with?
              </label>
              <textarea
                id="situation"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                rows={6}
                placeholder="The party ignored the oracle and tried to ride the Minotaur..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="age" className="text-sm font-medium">
                  Age range
                </label>
                <select
                  id="age"
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="8-10">8–10</option>
                  <option value="9-12">9–12</option>
                  <option value="11-14">11–14</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="setting" className="text-sm font-medium">
                  Setting
                </label>
                <input
                  id="setting"
                  value={setting}
                  onChange={(e) => setSetting(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !situation.trim()}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Thinking…" : "Get suggestions"}
              </button>
              {error && (
                <span className="text-sm text-destructive">{error}</span>
              )}
            </div>
          </form>

          {rawFallback && (
            <Card label="Raw response (JSON parse failed)">
              <pre className="text-xs whitespace-pre-wrap break-words font-mono text-muted-foreground">
                {rawFallback}
              </pre>
            </Card>
          )}

          {suggestions && (
            <div className="space-y-5">
              <Card label="Read of the moment">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {suggestions.read_of_moment}
                </p>
              </Card>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Story outcomes
                </h2>
                {visibleOutcomes.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    All outcomes handled. Ask again for more ideas.
                  </p>
                )}
                {visibleOutcomes.map((o) => {
                  const isRevising = o.id in revising;
                  const busy = revisingBusy.has(o.id);
                  return (
                    <div
                      key={o.id}
                      className="rounded-lg border border-border bg-card p-4 space-y-3"
                    >
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneClass(o.tone)}`}
                      >
                        {o.tone}
                      </span>
                      {isRevising ? (
                        <>
                          <p className="text-xs text-muted-foreground">
                            Current: {o.text}
                          </p>
                          <textarea
                            value={revising[o.id]}
                            onChange={(e) =>
                              setRevising((prev) => ({
                                ...prev,
                                [o.id]: e.target.value,
                              }))
                            }
                            rows={3}
                            placeholder="Notes for revision (e.g. make it less scary, add a friendly NPC)…"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => submitRevise(o)}
                              disabled={busy}
                              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              {busy ? "Revising…" : "Regenerate"}
                            </button>
                            <button
                              onClick={() => cancelRevise(o.id)}
                              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {o.text}
                          </p>
                          {o.consequence_later && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">
                                Later:{" "}
                              </span>
                              {o.consequence_later}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              onClick={() => accept(o)}
                              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => startRevise(o)}
                              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                            >
                              Revise
                            </button>
                            <button
                              onClick={() => ignore(o.id)}
                              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                            >
                              Ignore
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </section>

              <Card label="Narration to say aloud">
                <p className="text-sm leading-relaxed italic whitespace-pre-wrap">
                  “{suggestions.narration}”
                </p>
              </Card>

              <Card label="Safety notes">
                {suggestions.safety_notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None.</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {suggestions.safety_notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 h-fit rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Session Log
          </h2>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Accepted outcomes and consequences will appear here.
            </p>
          ) : (
            <ol className="space-y-3">
              {log.map((entry, i) => (
                <li
                  key={entry.id}
                  className="rounded-md border border-border p-3 space-y-1"
                >
                  <div className="text-xs text-muted-foreground">#{i + 1}</div>
                  <div className="text-sm">{entry.text}</div>
                  {entry.consequence_later && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Later:{" "}
                      </span>
                      {entry.consequence_later}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </aside>
      </main>

      <footer className="fixed bottom-0 inset-x-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-3 text-center text-xs text-muted-foreground">
          These are suggestions. Accept, revise, or ignore any of them. You're
          always in control.
        </div>
      </footer>
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}
