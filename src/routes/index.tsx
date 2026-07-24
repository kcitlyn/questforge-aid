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
  dice_hook: string;
}

interface Suggestions {
  design_notes: string;
  read_of_moment: string;
  clarifying_question: string;
  story_outcomes: StoryOutcome[];
  narration: string;
  delivery_hint: string;
  safety_notes: string[];
}

interface LogEntry {
  id: string;
  text: string;
  consequence_later: string;
}

interface Callback {
  narration: string;
  delivery_hint: string;
  hook: string;
}

interface SafetyVerdict {
  reviewed: boolean;
  safe: boolean;
  severity: "none" | "minor" | "major";
  issues: string[];
  suggested_fix: string;
  note?: string;
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
      dice_hook: typeof r.dice_hook === "string" ? r.dice_hook : "",
    };
  });
  const safety = Array.isArray(o.safety_notes)
    ? o.safety_notes.filter((n): n is string => typeof n === "string")
    : typeof o.safety_notes === "string"
      ? [o.safety_notes]
      : [];
  return {
    design_notes: typeof o.design_notes === "string" ? o.design_notes : "",
    read_of_moment:
      typeof o.read_of_moment === "string" ? o.read_of_moment : "",
    clarifying_question:
      typeof o.clarifying_question === "string" ? o.clarifying_question : "",
    story_outcomes: outcomes,
    narration: typeof o.narration === "string" ? o.narration : "",
    delivery_hint:
      typeof o.delivery_hint === "string" ? o.delivery_hint : "",
    safety_notes: safety,
  };
}

function toneClass(tone: string) {
  switch (tone) {
    case "playful":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
    case "mystery":
    case "intrigue":
      return "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200";
    case "high-stakes":
      return "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function toneEmoji(tone: string) {
  switch (tone) {
    case "playful":
      return "😄";
    case "mystery":
    case "intrigue":
      return "🔮";
    case "high-stakes":
      return "⚡";
    default:
      return "✨";
  }
}

// Themed loading lines — GMs see this constantly; make it part of the world.
const LOADING_LINES = [
  "Consulting the oracle…",
  "Rolling initiative…",
  "Asking Artemis nicely…",
  "Shuffling the fates…",
  "Bribing the muses…",
  "Reading the entrails (of a scroll)…",
];

function pickLoadingLine() {
  return LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)];
}

const DEFAULT_SITUATION = `The students defeated the Stormbristle Boar. Instead of accepting Artemis' blessing or treating the boar as sacred, they want to sell the tusks at the market, divide up the meat, and keep the profits. I need 2–3 possible story outcomes that respect their choice, create an interesting consequence, and keep the quest moving for ages 9–12.`;

// A few one-click starters so a first-time GM (or a reviewer) can explore fast.
const EXAMPLE_SCENARIOS: { label: string; text: string }[] = [
  {
    label: "Sell the sacred boar (demo)",
    text: DEFAULT_SITUATION,
  },
  {
    label: "Befriend the villain",
    text: "The players were supposed to fight the sea-witch, but instead they want to befriend her and invite her to join the party. How do I keep the quest going for ages 8–10?",
  },
  {
    label: "Ignore the quest entirely",
    text: "The heroes don't care about the oracle's warning — they'd rather open a snack stand in the marketplace and get rich. I need options that respect that for ages 9–12.",
  },
];

function Index() {
  const [situation, setSituation] = useState(DEFAULT_SITUATION);
  const [ageRange, setAgeRange] = useState("9-12");
  const [setting, setSetting] = useState("Ancient Greek myth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [rawFallback, setRawFallback] = useState<string | null>(null);
  const [safety, setSafety] = useState<SafetyVerdict | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [revising, setRevising] = useState<Record<string, string>>({});
  const [revisingBusy, setRevisingBusy] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [callback, setCallback] = useState<Callback | null>(null);
  const [callbackBusy, setCallbackBusy] = useState<string | null>(null);
  const [loadingLine, setLoadingLine] = useState(LOADING_LINES[0]);

  async function runGenerate() {
    if (!situation.trim()) return;
    setLoadingLine(pickLoadingLine());
    setLoading(true);
    setError(null);
    setRawFallback(null);
    setSafety(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation, ageRange, setting }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { raw, safety: verdict } = (await res.json()) as {
        raw: string;
        safety?: SafetyVerdict;
      };
      if (verdict) setSafety(verdict);
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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    runGenerate();
  }

  // Cmd/Ctrl+Enter submits from the textarea — this tool is used live.
  function onTextareaKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      runGenerate();
    }
  }

  function loadExample(text: string) {
    setSituation(text);
    setSuggestions(null);
    setRawFallback(null);
    setSafety(null);
    setError(null);
  }

  async function copyNarration(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; silently ignore — not worth interrupting play.
    }
  }

  function removeLogEntry(id: string) {
    setLog((prev) => prev.filter((e) => e.id !== id));
  }

  // One click on a saved consequence weaves it back into the current scene.
  async function callBack(entry: LogEntry) {
    setCallbackBusy(entry.id);
    setCallback(null);
    try {
      const res = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryText: entry.text,
          consequence: entry.consequence_later,
          situation,
          ageRange,
          setting,
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
      setCallback({
        narration:
          parsed && typeof parsed.narration === "string"
            ? parsed.narration
            : raw || "",
        delivery_hint:
          parsed && typeof parsed.delivery_hint === "string"
            ? parsed.delivery_hint
            : "",
        hook: parsed && typeof parsed.hook === "string" ? parsed.hook : "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Callback failed");
    } finally {
      setCallbackBusy(null);
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
                      dice_hook:
                        parsed && typeof parsed.dice_hook === "string"
                          ? parsed.dice_hook
                          : so.dice_hook,
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
      <header className="border-b border-border bg-gradient-to-r from-primary/10 via-transparent to-primary/5">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            🗺️ Quest Craft — GM Co-Pilot
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your players just went off the map? Perfect. Let's make it the best
            part of the story.
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
                onKeyDown={onTextareaKeyDown}
                rows={6}
                placeholder="The party ignored the oracle and tried to ride the Minotaur..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Try:</span>
                {EXAMPLE_SCENARIOS.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => loadExample(ex.text)}
                    className="rounded-full border border-input bg-background px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-accent"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
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
                {loading ? loadingLine : "Get suggestions"}
              </button>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                ⌘/Ctrl + Enter
              </span>
              {error && (
                <span className="text-sm text-destructive">{error}</span>
              )}
            </div>
          </form>

          {loading && !suggestions && (
            <div className="space-y-3" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card p-4 space-y-2"
                >
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-full rounded bg-muted animate-pulse" />
                  <div className="h-3 w-4/5 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {rawFallback && (
            <Card label="Raw response (JSON parse failed)">
              <pre className="text-xs whitespace-pre-wrap break-words font-mono text-muted-foreground">
                {rawFallback}
              </pre>
            </Card>
          )}

          {suggestions && (
            <div className="space-y-5">
              <SafetyBanner safety={safety} />

              {suggestions.design_notes && (
                <Card label="Why these suggestions (co-pilot's thinking)">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {suggestions.design_notes}
                  </p>
                </Card>
              )}

              <Card label="Read of the moment">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {suggestions.read_of_moment}
                </p>
              </Card>

              {suggestions.clarifying_question && (
                <Card label="You could ask the players">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap italic">
                    “{suggestions.clarifying_question}”
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Handing the choice back to the players keeps them in control.
                  </p>
                </Card>
              )}

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Story outcomes
                  </h2>
                  <button
                    type="button"
                    onClick={runGenerate}
                    disabled={loading}
                    className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
                  >
                    {loading ? loadingLine : "↻ More ideas"}
                  </button>
                </div>
                {visibleOutcomes.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    All outcomes handled — tap “More ideas” for a fresh set.
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${toneClass(o.tone)}`}
                        >
                          {toneEmoji(o.tone)} {o.tone}
                        </span>
                        {o.dice_hook && (
                          <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            🎲 {o.dice_hook} check
                          </span>
                        )}
                      </div>
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

              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                    📖 Narration to say aloud
                  </div>
                  <button
                    type="button"
                    onClick={() => copyNarration(suggestions.narration)}
                    className="rounded-md border border-input bg-background px-2 py-0.5 text-xs font-medium hover:bg-accent"
                  >
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                <p className="text-base leading-relaxed italic whitespace-pre-wrap">
                  “{suggestions.narration}”
                </p>
                {suggestions.delivery_hint && (
                  <p className="text-xs text-muted-foreground">
                    🎭 <span className="italic">({suggestions.delivery_hint})</span>
                  </p>
                )}
              </div>

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

              <p className="text-sm text-muted-foreground text-center">
                These are suggestions — you can <strong>accept</strong>,{" "}
                <strong>revise</strong>, or <strong>ignore</strong> any of them.
                You know your players best.
              </p>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 h-fit rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Session Log{log.length > 0 ? ` (${log.length})` : ""}
            </h2>
            {log.length > 0 && (
              <button
                type="button"
                onClick={() => setLog([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Your story's threads collect here. Accept an outcome and it joins
              the log — ready to call back when the moment is right.
            </p>
          ) : (
            <ol className="space-y-3">
              {log.map((entry, i) => (
                <li
                  key={entry.id}
                  className="rounded-md border border-border p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      #{i + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLogEntry(entry.id)}
                      aria-label="Remove from log"
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-sm">{entry.text}</div>
                  {entry.consequence_later && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Later:{" "}
                      </span>
                      {entry.consequence_later}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => callBack(entry)}
                    disabled={callbackBusy !== null}
                    className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-0.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
                  >
                    {callbackBusy === entry.id
                      ? "Weaving it in…"
                      : "⏪ Call back now"}
                  </button>
                </li>
              ))}
            </ol>
          )}

          {callback && (
            <div className="mt-3 rounded-md border border-indigo-300 bg-indigo-50 p-3 space-y-1.5 dark:border-indigo-900 dark:bg-indigo-950">
              <div className="text-xs font-semibold uppercase tracking-wide text-indigo-900 dark:text-indigo-200">
                Bring it back
              </div>
              <p className="text-sm italic leading-relaxed text-indigo-950 dark:text-indigo-100">
                “{callback.narration}”
              </p>
              {callback.delivery_hint && (
                <p className="text-xs text-indigo-900/80 dark:text-indigo-200/80">
                  🎭 ({callback.delivery_hint})
                </p>
              )}
              {callback.hook && (
                <p className="text-xs text-indigo-900/80 dark:text-indigo-200/80">
                  <span className="font-medium">Next: </span>
                  {callback.hook}
                </p>
              )}
              <button
                type="button"
                onClick={() => setCallback(null)}
                className="text-xs text-indigo-900/70 hover:text-indigo-900 dark:text-indigo-200/70 dark:hover:text-indigo-200"
              >
                Dismiss
              </button>
            </div>
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

function SafetyBanner({ safety }: { safety: SafetyVerdict | null }) {
  if (!safety) return null;

  // Review couldn't run — fail safe: tell the GM to use judgment, don't claim safe.
  if (!safety.reviewed) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
        ⚠️ {safety.note ?? "Safety review unavailable — please use your own judgment."}
      </div>
    );
  }

  if (safety.severity === "none") {
    return (
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        ✓ Safety reviewed — no age-appropriateness concerns flagged for this group.
      </div>
    );
  }

  const major = safety.severity === "major";
  return (
    <div
      className={`rounded-lg border p-3 text-sm space-y-2 ${
        major
          ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200"
          : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
      }`}
    >
      <div className="font-medium">
        {major
          ? "⚠️ A second safety check flagged this — review before using."
          : "⚠️ Minor age-appropriateness note from the safety check."}
      </div>
      {safety.issues.length > 0 && (
        <ul className="list-disc pl-5 space-y-0.5">
          {safety.issues.map((issue, i) => (
            <li key={i}>{issue}</li>
          ))}
        </ul>
      )}
      {safety.suggested_fix && (
        <p>
          <span className="font-medium">Softer version: </span>
          {safety.suggested_fix}
        </p>
      )}
      <p className="text-xs opacity-80">
        You're still in control — you can use these suggestions, revise them, or
        ignore them.
      </p>
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
