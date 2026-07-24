# Quest Craft — GM Co-Pilot

An AI assistant that helps a tabletop-RPG **Game Master** (often an educator
with zero RPG experience) respond when young players (ages 8–14) make an
**unexpected choice** during a live session.

Built for the Quest Craft AI Intern candidate exercise. **Live demo:** https://quest-craft-copilot-kaitchen.lovable.app

## What it does

Describe the moment → get back, in seconds:
- **2–3 story outcomes** in distinct tones (playful / mystery / high-stakes),
  each with a dice hook tied to Quest Craft's Strength/Wisdom/Charisma mechanic
- **Narration to read aloud**, with a delivery hint (voice, pace, pause)
- **A consequence that matters later** — accept it and it joins the Session Log,
  where one click weaves it back into a future scene
- **A clarifying question** to hand the decision back to the players

The interface uses a hand-drawn SVG icon set (no emoji, no icon library) and
optional synthesized sound — quiet UI blips and a soft ambient drone, both
off/muteable — so the console feels like a play tool without ever competing
with a live table.

Every suggestion has **Use this / Revise / Ignore** — the human GM always decides.

## Safety design (the core of it)

- **Two-layer safety:** generation under a guardrailed prompt, then an
  **independent child-safety review** of every output before it's shown — on all
  endpoints, failing safe when the review can't run. See `docs/SAFETY_PASS.md`.
- **Hostile-input hardening:** control/zero-width character stripping, length
  caps, rate limiting, server-side output schema validation. See `docs/SECURITY.md`.
- **45 security & robustness tests:** `npm test`.

## Repo map

| Path | What it is |
|---|---|
| `src/lib/gm-copilot-prompt.server.ts` | The generation system prompt (research-based; see `docs/PROMPT_RESEARCH.md`) |
| `src/lib/safety-review.server.ts` | Layer-2 child-safety reviewer (calibrated LLM-as-judge) |
| `src/lib/validate.server.ts` + `.test.mjs` | Input sanitization, output schema validation, test suite |
| `src/routes/api/` | Server-side endpoints: generate, revise, callback |
| `docs/` | Deliverables, design tradeoffs, security review, safety test cases |

## Run locally

```sh
npm i
npm run dev    # needs LOVABLE_API_KEY in env for AI calls
npm test       # security/robustness suite, no key needed
```

Built with TanStack Start, React, TypeScript, Tailwind. Scaffolded in Lovable,
developed in Cursor, synced via GitHub.
