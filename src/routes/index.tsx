import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  CompassIcon,
  D20Icon,
  MasksIcon,
  BookIcon,
  ScrollIcon,
  RewindIcon,
  CheckIcon,
  PencilIcon,
  XIcon,
  SoundOnIcon,
  SoundOffIcon,
  MusicOnIcon,
  MusicOffIcon,
  QuestEmblem,
  Divider,
  toneIcon,
} from "@/lib/icons";
import {
  sfx,
  setSfxMuted,
  initialSfxMuted,
  setMusicOn,
  initialMusicOn,
} from "@/lib/sound";

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
  flagged?: boolean;
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
      return "bg-primary/12 text-primary";
    case "mystery":
    case "intrigue":
      return "bg-gold/15 text-gold";
    case "high-stakes":
      return "bg-destructive/12 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// A thick colored spine on the left — like a tabbed page in a binder — so the
// three paths read as distinct at a glance. Flat ink, no gradients.
function toneBorder(tone: string) {
  switch (tone) {
    case "playful":
      return "border-l-4 border-l-primary";
    case "mystery":
    case "intrigue":
      return "border-l-4 border-l-gold";
    case "high-stakes":
      return "border-l-4 border-l-destructive";
    default:
      return "border-l-4 border-l-border";
  }
}

// A short, playful label per tone — a wink for the GM about what kind of turn
// this is, without adding UI clutter.
function toneLabel(tone: string) {
  switch (tone) {
    case "playful":
      return "the fun path";
    case "mystery":
    case "intrigue":
      return "the curious path";
    case "high-stakes":
      return "the bold path";
    default:
      return "";
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
  "Waking the sleeping bard…",
  "Untangling the fates' yarn…",
  "Polishing a plot twist…",
  "Negotiating with a minor god…",
];

function pickLoadingLine() {
  return LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)];
}

// Rotating placeholders — every one is a real "kids went off-script" moment, so
// the empty box quietly teaches the GM what this tool is actually for.
const PLACEHOLDERS = [
  "The party ignored the oracle and tried to ride the Minotaur…",
  "They want to unionize the goblins for better working conditions…",
  "Instead of the boss fight, they challenged the dragon to a bake-off…",
  "They're convinced the friendly innkeeper is the real villain…",
  "The heroes want to give the cursed sword a hug and 'talk it out'…",
];

function pickPlaceholder() {
  return PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
}

// One-tap quick-fills for the free-text "direction" box. They're just starting
// phrases — the GM can edit, combine, or ignore them and type anything.
const VIBE_QUICKFILLS = [
  "Make it sillier",
  "A little spookier (mysterious, not scary)",
  "More heroic and triumphant",
  "Add a surprising twist",
  "Keep each outcome short",
  "Give the players a clear choice to make",
] as const;

const DEFAULT_SITUATION = `The students defeated the Stormbristle Boar. Instead of accepting Artemis' blessing or treating the boar as sacred, they want to sell the tusks at the market, divide up the meat, and keep the profits. I need 2–3 possible story outcomes that respect their choice, create an interesting consequence, and keep the quest moving for ages 9–12.`;

// A few one-click starters so a first-time GM (or a reviewer) can explore fast.
// The labels lean quirky on purpose: unexpected kid-logic is exactly the
// "off the map" moment this tool exists for — and it makes the demo delightful.
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
    label: "Open a snack stand",
    text: "The heroes don't care about the oracle's warning — they'd rather open a snack stand in the marketplace and get rich. I need options that respect that for ages 9–12.",
  },
  {
    label: "Adopt the monster",
    text: "The party refuses to slay the Hydra. They've named it 'Gary' and want to keep it as a pet. I need 2–3 outcomes that honor that for ages 8–10 without derailing the whole quest.",
  },
  {
    label: "Bribe a god",
    text: "Instead of completing Zeus's trial, the players try to bribe him with a very nice sandwich they packed. How do I handle this for ages 9–12 and keep it fun?",
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
  const [muted, setMuted] = useState(false);
  const [music, setMusic] = useState(false);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const [direction, setDirection] = useState("");

  // Restore audio prefs (localStorage isn't available during SSR).
  useEffect(() => {
    const m = initialSfxMuted();
    setMuted(m);
    setSfxMuted(m);
    if (initialMusicOn()) {
      // Browsers require a user gesture before audio — flip the UI state and
      // let the first click actually start the ambience.
      setMusic(true);
    }
    // Pick a rotating placeholder client-side to avoid an SSR/client mismatch.
    setPlaceholder(pickPlaceholder());
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setSfxMuted(next);
    if (!next) sfx.click();
  }

  function toggleMusic() {
    const next = !music;
    setMusic(next);
    setMusicOn(next);
  }

  // Quick-fill chips append their phrase to whatever the GM has already typed,
  // so they compose instead of replacing free text.
  function addQuickfill(phrase: string) {
    sfx.click();
    setDirection((prev) => {
      const t = prev.trim();
      if (!t) return phrase;
      if (t.toLowerCase().includes(phrase.toLowerCase())) return t; // no dupes
      return `${t}. ${phrase}`;
    });
  }

  async function runGenerate() {
    if (!situation.trim()) return;
    sfx.send();
    setLoadingLine(pickLoadingLine());
    setLoading(true);
    setError(null);
    setRawFallback(null);
    setSafety(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation,
          ageRange,
          setting,
          direction: direction.trim(),
        }),
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
        sfx.arrive();
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
    sfx.click();
    setSituation(text);
    setSuggestions(null);
    setRawFallback(null);
    setSafety(null);
    setError(null);
  }

  async function copyNarration(text: string) {
    sfx.click();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; silently ignore — not worth interrupting play.
    }
  }

  function removeLogEntry(id: string) {
    sfx.ignore();
    setLog((prev) => prev.filter((e) => e.id !== id));
  }

  // One click on a saved consequence weaves it back into the current scene.
  async function callBack(entry: LogEntry) {
    sfx.callback();
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
      const { raw, safety: verdict } = (await res.json()) as {
        raw: string;
        safety?: SafetyVerdict;
      };
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
        // Flag if the independent review found a real concern (or couldn't run).
        flagged: verdict
          ? !verdict.reviewed || verdict.severity !== "none"
          : false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Callback failed");
    } finally {
      setCallbackBusy(null);
    }
  }

  function accept(outcome: StoryOutcome) {
    sfx.accept();
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
    sfx.ignore();
    setDismissed((prev) => new Set(prev).add(id));
  }

  function startRevise(o: StoryOutcome) {
    sfx.click();
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
    sfx.send();
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
      const { raw, safety: verdict } = (await res.json()) as {
        raw: string;
        safety?: SafetyVerdict;
      };
      // A revision is read aloud just like a first suggestion — surface its
      // independent safety verdict too, so revise is never a safety blind spot.
      if (verdict) setSafety(verdict);
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
      <header className="border-b-2 border-primary bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-sm border border-primary-foreground/30 bg-primary-foreground/10">
              <CompassIcon className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-2xl tracking-tight font-semibold">
                Quest Craft
                <span className="ml-2 text-base font-normal opacity-80">
                  GM Co-Pilot
                </span>
              </h1>
              <p className="text-sm opacity-85 mt-0.5">
                Players went off the map? Perfect. Let's make it the best part
                of the story.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleMusic}
              title={music ? "Turn ambient music off" : "Turn ambient music on"}
              aria-label={music ? "Turn ambient music off" : "Turn ambient music on"}
              className={`rounded-sm border border-primary-foreground/30 p-2 hover:bg-primary-foreground/10 ${music ? "opacity-100" : "opacity-60"}`}
            >
              {music ? <MusicOnIcon /> : <MusicOffIcon />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              title={muted ? "Unmute sounds" : "Mute sounds"}
              aria-label={muted ? "Unmute sounds" : "Mute sounds"}
              className={`rounded-sm border border-primary-foreground/30 p-2 hover:bg-primary-foreground/10 ${muted ? "opacity-60" : "opacity-100"}`}
            >
              {muted ? <SoundOffIcon /> : <SoundOnIcon />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <form
            onSubmit={onSubmit}
            className="rounded-sm border border-border bg-card p-5 space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="situation" className="text-sm font-medium">
                What just happened / what do you need help with?
              </label>
              <textarea
                id="situation"
                value={situation}
                onChange={(e) => setSituation(e.target.value.slice(0, 2000))}
                onKeyDown={onTextareaKeyDown}
                rows={6}
                maxLength={2000}
                placeholder={placeholder}
                className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
              />
              {situation.length > 1800 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {2000 - situation.length} characters remaining
                </p>
              )}
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

            <div className="space-y-1.5">
              <label
                htmlFor="direction"
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <MasksIcon className="h-3.5 w-3.5" /> Steer the vibe{" "}
                <span className="font-normal">
                  (optional — tell it what you want, or tap a starter)
                </span>
              </label>
              <input
                id="direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value.slice(0, 300))}
                maxLength={300}
                placeholder="e.g. make it funnier, and have the sea-witch turn out to be their long-lost aunt"
                className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex flex-wrap items-center gap-2">
                {VIBE_QUICKFILLS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => addQuickfill(v)}
                    className="rounded-full border border-input bg-background px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    + {v}
                  </button>
                ))}
                {direction && (
                  <button
                    type="button"
                    onClick={() => {
                      sfx.ignore();
                      setDirection("");
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <span className="text-sm font-medium">Age range</span>
                {/* Segmented control: clearer current state + one tap, no menu */}
                <div
                  role="radiogroup"
                  aria-label="Age range"
                  className="flex rounded-sm border border-input overflow-hidden"
                >
                  {["8-10", "9-12", "11-14"].map((a, i) => {
                    const on = ageRange === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          sfx.click();
                          setAgeRange(a);
                        }}
                        className={`flex-1 px-3 py-2 text-sm transition-colors ${
                          i > 0 ? "border-l border-input" : ""
                        } ${
                          on
                            ? "bg-primary text-primary-foreground font-medium"
                            : "bg-background text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {a.replace("-", "–")}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="setting" className="text-sm font-medium">
                  Setting
                </label>
                <input
                  id="setting"
                  value={setting}
                  onChange={(e) => setSetting(e.target.value)}
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !situation.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary disabled:opacity-50"
              >
                {loading ? (
                  loadingLine
                ) : (
                  <>
                    <D20Icon className="h-4 w-4" /> Get suggestions
                  </>
                )}
              </button>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                ⌘/Ctrl + Enter
              </span>
              {error && (
                <span className="text-sm text-destructive">{error}</span>
              )}
            </div>
          </form>

          {!loading && !suggestions && !rawFallback && (
            <div className="rounded-sm border border-dashed border-border p-8 text-center space-y-3">
              <QuestEmblem className="h-24 w-24 mx-auto text-primary" />
              <p className="text-base font-medium font-display">
                Describe the moment, then hit “Get suggestions.”
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                You'll get 2–3 story paths to choose from, narration to read
                aloud, and a consequence you can bring back later — all checked
                for age-appropriateness. You pick what happens; it's your table.
              </p>
              <Divider className="max-w-xs mx-auto pt-1" />
              <p className="text-xs text-muted-foreground">
                New here? Tap a{" "}
                <span className="font-medium text-foreground">Try</span> example
                above to see it in action.
              </p>
            </div>
          )}

          {loading && !suggestions && (
            <div className="space-y-3" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-sm border border-border bg-card p-4 space-y-2"
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
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
                    className="inline-flex items-center gap-1 rounded-sm border border-input bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
                  >
                    {loading ? (
                      loadingLine
                    ) : (
                      <>
                        <D20Icon className="h-3.5 w-3.5" /> Roll again
                      </>
                    )}
                  </button>
                </div>
                {visibleOutcomes.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    All outcomes handled — tap “Roll again” for a fresh set.
                  </p>
                )}
                {visibleOutcomes.map((o) => {
                  const isRevising = o.id in revising;
                  const busy = revisingBusy.has(o.id);
                  return (
                    <div
                      key={o.id}
                      className={`rounded-sm border border-border bg-card p-4 space-y-3 shadow-sm transition-shadow hover:shadow-md ${toneBorder(o.tone)}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${toneClass(o.tone)}`}
                        >
                          {toneIcon(o.tone)} {o.tone}
                        </span>
                        {toneLabel(o.tone) && (
                          <span className="text-xs italic text-muted-foreground">
                            {toneLabel(o.tone)}
                          </span>
                        )}
                        {o.dice_hook && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
                            <D20Icon className="h-3.5 w-3.5" /> {o.dice_hook} check
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
                            className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => submitRevise(o)}
                              disabled={busy}
                              className="inline-flex items-center justify-center rounded-sm bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              {busy ? "Revising…" : "Regenerate"}
                            </button>
                            <button
                              onClick={() => cancelRevise(o.id)}
                              className="inline-flex items-center justify-center rounded-sm border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
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
                              title="Use this outcome — it joins your Session Log"
                              className="inline-flex items-center justify-center gap-1 rounded-sm bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              <CheckIcon /> Use this
                            </button>
                            <button
                              onClick={() => startRevise(o)}
                              title="Tell the co-pilot how to change it"
                              className="inline-flex items-center justify-center gap-1 rounded-sm border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                            >
                              <PencilIcon /> Revise
                            </button>
                            <button
                              onClick={() => ignore(o.id)}
                              title="Dismiss this one"
                              className="inline-flex items-center justify-center gap-1 rounded-sm border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                            >
                              <XIcon /> Ignore
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </section>

              <Divider />

              <div className="rounded-sm border-l-4 border-l-gold border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gold">
                    <span className="inline-flex items-center gap-1.5">
                      <BookIcon /> Narration to say aloud
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyNarration(suggestions.narration)}
                    className="rounded-sm border border-input bg-background px-2 py-0.5 text-xs font-medium hover:bg-accent"
                  >
                    {copied ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckIcon /> Copied
                      </span>
                    ) : (
                      "Copy"
                    )}
                  </button>
                </div>
                <p className="text-base leading-relaxed italic whitespace-pre-wrap">
                  “{suggestions.narration}”
                </p>
                {suggestions.delivery_hint && (
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <MasksIcon /> <span className="italic">({suggestions.delivery_hint})</span>
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

        <aside className="lg:sticky lg:top-6 h-fit rounded-sm border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ScrollIcon /> Session Log{log.length > 0 ? ` (${log.length})` : ""}
              </span>
            </h2>
            {log.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sfx.ignore();
                  setLog([]);
                }}
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
                  className="rounded-sm border border-border p-3 space-y-1 animate-in fade-in slide-in-from-right-2 duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      #{i + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLogEntry(entry.id)}
                      aria-label="Remove from log"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <XIcon className="h-3.5 w-3.5" />
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
                    className="inline-flex items-center gap-1 rounded-sm border border-input bg-background px-2 py-0.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
                  >
                    {callbackBusy === entry.id ? (
                      "Weaving it in…"
                    ) : (
                      <>
                        <RewindIcon /> Call back now
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ol>
          )}

          {callback && (
            <div className="mt-3 rounded-sm border border-gold/50 border-l-4 border-l-gold bg-gold/5 p-3 space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-gold">
                Bring it back
              </div>
              {callback.flagged && (
                <p className="text-xs text-destructive">
                  A second safety check flagged this — please read it over before
                  using.
                </p>
              )}
              <p className="text-sm italic leading-relaxed text-card-foreground">
                “{callback.narration}”
              </p>
              {callback.delivery_hint && (
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                  <MasksIcon /> ({callback.delivery_hint})
                </p>
              )}
              {callback.hook && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Next: </span>
                  {callback.hook}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  sfx.ignore();
                  setCallback(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
          )}
        </aside>
      </main>

      <footer className="fixed bottom-0 inset-x-0 border-t border-border bg-background">
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
      <div className="rounded-sm border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
        {safety.note ?? "Safety review unavailable — please use your own judgment."}
      </div>
    );
  }

  if (safety.severity === "none") {
    return (
      <div className="rounded-sm border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        <span className="inline-flex items-center gap-1.5">
          <CheckIcon /> Safety reviewed — no age-appropriateness concerns flagged
          for this group.
        </span>
      </div>
    );
  }

  const major = safety.severity === "major";
  return (
    <div
      className={`rounded-sm border p-3 text-sm space-y-2 ${
        major
          ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200"
          : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
      }`}
    >
      <div className="font-medium">
        {major
          ? "A second safety check flagged this — review before using."
          : "Minor age-appropriateness note from the safety check."}
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
    <div className="rounded-sm border border-border bg-card p-4 space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}
