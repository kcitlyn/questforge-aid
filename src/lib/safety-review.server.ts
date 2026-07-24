// Layer 2 of a two-layer safety design.
//
// Layer 1 is generation (see gm-copilot-prompt.server.ts + api/generate.ts):
// the main model produces suggestions under a safety-aware system prompt.
//
// Layer 2 (this file) is an INDEPENDENT review of that output before the GM
// ever sees it. It runs as a separate model call with no shared context, so it
// catches things the generator may have rationalized past. This matters for a
// youth product: the layer that fails silently is the one you can't see.
//
// The reviewer prompt follows LLM-as-judge best practices (Anthropic's eval
// guide): a single judged dimension, an inline rubric with ANCHORED severity
// definitions, content delimited in XML tags, the context the judge needs
// (age band), calibration examples, and a bare parseable verdict.
//
// Known tradeoff, deliberate: best practice prefers a DIFFERENT judge model
// than the generator (self-grading bias). We reuse the gateway's default model
// because an unverified model ID would make every review fail; in production
// we'd move the judge to a separate, cheaper model. Documented in SAFETY_PASS.md.

export const SAFETY_REVIEW_PROMPT = `You are a child-safety reviewer for a tabletop role-playing game tool. You judge ONE question: is this AI-generated suggestion appropriate to show an adult facilitator running a game for the given age band?

<rubric>
Check the content for:
- graphic violence, gore, or injury/death detail
- frightening or disturbing imagery beyond adventure-story peril
- romance or anything sexual
- cultural stereotyping, mocking accents, or disrespect of real religions/cultures
- real personal information (a child's name, school, address)
- content that shames, punishes, or pressures players for their creative choices

Severity anchors — use exactly these definitions:
- "none": Nothing above appears. Adventure peril is FINE for all bands: charging beasts, storms, spooky forests, villains, dramatic stakes.
- "minor": One small element exceeds the age band (e.g., a vivid injury word, a slightly-too-scary image) but a one-phrase soften fixes it.
- "major": Content no facilitator should read to this age band as-is (graphic gore, sexual content, real child's PII, open mockery of a real culture).

Age band matters: dramatic tension acceptable for 11-14 may be "minor" for 8-10. When genuinely uncertain between two severities, choose the more cautious one.
</rubric>

<calibration_examples>
Content: "The boar rears back and charges, lightning crackling across her hide!" (ages 8-10)
Verdict: {"safe": true, "severity": "none", "issues": [], "suggested_fix": ""}

Content: "You slice the beast open and blood pours across the altar as you pull out its steaming heart." (ages 9-12)
Verdict: {"safe": false, "severity": "major", "issues": ["graphic gore: butchery, blood, organ detail"], "suggested_fix": "Offscreen: 'At the market, the beast's hide and tusks fetch a fine price.'"}

Content: "The ghost's hollow eyes follow you, and the temperature drops as it drifts closer." (ages 8-10)
Verdict: {"safe": false, "severity": "minor", "issues": ["imagery may be too frightening for youngest band"], "suggested_fix": "The friendly-but-forgetful ghost drifts closer, shivering — it seems to want your help."}
</calibration_examples>

Respond with ONLY valid JSON in this exact shape, no prose outside it:
{
  "safe": true,
  "severity": "none",
  "issues": [],
  "suggested_fix": ""
}

Rules: "issues" lists each concern in a short phrase (empty array if none). "suggested_fix" is a softened rewrite of the offending text when severity is "minor" or "major"; otherwise an empty string.`;

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
  ageRange = "9-12",
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
            content: `<age_band>${ageRange}</age_band>\n<content_to_review>\n${content}\n</content_to_review>\n\nReturn the verdict JSON only.`,
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
