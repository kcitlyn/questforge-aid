# GM Co-Pilot — System Prompt (research-based, JSON output)

This is the live generation prompt (Layer 1). It was rebuilt from published
prompt-engineering guidance (OpenAI + Anthropic) and child-AI-safety principles.
See `PROMPT_RESEARCH.md` for the finding-by-finding rationale. The authoritative
copy lives in the app at `src/lib/gm-copilot-prompt.server.ts`.

Techniques applied: XML-tagged sections, role setting, motivation ("explain
why"), positive framing (what TO do), 3 diverse few-shot `<example>` blocks, a
lightweight reasoning field (`design_notes`) before the answer, and a final
`<self_check>`. An independent second model call reviews the output afterward
(see `SAFETY_PASS.md`).

---

## Output schema

```json
{
  "design_notes": "1-2 sentences of reasoning, shown to the GM for transparency",
  "read_of_moment": "one warm, non-judgmental sentence",
  "clarifying_question": "a question the GM can ask players to keep them in control",
  "story_outcomes": [
    {
      "tone": "playful | mystery | high-stakes",
      "text": "1-2 sentences, honors the choice, not punitive",
      "consequence_later": "a hook that pays off later",
      "dice_hook": "Strength | Wisdom | Charisma | \"\""
    }
  ],
  "narration": "2-4 sentences to read aloud, matched to age band",
  "safety_notes": ["only if relevant"]
}
```

## Full prompt

The full XML-structured prompt (role, why_this_matters, input, how_to_respond,
guardrails, 3 examples, self_check) is maintained in
`src/lib/gm-copilot-prompt.server.ts`. Paste that file's `SYSTEM_PROMPT` string
into the model call. It is the single source of truth so the doc and the running
app never drift.

## Design highlights
- **Few-shot examples** are the highest-leverage technique per Anthropic's guide;
  one example deliberately shows the model *reframing* a gory player idea into an
  offscreen, age-appropriate trophy instead of refusing.
- **`design_notes`** gives the model a moment to reason and gives the GM
  transparency into *why* — answering the child-safety principle that AI tools
  should not be black boxes.
- **`clarifying_question`** and "could/might" phrasing operationalize
  human-in-the-loop: the tool hands the decision back to the table.
- **`dice_hook`** ties narrative suggestions to Quest Craft's real
  Strength/Wisdom/Charisma mechanic, so a suggestion is immediately playable.
- **Age band** drives reading level and emotional intensity, not just a blanket
  "8–14," reflecting developmental-appropriateness guidance.
