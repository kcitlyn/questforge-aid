// Server-side validation: treat BOTH the user and the model as untrusted.
//
// Input side: strip control/zero-width characters that can smuggle hidden
// instructions past human review (a known prompt-injection vector).
//
// Output side: parse and schema-validate the model's JSON on the server,
// keep only known fields, and cap lengths — so a manipulated or malformed
// model response can never ship arbitrary payloads to the browser
// (OWASP LLM02: insecure output handling).

export function sanitizeInput(text: string, max: number): string {
  return (
    text
      // control chars except newline and tab
      .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
      // zero-width & bidi-control chars used to hide instructions
      .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
      .slice(0, max)
      .trim()
  );
}

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? v.slice(0, max) : "";

// Models occasionally wrap JSON in markdown fences despite instructions.
// Strip them before parsing rather than failing to the raw-text fallback.
export function stripFences(raw: string): string {
  const m = raw.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1] : raw.trim();
}

function parseJson(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(stripFences(raw));
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

const TONES = new Set(["playful", "mystery", "intrigue", "high-stakes"]);
const DICE = new Set(["Strength", "Wisdom", "Charisma", ""]);

export interface ValidatedSuggestions {
  design_notes: string;
  read_of_moment: string;
  clarifying_question: string;
  story_outcomes: {
    tone: string;
    text: string;
    consequence_later: string;
    dice_hook: string;
  }[];
  narration: string;
  delivery_hint: string;
  safety_notes: string[];
}

// Returns null if the payload isn't usable JSON of roughly the right shape —
// callers then fall back to plain-text display of nothing sensitive.
export function validateSuggestions(raw: string): ValidatedSuggestions | null {
  const o = parseJson(raw);
  if (!o) return null;

  const outcomes = (Array.isArray(o.story_outcomes) ? o.story_outcomes : [])
    .slice(0, 3)
    .map((oc) => {
      const r = (oc || {}) as Record<string, unknown>;
      const tone = str(r.tone, 20);
      const dice = str(r.dice_hook, 20);
      return {
        tone: TONES.has(tone) ? tone : "playful",
        text: str(r.text, 600),
        consequence_later: str(r.consequence_later, 400),
        dice_hook: DICE.has(dice) ? dice : "",
      };
    })
    .filter((oc) => oc.text.length > 0);

  if (outcomes.length === 0) return null;

  return {
    design_notes: str(o.design_notes, 400),
    read_of_moment: str(o.read_of_moment, 400),
    clarifying_question: str(o.clarifying_question, 300),
    story_outcomes: outcomes,
    narration: str(o.narration, 900),
    delivery_hint: str(o.delivery_hint, 120),
    safety_notes: Array.isArray(o.safety_notes)
      ? o.safety_notes
          .filter((n): n is string => typeof n === "string")
          .slice(0, 5)
          .map((n) => n.slice(0, 300))
      : [],
  };
}

export interface ValidatedRevision {
  tone: string;
  text: string;
  consequence_later: string;
  dice_hook: string;
}

export function validateRevision(raw: string): ValidatedRevision | null {
  const o = parseJson(raw);
  if (!o) return null;
  const tone = str(o.tone, 20);
  const dice = str(o.dice_hook, 20);
  const text = str(o.text, 600);
  if (!text) return null;
  return {
    tone: TONES.has(tone) ? tone : "playful",
    text,
    consequence_later: str(o.consequence_later, 400),
    dice_hook: DICE.has(dice) ? dice : "",
  };
}

export interface ValidatedCallback {
  narration: string;
  delivery_hint: string;
  hook: string;
}

export function validateCallback(raw: string): ValidatedCallback | null {
  const o = parseJson(raw);
  if (!o) return null;
  const narration = str(o.narration, 900);
  if (!narration) return null;
  return {
    narration,
    delivery_hint: str(o.delivery_hint, 120),
    hook: str(o.hook, 300),
  };
}
