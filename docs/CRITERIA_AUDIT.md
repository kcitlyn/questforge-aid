# Requirements Audit — exercise criteria → where the product satisfies them

A line-by-line check of the Quest Craft exercise instructions against the
shipped prototype, plus how the design maps to established AI-trustworthiness
guidance (NIST AI Risk Management Framework).

## Required output elements

| Instruction requires | Where it's satisfied |
|---|---|
| 2–3 possible story outcomes | `story_outcomes` (schema enforces exactly 2–3, each a different tone) |
| A short narration the GM could say aloud | `narration` card, sized prominently with a Copy button, reading level matched to age band |
| A consequence that matters later | `consequence_later` per outcome; accepted ones persist in the Session Log |
| A reminder the GM can accept, revise, or ignore | Working Accept / Revise / Ignore buttons on every outcome, plus the persistent footer and post-results reminder |
| Safety / age-appropriateness notes | `safety_notes` card from the generator + independent Layer-2 review banner |
| Concise enough for live use | ~180-word cap in the prompt; short sentences; skeleton loading; ⌘+Enter |

## The scenario-response requirements

| Instruction requires | How the design guarantees it |
|---|---|
| Respects the students' choice | Guardrail #2 (honor player agency) + few-shot examples that model it |
| Keeps the story moving | Every outcome must "keep the quest moving"; consequences are hooks, not dead ends |
| Interesting consequence without punishing | "Interesting NOT punitive" is a hard constraint, demonstrated in all three examples |
| Appropriate for ages 9–12 | Age-band input drives reading level and intensity; Layer-2 review checks output |
| Fits the Greek mythology setting | "Stay in the world" guardrail; setting is an explicit input |
| Gives the GM 2–3 options | Schema-enforced |
| Keeps the human GM in control | `clarifying_question` hands decisions back to players; "could/might" phrasing; accept/revise/ignore mechanics |

## Submission checklist (the 7 items)

1. **Prototype link** — published Lovable URL (verify Website Access is public)
2. **Example input** — `DELIVERABLES.md` §2 (the required demo scenario verbatim)
3. **Example output** — `DELIVERABLES.md` §3 (current schema incl. safety banner, thinking panel, dice hooks)
4. **Prompt / system instructions** — `src/lib/gm-copilot-prompt.server.ts` (authoritative), explained in `SYSTEM_PROMPT_JSON.md` + `PROMPT_RESEARCH.md`
5. **Safety & quality guardrails** — `DELIVERABLES.md` §5, `SAFETY_PASS.md`, demonstrated by `SAFETY_TEST_CASES.md`
6. **Email draft** — `PARTNER_EMAIL.md` (fill in the real local partner)
7. **Reflection** — `DELIVERABLES.md` §7

## Beyond the ask

- **Two-layer safety** (independent output review, fail-safe) — the exercise asks
  for guardrails; this ships a safety *architecture* with demonstrable test cases.
- **Transparency panel** ("Why these suggestions") — the AI shows its reasoning
  instead of being a black box.
- **Session Log** — makes "a consequence that matters later" a working feature,
  not a sentence in the output.
- **Dice hooks** — ties suggestions to Quest Craft's real Strength/Wisdom/Charisma
  mechanic from the combat instructions.
- **Research-backed prompt design** — every technique traced to published
  guidance in `PROMPT_RESEARCH.md`.

## Mapping to NIST AI RMF trustworthiness characteristics

| NIST characteristic | How this prototype embodies it |
|---|---|
| **Safe** | Age-appropriate constraints at generation + independent review before display; fails safe, never open |
| **Valid & reliable** | Strict JSON schema with coercion and raw-text fallback so malformed output degrades gracefully instead of crashing |
| **Accountable & transparent** | `design_notes` reasoning shown to the GM; safety verdicts surfaced, including "review couldn't run" |
| **Explainable** | Every suggestion arrives with the model's read of the moment and its thinking |
| **Privacy-enhanced** | No student PII requested, echoed, or stored; no accounts; session state is in-memory only |
| **Fair / bias-managed** | Cultural-care guardrail + a few-shot example modeling respectful mythology; reviewer checks for stereotyping |
| **Secure & resilient** | API key server-side only; all model calls behind server routes; nothing sensitive ships to the browser |
