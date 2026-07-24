# Prompt Engineering Research → Design Decisions

I rebuilt the co-pilot's prompt using published best practices from OpenAI's and
Anthropic's prompt-engineering guides, plus widely-established child-AI-safety
principles. This doc maps each research finding to a concrete choice in the
prototype — so the design is defensible, not guessed.

## Sources
- **OpenAI — Prompt Engineering guide** (developers.openai.com): role setting,
  clear instructions, message-role authority, structured formatting, section
  ordering (Identity → Instructions → Examples → Context), few-shot with diverse
  examples, structured output, "give the model time to think."
- **Anthropic — Prompting best practices** (platform.claude.com): be clear and
  direct, add *context/motivation* ("explain why"), use examples (3–5, diverse,
  wrapped in `<example>` tags), structure prompts with **XML tags**, give the
  model a **role**, tell it **what to do instead of what not to do**, and use a
  **self-check** step ("before you finish, verify against criteria").
- **Child-AI safety principles** (Common Sense Media / UNICEF-style guidance):
  age-appropriateness by developmental stage, human oversight, data privacy,
  transparency, and avoiding bias/stereotyping.

## What changed, and why

| Research finding | What I did in the prompt |
|---|---|
| **Few-shot examples are the most reliable way to steer output** (Anthropic) | Added 3 diverse, wrapped `<example>` blocks showing ideal input→JSON output, including a "player idea edges toward mature content" example so the model learns to *reframe*, not refuse. |
| **Explain the "why" / add motivation** (Anthropic) | The prompt now states *why* concision and control matter: the GM is a non-gamer educator reading this live while 10 kids watch. Models generalize from the reason. |
| **Structure prompts with XML tags** (both) | System prompt is now organized into `<role>`, `<how_to_respond>`, `<guardrails>`, `<examples>`, `<self_check>` so instructions, rules, and examples never blur together. |
| **Tell the model what TO do, not just what NOT to do** (Anthropic) | Rewrote negative rules as positive directions (e.g., instead of only "no gore," → "keep peril adventurous and bloodless; move mature actions offscreen"). |
| **Give the model time to think** (OpenAI) + **self-check** (Anthropic) | Added a first-class `design_notes` reasoning field the model fills *before* the outcomes (a lightweight chain-of-thought), and a final self-check instruction to verify age-appropriateness and agency before returning. |
| **Section ordering: Identity → Instructions → Examples → Context** (OpenAI) | Reordered the prompt to match; the GM's live input arrives last as the query. |
| **Structured output** (both) | Kept strict JSON, now with a richer, documented schema. |
| **Age-appropriateness by developmental stage** (child-safety) | Prompt adapts *reading level and emotional intensity* to the selected age band (8–10 vs 11–14), not just a blanket "8–14." |
| **Transparency** (child-safety) | The `design_notes` reasoning is surfaced to the GM in a "Why these suggestions" panel — the tool shows its thinking instead of being a black box. |
| **Human oversight** (child-safety) | Added a `clarifying_question` the GM can ask players, so agency stays with the humans; reinforced in UI and guardrails. |
| **Avoid bias/stereotypes** (child-safety) | Explicit cultural-care guardrail, plus an example that models respectful mythology handling. |

## New creative touches for the kids' context
- **`dice_hook`**: each outcome can suggest a skill check (Strength / Wisdom /
  Charisma) that mirrors Quest Craft's actual combat mechanics — turning a
  narrative suggestion into something playable at the table.
- **Tone diversity is enforced** (playful / mystery / high-stakes) so the GM gets
  genuinely different options, matching how a good human GM improvises.
- **`clarifying_question`** models the deck's gameplay loop ("listen & ask
  questions") instead of just dictating what happens.

## Round 2: the safety reviewer, rebuilt as a proper LLM-as-judge

The generation prompt got the research treatment first; a second research pass
(Anthropic's evaluation/grading guide) showed the Layer-2 reviewer lagged behind
known **LLM-as-judge** best practices. Applied:

| Judge best practice | What changed in `safety-review.server.ts` |
|---|---|
| Judge ONE dimension | Prompt now states the single question: appropriate for this age band? |
| Anchor the rubric endpoints | "none/minor/major" each get an operational definition (what a "minor" *is*: fixable with a one-phrase soften) |
| Calibration examples | 3 worked examples — one deliberate PASS (charging boar = fine) to prevent over-flagging, one major (gore), one minor (too-scary ghost for 8–10) |
| Give the judge needed context | The **age band** is now passed to the reviewer — "dramatic tension fine for 11–14 may be minor for 8–10" |
| Delimit content in XML tags | Content under review is wrapped in `<content_to_review>` tags, separate from instructions |
| Bare parseable verdict | JSON-only verdict, strictly validated, unknown severities coerced conservatively |
| Uncertainty rule | "When genuinely uncertain between two severities, choose the more cautious one" |
| Use a different judge model | **Known tradeoff, documented:** we reuse the gateway default model since an unverified model ID would break every review; production would move the judge to a separate, cheaper model |

The over-flagging guard matters as much as the under-flagging one: a safety layer
that flags every charging boar trains the GM to ignore it.

## Two-layer safety (still core)
Generation + an independent reviewer pass that fails safe. See `SAFETY_PASS.md`
and `SAFETY_TEST_CASES.md`.
