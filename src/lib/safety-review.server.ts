// Layer 2 of a two-layer safety design.
//
// Layer 1 is generation (see gm-copilot-prompt.server.ts + api/generate.ts):
// the main model produces suggestions under a safety-aware system prompt.
//
// Layer 2 (this file) is an INDEPENDENT review of that output before the GM
// ever sees it. It runs as a separate model call with no shared context, so it
// catches things the generator may have rationalized past. This matters for a
// youth product: the layer that fails silently is the one you can't see.

export const SAFETY_REVIEW_PROMPT = `You are a child-safety reviewer for a tabletop game tool used with players ages 8–14. You receive a JSON suggestion meant to be shown to an adult facilitator (a Game Master). Check it for:
- graphic violence or gore, injury or death detail
- frightening or disturbing imagery
- romance or anything sexual
- cultural stereotyping or mockery of real religions/cultures
- real personal information (names of real children, schools, addresses)
- anything that pressures, shames, or punishes players for their creative choices

Respond with ONLY valid JSON in this exact shape, no prose outside it:
{
  "safe": true,
  "severity": "none",
  "issues": [],
  "suggested_fix": ""
}

Rules:
- "severity" is one of: "none", "minor", "major".
- "none" = no concerns. "minor" = small age-appropriateness tweak needed. "major" = should not be shown as-is.
- "issues" lists each concern in a short phrase (empty array if none).
- "suggested_fix" is a softened rewrite of the offending text when severity is "minor" or "major"; otherwise an empty string.
- Be proportionate. Adventure-style peril (a boar charges, a storm rolls in) is fine for this age group. Reserve "major" for genuinely inappropriate content.`;

export interface SafetyVerdict {
  reviewed: boolean;
  safe: boolean;
  severity: "none" | "minor" | "major";
  issues: string[];
  suggested_fix: string;
  note?: string;
}

// Fail-safe default. If the reviewer call or parse fails we do NOT claim the
// content is verified safe (that would be failing open). Instead we mark it
// unreviewed and tell the GM, keeping the human in control.
const REVIEW_UNAVAILABLE: SafetyVerdict = {
  reviewed: false,
  safe: false,
  severity: "none",
  issues: [],
  suggested_fix: "",
  note: "Automated safety review couldn't run this time — please use your own judgment.",
};

export async function reviewOutput(
  content: string,
  apiKey: string,
): Promise<SafetyVerdict> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          { role: "system", content: SAFETY_REVIEW_PROMPT },
          {
            role: "user",
            content: `Review this suggestion JSON for players ages 8–14:\n\n${content}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) return REVIEW_UNAVAILABLE;

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const severityRaw =
      typeof parsed.severity === "string" ? parsed.severity : "none";
    const severity: SafetyVerdict["severity"] =
      severityRaw === "minor" || severityRaw === "major" ? severityRaw : "none";

    return {
      reviewed: true,
      safe: typeof parsed.safe === "boolean" ? parsed.safe : severity === "none",
      severity,
      issues: Array.isArray(parsed.issues)
        ? parsed.issues.filter((i): i is string => typeof i === "string")
        : [],
      suggested_fix:
        typeof parsed.suggested_fix === "string" ? parsed.suggested_fix : "",
    };
  } catch {
    return REVIEW_UNAVAILABLE;
  }
}
